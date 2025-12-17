import { bind } from "astal"
import Weather from "../src/services/weather"
import LayoutService from "../src/LayoutService"
import { Gtk } from "astal/gtk3"

export default function WeatherWidget() {
  const weather = Weather.get_default()
  const layout = LayoutService.get_default()

  // Font size now handled by CssInjectionService via .WidgetPill label selector

  return <box className="WidgetPill" valign={Gtk.Align.FILL}>
    <icon icon={bind(weather, "icon")} />
    <label label={bind(weather, "temperature").as(t => ` ${t}°C`)} />
  </box>
}
