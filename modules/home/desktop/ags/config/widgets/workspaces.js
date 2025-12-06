import Widget from "resource:///com/github/Aylur/ags/widget.js";
import * as Utils from "resource:///com/github/Aylur/ags/utils.js";
import Niri from "../services/niri.js";

export const Workspaces = () =>
  Widget.Box({
    className: "workspaces",
    children: Niri.bind("workspaces").transform((wsList) => {
      return wsList.map((ws) =>
        Widget.Button({
          // Check BOTH is_focused (global) and is_active (per-monitor)
          // This ensures it lights up even if Niri definition is fuzzy
          className:
            ws.is_focused || ws.is_active ? "workspace active" : "workspace",
          onClicked: () =>
            Utils.execAsync([
              "niri",
              "msg",
              "action",
              "focus-workspace",
              `${ws.id}`,
            ]),
          child: Widget.Label({
            label: `${ws.idx}`,
          }),
        }),
      );
    }),
  });
