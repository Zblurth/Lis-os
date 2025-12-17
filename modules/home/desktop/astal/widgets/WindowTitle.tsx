import { bind, Variable } from "astal";
import Niri from "../src/services/niri";
import ConfigAdapter from "../src/ConfigAdapter";
import LayoutService from "../src/LayoutService";
import { Gtk } from "astal/gtk3";

export default function WindowTitle() {
  const niri = Niri.get_default();
  const config = bind(ConfigAdapter.get().adapter);

  const maxChars = config.as(c => c.limits?.windowTitle ?? 40);

  // Font size now handled by CssInjectionService via .WidgetPill label selector

  return (
    <box className="WidgetPill" valign={Gtk.Align.FILL}>
      <label
        className="WindowTitle"
        label={bind(niri, "focusedWindow").as((w) => w ? (w.title || w.app_id) : "Desktop")}
        truncate
        maxWidthChars={maxChars}
      />
    </box>
  );
}
