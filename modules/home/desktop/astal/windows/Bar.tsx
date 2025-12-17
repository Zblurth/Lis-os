// Bar.tsx
import { App, Astal, Gtk } from "astal/gtk3";
import { bind } from "astal";
import LayoutService from "../src/LayoutService";
import WIDGET_MAP, { WidgetId } from "../src/registry";
import ConfigAdapter from "../src/ConfigAdapter";

export default function Bar(monitor: Gdk.Monitor) {
  const { TOP, LEFT, RIGHT } = Astal.WindowAnchor;
  const layout = LayoutService.get_default();
  const config = bind(ConfigAdapter.get().adapter);

  const renderSection = (sectionName: "left" | "center" | "right") => {
    // Access safe binding (fallback handled in Adapter)
    return config.as(c => c.layout.bar[sectionName]).as(ids => {
      print(`[Bar] Updating section ${sectionName} with ${ids.length} widgets: ${ids.join(", ")}`);
      return ids.map(id => {
        // Cast id to WidgetId because config ids are strings but we know they map to widgets
        const Component = WIDGET_MAP[id as WidgetId];
        if (!Component) {
          print(`[Bar] Warning: Widget '${id}' not found in registry.`);
          return null;
        }
        // Pass monitor as standard prop 'monitor' to all widgets
        // Ensure uniqueness if needed by adding key, though GJS handles it usually
        return <Component monitor={monitor} />;
      })
    });
  };

  return (
    <window
      name="bar"
      className="Bar"
      gdkmonitor={monitor}
      exclusivity={Astal.Exclusivity.EXCLUSIVE}
      anchor={TOP | LEFT | RIGHT}
      application={App}
      heightRequest={layout.barHeight}
      marginTop={config.as(c => c.layout.bar.marginTop ?? 0)}
      marginBottom={config.as(c => c.layout.bar.marginBottom ?? 0)}
    >
      <centerbox className="BarContent">
        <box className="Left" halign={Gtk.Align.START}>
          {renderSection("left")}
        </box>

        <box className="Center" halign={Gtk.Align.CENTER}>
          {renderSection("center")}
        </box>

        <box className="Right" halign={Gtk.Align.END}>
          {renderSection("right")}
        </box>
      </centerbox>
    </window>
  );
}
