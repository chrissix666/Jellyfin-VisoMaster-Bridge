using MediaBrowser.Model.Plugins;

namespace Jellyfin.Plugin.VisoMasterBridge.Configuration;

public class PluginConfiguration : BasePluginConfiguration
{
    public bool Enabled { get; set; } = true;

    public string VisoMasterPath { get; set; } = string.Empty;

    public string InputFacesFolder { get; set; } = string.Empty;

    public int WorkerPort { get; set; } = 8766;

    public int IdleMinutes { get; set; } = 15;

    public string InputFacesVisibleTo { get; set; } = "Everyone";

    public string ButtonPosition { get; set; } = "Favorite";

    public bool HideOnNarrowWindow { get; set; } = true;
}
