import Widget from "resource:///com/github/Aylur/ags/widget.js";
import * as Utils from "resource:///com/github/Aylur/ags/utils.js";

export const Clock = () =>
  Widget.Label({
    className: "clock",
    setup: (self) =>
      self.poll(1000, (label) => {
        // Format: "06:39 Sat, Dec 06"
        label.label = Utils.exec('date "+%H:%M %a, %b %d"');
      }),
  });
