import { bind } from "astal"
import Usage from "../src/services/usage"
import LayoutService from "../src/LayoutService"
import { Gtk } from "astal/gtk3"

export default function ResourceUsage() {
   const usage = Usage.get_default()
   const layout = LayoutService.get_default()

   // Font size now handled by CssInjectionService via .WidgetPill label selector

   const cpuClass = bind(usage, "cpuUsage").as(v => v > 0.8 ? "urgent" : "accent");
   const tempClass = bind(usage, "temperature").as(t => t > 80 ? "urgent" : "accent");
   const memClass = bind(usage, "memory").as(m => (m.used / m.total) > 0.8 ? "urgent" : "accent");

   return (
      <box className="WidgetPill ResourceUsage gap-1" valign={Gtk.Align.FILL}>
         <box className="Cpu gap-half">
            <icon icon="computer-symbolic" />
            <label
               className={cpuClass}
               widthRequest={35}
               halign={Gtk.Align.START}
               label={bind(usage, "cpuUsage").as(v => `${Math.floor(v * 100)}%`)}
            />
         </box>
         <box className="Temp gap-half">
            <icon icon="temperature-symbolic" />
            <label
               className={tempClass}
               widthRequest={35}
               halign={Gtk.Align.START}
               label={bind(usage, "temperature").as(t => `${Math.round(t)}°`)}
            />
         </box>
         <box className="Mem gap-half">
            <icon icon="drive-harddisk-symbolic" />
            <label
               className={memClass}
               widthRequest={45}
               halign={Gtk.Align.START}
               label={bind(usage, "memory").as(m => `${(m.used / 1073741824).toFixed(1)}G`)}
            />
         </box>
      </box>
   )
}
