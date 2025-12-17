import { GLib, Variable, bind } from "astal"
import ConfigAdapter from "../src/ConfigAdapter";
import { Gtk } from "astal/gtk3";

export default function DateTime() {
  const config = bind(ConfigAdapter.get().adapter);
  const format = config.as(c => c.widgets?.clock?.format ?? "%H:%M");

  // Reactive time variable that rebuilds when format changes
  const time = Variable.derive([format], (fmt) => {
    return GLib.DateTime.new_now_local().format(fmt)!;
  })

  // Poll using a separate variable or interval mechanism
  // To keep it simple and reactive:
  // We can use a polling variable that just ticks, and derive the string from (tick + format)
  const poll = Variable(0).poll(1000, () => Date.now());

  const label = bind(Variable.derive([poll, format], (_, fmt) =>
    GLib.DateTime.new_now_local().format(fmt)!
  ));

  return (
    <box
      className="WidgetPill accent DateTimePill"
      valign={Gtk.Align.FILL}
    >
      <label
        className="DateTime"
        label={label}
        onDestroy={() => poll.drop()}
      />
    </box>
  );
}
