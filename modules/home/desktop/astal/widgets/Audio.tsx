import AstalWp from "gi://AstalWp?version=0.1"
import { bind } from "astal"
import LayoutService from "../src/LayoutService"
import { Gtk } from "astal/gtk3"

export default function Audio() {
  const wp = AstalWp.get_default()
  const speaker = wp?.audio?.defaultSpeaker
  const layout = LayoutService.get_default()

  // Use CSS Variable for font size
  // Font size now handled by CssInjectionService via .WidgetPill label selector

  return <box className="WidgetPill" valign={Gtk.Align.FILL}>
    {speaker ? (
      <eventbox
        onScroll={(_, event) => {
          if (event.delta_y < 0) speaker.volume = Math.min(1, speaker.volume + 0.05)
          else speaker.volume = Math.max(0, speaker.volume - 0.05)
        }}
        onClick={(_, event) => { if (event.button === 1) speaker.mute = !speaker.mute }}
      >
        <box className="AudioContent gap-1" valign={Gtk.Align.CENTER}>
          <icon icon={bind(speaker, "volumeIcon")} />
          <label label={bind(speaker, "volume").as(v => `${Math.floor(v * 100)}%`)} />
        </box>
      </eventbox>
    ) : (
      <icon icon="audio-volume-muted-symbolic" />
    )}
  </box>
}
