using System.Net.Mime;
using System.Reflection;
using System.Text.Json.Nodes;
using MediaBrowser.Controller.Entities;
using MediaBrowser.Controller.Library;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Jellyfin.Plugin.VisoMasterBridge.Api;

[ApiController]
[Route("VisoMasterBridge")]
public class VisoMasterBridgeController : ControllerBase
{
    private const string GenericWorkerError = "VisoMaster is not available right now.";

    private static readonly Lazy<byte[]?> Script = new(() =>
    {
        using Stream? s = Assembly.GetExecutingAssembly().GetManifestResourceStream("Jellyfin.Plugin.VisoMasterBridge.Web.script.js");
        if (s is null)
        {
            return null;
        }

        using var ms = new MemoryStream();
        s.CopyTo(ms);
        return ms.ToArray();
    });

    private readonly ILibraryManager _libraryManager;

    public VisoMasterBridgeController(ILibraryManager libraryManager)
    {
        _libraryManager = libraryManager;
    }

    private static bool Enabled => Plugin.Instance?.Configuration.Enabled ?? false;

    private bool IsAdmin => User.IsInRole("Administrator");

    private bool InputFacesAllowed => IsAdmin
        || !string.Equals(Plugin.Instance?.Configuration.InputFacesVisibleTo, "Administrators", StringComparison.OrdinalIgnoreCase);

    [HttpGet("script.js")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public ActionResult GetScript()
    {
        byte[]? b = Script.Value;
        if (b is null)
        {
            return NotFound();
        }

        string etag = "\"" + Plugin.ScriptVersionHash + "\"";
        Response.Headers.ETag = etag;
        Response.Headers["Cache-Control"] = "no-cache";
        if (Request.Headers.IfNoneMatch.ToString() == etag)
        {
            return StatusCode(StatusCodes.Status304NotModified);
        }

        return File(b, "application/javascript; charset=utf-8");
    }

    [HttpGet("ClientConfiguration")]
    [Authorize]
    [Produces(MediaTypeNames.Application.Json)]
    public ActionResult GetClientConfiguration()
    {
        Response.Headers["Cache-Control"] = "no-store";
        bool configured = !string.IsNullOrWhiteSpace(Plugin.Instance?.Configuration.VisoMasterPath);
        string position = Plugin.Instance?.Configuration.ButtonPosition ?? "Favorite";
        bool hideOnNarrow = Plugin.Instance?.Configuration.HideOnNarrowWindow ?? true;
        return new JsonResult(new { enabled = Enabled, configured, inputFaces = InputFacesAllowed, buttonPosition = position, hideOnNarrow });
    }

    [HttpGet("Status")]
    [Authorize]
    [Produces(MediaTypeNames.Application.Json)]
    public async Task<ActionResult> GetStatus()
    {
        Response.Headers["Cache-Control"] = "no-store";
        var worker = Worker.Instance;
        if (!Enabled)
        {
            return new JsonResult(new { running = false, ready = false, message = "switched off" });
        }

        if (string.IsNullOrWhiteSpace(Plugin.Instance?.Configuration.VisoMasterPath))
        {
            return new JsonResult(new { running = false, ready = false, message = "not set up (VisoMaster Path is empty)" });
        }

        if (!worker.Running)
        {
            string msg = string.IsNullOrEmpty(worker.LastError) ? "stopped (starts on Connect)" : (IsAdmin ? worker.LastError : GenericWorkerError);
            return new JsonResult(new { running = false, ready = false, message = msg });
        }

        try
        {
            using var r = await worker.SendAsync(HttpMethod.Get, "/health", null, HttpContext.RequestAborted, counts: false).ConfigureAwait(false);
            JsonNode? health = null;
            try
            {
                health = JsonNode.Parse(await r.Content.ReadAsStringAsync(HttpContext.RequestAborted).ConfigureAwait(false));
            }
            catch (System.Text.Json.JsonException)
            {
            }

            bool ready = Bool(health?["ready"]);
            string err = Str(health?["error"]);
            string msg = ready ? "running" : (err.Length > 0 ? (IsAdmin ? "error: " + err : GenericWorkerError) : "loading VisoMaster");
            return new JsonResult(new { running = true, ready, message = msg });
        }
        catch (HttpRequestException)
        {
            return new JsonResult(new { running = true, ready = false, message = "starting" });
        }
    }

    [HttpPost("FindFaces")]
    [Authorize]
    public Task<ActionResult> FindFaces([FromBody] JsonObject body) => ForwardWithPath("/find_faces", body);

    [HttpPost("Swap/Start")]
    [Authorize]
    public Task<ActionResult> SwapStart([FromBody] JsonObject body) => ForwardWithPath("/swap/start", body);

    [HttpPost("Swap/Stop")]
    [Authorize]
    public Task<ActionResult> SwapStop([FromBody] JsonObject body) => Forward("/swap/stop", body);

    [HttpPost("Swap/Status")]
    [Authorize]
    public Task<ActionResult> SwapStatus([FromBody] JsonObject body)
        => Worker.Instance.Running
            ? Forward("/status", body, counts: true)
            : Task.FromResult<ActionResult>(new JsonResult(new { running = false }));

    [HttpPost("ClearFaces")]
    [Authorize]
    public Task<ActionResult> ClearFaces([FromBody] JsonObject body) => Forward("/clear", body);

    [HttpPost("RemoveFace")]
    [Authorize]
    public Task<ActionResult> RemoveFace([FromBody] JsonObject body) => Forward("/remove_face", body);

    [HttpPost("Faces")]
    [Authorize]
    public Task<ActionResult> Faces([FromBody] JsonObject body)
        => Worker.Instance.Running
            ? Forward("/faces", body, counts: false)
            : Task.FromResult<ActionResult>(new JsonResult(new { faces = Array.Empty<object>(), preset = string.Empty }));

    [HttpPost("InputFaces")]
    [Authorize]
    public Task<ActionResult> InputFaces([FromBody] JsonObject body)
        => InputFacesAllowed ? Forward("/input_faces", body) : Task.FromResult<ActionResult>(Forbidden());

    [HttpPost("Assign")]
    [Authorize]
    public Task<ActionResult> Assign([FromBody] JsonObject body)
        => InputFacesAllowed ? Forward("/assign", body) : Task.FromResult<ActionResult>(Forbidden());

    [HttpPost("Connect")]
    [Authorize]
    public async Task<ActionResult> Connect([FromBody] JsonObject body)
    {
        Response.Headers["Cache-Control"] = "no-store";
        if (!Enabled)
        {
            return new ObjectResult(new { error = "VisoMaster is switched off." }) { StatusCode = StatusCodes.Status403Forbidden };
        }

        if (Bool(body["join"]) && !Worker.Instance.Running)
        {
            return new JsonResult(new { notRunning = true });
        }

        string? err = await Worker.Instance.EnsureRunningAsync(HttpContext.RequestAborted).ConfigureAwait(false);
        if (err is not null)
        {
            return Problem503(err);
        }

        if (!await IsReadyAsync().ConfigureAwait(false))
        {
            return new JsonResult(new { starting = true });
        }

        return await Forward("/connect", body).ConfigureAwait(false);
    }

    private async Task<bool> IsReadyAsync()
    {
        try
        {
            using var r = await Worker.Instance.SendAsync(HttpMethod.Get, "/health", null, HttpContext.RequestAborted, counts: false).ConfigureAwait(false);
            var h = JsonNode.Parse(await r.Content.ReadAsStringAsync(HttpContext.RequestAborted).ConfigureAwait(false));
            return Bool(h?["ready"]);
        }
        catch (Exception ex) when (ex is HttpRequestException or System.Text.Json.JsonException)
        {
            return false;
        }
    }

    [HttpPost("Disconnect")]
    [Authorize]
    public async Task<ActionResult> Disconnect([FromBody] JsonObject body)
    {
        Response.Headers["Cache-Control"] = "no-store";
        var worker = Worker.Instance;
        if (!worker.Running)
        {
            return new JsonResult(new { connected = 0, stopped = false });
        }

        if (!ScopeSession(body))
        {
            return BadRequest(new { error = "No player session." });
        }

        int connected = -1;
        try
        {
            using var r = await worker.SendAsync(HttpMethod.Post, "/disconnect", body.ToJsonString(), HttpContext.RequestAborted, counts: false).ConfigureAwait(false);
            var j = JsonNode.Parse(await r.Content.ReadAsStringAsync(HttpContext.RequestAborted).ConfigureAwait(false));
            if (j?["connected"] is JsonValue c && c.TryGetValue(out int n))
            {
                connected = n;
            }
        }
        catch (Exception ex) when (ex is HttpRequestException or System.Text.Json.JsonException)
        {
        }

        bool stop = IsAdmin || connected == 0;
        if (stop)
        {
            worker.Stop("disconnect");
        }

        return new JsonResult(new { connected = stop ? 0 : connected, stopped = stop });
    }
    [HttpPost("Presets")]
    [Authorize]
    public Task<ActionResult> Presets([FromBody] JsonObject body) => Forward("/presets", body);

    [HttpPost("Preset")]
    [Authorize]
    public Task<ActionResult> Preset([FromBody] JsonObject body) => Forward("/preset", body);

    [HttpGet("Thumb/{id}")]
    [Authorize]
    public async Task<ActionResult> Thumb([FromRoute] string id)
    {
        if (!System.Text.RegularExpressions.Regex.IsMatch(id, "^[0-9a-f]{16}$") || !InputFacesAllowed || !Enabled)
        {
            return NotFound();
        }

        if (!Worker.Instance.Running)
        {
            return NotFound();
        }

        try
        {
            using var r = await Worker.Instance.SendAsync(HttpMethod.Get, "/thumb/" + id, null, HttpContext.RequestAborted).ConfigureAwait(false);
            if (!r.IsSuccessStatusCode)
            {
                return NotFound();
            }

            Response.Headers["Cache-Control"] = "private, max-age=3600";
            return File(await r.Content.ReadAsByteArrayAsync(HttpContext.RequestAborted).ConfigureAwait(false), "image/jpeg");
        }
        catch (HttpRequestException)
        {
            return Problem503(GenericWorkerError);
        }
    }

    [HttpGet("Stream/{id}")]
    [Authorize]
    public async Task Stream([FromRoute] string id)
    {
        if (!System.Text.RegularExpressions.Regex.IsMatch(id, "^[0-9a-f]{32}$") || !Enabled)
        {
            Response.StatusCode = StatusCodes.Status404NotFound;
            return;
        }

        var worker = Worker.Instance;
        CancellationToken ct = HttpContext.RequestAborted;
        if (!worker.Running)
        {
            Response.StatusCode = StatusCodes.Status503ServiceUnavailable;
            return;
        }

        try
        {
            using var r = await worker.SendAsync(HttpMethod.Get, "/stream/" + id, null, ct, streaming: true).ConfigureAwait(false);
            Response.StatusCode = (int)r.StatusCode;
            Response.Headers["Cache-Control"] = "no-store";
            if (!r.IsSuccessStatusCode)
            {
                return;
            }

            Response.ContentType = "video/mp4";
            await using var src = await r.Content.ReadAsStreamAsync(ct).ConfigureAwait(false);
            byte[] buffer = new byte[64 * 1024];
            int n;
            while ((n = await src.ReadAsync(buffer, ct).ConfigureAwait(false)) > 0)
            {
                await Response.Body.WriteAsync(buffer.AsMemory(0, n), ct).ConfigureAwait(false);
                worker.Touch();
            }
        }
        catch (OperationCanceledException)
        {
        }
        catch (IOException)
        {
        }
        catch (HttpRequestException)
        {
            if (!Response.HasStarted)
            {
                Response.StatusCode = StatusCodes.Status503ServiceUnavailable;
            }
        }
    }

    private async Task<ActionResult> ForwardWithPath(string workerPath, JsonObject body)
    {
        if (!Guid.TryParse(User.FindFirst("Jellyfin-UserId")?.Value, out Guid userId))
        {
            return Forbid();
        }

        BaseItem? item = null;
        foreach (string key in new[] { "mediaSourceId", "itemId" })
        {
            if (item is null && Guid.TryParse(Str(body[key]), out Guid guid))
            {
                var candidate = _libraryManager.GetItemById<BaseItem>(guid, userId);
                if (candidate is not null && !string.IsNullOrEmpty(candidate.Path) && System.IO.File.Exists(candidate.Path))
                {
                    item = candidate;
                }
            }
        }

        if (item is null)
        {
            return BadRequest(new { error = "This video is not available for VisoMaster." });
        }

        body.Remove("itemId");
        body.Remove("mediaSourceId");
        body["path"] = item.Path;
        return await Forward(workerPath, body).ConfigureAwait(false);
    }

    private bool ScopeSession(JsonObject body)
    {
        string user = User.FindFirst("Jellyfin-UserId")?.Value?.Replace("-", string.Empty, StringComparison.Ordinal) ?? string.Empty;
        string sid = Str(body["session"]);
        if (user.Length == 0 || !System.Text.RegularExpressions.Regex.IsMatch(sid, "^[0-9a-zA-Z_-]{8,30}$"))
        {
            return false;
        }

        body["session"] = user + ":" + sid;
        string prev = Str(body["previous"]);
        body["previous"] = System.Text.RegularExpressions.Regex.IsMatch(prev, "^[0-9a-zA-Z_-]{8,30}$") ? user + ":" + prev : null;
        return true;
    }

    private async Task<ActionResult> Forward(string workerPath, JsonObject body, bool counts = true)
    {
        Response.Headers["Cache-Control"] = "no-store";
        if (!ScopeSession(body))
        {
            return BadRequest(new { error = "No player session." });
        }

        if (!Enabled)
        {
            return new ObjectResult(new { error = "VisoMaster is switched off." }) { StatusCode = StatusCodes.Status403Forbidden };
        }

        if (!Worker.Instance.Running)
        {
            return new ObjectResult(new { error = "VisoMaster is not connected.", notConnected = true }) { StatusCode = StatusCodes.Status409Conflict };
        }

        if (counts)
        {
            Worker.Instance.Touch();
        }

        try
        {
            using var r = await Worker.Instance.SendAsync(HttpMethod.Post, workerPath, body.ToJsonString(), HttpContext.RequestAborted, counts: counts).ConfigureAwait(false);
            string text = await r.Content.ReadAsStringAsync(HttpContext.RequestAborted).ConfigureAwait(false);
            if (!IsAdmin && (int)r.StatusCode >= 400)
            {
                return (int)r.StatusCode < 500
                    ? new ObjectResult(new { error = "VisoMaster could not do that here." }) { StatusCode = (int)r.StatusCode }
                    : Problem503(GenericWorkerError);
            }

            if (!IsAdmin && workerPath == "/status")
            {
                text = SanitizeStatus(text);
            }

            return new ContentResult { StatusCode = (int)r.StatusCode, Content = text, ContentType = "application/json" };
        }
        catch (HttpRequestException)
        {
            return Problem503(GenericWorkerError);
        }
    }

    private static string SanitizeStatus(string text)
    {
        try
        {
            if (JsonNode.Parse(text) is not JsonObject o)
            {
                return text;
            }

            string err = o["error"]?.GetValue<string>() ?? string.Empty;
            if (err.Length > 0 && !err.StartsWith("The film could not be read at", StringComparison.Ordinal))
            {
                o["error"] = "The swapped picture stopped.";
            }

            if (o["speed"] is JsonObject speed)
            {
                foreach (string key in new[] { "streams", "workers", "vramMB", "reservedMB", "freeMB" })
                {
                    speed.Remove(key);
                }
            }

            return o.ToJsonString();
        }
        catch (Exception e) when (e is System.Text.Json.JsonException or InvalidOperationException)
        {
            return text;
        }
    }

    private ObjectResult Problem503(string message)
        => new(new { error = IsAdmin ? message : GenericWorkerError }) { StatusCode = StatusCodes.Status503ServiceUnavailable };

    private static ObjectResult Forbidden()
        => new(new { error = "Input faces are for administrators only." }) { StatusCode = StatusCodes.Status403Forbidden };

    private static string Str(JsonNode? node)
        => node is JsonValue v && v.TryGetValue(out string? s) ? s ?? string.Empty : string.Empty;

    private static bool Bool(JsonNode? node)
        => node is JsonValue v && v.TryGetValue(out bool b) && b;
}
