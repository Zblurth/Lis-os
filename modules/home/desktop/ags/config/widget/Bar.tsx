import App from "astal/gtk3/app";
import { Astal, Gtk, Gdk } from "astal/gtk3";
import { bind } from "astal";
import Niri from "../service/niri";

function Workspaces() {
  const niri = Niri.default;

  return (
    <box className="Workspaces">
      {bind(niri, "workspaces").as((ws) =>
        ws.map((w: any) => (
          <button
            className={bind(niri, "focusedWorkspaceId").as((id) =>
              id === w.id ? "focused" : "",
            )}
            onClicked={() => niri.focusWorkspace(w.idx)} // or w.name
          >
            <label label={w.name || w.idx.toString()} />
          </button>
        )),
      )}
    </box>
  );
}

function Time() {
  return (
    <label
      className="Time"
      label={GLib.DateTime.new_now_local().format("%H:%M")!}
    />
  );
}

export default function Bar(monitor: Gdk.Monitor) {
  return (
    <window
      className="Bar"
      gdkmonitor={monitor}
      exclusivity={Astal.Exclusivity.EXCLUSIVE}
      anchor={
        Astal.WindowAnchor.BOTTOM |
        Astal.WindowAnchor.LEFT |
        Astal.WindowAnchor.RIGHT
      }
      application={App}
    >
      <centerbox>
        <box hexpand halign={Gtk.Align.START}>
          <Workspaces />
        </box>
        <box></box>
        <box hexpand halign={Gtk.Align.END}>
          <Time />
        </box>
      </centerbox>
    </window>
  );
}
