using System.Diagnostics;
using System.Net.Http.Headers;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Text;

namespace Jellyfin.Plugin.VisoMasterBridge;

public sealed class Worker : IDisposable
{
    private const long LogRollBytes = 5L * 1024 * 1024;

    private static readonly Lazy<Worker> Lazy = new(() => new Worker());

    private readonly SemaphoreSlim _lock = new(1, 1);
    private readonly HttpClient _http = new() { Timeout = Timeout.InfiniteTimeSpan };
    private readonly string _token = Convert.ToHexString(RandomNumberGenerator.GetBytes(24));
    private readonly Timer _idleTimer;
    private readonly IntPtr _job;
    private Process? _process;
    private LogSink? _log;
    private volatile bool _ready;
    private int _port;
    private long _lastUseTicks = DateTime.UtcNow.Ticks;
    private string _lastError = string.Empty;

    private Worker()
    {
        _job = JobObject.Create();
        _idleTimer = new Timer(_ => CheckIdle(), null, TimeSpan.FromMinutes(1), TimeSpan.FromMinutes(1));
        AppDomain.CurrentDomain.ProcessExit += (_, _) => Stop("server exit");
    }

    public static Worker Instance => Lazy.Value;

    public bool Running
    {
        get
        {
            try
            {
                return _process is { HasExited: false };
            }
            catch (InvalidOperationException)
            {
                return false;
            }
        }
    }

    public string LastError => _lastError;

    public void Touch() => Interlocked.Exchange(ref _lastUseTicks, DateTime.UtcNow.Ticks);

    public async Task<string?> EnsureRunningAsync(CancellationToken ct, bool counts = true)
    {
        if (counts)
        {
            Touch();
        }

        if (_ready && Running)
        {
            return null;
        }

        await _lock.WaitAsync(ct).ConfigureAwait(false);
        try
        {
            if (_ready && Running)
            {
                return null;
            }

            StopLocked();
            return await StartLockedAsync(ct).ConfigureAwait(false);
        }
        finally
        {
            _lock.Release();
        }
    }

    private async Task<string?> StartLockedAsync(CancellationToken ct)
    {
        var config = Plugin.Instance?.Configuration;
        string root = config?.VisoMasterPath?.Trim() ?? string.Empty;
        if (root.Length == 0)
        {
            return _lastError = "The VisoMaster path is not set (Dashboard > Plugins > VisoMaster).";
        }

        string python = Path.Combine(root, "portable-files", "python", "python.exe");
        string script = Path.Combine(Plugin.PluginDirectory, "worker", "visomaster_worker.py");
        if (!File.Exists(python))
        {
            return _lastError = "VisoMaster's Python was not found: " + python;
        }

        if (!File.Exists(script))
        {
            return _lastError = "The worker script is missing: " + script;
        }

        string work = Plugin.Instance!.WorkPath;
        string logFile = Path.Combine(work, "worker.log");
        Process? p = null;
        try
        {
            Directory.CreateDirectory(work);
            _port = config!.WorkerPort is >= 1024 and <= 65535 ? config.WorkerPort : 8766;

            var psi = new ProcessStartInfo(python)
            {
                UseShellExecute = false,
                CreateNoWindow = true,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                WorkingDirectory = work,
            };
            foreach (string a in new[] { "-B", "-X", "utf8", script, "--root", root, "--port", _port.ToString(System.Globalization.CultureInfo.InvariantCulture),
                "--work", work, "--parent-pid", Environment.ProcessId.ToString(System.Globalization.CultureInfo.InvariantCulture) })
            {
                psi.ArgumentList.Add(a);
            }

            string inputFolder = config.InputFacesFolder?.Trim() ?? string.Empty;
            if (inputFolder.Length > 0)
            {
                psi.ArgumentList.Add("--input-folder");
                psi.ArgumentList.Add(inputFolder);
            }

            psi.Environment["VM_TOKEN"] = _token;
            psi.Environment["PYTHONUTF8"] = "1";
            psi.Environment["PYTHONUNBUFFERED"] = "1";
            psi.Environment.Remove("PYTHONHOME");
            psi.Environment.Remove("PYTHONPATH");
            string portable = Path.Combine(root, "portable-files");
            string? ffmpegBin = Directory.Exists(portable)
                ? Directory.GetDirectories(portable, "ffmpeg*").Select(d => Path.Combine(d, "bin")).FirstOrDefault(Directory.Exists)
                : null;
            string path = Environment.GetEnvironmentVariable("PATH") ?? string.Empty;
            psi.Environment["PATH"] = (ffmpegBin is null ? string.Empty : ffmpegBin + ";") + Path.GetDirectoryName(python) + ";" + path;

            _log = new LogSink(logFile);
            var log = _log;
            p = new Process { StartInfo = psi, EnableRaisingEvents = true };
            p.OutputDataReceived += (_, e) => log.Write(e.Data);
            p.ErrorDataReceived += (_, e) => log.Write(e.Data);
            var started = p;
            p.Exited += (_, _) =>
            {
                if (ReferenceEquals(_process, started))
                {
                    _ready = false;
                }

                log.Write("[worker exited]");
            };
            log.Write("---- start " + DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss", System.Globalization.CultureInfo.InvariantCulture) + " port " + _port);
            p.Start();
            if (!JobObject.Assign(_job, p))
            {
                log.Write("[warning] job object not available (error " + Marshal.GetLastWin32Error() + ") - the worker may outlive a crashed Jellyfin; its own parent check still ends it");
            }
            p.BeginOutputReadLine();
            p.BeginErrorReadLine();
            _process = p;
        }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException or System.ComponentModel.Win32Exception or InvalidOperationException)
        {
            _log?.Dispose();
            _log = null;
            p?.Dispose();
            return _lastError = "The worker could not be started: " + ex.Message;
        }

        for (int i = 0; i < 60; i++)
        {
            if (p.HasExited)
            {
                return _lastError = "The worker stopped right after its start (is port " + _port + " in use?) - see " + logFile;
            }

            try
            {
                using var r = await SendAsync(HttpMethod.Get, "/health", null, ct, counts: false).ConfigureAwait(false);
                if (r.IsSuccessStatusCode)
                {
                    _ready = true;
                    _lastError = string.Empty;
                    return null;
                }
            }
            catch (HttpRequestException)
            {
            }

            await Task.Delay(500, ct).ConfigureAwait(false);
        }

        StopLocked();
        return _lastError = "The worker did not answer - see " + logFile;
    }

    public Task<HttpResponseMessage> SendAsync(HttpMethod method, string path, string? json, CancellationToken ct, bool streaming = false, bool counts = true)
    {
        if (counts)
        {
            Touch();
        }

        var req = new HttpRequestMessage(method, "http://127.0.0.1:" + _port.ToString(System.Globalization.CultureInfo.InvariantCulture) + path);
        req.Headers.Add("X-VM-Token", _token);
        if (json is not null)
        {
            req.Content = new StringContent(json, Encoding.UTF8);
            req.Content.Headers.ContentType = new MediaTypeHeaderValue("application/json");
        }

        return _http.SendAsync(req, streaming ? HttpCompletionOption.ResponseHeadersRead : HttpCompletionOption.ResponseContentRead, ct);
    }

    public void Stop(string reason)
    {
        bool locked = _lock.Wait(TimeSpan.FromSeconds(10));
        try
        {
            _log?.Write("[stop: " + reason + "]");
            StopLocked();
        }
        finally
        {
            if (locked)
            {
                _lock.Release();
            }
        }
    }

    private void StopLocked()
    {
        _ready = false;
        var p = _process;
        _process = null;
        if (p is not null)
        {
            try
            {
                if (!p.HasExited)
                {
                    p.Kill(entireProcessTree: true);
                    p.WaitForExit(5000);
                }
            }
            catch (InvalidOperationException)
            {
            }
            catch (System.ComponentModel.Win32Exception)
            {
            }

            p.Dispose();
        }

        _log?.Dispose();
        _log = null;
    }

    private void CheckIdle()
    {
        int minutes = Math.Max(1, Plugin.Instance?.Configuration.IdleMinutes ?? 15);
        var idle = DateTime.UtcNow - new DateTime(Interlocked.Read(ref _lastUseTicks), DateTimeKind.Utc);
        if (Running && idle > TimeSpan.FromMinutes(minutes))
        {
            Stop("idle " + (int)idle.TotalMinutes + " min");
        }
    }

    public void Dispose()
    {
        Stop("dispose");
        _idleTimer.Dispose();
        _http.Dispose();
        _lock.Dispose();
        JobObject.Close(_job);
    }

    private sealed class LogSink : IDisposable
    {
        private readonly object _gate = new();
        private StreamWriter? _writer;

        public LogSink(string file)
        {
            try
            {
                var fi = new FileInfo(file);
                if (fi.Exists && fi.Length > LogRollBytes)
                {
                    File.Move(file, file + ".1", overwrite: true);
                }
            }
            catch (IOException)
            {
            }

            _writer = new StreamWriter(new FileStream(file, FileMode.Append, FileAccess.Write, FileShare.ReadWrite), Encoding.UTF8) { AutoFlush = true };
        }

        public void Write(string? line)
        {
            if (line is null)
            {
                return;
            }

            lock (_gate)
            {
                try
                {
                    _writer?.WriteLine(line);
                }
                catch (Exception ex) when (ex is IOException or ObjectDisposedException)
                {
                }
            }
        }

        public void Dispose()
        {
            lock (_gate)
            {
                _writer?.Dispose();
                _writer = null;
            }
        }
    }

    private static class JobObject
    {
        private const int JobObjectExtendedLimitInformation = 9;
        private const uint JobObjectLimitKillOnJobClose = 0x2000;

        public static IntPtr Create()
        {
            if (!OperatingSystem.IsWindows())
            {
                return IntPtr.Zero;
            }

            IntPtr job = CreateJobObject(IntPtr.Zero, null);
            if (job == IntPtr.Zero)
            {
                return IntPtr.Zero;
            }

            var info = new JOBOBJECT_EXTENDED_LIMIT_INFORMATION();
            info.BasicLimitInformation.LimitFlags = JobObjectLimitKillOnJobClose;
            int size = Marshal.SizeOf<JOBOBJECT_EXTENDED_LIMIT_INFORMATION>();
            IntPtr ptr = Marshal.AllocHGlobal(size);
            try
            {
                Marshal.StructureToPtr(info, ptr, false);
                SetInformationJobObject(job, JobObjectExtendedLimitInformation, ptr, (uint)size);
            }
            finally
            {
                Marshal.FreeHGlobal(ptr);
            }

            return job;
        }

        public static bool Assign(IntPtr job, Process p)
        {
            if (job == IntPtr.Zero || !OperatingSystem.IsWindows())
            {
                return false;
            }

            return AssignProcessToJobObject(job, p.Handle);
        }

        public static void Close(IntPtr job)
        {
            if (job != IntPtr.Zero && OperatingSystem.IsWindows())
            {
                CloseHandle(job);
            }
        }

        [DllImport("kernel32.dll", CharSet = CharSet.Unicode)]
        private static extern IntPtr CreateJobObject(IntPtr attributes, string? name);

        [DllImport("kernel32.dll")]
        private static extern bool SetInformationJobObject(IntPtr job, int infoClass, IntPtr info, uint length);

        [DllImport("kernel32.dll", SetLastError = true)]
        private static extern bool AssignProcessToJobObject(IntPtr job, IntPtr process);

        [DllImport("kernel32.dll")]
        private static extern bool CloseHandle(IntPtr handle);

        [StructLayout(LayoutKind.Sequential)]
        private struct JOBOBJECT_BASIC_LIMIT_INFORMATION
        {
            public long PerProcessUserTimeLimit;
            public long PerJobUserTimeLimit;
            public uint LimitFlags;
            public UIntPtr MinimumWorkingSetSize;
            public UIntPtr MaximumWorkingSetSize;
            public uint ActiveProcessLimit;
            public UIntPtr Affinity;
            public uint PriorityClass;
            public uint SchedulingClass;
        }

        [StructLayout(LayoutKind.Sequential)]
        private struct IO_COUNTERS
        {
            public ulong ReadOperationCount;
            public ulong WriteOperationCount;
            public ulong OtherOperationCount;
            public ulong ReadTransferCount;
            public ulong WriteTransferCount;
            public ulong OtherTransferCount;
        }

        [StructLayout(LayoutKind.Sequential)]
        private struct JOBOBJECT_EXTENDED_LIMIT_INFORMATION
        {
            public JOBOBJECT_BASIC_LIMIT_INFORMATION BasicLimitInformation;
            public IO_COUNTERS IoInfo;
            public UIntPtr ProcessMemoryLimit;
            public UIntPtr JobMemoryLimit;
            public UIntPtr PeakProcessMemoryUsed;
            public UIntPtr PeakJobMemoryUsed;
        }
    }
}
