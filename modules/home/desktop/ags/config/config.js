import App from "resource:///com/github/Aylur/ags/app.js";
import Widget from "resource:///com/github/Aylur/ags/widget.js";

import { Workspaces } from "./widgets/workspaces.js";
import { Clock } from "./widgets/clock.js";

// --- SECTIONS ---

const Left = () =>
  Widget.Box({
    spacing: 12, // More space between widgets
    children: [Widget.Label({ label: "", className: "nixos-icon" }), Clock()],
  });

const Center = () =>
  Widget.Box({
    spacing: 12,
    children: [Workspaces()],
  });

const Right = () =>
  Widget.Box({
    hpack: "end",
    spacing: 12,
    children: [
      Widget.Label({ label: "Stats ", className: "placeholder" }),
      Widget.Label({ label: "Tray ", className: "placeholder" }),
    ],
  });

// --- MAIN BAR ---

const Bar = (monitor = 0) =>
  Widget.Window({
    name: `bar-${monitor}`,
    monitor,
    anchor: ["bottom", "left", "right"],
    exclusive: true,
    child: Widget.CenterBox({
      className: "bar",
      // Margins prevent content from hitting the screen bezel
      startWidget: Widget.Box({
        css: "margin-left: 20px;",
        hpack: "start",
        children: [Left()],
      }),
      centerWidget: Widget.Box({
        hpack: "center",
        children: [Center()],
      }),
      endWidget: Widget.Box({
        css: "margin-right: 20px;",
        hpack: "end",
        children: [Right()],
      }),
    }),
  });

App.config({
  style: "./style.css",
  windows: [Bar(0)],
});
