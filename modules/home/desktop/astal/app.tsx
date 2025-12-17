import { App, Gdk, Gtk } from "astal/gtk3";
import { monitorFile, readFileAsync, writeFileAsync } from "astal/file";
import { GLib, Gio } from "astal";
import Bar from "./windows/Bar";
import Niri from "./src/services/niri";
import "./src/services/IconService";

// Service & Registry Imports
import ConfigAdapter from "./src/ConfigAdapter";
import LayoutService from "./src/LayoutService";
import NotificationService from "./src/services/NotificationService";
import CssInjectionService from "./src/services/CssInjectionService";

// Widget Imports for Registry
// (Auto-generated in src/registry.ts)

// --- PATH DEFINITIONS ---
const SCRIPT_DIR = GLib.path_get_dirname(
  import.meta.url.replace("file://", ""),
);
const GTK_CSS_PATH = `${GLib.get_home_dir()}/.cache/wal/ags-colors.css`;
const SIGNAL_FILE = `${GLib.get_home_dir()}/.cache/theme-engine/signal`;
const MAIN_CSS_PATH = `${SCRIPT_DIR}/style/main.css`;
const TMP_STYLE_PATH = "/tmp/astal-style.css";
const LOADER_CSS_PATH = "/tmp/astal-loader.css";

// --- CSS LOADER LOGIC ---
// We create a "meta" CSS file that imports both the colors and the styles.
// This forces GTK to parse them in the same context, resolving variables correctly.
const generateLoader = () => {
  try {
    // 1. Create the loader file content
    // Note: We use file:// URIs for robustness. 
    // We import MAIN_CSS_PATH directly so relative imports inside it (like @import "bar.css") 
    // resolve relative to the original file in the store/directory.
    const content = `
@import url("file://${GTK_CSS_PATH}");
@import url("file://${MAIN_CSS_PATH}");
`;
    // 2. Write it synchronously to ensure it's ready
    GLib.file_set_contents(LOADER_CSS_PATH, content);
    return true;
  } catch (e) {
    print(`[App] CRITICAL: Failed to generate CSS loader: ${e}`);
    return false;
  }
};

try {
  // Generate the loader before starting
  if (!generateLoader()) App.quit();

  const niri = Niri.get_default();

  App.start({
    instanceName: "com.lis.bar",
    // We load the Unified Loader file.
    css: LOADER_CSS_PATH,

    main() {
      // We still need to handle hot-reloading manually because App.start's css prop
      // only handles the initial load for the main window, but we want to ensure
      // global context updates.

      // Janitor: Clean up cached media art older than 1 day
      const cacheDir = `${GLib.get_home_dir()}/.cache/astal/mpris`; // UPDATE THIS PATH
      GLib.spawn_command_line_async(
        `find ${cacheDir} -type f -mtime +1 -delete`,
      );

      // --- PHASE 3: INITIALIZE SERVICES ---
      ConfigAdapter.get();
      CssInjectionService.get();
      LayoutService.get_default();
      NotificationService.get_default();



      const screen = Gdk.Screen.get_default()!;
      // Use a custom provider for hot-reload updates
      const cssProvider = new Gtk.CssProvider();

      const applyCss = () => {
        // Regenerate to catch any changes in the underlying files
        generateLoader();
        try {
          cssProvider.load_from_path(LOADER_CSS_PATH);
          // Force reset to apply new colors
          Gtk.StyleContext.reset_widgets(screen);
          print(`[App] Theme reloaded via Unified Loader.`);
        } catch (e) {
          print(`[App] CSS Load Error: ${e}`);
        }
      };

      // Add the provider once.
      // Note: App.start adds one by default for the 'css' prop, but we add this
      // for our manual control during hot-reload.
      Gtk.StyleContext.add_provider_for_screen(
        screen,
        cssProvider,
        Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION + 100,
      );

      // Watch for Signals
      monitorFile(SIGNAL_FILE, () => {
        print("[App] Reload signal received.");
        applyCss();
      });

      // Expose Toggle Action for CLI
      const toggleAction = new Gio.SimpleAction({
        name: "toggle-window",
        parameter_type: new GLib.VariantType("s"),
      });
      toggleAction.connect("activate", (_, param) => {
        if (param) {
          const winName = param.unpack() as string;
          App.toggle_window(winName);
        }
      });
      App.add_action(toggleAction);

      // Render Windows
      const bars = new Map<Gdk.Monitor, Gtk.Widget>();
      const renderBars = () => {
        for (const w of bars.values()) w.destroy();
        bars.clear();
        for (const m of App.get_monitors()) bars.set(m, Bar(m));
      };

      renderBars();
      // NOTE: Dashboard, Launcher, Clipboard removed - will be rebuilt with V5 compliance

      App.connect("monitor-added", (_, m) => bars.set(m, Bar(m)));
      App.connect("monitor-removed", (_, m) => {
        bars.get(m)?.destroy();
        bars.delete(m);
      });
    },
  });
} catch (e) {
  print(`CRITICAL ERROR in app.tsx: ${e}`);
  App.quit();
}
