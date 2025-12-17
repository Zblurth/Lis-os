var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);

// ../../../../../../../nix/store/1ckqvmr9hngfanwa6aw23cskymvh215c-astal-gjs/share/astal/gjs/gtk3/index.ts
import Astal7 from "gi://Astal?version=3.0";
import Gtk4 from "gi://Gtk?version=3.0";
import Gdk from "gi://Gdk?version=3.0";

// ../../../../../../../nix/store/1ckqvmr9hngfanwa6aw23cskymvh215c-astal-gjs/share/astal/gjs/variable.ts
import Astal3 from "gi://AstalIO";

// ../../../../../../../nix/store/1ckqvmr9hngfanwa6aw23cskymvh215c-astal-gjs/share/astal/gjs/binding.ts
var snakeify = (str) => str.replace(/([a-z])([A-Z])/g, "$1_$2").replaceAll("-", "_").toLowerCase();
var kebabify = (str) => str.replace(/([a-z])([A-Z])/g, "$1-$2").replaceAll("_", "-").toLowerCase();
var Binding = class _Binding {
  transformFn = (v) => v;
  #emitter;
  #prop;
  static bind(emitter, prop) {
    return new _Binding(emitter, prop);
  }
  constructor(emitter, prop) {
    this.#emitter = emitter;
    this.#prop = prop && kebabify(prop);
  }
  toString() {
    return `Binding<${this.#emitter}${this.#prop ? `, "${this.#prop}"` : ""}>`;
  }
  as(fn) {
    const bind5 = new _Binding(this.#emitter, this.#prop);
    bind5.transformFn = (v) => fn(this.transformFn(v));
    return bind5;
  }
  get() {
    if (typeof this.#emitter.get === "function")
      return this.transformFn(this.#emitter.get());
    if (typeof this.#prop === "string") {
      const getter = `get_${snakeify(this.#prop)}`;
      if (typeof this.#emitter[getter] === "function")
        return this.transformFn(this.#emitter[getter]());
      return this.transformFn(this.#emitter[this.#prop]);
    }
    throw Error("can not get value of binding");
  }
  subscribe(callback) {
    if (typeof this.#emitter.subscribe === "function") {
      return this.#emitter.subscribe(() => {
        callback(this.get());
      });
    } else if (typeof this.#emitter.connect === "function") {
      const signal = `notify::${this.#prop}`;
      const id = this.#emitter.connect(signal, () => {
        callback(this.get());
      });
      return () => {
        this.#emitter.disconnect(id);
      };
    }
    throw Error(`${this.#emitter} is not bindable`);
  }
};
var { bind } = Binding;
var binding_default = Binding;

// ../../../../../../../nix/store/1ckqvmr9hngfanwa6aw23cskymvh215c-astal-gjs/share/astal/gjs/time.ts
import Astal from "gi://AstalIO";
var Time = Astal.Time;
function interval(interval2, callback) {
  return Astal.Time.interval(interval2, () => void callback?.());
}

// ../../../../../../../nix/store/1ckqvmr9hngfanwa6aw23cskymvh215c-astal-gjs/share/astal/gjs/process.ts
import Astal2 from "gi://AstalIO";
var Process = Astal2.Process;
function subprocess(argsOrCmd, onOut = print, onErr = printerr) {
  const args = Array.isArray(argsOrCmd) || typeof argsOrCmd === "string";
  const { cmd, err, out } = {
    cmd: args ? argsOrCmd : argsOrCmd.cmd,
    err: args ? onErr : argsOrCmd.err || onErr,
    out: args ? onOut : argsOrCmd.out || onOut
  };
  const proc = Array.isArray(cmd) ? Astal2.Process.subprocessv(cmd) : Astal2.Process.subprocess(cmd);
  proc.connect("stdout", (_, stdout) => out(stdout));
  proc.connect("stderr", (_, stderr) => err(stderr));
  return proc;
}
function execAsync(cmd) {
  return new Promise((resolve, reject) => {
    if (Array.isArray(cmd)) {
      Astal2.Process.exec_asyncv(cmd, (_, res) => {
        try {
          resolve(Astal2.Process.exec_asyncv_finish(res));
        } catch (error) {
          reject(error);
        }
      });
    } else {
      Astal2.Process.exec_async(cmd, (_, res) => {
        try {
          resolve(Astal2.Process.exec_finish(res));
        } catch (error) {
          reject(error);
        }
      });
    }
  });
}

// ../../../../../../../nix/store/1ckqvmr9hngfanwa6aw23cskymvh215c-astal-gjs/share/astal/gjs/variable.ts
var VariableWrapper = class extends Function {
  variable;
  errHandler = console.error;
  _value;
  _poll;
  _watch;
  pollInterval = 1e3;
  pollExec;
  pollTransform;
  pollFn;
  watchTransform;
  watchExec;
  constructor(init) {
    super();
    this._value = init;
    this.variable = new Astal3.VariableBase();
    this.variable.connect("dropped", () => {
      this.stopWatch();
      this.stopPoll();
    });
    this.variable.connect("error", (_, err) => this.errHandler?.(err));
    return new Proxy(this, {
      apply: (target, _, args) => target._call(args[0])
    });
  }
  _call(transform) {
    const b = binding_default.bind(this);
    return transform ? b.as(transform) : b;
  }
  toString() {
    return String(`Variable<${this.get()}>`);
  }
  get() {
    return this._value;
  }
  set(value) {
    if (value !== this._value) {
      this._value = value;
      this.variable.emit("changed");
    }
  }
  startPoll() {
    if (this._poll)
      return;
    if (this.pollFn) {
      this._poll = interval(this.pollInterval, () => {
        const v = this.pollFn(this.get());
        if (v instanceof Promise) {
          v.then((v2) => this.set(v2)).catch((err) => this.variable.emit("error", err));
        } else {
          this.set(v);
        }
      });
    } else if (this.pollExec) {
      this._poll = interval(this.pollInterval, () => {
        execAsync(this.pollExec).then((v) => this.set(this.pollTransform(v, this.get()))).catch((err) => this.variable.emit("error", err));
      });
    }
  }
  startWatch() {
    if (this._watch)
      return;
    this._watch = subprocess({
      cmd: this.watchExec,
      out: (out) => this.set(this.watchTransform(out, this.get())),
      err: (err) => this.variable.emit("error", err)
    });
  }
  stopPoll() {
    this._poll?.cancel();
    delete this._poll;
  }
  stopWatch() {
    this._watch?.kill();
    delete this._watch;
  }
  isPolling() {
    return !!this._poll;
  }
  isWatching() {
    return !!this._watch;
  }
  drop() {
    this.variable.emit("dropped");
  }
  onDropped(callback) {
    this.variable.connect("dropped", callback);
    return this;
  }
  onError(callback) {
    delete this.errHandler;
    this.variable.connect("error", (_, err) => callback(err));
    return this;
  }
  subscribe(callback) {
    const id = this.variable.connect("changed", () => {
      callback(this.get());
    });
    return () => this.variable.disconnect(id);
  }
  poll(interval2, exec, transform = (out) => out) {
    this.stopPoll();
    this.pollInterval = interval2;
    this.pollTransform = transform;
    if (typeof exec === "function") {
      this.pollFn = exec;
      delete this.pollExec;
    } else {
      this.pollExec = exec;
      delete this.pollFn;
    }
    this.startPoll();
    return this;
  }
  watch(exec, transform = (out) => out) {
    this.stopWatch();
    this.watchExec = exec;
    this.watchTransform = transform;
    this.startWatch();
    return this;
  }
  observe(objs, sigOrFn, callback) {
    const f = typeof sigOrFn === "function" ? sigOrFn : callback ?? (() => this.get());
    const set = (obj, ...args) => this.set(f(obj, ...args));
    if (Array.isArray(objs)) {
      for (const obj of objs) {
        const [o, s] = obj;
        const id = o.connect(s, set);
        this.onDropped(() => o.disconnect(id));
      }
    } else {
      if (typeof sigOrFn === "string") {
        const id = objs.connect(sigOrFn, set);
        this.onDropped(() => objs.disconnect(id));
      }
    }
    return this;
  }
  static derive(deps, fn = (...args) => args) {
    const update = () => fn(...deps.map((d) => d.get()));
    const derived = new Variable(update());
    const unsubs = deps.map((dep) => dep.subscribe(() => derived.set(update())));
    derived.onDropped(() => unsubs.map((unsub) => unsub()));
    return derived;
  }
};
var Variable = new Proxy(VariableWrapper, {
  apply: (_t, _a, args) => new VariableWrapper(args[0])
});
var { derive } = Variable;
var variable_default = Variable;

// ../../../../../../../nix/store/1ckqvmr9hngfanwa6aw23cskymvh215c-astal-gjs/share/astal/gjs/_astal.ts
var noImplicitDestroy = Symbol("no no implicit destroy");
var setChildren = Symbol("children setter method");
function mergeBindings(array) {
  function getValues(...args) {
    let i = 0;
    return array.map(
      (value) => value instanceof binding_default ? args[i++] : value
    );
  }
  const bindings = array.filter((i) => i instanceof binding_default);
  if (bindings.length === 0)
    return array;
  if (bindings.length === 1)
    return bindings[0].as(getValues);
  return variable_default.derive(bindings, getValues)();
}
function setProp(obj, prop, value) {
  try {
    const setter = `set_${snakeify(prop)}`;
    if (typeof obj[setter] === "function")
      return obj[setter](value);
    return obj[prop] = value;
  } catch (error) {
    console.error(`could not set property "${prop}" on ${obj}:`, error);
  }
}
function hook(widget, object, signalOrCallback, callback) {
  if (typeof object.connect === "function" && callback) {
    const id = object.connect(signalOrCallback, (_, ...args) => {
      return callback(widget, ...args);
    });
    widget.connect("destroy", () => {
      object.disconnect(id);
    });
  } else if (typeof object.subscribe === "function" && typeof signalOrCallback === "function") {
    const unsub = object.subscribe((...args) => {
      signalOrCallback(widget, ...args);
    });
    widget.connect("destroy", unsub);
  }
}
function construct(widget, config) {
  let { setup, child, children = [], ...props } = config;
  if (children instanceof binding_default) {
    children = [children];
  }
  if (child) {
    children.unshift(child);
  }
  for (const [key, value] of Object.entries(props)) {
    if (value === void 0) {
      delete props[key];
    }
  }
  const bindings = Object.keys(props).reduce((acc, prop) => {
    if (props[prop] instanceof binding_default) {
      const binding = props[prop];
      delete props[prop];
      return [...acc, [prop, binding]];
    }
    return acc;
  }, []);
  const onHandlers = Object.keys(props).reduce((acc, key) => {
    if (key.startsWith("on")) {
      const sig = kebabify(key).split("-").slice(1).join("-");
      const handler = props[key];
      delete props[key];
      return [...acc, [sig, handler]];
    }
    return acc;
  }, []);
  const mergedChildren = mergeBindings(children.flat(Infinity));
  if (mergedChildren instanceof binding_default) {
    widget[setChildren](mergedChildren.get());
    widget.connect("destroy", mergedChildren.subscribe((v) => {
      widget[setChildren](v);
    }));
  } else {
    if (mergedChildren.length > 0) {
      widget[setChildren](mergedChildren);
    }
  }
  for (const [signal, callback] of onHandlers) {
    const sig = signal.startsWith("notify") ? signal.replace("-", "::") : signal;
    if (typeof callback === "function") {
      widget.connect(sig, callback);
    } else {
      widget.connect(sig, () => execAsync(callback).then(print).catch(console.error));
    }
  }
  for (const [prop, binding] of bindings) {
    if (prop === "child" || prop === "children") {
      widget.connect("destroy", binding.subscribe((v) => {
        widget[setChildren](v);
      }));
    }
    widget.connect("destroy", binding.subscribe((v) => {
      setProp(widget, prop, v);
    }));
    setProp(widget, prop, binding.get());
  }
  for (const [key, value] of Object.entries(props)) {
    if (value === void 0) {
      delete props[key];
    }
  }
  Object.assign(widget, props);
  setup?.(widget);
  return widget;
}
function isArrowFunction(func) {
  return !Object.hasOwn(func, "prototype");
}
function jsx(ctors2, ctor, { children, ...props }) {
  children ??= [];
  if (!Array.isArray(children))
    children = [children];
  children = children.filter(Boolean);
  if (children.length === 1)
    props.child = children[0];
  else if (children.length > 1)
    props.children = children;
  if (typeof ctor === "string") {
    if (isArrowFunction(ctors2[ctor]))
      return ctors2[ctor](props);
    return new ctors2[ctor](props);
  }
  if (isArrowFunction(ctor))
    return ctor(props);
  return new ctor(props);
}

// ../../../../../../../nix/store/1ckqvmr9hngfanwa6aw23cskymvh215c-astal-gjs/share/astal/gjs/gtk3/astalify.ts
import Astal4 from "gi://Astal?version=3.0";
import Gtk from "gi://Gtk?version=3.0";
import GObject from "gi://GObject";
function astalify(cls, clsName = cls.name) {
  class Widget extends cls {
    get css() {
      return Astal4.widget_get_css(this);
    }
    set css(css) {
      Astal4.widget_set_css(this, css);
    }
    get_css() {
      return this.css;
    }
    set_css(css) {
      this.css = css;
    }
    get className() {
      return Astal4.widget_get_class_names(this).join(" ");
    }
    set className(className) {
      Astal4.widget_set_class_names(this, className.split(/\s+/));
    }
    get_class_name() {
      return this.className;
    }
    set_class_name(className) {
      this.className = className;
    }
    get cursor() {
      return Astal4.widget_get_cursor(this);
    }
    set cursor(cursor) {
      Astal4.widget_set_cursor(this, cursor);
    }
    get_cursor() {
      return this.cursor;
    }
    set_cursor(cursor) {
      this.cursor = cursor;
    }
    get clickThrough() {
      return Astal4.widget_get_click_through(this);
    }
    set clickThrough(clickThrough) {
      Astal4.widget_set_click_through(this, clickThrough);
    }
    get_click_through() {
      return this.clickThrough;
    }
    set_click_through(clickThrough) {
      this.clickThrough = clickThrough;
    }
    get noImplicitDestroy() {
      return this[noImplicitDestroy];
    }
    set noImplicitDestroy(value) {
      this[noImplicitDestroy] = value;
    }
    set actionGroup([prefix, group]) {
      this.insert_action_group(prefix, group);
    }
    set_action_group(actionGroup) {
      this.actionGroup = actionGroup;
    }
    getChildren() {
      if (this instanceof Gtk.Bin) {
        return this.get_child() ? [this.get_child()] : [];
      } else if (this instanceof Gtk.Container) {
        return this.get_children();
      }
      return [];
    }
    setChildren(children) {
      children = children.flat(Infinity).map((ch) => ch instanceof Gtk.Widget ? ch : new Gtk.Label({ visible: true, label: String(ch) }));
      if (this instanceof Gtk.Container) {
        for (const ch of children)
          this.add(ch);
      } else {
        throw Error(`can not add children to ${this.constructor.name}`);
      }
    }
    [setChildren](children) {
      if (this instanceof Gtk.Container) {
        for (const ch of this.getChildren()) {
          this.remove(ch);
          if (!children.includes(ch) && !this.noImplicitDestroy)
            ch?.destroy();
        }
      }
      this.setChildren(children);
    }
    toggleClassName(cn, cond = true) {
      Astal4.widget_toggle_class_name(this, cn, cond);
    }
    hook(object, signalOrCallback, callback) {
      hook(this, object, signalOrCallback, callback);
      return this;
    }
    constructor(...params) {
      super();
      const props = params[0] || {};
      props.visible ??= true;
      construct(this, props);
    }
  }
  GObject.registerClass({
    GTypeName: `Astal_${clsName}`,
    Properties: {
      "class-name": GObject.ParamSpec.string(
        "class-name",
        "",
        "",
        GObject.ParamFlags.READWRITE,
        ""
      ),
      "css": GObject.ParamSpec.string(
        "css",
        "",
        "",
        GObject.ParamFlags.READWRITE,
        ""
      ),
      "cursor": GObject.ParamSpec.string(
        "cursor",
        "",
        "",
        GObject.ParamFlags.READWRITE,
        "default"
      ),
      "click-through": GObject.ParamSpec.boolean(
        "click-through",
        "",
        "",
        GObject.ParamFlags.READWRITE,
        false
      ),
      "no-implicit-destroy": GObject.ParamSpec.boolean(
        "no-implicit-destroy",
        "",
        "",
        GObject.ParamFlags.READWRITE,
        false
      )
    }
  }, Widget);
  return Widget;
}

// ../../../../../../../nix/store/1ckqvmr9hngfanwa6aw23cskymvh215c-astal-gjs/share/astal/gjs/gtk3/app.ts
import Gtk2 from "gi://Gtk?version=3.0";
import Astal5 from "gi://Astal?version=3.0";

// ../../../../../../../nix/store/1ckqvmr9hngfanwa6aw23cskymvh215c-astal-gjs/share/astal/gjs/overrides.ts
var snakeify2 = (str) => str.replace(/([a-z])([A-Z])/g, "$1_$2").replaceAll("-", "_").toLowerCase();
async function suppress(mod, patch2) {
  return mod.then((m) => patch2(m.default)).catch(() => void 0);
}
function patch(proto, prop) {
  Object.defineProperty(proto, prop, {
    get() {
      return this[`get_${snakeify2(prop)}`]();
    }
  });
}
await suppress(import("gi://AstalApps"), ({ Apps, Application }) => {
  patch(Apps.prototype, "list");
  patch(Application.prototype, "keywords");
  patch(Application.prototype, "categories");
});
await suppress(import("gi://AstalBattery"), ({ UPower }) => {
  patch(UPower.prototype, "devices");
});
await suppress(import("gi://AstalBluetooth"), ({ Adapter, Bluetooth, Device }) => {
  patch(Adapter.prototype, "uuids");
  patch(Bluetooth.prototype, "adapters");
  patch(Bluetooth.prototype, "devices");
  patch(Device.prototype, "uuids");
});
await suppress(import("gi://AstalHyprland"), ({ Hyprland, Monitor, Workspace: Workspace2 }) => {
  patch(Hyprland.prototype, "monitors");
  patch(Hyprland.prototype, "workspaces");
  patch(Hyprland.prototype, "clients");
  patch(Monitor.prototype, "availableModes");
  patch(Monitor.prototype, "available_modes");
  patch(Workspace2.prototype, "clients");
});
await suppress(import("gi://AstalMpris"), ({ Mpris, Player }) => {
  patch(Mpris.prototype, "players");
  patch(Player.prototype, "supported_uri_schemes");
  patch(Player.prototype, "supportedUriSchemes");
  patch(Player.prototype, "supported_mime_types");
  patch(Player.prototype, "supportedMimeTypes");
  patch(Player.prototype, "comments");
});
await suppress(import("gi://AstalNetwork"), ({ Wifi }) => {
  patch(Wifi.prototype, "access_points");
  patch(Wifi.prototype, "accessPoints");
});
await suppress(import("gi://AstalNotifd"), ({ Notifd: Notifd2, Notification }) => {
  patch(Notifd2.prototype, "notifications");
  patch(Notification.prototype, "actions");
});
await suppress(import("gi://AstalPowerProfiles"), ({ PowerProfiles }) => {
  patch(PowerProfiles.prototype, "actions");
});
await suppress(import("gi://AstalWp"), ({ Wp, Audio: Audio2, Video }) => {
  patch(Wp.prototype, "endpoints");
  patch(Wp.prototype, "devices");
  patch(Audio2.prototype, "streams");
  patch(Audio2.prototype, "recorders");
  patch(Audio2.prototype, "microphones");
  patch(Audio2.prototype, "speakers");
  patch(Audio2.prototype, "devices");
  patch(Video.prototype, "streams");
  patch(Video.prototype, "recorders");
  patch(Video.prototype, "sinks");
  patch(Video.prototype, "sources");
  patch(Video.prototype, "devices");
});

// ../../../../../../../nix/store/1ckqvmr9hngfanwa6aw23cskymvh215c-astal-gjs/share/astal/gjs/_app.ts
import { setConsoleLogDomain } from "console";
import { exit, programArgs } from "system";
import IO from "gi://AstalIO";
import GObject2 from "gi://GObject";
function mkApp(App) {
  return new class AstalJS extends App {
    static {
      GObject2.registerClass({ GTypeName: "AstalJS" }, this);
    }
    eval(body) {
      return new Promise((res, rej) => {
        try {
          const fn = Function(`return (async function() {
                        ${body.includes(";") ? body : `return ${body};`}
                    })`);
          fn()().then(res).catch(rej);
        } catch (error) {
          rej(error);
        }
      });
    }
    requestHandler;
    vfunc_request(msg, conn) {
      if (typeof this.requestHandler === "function") {
        this.requestHandler(msg, (response) => {
          IO.write_sock(
            conn,
            String(response),
            (_, res) => IO.write_sock_finish(res)
          );
        });
      } else {
        super.vfunc_request(msg, conn);
      }
    }
    apply_css(style, reset = false) {
      super.apply_css(style, reset);
    }
    quit(code) {
      super.quit();
      exit(code ?? 0);
    }
    start({ requestHandler, css, hold, main, client, icons, ...cfg } = {}) {
      const app = this;
      client ??= () => {
        print(`Astal instance "${app.instanceName}" already running`);
        exit(1);
      };
      Object.assign(this, cfg);
      setConsoleLogDomain(app.instanceName);
      this.requestHandler = requestHandler;
      app.connect("activate", () => {
        main?.(...programArgs);
      });
      try {
        app.acquire_socket();
      } catch (error) {
        return client((msg) => IO.send_message(app.instanceName, msg), ...programArgs);
      }
      if (css)
        this.apply_css(css, false);
      if (icons)
        app.add_icons(icons);
      hold ??= true;
      if (hold)
        app.hold();
      app.runAsync([]);
    }
  }();
}

// ../../../../../../../nix/store/1ckqvmr9hngfanwa6aw23cskymvh215c-astal-gjs/share/astal/gjs/gtk3/app.ts
Gtk2.init(null);
var app_default = mkApp(Astal5.Application);

// ../../../../../../../nix/store/1ckqvmr9hngfanwa6aw23cskymvh215c-astal-gjs/share/astal/gjs/gtk3/widget.ts
import Astal6 from "gi://Astal?version=3.0";
import Gtk3 from "gi://Gtk?version=3.0";
import GObject3 from "gi://GObject";
function filter(children) {
  return children.flat(Infinity).map((ch) => ch instanceof Gtk3.Widget ? ch : new Gtk3.Label({ visible: true, label: String(ch) }));
}
Object.defineProperty(Astal6.Box.prototype, "children", {
  get() {
    return this.get_children();
  },
  set(v) {
    this.set_children(v);
  }
});
var Box = class extends astalify(Astal6.Box) {
  static {
    GObject3.registerClass({ GTypeName: "Box" }, this);
  }
  constructor(props, ...children) {
    super({ children, ...props });
  }
  setChildren(children) {
    this.set_children(filter(children));
  }
};
var Button = class extends astalify(Astal6.Button) {
  static {
    GObject3.registerClass({ GTypeName: "Button" }, this);
  }
  constructor(props, child) {
    super({ child, ...props });
  }
};
var CenterBox = class extends astalify(Astal6.CenterBox) {
  static {
    GObject3.registerClass({ GTypeName: "CenterBox" }, this);
  }
  constructor(props, ...children) {
    super({ children, ...props });
  }
  setChildren(children) {
    const ch = filter(children);
    this.startWidget = ch[0] || new Gtk3.Box();
    this.centerWidget = ch[1] || new Gtk3.Box();
    this.endWidget = ch[2] || new Gtk3.Box();
  }
};
var CircularProgress = class extends astalify(Astal6.CircularProgress) {
  static {
    GObject3.registerClass({ GTypeName: "CircularProgress" }, this);
  }
  constructor(props, child) {
    super({ child, ...props });
  }
};
var DrawingArea = class extends astalify(Gtk3.DrawingArea) {
  static {
    GObject3.registerClass({ GTypeName: "DrawingArea" }, this);
  }
  constructor(props) {
    super(props);
  }
};
var Entry = class extends astalify(Gtk3.Entry) {
  static {
    GObject3.registerClass({ GTypeName: "Entry" }, this);
  }
  constructor(props) {
    super(props);
  }
};
var EventBox = class extends astalify(Astal6.EventBox) {
  static {
    GObject3.registerClass({ GTypeName: "EventBox" }, this);
  }
  constructor(props, child) {
    super({ child, ...props });
  }
};
var Icon = class extends astalify(Astal6.Icon) {
  static {
    GObject3.registerClass({ GTypeName: "Icon" }, this);
  }
  constructor(props) {
    super(props);
  }
};
var Label = class extends astalify(Astal6.Label) {
  static {
    GObject3.registerClass({ GTypeName: "Label" }, this);
  }
  constructor(props) {
    super(props);
  }
  setChildren(children) {
    this.label = String(children);
  }
};
var LevelBar = class extends astalify(Astal6.LevelBar) {
  static {
    GObject3.registerClass({ GTypeName: "LevelBar" }, this);
  }
  constructor(props) {
    super(props);
  }
};
var MenuButton = class extends astalify(Gtk3.MenuButton) {
  static {
    GObject3.registerClass({ GTypeName: "MenuButton" }, this);
  }
  constructor(props, child) {
    super({ child, ...props });
  }
};
Object.defineProperty(Astal6.Overlay.prototype, "overlays", {
  get() {
    return this.get_overlays();
  },
  set(v) {
    this.set_overlays(v);
  }
});
var Overlay = class extends astalify(Astal6.Overlay) {
  static {
    GObject3.registerClass({ GTypeName: "Overlay" }, this);
  }
  constructor(props, ...children) {
    super({ children, ...props });
  }
  setChildren(children) {
    const [child, ...overlays] = filter(children);
    this.set_child(child);
    this.set_overlays(overlays);
  }
};
var Revealer = class extends astalify(Gtk3.Revealer) {
  static {
    GObject3.registerClass({ GTypeName: "Revealer" }, this);
  }
  constructor(props, child) {
    super({ child, ...props });
  }
};
var Scrollable = class extends astalify(Astal6.Scrollable) {
  static {
    GObject3.registerClass({ GTypeName: "Scrollable" }, this);
  }
  constructor(props, child) {
    super({ child, ...props });
  }
};
var Slider = class extends astalify(Astal6.Slider) {
  static {
    GObject3.registerClass({ GTypeName: "Slider" }, this);
  }
  constructor(props) {
    super(props);
  }
};
var Stack = class extends astalify(Astal6.Stack) {
  static {
    GObject3.registerClass({ GTypeName: "Stack" }, this);
  }
  constructor(props, ...children) {
    super({ children, ...props });
  }
  setChildren(children) {
    this.set_children(filter(children));
  }
};
var Switch = class extends astalify(Gtk3.Switch) {
  static {
    GObject3.registerClass({ GTypeName: "Switch" }, this);
  }
  constructor(props) {
    super(props);
  }
};
var Window = class extends astalify(Astal6.Window) {
  static {
    GObject3.registerClass({ GTypeName: "Window" }, this);
  }
  constructor(props, child) {
    super({ child, ...props });
  }
};

// ../../../../../../../nix/store/1ckqvmr9hngfanwa6aw23cskymvh215c-astal-gjs/share/astal/gjs/file.ts
import Astal8 from "gi://AstalIO";
import Gio from "gi://Gio?version=2.0";
function readFile(path) {
  return Astal8.read_file(path) || "";
}
function readFileAsync(path) {
  return new Promise((resolve, reject) => {
    Astal8.read_file_async(path, (_, res) => {
      try {
        resolve(Astal8.read_file_finish(res) || "");
      } catch (error) {
        reject(error);
      }
    });
  });
}
function monitorFile(path, callback) {
  return Astal8.monitor_file(path, (file, event) => {
    callback(file, event);
  });
}

// ../../../../../../../nix/store/1ckqvmr9hngfanwa6aw23cskymvh215c-astal-gjs/share/astal/gjs/index.ts
import { default as default3 } from "gi://AstalIO?version=0.1";

// ../../../../../../../nix/store/1ckqvmr9hngfanwa6aw23cskymvh215c-astal-gjs/share/astal/gjs/gobject.ts
import GObject4 from "gi://GObject";
import { default as default2 } from "gi://GLib?version=2.0";
var meta = Symbol("meta");
var priv = Symbol("priv");
var { ParamSpec, ParamFlags } = GObject4;
var kebabify2 = (str) => str.replace(/([a-z])([A-Z])/g, "$1-$2").replaceAll("_", "-").toLowerCase();
function register(options = {}) {
  return function(cls) {
    const t = options.Template;
    if (typeof t === "string" && !t.startsWith("resource://") && !t.startsWith("file://")) {
      options.Template = new TextEncoder().encode(t);
    }
    GObject4.registerClass({
      Signals: { ...cls[meta]?.Signals },
      Properties: { ...cls[meta]?.Properties },
      ...options
    }, cls);
    delete cls[meta];
  };
}
function property(declaration = Object) {
  return function(target, prop, desc) {
    target.constructor[meta] ??= {};
    target.constructor[meta].Properties ??= {};
    const name = kebabify2(prop);
    if (!desc) {
      Object.defineProperty(target, prop, {
        get() {
          return this[priv]?.[prop] ?? defaultValue(declaration);
        },
        set(v) {
          if (v !== this[prop]) {
            this[priv] ??= {};
            this[priv][prop] = v;
            this.notify(name);
          }
        }
      });
      Object.defineProperty(target, `set_${name.replace("-", "_")}`, {
        value(v) {
          this[prop] = v;
        }
      });
      Object.defineProperty(target, `get_${name.replace("-", "_")}`, {
        value() {
          return this[prop];
        }
      });
      target.constructor[meta].Properties[kebabify2(prop)] = pspec(name, ParamFlags.READWRITE, declaration);
    } else {
      let flags = 0;
      if (desc.get) flags |= ParamFlags.READABLE;
      if (desc.set) flags |= ParamFlags.WRITABLE;
      target.constructor[meta].Properties[kebabify2(prop)] = pspec(name, flags, declaration);
    }
  };
}
function pspec(name, flags, declaration) {
  if (declaration instanceof ParamSpec)
    return declaration;
  switch (declaration) {
    case String:
      return ParamSpec.string(name, "", "", flags, "");
    case Number:
      return ParamSpec.double(name, "", "", flags, -Number.MAX_VALUE, Number.MAX_VALUE, 0);
    case Boolean:
      return ParamSpec.boolean(name, "", "", flags, false);
    case Object:
      return ParamSpec.jsobject(name, "", "", flags);
    default:
      return ParamSpec.object(name, "", "", flags, declaration.$gtype);
  }
}
function defaultValue(declaration) {
  if (declaration instanceof ParamSpec)
    return declaration.get_default_value();
  switch (declaration) {
    case String:
      return "";
    case Number:
      return 0;
    case Boolean:
      return false;
    case Object:
    default:
      return null;
  }
}

// node_modules/zod/v3/external.js
var external_exports = {};
__export(external_exports, {
  BRAND: () => BRAND,
  DIRTY: () => DIRTY,
  EMPTY_PATH: () => EMPTY_PATH,
  INVALID: () => INVALID,
  NEVER: () => NEVER,
  OK: () => OK,
  ParseStatus: () => ParseStatus,
  Schema: () => ZodType,
  ZodAny: () => ZodAny,
  ZodArray: () => ZodArray,
  ZodBigInt: () => ZodBigInt,
  ZodBoolean: () => ZodBoolean,
  ZodBranded: () => ZodBranded,
  ZodCatch: () => ZodCatch,
  ZodDate: () => ZodDate,
  ZodDefault: () => ZodDefault,
  ZodDiscriminatedUnion: () => ZodDiscriminatedUnion,
  ZodEffects: () => ZodEffects,
  ZodEnum: () => ZodEnum,
  ZodError: () => ZodError,
  ZodFirstPartyTypeKind: () => ZodFirstPartyTypeKind,
  ZodFunction: () => ZodFunction,
  ZodIntersection: () => ZodIntersection,
  ZodIssueCode: () => ZodIssueCode,
  ZodLazy: () => ZodLazy,
  ZodLiteral: () => ZodLiteral,
  ZodMap: () => ZodMap,
  ZodNaN: () => ZodNaN,
  ZodNativeEnum: () => ZodNativeEnum,
  ZodNever: () => ZodNever,
  ZodNull: () => ZodNull,
  ZodNullable: () => ZodNullable,
  ZodNumber: () => ZodNumber,
  ZodObject: () => ZodObject,
  ZodOptional: () => ZodOptional,
  ZodParsedType: () => ZodParsedType,
  ZodPipeline: () => ZodPipeline,
  ZodPromise: () => ZodPromise,
  ZodReadonly: () => ZodReadonly,
  ZodRecord: () => ZodRecord,
  ZodSchema: () => ZodType,
  ZodSet: () => ZodSet,
  ZodString: () => ZodString,
  ZodSymbol: () => ZodSymbol,
  ZodTransformer: () => ZodEffects,
  ZodTuple: () => ZodTuple,
  ZodType: () => ZodType,
  ZodUndefined: () => ZodUndefined,
  ZodUnion: () => ZodUnion,
  ZodUnknown: () => ZodUnknown,
  ZodVoid: () => ZodVoid,
  addIssueToContext: () => addIssueToContext,
  any: () => anyType,
  array: () => arrayType,
  bigint: () => bigIntType,
  boolean: () => booleanType,
  coerce: () => coerce,
  custom: () => custom,
  date: () => dateType,
  datetimeRegex: () => datetimeRegex,
  defaultErrorMap: () => en_default,
  discriminatedUnion: () => discriminatedUnionType,
  effect: () => effectsType,
  enum: () => enumType,
  function: () => functionType,
  getErrorMap: () => getErrorMap,
  getParsedType: () => getParsedType,
  instanceof: () => instanceOfType,
  intersection: () => intersectionType,
  isAborted: () => isAborted,
  isAsync: () => isAsync,
  isDirty: () => isDirty,
  isValid: () => isValid,
  late: () => late,
  lazy: () => lazyType,
  literal: () => literalType,
  makeIssue: () => makeIssue,
  map: () => mapType,
  nan: () => nanType,
  nativeEnum: () => nativeEnumType,
  never: () => neverType,
  null: () => nullType,
  nullable: () => nullableType,
  number: () => numberType,
  object: () => objectType,
  objectUtil: () => objectUtil,
  oboolean: () => oboolean,
  onumber: () => onumber,
  optional: () => optionalType,
  ostring: () => ostring,
  pipeline: () => pipelineType,
  preprocess: () => preprocessType,
  promise: () => promiseType,
  quotelessJson: () => quotelessJson,
  record: () => recordType,
  set: () => setType,
  setErrorMap: () => setErrorMap,
  strictObject: () => strictObjectType,
  string: () => stringType,
  symbol: () => symbolType,
  transformer: () => effectsType,
  tuple: () => tupleType,
  undefined: () => undefinedType,
  union: () => unionType,
  unknown: () => unknownType,
  util: () => util,
  void: () => voidType
});

// node_modules/zod/v3/helpers/util.js
var util;
(function(util2) {
  util2.assertEqual = (_) => {
  };
  function assertIs(_arg) {
  }
  util2.assertIs = assertIs;
  function assertNever(_x) {
    throw new Error();
  }
  util2.assertNever = assertNever;
  util2.arrayToEnum = (items) => {
    const obj = {};
    for (const item of items) {
      obj[item] = item;
    }
    return obj;
  };
  util2.getValidEnumValues = (obj) => {
    const validKeys = util2.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
    const filtered = {};
    for (const k of validKeys) {
      filtered[k] = obj[k];
    }
    return util2.objectValues(filtered);
  };
  util2.objectValues = (obj) => {
    return util2.objectKeys(obj).map(function(e) {
      return obj[e];
    });
  };
  util2.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
    const keys = [];
    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        keys.push(key);
      }
    }
    return keys;
  };
  util2.find = (arr, checker) => {
    for (const item of arr) {
      if (checker(item))
        return item;
    }
    return void 0;
  };
  util2.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
  function joinValues(array, separator = " | ") {
    return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
  }
  util2.joinValues = joinValues;
  util2.jsonStringifyReplacer = (_, value) => {
    if (typeof value === "bigint") {
      return value.toString();
    }
    return value;
  };
})(util || (util = {}));
var objectUtil;
(function(objectUtil2) {
  objectUtil2.mergeShapes = (first, second) => {
    return {
      ...first,
      ...second
      // second overwrites first
    };
  };
})(objectUtil || (objectUtil = {}));
var ZodParsedType = util.arrayToEnum([
  "string",
  "nan",
  "number",
  "integer",
  "float",
  "boolean",
  "date",
  "bigint",
  "symbol",
  "function",
  "undefined",
  "null",
  "array",
  "object",
  "unknown",
  "promise",
  "void",
  "never",
  "map",
  "set"
]);
var getParsedType = (data) => {
  const t = typeof data;
  switch (t) {
    case "undefined":
      return ZodParsedType.undefined;
    case "string":
      return ZodParsedType.string;
    case "number":
      return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
    case "boolean":
      return ZodParsedType.boolean;
    case "function":
      return ZodParsedType.function;
    case "bigint":
      return ZodParsedType.bigint;
    case "symbol":
      return ZodParsedType.symbol;
    case "object":
      if (Array.isArray(data)) {
        return ZodParsedType.array;
      }
      if (data === null) {
        return ZodParsedType.null;
      }
      if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
        return ZodParsedType.promise;
      }
      if (typeof Map !== "undefined" && data instanceof Map) {
        return ZodParsedType.map;
      }
      if (typeof Set !== "undefined" && data instanceof Set) {
        return ZodParsedType.set;
      }
      if (typeof Date !== "undefined" && data instanceof Date) {
        return ZodParsedType.date;
      }
      return ZodParsedType.object;
    default:
      return ZodParsedType.unknown;
  }
};

// node_modules/zod/v3/ZodError.js
var ZodIssueCode = util.arrayToEnum([
  "invalid_type",
  "invalid_literal",
  "custom",
  "invalid_union",
  "invalid_union_discriminator",
  "invalid_enum_value",
  "unrecognized_keys",
  "invalid_arguments",
  "invalid_return_type",
  "invalid_date",
  "invalid_string",
  "too_small",
  "too_big",
  "invalid_intersection_types",
  "not_multiple_of",
  "not_finite"
]);
var quotelessJson = (obj) => {
  const json = JSON.stringify(obj, null, 2);
  return json.replace(/"([^"]+)":/g, "$1:");
};
var ZodError = class _ZodError extends Error {
  get errors() {
    return this.issues;
  }
  constructor(issues) {
    super();
    this.issues = [];
    this.addIssue = (sub) => {
      this.issues = [...this.issues, sub];
    };
    this.addIssues = (subs = []) => {
      this.issues = [...this.issues, ...subs];
    };
    const actualProto = new.target.prototype;
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, actualProto);
    } else {
      this.__proto__ = actualProto;
    }
    this.name = "ZodError";
    this.issues = issues;
  }
  format(_mapper) {
    const mapper = _mapper || function(issue) {
      return issue.message;
    };
    const fieldErrors = { _errors: [] };
    const processError = (error) => {
      for (const issue of error.issues) {
        if (issue.code === "invalid_union") {
          issue.unionErrors.map(processError);
        } else if (issue.code === "invalid_return_type") {
          processError(issue.returnTypeError);
        } else if (issue.code === "invalid_arguments") {
          processError(issue.argumentsError);
        } else if (issue.path.length === 0) {
          fieldErrors._errors.push(mapper(issue));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < issue.path.length) {
            const el = issue.path[i];
            const terminal = i === issue.path.length - 1;
            if (!terminal) {
              curr[el] = curr[el] || { _errors: [] };
            } else {
              curr[el] = curr[el] || { _errors: [] };
              curr[el]._errors.push(mapper(issue));
            }
            curr = curr[el];
            i++;
          }
        }
      }
    };
    processError(this);
    return fieldErrors;
  }
  static assert(value) {
    if (!(value instanceof _ZodError)) {
      throw new Error(`Not a ZodError: ${value}`);
    }
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
  }
  get isEmpty() {
    return this.issues.length === 0;
  }
  flatten(mapper = (issue) => issue.message) {
    const fieldErrors = {};
    const formErrors = [];
    for (const sub of this.issues) {
      if (sub.path.length > 0) {
        const firstEl = sub.path[0];
        fieldErrors[firstEl] = fieldErrors[firstEl] || [];
        fieldErrors[firstEl].push(mapper(sub));
      } else {
        formErrors.push(mapper(sub));
      }
    }
    return { formErrors, fieldErrors };
  }
  get formErrors() {
    return this.flatten();
  }
};
ZodError.create = (issues) => {
  const error = new ZodError(issues);
  return error;
};

// node_modules/zod/v3/locales/en.js
var errorMap = (issue, _ctx) => {
  let message;
  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === ZodParsedType.undefined) {
        message = "Required";
      } else {
        message = `Expected ${issue.expected}, received ${issue.received}`;
      }
      break;
    case ZodIssueCode.invalid_literal:
      message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
      break;
    case ZodIssueCode.unrecognized_keys:
      message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
      break;
    case ZodIssueCode.invalid_union:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_union_discriminator:
      message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
      break;
    case ZodIssueCode.invalid_enum_value:
      message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
      break;
    case ZodIssueCode.invalid_arguments:
      message = `Invalid function arguments`;
      break;
    case ZodIssueCode.invalid_return_type:
      message = `Invalid function return type`;
      break;
    case ZodIssueCode.invalid_date:
      message = `Invalid date`;
      break;
    case ZodIssueCode.invalid_string:
      if (typeof issue.validation === "object") {
        if ("includes" in issue.validation) {
          message = `Invalid input: must include "${issue.validation.includes}"`;
          if (typeof issue.validation.position === "number") {
            message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
          }
        } else if ("startsWith" in issue.validation) {
          message = `Invalid input: must start with "${issue.validation.startsWith}"`;
        } else if ("endsWith" in issue.validation) {
          message = `Invalid input: must end with "${issue.validation.endsWith}"`;
        } else {
          util.assertNever(issue.validation);
        }
      } else if (issue.validation !== "regex") {
        message = `Invalid ${issue.validation}`;
      } else {
        message = "Invalid";
      }
      break;
    case ZodIssueCode.too_small:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "bigint")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.too_big:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "bigint")
        message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.custom:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_intersection_types:
      message = `Intersection results could not be merged`;
      break;
    case ZodIssueCode.not_multiple_of:
      message = `Number must be a multiple of ${issue.multipleOf}`;
      break;
    case ZodIssueCode.not_finite:
      message = "Number must be finite";
      break;
    default:
      message = _ctx.defaultError;
      util.assertNever(issue);
  }
  return { message };
};
var en_default = errorMap;

// node_modules/zod/v3/errors.js
var overrideErrorMap = en_default;
function setErrorMap(map) {
  overrideErrorMap = map;
}
function getErrorMap() {
  return overrideErrorMap;
}

// node_modules/zod/v3/helpers/parseUtil.js
var makeIssue = (params) => {
  const { data, path, errorMaps, issueData } = params;
  const fullPath = [...path, ...issueData.path || []];
  const fullIssue = {
    ...issueData,
    path: fullPath
  };
  if (issueData.message !== void 0) {
    return {
      ...issueData,
      path: fullPath,
      message: issueData.message
    };
  }
  let errorMessage = "";
  const maps = errorMaps.filter((m) => !!m).slice().reverse();
  for (const map of maps) {
    errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
  }
  return {
    ...issueData,
    path: fullPath,
    message: errorMessage
  };
};
var EMPTY_PATH = [];
function addIssueToContext(ctx, issueData) {
  const overrideMap = getErrorMap();
  const issue = makeIssue({
    issueData,
    data: ctx.data,
    path: ctx.path,
    errorMaps: [
      ctx.common.contextualErrorMap,
      // contextual error map is first priority
      ctx.schemaErrorMap,
      // then schema-bound map if available
      overrideMap,
      // then global override map
      overrideMap === en_default ? void 0 : en_default
      // then global default map
    ].filter((x) => !!x)
  });
  ctx.common.issues.push(issue);
}
var ParseStatus = class _ParseStatus {
  constructor() {
    this.value = "valid";
  }
  dirty() {
    if (this.value === "valid")
      this.value = "dirty";
  }
  abort() {
    if (this.value !== "aborted")
      this.value = "aborted";
  }
  static mergeArray(status, results) {
    const arrayValue = [];
    for (const s of results) {
      if (s.status === "aborted")
        return INVALID;
      if (s.status === "dirty")
        status.dirty();
      arrayValue.push(s.value);
    }
    return { status: status.value, value: arrayValue };
  }
  static async mergeObjectAsync(status, pairs) {
    const syncPairs = [];
    for (const pair of pairs) {
      const key = await pair.key;
      const value = await pair.value;
      syncPairs.push({
        key,
        value
      });
    }
    return _ParseStatus.mergeObjectSync(status, syncPairs);
  }
  static mergeObjectSync(status, pairs) {
    const finalObject = {};
    for (const pair of pairs) {
      const { key, value } = pair;
      if (key.status === "aborted")
        return INVALID;
      if (value.status === "aborted")
        return INVALID;
      if (key.status === "dirty")
        status.dirty();
      if (value.status === "dirty")
        status.dirty();
      if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
        finalObject[key.value] = value.value;
      }
    }
    return { status: status.value, value: finalObject };
  }
};
var INVALID = Object.freeze({
  status: "aborted"
});
var DIRTY = (value) => ({ status: "dirty", value });
var OK = (value) => ({ status: "valid", value });
var isAborted = (x) => x.status === "aborted";
var isDirty = (x) => x.status === "dirty";
var isValid = (x) => x.status === "valid";
var isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;

// node_modules/zod/v3/helpers/errorUtil.js
var errorUtil;
(function(errorUtil2) {
  errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
  errorUtil2.toString = (message) => typeof message === "string" ? message : message?.message;
})(errorUtil || (errorUtil = {}));

// node_modules/zod/v3/types.js
var ParseInputLazyPath = class {
  constructor(parent, value, path, key) {
    this._cachedPath = [];
    this.parent = parent;
    this.data = value;
    this._path = path;
    this._key = key;
  }
  get path() {
    if (!this._cachedPath.length) {
      if (Array.isArray(this._key)) {
        this._cachedPath.push(...this._path, ...this._key);
      } else {
        this._cachedPath.push(...this._path, this._key);
      }
    }
    return this._cachedPath;
  }
};
var handleResult = (ctx, result) => {
  if (isValid(result)) {
    return { success: true, data: result.value };
  } else {
    if (!ctx.common.issues.length) {
      throw new Error("Validation failed but no issues detected.");
    }
    return {
      success: false,
      get error() {
        if (this._error)
          return this._error;
        const error = new ZodError(ctx.common.issues);
        this._error = error;
        return this._error;
      }
    };
  }
};
function processCreateParams(params) {
  if (!params)
    return {};
  const { errorMap: errorMap2, invalid_type_error, required_error, description } = params;
  if (errorMap2 && (invalid_type_error || required_error)) {
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  }
  if (errorMap2)
    return { errorMap: errorMap2, description };
  const customMap = (iss, ctx) => {
    const { message } = params;
    if (iss.code === "invalid_enum_value") {
      return { message: message ?? ctx.defaultError };
    }
    if (typeof ctx.data === "undefined") {
      return { message: message ?? required_error ?? ctx.defaultError };
    }
    if (iss.code !== "invalid_type")
      return { message: ctx.defaultError };
    return { message: message ?? invalid_type_error ?? ctx.defaultError };
  };
  return { errorMap: customMap, description };
}
var ZodType = class {
  get description() {
    return this._def.description;
  }
  _getType(input) {
    return getParsedType(input.data);
  }
  _getOrReturnCtx(input, ctx) {
    return ctx || {
      common: input.parent.common,
      data: input.data,
      parsedType: getParsedType(input.data),
      schemaErrorMap: this._def.errorMap,
      path: input.path,
      parent: input.parent
    };
  }
  _processInputParams(input) {
    return {
      status: new ParseStatus(),
      ctx: {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent
      }
    };
  }
  _parseSync(input) {
    const result = this._parse(input);
    if (isAsync(result)) {
      throw new Error("Synchronous parse encountered promise.");
    }
    return result;
  }
  _parseAsync(input) {
    const result = this._parse(input);
    return Promise.resolve(result);
  }
  parse(data, params) {
    const result = this.safeParse(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  safeParse(data, params) {
    const ctx = {
      common: {
        issues: [],
        async: params?.async ?? false,
        contextualErrorMap: params?.errorMap
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const result = this._parseSync({ data, path: ctx.path, parent: ctx });
    return handleResult(ctx, result);
  }
  "~validate"(data) {
    const ctx = {
      common: {
        issues: [],
        async: !!this["~standard"].async
      },
      path: [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    if (!this["~standard"].async) {
      try {
        const result = this._parseSync({ data, path: [], parent: ctx });
        return isValid(result) ? {
          value: result.value
        } : {
          issues: ctx.common.issues
        };
      } catch (err) {
        if (err?.message?.toLowerCase()?.includes("encountered")) {
          this["~standard"].async = true;
        }
        ctx.common = {
          issues: [],
          async: true
        };
      }
    }
    return this._parseAsync({ data, path: [], parent: ctx }).then((result) => isValid(result) ? {
      value: result.value
    } : {
      issues: ctx.common.issues
    });
  }
  async parseAsync(data, params) {
    const result = await this.safeParseAsync(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  async safeParseAsync(data, params) {
    const ctx = {
      common: {
        issues: [],
        contextualErrorMap: params?.errorMap,
        async: true
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
    const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
    return handleResult(ctx, result);
  }
  refine(check, message) {
    const getIssueProperties = (val) => {
      if (typeof message === "string" || typeof message === "undefined") {
        return { message };
      } else if (typeof message === "function") {
        return message(val);
      } else {
        return message;
      }
    };
    return this._refinement((val, ctx) => {
      const result = check(val);
      const setError = () => ctx.addIssue({
        code: ZodIssueCode.custom,
        ...getIssueProperties(val)
      });
      if (typeof Promise !== "undefined" && result instanceof Promise) {
        return result.then((data) => {
          if (!data) {
            setError();
            return false;
          } else {
            return true;
          }
        });
      }
      if (!result) {
        setError();
        return false;
      } else {
        return true;
      }
    });
  }
  refinement(check, refinementData) {
    return this._refinement((val, ctx) => {
      if (!check(val)) {
        ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
        return false;
      } else {
        return true;
      }
    });
  }
  _refinement(refinement) {
    return new ZodEffects({
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "refinement", refinement }
    });
  }
  superRefine(refinement) {
    return this._refinement(refinement);
  }
  constructor(def) {
    this.spa = this.safeParseAsync;
    this._def = def;
    this.parse = this.parse.bind(this);
    this.safeParse = this.safeParse.bind(this);
    this.parseAsync = this.parseAsync.bind(this);
    this.safeParseAsync = this.safeParseAsync.bind(this);
    this.spa = this.spa.bind(this);
    this.refine = this.refine.bind(this);
    this.refinement = this.refinement.bind(this);
    this.superRefine = this.superRefine.bind(this);
    this.optional = this.optional.bind(this);
    this.nullable = this.nullable.bind(this);
    this.nullish = this.nullish.bind(this);
    this.array = this.array.bind(this);
    this.promise = this.promise.bind(this);
    this.or = this.or.bind(this);
    this.and = this.and.bind(this);
    this.transform = this.transform.bind(this);
    this.brand = this.brand.bind(this);
    this.default = this.default.bind(this);
    this.catch = this.catch.bind(this);
    this.describe = this.describe.bind(this);
    this.pipe = this.pipe.bind(this);
    this.readonly = this.readonly.bind(this);
    this.isNullable = this.isNullable.bind(this);
    this.isOptional = this.isOptional.bind(this);
    this["~standard"] = {
      version: 1,
      vendor: "zod",
      validate: (data) => this["~validate"](data)
    };
  }
  optional() {
    return ZodOptional.create(this, this._def);
  }
  nullable() {
    return ZodNullable.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return ZodArray.create(this);
  }
  promise() {
    return ZodPromise.create(this, this._def);
  }
  or(option) {
    return ZodUnion.create([this, option], this._def);
  }
  and(incoming) {
    return ZodIntersection.create(this, incoming, this._def);
  }
  transform(transform) {
    return new ZodEffects({
      ...processCreateParams(this._def),
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "transform", transform }
    });
  }
  default(def) {
    const defaultValueFunc = typeof def === "function" ? def : () => def;
    return new ZodDefault({
      ...processCreateParams(this._def),
      innerType: this,
      defaultValue: defaultValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodDefault
    });
  }
  brand() {
    return new ZodBranded({
      typeName: ZodFirstPartyTypeKind.ZodBranded,
      type: this,
      ...processCreateParams(this._def)
    });
  }
  catch(def) {
    const catchValueFunc = typeof def === "function" ? def : () => def;
    return new ZodCatch({
      ...processCreateParams(this._def),
      innerType: this,
      catchValue: catchValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodCatch
    });
  }
  describe(description) {
    const This = this.constructor;
    return new This({
      ...this._def,
      description
    });
  }
  pipe(target) {
    return ZodPipeline.create(this, target);
  }
  readonly() {
    return ZodReadonly.create(this);
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
};
var cuidRegex = /^c[^\s-]{8,}$/i;
var cuid2Regex = /^[0-9a-z]+$/;
var ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
var uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
var nanoidRegex = /^[a-z0-9_-]{21}$/i;
var jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
var durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
var emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
var _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
var emojiRegex;
var ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
var ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
var ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
var base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
var dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
var dateRegex = new RegExp(`^${dateRegexSource}$`);
function timeRegexSource(args) {
  let secondsRegexSource = `[0-5]\\d`;
  if (args.precision) {
    secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
  } else if (args.precision == null) {
    secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
  }
  const secondsQuantifier = args.precision ? "+" : "?";
  return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
}
function timeRegex(args) {
  return new RegExp(`^${timeRegexSource(args)}$`);
}
function datetimeRegex(args) {
  let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
  const opts = [];
  opts.push(args.local ? `Z?` : `Z`);
  if (args.offset)
    opts.push(`([+-]\\d{2}:?\\d{2})`);
  regex = `${regex}(${opts.join("|")})`;
  return new RegExp(`^${regex}$`);
}
function isValidIP(ip, version) {
  if ((version === "v4" || !version) && ipv4Regex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6Regex.test(ip)) {
    return true;
  }
  return false;
}
function isValidJWT(jwt, alg) {
  if (!jwtRegex.test(jwt))
    return false;
  try {
    const [header] = jwt.split(".");
    if (!header)
      return false;
    const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
    const decoded = JSON.parse(atob(base64));
    if (typeof decoded !== "object" || decoded === null)
      return false;
    if ("typ" in decoded && decoded?.typ !== "JWT")
      return false;
    if (!decoded.alg)
      return false;
    if (alg && decoded.alg !== alg)
      return false;
    return true;
  } catch {
    return false;
  }
}
function isValidCidr(ip, version) {
  if ((version === "v4" || !version) && ipv4CidrRegex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6CidrRegex.test(ip)) {
    return true;
  }
  return false;
}
var ZodString = class _ZodString extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = String(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.string) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.string,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.length < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.length > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "length") {
        const tooBig = input.data.length > check.value;
        const tooSmall = input.data.length < check.value;
        if (tooBig || tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          if (tooBig) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          } else if (tooSmall) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          }
          status.dirty();
        }
      } else if (check.kind === "email") {
        if (!emailRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "email",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "emoji") {
        if (!emojiRegex) {
          emojiRegex = new RegExp(_emojiRegex, "u");
        }
        if (!emojiRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "emoji",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "uuid") {
        if (!uuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "uuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "nanoid") {
        if (!nanoidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "nanoid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid") {
        if (!cuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid2") {
        if (!cuid2Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid2",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ulid") {
        if (!ulidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ulid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "url") {
        try {
          new URL(input.data);
        } catch {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "regex") {
        check.regex.lastIndex = 0;
        const testResult = check.regex.test(input.data);
        if (!testResult) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "regex",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "trim") {
        input.data = input.data.trim();
      } else if (check.kind === "includes") {
        if (!input.data.includes(check.value, check.position)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { includes: check.value, position: check.position },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "toLowerCase") {
        input.data = input.data.toLowerCase();
      } else if (check.kind === "toUpperCase") {
        input.data = input.data.toUpperCase();
      } else if (check.kind === "startsWith") {
        if (!input.data.startsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { startsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "endsWith") {
        if (!input.data.endsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { endsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "datetime") {
        const regex = datetimeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "datetime",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "date") {
        const regex = dateRegex;
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "date",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "time") {
        const regex = timeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "time",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "duration") {
        if (!durationRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "duration",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ip") {
        if (!isValidIP(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ip",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "jwt") {
        if (!isValidJWT(input.data, check.alg)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "jwt",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cidr") {
        if (!isValidCidr(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cidr",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64") {
        if (!base64Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64url") {
        if (!base64urlRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _regex(regex, validation, message) {
    return this.refinement((data) => regex.test(data), {
      validation,
      code: ZodIssueCode.invalid_string,
      ...errorUtil.errToObj(message)
    });
  }
  _addCheck(check) {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  email(message) {
    return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
  }
  url(message) {
    return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
  }
  emoji(message) {
    return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
  }
  uuid(message) {
    return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
  }
  nanoid(message) {
    return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
  }
  cuid(message) {
    return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
  }
  cuid2(message) {
    return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
  }
  ulid(message) {
    return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
  }
  base64(message) {
    return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
  }
  base64url(message) {
    return this._addCheck({
      kind: "base64url",
      ...errorUtil.errToObj(message)
    });
  }
  jwt(options) {
    return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options) });
  }
  ip(options) {
    return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
  }
  cidr(options) {
    return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options) });
  }
  datetime(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "datetime",
        precision: null,
        offset: false,
        local: false,
        message: options
      });
    }
    return this._addCheck({
      kind: "datetime",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      offset: options?.offset ?? false,
      local: options?.local ?? false,
      ...errorUtil.errToObj(options?.message)
    });
  }
  date(message) {
    return this._addCheck({ kind: "date", message });
  }
  time(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "time",
        precision: null,
        message: options
      });
    }
    return this._addCheck({
      kind: "time",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      ...errorUtil.errToObj(options?.message)
    });
  }
  duration(message) {
    return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
  }
  regex(regex, message) {
    return this._addCheck({
      kind: "regex",
      regex,
      ...errorUtil.errToObj(message)
    });
  }
  includes(value, options) {
    return this._addCheck({
      kind: "includes",
      value,
      position: options?.position,
      ...errorUtil.errToObj(options?.message)
    });
  }
  startsWith(value, message) {
    return this._addCheck({
      kind: "startsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  endsWith(value, message) {
    return this._addCheck({
      kind: "endsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  min(minLength, message) {
    return this._addCheck({
      kind: "min",
      value: minLength,
      ...errorUtil.errToObj(message)
    });
  }
  max(maxLength, message) {
    return this._addCheck({
      kind: "max",
      value: maxLength,
      ...errorUtil.errToObj(message)
    });
  }
  length(len, message) {
    return this._addCheck({
      kind: "length",
      value: len,
      ...errorUtil.errToObj(message)
    });
  }
  /**
   * Equivalent to `.min(1)`
   */
  nonempty(message) {
    return this.min(1, errorUtil.errToObj(message));
  }
  trim() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toUpperCase" }]
    });
  }
  get isDatetime() {
    return !!this._def.checks.find((ch) => ch.kind === "datetime");
  }
  get isDate() {
    return !!this._def.checks.find((ch) => ch.kind === "date");
  }
  get isTime() {
    return !!this._def.checks.find((ch) => ch.kind === "time");
  }
  get isDuration() {
    return !!this._def.checks.find((ch) => ch.kind === "duration");
  }
  get isEmail() {
    return !!this._def.checks.find((ch) => ch.kind === "email");
  }
  get isURL() {
    return !!this._def.checks.find((ch) => ch.kind === "url");
  }
  get isEmoji() {
    return !!this._def.checks.find((ch) => ch.kind === "emoji");
  }
  get isUUID() {
    return !!this._def.checks.find((ch) => ch.kind === "uuid");
  }
  get isNANOID() {
    return !!this._def.checks.find((ch) => ch.kind === "nanoid");
  }
  get isCUID() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid");
  }
  get isCUID2() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid2");
  }
  get isULID() {
    return !!this._def.checks.find((ch) => ch.kind === "ulid");
  }
  get isIP() {
    return !!this._def.checks.find((ch) => ch.kind === "ip");
  }
  get isCIDR() {
    return !!this._def.checks.find((ch) => ch.kind === "cidr");
  }
  get isBase64() {
    return !!this._def.checks.find((ch) => ch.kind === "base64");
  }
  get isBase64url() {
    return !!this._def.checks.find((ch) => ch.kind === "base64url");
  }
  get minLength() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxLength() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodString.create = (params) => {
  return new ZodString({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodString,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
function floatSafeRemainder(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepDecCount = (step.toString().split(".")[1] || "").length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / 10 ** decCount;
}
var ZodNumber = class _ZodNumber extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
    this.step = this.multipleOf;
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = Number(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.number) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.number,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "int") {
        if (!util.isInteger(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: "integer",
            received: "float",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (floatSafeRemainder(input.data, check.value) !== 0) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "finite") {
        if (!Number.isFinite(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_finite,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodNumber({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodNumber({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  int(message) {
    return this._addCheck({
      kind: "int",
      message: errorUtil.toString(message)
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  finite(message) {
    return this._addCheck({
      kind: "finite",
      message: errorUtil.toString(message)
    });
  }
  safe(message) {
    return this._addCheck({
      kind: "min",
      inclusive: true,
      value: Number.MIN_SAFE_INTEGER,
      message: errorUtil.toString(message)
    })._addCheck({
      kind: "max",
      inclusive: true,
      value: Number.MAX_SAFE_INTEGER,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
  get isInt() {
    return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
  }
  get isFinite() {
    let max = null;
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
        return true;
      } else if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      } else if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return Number.isFinite(min) && Number.isFinite(max);
  }
};
ZodNumber.create = (params) => {
  return new ZodNumber({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodNumber,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
var ZodBigInt = class _ZodBigInt extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
  }
  _parse(input) {
    if (this._def.coerce) {
      try {
        input.data = BigInt(input.data);
      } catch {
        return this._getInvalidInput(input);
      }
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.bigint) {
      return this._getInvalidInput(input);
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            type: "bigint",
            minimum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            type: "bigint",
            maximum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (input.data % check.value !== BigInt(0)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _getInvalidInput(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.bigint,
      received: ctx.parsedType
    });
    return INVALID;
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodBigInt({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodBigInt({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodBigInt.create = (params) => {
  return new ZodBigInt({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodBigInt,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
var ZodBoolean = class extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = Boolean(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.boolean) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.boolean,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodBoolean.create = (params) => {
  return new ZodBoolean({
    typeName: ZodFirstPartyTypeKind.ZodBoolean,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
var ZodDate = class _ZodDate extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = new Date(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.date) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.date,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    if (Number.isNaN(input.data.getTime())) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_date
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.getTime() < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            message: check.message,
            inclusive: true,
            exact: false,
            minimum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.getTime() > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            message: check.message,
            inclusive: true,
            exact: false,
            maximum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return {
      status: status.value,
      value: new Date(input.data.getTime())
    };
  }
  _addCheck(check) {
    return new _ZodDate({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  min(minDate, message) {
    return this._addCheck({
      kind: "min",
      value: minDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  max(maxDate, message) {
    return this._addCheck({
      kind: "max",
      value: maxDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  get minDate() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min != null ? new Date(min) : null;
  }
  get maxDate() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max != null ? new Date(max) : null;
  }
};
ZodDate.create = (params) => {
  return new ZodDate({
    checks: [],
    coerce: params?.coerce || false,
    typeName: ZodFirstPartyTypeKind.ZodDate,
    ...processCreateParams(params)
  });
};
var ZodSymbol = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.symbol) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.symbol,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodSymbol.create = (params) => {
  return new ZodSymbol({
    typeName: ZodFirstPartyTypeKind.ZodSymbol,
    ...processCreateParams(params)
  });
};
var ZodUndefined = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.undefined,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodUndefined.create = (params) => {
  return new ZodUndefined({
    typeName: ZodFirstPartyTypeKind.ZodUndefined,
    ...processCreateParams(params)
  });
};
var ZodNull = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.null) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.null,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodNull.create = (params) => {
  return new ZodNull({
    typeName: ZodFirstPartyTypeKind.ZodNull,
    ...processCreateParams(params)
  });
};
var ZodAny = class extends ZodType {
  constructor() {
    super(...arguments);
    this._any = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodAny.create = (params) => {
  return new ZodAny({
    typeName: ZodFirstPartyTypeKind.ZodAny,
    ...processCreateParams(params)
  });
};
var ZodUnknown = class extends ZodType {
  constructor() {
    super(...arguments);
    this._unknown = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodUnknown.create = (params) => {
  return new ZodUnknown({
    typeName: ZodFirstPartyTypeKind.ZodUnknown,
    ...processCreateParams(params)
  });
};
var ZodNever = class extends ZodType {
  _parse(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.never,
      received: ctx.parsedType
    });
    return INVALID;
  }
};
ZodNever.create = (params) => {
  return new ZodNever({
    typeName: ZodFirstPartyTypeKind.ZodNever,
    ...processCreateParams(params)
  });
};
var ZodVoid = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.void,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodVoid.create = (params) => {
  return new ZodVoid({
    typeName: ZodFirstPartyTypeKind.ZodVoid,
    ...processCreateParams(params)
  });
};
var ZodArray = class _ZodArray extends ZodType {
  _parse(input) {
    const { ctx, status } = this._processInputParams(input);
    const def = this._def;
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (def.exactLength !== null) {
      const tooBig = ctx.data.length > def.exactLength.value;
      const tooSmall = ctx.data.length < def.exactLength.value;
      if (tooBig || tooSmall) {
        addIssueToContext(ctx, {
          code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
          minimum: tooSmall ? def.exactLength.value : void 0,
          maximum: tooBig ? def.exactLength.value : void 0,
          type: "array",
          inclusive: true,
          exact: true,
          message: def.exactLength.message
        });
        status.dirty();
      }
    }
    if (def.minLength !== null) {
      if (ctx.data.length < def.minLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.minLength.message
        });
        status.dirty();
      }
    }
    if (def.maxLength !== null) {
      if (ctx.data.length > def.maxLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.maxLength.message
        });
        status.dirty();
      }
    }
    if (ctx.common.async) {
      return Promise.all([...ctx.data].map((item, i) => {
        return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
      })).then((result2) => {
        return ParseStatus.mergeArray(status, result2);
      });
    }
    const result = [...ctx.data].map((item, i) => {
      return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
    });
    return ParseStatus.mergeArray(status, result);
  }
  get element() {
    return this._def.type;
  }
  min(minLength, message) {
    return new _ZodArray({
      ...this._def,
      minLength: { value: minLength, message: errorUtil.toString(message) }
    });
  }
  max(maxLength, message) {
    return new _ZodArray({
      ...this._def,
      maxLength: { value: maxLength, message: errorUtil.toString(message) }
    });
  }
  length(len, message) {
    return new _ZodArray({
      ...this._def,
      exactLength: { value: len, message: errorUtil.toString(message) }
    });
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodArray.create = (schema, params) => {
  return new ZodArray({
    type: schema,
    minLength: null,
    maxLength: null,
    exactLength: null,
    typeName: ZodFirstPartyTypeKind.ZodArray,
    ...processCreateParams(params)
  });
};
function deepPartialify(schema) {
  if (schema instanceof ZodObject) {
    const newShape = {};
    for (const key in schema.shape) {
      const fieldSchema = schema.shape[key];
      newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
    }
    return new ZodObject({
      ...schema._def,
      shape: () => newShape
    });
  } else if (schema instanceof ZodArray) {
    return new ZodArray({
      ...schema._def,
      type: deepPartialify(schema.element)
    });
  } else if (schema instanceof ZodOptional) {
    return ZodOptional.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodNullable) {
    return ZodNullable.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodTuple) {
    return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
  } else {
    return schema;
  }
}
var ZodObject = class _ZodObject extends ZodType {
  constructor() {
    super(...arguments);
    this._cached = null;
    this.nonstrict = this.passthrough;
    this.augment = this.extend;
  }
  _getCached() {
    if (this._cached !== null)
      return this._cached;
    const shape = this._def.shape();
    const keys = util.objectKeys(shape);
    this._cached = { shape, keys };
    return this._cached;
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.object) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const { status, ctx } = this._processInputParams(input);
    const { shape, keys: shapeKeys } = this._getCached();
    const extraKeys = [];
    if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
      for (const key in ctx.data) {
        if (!shapeKeys.includes(key)) {
          extraKeys.push(key);
        }
      }
    }
    const pairs = [];
    for (const key of shapeKeys) {
      const keyValidator = shape[key];
      const value = ctx.data[key];
      pairs.push({
        key: { status: "valid", value: key },
        value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (this._def.catchall instanceof ZodNever) {
      const unknownKeys = this._def.unknownKeys;
      if (unknownKeys === "passthrough") {
        for (const key of extraKeys) {
          pairs.push({
            key: { status: "valid", value: key },
            value: { status: "valid", value: ctx.data[key] }
          });
        }
      } else if (unknownKeys === "strict") {
        if (extraKeys.length > 0) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.unrecognized_keys,
            keys: extraKeys
          });
          status.dirty();
        }
      } else if (unknownKeys === "strip") {
      } else {
        throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
      }
    } else {
      const catchall = this._def.catchall;
      for (const key of extraKeys) {
        const value = ctx.data[key];
        pairs.push({
          key: { status: "valid", value: key },
          value: catchall._parse(
            new ParseInputLazyPath(ctx, value, ctx.path, key)
            //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: key in ctx.data
        });
      }
    }
    if (ctx.common.async) {
      return Promise.resolve().then(async () => {
        const syncPairs = [];
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          syncPairs.push({
            key,
            value,
            alwaysSet: pair.alwaysSet
          });
        }
        return syncPairs;
      }).then((syncPairs) => {
        return ParseStatus.mergeObjectSync(status, syncPairs);
      });
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get shape() {
    return this._def.shape();
  }
  strict(message) {
    errorUtil.errToObj;
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strict",
      ...message !== void 0 ? {
        errorMap: (issue, ctx) => {
          const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
          if (issue.code === "unrecognized_keys")
            return {
              message: errorUtil.errToObj(message).message ?? defaultError
            };
          return {
            message: defaultError
          };
        }
      } : {}
    });
  }
  strip() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "passthrough"
    });
  }
  // const AugmentFactory =
  //   <Def extends ZodObjectDef>(def: Def) =>
  //   <Augmentation extends ZodRawShape>(
  //     augmentation: Augmentation
  //   ): ZodObject<
  //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
  //     Def["unknownKeys"],
  //     Def["catchall"]
  //   > => {
  //     return new ZodObject({
  //       ...def,
  //       shape: () => ({
  //         ...def.shape(),
  //         ...augmentation,
  //       }),
  //     }) as any;
  //   };
  extend(augmentation) {
    return new _ZodObject({
      ...this._def,
      shape: () => ({
        ...this._def.shape(),
        ...augmentation
      })
    });
  }
  /**
   * Prior to zod@1.0.12 there was a bug in the
   * inferred type of merged objects. Please
   * upgrade if you are experiencing issues.
   */
  merge(merging) {
    const merged = new _ZodObject({
      unknownKeys: merging._def.unknownKeys,
      catchall: merging._def.catchall,
      shape: () => ({
        ...this._def.shape(),
        ...merging._def.shape()
      }),
      typeName: ZodFirstPartyTypeKind.ZodObject
    });
    return merged;
  }
  // merge<
  //   Incoming extends AnyZodObject,
  //   Augmentation extends Incoming["shape"],
  //   NewOutput extends {
  //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
  //       ? Augmentation[k]["_output"]
  //       : k extends keyof Output
  //       ? Output[k]
  //       : never;
  //   },
  //   NewInput extends {
  //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
  //       ? Augmentation[k]["_input"]
  //       : k extends keyof Input
  //       ? Input[k]
  //       : never;
  //   }
  // >(
  //   merging: Incoming
  // ): ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"],
  //   NewOutput,
  //   NewInput
  // > {
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  setKey(key, schema) {
    return this.augment({ [key]: schema });
  }
  // merge<Incoming extends AnyZodObject>(
  //   merging: Incoming
  // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
  // ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"]
  // > {
  //   // const mergedShape = objectUtil.mergeShapes(
  //   //   this._def.shape(),
  //   //   merging._def.shape()
  //   // );
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  catchall(index) {
    return new _ZodObject({
      ...this._def,
      catchall: index
    });
  }
  pick(mask) {
    const shape = {};
    for (const key of util.objectKeys(mask)) {
      if (mask[key] && this.shape[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  omit(mask) {
    const shape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (!mask[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  /**
   * @deprecated
   */
  deepPartial() {
    return deepPartialify(this);
  }
  partial(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      const fieldSchema = this.shape[key];
      if (mask && !mask[key]) {
        newShape[key] = fieldSchema;
      } else {
        newShape[key] = fieldSchema.optional();
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  required(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (mask && !mask[key]) {
        newShape[key] = this.shape[key];
      } else {
        const fieldSchema = this.shape[key];
        let newField = fieldSchema;
        while (newField instanceof ZodOptional) {
          newField = newField._def.innerType;
        }
        newShape[key] = newField;
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  keyof() {
    return createZodEnum(util.objectKeys(this.shape));
  }
};
ZodObject.create = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.strictCreate = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strict",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.lazycreate = (shape, params) => {
  return new ZodObject({
    shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
var ZodUnion = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const options = this._def.options;
    function handleResults(results) {
      for (const result of results) {
        if (result.result.status === "valid") {
          return result.result;
        }
      }
      for (const result of results) {
        if (result.result.status === "dirty") {
          ctx.common.issues.push(...result.ctx.common.issues);
          return result.result;
        }
      }
      const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return Promise.all(options.map(async (option) => {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        return {
          result: await option._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: childCtx
          }),
          ctx: childCtx
        };
      })).then(handleResults);
    } else {
      let dirty = void 0;
      const issues = [];
      for (const option of options) {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        const result = option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: childCtx
        });
        if (result.status === "valid") {
          return result;
        } else if (result.status === "dirty" && !dirty) {
          dirty = { result, ctx: childCtx };
        }
        if (childCtx.common.issues.length) {
          issues.push(childCtx.common.issues);
        }
      }
      if (dirty) {
        ctx.common.issues.push(...dirty.ctx.common.issues);
        return dirty.result;
      }
      const unionErrors = issues.map((issues2) => new ZodError(issues2));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
  }
  get options() {
    return this._def.options;
  }
};
ZodUnion.create = (types, params) => {
  return new ZodUnion({
    options: types,
    typeName: ZodFirstPartyTypeKind.ZodUnion,
    ...processCreateParams(params)
  });
};
var getDiscriminator = (type) => {
  if (type instanceof ZodLazy) {
    return getDiscriminator(type.schema);
  } else if (type instanceof ZodEffects) {
    return getDiscriminator(type.innerType());
  } else if (type instanceof ZodLiteral) {
    return [type.value];
  } else if (type instanceof ZodEnum) {
    return type.options;
  } else if (type instanceof ZodNativeEnum) {
    return util.objectValues(type.enum);
  } else if (type instanceof ZodDefault) {
    return getDiscriminator(type._def.innerType);
  } else if (type instanceof ZodUndefined) {
    return [void 0];
  } else if (type instanceof ZodNull) {
    return [null];
  } else if (type instanceof ZodOptional) {
    return [void 0, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodNullable) {
    return [null, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodBranded) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodReadonly) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodCatch) {
    return getDiscriminator(type._def.innerType);
  } else {
    return [];
  }
};
var ZodDiscriminatedUnion = class _ZodDiscriminatedUnion extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const discriminator = this.discriminator;
    const discriminatorValue = ctx.data[discriminator];
    const option = this.optionsMap.get(discriminatorValue);
    if (!option) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union_discriminator,
        options: Array.from(this.optionsMap.keys()),
        path: [discriminator]
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return option._parseAsync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    } else {
      return option._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    }
  }
  get discriminator() {
    return this._def.discriminator;
  }
  get options() {
    return this._def.options;
  }
  get optionsMap() {
    return this._def.optionsMap;
  }
  /**
   * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
   * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
   * have a different value for each object in the union.
   * @param discriminator the name of the discriminator property
   * @param types an array of object schemas
   * @param params
   */
  static create(discriminator, options, params) {
    const optionsMap = /* @__PURE__ */ new Map();
    for (const type of options) {
      const discriminatorValues = getDiscriminator(type.shape[discriminator]);
      if (!discriminatorValues.length) {
        throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
      }
      for (const value of discriminatorValues) {
        if (optionsMap.has(value)) {
          throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
        }
        optionsMap.set(value, type);
      }
    }
    return new _ZodDiscriminatedUnion({
      typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
      discriminator,
      options,
      optionsMap,
      ...processCreateParams(params)
    });
  }
};
function mergeValues(a, b) {
  const aType = getParsedType(a);
  const bType = getParsedType(b);
  if (a === b) {
    return { valid: true, data: a };
  } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
    const bKeys = util.objectKeys(b);
    const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
    if (a.length !== b.length) {
      return { valid: false };
    }
    const newArray = [];
    for (let index = 0; index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
    return { valid: true, data: a };
  } else {
    return { valid: false };
  }
}
var ZodIntersection = class extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const handleParsed = (parsedLeft, parsedRight) => {
      if (isAborted(parsedLeft) || isAborted(parsedRight)) {
        return INVALID;
      }
      const merged = mergeValues(parsedLeft.value, parsedRight.value);
      if (!merged.valid) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_intersection_types
        });
        return INVALID;
      }
      if (isDirty(parsedLeft) || isDirty(parsedRight)) {
        status.dirty();
      }
      return { status: status.value, value: merged.data };
    };
    if (ctx.common.async) {
      return Promise.all([
        this._def.left._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }),
        this._def.right._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        })
      ]).then(([left, right]) => handleParsed(left, right));
    } else {
      return handleParsed(this._def.left._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }), this._def.right._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }));
    }
  }
};
ZodIntersection.create = (left, right, params) => {
  return new ZodIntersection({
    left,
    right,
    typeName: ZodFirstPartyTypeKind.ZodIntersection,
    ...processCreateParams(params)
  });
};
var ZodTuple = class _ZodTuple extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (ctx.data.length < this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        minimum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      return INVALID;
    }
    const rest = this._def.rest;
    if (!rest && ctx.data.length > this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_big,
        maximum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      status.dirty();
    }
    const items = [...ctx.data].map((item, itemIndex) => {
      const schema = this._def.items[itemIndex] || this._def.rest;
      if (!schema)
        return null;
      return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
    }).filter((x) => !!x);
    if (ctx.common.async) {
      return Promise.all(items).then((results) => {
        return ParseStatus.mergeArray(status, results);
      });
    } else {
      return ParseStatus.mergeArray(status, items);
    }
  }
  get items() {
    return this._def.items;
  }
  rest(rest) {
    return new _ZodTuple({
      ...this._def,
      rest
    });
  }
};
ZodTuple.create = (schemas, params) => {
  if (!Array.isArray(schemas)) {
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  }
  return new ZodTuple({
    items: schemas,
    typeName: ZodFirstPartyTypeKind.ZodTuple,
    rest: null,
    ...processCreateParams(params)
  });
};
var ZodRecord = class _ZodRecord extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const pairs = [];
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    for (const key in ctx.data) {
      pairs.push({
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
        value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (ctx.common.async) {
      return ParseStatus.mergeObjectAsync(status, pairs);
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get element() {
    return this._def.valueType;
  }
  static create(first, second, third) {
    if (second instanceof ZodType) {
      return new _ZodRecord({
        keyType: first,
        valueType: second,
        typeName: ZodFirstPartyTypeKind.ZodRecord,
        ...processCreateParams(third)
      });
    }
    return new _ZodRecord({
      keyType: ZodString.create(),
      valueType: first,
      typeName: ZodFirstPartyTypeKind.ZodRecord,
      ...processCreateParams(second)
    });
  }
};
var ZodMap = class extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.map) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.map,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    const pairs = [...ctx.data.entries()].map(([key, value], index) => {
      return {
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
        value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
      };
    });
    if (ctx.common.async) {
      const finalMap = /* @__PURE__ */ new Map();
      return Promise.resolve().then(async () => {
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          if (key.status === "aborted" || value.status === "aborted") {
            return INVALID;
          }
          if (key.status === "dirty" || value.status === "dirty") {
            status.dirty();
          }
          finalMap.set(key.value, value.value);
        }
        return { status: status.value, value: finalMap };
      });
    } else {
      const finalMap = /* @__PURE__ */ new Map();
      for (const pair of pairs) {
        const key = pair.key;
        const value = pair.value;
        if (key.status === "aborted" || value.status === "aborted") {
          return INVALID;
        }
        if (key.status === "dirty" || value.status === "dirty") {
          status.dirty();
        }
        finalMap.set(key.value, value.value);
      }
      return { status: status.value, value: finalMap };
    }
  }
};
ZodMap.create = (keyType, valueType, params) => {
  return new ZodMap({
    valueType,
    keyType,
    typeName: ZodFirstPartyTypeKind.ZodMap,
    ...processCreateParams(params)
  });
};
var ZodSet = class _ZodSet extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.set) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.set,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const def = this._def;
    if (def.minSize !== null) {
      if (ctx.data.size < def.minSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.minSize.message
        });
        status.dirty();
      }
    }
    if (def.maxSize !== null) {
      if (ctx.data.size > def.maxSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.maxSize.message
        });
        status.dirty();
      }
    }
    const valueType = this._def.valueType;
    function finalizeSet(elements2) {
      const parsedSet = /* @__PURE__ */ new Set();
      for (const element of elements2) {
        if (element.status === "aborted")
          return INVALID;
        if (element.status === "dirty")
          status.dirty();
        parsedSet.add(element.value);
      }
      return { status: status.value, value: parsedSet };
    }
    const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
    if (ctx.common.async) {
      return Promise.all(elements).then((elements2) => finalizeSet(elements2));
    } else {
      return finalizeSet(elements);
    }
  }
  min(minSize, message) {
    return new _ZodSet({
      ...this._def,
      minSize: { value: minSize, message: errorUtil.toString(message) }
    });
  }
  max(maxSize, message) {
    return new _ZodSet({
      ...this._def,
      maxSize: { value: maxSize, message: errorUtil.toString(message) }
    });
  }
  size(size, message) {
    return this.min(size, message).max(size, message);
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodSet.create = (valueType, params) => {
  return new ZodSet({
    valueType,
    minSize: null,
    maxSize: null,
    typeName: ZodFirstPartyTypeKind.ZodSet,
    ...processCreateParams(params)
  });
};
var ZodFunction = class _ZodFunction extends ZodType {
  constructor() {
    super(...arguments);
    this.validate = this.implement;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.function) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.function,
        received: ctx.parsedType
      });
      return INVALID;
    }
    function makeArgsIssue(args, error) {
      return makeIssue({
        data: args,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_arguments,
          argumentsError: error
        }
      });
    }
    function makeReturnsIssue(returns, error) {
      return makeIssue({
        data: returns,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_return_type,
          returnTypeError: error
        }
      });
    }
    const params = { errorMap: ctx.common.contextualErrorMap };
    const fn = ctx.data;
    if (this._def.returns instanceof ZodPromise) {
      const me = this;
      return OK(async function(...args) {
        const error = new ZodError([]);
        const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
          error.addIssue(makeArgsIssue(args, e));
          throw error;
        });
        const result = await Reflect.apply(fn, this, parsedArgs);
        const parsedReturns = await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
          error.addIssue(makeReturnsIssue(result, e));
          throw error;
        });
        return parsedReturns;
      });
    } else {
      const me = this;
      return OK(function(...args) {
        const parsedArgs = me._def.args.safeParse(args, params);
        if (!parsedArgs.success) {
          throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
        }
        const result = Reflect.apply(fn, this, parsedArgs.data);
        const parsedReturns = me._def.returns.safeParse(result, params);
        if (!parsedReturns.success) {
          throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
        }
        return parsedReturns.data;
      });
    }
  }
  parameters() {
    return this._def.args;
  }
  returnType() {
    return this._def.returns;
  }
  args(...items) {
    return new _ZodFunction({
      ...this._def,
      args: ZodTuple.create(items).rest(ZodUnknown.create())
    });
  }
  returns(returnType) {
    return new _ZodFunction({
      ...this._def,
      returns: returnType
    });
  }
  implement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  strictImplement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  static create(args, returns, params) {
    return new _ZodFunction({
      args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
      returns: returns || ZodUnknown.create(),
      typeName: ZodFirstPartyTypeKind.ZodFunction,
      ...processCreateParams(params)
    });
  }
};
var ZodLazy = class extends ZodType {
  get schema() {
    return this._def.getter();
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const lazySchema = this._def.getter();
    return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
  }
};
ZodLazy.create = (getter, params) => {
  return new ZodLazy({
    getter,
    typeName: ZodFirstPartyTypeKind.ZodLazy,
    ...processCreateParams(params)
  });
};
var ZodLiteral = class extends ZodType {
  _parse(input) {
    if (input.data !== this._def.value) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_literal,
        expected: this._def.value
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
  get value() {
    return this._def.value;
  }
};
ZodLiteral.create = (value, params) => {
  return new ZodLiteral({
    value,
    typeName: ZodFirstPartyTypeKind.ZodLiteral,
    ...processCreateParams(params)
  });
};
function createZodEnum(values, params) {
  return new ZodEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodEnum,
    ...processCreateParams(params)
  });
}
var ZodEnum = class _ZodEnum extends ZodType {
  _parse(input) {
    if (typeof input.data !== "string") {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(this._def.values);
    }
    if (!this._cache.has(input.data)) {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get options() {
    return this._def.values;
  }
  get enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Values() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  extract(values, newDef = this._def) {
    return _ZodEnum.create(values, {
      ...this._def,
      ...newDef
    });
  }
  exclude(values, newDef = this._def) {
    return _ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
      ...this._def,
      ...newDef
    });
  }
};
ZodEnum.create = createZodEnum;
var ZodNativeEnum = class extends ZodType {
  _parse(input) {
    const nativeEnumValues = util.getValidEnumValues(this._def.values);
    const ctx = this._getOrReturnCtx(input);
    if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(util.getValidEnumValues(this._def.values));
    }
    if (!this._cache.has(input.data)) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get enum() {
    return this._def.values;
  }
};
ZodNativeEnum.create = (values, params) => {
  return new ZodNativeEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
    ...processCreateParams(params)
  });
};
var ZodPromise = class extends ZodType {
  unwrap() {
    return this._def.type;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.promise,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
    return OK(promisified.then((data) => {
      return this._def.type.parseAsync(data, {
        path: ctx.path,
        errorMap: ctx.common.contextualErrorMap
      });
    }));
  }
};
ZodPromise.create = (schema, params) => {
  return new ZodPromise({
    type: schema,
    typeName: ZodFirstPartyTypeKind.ZodPromise,
    ...processCreateParams(params)
  });
};
var ZodEffects = class extends ZodType {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const effect = this._def.effect || null;
    const checkCtx = {
      addIssue: (arg) => {
        addIssueToContext(ctx, arg);
        if (arg.fatal) {
          status.abort();
        } else {
          status.dirty();
        }
      },
      get path() {
        return ctx.path;
      }
    };
    checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
    if (effect.type === "preprocess") {
      const processed = effect.transform(ctx.data, checkCtx);
      if (ctx.common.async) {
        return Promise.resolve(processed).then(async (processed2) => {
          if (status.value === "aborted")
            return INVALID;
          const result = await this._def.schema._parseAsync({
            data: processed2,
            path: ctx.path,
            parent: ctx
          });
          if (result.status === "aborted")
            return INVALID;
          if (result.status === "dirty")
            return DIRTY(result.value);
          if (status.value === "dirty")
            return DIRTY(result.value);
          return result;
        });
      } else {
        if (status.value === "aborted")
          return INVALID;
        const result = this._def.schema._parseSync({
          data: processed,
          path: ctx.path,
          parent: ctx
        });
        if (result.status === "aborted")
          return INVALID;
        if (result.status === "dirty")
          return DIRTY(result.value);
        if (status.value === "dirty")
          return DIRTY(result.value);
        return result;
      }
    }
    if (effect.type === "refinement") {
      const executeRefinement = (acc) => {
        const result = effect.refinement(acc, checkCtx);
        if (ctx.common.async) {
          return Promise.resolve(result);
        }
        if (result instanceof Promise) {
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        }
        return acc;
      };
      if (ctx.common.async === false) {
        const inner = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inner.status === "aborted")
          return INVALID;
        if (inner.status === "dirty")
          status.dirty();
        executeRefinement(inner.value);
        return { status: status.value, value: inner.value };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
          if (inner.status === "aborted")
            return INVALID;
          if (inner.status === "dirty")
            status.dirty();
          return executeRefinement(inner.value).then(() => {
            return { status: status.value, value: inner.value };
          });
        });
      }
    }
    if (effect.type === "transform") {
      if (ctx.common.async === false) {
        const base = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (!isValid(base))
          return INVALID;
        const result = effect.transform(base.value, checkCtx);
        if (result instanceof Promise) {
          throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
        }
        return { status: status.value, value: result };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
          if (!isValid(base))
            return INVALID;
          return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
            status: status.value,
            value: result
          }));
        });
      }
    }
    util.assertNever(effect);
  }
};
ZodEffects.create = (schema, effect, params) => {
  return new ZodEffects({
    schema,
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    effect,
    ...processCreateParams(params)
  });
};
ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
  return new ZodEffects({
    schema,
    effect: { type: "preprocess", transform: preprocess },
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    ...processCreateParams(params)
  });
};
var ZodOptional = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.undefined) {
      return OK(void 0);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodOptional.create = (type, params) => {
  return new ZodOptional({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodOptional,
    ...processCreateParams(params)
  });
};
var ZodNullable = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.null) {
      return OK(null);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodNullable.create = (type, params) => {
  return new ZodNullable({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodNullable,
    ...processCreateParams(params)
  });
};
var ZodDefault = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    let data = ctx.data;
    if (ctx.parsedType === ZodParsedType.undefined) {
      data = this._def.defaultValue();
    }
    return this._def.innerType._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  removeDefault() {
    return this._def.innerType;
  }
};
ZodDefault.create = (type, params) => {
  return new ZodDefault({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodDefault,
    defaultValue: typeof params.default === "function" ? params.default : () => params.default,
    ...processCreateParams(params)
  });
};
var ZodCatch = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const newCtx = {
      ...ctx,
      common: {
        ...ctx.common,
        issues: []
      }
    };
    const result = this._def.innerType._parse({
      data: newCtx.data,
      path: newCtx.path,
      parent: {
        ...newCtx
      }
    });
    if (isAsync(result)) {
      return result.then((result2) => {
        return {
          status: "valid",
          value: result2.status === "valid" ? result2.value : this._def.catchValue({
            get error() {
              return new ZodError(newCtx.common.issues);
            },
            input: newCtx.data
          })
        };
      });
    } else {
      return {
        status: "valid",
        value: result.status === "valid" ? result.value : this._def.catchValue({
          get error() {
            return new ZodError(newCtx.common.issues);
          },
          input: newCtx.data
        })
      };
    }
  }
  removeCatch() {
    return this._def.innerType;
  }
};
ZodCatch.create = (type, params) => {
  return new ZodCatch({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodCatch,
    catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
    ...processCreateParams(params)
  });
};
var ZodNaN = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.nan) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.nan,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
};
ZodNaN.create = (params) => {
  return new ZodNaN({
    typeName: ZodFirstPartyTypeKind.ZodNaN,
    ...processCreateParams(params)
  });
};
var BRAND = Symbol("zod_brand");
var ZodBranded = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const data = ctx.data;
    return this._def.type._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  unwrap() {
    return this._def.type;
  }
};
var ZodPipeline = class _ZodPipeline extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.common.async) {
      const handleAsync = async () => {
        const inResult = await this._def.in._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inResult.status === "aborted")
          return INVALID;
        if (inResult.status === "dirty") {
          status.dirty();
          return DIRTY(inResult.value);
        } else {
          return this._def.out._parseAsync({
            data: inResult.value,
            path: ctx.path,
            parent: ctx
          });
        }
      };
      return handleAsync();
    } else {
      const inResult = this._def.in._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
      if (inResult.status === "aborted")
        return INVALID;
      if (inResult.status === "dirty") {
        status.dirty();
        return {
          status: "dirty",
          value: inResult.value
        };
      } else {
        return this._def.out._parseSync({
          data: inResult.value,
          path: ctx.path,
          parent: ctx
        });
      }
    }
  }
  static create(a, b) {
    return new _ZodPipeline({
      in: a,
      out: b,
      typeName: ZodFirstPartyTypeKind.ZodPipeline
    });
  }
};
var ZodReadonly = class extends ZodType {
  _parse(input) {
    const result = this._def.innerType._parse(input);
    const freeze = (data) => {
      if (isValid(data)) {
        data.value = Object.freeze(data.value);
      }
      return data;
    };
    return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodReadonly.create = (type, params) => {
  return new ZodReadonly({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodReadonly,
    ...processCreateParams(params)
  });
};
function cleanParams(params, data) {
  const p = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
  const p2 = typeof p === "string" ? { message: p } : p;
  return p2;
}
function custom(check, _params = {}, fatal) {
  if (check)
    return ZodAny.create().superRefine((data, ctx) => {
      const r = check(data);
      if (r instanceof Promise) {
        return r.then((r2) => {
          if (!r2) {
            const params = cleanParams(_params, data);
            const _fatal = params.fatal ?? fatal ?? true;
            ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
          }
        });
      }
      if (!r) {
        const params = cleanParams(_params, data);
        const _fatal = params.fatal ?? fatal ?? true;
        ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
      }
      return;
    });
  return ZodAny.create();
}
var late = {
  object: ZodObject.lazycreate
};
var ZodFirstPartyTypeKind;
(function(ZodFirstPartyTypeKind2) {
  ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
  ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
  ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
  ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
  ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
  ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
  ZodFirstPartyTypeKind2["ZodSymbol"] = "ZodSymbol";
  ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
  ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
  ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
  ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
  ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
  ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
  ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
  ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
  ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
  ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
  ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
  ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
  ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
  ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
  ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
  ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
  ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
  ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
  ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
  ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
  ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
  ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
  ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
  ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
  ZodFirstPartyTypeKind2["ZodCatch"] = "ZodCatch";
  ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
  ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
  ZodFirstPartyTypeKind2["ZodPipeline"] = "ZodPipeline";
  ZodFirstPartyTypeKind2["ZodReadonly"] = "ZodReadonly";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
var instanceOfType = (cls, params = {
  message: `Input not instance of ${cls.name}`
}) => custom((data) => data instanceof cls, params);
var stringType = ZodString.create;
var numberType = ZodNumber.create;
var nanType = ZodNaN.create;
var bigIntType = ZodBigInt.create;
var booleanType = ZodBoolean.create;
var dateType = ZodDate.create;
var symbolType = ZodSymbol.create;
var undefinedType = ZodUndefined.create;
var nullType = ZodNull.create;
var anyType = ZodAny.create;
var unknownType = ZodUnknown.create;
var neverType = ZodNever.create;
var voidType = ZodVoid.create;
var arrayType = ZodArray.create;
var objectType = ZodObject.create;
var strictObjectType = ZodObject.strictCreate;
var unionType = ZodUnion.create;
var discriminatedUnionType = ZodDiscriminatedUnion.create;
var intersectionType = ZodIntersection.create;
var tupleType = ZodTuple.create;
var recordType = ZodRecord.create;
var mapType = ZodMap.create;
var setType = ZodSet.create;
var functionType = ZodFunction.create;
var lazyType = ZodLazy.create;
var literalType = ZodLiteral.create;
var enumType = ZodEnum.create;
var nativeEnumType = ZodNativeEnum.create;
var promiseType = ZodPromise.create;
var effectsType = ZodEffects.create;
var optionalType = ZodOptional.create;
var nullableType = ZodNullable.create;
var preprocessType = ZodEffects.createWithPreprocess;
var pipelineType = ZodPipeline.create;
var ostring = () => stringType().optional();
var onumber = () => numberType().optional();
var oboolean = () => booleanType().optional();
var coerce = {
  string: (arg) => ZodString.create({ ...arg, coerce: true }),
  number: (arg) => ZodNumber.create({ ...arg, coerce: true }),
  boolean: (arg) => ZodBoolean.create({
    ...arg,
    coerce: true
  }),
  bigint: (arg) => ZodBigInt.create({ ...arg, coerce: true }),
  date: (arg) => ZodDate.create({ ...arg, coerce: true })
};
var NEVER = INVALID;

// node_modules/smol-toml/dist/error.js
function getLineColFromPtr(string, ptr) {
  let lines = string.slice(0, ptr).split(/\r\n|\n|\r/g);
  return [lines.length, lines.pop().length + 1];
}
function makeCodeBlock(string, line, column) {
  let lines = string.split(/\r\n|\n|\r/g);
  let codeblock = "";
  let numberLen = (Math.log10(line + 1) | 0) + 1;
  for (let i = line - 1; i <= line + 1; i++) {
    let l = lines[i - 1];
    if (!l)
      continue;
    codeblock += i.toString().padEnd(numberLen, " ");
    codeblock += ":  ";
    codeblock += l;
    codeblock += "\n";
    if (i === line) {
      codeblock += " ".repeat(numberLen + column + 2);
      codeblock += "^\n";
    }
  }
  return codeblock;
}
var TomlError = class extends Error {
  line;
  column;
  codeblock;
  constructor(message, options) {
    const [line, column] = getLineColFromPtr(options.toml, options.ptr);
    const codeblock = makeCodeBlock(options.toml, line, column);
    super(`Invalid TOML document: ${message}

${codeblock}`, options);
    this.line = line;
    this.column = column;
    this.codeblock = codeblock;
  }
};

// node_modules/smol-toml/dist/util.js
function isEscaped(str, ptr) {
  let i = 0;
  while (str[ptr - ++i] === "\\")
    ;
  return --i && i % 2;
}
function indexOfNewline(str, start = 0, end = str.length) {
  let idx = str.indexOf("\n", start);
  if (str[idx - 1] === "\r")
    idx--;
  return idx <= end ? idx : -1;
}
function skipComment(str, ptr) {
  for (let i = ptr; i < str.length; i++) {
    let c = str[i];
    if (c === "\n")
      return i;
    if (c === "\r" && str[i + 1] === "\n")
      return i + 1;
    if (c < " " && c !== "	" || c === "\x7F") {
      throw new TomlError("control characters are not allowed in comments", {
        toml: str,
        ptr
      });
    }
  }
  return str.length;
}
function skipVoid(str, ptr, banNewLines, banComments) {
  let c;
  while ((c = str[ptr]) === " " || c === "	" || !banNewLines && (c === "\n" || c === "\r" && str[ptr + 1] === "\n"))
    ptr++;
  return banComments || c !== "#" ? ptr : skipVoid(str, skipComment(str, ptr), banNewLines);
}
function skipUntil(str, ptr, sep, end, banNewLines = false) {
  if (!end) {
    ptr = indexOfNewline(str, ptr);
    return ptr < 0 ? str.length : ptr;
  }
  for (let i = ptr; i < str.length; i++) {
    let c = str[i];
    if (c === "#") {
      i = indexOfNewline(str, i);
    } else if (c === sep) {
      return i + 1;
    } else if (c === end || banNewLines && (c === "\n" || c === "\r" && str[i + 1] === "\n")) {
      return i;
    }
  }
  throw new TomlError("cannot find end of structure", {
    toml: str,
    ptr
  });
}
function getStringEnd(str, seek) {
  let first = str[seek];
  let target = first === str[seek + 1] && str[seek + 1] === str[seek + 2] ? str.slice(seek, seek + 3) : first;
  seek += target.length - 1;
  do
    seek = str.indexOf(target, ++seek);
  while (seek > -1 && first !== "'" && isEscaped(str, seek));
  if (seek > -1) {
    seek += target.length;
    if (target.length > 1) {
      if (str[seek] === first)
        seek++;
      if (str[seek] === first)
        seek++;
    }
  }
  return seek;
}

// node_modules/smol-toml/dist/date.js
var DATE_TIME_RE = /^(\d{4}-\d{2}-\d{2})?[T ]?(?:(\d{2}):\d{2}:\d{2}(?:\.\d+)?)?(Z|[-+]\d{2}:\d{2})?$/i;
var TomlDate = class _TomlDate extends Date {
  #hasDate = false;
  #hasTime = false;
  #offset = null;
  constructor(date) {
    let hasDate = true;
    let hasTime = true;
    let offset = "Z";
    if (typeof date === "string") {
      let match = date.match(DATE_TIME_RE);
      if (match) {
        if (!match[1]) {
          hasDate = false;
          date = `0000-01-01T${date}`;
        }
        hasTime = !!match[2];
        hasTime && date[10] === " " && (date = date.replace(" ", "T"));
        if (match[2] && +match[2] > 23) {
          date = "";
        } else {
          offset = match[3] || null;
          date = date.toUpperCase();
          if (!offset && hasTime)
            date += "Z";
        }
      } else {
        date = "";
      }
    }
    super(date);
    if (!isNaN(this.getTime())) {
      this.#hasDate = hasDate;
      this.#hasTime = hasTime;
      this.#offset = offset;
    }
  }
  isDateTime() {
    return this.#hasDate && this.#hasTime;
  }
  isLocal() {
    return !this.#hasDate || !this.#hasTime || !this.#offset;
  }
  isDate() {
    return this.#hasDate && !this.#hasTime;
  }
  isTime() {
    return this.#hasTime && !this.#hasDate;
  }
  isValid() {
    return this.#hasDate || this.#hasTime;
  }
  toISOString() {
    let iso = super.toISOString();
    if (this.isDate())
      return iso.slice(0, 10);
    if (this.isTime())
      return iso.slice(11, 23);
    if (this.#offset === null)
      return iso.slice(0, -1);
    if (this.#offset === "Z")
      return iso;
    let offset = +this.#offset.slice(1, 3) * 60 + +this.#offset.slice(4, 6);
    offset = this.#offset[0] === "-" ? offset : -offset;
    let offsetDate = new Date(this.getTime() - offset * 6e4);
    return offsetDate.toISOString().slice(0, -1) + this.#offset;
  }
  static wrapAsOffsetDateTime(jsDate, offset = "Z") {
    let date = new _TomlDate(jsDate);
    date.#offset = offset;
    return date;
  }
  static wrapAsLocalDateTime(jsDate) {
    let date = new _TomlDate(jsDate);
    date.#offset = null;
    return date;
  }
  static wrapAsLocalDate(jsDate) {
    let date = new _TomlDate(jsDate);
    date.#hasTime = false;
    date.#offset = null;
    return date;
  }
  static wrapAsLocalTime(jsDate) {
    let date = new _TomlDate(jsDate);
    date.#hasDate = false;
    date.#offset = null;
    return date;
  }
};

// node_modules/smol-toml/dist/primitive.js
var INT_REGEX = /^((0x[0-9a-fA-F](_?[0-9a-fA-F])*)|(([+-]|0[ob])?\d(_?\d)*))$/;
var FLOAT_REGEX = /^[+-]?\d(_?\d)*(\.\d(_?\d)*)?([eE][+-]?\d(_?\d)*)?$/;
var LEADING_ZERO = /^[+-]?0[0-9_]/;
var ESCAPE_REGEX = /^[0-9a-f]{4,8}$/i;
var ESC_MAP = {
  b: "\b",
  t: "	",
  n: "\n",
  f: "\f",
  r: "\r",
  '"': '"',
  "\\": "\\"
};
function parseString(str, ptr = 0, endPtr = str.length) {
  let isLiteral = str[ptr] === "'";
  let isMultiline = str[ptr++] === str[ptr] && str[ptr] === str[ptr + 1];
  if (isMultiline) {
    endPtr -= 2;
    if (str[ptr += 2] === "\r")
      ptr++;
    if (str[ptr] === "\n")
      ptr++;
  }
  let tmp = 0;
  let isEscape;
  let parsed = "";
  let sliceStart = ptr;
  while (ptr < endPtr - 1) {
    let c = str[ptr++];
    if (c === "\n" || c === "\r" && str[ptr] === "\n") {
      if (!isMultiline) {
        throw new TomlError("newlines are not allowed in strings", {
          toml: str,
          ptr: ptr - 1
        });
      }
    } else if (c < " " && c !== "	" || c === "\x7F") {
      throw new TomlError("control characters are not allowed in strings", {
        toml: str,
        ptr: ptr - 1
      });
    }
    if (isEscape) {
      isEscape = false;
      if (c === "u" || c === "U") {
        let code = str.slice(ptr, ptr += c === "u" ? 4 : 8);
        if (!ESCAPE_REGEX.test(code)) {
          throw new TomlError("invalid unicode escape", {
            toml: str,
            ptr: tmp
          });
        }
        try {
          parsed += String.fromCodePoint(parseInt(code, 16));
        } catch {
          throw new TomlError("invalid unicode escape", {
            toml: str,
            ptr: tmp
          });
        }
      } else if (isMultiline && (c === "\n" || c === " " || c === "	" || c === "\r")) {
        ptr = skipVoid(str, ptr - 1, true);
        if (str[ptr] !== "\n" && str[ptr] !== "\r") {
          throw new TomlError("invalid escape: only line-ending whitespace may be escaped", {
            toml: str,
            ptr: tmp
          });
        }
        ptr = skipVoid(str, ptr);
      } else if (c in ESC_MAP) {
        parsed += ESC_MAP[c];
      } else {
        throw new TomlError("unrecognized escape sequence", {
          toml: str,
          ptr: tmp
        });
      }
      sliceStart = ptr;
    } else if (!isLiteral && c === "\\") {
      tmp = ptr - 1;
      isEscape = true;
      parsed += str.slice(sliceStart, tmp);
    }
  }
  return parsed + str.slice(sliceStart, endPtr - 1);
}
function parseValue(value, toml, ptr, integersAsBigInt) {
  if (value === "true")
    return true;
  if (value === "false")
    return false;
  if (value === "-inf")
    return -Infinity;
  if (value === "inf" || value === "+inf")
    return Infinity;
  if (value === "nan" || value === "+nan" || value === "-nan")
    return NaN;
  if (value === "-0")
    return integersAsBigInt ? 0n : 0;
  let isInt = INT_REGEX.test(value);
  if (isInt || FLOAT_REGEX.test(value)) {
    if (LEADING_ZERO.test(value)) {
      throw new TomlError("leading zeroes are not allowed", {
        toml,
        ptr
      });
    }
    value = value.replace(/_/g, "");
    let numeric = +value;
    if (isNaN(numeric)) {
      throw new TomlError("invalid number", {
        toml,
        ptr
      });
    }
    if (isInt) {
      if ((isInt = !Number.isSafeInteger(numeric)) && !integersAsBigInt) {
        throw new TomlError("integer value cannot be represented losslessly", {
          toml,
          ptr
        });
      }
      if (isInt || integersAsBigInt === true)
        numeric = BigInt(value);
    }
    return numeric;
  }
  const date = new TomlDate(value);
  if (!date.isValid()) {
    throw new TomlError("invalid value", {
      toml,
      ptr
    });
  }
  return date;
}

// node_modules/smol-toml/dist/extract.js
function sliceAndTrimEndOf(str, startPtr, endPtr, allowNewLines) {
  let value = str.slice(startPtr, endPtr);
  let commentIdx = value.indexOf("#");
  if (commentIdx > -1) {
    skipComment(str, commentIdx);
    value = value.slice(0, commentIdx);
  }
  let trimmed = value.trimEnd();
  if (!allowNewLines) {
    let newlineIdx = value.indexOf("\n", trimmed.length);
    if (newlineIdx > -1) {
      throw new TomlError("newlines are not allowed in inline tables", {
        toml: str,
        ptr: startPtr + newlineIdx
      });
    }
  }
  return [trimmed, commentIdx];
}
function extractValue(str, ptr, end, depth, integersAsBigInt) {
  if (depth === 0) {
    throw new TomlError("document contains excessively nested structures. aborting.", {
      toml: str,
      ptr
    });
  }
  let c = str[ptr];
  if (c === "[" || c === "{") {
    let [value, endPtr2] = c === "[" ? parseArray(str, ptr, depth, integersAsBigInt) : parseInlineTable(str, ptr, depth, integersAsBigInt);
    let newPtr = end ? skipUntil(str, endPtr2, ",", end) : endPtr2;
    if (endPtr2 - newPtr && end === "}") {
      let nextNewLine = indexOfNewline(str, endPtr2, newPtr);
      if (nextNewLine > -1) {
        throw new TomlError("newlines are not allowed in inline tables", {
          toml: str,
          ptr: nextNewLine
        });
      }
    }
    return [value, newPtr];
  }
  let endPtr;
  if (c === '"' || c === "'") {
    endPtr = getStringEnd(str, ptr);
    let parsed = parseString(str, ptr, endPtr);
    if (end) {
      endPtr = skipVoid(str, endPtr, end !== "]");
      if (str[endPtr] && str[endPtr] !== "," && str[endPtr] !== end && str[endPtr] !== "\n" && str[endPtr] !== "\r") {
        throw new TomlError("unexpected character encountered", {
          toml: str,
          ptr: endPtr
        });
      }
      endPtr += +(str[endPtr] === ",");
    }
    return [parsed, endPtr];
  }
  endPtr = skipUntil(str, ptr, ",", end);
  let slice = sliceAndTrimEndOf(str, ptr, endPtr - +(str[endPtr - 1] === ","), end === "]");
  if (!slice[0]) {
    throw new TomlError("incomplete key-value declaration: no value specified", {
      toml: str,
      ptr
    });
  }
  if (end && slice[1] > -1) {
    endPtr = skipVoid(str, ptr + slice[1]);
    endPtr += +(str[endPtr] === ",");
  }
  return [
    parseValue(slice[0], str, ptr, integersAsBigInt),
    endPtr
  ];
}

// node_modules/smol-toml/dist/struct.js
var KEY_PART_RE = /^[a-zA-Z0-9-_]+[ \t]*$/;
function parseKey(str, ptr, end = "=") {
  let dot = ptr - 1;
  let parsed = [];
  let endPtr = str.indexOf(end, ptr);
  if (endPtr < 0) {
    throw new TomlError("incomplete key-value: cannot find end of key", {
      toml: str,
      ptr
    });
  }
  do {
    let c = str[ptr = ++dot];
    if (c !== " " && c !== "	") {
      if (c === '"' || c === "'") {
        if (c === str[ptr + 1] && c === str[ptr + 2]) {
          throw new TomlError("multiline strings are not allowed in keys", {
            toml: str,
            ptr
          });
        }
        let eos = getStringEnd(str, ptr);
        if (eos < 0) {
          throw new TomlError("unfinished string encountered", {
            toml: str,
            ptr
          });
        }
        dot = str.indexOf(".", eos);
        let strEnd = str.slice(eos, dot < 0 || dot > endPtr ? endPtr : dot);
        let newLine = indexOfNewline(strEnd);
        if (newLine > -1) {
          throw new TomlError("newlines are not allowed in keys", {
            toml: str,
            ptr: ptr + dot + newLine
          });
        }
        if (strEnd.trimStart()) {
          throw new TomlError("found extra tokens after the string part", {
            toml: str,
            ptr: eos
          });
        }
        if (endPtr < eos) {
          endPtr = str.indexOf(end, eos);
          if (endPtr < 0) {
            throw new TomlError("incomplete key-value: cannot find end of key", {
              toml: str,
              ptr
            });
          }
        }
        parsed.push(parseString(str, ptr, eos));
      } else {
        dot = str.indexOf(".", ptr);
        let part = str.slice(ptr, dot < 0 || dot > endPtr ? endPtr : dot);
        if (!KEY_PART_RE.test(part)) {
          throw new TomlError("only letter, numbers, dashes and underscores are allowed in keys", {
            toml: str,
            ptr
          });
        }
        parsed.push(part.trimEnd());
      }
    }
  } while (dot + 1 && dot < endPtr);
  return [parsed, skipVoid(str, endPtr + 1, true, true)];
}
function parseInlineTable(str, ptr, depth, integersAsBigInt) {
  let res = {};
  let seen = /* @__PURE__ */ new Set();
  let c;
  let comma = 0;
  ptr++;
  while ((c = str[ptr++]) !== "}" && c) {
    let err = { toml: str, ptr: ptr - 1 };
    if (c === "\n") {
      throw new TomlError("newlines are not allowed in inline tables", err);
    } else if (c === "#") {
      throw new TomlError("inline tables cannot contain comments", err);
    } else if (c === ",") {
      throw new TomlError("expected key-value, found comma", err);
    } else if (c !== " " && c !== "	") {
      let k;
      let t = res;
      let hasOwn = false;
      let [key, keyEndPtr] = parseKey(str, ptr - 1);
      for (let i = 0; i < key.length; i++) {
        if (i)
          t = hasOwn ? t[k] : t[k] = {};
        k = key[i];
        if ((hasOwn = Object.hasOwn(t, k)) && (typeof t[k] !== "object" || seen.has(t[k]))) {
          throw new TomlError("trying to redefine an already defined value", {
            toml: str,
            ptr
          });
        }
        if (!hasOwn && k === "__proto__") {
          Object.defineProperty(t, k, { enumerable: true, configurable: true, writable: true });
        }
      }
      if (hasOwn) {
        throw new TomlError("trying to redefine an already defined value", {
          toml: str,
          ptr
        });
      }
      let [value, valueEndPtr] = extractValue(str, keyEndPtr, "}", depth - 1, integersAsBigInt);
      seen.add(value);
      t[k] = value;
      ptr = valueEndPtr;
      comma = str[ptr - 1] === "," ? ptr - 1 : 0;
    }
  }
  if (comma) {
    throw new TomlError("trailing commas are not allowed in inline tables", {
      toml: str,
      ptr: comma
    });
  }
  if (!c) {
    throw new TomlError("unfinished table encountered", {
      toml: str,
      ptr
    });
  }
  return [res, ptr];
}
function parseArray(str, ptr, depth, integersAsBigInt) {
  let res = [];
  let c;
  ptr++;
  while ((c = str[ptr++]) !== "]" && c) {
    if (c === ",") {
      throw new TomlError("expected value, found comma", {
        toml: str,
        ptr: ptr - 1
      });
    } else if (c === "#")
      ptr = skipComment(str, ptr);
    else if (c !== " " && c !== "	" && c !== "\n" && c !== "\r") {
      let e = extractValue(str, ptr - 1, "]", depth - 1, integersAsBigInt);
      res.push(e[0]);
      ptr = e[1];
    }
  }
  if (!c) {
    throw new TomlError("unfinished array encountered", {
      toml: str,
      ptr
    });
  }
  return [res, ptr];
}

// node_modules/smol-toml/dist/parse.js
function peekTable(key, table, meta2, type) {
  let t = table;
  let m = meta2;
  let k;
  let hasOwn = false;
  let state;
  for (let i = 0; i < key.length; i++) {
    if (i) {
      t = hasOwn ? t[k] : t[k] = {};
      m = (state = m[k]).c;
      if (type === 0 && (state.t === 1 || state.t === 2)) {
        return null;
      }
      if (state.t === 2) {
        let l = t.length - 1;
        t = t[l];
        m = m[l].c;
      }
    }
    k = key[i];
    if ((hasOwn = Object.hasOwn(t, k)) && m[k]?.t === 0 && m[k]?.d) {
      return null;
    }
    if (!hasOwn) {
      if (k === "__proto__") {
        Object.defineProperty(t, k, { enumerable: true, configurable: true, writable: true });
        Object.defineProperty(m, k, { enumerable: true, configurable: true, writable: true });
      }
      m[k] = {
        t: i < key.length - 1 && type === 2 ? 3 : type,
        d: false,
        i: 0,
        c: {}
      };
    }
  }
  state = m[k];
  if (state.t !== type && !(type === 1 && state.t === 3)) {
    return null;
  }
  if (type === 2) {
    if (!state.d) {
      state.d = true;
      t[k] = [];
    }
    t[k].push(t = {});
    state.c[state.i++] = state = { t: 1, d: false, i: 0, c: {} };
  }
  if (state.d) {
    return null;
  }
  state.d = true;
  if (type === 1) {
    t = hasOwn ? t[k] : t[k] = {};
  } else if (type === 0 && hasOwn) {
    return null;
  }
  return [k, t, state.c];
}
function parse(toml, { maxDepth = 1e3, integersAsBigInt } = {}) {
  let res = {};
  let meta2 = {};
  let tbl = res;
  let m = meta2;
  for (let ptr = skipVoid(toml, 0); ptr < toml.length; ) {
    if (toml[ptr] === "[") {
      let isTableArray = toml[++ptr] === "[";
      let k = parseKey(toml, ptr += +isTableArray, "]");
      if (isTableArray) {
        if (toml[k[1] - 1] !== "]") {
          throw new TomlError("expected end of table declaration", {
            toml,
            ptr: k[1] - 1
          });
        }
        k[1]++;
      }
      let p = peekTable(
        k[0],
        res,
        meta2,
        isTableArray ? 2 : 1
        /* Type.EXPLICIT */
      );
      if (!p) {
        throw new TomlError("trying to redefine an already defined table or value", {
          toml,
          ptr
        });
      }
      m = p[2];
      tbl = p[1];
      ptr = k[1];
    } else {
      let k = parseKey(toml, ptr);
      let p = peekTable(
        k[0],
        tbl,
        m,
        0
        /* Type.DOTTED */
      );
      if (!p) {
        throw new TomlError("trying to redefine an already defined table or value", {
          toml,
          ptr
        });
      }
      let v = extractValue(toml, k[1], void 0, maxDepth, integersAsBigInt);
      p[1][p[0]] = v[0];
      ptr = v[1];
    }
    ptr = skipVoid(toml, ptr, true);
    if (toml[ptr] && toml[ptr] !== "\n" && toml[ptr] !== "\r") {
      throw new TomlError("each key-value declaration must be followed by an end-of-line", {
        toml,
        ptr
      });
    }
    ptr = skipVoid(toml, ptr);
  }
  return res;
}

// src/ConfigAdapter.ts
var ScalingSchema = external_exports.object({
  unitRatio: external_exports.number().default(0.05),
  radiusRatio: external_exports.number().default(2),
  fontRatio: external_exports.number().default(0.45),
  minFontSize: external_exports.number().default(11)
});
var LayoutConfigSchema = external_exports.object({
  barHeight: external_exports.number().default(30),
  screenWidth: external_exports.number().default(0),
  launcherWidth: external_exports.number().default(800),
  launcherHeight: external_exports.number().default(540),
  clipboardWidth: external_exports.number().default(0.85),
  clipboardHeight: external_exports.number().default(144),
  bar: external_exports.object({
    workspaceScale: external_exports.number().default(0.5),
    left: external_exports.array(external_exports.string()).default(["dashboardbutton", "datetime", "weather", "windowtitle"]),
    center: external_exports.array(external_exports.string()).default(["workspaces"]),
    right: external_exports.array(external_exports.string()).default(["tray", "audio", "resourceusage", "media"])
  }).default({}),
  padding: external_exports.object({
    vertical: external_exports.number().default(0),
    horizontal: external_exports.number().default(3)
  }).default({}),
  launcher: external_exports.object({
    sidebarWidth: external_exports.number().default(320),
    gridColumns: external_exports.number().default(5),
    maxAppNameLength: external_exports.number().default(12),
    searchBarHeightRatio: external_exports.number().default(0.12)
  }).default({}),
  clipboard: external_exports.object({
    cardWidth: external_exports.number().default(180),
    cardHeight: external_exports.number().default(120),
    imagePreviewSize: external_exports.number().default(0.75),
    maxVisibleCards: external_exports.number().default(8),
    previewLines: external_exports.number().default(3)
  }).default({})
});
var AppearanceConfigSchema = external_exports.object({
  monochromeIcons: external_exports.boolean().default(true),
  fuzzySearch: external_exports.boolean().default(true),
  maxHistoryItems: external_exports.number().default(50),
  colors: external_exports.object({
    primary: external_exports.string().default("#FF3355"),
    surface: external_exports.string().default("#0B0B0B"),
    surfaceDarker: external_exports.string().default("#070707"),
    text: external_exports.string().default("#F0F0F0"),
    border: external_exports.string().default("rgba(255, 255, 255, 0.08)"),
    accent: external_exports.string().default("#FF3355"),
    bar_bg: external_exports.string().default("rgba(0, 0, 0, 0.85)")
  }).default({}),
  glass: external_exports.object({
    blur: external_exports.number().default(12),
    surfaceOpacity: external_exports.number().default(0.08),
    borderOpacity: external_exports.number().default(0.12),
    saturation: external_exports.number().default(1.15)
  }).default({}),
  elevation: external_exports.object({
    launcher: external_exports.number().default(1),
    clipboard: external_exports.number().default(0)
  }).default({})
});
var AnimationConfigSchema = external_exports.object({
  uiDuration: external_exports.number().default(150),
  windowDuration: external_exports.number().default(300),
  curve: external_exports.string().default("linear")
});
var LimitsSchema = external_exports.object({
  mediaTitle: external_exports.number().default(25),
  mediaArtist: external_exports.number().default(15),
  windowTitle: external_exports.number().default(40)
});
var WidgetsSchema = external_exports.object({
  clock: external_exports.object({
    format: external_exports.string().default("%H:%M")
  }).default({})
});
var ConfigSchema = external_exports.object({
  scaling: ScalingSchema.default({}),
  layout: LayoutConfigSchema.default({}),
  appearance: AppearanceConfigSchema.default({}),
  animation: AnimationConfigSchema.default({}),
  limits: LimitsSchema.default({}),
  widgets: WidgetsSchema.default({})
});
var SCRIPT_DIR = default2.path_get_dirname(import.meta.url.replace("file://", ""));
var APP_NAME = "lis-bar";
var CONFIG_DIR = `${default2.get_home_dir()}/.config/${APP_NAME}`;
var DEV_TOML_PATH = `${default2.get_home_dir()}/Lis-os/modules/home/desktop/astal/default.toml`;
var APPEARANCE_JSON_PATH = `${default2.get_home_dir()}/.config/astal/appearance.json`;
var ConfigAdapter = class _ConfigAdapter {
  static instance;
  _state = new Variable(ConfigSchema.parse({}));
  _tomlMonitor = null;
  _themeMonitor = null;
  constructor() {
    this.init();
  }
  static get() {
    if (!_ConfigAdapter.instance) {
      _ConfigAdapter.instance = new _ConfigAdapter();
    }
    return _ConfigAdapter.instance;
  }
  get adapter() {
    return this._state;
  }
  get value() {
    return this._state.get();
  }
  async init() {
    console.log(`[ConfigAdapter] Initializing...`);
    let tomlPath = DEV_TOML_PATH;
    if (default2.file_test(tomlPath, default2.FileTest.EXISTS)) {
      console.log(`[ConfigAdapter] Dev Mode Active: using local source config at ${tomlPath}`);
    } else {
      tomlPath = `${SCRIPT_DIR}/default.toml`;
      if (!default2.file_test(tomlPath, default2.FileTest.EXISTS)) {
        tomlPath = `${default2.path_get_dirname(SCRIPT_DIR)}/default.toml`;
      }
    }
    if (default2.file_test(tomlPath, default2.FileTest.EXISTS)) {
      console.log(`[ConfigAdapter] Monitoring TOML at: ${tomlPath}`);
      await this.load(tomlPath);
      this._tomlMonitor = monitorFile(tomlPath, async () => {
        console.log("[ConfigAdapter] default.toml changed. Reloading...");
        await this.load(tomlPath);
      });
    } else {
      console.error(`[ConfigAdapter] FATAL: default.toml not found at ${tomlPath}`);
    }
    if (default2.file_test(APPEARANCE_JSON_PATH, default2.FileTest.EXISTS)) {
      console.log(`[ConfigAdapter] Monitoring Theme at: ${APPEARANCE_JSON_PATH}`);
      this._themeMonitor = monitorFile(APPEARANCE_JSON_PATH, async () => {
        console.log("[ConfigAdapter] appearance.json changed. Reloading...");
        await this.load(tomlPath);
      });
    }
  }
  async load(tomlPath) {
    try {
      const content = await readFileAsync(tomlPath);
      const parsedToml = parse(content);
      let themeColors = {};
      if (default2.file_test(APPEARANCE_JSON_PATH, default2.FileTest.EXISTS)) {
        try {
          const jsonContent = await readFileAsync(APPEARANCE_JSON_PATH);
          const themeData = JSON.parse(jsonContent);
          if (themeData.colors) {
            themeColors = {
              primary: themeData.colors.ui_prim,
              surface: themeData.colors.surface,
              surfaceDarker: themeData.colors.surfaceDarker,
              text: themeData.colors.text,
              // border: themeData.colors.surfaceLighter, // Optional mapping
              accent: themeData.colors.syn_acc,
              bar_bg: themeData.colors.bar_bg
            };
            console.log("[ConfigAdapter] Merged theme engine colors.");
          }
        } catch (e) {
          console.error(`[ConfigAdapter] Failed to parse appearance.json: ${e}`);
        }
      }
      const mergedConfig = {
        ...parsedToml
      };
      if (Object.keys(themeColors).length > 0) {
        if (!mergedConfig.appearance) mergedConfig.appearance = {};
        if (!mergedConfig.appearance.colors) mergedConfig.appearance.colors = {};
        Object.assign(mergedConfig.appearance.colors, themeColors);
      }
      const result = ConfigSchema.safeParse(mergedConfig);
      if (result.success) {
        this._state.set(result.data);
        console.log("[ConfigAdapter] Config loaded and validated successfully.");
      } else {
        console.error("[ConfigAdapter] Config Validation Failed:", result.error);
      }
    } catch (e) {
      console.error(`[ConfigAdapter] Failed to parse default.toml: ${e}`);
    }
  }
};
var ConfigAdapter_default = ConfigAdapter;

// src/LayoutService.ts
var LayoutService = class _LayoutService {
  static instance;
  static get_default() {
    if (!this.instance) this.instance = new _LayoutService();
    return this.instance;
  }
  config;
  // --- Reactive Primitives ---
  barHeight;
  unitRatio;
  radiusRatio;
  fontRatio;
  minFontSize;
  // The Base Unit U
  U;
  // --- Component-Specific Configs ---
  launcher;
  clipboard;
  glass;
  colors;
  elevation;
  animation;
  // --- Widget Bindings (Pre-calculated types) ---
  workspaceIconSize;
  workspacePadding;
  workspaceFontSize;
  // --- Dynamic Environmental Bindings ---
  screenWidth;
  // --- Rule Set Gamma & Delta (Computed Layouts) ---
  launcherGeometry;
  clipboardGeometry;
  constructor() {
    this.config = bind(ConfigAdapter_default.get().adapter);
    const config = this.config;
    this.barHeight = config.as((c) => c.layout.barHeight);
    this.unitRatio = config.as((c) => c.scaling.unitRatio);
    this.U = bind(Variable.derive(
      [this.barHeight, this.unitRatio],
      (bar, ratio) => Math.floor(bar * ratio)
    ));
    this.screenWidth = config.as((c) => {
      const override = c.layout.screenWidth;
      if (override > 0) return override;
      const screen = Gdk.Screen.get_default();
      return screen ? screen.get_width() : 1920;
    });
    this.radiusRatio = config.as((c) => c.scaling.radiusRatio);
    this.fontRatio = config.as((c) => c.scaling.fontRatio);
    this.minFontSize = config.as((c) => c.scaling.minFontSize);
    this.launcher = config.as((c) => ({
      width: c.layout.launcherWidth,
      height: c.layout.launcherHeight,
      searchBarHeightRatio: c.layout.launcher.searchBarHeightRatio,
      sidebarWidth: c.layout.launcher.sidebarWidth,
      gridColumns: c.layout.launcher.gridColumns,
      gridRows: c.layout.launcher.gridRows,
      maxAppNameLength: c.layout.launcher.maxAppNameLength,
      // Appearance mixed in
      searchBarPadding: c.appearance.launcher?.searchBarPadding ?? 3,
      appCardPadding: c.appearance.launcher?.appCardPadding ?? 4,
      modeButtonPadding: c.appearance.launcher?.modeButtonPadding ?? 1.5,
      sidebarOpacity: c.appearance.launcher?.sidebarOpacity ?? 0.9
    }));
    this.clipboard = config.as((c) => ({
      widthRatio: c.layout.clipboardWidth,
      height: c.layout.clipboardHeight,
      cardWidth: c.layout.clipboard.cardWidth,
      cardHeight: c.layout.clipboard.cardHeight,
      imagePreviewSize: c.layout.clipboard.imagePreviewSize,
      cardSpacing: c.layout.clipboard.cardSpacing,
      maxVisibleCards: c.layout.clipboard.maxVisibleCards,
      previewLines: c.layout.clipboard.previewLines
    }));
    this.glass = config.as((c) => ({
      blur: c.appearance.glass.blur,
      surfaceOpacity: c.appearance.glass.surfaceOpacity,
      borderOpacity: c.appearance.glass.borderOpacity,
      saturation: c.appearance.glass.saturation
    }));
    this.colors = config.as((c) => ({
      primary: c.appearance.colors.primary,
      surface: c.appearance.colors.surface,
      surfaceDarker: c.appearance.colors.surfaceDarker,
      text: c.appearance.colors.text,
      border: c.appearance.colors.border,
      accent: c.appearance.colors.accent
    }));
    this.elevation = config.as((c) => ({
      launcher: c.appearance.elevation?.launcher ?? 1,
      clipboard: c.appearance.elevation?.clipboard ?? 0
    }));
    this.animation = config.as((c) => ({
      uiDuration: c.animation.uiDuration,
      windowDuration: c.animation.windowDuration,
      curve: c.animation.curve
    }));
    const workspaceScale = config.as((c) => c.layout.bar.workspaceScale);
    const BU = bind(Variable.derive([this.barHeight, workspaceScale], (h, s) => Math.floor(h * s)));
    this.workspaceIconSize = BU;
    this.workspacePadding = BU;
    this.workspaceFontSize = bind(Variable.derive(
      [BU, this.fontRatio, this.minFontSize],
      (bu, fr, min) => Math.max(Math.floor(bu * fr), min)
    ));
    this.launcherGeometry = bind(Variable.derive([this.launcher, this.U, this.fontRatio, this.minFontSize], (l, u, fr, minFont) => {
      const P = (x) => Math.floor(u * x);
      const FontSize = (h) => Math.max(Math.floor(h * fr), minFont);
      const searchBarHeight = FontSize(l.height * 0.12) + P(l.searchBarPadding * 2);
      const mainWidth = l.width - l.sidebarWidth;
      const totalHPad = P(l.appCardPadding) * (l.gridColumns + 1);
      const gridItemWidth = Math.floor((mainWidth - totalHPad) / l.gridColumns);
      const mainHeight = l.height;
      const availableHeight = mainHeight - searchBarHeight;
      const totalVPad = P(l.appCardPadding) * (l.gridRows + 1);
      const gridItemHeight = Math.floor((availableHeight - totalVPad) / l.gridRows);
      return {
        mainWidth,
        sidebarWidth: l.sidebarWidth,
        searchBarHeight,
        gridItemWidth,
        gridItemHeight
      };
    }));
    this.clipboardGeometry = this.clipboard.as((c) => ({
      visibleWidth: 1920 * c.widthRatio,
      cardImageSize: Math.floor(c.cardHeight * c.imagePreviewSize),
      cardWidth: c.cardWidth,
      cardHeight: c.cardHeight
    }));
  }
};
var LayoutService_default = LayoutService;

// widgets/Audio.tsx
import AstalWp from "gi://AstalWp?version=0.1";

// ../../../../../../../nix/store/1ckqvmr9hngfanwa6aw23cskymvh215c-astal-gjs/share/astal/gjs/gtk3/jsx-runtime.ts
function jsx2(ctor, props) {
  return jsx(ctors, ctor, props);
}
var ctors = {
  box: Box,
  button: Button,
  centerbox: CenterBox,
  circularprogress: CircularProgress,
  drawingarea: DrawingArea,
  entry: Entry,
  eventbox: EventBox,
  // TODO: fixed
  // TODO: flowbox
  icon: Icon,
  label: Label,
  levelbar: LevelBar,
  // TODO: listbox
  menubutton: MenuButton,
  overlay: Overlay,
  revealer: Revealer,
  scrollable: Scrollable,
  slider: Slider,
  stack: Stack,
  switch: Switch,
  window: Window
};
var jsxs = jsx2;

// widgets/Audio.tsx
function Audio() {
  const wp = AstalWp.get_default();
  const speaker = wp?.audio?.defaultSpeaker;
  const layout = LayoutService_default.get_default();
  return /* @__PURE__ */ jsx2("box", { className: "WidgetPill", valign: Gtk4.Align.FILL, children: speaker ? /* @__PURE__ */ jsx2(
    "eventbox",
    {
      onScroll: (_, event) => {
        if (event.delta_y < 0) speaker.volume = Math.min(1, speaker.volume + 0.05);
        else speaker.volume = Math.max(0, speaker.volume - 0.05);
      },
      onClick: (_, event) => {
        if (event.button === 1) speaker.mute = !speaker.mute;
      },
      children: /* @__PURE__ */ jsxs("box", { className: "AudioContent gap-1", valign: Gtk4.Align.CENTER, children: [
        /* @__PURE__ */ jsx2("icon", { icon: bind(speaker, "volumeIcon") }),
        /* @__PURE__ */ jsx2("label", { label: bind(speaker, "volume").as((v) => `${Math.floor(v * 100)}%`) })
      ] })
    }
  ) : /* @__PURE__ */ jsx2("icon", { icon: "audio-volume-muted-symbolic" }) });
}

// widgets/DashboardButton.tsx
function DashboardButton() {
  const layout = LayoutService_default.get_default();
  const iconCss = layout.barHeight.as((h) => `font-size: ${Math.floor(h * 0.7)}px;`);
  return /* @__PURE__ */ jsx2(
    "button",
    {
      className: "DashboardIcon",
      onClicked: () => app_default.toggle_window("dashboard"),
      valign: Gtk4.Align.CENTER,
      children: /* @__PURE__ */ jsx2("icon", { icon: "view-app-grid-symbolic", css: iconCss })
    }
  );
}

// widgets/DateTime.tsx
function DateTime() {
  const layout = LayoutService_default.get_default();
  const format = ConfigAdapter_default.get().value.widgets?.clock?.format ?? "%H:%M";
  const time = Variable("").poll(1e3, () => {
    return default2.DateTime.new_now_local().format(format);
  });
  return /* @__PURE__ */ jsx2(
    "box",
    {
      className: "WidgetPill accent DateTimePill",
      valign: Gtk4.Align.FILL,
      children: /* @__PURE__ */ jsx2(
        "label",
        {
          className: "DateTime",
          onDestroy: () => time.drop(),
          label: time()
        }
      )
    }
  );
}

// src/services/MediaService.ts
import AstalMpris from "gi://AstalMpris";
var IDLE_TIMEOUT_MS = 3e4;
var MediaService = class _MediaService {
  static instance;
  mpris;
  playerStates = /* @__PURE__ */ new Map();
  // Public reactive state
  activePlayer = Variable(null);
  isPlaying = Variable(false);
  title = Variable("");
  artist = Variable("");
  coverArt = Variable("");
  position = Variable(0);
  length = Variable(0);
  positionPollId = null;
  static get_default() {
    if (!this.instance) {
      this.instance = new _MediaService();
    }
    return this.instance;
  }
  constructor() {
    this.mpris = AstalMpris.get_default();
    this.init();
  }
  init() {
    this.mpris.connect("notify::players", () => {
      this.updatePlayers();
    });
    this.updatePlayers();
    this.startPositionPoll();
  }
  getScore(player) {
    const identity = player.identity?.toLowerCase() || "";
    const busName = player.busName?.toLowerCase() || "";
    const searchStr = `${identity} ${busName}`;
    let baseScore = 0;
    if (/deezer|spotify/i.test(searchStr)) baseScore = 100;
    else if (/tidal/i.test(searchStr)) baseScore = 80;
    else if (/youtube.*music/i.test(searchStr)) baseScore = 70;
    else if (/vivaldi|firefox|chrome|chromium/i.test(searchStr)) baseScore = 10;
    else baseScore = 50;
    if (player.playbackStatus === AstalMpris.PlaybackStatus.PLAYING) {
      baseScore += 100;
    }
    return baseScore;
  }
  updatePlayers() {
    const players = this.mpris.players;
    const currentIds = /* @__PURE__ */ new Set();
    for (const player of players) {
      const id = player.busName;
      currentIds.add(id);
      if (!this.playerStates.has(id)) {
        const state = {
          player,
          priority: this.getScore(player),
          idleTimerId: null,
          lastPlaying: Date.now()
        };
        this.playerStates.set(id, state);
        player.connect("notify::playback-status", () => {
          this.onPlaybackStatusChanged(id);
        });
        player.connect("notify::title", () => this.updateActivePlayerData());
        player.connect("notify::artist", () => this.updateActivePlayerData());
        player.connect("notify::cover-art", () => this.updateActivePlayerData());
        player.connect("notify::length", () => this.updateActivePlayerData());
      }
    }
    for (const [id, state] of this.playerStates) {
      if (!currentIds.has(id)) {
        if (state.idleTimerId) {
          default2.source_remove(state.idleTimerId);
        }
        this.playerStates.delete(id);
      }
    }
    this.selectBestPlayer();
  }
  onPlaybackStatusChanged(playerId) {
    const state = this.playerStates.get(playerId);
    if (!state) return;
    const isPlaying = state.player.playbackStatus === AstalMpris.PlaybackStatus.PLAYING;
    state.priority = this.getScore(state.player);
    if (isPlaying) {
      if (state.idleTimerId) {
        default2.source_remove(state.idleTimerId);
        state.idleTimerId = null;
      }
      state.lastPlaying = Date.now();
    } else {
      if (!state.idleTimerId) {
        state.idleTimerId = default2.timeout_add(default2.PRIORITY_DEFAULT, IDLE_TIMEOUT_MS, () => {
          state.idleTimerId = null;
          this.selectBestPlayer();
          return default2.SOURCE_REMOVE;
        });
      }
    }
    this.selectBestPlayer();
  }
  selectBestPlayer() {
    let bestPlayer = null;
    let bestScore = -1;
    for (const [id, state] of this.playerStates) {
      const isPlaying = state.player.playbackStatus === AstalMpris.PlaybackStatus.PLAYING;
      const isIdle = !isPlaying && Date.now() - state.lastPlaying > IDLE_TIMEOUT_MS;
      if (isIdle) continue;
      if (state.priority > bestScore) {
        bestScore = state.priority;
        bestPlayer = state.player;
      }
    }
    if (this.activePlayer.get() !== bestPlayer) {
      this.activePlayer.set(bestPlayer);
      this.updateActivePlayerData();
    } else {
      this.updateActivePlayerData();
    }
  }
  updateActivePlayerData() {
    const player = this.activePlayer.get();
    if (player) {
      this.isPlaying.set(player.playbackStatus === AstalMpris.PlaybackStatus.PLAYING);
      console.log(`[MediaService] Player: ${player.identity}, Title: ${player.title}, Artist: ${player.artist}`);
      const titleStr = typeof player.title === "string" ? player.title : String(player.title || "Unknown");
      this.title.set(titleStr || "Unknown");
      let artistStr;
      if (Array.isArray(player.artist)) {
        artistStr = player.artist.join(", ");
      } else if (typeof player.artist === "string") {
        artistStr = player.artist;
      } else {
        artistStr = String(player.artist || "Unknown");
      }
      this.artist.set(artistStr || "Unknown");
      this.coverArt.set(player.coverArt || "");
      this.length.set(player.length || 0);
      this.position.set(player.position || 0);
    } else {
      this.isPlaying.set(false);
      this.title.set("");
      this.artist.set("");
      this.coverArt.set("");
      this.length.set(0);
      this.position.set(0);
    }
  }
  startPositionPoll() {
    this.positionPollId = default2.timeout_add(default2.PRIORITY_DEFAULT, 1e3, () => {
      const player = this.activePlayer.get();
      if (player && player.playbackStatus === AstalMpris.PlaybackStatus.PLAYING) {
        this.position.set(player.position || 0);
      }
      return default2.SOURCE_CONTINUE;
    });
  }
  // Public methods for control
  togglePlayPause() {
    const player = this.activePlayer.get();
    if (player) {
      player.play_pause();
    }
  }
  next() {
    const player = this.activePlayer.get();
    if (player) {
      player.next();
    }
  }
  previous() {
    const player = this.activePlayer.get();
    if (player) {
      player.previous();
    }
  }
};
var MediaService_default = MediaService;

// widgets/MediaPro.tsx
function MediaPro() {
  const media = MediaService_default.get_default();
  const config = ConfigAdapter_default.get().value;
  const titleLimit = config.limits?.mediaTitle ?? 25;
  const artistLimit = config.limits?.mediaArtist ?? 15;
  const artSize = Math.floor(config.layout.barHeight * 0.9);
  const hasPlayer = bind(media.activePlayer).as((p) => p !== null);
  const title = bind(media.title).as((t) => String(t || "Unknown"));
  const artist = bind(media.artist).as((a) => String(a || "Unknown"));
  const coverArt = bind(media.coverArt);
  const isPlaying = bind(media.isPlaying);
  return /* @__PURE__ */ jsx2(
    "box",
    {
      className: "MediaProPill",
      visible: hasPlayer,
      valign: Gtk4.Align.FILL,
      children: /* @__PURE__ */ jsx2(
        "eventbox",
        {
          onClick: () => media.togglePlayPause(),
          children: /* @__PURE__ */ jsxs("box", { className: "MediaProContent", valign: Gtk4.Align.CENTER, spacing: 8, children: [
            /* @__PURE__ */ jsxs("overlay", { children: [
              /* @__PURE__ */ jsx2(
                "box",
                {
                  className: "ArtCircle",
                  widthRequest: artSize,
                  heightRequest: artSize,
                  halign: Gtk4.Align.CENTER,
                  valign: Gtk4.Align.CENTER,
                  css: coverArt.as(
                    (art) => art ? `background-image: url('${art}');` : ""
                  ),
                  children: /* @__PURE__ */ jsx2(
                    "icon",
                    {
                      icon: isPlaying.as((p) => p ? "media-playback-pause-symbolic" : "media-playback-start-symbolic"),
                      visible: coverArt.as((art) => !art)
                    }
                  )
                }
              ),
              /* @__PURE__ */ jsx2(
                "drawingarea",
                {
                  widthRequest: artSize,
                  heightRequest: artSize,
                  halign: Gtk4.Align.CENTER,
                  valign: Gtk4.Align.CENTER,
                  setup: (self) => {
                    self.hook(media.position, () => self.queue_draw());
                    self.hook(media.length, () => self.queue_draw());
                  },
                  onDraw: (self, cr) => {
                    const w = artSize;
                    const h = artSize;
                    const center_x = w / 2;
                    const center_y = h / 2;
                    const lineWidth = 2;
                    const radius = Math.min(w, h) / 2 - lineWidth / 2;
                    const len = media.length.get();
                    const pos = media.position.get();
                    const percent = len > 0 ? pos / len : 0;
                    const accentHex = config.appearance.colors.accent;
                    const r = parseInt(accentHex.slice(1, 3), 16) / 255;
                    const g = parseInt(accentHex.slice(3, 5), 16) / 255;
                    const b = parseInt(accentHex.slice(5, 7), 16) / 255;
                    cr.setSourceRGBA(1, 1, 1, 0.1);
                    cr.setLineWidth(lineWidth);
                    cr.arc(center_x, center_y, radius, 0, 2 * Math.PI);
                    cr.stroke();
                    if (percent > 0) {
                      cr.setSourceRGBA(r, g, b, 1);
                      cr.setLineWidth(lineWidth);
                      const startAngle = -Math.PI / 2;
                      const endAngle = startAngle + percent * 2 * Math.PI;
                      cr.arc(center_x, center_y, radius, startAngle, endAngle);
                      cr.stroke();
                    }
                  }
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("box", { className: "TrackInfo", valign: Gtk4.Align.CENTER, children: [
              /* @__PURE__ */ jsx2(
                "label",
                {
                  className: "TrackTitle",
                  label: title,
                  truncate: true,
                  maxWidthChars: titleLimit
                }
              ),
              /* @__PURE__ */ jsx2("label", { label: " - ", css: "color: alpha(@text, 0.5);" }),
              /* @__PURE__ */ jsx2(
                "label",
                {
                  className: "TrackArtist",
                  label: artist,
                  truncate: true,
                  maxWidthChars: artistLimit
                }
              )
            ] })
          ] })
        }
      )
    }
  );
}

// src/services/usage.ts
var _cpuUsage, _memory, _temperature, _cpuStats;
var Usage = class extends GObject4.Object {
  constructor() {
    super();
    __privateAdd(this, _cpuUsage, 0);
    __privateAdd(this, _memory, { percentage: 0, total: 0, used: 0, free: 0, available: 0 });
    __privateAdd(this, _temperature, 0);
    __privateAdd(this, _cpuStats, { total: 0, idle: 0 });
    __privateSet(this, _cpuStats, this.getCPUUsage());
    __privateSet(this, _memory, this.getMemoryUsage());
    interval(2e3, () => {
      const usage = this.getCPUUsage();
      const dtotal = usage.total - __privateGet(this, _cpuStats).total;
      const didle = usage.idle - __privateGet(this, _cpuStats).idle;
      __privateSet(this, _cpuUsage, dtotal === 0 ? 0 : (dtotal - didle) / dtotal);
      __privateSet(this, _cpuStats, usage);
      this.notify("cpu-usage");
      __privateSet(this, _temperature, this.getTemp());
      this.notify("temperature");
    });
    interval(5e3, () => {
      __privateSet(this, _memory, this.getMemoryUsage());
      this.notify("memory");
    });
  }
  static get_default() {
    if (!this.instance) this.instance = new Usage();
    return this.instance;
  }
  get cpuUsage() {
    return __privateGet(this, _cpuUsage);
  }
  get memory() {
    return __privateGet(this, _memory);
  }
  get temperature() {
    return __privateGet(this, _temperature);
  }
  getCPUUsage() {
    try {
      const stat = readFile("/proc/stat");
      const line = stat.split("\n")[0];
      const times = line.replace(/cpu\s+/, "").split(" ").map(Number);
      const idle = times[3] + times[4];
      const total = times.reduce((a, b) => a + b, 0);
      return { total, idle };
    } catch (e) {
      return { total: 0, idle: 0 };
    }
  }
  getMemoryUsage() {
    try {
      const meminfo = readFile("/proc/meminfo");
      const lines = meminfo.split("\n");
      const getVal = (key) => {
        const line = lines.find((l) => l.startsWith(key));
        if (!line) return 0;
        return parseInt(line.split(/\s+/)[1]) * 1024;
      };
      const total = getVal("MemTotal:");
      const available = getVal("MemAvailable:");
      const used = total - available;
      return { percentage: total ? used / total : 0, total, used, free: 0, available: 0 };
    } catch (e) {
      return { percentage: 0, total: 0, used: 0, free: 0, available: 0 };
    }
  }
  // HOTSPOT HUNTER: Finds the max CPU temp
  getTemp() {
    const basePaths = ["/sys/class/hwmon", "/sys/class/thermal"];
    let maxTemp = 0;
    let foundHighPriority = false;
    const readNum = (path) => {
      try {
        const [ok, data] = default2.file_get_contents(path);
        if (ok) return parseInt(new TextDecoder().decode(data).trim()) / 1e3;
      } catch (e) {
      }
      return -1;
    };
    const hwmonDir = default2.Dir.open("/sys/class/hwmon", 0);
    if (hwmonDir) {
      let name;
      while ((name = hwmonDir.read_name()) !== null) {
        const path = `/sys/class/hwmon/${name}`;
        for (let i = 1; i <= 10; i++) {
          const labelPath = `${path}/temp${i}_label`;
          const inputPath = `${path}/temp${i}_input`;
          if (!default2.file_test(inputPath, default2.FileTest.EXISTS)) continue;
          if (default2.file_test(labelPath, default2.FileTest.EXISTS)) {
            const [ok, labelData] = default2.file_get_contents(labelPath);
            if (ok) {
              const label = new TextDecoder().decode(labelData).toLowerCase();
              if (label.includes("tctl") || label.includes("tdie") || label.includes("package")) {
                const t2 = readNum(inputPath);
                if (t2 > 0) return t2;
              }
            }
          }
          const t = readNum(inputPath);
          if (t > maxTemp) maxTemp = t;
        }
      }
      hwmonDir.close();
    }
    if (maxTemp === 0) {
      const thermalDir = default2.Dir.open("/sys/class/thermal", 0);
      if (thermalDir) {
        let name;
        while ((name = thermalDir.read_name()) !== null) {
          if (name.startsWith("thermal_zone")) {
            const t = readNum(`/sys/class/thermal/${name}/temp`);
            if (t > maxTemp) maxTemp = t;
          }
        }
        thermalDir.close();
      }
    }
    return maxTemp;
  }
};
_cpuUsage = new WeakMap();
_memory = new WeakMap();
_temperature = new WeakMap();
_cpuStats = new WeakMap();
__publicField(Usage, "instance");
__decorateClass([
  property(Number)
], Usage.prototype, "cpuUsage", 1);
__decorateClass([
  property(Object)
], Usage.prototype, "memory", 1);
__decorateClass([
  property(Number)
], Usage.prototype, "temperature", 1);
Usage = __decorateClass([
  register({ GTypeName: "Usage" })
], Usage);

// widgets/ResourceUsage.tsx
function ResourceUsage() {
  const usage = Usage.get_default();
  const layout = LayoutService_default.get_default();
  const cpuClass = bind(usage, "cpuUsage").as((v) => v > 0.8 ? "urgent" : "accent");
  const tempClass = bind(usage, "temperature").as((t) => t > 80 ? "urgent" : "accent");
  const memClass = bind(usage, "memory").as((m) => m.used / m.total > 0.8 ? "urgent" : "accent");
  return /* @__PURE__ */ jsxs("box", { className: "WidgetPill ResourceUsage gap-1", valign: Gtk4.Align.FILL, children: [
    /* @__PURE__ */ jsxs("box", { className: "Cpu gap-half", children: [
      /* @__PURE__ */ jsx2("icon", { icon: "computer-symbolic" }),
      /* @__PURE__ */ jsx2("label", { className: cpuClass, label: bind(usage, "cpuUsage").as((v) => `${Math.floor(v * 100)}%`) })
    ] }),
    /* @__PURE__ */ jsxs("box", { className: "Temp gap-half", children: [
      /* @__PURE__ */ jsx2("icon", { icon: "temperature-symbolic" }),
      /* @__PURE__ */ jsx2(
        "label",
        {
          className: tempClass,
          label: bind(usage, "temperature").as((t) => `${Math.round(t)}\xB0`)
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("box", { className: "Mem gap-half", children: [
      /* @__PURE__ */ jsx2("icon", { icon: "drive-harddisk-symbolic" }),
      /* @__PURE__ */ jsx2("label", { className: memClass, label: bind(usage, "memory").as((m) => `${(m.used / 1073741824).toFixed(1)}G`) })
    ] })
  ] });
}

// widgets/Tray.tsx
import AstalTray from "gi://AstalTray?version=0.1";

// src/services/IconService.ts
var MANIFEST_PATH = `${default2.get_home_dir()}/.cache/lis-icons/manifest.json`;
var SIGNAL_FILE = `${default2.get_home_dir()}/.cache/theme-engine/signal`;
var iconManifest = new Variable(null);
var loadManifest = () => {
  readFileAsync(MANIFEST_PATH).then((contents) => {
    const parsed = JSON.parse(contents);
    iconManifest.set(parsed);
    print("[IconService] Icon manifest loaded successfully.");
  }).catch((err) => {
    print(`[IconService] CRITICAL: Failed to load icon manifest: ${err}`);
    iconManifest.set({ primary: {}, accent: {} });
  });
};
monitorFile(SIGNAL_FILE, () => {
  print("[IconService] Signal received. Reloading icon manifest...");
  loadManifest();
});
loadManifest();
var IconService_default = iconManifest;

// src/components/ThemedIcon.tsx
function ThemedIcon({
  appId,
  className = "",
  css = "",
  palette = "primary",
  size
}) {
  const iconPath = bind(IconService_default).as((manifest) => {
    const FALLBACK = "image-missing";
    if (!manifest || !appId) return FALLBACK;
    const path = manifest[palette]?.[appId];
    if (!path) {
      return FALLBACK;
    }
    return path;
  });
  const finalClassName = `ThemedIcon ${className}`;
  return /* @__PURE__ */ jsx2(
    "icon",
    {
      icon: iconPath,
      className: finalClassName,
      css,
      pixelSize: size
    }
  );
}

// widgets/Tray.tsx
function Tray() {
  const tray = AstalTray.get_default();
  const layout = LayoutService_default.get_default();
  const revealed = Variable(false);
  let timeoutId = null;
  const iconCss = layout.workspaceIconSize.as((size) => `font-size: ${size}px;`);
  const cancelTimeout = () => {
    if (timeoutId) {
      default2.source_remove(timeoutId);
      timeoutId = null;
    }
  };
  const startTimeout = () => {
    cancelTimeout();
    timeoutId = default2.timeout_add(default2.PRIORITY_DEFAULT, 3e3, () => {
      revealed.set(false);
      timeoutId = null;
      return default2.SOURCE_REMOVE;
    });
  };
  return /* @__PURE__ */ jsx2("eventbox", { onHoverLost: startTimeout, onHover: cancelTimeout, children: /* @__PURE__ */ jsxs("box", { className: "WidgetPill", valign: Gtk4.Align.FILL, children: [
    /* @__PURE__ */ jsx2(
      "button",
      {
        className: "TrayToggle",
        onClicked: () => revealed.set(!revealed.get()),
        css: "padding: 0px 4px; border: none; background: transparent;",
        children: /* @__PURE__ */ jsx2("icon", { icon: bind(revealed).as((r) => r ? "pan-end-symbolic" : "pan-start-symbolic"), css: iconCss })
      }
    ),
    /* @__PURE__ */ jsx2(
      "revealer",
      {
        transitionType: Gtk4.RevealerTransitionType.SLIDE_LEFT,
        revealChild: bind(revealed),
        children: /* @__PURE__ */ jsx2("box", { className: "TrayItems gap-1", css: "padding-left: 4px;", children: bind(tray, "items").as((items) => items.map((item) => /* @__PURE__ */ jsx2(
          "menubutton",
          {
            className: "TrayIcon",
            tooltipMarkup: bind(item, "tooltipMarkup"),
            usePopover: false,
            actionGroup: bind(item, "actionGroup").as((ag) => ["dbusmenu", ag]),
            menuModel: bind(item, "menuModel"),
            children: /* @__PURE__ */ jsx2(
              ThemedIcon,
              {
                appId: bind(item, "id").as((id) => id || item.iconName || ""),
                css: iconCss,
                palette: "primary"
              }
            )
          }
        ))) })
      }
    )
  ] }) });
}

// src/services/weather.ts
var FALLBACK_LAT = 48.8566;
var FALLBACK_LON = 2.3522;
var _temperature2, _icon, _description, _lat, _lon;
var Weather = class extends GObject4.Object {
  constructor() {
    super();
    __privateAdd(this, _temperature2, 0);
    __privateAdd(this, _icon, "weather-severe-alert-symbolic");
    __privateAdd(this, _description, "Unknown");
    __privateAdd(this, _lat, 0);
    __privateAdd(this, _lon, 0);
    this.init();
    interval(18e5, () => this.fetchWeather());
  }
  static get_default() {
    if (!this.instance) this.instance = new Weather();
    return this.instance;
  }
  get temperature() {
    return __privateGet(this, _temperature2);
  }
  get icon() {
    return __privateGet(this, _icon);
  }
  get description() {
    return __privateGet(this, _description);
  }
  async init() {
    const configAdapter = ConfigAdapter_default.get();
    try {
      const cfg = configAdapter.value;
      const city = cfg?.widgets?.weather?.city;
      if (city) {
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
        const geoRes = await execAsync(`curl -s "${geoUrl}"`);
        const geoJson = JSON.parse(geoRes);
        if (geoJson.results && geoJson.results.length > 0) {
          __privateSet(this, _lat, geoJson.results[0].latitude);
          __privateSet(this, _lon, geoJson.results[0].longitude);
          print(`[Weather] Configured City: ${city} (${__privateGet(this, _lat)}, ${__privateGet(this, _lon)})`);
          this.fetchWeather();
          return;
        }
      }
      const locRes = await execAsync("curl -s http://ip-api.com/json/");
      const locJson = JSON.parse(locRes);
      if (locJson.lat && locJson.lon) {
        __privateSet(this, _lat, locJson.lat);
        __privateSet(this, _lon, locJson.lon);
      } else {
        throw new Error("IP Geolocation failed");
      }
    } catch (e) {
      print(`[Weather] Location fallback used.`);
      __privateSet(this, _lat, FALLBACK_LAT);
      __privateSet(this, _lon, FALLBACK_LON);
    }
    this.fetchWeather();
  }
  async fetchWeather() {
    if (__privateGet(this, _lat) === 0) return;
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${__privateGet(this, _lat)}&longitude=${__privateGet(this, _lon)}&current_weather=true`;
      const res = await execAsync(`curl -s "${url}"`);
      const json = JSON.parse(res);
      if (json.current_weather) {
        __privateSet(this, _temperature2, json.current_weather.temperature);
        const code = json.current_weather.weathercode;
        __privateSet(this, _icon, this.getIcon(code));
        __privateSet(this, _description, this.getDescription(code));
        this.notify("temperature");
        this.notify("icon");
        this.notify("description");
      }
    } catch (e) {
      console.error("[Weather] Failed to fetch:", e);
    }
  }
  getIcon(code) {
    if (code === 0) return "weather-clear-symbolic";
    if (code <= 3) return "weather-few-clouds-symbolic";
    if (code <= 48) return "weather-fog-symbolic";
    if (code <= 67) return "weather-showers-symbolic";
    if (code <= 77) return "weather-snow-symbolic";
    if (code <= 82) return "weather-showers-symbolic";
    if (code <= 99) return "weather-storm-symbolic";
    return "weather-severe-alert-symbolic";
  }
  getDescription(code) {
    if (code === 0) return "Clear sky";
    if (code === 1) return "Mainly clear";
    if (code === 2) return "Partly cloudy";
    if (code === 3) return "Overcast";
    if (code <= 48) return "Fog";
    if (code <= 67) return "Rain";
    if (code <= 77) return "Snow";
    if (code <= 99) return "Thunderstorm";
    return "Unknown";
  }
};
_temperature2 = new WeakMap();
_icon = new WeakMap();
_description = new WeakMap();
_lat = new WeakMap();
_lon = new WeakMap();
__publicField(Weather, "instance");
__decorateClass([
  property(Number)
], Weather.prototype, "temperature", 1);
__decorateClass([
  property(String)
], Weather.prototype, "icon", 1);
__decorateClass([
  property(String)
], Weather.prototype, "description", 1);
Weather = __decorateClass([
  register({ GTypeName: "Weather" })
], Weather);

// widgets/Weather.tsx
function WeatherWidget() {
  const weather = Weather.get_default();
  const layout = LayoutService_default.get_default();
  return /* @__PURE__ */ jsxs("box", { className: "WidgetPill", valign: Gtk4.Align.FILL, children: [
    /* @__PURE__ */ jsx2("icon", { icon: bind(weather, "icon") }),
    /* @__PURE__ */ jsx2("label", { label: bind(weather, "temperature").as((t) => ` ${t}\xB0C`) })
  ] });
}

// src/services/niri.ts
import GLib from "gi://GLib?version=2.0";
import Gio2 from "gi://Gio?version=2.0";
var _state;
var Niri = class extends GObject4.Object {
  constructor() {
    super();
    __privateAdd(this, _state);
    __privateSet(this, _state, {
      workspaces: /* @__PURE__ */ new Map(),
      windows: /* @__PURE__ */ new Map(),
      monitors: /* @__PURE__ */ new Map()
    });
    this.reloadMonitors();
    this.listenEventStream();
  }
  static get_default() {
    if (!this.instance) {
      this.instance = new Niri();
    }
    return this.instance;
  }
  get outputs() {
    const wsmap = {};
    for (const [name, monitor] of __privateGet(this, _state).monitors) {
      wsmap[name] = { output: name, monitor, workspaces: {} };
    }
    for (const ws of __privateGet(this, _state).workspaces.values()) {
      const output = ws.output;
      if (!wsmap[output]) {
        const monitor = __privateGet(this, _state).monitors.get(output) ?? null;
        wsmap[output] = { output, monitor, workspaces: {} };
      }
      const windows = Array.from(__privateGet(this, _state).windows.values()).filter((w) => w.workspace_id === ws.id);
      wsmap[output].workspaces[ws.id] = { ...ws, windows };
    }
    return wsmap;
  }
  get windows() {
    return Array.from(__privateGet(this, _state).windows.values());
  }
  get focusedWindow() {
    for (const w of __privateGet(this, _state).windows.values()) {
      if (w.is_focused) return w;
    }
    return null;
  }
  get workspaces() {
    return Array.from(__privateGet(this, _state).workspaces.values());
  }
  focusWorkspaceId(id) {
    const msg = { Action: { FocusWorkspace: { reference: { Id: id } } } };
    this.oneOffCommand(JSON.stringify(msg));
  }
  reloadMonitors() {
    __privateGet(this, _state).monitors = this.getMonitors();
    this.notify("outputs");
  }
  newConnection() {
    const path = GLib.getenv("NIRI_SOCKET");
    const client = new Gio2.SocketClient().connect(new Gio2.UnixSocketAddress({ path }), null);
    return client;
  }
  oneOffCommand(jsonEncodedCommand) {
    try {
      const client = this.newConnection();
      client.get_output_stream().write(jsonEncodedCommand + "\n", null);
      const inputstream = new Gio2.DataInputStream({
        closeBaseStream: true,
        baseStream: client.get_input_stream()
      });
      const [response, _count] = inputstream.read_line_utf8(null);
      inputstream.close(null);
      if (!response) return "";
      return response;
    } catch (e) {
      console.error(e);
      return "";
    }
  }
  getMonitors() {
    try {
      const resp = this.oneOffCommand(JSON.stringify("Outputs"));
      if (resp === "") return /* @__PURE__ */ new Map();
      const parsed = JSON.parse(resp);
      const outputs = parsed.Ok.Outputs;
      return new Map(Object.values(outputs).map(({ name, make, model, serial }) => [name, { name, make, model, serial }]));
    } catch (e) {
      return /* @__PURE__ */ new Map();
    }
  }
  listenEventStream() {
    try {
      const client = this.newConnection();
      client.get_output_stream().write(JSON.stringify("EventStream") + "\n", null);
      const inputstream = new Gio2.DataInputStream({
        closeBaseStream: true,
        baseStream: client.get_input_stream()
      });
      this.readLineSocket(inputstream, (stream, result) => {
        if (!stream) return;
        const line = stream.read_line_finish(result)[0] ?? new Uint8Array([]);
        const text = new TextDecoder().decode(line);
        if (text) {
          try {
            const message = JSON.parse(text);
            this.reconcileState(message);
          } catch (e) {
            console.error("Niri Parse Error", e);
          }
        }
      });
    } catch (e) {
      console.error("Niri Socket Error", e);
    }
  }
  readLineSocket(inputstream, callback) {
    inputstream.read_line_async(0, null, (stream, result) => {
      callback(stream, result);
      if (!stream) return;
      this.readLineSocket(stream, callback);
    });
  }
  reconcileState(message) {
    let changed = false;
    if ("WorkspacesChanged" in message) {
      this.reconcileWorkspacesChanged(message.WorkspacesChanged.workspaces);
      changed = true;
    }
    if ("WorkspaceActivated" in message) {
      this.reconcileWorkspaceActivated(message.WorkspaceActivated);
      changed = true;
    }
    if ("WindowsChanged" in message) {
      this.reconcileWindowsChanged(message.WindowsChanged.windows);
      changed = true;
    }
    if ("WindowOpenedOrChanged" in message) {
      this.reconcileWindowOpenedOrChanged(message.WindowOpenedOrChanged.window);
      changed = true;
    }
    if ("WindowClosed" in message) {
      this.reconcileWindowClosed(message.WindowClosed);
      changed = true;
    }
    if ("WindowFocusChanged" in message) {
      this.reconcileWindowFocusChanged(message.WindowFocusChanged);
      changed = true;
    }
    if (changed) {
      this.notify("outputs");
      this.notify("focused-window");
      this.notify("workspaces");
    }
  }
  reconcileWorkspacesChanged(workspaces) {
    __privateGet(this, _state).workspaces = new Map(workspaces.map((ws) => [ws.id, {
      id: ws.id,
      idx: ws.idx,
      name: ws.name,
      output: ws.output,
      active_window_id: ws.active_window_id,
      is_focused: ws.is_focused,
      is_active: ws.is_active
    }]));
  }
  reconcileWorkspaceActivated(workspaceActivated) {
    const id = workspaceActivated.id;
    const focused = workspaceActivated.focused;
    const workspace = __privateGet(this, _state).workspaces.get(id);
    if (!workspace) return;
    const output = workspace.output;
    __privateGet(this, _state).workspaces = new Map(Array.from(__privateGet(this, _state).workspaces, ([key, ws]) => {
      if (ws.output == output) {
        return [key, { ...ws, is_active: focused && id === ws.id }];
      }
      return [key, ws];
    }));
  }
  reconcileWindowsChanged(windows) {
    __privateGet(this, _state).windows = new Map(windows.map((w) => [w.id, w]));
  }
  reconcileWindowOpenedOrChanged(window) {
    __privateGet(this, _state).windows.set(window.id, window);
    if (window.is_focused) {
      for (const [id, w] of __privateGet(this, _state).windows) {
        if (id !== window.id) w.is_focused = false;
      }
    }
  }
  reconcileWindowClosed(windowClosed) {
    __privateGet(this, _state).windows.delete(windowClosed.id);
  }
  reconcileWindowFocusChanged(windowFocusChanged) {
    for (const [id, w] of __privateGet(this, _state).windows) {
      w.is_focused = id === windowFocusChanged.id;
    }
  }
};
_state = new WeakMap();
__publicField(Niri, "instance");
__decorateClass([
  property(Object)
], Niri.prototype, "outputs", 1);
__decorateClass([
  property(Object)
], Niri.prototype, "windows", 1);
__decorateClass([
  property(Object)
], Niri.prototype, "focusedWindow", 1);
__decorateClass([
  property(Object)
], Niri.prototype, "workspaces", 1);
Niri = __decorateClass([
  register({ GTypeName: "Niri" })
], Niri);

// widgets/WindowTitle.tsx
function WindowTitle() {
  const niri2 = Niri.get_default();
  const layout = LayoutService_default.get_default();
  const maxChars = ConfigAdapter_default.get().value.limits?.windowTitle ?? 40;
  return /* @__PURE__ */ jsx2("box", { className: "WidgetPill", valign: Gtk4.Align.FILL, children: /* @__PURE__ */ jsx2(
    "label",
    {
      className: "WindowTitle",
      label: bind(niri2, "focusedWindow").as((w) => w ? w.title || w.app_id : "Desktop"),
      truncate: true,
      maxWidthChars: maxChars
    }
  ) });
}

// widgets/Workspaces.tsx
var niri = Niri.get_default();
function Workspace(workspace, showInactiveIcons, iconSize) {
  const traits = ["workspace"];
  if (workspace.is_active) traits.push("active");
  if (workspace.windows.length > 0) traits.push("populated");
  const showIcons = (workspace.is_active || showInactiveIcons) && workspace.windows.length > 0;
  return /* @__PURE__ */ jsx2(
    "button",
    {
      onClick: () => niri.focusWorkspaceId(workspace.id),
      className: traits.join(" "),
      valign: Gtk4.Align.FILL,
      halign: Gtk4.Align.CENTER,
      children: /* @__PURE__ */ jsxs(
        "box",
        {
          className: "WorkspaceContent",
          valign: Gtk4.Align.CENTER,
          halign: Gtk4.Align.CENTER,
          children: [
            /* @__PURE__ */ jsx2(
              "label",
              {
                className: "ws-idx",
                label: workspace.idx.toString()
              }
            ),
            showIcons && workspace.windows.map((win) => /* @__PURE__ */ jsx2(
              ThemedIcon,
              {
                appId: win.app_id,
                className: "WorkspaceIcon",
                palette: workspace.is_active ? "accent" : "primary",
                size: iconSize
              }
            ))
          ]
        }
      )
    }
  );
}
function getMonitorName(gdkmonitor) {
  const display = Gdk.Display.get_default();
  const screen = display.get_default_screen();
  for (let i = 0; i < display.get_n_monitors(); ++i) {
    if (gdkmonitor === display.get_monitor(i)) return screen.get_monitor_plug_name(i);
  }
  return null;
}
function Workspaces({ monitor, showInactiveIcons = true }) {
  const monitorName = getMonitorName(monitor);
  if (!monitorName) return /* @__PURE__ */ jsx2("box", {});
  const layout = LayoutService_default.get_default();
  const workspacesForMe = bind(niri, "outputs").as(
    (outputs) => Object.values(outputs).filter((o) => o.monitor?.name === monitorName).flatMap((o) => Object.values(o.workspaces)).sort((a, b) => a.idx - b.idx)
  );
  return /* @__PURE__ */ jsx2("box", { className: "Workspaces gap-1", valign: Gtk4.Align.FILL, children: workspacesForMe.as((ws) => ws.map((w) => Workspace(w, showInactiveIcons, layout.workspaceIconSize))) });
}

// src/registry.ts
var WIDGET_MAP = {
  "audio": Audio,
  "dashboardbutton": DashboardButton,
  "datetime": DateTime,
  "media": MediaPro,
  "resourceusage": ResourceUsage,
  "tray": Tray,
  "weather": WeatherWidget,
  "windowtitle": WindowTitle,
  "workspaces": Workspaces
};
var registry_default = WIDGET_MAP;

// windows/Bar.tsx
function Bar(monitor) {
  const { TOP, LEFT, RIGHT } = Astal7.WindowAnchor;
  const layout = LayoutService_default.get_default();
  const config = bind(ConfigAdapter_default.get().adapter);
  const renderSection = (sectionName) => {
    return config.as((c) => c.layout.bar[sectionName]).as(
      (ids) => ids.map((id) => {
        const Component = registry_default[id];
        if (!Component) {
          print(`[Bar] Warning: Widget '${id}' not found in registry.`);
          return null;
        }
        return /* @__PURE__ */ jsx2(Component, { monitor });
      })
    );
  };
  return /* @__PURE__ */ jsx2(
    "window",
    {
      name: "bar",
      className: "Bar",
      gdkmonitor: monitor,
      exclusivity: Astal7.Exclusivity.EXCLUSIVE,
      anchor: TOP | LEFT | RIGHT,
      application: app_default,
      heightRequest: layout.barHeight,
      children: /* @__PURE__ */ jsxs("centerbox", { className: "BarContent", children: [
        /* @__PURE__ */ jsx2("box", { className: "Left", halign: Gtk4.Align.START, children: renderSection("left") }),
        /* @__PURE__ */ jsx2("box", { className: "Center", halign: Gtk4.Align.CENTER, children: renderSection("center") }),
        /* @__PURE__ */ jsx2("box", { className: "Right", halign: Gtk4.Align.END, children: renderSection("right") })
      ] })
    }
  );
}

// src/services/NotificationService.ts
import Notifd from "gi://AstalNotifd?version=0.1";
var _notifd, _recentNotifications, _dedupWindow;
var NotificationService = class extends GObject4.Object {
  // ms
  constructor() {
    super();
    __privateAdd(this, _notifd);
    __privateAdd(this, _recentNotifications, /* @__PURE__ */ new Map());
    // hash -> timestamp
    __privateAdd(this, _dedupWindow, 1e3);
    __privateSet(this, _notifd, Notifd.get_default());
    __privateGet(this, _notifd).connect("notified", (_, id) => {
      this.handleNotification(id);
    });
  }
  static get_default() {
    if (!this.instance) this.instance = new NotificationService();
    return this.instance;
  }
  handleNotification(id) {
    const notification = __privateGet(this, _notifd).get_notification(id);
    if (!notification) return;
    const content = `${notification.appName}${notification.summary}${notification.body}`;
    const checksum = new default2.Checksum(default2.ChecksumType.SHA256);
    checksum.update(content);
    const hash = checksum.get_string();
    const now = Date.now();
    if (__privateGet(this, _recentNotifications).has(hash)) {
      const lastTime = __privateGet(this, _recentNotifications).get(hash);
      if (now - lastTime < __privateGet(this, _dedupWindow)) {
        print(`[NotificationService] Spam detected! Dismissing: ${notification.summary}`);
        notification.dismiss();
        return;
      }
    }
    __privateGet(this, _recentNotifications).set(hash, now);
    if (__privateGet(this, _recentNotifications).size > 50) {
      for (const [k, t] of __privateGet(this, _recentNotifications)) {
        if (now - t > __privateGet(this, _dedupWindow)) __privateGet(this, _recentNotifications).delete(k);
      }
    }
  }
};
_notifd = new WeakMap();
_recentNotifications = new WeakMap();
_dedupWindow = new WeakMap();
__publicField(NotificationService, "instance");
NotificationService = __decorateClass([
  register({ GTypeName: "NotificationService" })
], NotificationService);

// src/services/CssInjectionService.ts
var CssInjectionService = class _CssInjectionService {
  static instance;
  static get() {
    if (!this.instance) this.instance = new _CssInjectionService();
    return this.instance;
  }
  constructor() {
    this.init();
  }
  init() {
    ConfigAdapter_default.get().adapter.subscribe((config) => {
      this.generateAndApply(config);
    });
    this.generateAndApply(ConfigAdapter_default.get().value);
  }
  generateAndApply(config) {
    try {
      const css = this.generateCss(config);
      app_default.apply_css(css);
      console.log("[CssInjectionService] CSS injected successfully.");
    } catch (e) {
      console.error(`[CssInjectionService] Failed to inject CSS: ${e}`);
    }
  }
  generateCss(c) {
    const rawU = Math.floor(c.layout.barHeight * c.scaling.unitRatio);
    const U = isNaN(rawU) || rawU <= 0 ? 8 : rawU;
    const R = c.scaling.radiusRatio;
    const spacing1 = U * 1;
    const spacing2 = U * 2;
    const spacing3 = U * 3;
    const marginV = Math.floor(U * (c.layout.padding?.vertical ?? 0));
    const marginH = Math.floor(U * (c.layout.padding?.horizontal ?? 3));
    const radius2 = Math.floor(U * R * 2);
    const fontSize = Math.max(Math.floor(c.layout.barHeight * c.scaling.fontRatio), c.scaling.minFontSize);
    const workspaceIconSize = Math.floor(c.layout.barHeight * (c.layout.bar.workspaceScale ?? 0.5));
    const artSize = Math.floor(c.layout.barHeight * 0.9);
    return `
@define-color primary ${c.appearance.colors.primary};
@define-color surface ${c.appearance.colors.surface};
@define-color surfaceDarker ${c.appearance.colors.surfaceDarker};
@define-color text ${c.appearance.colors.text};
@define-color border ${c.appearance.colors.border};
@define-color accent ${c.appearance.colors.accent};
@define-color bar_bg ${c.appearance.colors.bar_bg};

.WidgetPill, .MediaPill {
    background-color: @surface;
    padding: 0px ${spacing2}px;
    margin: ${marginV}px ${marginH}px;
    min-height: 0px;
    min-width: 0px;
    border-radius: ${radius2}px;
}

.WidgetPill label, .MediaPill label {
    font-size: ${fontSize}px;
    color: @text;
}

.DashboardIcon {
    padding: 0px ${spacing1}px;
}

.DateTime {
    font-size: ${fontSize}px;
}

.accent label {
    color: @accent;
}

.urgent label {
    color: @primary;
}

.MediaProPill {
    background-color: @surface;
    padding: 0px ${spacing2}px;
    margin: ${marginV}px ${marginH}px;
    min-height: 0px;
    min-width: 0px;
    border-radius: ${radius2}px;
}

.MediaProContent {
    padding: 0px;
    padding-left: ${Math.floor(spacing1 / 2)}px;
}

.ArtCircle {
    min-width: ${artSize}px;
    min-height: ${artSize}px;
    border-radius: 50%;
    background-size: cover;
    background-position: center;
    background-color: @surfaceDarker;
}

.Workspaces .workspace {
    border-radius: ${radius2}px;
}

.WorkspaceIcon {
    min-width: ${workspaceIconSize}px;
    min-height: ${workspaceIconSize}px;
    font-size: ${workspaceIconSize}px;
}

.ArtCircle icon {
    color: @text;
}

.TrackInfo {
    margin: 0px ${spacing1}px;
}

.TrackTitle {
    font-size: ${fontSize}px;
    font-weight: 600;
    color: @text;
}

.TrackArtist {
    font-size: ${fontSize}px;
    font-weight: 500;
    color: @accent;
}

.gap-1 > * {
    margin-right: ${spacing1}px;
}
.gap-1 > *:last-child {
    margin-right: 0px;
}

.gap-2 > * {
    margin-right: ${spacing2}px;
}
.gap-2 > *:last-child {
    margin-right: 0px;
}

.gap-3 > * {
    margin-right: ${spacing3}px;
}
.gap-3 > *:last-child {
    margin-right: 0px;
}

.gap-half > * {
    margin-right: ${Math.floor(spacing1 / 2)}px;
}
.gap-half > *:last-child {
    margin-right: 0px;
}
`;
  }
};
var CssInjectionService_default = CssInjectionService;

// app.tsx
var SCRIPT_DIR2 = default2.path_get_dirname(
  import.meta.url.replace("file://", "")
);
var GTK_CSS_PATH = `${default2.get_home_dir()}/.cache/wal/ags-colors.css`;
var SIGNAL_FILE2 = `${default2.get_home_dir()}/.cache/theme-engine/signal`;
var MAIN_CSS_PATH = `${SCRIPT_DIR2}/style/main.css`;
var LOADER_CSS_PATH = "/tmp/astal-loader.css";
var generateLoader = () => {
  try {
    const content = `
@import url("file://${GTK_CSS_PATH}");
@import url("file://${MAIN_CSS_PATH}");
`;
    default2.file_set_contents(LOADER_CSS_PATH, content);
    return true;
  } catch (e) {
    print(`[App] CRITICAL: Failed to generate CSS loader: ${e}`);
    return false;
  }
};
try {
  if (!generateLoader()) app_default.quit();
  const niri2 = Niri.get_default();
  app_default.start({
    instanceName: "com.lis.bar",
    // We load the Unified Loader file.
    css: LOADER_CSS_PATH,
    main() {
      const cacheDir = `${default2.get_home_dir()}/.cache/astal/mpris`;
      default2.spawn_command_line_async(
        `find ${cacheDir} -type f -mtime +1 -delete`
      );
      ConfigAdapter_default.get();
      CssInjectionService_default.get();
      LayoutService_default.get_default();
      NotificationService.get_default();
      const screen = Gdk.Screen.get_default();
      const cssProvider = new Gtk4.CssProvider();
      const applyCss = () => {
        generateLoader();
        try {
          cssProvider.load_from_path(LOADER_CSS_PATH);
          Gtk4.StyleContext.reset_widgets(screen);
          print(`[App] Theme reloaded via Unified Loader.`);
        } catch (e) {
          print(`[App] CSS Load Error: ${e}`);
        }
      };
      Gtk4.StyleContext.add_provider_for_screen(
        screen,
        cssProvider,
        Gtk4.STYLE_PROVIDER_PRIORITY_APPLICATION + 100
      );
      monitorFile(SIGNAL_FILE2, () => {
        print("[App] Reload signal received.");
        applyCss();
      });
      const toggleAction = new Gio.SimpleAction({
        name: "toggle-window",
        parameter_type: new default2.VariantType("s")
      });
      toggleAction.connect("activate", (_, param) => {
        if (param) {
          const winName = param.unpack();
          app_default.toggle_window(winName);
        }
      });
      app_default.add_action(toggleAction);
      const bars = /* @__PURE__ */ new Map();
      const renderBars = () => {
        for (const w of bars.values()) w.destroy();
        bars.clear();
        for (const m of app_default.get_monitors()) bars.set(m, Bar(m));
      };
      renderBars();
      app_default.connect("monitor-added", (_, m) => bars.set(m, Bar(m)));
      app_default.connect("monitor-removed", (_, m) => {
        bars.get(m)?.destroy();
        bars.delete(m);
      });
    }
  });
} catch (e) {
  print(`CRITICAL ERROR in app.tsx: ${e}`);
  app_default.quit();
}
/*! Bundled license information:

smol-toml/dist/error.js:
  (*!
   * Copyright (c) Squirrel Chat et al., All rights reserved.
   * SPDX-License-Identifier: BSD-3-Clause
   *
   * Redistribution and use in source and binary forms, with or without
   * modification, are permitted provided that the following conditions are met:
   *
   * 1. Redistributions of source code must retain the above copyright notice, this
   *    list of conditions and the following disclaimer.
   * 2. Redistributions in binary form must reproduce the above copyright notice,
   *    this list of conditions and the following disclaimer in the
   *    documentation and/or other materials provided with the distribution.
   * 3. Neither the name of the copyright holder nor the names of its contributors
   *    may be used to endorse or promote products derived from this software without
   *    specific prior written permission.
   *
   * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
   * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
   * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
   * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
   * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
   * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
   * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
   * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
   * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
   * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   *)

smol-toml/dist/util.js:
  (*!
   * Copyright (c) Squirrel Chat et al., All rights reserved.
   * SPDX-License-Identifier: BSD-3-Clause
   *
   * Redistribution and use in source and binary forms, with or without
   * modification, are permitted provided that the following conditions are met:
   *
   * 1. Redistributions of source code must retain the above copyright notice, this
   *    list of conditions and the following disclaimer.
   * 2. Redistributions in binary form must reproduce the above copyright notice,
   *    this list of conditions and the following disclaimer in the
   *    documentation and/or other materials provided with the distribution.
   * 3. Neither the name of the copyright holder nor the names of its contributors
   *    may be used to endorse or promote products derived from this software without
   *    specific prior written permission.
   *
   * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
   * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
   * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
   * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
   * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
   * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
   * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
   * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
   * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
   * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   *)

smol-toml/dist/date.js:
  (*!
   * Copyright (c) Squirrel Chat et al., All rights reserved.
   * SPDX-License-Identifier: BSD-3-Clause
   *
   * Redistribution and use in source and binary forms, with or without
   * modification, are permitted provided that the following conditions are met:
   *
   * 1. Redistributions of source code must retain the above copyright notice, this
   *    list of conditions and the following disclaimer.
   * 2. Redistributions in binary form must reproduce the above copyright notice,
   *    this list of conditions and the following disclaimer in the
   *    documentation and/or other materials provided with the distribution.
   * 3. Neither the name of the copyright holder nor the names of its contributors
   *    may be used to endorse or promote products derived from this software without
   *    specific prior written permission.
   *
   * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
   * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
   * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
   * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
   * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
   * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
   * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
   * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
   * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
   * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   *)

smol-toml/dist/primitive.js:
  (*!
   * Copyright (c) Squirrel Chat et al., All rights reserved.
   * SPDX-License-Identifier: BSD-3-Clause
   *
   * Redistribution and use in source and binary forms, with or without
   * modification, are permitted provided that the following conditions are met:
   *
   * 1. Redistributions of source code must retain the above copyright notice, this
   *    list of conditions and the following disclaimer.
   * 2. Redistributions in binary form must reproduce the above copyright notice,
   *    this list of conditions and the following disclaimer in the
   *    documentation and/or other materials provided with the distribution.
   * 3. Neither the name of the copyright holder nor the names of its contributors
   *    may be used to endorse or promote products derived from this software without
   *    specific prior written permission.
   *
   * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
   * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
   * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
   * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
   * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
   * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
   * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
   * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
   * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
   * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   *)

smol-toml/dist/extract.js:
  (*!
   * Copyright (c) Squirrel Chat et al., All rights reserved.
   * SPDX-License-Identifier: BSD-3-Clause
   *
   * Redistribution and use in source and binary forms, with or without
   * modification, are permitted provided that the following conditions are met:
   *
   * 1. Redistributions of source code must retain the above copyright notice, this
   *    list of conditions and the following disclaimer.
   * 2. Redistributions in binary form must reproduce the above copyright notice,
   *    this list of conditions and the following disclaimer in the
   *    documentation and/or other materials provided with the distribution.
   * 3. Neither the name of the copyright holder nor the names of its contributors
   *    may be used to endorse or promote products derived from this software without
   *    specific prior written permission.
   *
   * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
   * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
   * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
   * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
   * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
   * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
   * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
   * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
   * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
   * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   *)

smol-toml/dist/struct.js:
  (*!
   * Copyright (c) Squirrel Chat et al., All rights reserved.
   * SPDX-License-Identifier: BSD-3-Clause
   *
   * Redistribution and use in source and binary forms, with or without
   * modification, are permitted provided that the following conditions are met:
   *
   * 1. Redistributions of source code must retain the above copyright notice, this
   *    list of conditions and the following disclaimer.
   * 2. Redistributions in binary form must reproduce the above copyright notice,
   *    this list of conditions and the following disclaimer in the
   *    documentation and/or other materials provided with the distribution.
   * 3. Neither the name of the copyright holder nor the names of its contributors
   *    may be used to endorse or promote products derived from this software without
   *    specific prior written permission.
   *
   * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
   * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
   * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
   * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
   * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
   * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
   * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
   * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
   * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
   * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   *)

smol-toml/dist/parse.js:
  (*!
   * Copyright (c) Squirrel Chat et al., All rights reserved.
   * SPDX-License-Identifier: BSD-3-Clause
   *
   * Redistribution and use in source and binary forms, with or without
   * modification, are permitted provided that the following conditions are met:
   *
   * 1. Redistributions of source code must retain the above copyright notice, this
   *    list of conditions and the following disclaimer.
   * 2. Redistributions in binary form must reproduce the above copyright notice,
   *    this list of conditions and the following disclaimer in the
   *    documentation and/or other materials provided with the distribution.
   * 3. Neither the name of the copyright holder nor the names of its contributors
   *    may be used to endorse or promote products derived from this software without
   *    specific prior written permission.
   *
   * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
   * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
   * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
   * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
   * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
   * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
   * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
   * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
   * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
   * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   *)

smol-toml/dist/stringify.js:
  (*!
   * Copyright (c) Squirrel Chat et al., All rights reserved.
   * SPDX-License-Identifier: BSD-3-Clause
   *
   * Redistribution and use in source and binary forms, with or without
   * modification, are permitted provided that the following conditions are met:
   *
   * 1. Redistributions of source code must retain the above copyright notice, this
   *    list of conditions and the following disclaimer.
   * 2. Redistributions in binary form must reproduce the above copyright notice,
   *    this list of conditions and the following disclaimer in the
   *    documentation and/or other materials provided with the distribution.
   * 3. Neither the name of the copyright holder nor the names of its contributors
   *    may be used to endorse or promote products derived from this software without
   *    specific prior written permission.
   *
   * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
   * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
   * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
   * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
   * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
   * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
   * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
   * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
   * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
   * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   *)

smol-toml/dist/index.js:
  (*!
   * Copyright (c) Squirrel Chat et al., All rights reserved.
   * SPDX-License-Identifier: BSD-3-Clause
   *
   * Redistribution and use in source and binary forms, with or without
   * modification, are permitted provided that the following conditions are met:
   *
   * 1. Redistributions of source code must retain the above copyright notice, this
   *    list of conditions and the following disclaimer.
   * 2. Redistributions in binary form must reproduce the above copyright notice,
   *    this list of conditions and the following disclaimer in the
   *    documentation and/or other materials provided with the distribution.
   * 3. Neither the name of the copyright holder nor the names of its contributors
   *    may be used to endorse or promote products derived from this software without
   *    specific prior written permission.
   *
   * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
   * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
   * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
   * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
   * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
   * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
   * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
   * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
   * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
   * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   *)
*/
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vbml4L3N0b3JlLzFja3F2bXI5aG5nZmFud2E2YXcyM2Nza3ltdmgyMTVjLWFzdGFsLWdqcy9zaGFyZS9hc3RhbC9nanMvZ3RrMy9pbmRleC50cyIsICIuLi8uLi8uLi8uLi8uLi8uLi8uLi9uaXgvc3RvcmUvMWNrcXZtcjlobmdmYW53YTZhdzIzY3NreW12aDIxNWMtYXN0YWwtZ2pzL3NoYXJlL2FzdGFsL2dqcy92YXJpYWJsZS50cyIsICIuLi8uLi8uLi8uLi8uLi8uLi8uLi9uaXgvc3RvcmUvMWNrcXZtcjlobmdmYW53YTZhdzIzY3NreW12aDIxNWMtYXN0YWwtZ2pzL3NoYXJlL2FzdGFsL2dqcy9iaW5kaW5nLnRzIiwgIi4uLy4uLy4uLy4uLy4uLy4uLy4uL25peC9zdG9yZS8xY2txdm1yOWhuZ2ZhbndhNmF3MjNjc2t5bXZoMjE1Yy1hc3RhbC1nanMvc2hhcmUvYXN0YWwvZ2pzL3RpbWUudHMiLCAiLi4vLi4vLi4vLi4vLi4vLi4vLi4vbml4L3N0b3JlLzFja3F2bXI5aG5nZmFud2E2YXcyM2Nza3ltdmgyMTVjLWFzdGFsLWdqcy9zaGFyZS9hc3RhbC9nanMvcHJvY2Vzcy50cyIsICIuLi8uLi8uLi8uLi8uLi8uLi8uLi9uaXgvc3RvcmUvMWNrcXZtcjlobmdmYW53YTZhdzIzY3NreW12aDIxNWMtYXN0YWwtZ2pzL3NoYXJlL2FzdGFsL2dqcy9fYXN0YWwudHMiLCAiLi4vLi4vLi4vLi4vLi4vLi4vLi4vbml4L3N0b3JlLzFja3F2bXI5aG5nZmFud2E2YXcyM2Nza3ltdmgyMTVjLWFzdGFsLWdqcy9zaGFyZS9hc3RhbC9nanMvZ3RrMy9hc3RhbGlmeS50cyIsICIuLi8uLi8uLi8uLi8uLi8uLi8uLi9uaXgvc3RvcmUvMWNrcXZtcjlobmdmYW53YTZhdzIzY3NreW12aDIxNWMtYXN0YWwtZ2pzL3NoYXJlL2FzdGFsL2dqcy9ndGszL2FwcC50cyIsICIuLi8uLi8uLi8uLi8uLi8uLi8uLi9uaXgvc3RvcmUvMWNrcXZtcjlobmdmYW53YTZhdzIzY3NreW12aDIxNWMtYXN0YWwtZ2pzL3NoYXJlL2FzdGFsL2dqcy9vdmVycmlkZXMudHMiLCAiLi4vLi4vLi4vLi4vLi4vLi4vLi4vbml4L3N0b3JlLzFja3F2bXI5aG5nZmFud2E2YXcyM2Nza3ltdmgyMTVjLWFzdGFsLWdqcy9zaGFyZS9hc3RhbC9nanMvX2FwcC50cyIsICIuLi8uLi8uLi8uLi8uLi8uLi8uLi9uaXgvc3RvcmUvMWNrcXZtcjlobmdmYW53YTZhdzIzY3NreW12aDIxNWMtYXN0YWwtZ2pzL3NoYXJlL2FzdGFsL2dqcy9ndGszL3dpZGdldC50cyIsICIuLi8uLi8uLi8uLi8uLi8uLi8uLi9uaXgvc3RvcmUvMWNrcXZtcjlobmdmYW53YTZhdzIzY3NreW12aDIxNWMtYXN0YWwtZ2pzL3NoYXJlL2FzdGFsL2dqcy9maWxlLnRzIiwgIi4uLy4uLy4uLy4uLy4uLy4uLy4uL25peC9zdG9yZS8xY2txdm1yOWhuZ2ZhbndhNmF3MjNjc2t5bXZoMjE1Yy1hc3RhbC1nanMvc2hhcmUvYXN0YWwvZ2pzL2luZGV4LnRzIiwgIi4uLy4uLy4uLy4uLy4uLy4uLy4uL25peC9zdG9yZS8xY2txdm1yOWhuZ2ZhbndhNmF3MjNjc2t5bXZoMjE1Yy1hc3RhbC1nanMvc2hhcmUvYXN0YWwvZ2pzL2dvYmplY3QudHMiLCAibm9kZV9tb2R1bGVzL3pvZC92My9leHRlcm5hbC5qcyIsICJub2RlX21vZHVsZXMvem9kL3YzL2hlbHBlcnMvdXRpbC5qcyIsICJub2RlX21vZHVsZXMvem9kL3YzL1pvZEVycm9yLmpzIiwgIm5vZGVfbW9kdWxlcy96b2QvdjMvbG9jYWxlcy9lbi5qcyIsICJub2RlX21vZHVsZXMvem9kL3YzL2Vycm9ycy5qcyIsICJub2RlX21vZHVsZXMvem9kL3YzL2hlbHBlcnMvcGFyc2VVdGlsLmpzIiwgIm5vZGVfbW9kdWxlcy96b2QvdjMvaGVscGVycy9lcnJvclV0aWwuanMiLCAibm9kZV9tb2R1bGVzL3pvZC92My90eXBlcy5qcyIsICJub2RlX21vZHVsZXMvc21vbC10b21sL2Rpc3QvZXJyb3IuanMiLCAibm9kZV9tb2R1bGVzL3Ntb2wtdG9tbC9kaXN0L3V0aWwuanMiLCAibm9kZV9tb2R1bGVzL3Ntb2wtdG9tbC9kaXN0L2RhdGUuanMiLCAibm9kZV9tb2R1bGVzL3Ntb2wtdG9tbC9kaXN0L3ByaW1pdGl2ZS5qcyIsICJub2RlX21vZHVsZXMvc21vbC10b21sL2Rpc3QvZXh0cmFjdC5qcyIsICJub2RlX21vZHVsZXMvc21vbC10b21sL2Rpc3Qvc3RydWN0LmpzIiwgIm5vZGVfbW9kdWxlcy9zbW9sLXRvbWwvZGlzdC9wYXJzZS5qcyIsICJzcmMvQ29uZmlnQWRhcHRlci50cyIsICJzcmMvTGF5b3V0U2VydmljZS50cyIsICJ3aWRnZXRzL0F1ZGlvLnRzeCIsICIuLi8uLi8uLi8uLi8uLi8uLi8uLi9uaXgvc3RvcmUvMWNrcXZtcjlobmdmYW53YTZhdzIzY3NreW12aDIxNWMtYXN0YWwtZ2pzL3NoYXJlL2FzdGFsL2dqcy9ndGszL2pzeC1ydW50aW1lLnRzIiwgIndpZGdldHMvRGFzaGJvYXJkQnV0dG9uLnRzeCIsICJ3aWRnZXRzL0RhdGVUaW1lLnRzeCIsICJzcmMvc2VydmljZXMvTWVkaWFTZXJ2aWNlLnRzIiwgIndpZGdldHMvTWVkaWFQcm8udHN4IiwgInNyYy9zZXJ2aWNlcy91c2FnZS50cyIsICJ3aWRnZXRzL1Jlc291cmNlVXNhZ2UudHN4IiwgIndpZGdldHMvVHJheS50c3giLCAic3JjL3NlcnZpY2VzL0ljb25TZXJ2aWNlLnRzIiwgInNyYy9jb21wb25lbnRzL1RoZW1lZEljb24udHN4IiwgInNyYy9zZXJ2aWNlcy93ZWF0aGVyLnRzIiwgIndpZGdldHMvV2VhdGhlci50c3giLCAic3JjL3NlcnZpY2VzL25pcmkudHMiLCAid2lkZ2V0cy9XaW5kb3dUaXRsZS50c3giLCAid2lkZ2V0cy9Xb3Jrc3BhY2VzLnRzeCIsICJzcmMvcmVnaXN0cnkudHMiLCAid2luZG93cy9CYXIudHN4IiwgInNyYy9zZXJ2aWNlcy9Ob3RpZmljYXRpb25TZXJ2aWNlLnRzIiwgInNyYy9zZXJ2aWNlcy9Dc3NJbmplY3Rpb25TZXJ2aWNlLnRzIiwgImFwcC50c3giXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCBBc3RhbCBmcm9tIFwiZ2k6Ly9Bc3RhbD92ZXJzaW9uPTMuMFwiXG5pbXBvcnQgR3RrIGZyb20gXCJnaTovL0d0az92ZXJzaW9uPTMuMFwiXG5pbXBvcnQgR2RrIGZyb20gXCJnaTovL0dkaz92ZXJzaW9uPTMuMFwiXG5pbXBvcnQgYXN0YWxpZnksIHsgdHlwZSBDb25zdHJ1Y3RQcm9wcywgdHlwZSBCaW5kYWJsZVByb3BzIH0gZnJvbSBcIi4vYXN0YWxpZnkuanNcIlxuXG5leHBvcnQgeyBBc3RhbCwgR3RrLCBHZGsgfVxuZXhwb3J0IHsgZGVmYXVsdCBhcyBBcHAgfSBmcm9tIFwiLi9hcHAuanNcIlxuZXhwb3J0IHsgYXN0YWxpZnksIENvbnN0cnVjdFByb3BzLCBCaW5kYWJsZVByb3BzIH1cbmV4cG9ydCAqIGFzIFdpZGdldCBmcm9tIFwiLi93aWRnZXQuanNcIlxuZXhwb3J0IHsgaG9vayB9IGZyb20gXCIuLi9fYXN0YWxcIlxuIiwgImltcG9ydCBBc3RhbCBmcm9tIFwiZ2k6Ly9Bc3RhbElPXCJcbmltcG9ydCBCaW5kaW5nLCB7IHR5cGUgQ29ubmVjdGFibGUsIHR5cGUgU3Vic2NyaWJhYmxlIH0gZnJvbSBcIi4vYmluZGluZy5qc1wiXG5pbXBvcnQgeyBpbnRlcnZhbCB9IGZyb20gXCIuL3RpbWUuanNcIlxuaW1wb3J0IHsgZXhlY0FzeW5jLCBzdWJwcm9jZXNzIH0gZnJvbSBcIi4vcHJvY2Vzcy5qc1wiXG5cbmNsYXNzIFZhcmlhYmxlV3JhcHBlcjxUPiBleHRlbmRzIEZ1bmN0aW9uIHtcbiAgICBwcml2YXRlIHZhcmlhYmxlITogQXN0YWwuVmFyaWFibGVCYXNlXG4gICAgcHJpdmF0ZSBlcnJIYW5kbGVyPyA9IGNvbnNvbGUuZXJyb3JcblxuICAgIHByaXZhdGUgX3ZhbHVlOiBUXG4gICAgcHJpdmF0ZSBfcG9sbD86IEFzdGFsLlRpbWVcbiAgICBwcml2YXRlIF93YXRjaD86IEFzdGFsLlByb2Nlc3NcblxuICAgIHByaXZhdGUgcG9sbEludGVydmFsID0gMTAwMFxuICAgIHByaXZhdGUgcG9sbEV4ZWM/OiBzdHJpbmdbXSB8IHN0cmluZ1xuICAgIHByaXZhdGUgcG9sbFRyYW5zZm9ybT86IChzdGRvdXQ6IHN0cmluZywgcHJldjogVCkgPT4gVFxuICAgIHByaXZhdGUgcG9sbEZuPzogKHByZXY6IFQpID0+IFQgfCBQcm9taXNlPFQ+XG5cbiAgICBwcml2YXRlIHdhdGNoVHJhbnNmb3JtPzogKHN0ZG91dDogc3RyaW5nLCBwcmV2OiBUKSA9PiBUXG4gICAgcHJpdmF0ZSB3YXRjaEV4ZWM/OiBzdHJpbmdbXSB8IHN0cmluZ1xuXG4gICAgY29uc3RydWN0b3IoaW5pdDogVCkge1xuICAgICAgICBzdXBlcigpXG4gICAgICAgIHRoaXMuX3ZhbHVlID0gaW5pdFxuICAgICAgICB0aGlzLnZhcmlhYmxlID0gbmV3IEFzdGFsLlZhcmlhYmxlQmFzZSgpXG4gICAgICAgIHRoaXMudmFyaWFibGUuY29ubmVjdChcImRyb3BwZWRcIiwgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zdG9wV2F0Y2goKVxuICAgICAgICAgICAgdGhpcy5zdG9wUG9sbCgpXG4gICAgICAgIH0pXG4gICAgICAgIHRoaXMudmFyaWFibGUuY29ubmVjdChcImVycm9yXCIsIChfLCBlcnIpID0+IHRoaXMuZXJySGFuZGxlcj8uKGVycikpXG4gICAgICAgIHJldHVybiBuZXcgUHJveHkodGhpcywge1xuICAgICAgICAgICAgYXBwbHk6ICh0YXJnZXQsIF8sIGFyZ3MpID0+IHRhcmdldC5fY2FsbChhcmdzWzBdKSxcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICBwcml2YXRlIF9jYWxsPFIgPSBUPih0cmFuc2Zvcm0/OiAodmFsdWU6IFQpID0+IFIpOiBCaW5kaW5nPFI+IHtcbiAgICAgICAgY29uc3QgYiA9IEJpbmRpbmcuYmluZCh0aGlzKVxuICAgICAgICByZXR1cm4gdHJhbnNmb3JtID8gYi5hcyh0cmFuc2Zvcm0pIDogYiBhcyB1bmtub3duIGFzIEJpbmRpbmc8Uj5cbiAgICB9XG5cbiAgICB0b1N0cmluZygpIHtcbiAgICAgICAgcmV0dXJuIFN0cmluZyhgVmFyaWFibGU8JHt0aGlzLmdldCgpfT5gKVxuICAgIH1cblxuICAgIGdldCgpOiBUIHsgcmV0dXJuIHRoaXMuX3ZhbHVlIH1cbiAgICBzZXQodmFsdWU6IFQpIHtcbiAgICAgICAgaWYgKHZhbHVlICE9PSB0aGlzLl92YWx1ZSkge1xuICAgICAgICAgICAgdGhpcy5fdmFsdWUgPSB2YWx1ZVxuICAgICAgICAgICAgdGhpcy52YXJpYWJsZS5lbWl0KFwiY2hhbmdlZFwiKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgc3RhcnRQb2xsKCkge1xuICAgICAgICBpZiAodGhpcy5fcG9sbClcbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIGlmICh0aGlzLnBvbGxGbikge1xuICAgICAgICAgICAgdGhpcy5fcG9sbCA9IGludGVydmFsKHRoaXMucG9sbEludGVydmFsLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgdiA9IHRoaXMucG9sbEZuISh0aGlzLmdldCgpKVxuICAgICAgICAgICAgICAgIGlmICh2IGluc3RhbmNlb2YgUHJvbWlzZSkge1xuICAgICAgICAgICAgICAgICAgICB2LnRoZW4odiA9PiB0aGlzLnNldCh2KSlcbiAgICAgICAgICAgICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4gdGhpcy52YXJpYWJsZS5lbWl0KFwiZXJyb3JcIiwgZXJyKSlcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldCh2KVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5wb2xsRXhlYykge1xuICAgICAgICAgICAgdGhpcy5fcG9sbCA9IGludGVydmFsKHRoaXMucG9sbEludGVydmFsLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgZXhlY0FzeW5jKHRoaXMucG9sbEV4ZWMhKVxuICAgICAgICAgICAgICAgICAgICAudGhlbih2ID0+IHRoaXMuc2V0KHRoaXMucG9sbFRyYW5zZm9ybSEodiwgdGhpcy5nZXQoKSkpKVxuICAgICAgICAgICAgICAgICAgICAuY2F0Y2goZXJyID0+IHRoaXMudmFyaWFibGUuZW1pdChcImVycm9yXCIsIGVycikpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgc3RhcnRXYXRjaCgpIHtcbiAgICAgICAgaWYgKHRoaXMuX3dhdGNoKVxuICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgdGhpcy5fd2F0Y2ggPSBzdWJwcm9jZXNzKHtcbiAgICAgICAgICAgIGNtZDogdGhpcy53YXRjaEV4ZWMhLFxuICAgICAgICAgICAgb3V0OiBvdXQgPT4gdGhpcy5zZXQodGhpcy53YXRjaFRyYW5zZm9ybSEob3V0LCB0aGlzLmdldCgpKSksXG4gICAgICAgICAgICBlcnI6IGVyciA9PiB0aGlzLnZhcmlhYmxlLmVtaXQoXCJlcnJvclwiLCBlcnIpLFxuICAgICAgICB9KVxuICAgIH1cblxuICAgIHN0b3BQb2xsKCkge1xuICAgICAgICB0aGlzLl9wb2xsPy5jYW5jZWwoKVxuICAgICAgICBkZWxldGUgdGhpcy5fcG9sbFxuICAgIH1cblxuICAgIHN0b3BXYXRjaCgpIHtcbiAgICAgICAgdGhpcy5fd2F0Y2g/LmtpbGwoKVxuICAgICAgICBkZWxldGUgdGhpcy5fd2F0Y2hcbiAgICB9XG5cbiAgICBpc1BvbGxpbmcoKSB7IHJldHVybiAhIXRoaXMuX3BvbGwgfVxuICAgIGlzV2F0Y2hpbmcoKSB7IHJldHVybiAhIXRoaXMuX3dhdGNoIH1cblxuICAgIGRyb3AoKSB7XG4gICAgICAgIHRoaXMudmFyaWFibGUuZW1pdChcImRyb3BwZWRcIilcbiAgICB9XG5cbiAgICBvbkRyb3BwZWQoY2FsbGJhY2s6ICgpID0+IHZvaWQpIHtcbiAgICAgICAgdGhpcy52YXJpYWJsZS5jb25uZWN0KFwiZHJvcHBlZFwiLCBjYWxsYmFjaylcbiAgICAgICAgcmV0dXJuIHRoaXMgYXMgdW5rbm93biBhcyBWYXJpYWJsZTxUPlxuICAgIH1cblxuICAgIG9uRXJyb3IoY2FsbGJhY2s6IChlcnI6IHN0cmluZykgPT4gdm9pZCkge1xuICAgICAgICBkZWxldGUgdGhpcy5lcnJIYW5kbGVyXG4gICAgICAgIHRoaXMudmFyaWFibGUuY29ubmVjdChcImVycm9yXCIsIChfLCBlcnIpID0+IGNhbGxiYWNrKGVycikpXG4gICAgICAgIHJldHVybiB0aGlzIGFzIHVua25vd24gYXMgVmFyaWFibGU8VD5cbiAgICB9XG5cbiAgICBzdWJzY3JpYmUoY2FsbGJhY2s6ICh2YWx1ZTogVCkgPT4gdm9pZCkge1xuICAgICAgICBjb25zdCBpZCA9IHRoaXMudmFyaWFibGUuY29ubmVjdChcImNoYW5nZWRcIiwgKCkgPT4ge1xuICAgICAgICAgICAgY2FsbGJhY2sodGhpcy5nZXQoKSlcbiAgICAgICAgfSlcbiAgICAgICAgcmV0dXJuICgpID0+IHRoaXMudmFyaWFibGUuZGlzY29ubmVjdChpZClcbiAgICB9XG5cbiAgICBwb2xsKFxuICAgICAgICBpbnRlcnZhbDogbnVtYmVyLFxuICAgICAgICBleGVjOiBzdHJpbmcgfCBzdHJpbmdbXSxcbiAgICAgICAgdHJhbnNmb3JtPzogKHN0ZG91dDogc3RyaW5nLCBwcmV2OiBUKSA9PiBUXG4gICAgKTogVmFyaWFibGU8VD5cblxuICAgIHBvbGwoXG4gICAgICAgIGludGVydmFsOiBudW1iZXIsXG4gICAgICAgIGNhbGxiYWNrOiAocHJldjogVCkgPT4gVCB8IFByb21pc2U8VD5cbiAgICApOiBWYXJpYWJsZTxUPlxuXG4gICAgcG9sbChcbiAgICAgICAgaW50ZXJ2YWw6IG51bWJlcixcbiAgICAgICAgZXhlYzogc3RyaW5nIHwgc3RyaW5nW10gfCAoKHByZXY6IFQpID0+IFQgfCBQcm9taXNlPFQ+KSxcbiAgICAgICAgdHJhbnNmb3JtOiAoc3Rkb3V0OiBzdHJpbmcsIHByZXY6IFQpID0+IFQgPSBvdXQgPT4gb3V0IGFzIFQsXG4gICAgKSB7XG4gICAgICAgIHRoaXMuc3RvcFBvbGwoKVxuICAgICAgICB0aGlzLnBvbGxJbnRlcnZhbCA9IGludGVydmFsXG4gICAgICAgIHRoaXMucG9sbFRyYW5zZm9ybSA9IHRyYW5zZm9ybVxuICAgICAgICBpZiAodHlwZW9mIGV4ZWMgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhpcy5wb2xsRm4gPSBleGVjXG4gICAgICAgICAgICBkZWxldGUgdGhpcy5wb2xsRXhlY1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5wb2xsRXhlYyA9IGV4ZWNcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLnBvbGxGblxuICAgICAgICB9XG4gICAgICAgIHRoaXMuc3RhcnRQb2xsKClcbiAgICAgICAgcmV0dXJuIHRoaXMgYXMgdW5rbm93biBhcyBWYXJpYWJsZTxUPlxuICAgIH1cblxuICAgIHdhdGNoKFxuICAgICAgICBleGVjOiBzdHJpbmcgfCBzdHJpbmdbXSxcbiAgICAgICAgdHJhbnNmb3JtOiAoc3Rkb3V0OiBzdHJpbmcsIHByZXY6IFQpID0+IFQgPSBvdXQgPT4gb3V0IGFzIFQsXG4gICAgKSB7XG4gICAgICAgIHRoaXMuc3RvcFdhdGNoKClcbiAgICAgICAgdGhpcy53YXRjaEV4ZWMgPSBleGVjXG4gICAgICAgIHRoaXMud2F0Y2hUcmFuc2Zvcm0gPSB0cmFuc2Zvcm1cbiAgICAgICAgdGhpcy5zdGFydFdhdGNoKClcbiAgICAgICAgcmV0dXJuIHRoaXMgYXMgdW5rbm93biBhcyBWYXJpYWJsZTxUPlxuICAgIH1cblxuICAgIG9ic2VydmUoXG4gICAgICAgIG9ianM6IEFycmF5PFtvYmo6IENvbm5lY3RhYmxlLCBzaWduYWw6IHN0cmluZ10+LFxuICAgICAgICBjYWxsYmFjazogKC4uLmFyZ3M6IGFueVtdKSA9PiBULFxuICAgICk6IFZhcmlhYmxlPFQ+XG5cbiAgICBvYnNlcnZlKFxuICAgICAgICBvYmo6IENvbm5lY3RhYmxlLFxuICAgICAgICBzaWduYWw6IHN0cmluZyxcbiAgICAgICAgY2FsbGJhY2s6ICguLi5hcmdzOiBhbnlbXSkgPT4gVCxcbiAgICApOiBWYXJpYWJsZTxUPlxuXG4gICAgb2JzZXJ2ZShcbiAgICAgICAgb2JqczogQ29ubmVjdGFibGUgfCBBcnJheTxbb2JqOiBDb25uZWN0YWJsZSwgc2lnbmFsOiBzdHJpbmddPixcbiAgICAgICAgc2lnT3JGbjogc3RyaW5nIHwgKChvYmo6IENvbm5lY3RhYmxlLCAuLi5hcmdzOiBhbnlbXSkgPT4gVCksXG4gICAgICAgIGNhbGxiYWNrPzogKG9iajogQ29ubmVjdGFibGUsIC4uLmFyZ3M6IGFueVtdKSA9PiBULFxuICAgICkge1xuICAgICAgICBjb25zdCBmID0gdHlwZW9mIHNpZ09yRm4gPT09IFwiZnVuY3Rpb25cIiA/IHNpZ09yRm4gOiBjYWxsYmFjayA/PyAoKCkgPT4gdGhpcy5nZXQoKSlcbiAgICAgICAgY29uc3Qgc2V0ID0gKG9iajogQ29ubmVjdGFibGUsIC4uLmFyZ3M6IGFueVtdKSA9PiB0aGlzLnNldChmKG9iaiwgLi4uYXJncykpXG5cbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkob2JqcykpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3Qgb2JqIG9mIG9ianMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBbbywgc10gPSBvYmpcbiAgICAgICAgICAgICAgICBjb25zdCBpZCA9IG8uY29ubmVjdChzLCBzZXQpXG4gICAgICAgICAgICAgICAgdGhpcy5vbkRyb3BwZWQoKCkgPT4gby5kaXNjb25uZWN0KGlkKSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygc2lnT3JGbiA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGlkID0gb2Jqcy5jb25uZWN0KHNpZ09yRm4sIHNldClcbiAgICAgICAgICAgICAgICB0aGlzLm9uRHJvcHBlZCgoKSA9PiBvYmpzLmRpc2Nvbm5lY3QoaWQpKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMgYXMgdW5rbm93biBhcyBWYXJpYWJsZTxUPlxuICAgIH1cblxuICAgIHN0YXRpYyBkZXJpdmU8XG4gICAgICAgIGNvbnN0IERlcHMgZXh0ZW5kcyBBcnJheTxTdWJzY3JpYmFibGU8YW55Pj4sXG4gICAgICAgIEFyZ3MgZXh0ZW5kcyB7XG4gICAgICAgICAgICBbSyBpbiBrZXlvZiBEZXBzXTogRGVwc1tLXSBleHRlbmRzIFN1YnNjcmliYWJsZTxpbmZlciBUPiA/IFQgOiBuZXZlclxuICAgICAgICB9LFxuICAgICAgICBWID0gQXJncyxcbiAgICA+KGRlcHM6IERlcHMsIGZuOiAoLi4uYXJnczogQXJncykgPT4gViA9ICguLi5hcmdzKSA9PiBhcmdzIGFzIHVua25vd24gYXMgVikge1xuICAgICAgICBjb25zdCB1cGRhdGUgPSAoKSA9PiBmbiguLi5kZXBzLm1hcChkID0+IGQuZ2V0KCkpIGFzIEFyZ3MpXG4gICAgICAgIGNvbnN0IGRlcml2ZWQgPSBuZXcgVmFyaWFibGUodXBkYXRlKCkpXG4gICAgICAgIGNvbnN0IHVuc3VicyA9IGRlcHMubWFwKGRlcCA9PiBkZXAuc3Vic2NyaWJlKCgpID0+IGRlcml2ZWQuc2V0KHVwZGF0ZSgpKSkpXG4gICAgICAgIGRlcml2ZWQub25Ecm9wcGVkKCgpID0+IHVuc3Vicy5tYXAodW5zdWIgPT4gdW5zdWIoKSkpXG4gICAgICAgIHJldHVybiBkZXJpdmVkXG4gICAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIFZhcmlhYmxlPFQ+IGV4dGVuZHMgT21pdDxWYXJpYWJsZVdyYXBwZXI8VD4sIFwiYmluZFwiPiB7XG4gICAgPFI+KHRyYW5zZm9ybTogKHZhbHVlOiBUKSA9PiBSKTogQmluZGluZzxSPlxuICAgICgpOiBCaW5kaW5nPFQ+XG59XG5cbmV4cG9ydCBjb25zdCBWYXJpYWJsZSA9IG5ldyBQcm94eShWYXJpYWJsZVdyYXBwZXIgYXMgYW55LCB7XG4gICAgYXBwbHk6IChfdCwgX2EsIGFyZ3MpID0+IG5ldyBWYXJpYWJsZVdyYXBwZXIoYXJnc1swXSksXG59KSBhcyB7XG4gICAgZGVyaXZlOiB0eXBlb2YgVmFyaWFibGVXcmFwcGVyW1wiZGVyaXZlXCJdXG4gICAgPFQ+KGluaXQ6IFQpOiBWYXJpYWJsZTxUPlxuICAgIG5ldzxUPihpbml0OiBUKTogVmFyaWFibGU8VD5cbn1cblxuZXhwb3J0IGNvbnN0IHsgZGVyaXZlIH0gPSBWYXJpYWJsZVxuZXhwb3J0IGRlZmF1bHQgVmFyaWFibGVcbiIsICJleHBvcnQgY29uc3Qgc25ha2VpZnkgPSAoc3RyOiBzdHJpbmcpID0+IHN0clxuICAgIC5yZXBsYWNlKC8oW2Etel0pKFtBLVpdKS9nLCBcIiQxXyQyXCIpXG4gICAgLnJlcGxhY2VBbGwoXCItXCIsIFwiX1wiKVxuICAgIC50b0xvd2VyQ2FzZSgpXG5cbmV4cG9ydCBjb25zdCBrZWJhYmlmeSA9IChzdHI6IHN0cmluZykgPT4gc3RyXG4gICAgLnJlcGxhY2UoLyhbYS16XSkoW0EtWl0pL2csIFwiJDEtJDJcIilcbiAgICAucmVwbGFjZUFsbChcIl9cIiwgXCItXCIpXG4gICAgLnRvTG93ZXJDYXNlKClcblxuZXhwb3J0IGludGVyZmFjZSBTdWJzY3JpYmFibGU8VCA9IHVua25vd24+IHtcbiAgICBzdWJzY3JpYmUoY2FsbGJhY2s6ICh2YWx1ZTogVCkgPT4gdm9pZCk6ICgpID0+IHZvaWRcbiAgICBnZXQoKTogVFxuICAgIFtrZXk6IHN0cmluZ106IGFueVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIENvbm5lY3RhYmxlIHtcbiAgICBjb25uZWN0KHNpZ25hbDogc3RyaW5nLCBjYWxsYmFjazogKC4uLmFyZ3M6IGFueVtdKSA9PiB1bmtub3duKTogbnVtYmVyXG4gICAgZGlzY29ubmVjdChpZDogbnVtYmVyKTogdm9pZFxuICAgIFtrZXk6IHN0cmluZ106IGFueVxufVxuXG5leHBvcnQgY2xhc3MgQmluZGluZzxWYWx1ZT4ge1xuICAgIHByaXZhdGUgdHJhbnNmb3JtRm4gPSAodjogYW55KSA9PiB2XG5cbiAgICAjZW1pdHRlcjogU3Vic2NyaWJhYmxlPFZhbHVlPiB8IENvbm5lY3RhYmxlXG4gICAgI3Byb3A/OiBzdHJpbmdcblxuICAgIHN0YXRpYyBiaW5kPFxuICAgICAgICBUIGV4dGVuZHMgQ29ubmVjdGFibGUsXG4gICAgICAgIFAgZXh0ZW5kcyBrZXlvZiBULFxuICAgID4ob2JqZWN0OiBULCBwcm9wZXJ0eTogUCk6IEJpbmRpbmc8VFtQXT5cblxuICAgIHN0YXRpYyBiaW5kPFQ+KG9iamVjdDogU3Vic2NyaWJhYmxlPFQ+KTogQmluZGluZzxUPlxuXG4gICAgc3RhdGljIGJpbmQoZW1pdHRlcjogQ29ubmVjdGFibGUgfCBTdWJzY3JpYmFibGUsIHByb3A/OiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBCaW5kaW5nKGVtaXR0ZXIsIHByb3ApXG4gICAgfVxuXG4gICAgcHJpdmF0ZSBjb25zdHJ1Y3RvcihlbWl0dGVyOiBDb25uZWN0YWJsZSB8IFN1YnNjcmliYWJsZTxWYWx1ZT4sIHByb3A/OiBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy4jZW1pdHRlciA9IGVtaXR0ZXJcbiAgICAgICAgdGhpcy4jcHJvcCA9IHByb3AgJiYga2ViYWJpZnkocHJvcClcbiAgICB9XG5cbiAgICB0b1N0cmluZygpIHtcbiAgICAgICAgcmV0dXJuIGBCaW5kaW5nPCR7dGhpcy4jZW1pdHRlcn0ke3RoaXMuI3Byb3AgPyBgLCBcIiR7dGhpcy4jcHJvcH1cImAgOiBcIlwifT5gXG4gICAgfVxuXG4gICAgYXM8VD4oZm46ICh2OiBWYWx1ZSkgPT4gVCk6IEJpbmRpbmc8VD4ge1xuICAgICAgICBjb25zdCBiaW5kID0gbmV3IEJpbmRpbmcodGhpcy4jZW1pdHRlciwgdGhpcy4jcHJvcClcbiAgICAgICAgYmluZC50cmFuc2Zvcm1GbiA9ICh2OiBWYWx1ZSkgPT4gZm4odGhpcy50cmFuc2Zvcm1Gbih2KSlcbiAgICAgICAgcmV0dXJuIGJpbmQgYXMgdW5rbm93biBhcyBCaW5kaW5nPFQ+XG4gICAgfVxuXG4gICAgZ2V0KCk6IFZhbHVlIHtcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLiNlbWl0dGVyLmdldCA9PT0gXCJmdW5jdGlvblwiKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMudHJhbnNmb3JtRm4odGhpcy4jZW1pdHRlci5nZXQoKSlcblxuICAgICAgICBpZiAodHlwZW9mIHRoaXMuI3Byb3AgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIGNvbnN0IGdldHRlciA9IGBnZXRfJHtzbmFrZWlmeSh0aGlzLiNwcm9wKX1gXG4gICAgICAgICAgICBpZiAodHlwZW9mIHRoaXMuI2VtaXR0ZXJbZ2V0dGVyXSA9PT0gXCJmdW5jdGlvblwiKVxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnRyYW5zZm9ybUZuKHRoaXMuI2VtaXR0ZXJbZ2V0dGVyXSgpKVxuXG4gICAgICAgICAgICByZXR1cm4gdGhpcy50cmFuc2Zvcm1Gbih0aGlzLiNlbWl0dGVyW3RoaXMuI3Byb3BdKVxuICAgICAgICB9XG5cbiAgICAgICAgdGhyb3cgRXJyb3IoXCJjYW4gbm90IGdldCB2YWx1ZSBvZiBiaW5kaW5nXCIpXG4gICAgfVxuXG4gICAgc3Vic2NyaWJlKGNhbGxiYWNrOiAodmFsdWU6IFZhbHVlKSA9PiB2b2lkKTogKCkgPT4gdm9pZCB7XG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy4jZW1pdHRlci5zdWJzY3JpYmUgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuI2VtaXR0ZXIuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayh0aGlzLmdldCgpKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdGhpcy4jZW1pdHRlci5jb25uZWN0ID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIGNvbnN0IHNpZ25hbCA9IGBub3RpZnk6OiR7dGhpcy4jcHJvcH1gXG4gICAgICAgICAgICBjb25zdCBpZCA9IHRoaXMuI2VtaXR0ZXIuY29ubmVjdChzaWduYWwsICgpID0+IHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayh0aGlzLmdldCgpKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgKHRoaXMuI2VtaXR0ZXIuZGlzY29ubmVjdCBhcyBDb25uZWN0YWJsZVtcImRpc2Nvbm5lY3RcIl0pKGlkKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRocm93IEVycm9yKGAke3RoaXMuI2VtaXR0ZXJ9IGlzIG5vdCBiaW5kYWJsZWApXG4gICAgfVxufVxuXG5leHBvcnQgY29uc3QgeyBiaW5kIH0gPSBCaW5kaW5nXG5leHBvcnQgZGVmYXVsdCBCaW5kaW5nXG4iLCAiaW1wb3J0IEFzdGFsIGZyb20gXCJnaTovL0FzdGFsSU9cIlxuXG5leHBvcnQgdHlwZSBUaW1lID0gQXN0YWwuVGltZVxuZXhwb3J0IGNvbnN0IFRpbWUgPSBBc3RhbC5UaW1lXG5cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcnZhbChpbnRlcnZhbDogbnVtYmVyLCBjYWxsYmFjaz86ICgpID0+IHZvaWQpIHtcbiAgICByZXR1cm4gQXN0YWwuVGltZS5pbnRlcnZhbChpbnRlcnZhbCwgKCkgPT4gdm9pZCBjYWxsYmFjaz8uKCkpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0aW1lb3V0KHRpbWVvdXQ6IG51bWJlciwgY2FsbGJhY2s/OiAoKSA9PiB2b2lkKSB7XG4gICAgcmV0dXJuIEFzdGFsLlRpbWUudGltZW91dCh0aW1lb3V0LCAoKSA9PiB2b2lkIGNhbGxiYWNrPy4oKSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlkbGUoY2FsbGJhY2s/OiAoKSA9PiB2b2lkKSB7XG4gICAgcmV0dXJuIEFzdGFsLlRpbWUuaWRsZSgoKSA9PiB2b2lkIGNhbGxiYWNrPy4oKSlcbn1cbiIsICJpbXBvcnQgQXN0YWwgZnJvbSBcImdpOi8vQXN0YWxJT1wiXG5cbnR5cGUgQXJncyA9IHtcbiAgICBjbWQ6IHN0cmluZyB8IHN0cmluZ1tdXG4gICAgb3V0PzogKHN0ZG91dDogc3RyaW5nKSA9PiB2b2lkXG4gICAgZXJyPzogKHN0ZGVycjogc3RyaW5nKSA9PiB2b2lkXG59XG5cbmV4cG9ydCB0eXBlIFByb2Nlc3MgPSBBc3RhbC5Qcm9jZXNzXG5leHBvcnQgY29uc3QgUHJvY2VzcyA9IEFzdGFsLlByb2Nlc3NcblxuZXhwb3J0IGZ1bmN0aW9uIHN1YnByb2Nlc3MoYXJnczogQXJncyk6IEFzdGFsLlByb2Nlc3NcblxuZXhwb3J0IGZ1bmN0aW9uIHN1YnByb2Nlc3MoXG4gICAgY21kOiBzdHJpbmcgfCBzdHJpbmdbXSxcbiAgICBvbk91dD86IChzdGRvdXQ6IHN0cmluZykgPT4gdm9pZCxcbiAgICBvbkVycj86IChzdGRlcnI6IHN0cmluZykgPT4gdm9pZCxcbik6IEFzdGFsLlByb2Nlc3NcblxuZXhwb3J0IGZ1bmN0aW9uIHN1YnByb2Nlc3MoXG4gICAgYXJnc09yQ21kOiBBcmdzIHwgc3RyaW5nIHwgc3RyaW5nW10sXG4gICAgb25PdXQ6IChzdGRvdXQ6IHN0cmluZykgPT4gdm9pZCA9IHByaW50LFxuICAgIG9uRXJyOiAoc3RkZXJyOiBzdHJpbmcpID0+IHZvaWQgPSBwcmludGVycixcbikge1xuICAgIGNvbnN0IGFyZ3MgPSBBcnJheS5pc0FycmF5KGFyZ3NPckNtZCkgfHwgdHlwZW9mIGFyZ3NPckNtZCA9PT0gXCJzdHJpbmdcIlxuICAgIGNvbnN0IHsgY21kLCBlcnIsIG91dCB9ID0ge1xuICAgICAgICBjbWQ6IGFyZ3MgPyBhcmdzT3JDbWQgOiBhcmdzT3JDbWQuY21kLFxuICAgICAgICBlcnI6IGFyZ3MgPyBvbkVyciA6IGFyZ3NPckNtZC5lcnIgfHwgb25FcnIsXG4gICAgICAgIG91dDogYXJncyA/IG9uT3V0IDogYXJnc09yQ21kLm91dCB8fCBvbk91dCxcbiAgICB9XG5cbiAgICBjb25zdCBwcm9jID0gQXJyYXkuaXNBcnJheShjbWQpXG4gICAgICAgID8gQXN0YWwuUHJvY2Vzcy5zdWJwcm9jZXNzdihjbWQpXG4gICAgICAgIDogQXN0YWwuUHJvY2Vzcy5zdWJwcm9jZXNzKGNtZClcblxuICAgIHByb2MuY29ubmVjdChcInN0ZG91dFwiLCAoXywgc3Rkb3V0OiBzdHJpbmcpID0+IG91dChzdGRvdXQpKVxuICAgIHByb2MuY29ubmVjdChcInN0ZGVyclwiLCAoXywgc3RkZXJyOiBzdHJpbmcpID0+IGVycihzdGRlcnIpKVxuICAgIHJldHVybiBwcm9jXG59XG5cbi8qKiBAdGhyb3dzIHtHTGliLkVycm9yfSBUaHJvd3Mgc3RkZXJyICovXG5leHBvcnQgZnVuY3Rpb24gZXhlYyhjbWQ6IHN0cmluZyB8IHN0cmluZ1tdKSB7XG4gICAgcmV0dXJuIEFycmF5LmlzQXJyYXkoY21kKVxuICAgICAgICA/IEFzdGFsLlByb2Nlc3MuZXhlY3YoY21kKVxuICAgICAgICA6IEFzdGFsLlByb2Nlc3MuZXhlYyhjbWQpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBleGVjQXN5bmMoY21kOiBzdHJpbmcgfCBzdHJpbmdbXSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoY21kKSkge1xuICAgICAgICAgICAgQXN0YWwuUHJvY2Vzcy5leGVjX2FzeW5jdihjbWQsIChfLCByZXMpID0+IHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKEFzdGFsLlByb2Nlc3MuZXhlY19hc3luY3ZfZmluaXNoKHJlcykpXG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBBc3RhbC5Qcm9jZXNzLmV4ZWNfYXN5bmMoY21kLCAoXywgcmVzKSA9PiB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShBc3RhbC5Qcm9jZXNzLmV4ZWNfZmluaXNoKHJlcykpXG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICB9KVxufVxuIiwgImltcG9ydCBWYXJpYWJsZSBmcm9tIFwiLi92YXJpYWJsZS5qc1wiXG5pbXBvcnQgeyBleGVjQXN5bmMgfSBmcm9tIFwiLi9wcm9jZXNzLmpzXCJcbmltcG9ydCBCaW5kaW5nLCB7IENvbm5lY3RhYmxlLCBrZWJhYmlmeSwgc25ha2VpZnksIFN1YnNjcmliYWJsZSB9IGZyb20gXCIuL2JpbmRpbmcuanNcIlxuXG5leHBvcnQgY29uc3Qgbm9JbXBsaWNpdERlc3Ryb3kgPSBTeW1ib2woXCJubyBubyBpbXBsaWNpdCBkZXN0cm95XCIpXG5leHBvcnQgY29uc3Qgc2V0Q2hpbGRyZW4gPSBTeW1ib2woXCJjaGlsZHJlbiBzZXR0ZXIgbWV0aG9kXCIpXG5cbmV4cG9ydCBmdW5jdGlvbiBtZXJnZUJpbmRpbmdzKGFycmF5OiBhbnlbXSkge1xuICAgIGZ1bmN0aW9uIGdldFZhbHVlcyguLi5hcmdzOiBhbnlbXSkge1xuICAgICAgICBsZXQgaSA9IDBcbiAgICAgICAgcmV0dXJuIGFycmF5Lm1hcCh2YWx1ZSA9PiB2YWx1ZSBpbnN0YW5jZW9mIEJpbmRpbmdcbiAgICAgICAgICAgID8gYXJnc1tpKytdXG4gICAgICAgICAgICA6IHZhbHVlLFxuICAgICAgICApXG4gICAgfVxuXG4gICAgY29uc3QgYmluZGluZ3MgPSBhcnJheS5maWx0ZXIoaSA9PiBpIGluc3RhbmNlb2YgQmluZGluZylcblxuICAgIGlmIChiaW5kaW5ncy5sZW5ndGggPT09IDApXG4gICAgICAgIHJldHVybiBhcnJheVxuXG4gICAgaWYgKGJpbmRpbmdzLmxlbmd0aCA9PT0gMSlcbiAgICAgICAgcmV0dXJuIGJpbmRpbmdzWzBdLmFzKGdldFZhbHVlcylcblxuICAgIHJldHVybiBWYXJpYWJsZS5kZXJpdmUoYmluZGluZ3MsIGdldFZhbHVlcykoKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0UHJvcChvYmo6IGFueSwgcHJvcDogc3RyaW5nLCB2YWx1ZTogYW55KSB7XG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3Qgc2V0dGVyID0gYHNldF8ke3NuYWtlaWZ5KHByb3ApfWBcbiAgICAgICAgaWYgKHR5cGVvZiBvYmpbc2V0dGVyXSA9PT0gXCJmdW5jdGlvblwiKVxuICAgICAgICAgICAgcmV0dXJuIG9ialtzZXR0ZXJdKHZhbHVlKVxuXG4gICAgICAgIHJldHVybiAob2JqW3Byb3BdID0gdmFsdWUpXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgY291bGQgbm90IHNldCBwcm9wZXJ0eSBcIiR7cHJvcH1cIiBvbiAke29ian06YCwgZXJyb3IpXG4gICAgfVxufVxuXG5leHBvcnQgdHlwZSBCaW5kYWJsZVByb3BzPFQ+ID0ge1xuICAgIFtLIGluIGtleW9mIFRdOiBCaW5kaW5nPFRbS10+IHwgVFtLXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhvb2s8V2lkZ2V0IGV4dGVuZHMgQ29ubmVjdGFibGU+KFxuICAgIHdpZGdldDogV2lkZ2V0LFxuICAgIG9iamVjdDogQ29ubmVjdGFibGUgfCBTdWJzY3JpYmFibGUsXG4gICAgc2lnbmFsT3JDYWxsYmFjazogc3RyaW5nIHwgKChzZWxmOiBXaWRnZXQsIC4uLmFyZ3M6IGFueVtdKSA9PiB2b2lkKSxcbiAgICBjYWxsYmFjaz86IChzZWxmOiBXaWRnZXQsIC4uLmFyZ3M6IGFueVtdKSA9PiB2b2lkLFxuKSB7XG4gICAgaWYgKHR5cGVvZiBvYmplY3QuY29ubmVjdCA9PT0gXCJmdW5jdGlvblwiICYmIGNhbGxiYWNrKSB7XG4gICAgICAgIGNvbnN0IGlkID0gb2JqZWN0LmNvbm5lY3Qoc2lnbmFsT3JDYWxsYmFjaywgKF86IGFueSwgLi4uYXJnczogdW5rbm93bltdKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sod2lkZ2V0LCAuLi5hcmdzKVxuICAgICAgICB9KVxuICAgICAgICB3aWRnZXQuY29ubmVjdChcImRlc3Ryb3lcIiwgKCkgPT4ge1xuICAgICAgICAgICAgKG9iamVjdC5kaXNjb25uZWN0IGFzIENvbm5lY3RhYmxlW1wiZGlzY29ubmVjdFwiXSkoaWQpXG4gICAgICAgIH0pXG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygb2JqZWN0LnN1YnNjcmliZSA9PT0gXCJmdW5jdGlvblwiICYmIHR5cGVvZiBzaWduYWxPckNhbGxiYWNrID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgY29uc3QgdW5zdWIgPSBvYmplY3Quc3Vic2NyaWJlKCguLi5hcmdzOiB1bmtub3duW10pID0+IHtcbiAgICAgICAgICAgIHNpZ25hbE9yQ2FsbGJhY2sod2lkZ2V0LCAuLi5hcmdzKVxuICAgICAgICB9KVxuICAgICAgICB3aWRnZXQuY29ubmVjdChcImRlc3Ryb3lcIiwgdW5zdWIpXG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY29uc3RydWN0PFdpZGdldCBleHRlbmRzIENvbm5lY3RhYmxlICYgeyBbc2V0Q2hpbGRyZW5dOiAoY2hpbGRyZW46IGFueVtdKSA9PiB2b2lkIH0+KHdpZGdldDogV2lkZ2V0LCBjb25maWc6IGFueSkge1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBwcmVmZXItY29uc3RcbiAgICBsZXQgeyBzZXR1cCwgY2hpbGQsIGNoaWxkcmVuID0gW10sIC4uLnByb3BzIH0gPSBjb25maWdcblxuICAgIGlmIChjaGlsZHJlbiBpbnN0YW5jZW9mIEJpbmRpbmcpIHtcbiAgICAgICAgY2hpbGRyZW4gPSBbY2hpbGRyZW5dXG4gICAgfVxuXG4gICAgaWYgKGNoaWxkKSB7XG4gICAgICAgIGNoaWxkcmVuLnVuc2hpZnQoY2hpbGQpXG4gICAgfVxuXG4gICAgLy8gcmVtb3ZlIHVuZGVmaW5lZCB2YWx1ZXNcbiAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyhwcm9wcykpIHtcbiAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGRlbGV0ZSBwcm9wc1trZXldXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBjb2xsZWN0IGJpbmRpbmdzXG4gICAgY29uc3QgYmluZGluZ3M6IEFycmF5PFtzdHJpbmcsIEJpbmRpbmc8YW55Pl0+ID0gT2JqZWN0XG4gICAgICAgIC5rZXlzKHByb3BzKVxuICAgICAgICAucmVkdWNlKChhY2M6IGFueSwgcHJvcCkgPT4ge1xuICAgICAgICAgICAgaWYgKHByb3BzW3Byb3BdIGluc3RhbmNlb2YgQmluZGluZykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGJpbmRpbmcgPSBwcm9wc1twcm9wXVxuICAgICAgICAgICAgICAgIGRlbGV0ZSBwcm9wc1twcm9wXVxuICAgICAgICAgICAgICAgIHJldHVybiBbLi4uYWNjLCBbcHJvcCwgYmluZGluZ11dXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gYWNjXG4gICAgICAgIH0sIFtdKVxuXG4gICAgLy8gY29sbGVjdCBzaWduYWwgaGFuZGxlcnNcbiAgICBjb25zdCBvbkhhbmRsZXJzOiBBcnJheTxbc3RyaW5nLCBzdHJpbmcgfCAoKCkgPT4gdW5rbm93bildPiA9IE9iamVjdFxuICAgICAgICAua2V5cyhwcm9wcylcbiAgICAgICAgLnJlZHVjZSgoYWNjOiBhbnksIGtleSkgPT4ge1xuICAgICAgICAgICAgaWYgKGtleS5zdGFydHNXaXRoKFwib25cIikpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBzaWcgPSBrZWJhYmlmeShrZXkpLnNwbGl0KFwiLVwiKS5zbGljZSgxKS5qb2luKFwiLVwiKVxuICAgICAgICAgICAgICAgIGNvbnN0IGhhbmRsZXIgPSBwcm9wc1trZXldXG4gICAgICAgICAgICAgICAgZGVsZXRlIHByb3BzW2tleV1cbiAgICAgICAgICAgICAgICByZXR1cm4gWy4uLmFjYywgW3NpZywgaGFuZGxlcl1dXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gYWNjXG4gICAgICAgIH0sIFtdKVxuXG4gICAgLy8gc2V0IGNoaWxkcmVuXG4gICAgY29uc3QgbWVyZ2VkQ2hpbGRyZW4gPSBtZXJnZUJpbmRpbmdzKGNoaWxkcmVuLmZsYXQoSW5maW5pdHkpKVxuICAgIGlmIChtZXJnZWRDaGlsZHJlbiBpbnN0YW5jZW9mIEJpbmRpbmcpIHtcbiAgICAgICAgd2lkZ2V0W3NldENoaWxkcmVuXShtZXJnZWRDaGlsZHJlbi5nZXQoKSlcbiAgICAgICAgd2lkZ2V0LmNvbm5lY3QoXCJkZXN0cm95XCIsIG1lcmdlZENoaWxkcmVuLnN1YnNjcmliZSgodikgPT4ge1xuICAgICAgICAgICAgd2lkZ2V0W3NldENoaWxkcmVuXSh2KVxuICAgICAgICB9KSlcbiAgICB9IGVsc2Uge1xuICAgICAgICBpZiAobWVyZ2VkQ2hpbGRyZW4ubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgd2lkZ2V0W3NldENoaWxkcmVuXShtZXJnZWRDaGlsZHJlbilcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIHNldHVwIHNpZ25hbCBoYW5kbGVyc1xuICAgIGZvciAoY29uc3QgW3NpZ25hbCwgY2FsbGJhY2tdIG9mIG9uSGFuZGxlcnMpIHtcbiAgICAgICAgY29uc3Qgc2lnID0gc2lnbmFsLnN0YXJ0c1dpdGgoXCJub3RpZnlcIilcbiAgICAgICAgICAgID8gc2lnbmFsLnJlcGxhY2UoXCItXCIsIFwiOjpcIilcbiAgICAgICAgICAgIDogc2lnbmFsXG5cbiAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB3aWRnZXQuY29ubmVjdChzaWcsIGNhbGxiYWNrKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgd2lkZ2V0LmNvbm5lY3Qoc2lnLCAoKSA9PiBleGVjQXN5bmMoY2FsbGJhY2spXG4gICAgICAgICAgICAgICAgLnRoZW4ocHJpbnQpLmNhdGNoKGNvbnNvbGUuZXJyb3IpKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gc2V0dXAgYmluZGluZ3MgaGFuZGxlcnNcbiAgICBmb3IgKGNvbnN0IFtwcm9wLCBiaW5kaW5nXSBvZiBiaW5kaW5ncykge1xuICAgICAgICBpZiAocHJvcCA9PT0gXCJjaGlsZFwiIHx8IHByb3AgPT09IFwiY2hpbGRyZW5cIikge1xuICAgICAgICAgICAgd2lkZ2V0LmNvbm5lY3QoXCJkZXN0cm95XCIsIGJpbmRpbmcuc3Vic2NyaWJlKCh2OiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICB3aWRnZXRbc2V0Q2hpbGRyZW5dKHYpXG4gICAgICAgICAgICB9KSlcbiAgICAgICAgfVxuICAgICAgICB3aWRnZXQuY29ubmVjdChcImRlc3Ryb3lcIiwgYmluZGluZy5zdWJzY3JpYmUoKHY6IGFueSkgPT4ge1xuICAgICAgICAgICAgc2V0UHJvcCh3aWRnZXQsIHByb3AsIHYpXG4gICAgICAgIH0pKVxuICAgICAgICBzZXRQcm9wKHdpZGdldCwgcHJvcCwgYmluZGluZy5nZXQoKSlcbiAgICB9XG5cbiAgICAvLyBmaWx0ZXIgdW5kZWZpbmVkIHZhbHVlc1xuICAgIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKHByb3BzKSkge1xuICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgZGVsZXRlIHByb3BzW2tleV1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIE9iamVjdC5hc3NpZ24od2lkZ2V0LCBwcm9wcylcbiAgICBzZXR1cD8uKHdpZGdldClcbiAgICByZXR1cm4gd2lkZ2V0XG59XG5cbmZ1bmN0aW9uIGlzQXJyb3dGdW5jdGlvbihmdW5jOiBhbnkpOiBmdW5jIGlzIChhcmdzOiBhbnkpID0+IGFueSB7XG4gICAgcmV0dXJuICFPYmplY3QuaGFzT3duKGZ1bmMsIFwicHJvdG90eXBlXCIpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBqc3goXG4gICAgY3RvcnM6IFJlY29yZDxzdHJpbmcsIHsgbmV3KHByb3BzOiBhbnkpOiBhbnkgfSB8ICgocHJvcHM6IGFueSkgPT4gYW55KT4sXG4gICAgY3Rvcjogc3RyaW5nIHwgKChwcm9wczogYW55KSA9PiBhbnkpIHwgeyBuZXcocHJvcHM6IGFueSk6IGFueSB9LFxuICAgIHsgY2hpbGRyZW4sIC4uLnByb3BzIH06IGFueSxcbikge1xuICAgIGNoaWxkcmVuID8/PSBbXVxuXG4gICAgaWYgKCFBcnJheS5pc0FycmF5KGNoaWxkcmVuKSlcbiAgICAgICAgY2hpbGRyZW4gPSBbY2hpbGRyZW5dXG5cbiAgICBjaGlsZHJlbiA9IGNoaWxkcmVuLmZpbHRlcihCb29sZWFuKVxuXG4gICAgaWYgKGNoaWxkcmVuLmxlbmd0aCA9PT0gMSlcbiAgICAgICAgcHJvcHMuY2hpbGQgPSBjaGlsZHJlblswXVxuICAgIGVsc2UgaWYgKGNoaWxkcmVuLmxlbmd0aCA+IDEpXG4gICAgICAgIHByb3BzLmNoaWxkcmVuID0gY2hpbGRyZW5cblxuICAgIGlmICh0eXBlb2YgY3RvciA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICBpZiAoaXNBcnJvd0Z1bmN0aW9uKGN0b3JzW2N0b3JdKSlcbiAgICAgICAgICAgIHJldHVybiBjdG9yc1tjdG9yXShwcm9wcylcblxuICAgICAgICByZXR1cm4gbmV3IGN0b3JzW2N0b3JdKHByb3BzKVxuICAgIH1cblxuICAgIGlmIChpc0Fycm93RnVuY3Rpb24oY3RvcikpXG4gICAgICAgIHJldHVybiBjdG9yKHByb3BzKVxuXG4gICAgcmV0dXJuIG5ldyBjdG9yKHByb3BzKVxufVxuIiwgImltcG9ydCB7IGhvb2ssIG5vSW1wbGljaXREZXN0cm95LCBzZXRDaGlsZHJlbiwgbWVyZ2VCaW5kaW5ncywgdHlwZSBCaW5kYWJsZVByb3BzLCBjb25zdHJ1Y3QgfSBmcm9tIFwiLi4vX2FzdGFsLmpzXCJcbmltcG9ydCBBc3RhbCBmcm9tIFwiZ2k6Ly9Bc3RhbD92ZXJzaW9uPTMuMFwiXG5pbXBvcnQgR3RrIGZyb20gXCJnaTovL0d0az92ZXJzaW9uPTMuMFwiXG5pbXBvcnQgR2RrIGZyb20gXCJnaTovL0dkaz92ZXJzaW9uPTMuMFwiXG5pbXBvcnQgR09iamVjdCBmcm9tIFwiZ2k6Ly9HT2JqZWN0XCJcbmltcG9ydCBHaW8gZnJvbSBcImdpOi8vR2lvP3ZlcnNpb249Mi4wXCJcbmltcG9ydCBCaW5kaW5nLCB7IHR5cGUgQ29ubmVjdGFibGUsIHR5cGUgU3Vic2NyaWJhYmxlIH0gZnJvbSBcIi4uL2JpbmRpbmcuanNcIlxuXG5leHBvcnQgeyBCaW5kYWJsZVByb3BzLCBtZXJnZUJpbmRpbmdzIH1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gYXN0YWxpZnk8XG4gICAgQyBleHRlbmRzIHsgbmV3KC4uLmFyZ3M6IGFueVtdKTogR3RrLldpZGdldCB9LFxuPihjbHM6IEMsIGNsc05hbWUgPSBjbHMubmFtZSkge1xuICAgIGNsYXNzIFdpZGdldCBleHRlbmRzIGNscyB7XG4gICAgICAgIGdldCBjc3MoKTogc3RyaW5nIHsgcmV0dXJuIEFzdGFsLndpZGdldF9nZXRfY3NzKHRoaXMpIH1cbiAgICAgICAgc2V0IGNzcyhjc3M6IHN0cmluZykgeyBBc3RhbC53aWRnZXRfc2V0X2Nzcyh0aGlzLCBjc3MpIH1cbiAgICAgICAgZ2V0X2NzcygpOiBzdHJpbmcgeyByZXR1cm4gdGhpcy5jc3MgfVxuICAgICAgICBzZXRfY3NzKGNzczogc3RyaW5nKSB7IHRoaXMuY3NzID0gY3NzIH1cblxuICAgICAgICBnZXQgY2xhc3NOYW1lKCk6IHN0cmluZyB7IHJldHVybiBBc3RhbC53aWRnZXRfZ2V0X2NsYXNzX25hbWVzKHRoaXMpLmpvaW4oXCIgXCIpIH1cbiAgICAgICAgc2V0IGNsYXNzTmFtZShjbGFzc05hbWU6IHN0cmluZykgeyBBc3RhbC53aWRnZXRfc2V0X2NsYXNzX25hbWVzKHRoaXMsIGNsYXNzTmFtZS5zcGxpdCgvXFxzKy8pKSB9XG4gICAgICAgIGdldF9jbGFzc19uYW1lKCk6IHN0cmluZyB7IHJldHVybiB0aGlzLmNsYXNzTmFtZSB9XG4gICAgICAgIHNldF9jbGFzc19uYW1lKGNsYXNzTmFtZTogc3RyaW5nKSB7IHRoaXMuY2xhc3NOYW1lID0gY2xhc3NOYW1lIH1cblxuICAgICAgICBnZXQgY3Vyc29yKCk6IEN1cnNvciB7IHJldHVybiBBc3RhbC53aWRnZXRfZ2V0X2N1cnNvcih0aGlzKSBhcyBDdXJzb3IgfVxuICAgICAgICBzZXQgY3Vyc29yKGN1cnNvcjogQ3Vyc29yKSB7IEFzdGFsLndpZGdldF9zZXRfY3Vyc29yKHRoaXMsIGN1cnNvcikgfVxuICAgICAgICBnZXRfY3Vyc29yKCk6IEN1cnNvciB7IHJldHVybiB0aGlzLmN1cnNvciB9XG4gICAgICAgIHNldF9jdXJzb3IoY3Vyc29yOiBDdXJzb3IpIHsgdGhpcy5jdXJzb3IgPSBjdXJzb3IgfVxuXG4gICAgICAgIGdldCBjbGlja1Rocm91Z2goKTogYm9vbGVhbiB7IHJldHVybiBBc3RhbC53aWRnZXRfZ2V0X2NsaWNrX3Rocm91Z2godGhpcykgfVxuICAgICAgICBzZXQgY2xpY2tUaHJvdWdoKGNsaWNrVGhyb3VnaDogYm9vbGVhbikgeyBBc3RhbC53aWRnZXRfc2V0X2NsaWNrX3Rocm91Z2godGhpcywgY2xpY2tUaHJvdWdoKSB9XG4gICAgICAgIGdldF9jbGlja190aHJvdWdoKCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5jbGlja1Rocm91Z2ggfVxuICAgICAgICBzZXRfY2xpY2tfdGhyb3VnaChjbGlja1Rocm91Z2g6IGJvb2xlYW4pIHsgdGhpcy5jbGlja1Rocm91Z2ggPSBjbGlja1Rocm91Z2ggfVxuXG4gICAgICAgIGRlY2xhcmUgcHJpdmF0ZSBbbm9JbXBsaWNpdERlc3Ryb3ldOiBib29sZWFuXG4gICAgICAgIGdldCBub0ltcGxpY2l0RGVzdHJveSgpOiBib29sZWFuIHsgcmV0dXJuIHRoaXNbbm9JbXBsaWNpdERlc3Ryb3ldIH1cbiAgICAgICAgc2V0IG5vSW1wbGljaXREZXN0cm95KHZhbHVlOiBib29sZWFuKSB7IHRoaXNbbm9JbXBsaWNpdERlc3Ryb3ldID0gdmFsdWUgfVxuXG4gICAgICAgIHNldCBhY3Rpb25Hcm91cChbcHJlZml4LCBncm91cF06IEFjdGlvbkdyb3VwKSB7IHRoaXMuaW5zZXJ0X2FjdGlvbl9ncm91cChwcmVmaXgsIGdyb3VwKSB9XG4gICAgICAgIHNldF9hY3Rpb25fZ3JvdXAoYWN0aW9uR3JvdXA6IEFjdGlvbkdyb3VwKSB7IHRoaXMuYWN0aW9uR3JvdXAgPSBhY3Rpb25Hcm91cCB9XG5cbiAgICAgICAgcHJvdGVjdGVkIGdldENoaWxkcmVuKCk6IEFycmF5PEd0ay5XaWRnZXQ+IHtcbiAgICAgICAgICAgIGlmICh0aGlzIGluc3RhbmNlb2YgR3RrLkJpbikge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmdldF9jaGlsZCgpID8gW3RoaXMuZ2V0X2NoaWxkKCkhXSA6IFtdXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMgaW5zdGFuY2VvZiBHdGsuQ29udGFpbmVyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0X2NoaWxkcmVuKClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBbXVxuICAgICAgICB9XG5cbiAgICAgICAgcHJvdGVjdGVkIHNldENoaWxkcmVuKGNoaWxkcmVuOiBhbnlbXSkge1xuICAgICAgICAgICAgY2hpbGRyZW4gPSBjaGlsZHJlbi5mbGF0KEluZmluaXR5KS5tYXAoY2ggPT4gY2ggaW5zdGFuY2VvZiBHdGsuV2lkZ2V0XG4gICAgICAgICAgICAgICAgPyBjaFxuICAgICAgICAgICAgICAgIDogbmV3IEd0ay5MYWJlbCh7IHZpc2libGU6IHRydWUsIGxhYmVsOiBTdHJpbmcoY2gpIH0pKVxuXG4gICAgICAgICAgICBpZiAodGhpcyBpbnN0YW5jZW9mIEd0ay5Db250YWluZXIpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGNoIG9mIGNoaWxkcmVuKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZChjaClcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoYGNhbiBub3QgYWRkIGNoaWxkcmVuIHRvICR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfWApXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBbc2V0Q2hpbGRyZW5dKGNoaWxkcmVuOiBhbnlbXSkge1xuICAgICAgICAgICAgLy8gcmVtb3ZlXG4gICAgICAgICAgICBpZiAodGhpcyBpbnN0YW5jZW9mIEd0ay5Db250YWluZXIpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGNoIG9mIHRoaXMuZ2V0Q2hpbGRyZW4oKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZShjaClcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFjaGlsZHJlbi5pbmNsdWRlcyhjaCkgJiYgIXRoaXMubm9JbXBsaWNpdERlc3Ryb3kpXG4gICAgICAgICAgICAgICAgICAgICAgICBjaD8uZGVzdHJveSgpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBhcHBlbmRcbiAgICAgICAgICAgIHRoaXMuc2V0Q2hpbGRyZW4oY2hpbGRyZW4pXG4gICAgICAgIH1cblxuICAgICAgICB0b2dnbGVDbGFzc05hbWUoY246IHN0cmluZywgY29uZCA9IHRydWUpIHtcbiAgICAgICAgICAgIEFzdGFsLndpZGdldF90b2dnbGVfY2xhc3NfbmFtZSh0aGlzLCBjbiwgY29uZClcbiAgICAgICAgfVxuXG4gICAgICAgIGhvb2soXG4gICAgICAgICAgICBvYmplY3Q6IENvbm5lY3RhYmxlLFxuICAgICAgICAgICAgc2lnbmFsOiBzdHJpbmcsXG4gICAgICAgICAgICBjYWxsYmFjazogKHNlbGY6IHRoaXMsIC4uLmFyZ3M6IGFueVtdKSA9PiB2b2lkLFxuICAgICAgICApOiB0aGlzXG4gICAgICAgIGhvb2soXG4gICAgICAgICAgICBvYmplY3Q6IFN1YnNjcmliYWJsZSxcbiAgICAgICAgICAgIGNhbGxiYWNrOiAoc2VsZjogdGhpcywgLi4uYXJnczogYW55W10pID0+IHZvaWQsXG4gICAgICAgICk6IHRoaXNcbiAgICAgICAgaG9vayhcbiAgICAgICAgICAgIG9iamVjdDogQ29ubmVjdGFibGUgfCBTdWJzY3JpYmFibGUsXG4gICAgICAgICAgICBzaWduYWxPckNhbGxiYWNrOiBzdHJpbmcgfCAoKHNlbGY6IHRoaXMsIC4uLmFyZ3M6IGFueVtdKSA9PiB2b2lkKSxcbiAgICAgICAgICAgIGNhbGxiYWNrPzogKHNlbGY6IHRoaXMsIC4uLmFyZ3M6IGFueVtdKSA9PiB2b2lkLFxuICAgICAgICApIHtcbiAgICAgICAgICAgIGhvb2sodGhpcywgb2JqZWN0LCBzaWduYWxPckNhbGxiYWNrLCBjYWxsYmFjaylcbiAgICAgICAgICAgIHJldHVybiB0aGlzXG4gICAgICAgIH1cblxuICAgICAgICBjb25zdHJ1Y3RvciguLi5wYXJhbXM6IGFueVtdKSB7XG4gICAgICAgICAgICBzdXBlcigpXG4gICAgICAgICAgICBjb25zdCBwcm9wcyA9IHBhcmFtc1swXSB8fCB7fVxuICAgICAgICAgICAgcHJvcHMudmlzaWJsZSA/Pz0gdHJ1ZVxuICAgICAgICAgICAgY29uc3RydWN0KHRoaXMsIHByb3BzKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgR09iamVjdC5yZWdpc3RlckNsYXNzKHtcbiAgICAgICAgR1R5cGVOYW1lOiBgQXN0YWxfJHtjbHNOYW1lfWAsXG4gICAgICAgIFByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgIFwiY2xhc3MtbmFtZVwiOiBHT2JqZWN0LlBhcmFtU3BlYy5zdHJpbmcoXG4gICAgICAgICAgICAgICAgXCJjbGFzcy1uYW1lXCIsIFwiXCIsIFwiXCIsIEdPYmplY3QuUGFyYW1GbGFncy5SRUFEV1JJVEUsIFwiXCIsXG4gICAgICAgICAgICApLFxuICAgICAgICAgICAgXCJjc3NcIjogR09iamVjdC5QYXJhbVNwZWMuc3RyaW5nKFxuICAgICAgICAgICAgICAgIFwiY3NzXCIsIFwiXCIsIFwiXCIsIEdPYmplY3QuUGFyYW1GbGFncy5SRUFEV1JJVEUsIFwiXCIsXG4gICAgICAgICAgICApLFxuICAgICAgICAgICAgXCJjdXJzb3JcIjogR09iamVjdC5QYXJhbVNwZWMuc3RyaW5nKFxuICAgICAgICAgICAgICAgIFwiY3Vyc29yXCIsIFwiXCIsIFwiXCIsIEdPYmplY3QuUGFyYW1GbGFncy5SRUFEV1JJVEUsIFwiZGVmYXVsdFwiLFxuICAgICAgICAgICAgKSxcbiAgICAgICAgICAgIFwiY2xpY2stdGhyb3VnaFwiOiBHT2JqZWN0LlBhcmFtU3BlYy5ib29sZWFuKFxuICAgICAgICAgICAgICAgIFwiY2xpY2stdGhyb3VnaFwiLCBcIlwiLCBcIlwiLCBHT2JqZWN0LlBhcmFtRmxhZ3MuUkVBRFdSSVRFLCBmYWxzZSxcbiAgICAgICAgICAgICksXG4gICAgICAgICAgICBcIm5vLWltcGxpY2l0LWRlc3Ryb3lcIjogR09iamVjdC5QYXJhbVNwZWMuYm9vbGVhbihcbiAgICAgICAgICAgICAgICBcIm5vLWltcGxpY2l0LWRlc3Ryb3lcIiwgXCJcIiwgXCJcIiwgR09iamVjdC5QYXJhbUZsYWdzLlJFQURXUklURSwgZmFsc2UsXG4gICAgICAgICAgICApLFxuICAgICAgICB9LFxuICAgIH0sIFdpZGdldClcblxuICAgIHJldHVybiBXaWRnZXRcbn1cblxudHlwZSBTaWdIYW5kbGVyPFxuICAgIFcgZXh0ZW5kcyBJbnN0YW5jZVR5cGU8dHlwZW9mIEd0ay5XaWRnZXQ+LFxuICAgIEFyZ3MgZXh0ZW5kcyBBcnJheTx1bmtub3duPixcbj4gPSAoKHNlbGY6IFcsIC4uLmFyZ3M6IEFyZ3MpID0+IHVua25vd24pIHwgc3RyaW5nIHwgc3RyaW5nW11cblxuZXhwb3J0IHR5cGUgQmluZGFibGVDaGlsZCA9IEd0ay5XaWRnZXQgfCBCaW5kaW5nPEd0ay5XaWRnZXQ+XG5cbmV4cG9ydCB0eXBlIENvbnN0cnVjdFByb3BzPFxuICAgIFNlbGYgZXh0ZW5kcyBJbnN0YW5jZVR5cGU8dHlwZW9mIEd0ay5XaWRnZXQ+LFxuICAgIFByb3BzIGV4dGVuZHMgR3RrLldpZGdldC5Db25zdHJ1Y3RvclByb3BzLFxuICAgIFNpZ25hbHMgZXh0ZW5kcyBSZWNvcmQ8YG9uJHtzdHJpbmd9YCwgQXJyYXk8dW5rbm93bj4+ID0gUmVjb3JkPGBvbiR7c3RyaW5nfWAsIGFueVtdPixcbj4gPSBQYXJ0aWFsPHtcbiAgICAvLyBAdHMtZXhwZWN0LWVycm9yIGNhbid0IGFzc2lnbiB0byB1bmtub3duLCBidXQgaXQgd29ya3MgYXMgZXhwZWN0ZWQgdGhvdWdoXG4gICAgW1MgaW4ga2V5b2YgU2lnbmFsc106IFNpZ0hhbmRsZXI8U2VsZiwgU2lnbmFsc1tTXT5cbn0+ICYgUGFydGlhbDx7XG4gICAgW0tleSBpbiBgb24ke3N0cmluZ31gXTogU2lnSGFuZGxlcjxTZWxmLCBhbnlbXT5cbn0+ICYgQmluZGFibGVQcm9wczxQYXJ0aWFsPFByb3BzICYge1xuICAgIGNsYXNzTmFtZT86IHN0cmluZ1xuICAgIGNzcz86IHN0cmluZ1xuICAgIGN1cnNvcj86IHN0cmluZ1xuICAgIGNsaWNrVGhyb3VnaD86IGJvb2xlYW5cbiAgICBhY3Rpb25Hcm91cD86IEFjdGlvbkdyb3VwXG59Pj4gJiBQYXJ0aWFsPHtcbiAgICBvbkRlc3Ryb3k6IChzZWxmOiBTZWxmKSA9PiB1bmtub3duXG4gICAgb25EcmF3OiAoc2VsZjogU2VsZikgPT4gdW5rbm93blxuICAgIG9uS2V5UHJlc3NFdmVudDogKHNlbGY6IFNlbGYsIGV2ZW50OiBHZGsuRXZlbnQpID0+IHVua25vd25cbiAgICBvbktleVJlbGVhc2VFdmVudDogKHNlbGY6IFNlbGYsIGV2ZW50OiBHZGsuRXZlbnQpID0+IHVua25vd25cbiAgICBvbkJ1dHRvblByZXNzRXZlbnQ6IChzZWxmOiBTZWxmLCBldmVudDogR2RrLkV2ZW50KSA9PiB1bmtub3duXG4gICAgb25CdXR0b25SZWxlYXNlRXZlbnQ6IChzZWxmOiBTZWxmLCBldmVudDogR2RrLkV2ZW50KSA9PiB1bmtub3duXG4gICAgb25SZWFsaXplOiAoc2VsZjogU2VsZikgPT4gdW5rbm93blxuICAgIHNldHVwOiAoc2VsZjogU2VsZikgPT4gdm9pZFxufT5cblxudHlwZSBDdXJzb3IgPVxuICAgIHwgXCJkZWZhdWx0XCJcbiAgICB8IFwiaGVscFwiXG4gICAgfCBcInBvaW50ZXJcIlxuICAgIHwgXCJjb250ZXh0LW1lbnVcIlxuICAgIHwgXCJwcm9ncmVzc1wiXG4gICAgfCBcIndhaXRcIlxuICAgIHwgXCJjZWxsXCJcbiAgICB8IFwiY3Jvc3NoYWlyXCJcbiAgICB8IFwidGV4dFwiXG4gICAgfCBcInZlcnRpY2FsLXRleHRcIlxuICAgIHwgXCJhbGlhc1wiXG4gICAgfCBcImNvcHlcIlxuICAgIHwgXCJuby1kcm9wXCJcbiAgICB8IFwibW92ZVwiXG4gICAgfCBcIm5vdC1hbGxvd2VkXCJcbiAgICB8IFwiZ3JhYlwiXG4gICAgfCBcImdyYWJiaW5nXCJcbiAgICB8IFwiYWxsLXNjcm9sbFwiXG4gICAgfCBcImNvbC1yZXNpemVcIlxuICAgIHwgXCJyb3ctcmVzaXplXCJcbiAgICB8IFwibi1yZXNpemVcIlxuICAgIHwgXCJlLXJlc2l6ZVwiXG4gICAgfCBcInMtcmVzaXplXCJcbiAgICB8IFwidy1yZXNpemVcIlxuICAgIHwgXCJuZS1yZXNpemVcIlxuICAgIHwgXCJudy1yZXNpemVcIlxuICAgIHwgXCJzdy1yZXNpemVcIlxuICAgIHwgXCJzZS1yZXNpemVcIlxuICAgIHwgXCJldy1yZXNpemVcIlxuICAgIHwgXCJucy1yZXNpemVcIlxuICAgIHwgXCJuZXN3LXJlc2l6ZVwiXG4gICAgfCBcIm53c2UtcmVzaXplXCJcbiAgICB8IFwiem9vbS1pblwiXG4gICAgfCBcInpvb20tb3V0XCJcblxudHlwZSBBY3Rpb25Hcm91cCA9IFtwcmVmaXg6IHN0cmluZywgYWN0aW9uR3JvdXA6IEdpby5BY3Rpb25Hcm91cF1cbiIsICJpbXBvcnQgR3RrIGZyb20gXCJnaTovL0d0az92ZXJzaW9uPTMuMFwiXG5pbXBvcnQgQXN0YWwgZnJvbSBcImdpOi8vQXN0YWw/dmVyc2lvbj0zLjBcIlxuaW1wb3J0IHsgbWtBcHAgfSBmcm9tIFwiLi4vX2FwcFwiXG5cbkd0ay5pbml0KG51bGwpXG5cbmV4cG9ydCBkZWZhdWx0IG1rQXBwKEFzdGFsLkFwcGxpY2F0aW9uKVxuIiwgIi8qKlxuICogV29ya2Fyb3VuZCBmb3IgXCJDYW4ndCBjb252ZXJ0IG5vbi1udWxsIHBvaW50ZXIgdG8gSlMgdmFsdWUgXCJcbiAqL1xuXG5leHBvcnQgeyB9XG5cbmNvbnN0IHNuYWtlaWZ5ID0gKHN0cjogc3RyaW5nKSA9PiBzdHJcbiAgICAucmVwbGFjZSgvKFthLXpdKShbQS1aXSkvZywgXCIkMV8kMlwiKVxuICAgIC5yZXBsYWNlQWxsKFwiLVwiLCBcIl9cIilcbiAgICAudG9Mb3dlckNhc2UoKVxuXG5hc3luYyBmdW5jdGlvbiBzdXBwcmVzczxUPihtb2Q6IFByb21pc2U8eyBkZWZhdWx0OiBUIH0+LCBwYXRjaDogKG06IFQpID0+IHZvaWQpIHtcbiAgICByZXR1cm4gbW9kLnRoZW4obSA9PiBwYXRjaChtLmRlZmF1bHQpKS5jYXRjaCgoKSA9PiB2b2lkIDApXG59XG5cbmZ1bmN0aW9uIHBhdGNoPFAgZXh0ZW5kcyBvYmplY3Q+KHByb3RvOiBQLCBwcm9wOiBFeHRyYWN0PGtleW9mIFAsIHN0cmluZz4pIHtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkocHJvdG8sIHByb3AsIHtcbiAgICAgICAgZ2V0KCkgeyByZXR1cm4gdGhpc1tgZ2V0XyR7c25ha2VpZnkocHJvcCl9YF0oKSB9LFxuICAgIH0pXG59XG5cbmF3YWl0IHN1cHByZXNzKGltcG9ydChcImdpOi8vQXN0YWxBcHBzXCIpLCAoeyBBcHBzLCBBcHBsaWNhdGlvbiB9KSA9PiB7XG4gICAgcGF0Y2goQXBwcy5wcm90b3R5cGUsIFwibGlzdFwiKVxuICAgIHBhdGNoKEFwcGxpY2F0aW9uLnByb3RvdHlwZSwgXCJrZXl3b3Jkc1wiKVxuICAgIHBhdGNoKEFwcGxpY2F0aW9uLnByb3RvdHlwZSwgXCJjYXRlZ29yaWVzXCIpXG59KVxuXG5hd2FpdCBzdXBwcmVzcyhpbXBvcnQoXCJnaTovL0FzdGFsQmF0dGVyeVwiKSwgKHsgVVBvd2VyIH0pID0+IHtcbiAgICBwYXRjaChVUG93ZXIucHJvdG90eXBlLCBcImRldmljZXNcIilcbn0pXG5cbmF3YWl0IHN1cHByZXNzKGltcG9ydChcImdpOi8vQXN0YWxCbHVldG9vdGhcIiksICh7IEFkYXB0ZXIsIEJsdWV0b290aCwgRGV2aWNlIH0pID0+IHtcbiAgICBwYXRjaChBZGFwdGVyLnByb3RvdHlwZSwgXCJ1dWlkc1wiKVxuICAgIHBhdGNoKEJsdWV0b290aC5wcm90b3R5cGUsIFwiYWRhcHRlcnNcIilcbiAgICBwYXRjaChCbHVldG9vdGgucHJvdG90eXBlLCBcImRldmljZXNcIilcbiAgICBwYXRjaChEZXZpY2UucHJvdG90eXBlLCBcInV1aWRzXCIpXG59KVxuXG5hd2FpdCBzdXBwcmVzcyhpbXBvcnQoXCJnaTovL0FzdGFsSHlwcmxhbmRcIiksICh7IEh5cHJsYW5kLCBNb25pdG9yLCBXb3Jrc3BhY2UgfSkgPT4ge1xuICAgIHBhdGNoKEh5cHJsYW5kLnByb3RvdHlwZSwgXCJtb25pdG9yc1wiKVxuICAgIHBhdGNoKEh5cHJsYW5kLnByb3RvdHlwZSwgXCJ3b3Jrc3BhY2VzXCIpXG4gICAgcGF0Y2goSHlwcmxhbmQucHJvdG90eXBlLCBcImNsaWVudHNcIilcbiAgICBwYXRjaChNb25pdG9yLnByb3RvdHlwZSwgXCJhdmFpbGFibGVNb2Rlc1wiKVxuICAgIHBhdGNoKE1vbml0b3IucHJvdG90eXBlLCBcImF2YWlsYWJsZV9tb2Rlc1wiKVxuICAgIHBhdGNoKFdvcmtzcGFjZS5wcm90b3R5cGUsIFwiY2xpZW50c1wiKVxufSlcblxuYXdhaXQgc3VwcHJlc3MoaW1wb3J0KFwiZ2k6Ly9Bc3RhbE1wcmlzXCIpLCAoeyBNcHJpcywgUGxheWVyIH0pID0+IHtcbiAgICBwYXRjaChNcHJpcy5wcm90b3R5cGUsIFwicGxheWVyc1wiKVxuICAgIHBhdGNoKFBsYXllci5wcm90b3R5cGUsIFwic3VwcG9ydGVkX3VyaV9zY2hlbWVzXCIpXG4gICAgcGF0Y2goUGxheWVyLnByb3RvdHlwZSwgXCJzdXBwb3J0ZWRVcmlTY2hlbWVzXCIpXG4gICAgcGF0Y2goUGxheWVyLnByb3RvdHlwZSwgXCJzdXBwb3J0ZWRfbWltZV90eXBlc1wiKVxuICAgIHBhdGNoKFBsYXllci5wcm90b3R5cGUsIFwic3VwcG9ydGVkTWltZVR5cGVzXCIpXG4gICAgcGF0Y2goUGxheWVyLnByb3RvdHlwZSwgXCJjb21tZW50c1wiKVxufSlcblxuYXdhaXQgc3VwcHJlc3MoaW1wb3J0KFwiZ2k6Ly9Bc3RhbE5ldHdvcmtcIiksICh7IFdpZmkgfSkgPT4ge1xuICAgIHBhdGNoKFdpZmkucHJvdG90eXBlLCBcImFjY2Vzc19wb2ludHNcIilcbiAgICBwYXRjaChXaWZpLnByb3RvdHlwZSwgXCJhY2Nlc3NQb2ludHNcIilcbn0pXG5cbmF3YWl0IHN1cHByZXNzKGltcG9ydChcImdpOi8vQXN0YWxOb3RpZmRcIiksICh7IE5vdGlmZCwgTm90aWZpY2F0aW9uIH0pID0+IHtcbiAgICBwYXRjaChOb3RpZmQucHJvdG90eXBlLCBcIm5vdGlmaWNhdGlvbnNcIilcbiAgICBwYXRjaChOb3RpZmljYXRpb24ucHJvdG90eXBlLCBcImFjdGlvbnNcIilcbn0pXG5cbmF3YWl0IHN1cHByZXNzKGltcG9ydChcImdpOi8vQXN0YWxQb3dlclByb2ZpbGVzXCIpLCAoeyBQb3dlclByb2ZpbGVzIH0pID0+IHtcbiAgICBwYXRjaChQb3dlclByb2ZpbGVzLnByb3RvdHlwZSwgXCJhY3Rpb25zXCIpXG59KVxuXG5hd2FpdCBzdXBwcmVzcyhpbXBvcnQoXCJnaTovL0FzdGFsV3BcIiksICh7IFdwLCBBdWRpbywgVmlkZW8gfSkgPT4ge1xuICAgIHBhdGNoKFdwLnByb3RvdHlwZSwgXCJlbmRwb2ludHNcIilcbiAgICBwYXRjaChXcC5wcm90b3R5cGUsIFwiZGV2aWNlc1wiKVxuICAgIHBhdGNoKEF1ZGlvLnByb3RvdHlwZSwgXCJzdHJlYW1zXCIpXG4gICAgcGF0Y2goQXVkaW8ucHJvdG90eXBlLCBcInJlY29yZGVyc1wiKVxuICAgIHBhdGNoKEF1ZGlvLnByb3RvdHlwZSwgXCJtaWNyb3Bob25lc1wiKVxuICAgIHBhdGNoKEF1ZGlvLnByb3RvdHlwZSwgXCJzcGVha2Vyc1wiKVxuICAgIHBhdGNoKEF1ZGlvLnByb3RvdHlwZSwgXCJkZXZpY2VzXCIpXG4gICAgcGF0Y2goVmlkZW8ucHJvdG90eXBlLCBcInN0cmVhbXNcIilcbiAgICBwYXRjaChWaWRlby5wcm90b3R5cGUsIFwicmVjb3JkZXJzXCIpXG4gICAgcGF0Y2goVmlkZW8ucHJvdG90eXBlLCBcInNpbmtzXCIpXG4gICAgcGF0Y2goVmlkZW8ucHJvdG90eXBlLCBcInNvdXJjZXNcIilcbiAgICBwYXRjaChWaWRlby5wcm90b3R5cGUsIFwiZGV2aWNlc1wiKVxufSlcbiIsICJpbXBvcnQgXCIuL292ZXJyaWRlcy5qc1wiXG5pbXBvcnQgeyBzZXRDb25zb2xlTG9nRG9tYWluIH0gZnJvbSBcImNvbnNvbGVcIlxuaW1wb3J0IHsgZXhpdCwgcHJvZ3JhbUFyZ3MgfSBmcm9tIFwic3lzdGVtXCJcbmltcG9ydCBJTyBmcm9tIFwiZ2k6Ly9Bc3RhbElPXCJcbmltcG9ydCBHT2JqZWN0IGZyb20gXCJnaTovL0dPYmplY3RcIlxuaW1wb3J0IEdpbyBmcm9tIFwiZ2k6Ly9HaW8/dmVyc2lvbj0yLjBcIlxuaW1wb3J0IHR5cGUgQXN0YWwzIGZyb20gXCJnaTovL0FzdGFsP3ZlcnNpb249My4wXCJcbmltcG9ydCB0eXBlIEFzdGFsNCBmcm9tIFwiZ2k6Ly9Bc3RhbD92ZXJzaW9uPTQuMFwiXG5cbnR5cGUgQ29uZmlnID0gUGFydGlhbDx7XG4gICAgaW5zdGFuY2VOYW1lOiBzdHJpbmdcbiAgICBjc3M6IHN0cmluZ1xuICAgIGljb25zOiBzdHJpbmdcbiAgICBndGtUaGVtZTogc3RyaW5nXG4gICAgaWNvblRoZW1lOiBzdHJpbmdcbiAgICBjdXJzb3JUaGVtZTogc3RyaW5nXG4gICAgaG9sZDogYm9vbGVhblxuICAgIHJlcXVlc3RIYW5kbGVyKHJlcXVlc3Q6IHN0cmluZywgcmVzOiAocmVzcG9uc2U6IGFueSkgPT4gdm9pZCk6IHZvaWRcbiAgICBtYWluKC4uLmFyZ3M6IHN0cmluZ1tdKTogdm9pZFxuICAgIGNsaWVudChtZXNzYWdlOiAobXNnOiBzdHJpbmcpID0+IHN0cmluZywgLi4uYXJnczogc3RyaW5nW10pOiB2b2lkXG59PlxuXG5pbnRlcmZhY2UgQXN0YWwzSlMgZXh0ZW5kcyBBc3RhbDMuQXBwbGljYXRpb24ge1xuICAgIGV2YWwoYm9keTogc3RyaW5nKTogUHJvbWlzZTxhbnk+XG4gICAgcmVxdWVzdEhhbmRsZXI6IENvbmZpZ1tcInJlcXVlc3RIYW5kbGVyXCJdXG4gICAgYXBwbHlfY3NzKHN0eWxlOiBzdHJpbmcsIHJlc2V0PzogYm9vbGVhbik6IHZvaWRcbiAgICBxdWl0KGNvZGU/OiBudW1iZXIpOiB2b2lkXG4gICAgc3RhcnQoY29uZmlnPzogQ29uZmlnKTogdm9pZFxufVxuXG5pbnRlcmZhY2UgQXN0YWw0SlMgZXh0ZW5kcyBBc3RhbDQuQXBwbGljYXRpb24ge1xuICAgIGV2YWwoYm9keTogc3RyaW5nKTogUHJvbWlzZTxhbnk+XG4gICAgcmVxdWVzdEhhbmRsZXI/OiBDb25maWdbXCJyZXF1ZXN0SGFuZGxlclwiXVxuICAgIGFwcGx5X2NzcyhzdHlsZTogc3RyaW5nLCByZXNldD86IGJvb2xlYW4pOiB2b2lkXG4gICAgcXVpdChjb2RlPzogbnVtYmVyKTogdm9pZFxuICAgIHN0YXJ0KGNvbmZpZz86IENvbmZpZyk6IHZvaWRcbn1cblxudHlwZSBBcHAzID0gdHlwZW9mIEFzdGFsMy5BcHBsaWNhdGlvblxudHlwZSBBcHA0ID0gdHlwZW9mIEFzdGFsNC5BcHBsaWNhdGlvblxuXG5leHBvcnQgZnVuY3Rpb24gbWtBcHA8QXBwIGV4dGVuZHMgQXBwMz4oQXBwOiBBcHApOiBBc3RhbDNKU1xuZXhwb3J0IGZ1bmN0aW9uIG1rQXBwPEFwcCBleHRlbmRzIEFwcDQ+KEFwcDogQXBwKTogQXN0YWw0SlNcblxuZXhwb3J0IGZ1bmN0aW9uIG1rQXBwKEFwcDogQXBwMyB8IEFwcDQpIHtcbiAgICByZXR1cm4gbmV3IChjbGFzcyBBc3RhbEpTIGV4dGVuZHMgQXBwIHtcbiAgICAgICAgc3RhdGljIHsgR09iamVjdC5yZWdpc3RlckNsYXNzKHsgR1R5cGVOYW1lOiBcIkFzdGFsSlNcIiB9LCB0aGlzIGFzIGFueSkgfVxuXG4gICAgICAgIGV2YWwoYm9keTogc3RyaW5nKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzLCByZWopID0+IHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBmbiA9IEZ1bmN0aW9uKGByZXR1cm4gKGFzeW5jIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHtib2R5LmluY2x1ZGVzKFwiO1wiKSA/IGJvZHkgOiBgcmV0dXJuICR7Ym9keX07YH1cbiAgICAgICAgICAgICAgICAgICAgfSlgKVxuICAgICAgICAgICAgICAgICAgICBmbigpKCkudGhlbihyZXMpLmNhdGNoKHJlailcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICByZWooZXJyb3IpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuXG4gICAgICAgIHJlcXVlc3RIYW5kbGVyPzogQ29uZmlnW1wicmVxdWVzdEhhbmRsZXJcIl1cblxuICAgICAgICB2ZnVuY19yZXF1ZXN0KG1zZzogc3RyaW5nLCBjb25uOiBHaW8uU29ja2V0Q29ubmVjdGlvbik6IHZvaWQge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzLnJlcXVlc3RIYW5kbGVyID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlcXVlc3RIYW5kbGVyKG1zZywgKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIElPLndyaXRlX3NvY2soY29ubiwgU3RyaW5nKHJlc3BvbnNlKSwgKF8sIHJlcykgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgIElPLndyaXRlX3NvY2tfZmluaXNoKHJlcyksXG4gICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzdXBlci52ZnVuY19yZXF1ZXN0KG1zZywgY29ubilcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGFwcGx5X2NzcyhzdHlsZTogc3RyaW5nLCByZXNldCA9IGZhbHNlKSB7XG4gICAgICAgICAgICBzdXBlci5hcHBseV9jc3Moc3R5bGUsIHJlc2V0KVxuICAgICAgICB9XG5cbiAgICAgICAgcXVpdChjb2RlPzogbnVtYmVyKTogdm9pZCB7XG4gICAgICAgICAgICBzdXBlci5xdWl0KClcbiAgICAgICAgICAgIGV4aXQoY29kZSA/PyAwKVxuICAgICAgICB9XG5cbiAgICAgICAgc3RhcnQoeyByZXF1ZXN0SGFuZGxlciwgY3NzLCBob2xkLCBtYWluLCBjbGllbnQsIGljb25zLCAuLi5jZmcgfTogQ29uZmlnID0ge30pIHtcbiAgICAgICAgICAgIGNvbnN0IGFwcCA9IHRoaXMgYXMgdW5rbm93biBhcyBJbnN0YW5jZVR5cGU8QXBwMyB8IEFwcDQ+XG5cbiAgICAgICAgICAgIGNsaWVudCA/Pz0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIHByaW50KGBBc3RhbCBpbnN0YW5jZSBcIiR7YXBwLmluc3RhbmNlTmFtZX1cIiBhbHJlYWR5IHJ1bm5pbmdgKVxuICAgICAgICAgICAgICAgIGV4aXQoMSlcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgT2JqZWN0LmFzc2lnbih0aGlzLCBjZmcpXG4gICAgICAgICAgICBzZXRDb25zb2xlTG9nRG9tYWluKGFwcC5pbnN0YW5jZU5hbWUpXG5cbiAgICAgICAgICAgIHRoaXMucmVxdWVzdEhhbmRsZXIgPSByZXF1ZXN0SGFuZGxlclxuICAgICAgICAgICAgYXBwLmNvbm5lY3QoXCJhY3RpdmF0ZVwiLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgbWFpbj8uKC4uLnByb2dyYW1BcmdzKVxuICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBhcHAuYWNxdWlyZV9zb2NrZXQoKVxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2xpZW50KG1zZyA9PiBJTy5zZW5kX21lc3NhZ2UoYXBwLmluc3RhbmNlTmFtZSwgbXNnKSEsIC4uLnByb2dyYW1BcmdzKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoY3NzKVxuICAgICAgICAgICAgICAgIHRoaXMuYXBwbHlfY3NzKGNzcywgZmFsc2UpXG5cbiAgICAgICAgICAgIGlmIChpY29ucylcbiAgICAgICAgICAgICAgICBhcHAuYWRkX2ljb25zKGljb25zKVxuXG4gICAgICAgICAgICBob2xkID8/PSB0cnVlXG4gICAgICAgICAgICBpZiAoaG9sZClcbiAgICAgICAgICAgICAgICBhcHAuaG9sZCgpXG5cbiAgICAgICAgICAgIGFwcC5ydW5Bc3luYyhbXSlcbiAgICAgICAgfVxuICAgIH0pXG59XG4iLCAiLyogZXNsaW50LWRpc2FibGUgbWF4LWxlbiAqL1xuaW1wb3J0IEFzdGFsIGZyb20gXCJnaTovL0FzdGFsP3ZlcnNpb249My4wXCJcbmltcG9ydCBHdGsgZnJvbSBcImdpOi8vR3RrP3ZlcnNpb249My4wXCJcbmltcG9ydCBHT2JqZWN0IGZyb20gXCJnaTovL0dPYmplY3RcIlxuaW1wb3J0IGFzdGFsaWZ5LCB7IHR5cGUgQ29uc3RydWN0UHJvcHMsIHR5cGUgQmluZGFibGVDaGlsZCB9IGZyb20gXCIuL2FzdGFsaWZ5LmpzXCJcblxuZnVuY3Rpb24gZmlsdGVyKGNoaWxkcmVuOiBhbnlbXSkge1xuICAgIHJldHVybiBjaGlsZHJlbi5mbGF0KEluZmluaXR5KS5tYXAoY2ggPT4gY2ggaW5zdGFuY2VvZiBHdGsuV2lkZ2V0XG4gICAgICAgID8gY2hcbiAgICAgICAgOiBuZXcgR3RrLkxhYmVsKHsgdmlzaWJsZTogdHJ1ZSwgbGFiZWw6IFN0cmluZyhjaCkgfSkpXG59XG5cbi8vIEJveFxuT2JqZWN0LmRlZmluZVByb3BlcnR5KEFzdGFsLkJveC5wcm90b3R5cGUsIFwiY2hpbGRyZW5cIiwge1xuICAgIGdldCgpIHsgcmV0dXJuIHRoaXMuZ2V0X2NoaWxkcmVuKCkgfSxcbiAgICBzZXQodikgeyB0aGlzLnNldF9jaGlsZHJlbih2KSB9LFxufSlcblxuZXhwb3J0IHR5cGUgQm94UHJvcHMgPSBDb25zdHJ1Y3RQcm9wczxCb3gsIEFzdGFsLkJveC5Db25zdHJ1Y3RvclByb3BzPlxuZXhwb3J0IGNsYXNzIEJveCBleHRlbmRzIGFzdGFsaWZ5KEFzdGFsLkJveCkge1xuICAgIHN0YXRpYyB7IEdPYmplY3QucmVnaXN0ZXJDbGFzcyh7IEdUeXBlTmFtZTogXCJCb3hcIiB9LCB0aGlzKSB9XG4gICAgY29uc3RydWN0b3IocHJvcHM/OiBCb3hQcm9wcywgLi4uY2hpbGRyZW46IEFycmF5PEJpbmRhYmxlQ2hpbGQ+KSB7IHN1cGVyKHsgY2hpbGRyZW4sIC4uLnByb3BzIH0gYXMgYW55KSB9XG4gICAgcHJvdGVjdGVkIHNldENoaWxkcmVuKGNoaWxkcmVuOiBhbnlbXSk6IHZvaWQgeyB0aGlzLnNldF9jaGlsZHJlbihmaWx0ZXIoY2hpbGRyZW4pKSB9XG59XG5cbi8vIEJ1dHRvblxuZXhwb3J0IHR5cGUgQnV0dG9uUHJvcHMgPSBDb25zdHJ1Y3RQcm9wczxCdXR0b24sIEFzdGFsLkJ1dHRvbi5Db25zdHJ1Y3RvclByb3BzLCB7XG4gICAgb25DbGlja2VkOiBbXVxuICAgIG9uQ2xpY2s6IFtldmVudDogQXN0YWwuQ2xpY2tFdmVudF1cbiAgICBvbkNsaWNrUmVsZWFzZTogW2V2ZW50OiBBc3RhbC5DbGlja0V2ZW50XVxuICAgIG9uSG92ZXI6IFtldmVudDogQXN0YWwuSG92ZXJFdmVudF1cbiAgICBvbkhvdmVyTG9zdDogW2V2ZW50OiBBc3RhbC5Ib3ZlckV2ZW50XVxuICAgIG9uU2Nyb2xsOiBbZXZlbnQ6IEFzdGFsLlNjcm9sbEV2ZW50XVxufT5cbmV4cG9ydCBjbGFzcyBCdXR0b24gZXh0ZW5kcyBhc3RhbGlmeShBc3RhbC5CdXR0b24pIHtcbiAgICBzdGF0aWMgeyBHT2JqZWN0LnJlZ2lzdGVyQ2xhc3MoeyBHVHlwZU5hbWU6IFwiQnV0dG9uXCIgfSwgdGhpcykgfVxuICAgIGNvbnN0cnVjdG9yKHByb3BzPzogQnV0dG9uUHJvcHMsIGNoaWxkPzogQmluZGFibGVDaGlsZCkgeyBzdXBlcih7IGNoaWxkLCAuLi5wcm9wcyB9IGFzIGFueSkgfVxufVxuXG4vLyBDZW50ZXJCb3hcbmV4cG9ydCB0eXBlIENlbnRlckJveFByb3BzID0gQ29uc3RydWN0UHJvcHM8Q2VudGVyQm94LCBBc3RhbC5DZW50ZXJCb3guQ29uc3RydWN0b3JQcm9wcz5cbmV4cG9ydCBjbGFzcyBDZW50ZXJCb3ggZXh0ZW5kcyBhc3RhbGlmeShBc3RhbC5DZW50ZXJCb3gpIHtcbiAgICBzdGF0aWMgeyBHT2JqZWN0LnJlZ2lzdGVyQ2xhc3MoeyBHVHlwZU5hbWU6IFwiQ2VudGVyQm94XCIgfSwgdGhpcykgfVxuICAgIGNvbnN0cnVjdG9yKHByb3BzPzogQ2VudGVyQm94UHJvcHMsIC4uLmNoaWxkcmVuOiBBcnJheTxCaW5kYWJsZUNoaWxkPikgeyBzdXBlcih7IGNoaWxkcmVuLCAuLi5wcm9wcyB9IGFzIGFueSkgfVxuICAgIHByb3RlY3RlZCBzZXRDaGlsZHJlbihjaGlsZHJlbjogYW55W10pOiB2b2lkIHtcbiAgICAgICAgY29uc3QgY2ggPSBmaWx0ZXIoY2hpbGRyZW4pXG4gICAgICAgIHRoaXMuc3RhcnRXaWRnZXQgPSBjaFswXSB8fCBuZXcgR3RrLkJveFxuICAgICAgICB0aGlzLmNlbnRlcldpZGdldCA9IGNoWzFdIHx8IG5ldyBHdGsuQm94XG4gICAgICAgIHRoaXMuZW5kV2lkZ2V0ID0gY2hbMl0gfHwgbmV3IEd0ay5Cb3hcbiAgICB9XG59XG5cbi8vIENpcmN1bGFyUHJvZ3Jlc3NcbmV4cG9ydCB0eXBlIENpcmN1bGFyUHJvZ3Jlc3NQcm9wcyA9IENvbnN0cnVjdFByb3BzPENpcmN1bGFyUHJvZ3Jlc3MsIEFzdGFsLkNpcmN1bGFyUHJvZ3Jlc3MuQ29uc3RydWN0b3JQcm9wcz5cbmV4cG9ydCBjbGFzcyBDaXJjdWxhclByb2dyZXNzIGV4dGVuZHMgYXN0YWxpZnkoQXN0YWwuQ2lyY3VsYXJQcm9ncmVzcykge1xuICAgIHN0YXRpYyB7IEdPYmplY3QucmVnaXN0ZXJDbGFzcyh7IEdUeXBlTmFtZTogXCJDaXJjdWxhclByb2dyZXNzXCIgfSwgdGhpcykgfVxuICAgIGNvbnN0cnVjdG9yKHByb3BzPzogQ2lyY3VsYXJQcm9ncmVzc1Byb3BzLCBjaGlsZD86IEJpbmRhYmxlQ2hpbGQpIHsgc3VwZXIoeyBjaGlsZCwgLi4ucHJvcHMgfSBhcyBhbnkpIH1cbn1cblxuLy8gRHJhd2luZ0FyZWFcbmV4cG9ydCB0eXBlIERyYXdpbmdBcmVhUHJvcHMgPSBDb25zdHJ1Y3RQcm9wczxEcmF3aW5nQXJlYSwgR3RrLkRyYXdpbmdBcmVhLkNvbnN0cnVjdG9yUHJvcHMsIHtcbiAgICBvbkRyYXc6IFtjcjogYW55XSAvLyBUT0RPOiBjYWlybyB0eXBlc1xufT5cbmV4cG9ydCBjbGFzcyBEcmF3aW5nQXJlYSBleHRlbmRzIGFzdGFsaWZ5KEd0ay5EcmF3aW5nQXJlYSkge1xuICAgIHN0YXRpYyB7IEdPYmplY3QucmVnaXN0ZXJDbGFzcyh7IEdUeXBlTmFtZTogXCJEcmF3aW5nQXJlYVwiIH0sIHRoaXMpIH1cbiAgICBjb25zdHJ1Y3Rvcihwcm9wcz86IERyYXdpbmdBcmVhUHJvcHMpIHsgc3VwZXIocHJvcHMgYXMgYW55KSB9XG59XG5cbi8vIEVudHJ5XG5leHBvcnQgdHlwZSBFbnRyeVByb3BzID0gQ29uc3RydWN0UHJvcHM8RW50cnksIEd0ay5FbnRyeS5Db25zdHJ1Y3RvclByb3BzLCB7XG4gICAgb25DaGFuZ2VkOiBbXVxuICAgIG9uQWN0aXZhdGU6IFtdXG59PlxuZXhwb3J0IGNsYXNzIEVudHJ5IGV4dGVuZHMgYXN0YWxpZnkoR3RrLkVudHJ5KSB7XG4gICAgc3RhdGljIHsgR09iamVjdC5yZWdpc3RlckNsYXNzKHsgR1R5cGVOYW1lOiBcIkVudHJ5XCIgfSwgdGhpcykgfVxuICAgIGNvbnN0cnVjdG9yKHByb3BzPzogRW50cnlQcm9wcykgeyBzdXBlcihwcm9wcyBhcyBhbnkpIH1cbn1cblxuLy8gRXZlbnRCb3hcbmV4cG9ydCB0eXBlIEV2ZW50Qm94UHJvcHMgPSBDb25zdHJ1Y3RQcm9wczxFdmVudEJveCwgQXN0YWwuRXZlbnRCb3guQ29uc3RydWN0b3JQcm9wcywge1xuICAgIG9uQ2xpY2s6IFtldmVudDogQXN0YWwuQ2xpY2tFdmVudF1cbiAgICBvbkNsaWNrUmVsZWFzZTogW2V2ZW50OiBBc3RhbC5DbGlja0V2ZW50XVxuICAgIG9uSG92ZXI6IFtldmVudDogQXN0YWwuSG92ZXJFdmVudF1cbiAgICBvbkhvdmVyTG9zdDogW2V2ZW50OiBBc3RhbC5Ib3ZlckV2ZW50XVxuICAgIG9uU2Nyb2xsOiBbZXZlbnQ6IEFzdGFsLlNjcm9sbEV2ZW50XVxufT5cbmV4cG9ydCBjbGFzcyBFdmVudEJveCBleHRlbmRzIGFzdGFsaWZ5KEFzdGFsLkV2ZW50Qm94KSB7XG4gICAgc3RhdGljIHsgR09iamVjdC5yZWdpc3RlckNsYXNzKHsgR1R5cGVOYW1lOiBcIkV2ZW50Qm94XCIgfSwgdGhpcykgfVxuICAgIGNvbnN0cnVjdG9yKHByb3BzPzogRXZlbnRCb3hQcm9wcywgY2hpbGQ/OiBCaW5kYWJsZUNoaWxkKSB7IHN1cGVyKHsgY2hpbGQsIC4uLnByb3BzIH0gYXMgYW55KSB9XG59XG5cbi8vIC8vIFRPRE86IEZpeGVkXG4vLyAvLyBUT0RPOiBGbG93Qm94XG4vL1xuLy8gSWNvblxuZXhwb3J0IHR5cGUgSWNvblByb3BzID0gQ29uc3RydWN0UHJvcHM8SWNvbiwgQXN0YWwuSWNvbi5Db25zdHJ1Y3RvclByb3BzPlxuZXhwb3J0IGNsYXNzIEljb24gZXh0ZW5kcyBhc3RhbGlmeShBc3RhbC5JY29uKSB7XG4gICAgc3RhdGljIHsgR09iamVjdC5yZWdpc3RlckNsYXNzKHsgR1R5cGVOYW1lOiBcIkljb25cIiB9LCB0aGlzKSB9XG4gICAgY29uc3RydWN0b3IocHJvcHM/OiBJY29uUHJvcHMpIHsgc3VwZXIocHJvcHMgYXMgYW55KSB9XG59XG5cbi8vIExhYmVsXG5leHBvcnQgdHlwZSBMYWJlbFByb3BzID0gQ29uc3RydWN0UHJvcHM8TGFiZWwsIEFzdGFsLkxhYmVsLkNvbnN0cnVjdG9yUHJvcHM+XG5leHBvcnQgY2xhc3MgTGFiZWwgZXh0ZW5kcyBhc3RhbGlmeShBc3RhbC5MYWJlbCkge1xuICAgIHN0YXRpYyB7IEdPYmplY3QucmVnaXN0ZXJDbGFzcyh7IEdUeXBlTmFtZTogXCJMYWJlbFwiIH0sIHRoaXMpIH1cbiAgICBjb25zdHJ1Y3Rvcihwcm9wcz86IExhYmVsUHJvcHMpIHsgc3VwZXIocHJvcHMgYXMgYW55KSB9XG4gICAgcHJvdGVjdGVkIHNldENoaWxkcmVuKGNoaWxkcmVuOiBhbnlbXSk6IHZvaWQgeyB0aGlzLmxhYmVsID0gU3RyaW5nKGNoaWxkcmVuKSB9XG59XG5cbi8vIExldmVsQmFyXG5leHBvcnQgdHlwZSBMZXZlbEJhclByb3BzID0gQ29uc3RydWN0UHJvcHM8TGV2ZWxCYXIsIEFzdGFsLkxldmVsQmFyLkNvbnN0cnVjdG9yUHJvcHM+XG5leHBvcnQgY2xhc3MgTGV2ZWxCYXIgZXh0ZW5kcyBhc3RhbGlmeShBc3RhbC5MZXZlbEJhcikge1xuICAgIHN0YXRpYyB7IEdPYmplY3QucmVnaXN0ZXJDbGFzcyh7IEdUeXBlTmFtZTogXCJMZXZlbEJhclwiIH0sIHRoaXMpIH1cbiAgICBjb25zdHJ1Y3Rvcihwcm9wcz86IExldmVsQmFyUHJvcHMpIHsgc3VwZXIocHJvcHMgYXMgYW55KSB9XG59XG5cbi8vIFRPRE86IExpc3RCb3hcblxuLy8gTWVudUJ1dHRvblxuZXhwb3J0IHR5cGUgTWVudUJ1dHRvblByb3BzID0gQ29uc3RydWN0UHJvcHM8TWVudUJ1dHRvbiwgR3RrLk1lbnVCdXR0b24uQ29uc3RydWN0b3JQcm9wcz5cbmV4cG9ydCBjbGFzcyBNZW51QnV0dG9uIGV4dGVuZHMgYXN0YWxpZnkoR3RrLk1lbnVCdXR0b24pIHtcbiAgICBzdGF0aWMgeyBHT2JqZWN0LnJlZ2lzdGVyQ2xhc3MoeyBHVHlwZU5hbWU6IFwiTWVudUJ1dHRvblwiIH0sIHRoaXMpIH1cbiAgICBjb25zdHJ1Y3Rvcihwcm9wcz86IE1lbnVCdXR0b25Qcm9wcywgY2hpbGQ/OiBCaW5kYWJsZUNoaWxkKSB7IHN1cGVyKHsgY2hpbGQsIC4uLnByb3BzIH0gYXMgYW55KSB9XG59XG5cbi8vIE92ZXJsYXlcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShBc3RhbC5PdmVybGF5LnByb3RvdHlwZSwgXCJvdmVybGF5c1wiLCB7XG4gICAgZ2V0KCkgeyByZXR1cm4gdGhpcy5nZXRfb3ZlcmxheXMoKSB9LFxuICAgIHNldCh2KSB7IHRoaXMuc2V0X292ZXJsYXlzKHYpIH0sXG59KVxuXG5leHBvcnQgdHlwZSBPdmVybGF5UHJvcHMgPSBDb25zdHJ1Y3RQcm9wczxPdmVybGF5LCBBc3RhbC5PdmVybGF5LkNvbnN0cnVjdG9yUHJvcHM+XG5leHBvcnQgY2xhc3MgT3ZlcmxheSBleHRlbmRzIGFzdGFsaWZ5KEFzdGFsLk92ZXJsYXkpIHtcbiAgICBzdGF0aWMgeyBHT2JqZWN0LnJlZ2lzdGVyQ2xhc3MoeyBHVHlwZU5hbWU6IFwiT3ZlcmxheVwiIH0sIHRoaXMpIH1cbiAgICBjb25zdHJ1Y3Rvcihwcm9wcz86IE92ZXJsYXlQcm9wcywgLi4uY2hpbGRyZW46IEFycmF5PEJpbmRhYmxlQ2hpbGQ+KSB7IHN1cGVyKHsgY2hpbGRyZW4sIC4uLnByb3BzIH0gYXMgYW55KSB9XG4gICAgcHJvdGVjdGVkIHNldENoaWxkcmVuKGNoaWxkcmVuOiBhbnlbXSk6IHZvaWQge1xuICAgICAgICBjb25zdCBbY2hpbGQsIC4uLm92ZXJsYXlzXSA9IGZpbHRlcihjaGlsZHJlbilcbiAgICAgICAgdGhpcy5zZXRfY2hpbGQoY2hpbGQpXG4gICAgICAgIHRoaXMuc2V0X292ZXJsYXlzKG92ZXJsYXlzKVxuICAgIH1cbn1cblxuLy8gUmV2ZWFsZXJcbmV4cG9ydCB0eXBlIFJldmVhbGVyUHJvcHMgPSBDb25zdHJ1Y3RQcm9wczxSZXZlYWxlciwgR3RrLlJldmVhbGVyLkNvbnN0cnVjdG9yUHJvcHM+XG5leHBvcnQgY2xhc3MgUmV2ZWFsZXIgZXh0ZW5kcyBhc3RhbGlmeShHdGsuUmV2ZWFsZXIpIHtcbiAgICBzdGF0aWMgeyBHT2JqZWN0LnJlZ2lzdGVyQ2xhc3MoeyBHVHlwZU5hbWU6IFwiUmV2ZWFsZXJcIiB9LCB0aGlzKSB9XG4gICAgY29uc3RydWN0b3IocHJvcHM/OiBSZXZlYWxlclByb3BzLCBjaGlsZD86IEJpbmRhYmxlQ2hpbGQpIHsgc3VwZXIoeyBjaGlsZCwgLi4ucHJvcHMgfSBhcyBhbnkpIH1cbn1cblxuLy8gU2Nyb2xsYWJsZVxuZXhwb3J0IHR5cGUgU2Nyb2xsYWJsZVByb3BzID0gQ29uc3RydWN0UHJvcHM8U2Nyb2xsYWJsZSwgQXN0YWwuU2Nyb2xsYWJsZS5Db25zdHJ1Y3RvclByb3BzPlxuZXhwb3J0IGNsYXNzIFNjcm9sbGFibGUgZXh0ZW5kcyBhc3RhbGlmeShBc3RhbC5TY3JvbGxhYmxlKSB7XG4gICAgc3RhdGljIHsgR09iamVjdC5yZWdpc3RlckNsYXNzKHsgR1R5cGVOYW1lOiBcIlNjcm9sbGFibGVcIiB9LCB0aGlzKSB9XG4gICAgY29uc3RydWN0b3IocHJvcHM/OiBTY3JvbGxhYmxlUHJvcHMsIGNoaWxkPzogQmluZGFibGVDaGlsZCkgeyBzdXBlcih7IGNoaWxkLCAuLi5wcm9wcyB9IGFzIGFueSkgfVxufVxuXG4vLyBTbGlkZXJcbmV4cG9ydCB0eXBlIFNsaWRlclByb3BzID0gQ29uc3RydWN0UHJvcHM8U2xpZGVyLCBBc3RhbC5TbGlkZXIuQ29uc3RydWN0b3JQcm9wcywge1xuICAgIG9uRHJhZ2dlZDogW11cbn0+XG5leHBvcnQgY2xhc3MgU2xpZGVyIGV4dGVuZHMgYXN0YWxpZnkoQXN0YWwuU2xpZGVyKSB7XG4gICAgc3RhdGljIHsgR09iamVjdC5yZWdpc3RlckNsYXNzKHsgR1R5cGVOYW1lOiBcIlNsaWRlclwiIH0sIHRoaXMpIH1cbiAgICBjb25zdHJ1Y3Rvcihwcm9wcz86IFNsaWRlclByb3BzKSB7IHN1cGVyKHByb3BzIGFzIGFueSkgfVxufVxuXG4vLyBTdGFja1xuZXhwb3J0IHR5cGUgU3RhY2tQcm9wcyA9IENvbnN0cnVjdFByb3BzPFN0YWNrLCBBc3RhbC5TdGFjay5Db25zdHJ1Y3RvclByb3BzPlxuZXhwb3J0IGNsYXNzIFN0YWNrIGV4dGVuZHMgYXN0YWxpZnkoQXN0YWwuU3RhY2spIHtcbiAgICBzdGF0aWMgeyBHT2JqZWN0LnJlZ2lzdGVyQ2xhc3MoeyBHVHlwZU5hbWU6IFwiU3RhY2tcIiB9LCB0aGlzKSB9XG4gICAgY29uc3RydWN0b3IocHJvcHM/OiBTdGFja1Byb3BzLCAuLi5jaGlsZHJlbjogQXJyYXk8QmluZGFibGVDaGlsZD4pIHsgc3VwZXIoeyBjaGlsZHJlbiwgLi4ucHJvcHMgfSBhcyBhbnkpIH1cbiAgICBwcm90ZWN0ZWQgc2V0Q2hpbGRyZW4oY2hpbGRyZW46IGFueVtdKTogdm9pZCB7IHRoaXMuc2V0X2NoaWxkcmVuKGZpbHRlcihjaGlsZHJlbikpIH1cbn1cblxuLy8gU3dpdGNoXG5leHBvcnQgdHlwZSBTd2l0Y2hQcm9wcyA9IENvbnN0cnVjdFByb3BzPFN3aXRjaCwgR3RrLlN3aXRjaC5Db25zdHJ1Y3RvclByb3BzPlxuZXhwb3J0IGNsYXNzIFN3aXRjaCBleHRlbmRzIGFzdGFsaWZ5KEd0ay5Td2l0Y2gpIHtcbiAgICBzdGF0aWMgeyBHT2JqZWN0LnJlZ2lzdGVyQ2xhc3MoeyBHVHlwZU5hbWU6IFwiU3dpdGNoXCIgfSwgdGhpcykgfVxuICAgIGNvbnN0cnVjdG9yKHByb3BzPzogU3dpdGNoUHJvcHMpIHsgc3VwZXIocHJvcHMgYXMgYW55KSB9XG59XG5cbi8vIFdpbmRvd1xuZXhwb3J0IHR5cGUgV2luZG93UHJvcHMgPSBDb25zdHJ1Y3RQcm9wczxXaW5kb3csIEFzdGFsLldpbmRvdy5Db25zdHJ1Y3RvclByb3BzPlxuZXhwb3J0IGNsYXNzIFdpbmRvdyBleHRlbmRzIGFzdGFsaWZ5KEFzdGFsLldpbmRvdykge1xuICAgIHN0YXRpYyB7IEdPYmplY3QucmVnaXN0ZXJDbGFzcyh7IEdUeXBlTmFtZTogXCJXaW5kb3dcIiB9LCB0aGlzKSB9XG4gICAgY29uc3RydWN0b3IocHJvcHM/OiBXaW5kb3dQcm9wcywgY2hpbGQ/OiBCaW5kYWJsZUNoaWxkKSB7IHN1cGVyKHsgY2hpbGQsIC4uLnByb3BzIH0gYXMgYW55KSB9XG59XG4iLCAiaW1wb3J0IEFzdGFsIGZyb20gXCJnaTovL0FzdGFsSU9cIlxuaW1wb3J0IEdpbyBmcm9tIFwiZ2k6Ly9HaW8/dmVyc2lvbj0yLjBcIlxuXG5leHBvcnQgeyBHaW8gfVxuXG5leHBvcnQgZnVuY3Rpb24gcmVhZEZpbGUocGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gQXN0YWwucmVhZF9maWxlKHBhdGgpIHx8IFwiXCJcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRGaWxlQXN5bmMocGF0aDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBBc3RhbC5yZWFkX2ZpbGVfYXN5bmMocGF0aCwgKF8sIHJlcykgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKEFzdGFsLnJlYWRfZmlsZV9maW5pc2gocmVzKSB8fCBcIlwiKVxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHdyaXRlRmlsZShwYXRoOiBzdHJpbmcsIGNvbnRlbnQ6IHN0cmluZyk6IHZvaWQge1xuICAgIEFzdGFsLndyaXRlX2ZpbGUocGF0aCwgY29udGVudClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHdyaXRlRmlsZUFzeW5jKHBhdGg6IHN0cmluZywgY29udGVudDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgQXN0YWwud3JpdGVfZmlsZV9hc3luYyhwYXRoLCBjb250ZW50LCAoXywgcmVzKSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoQXN0YWwud3JpdGVfZmlsZV9maW5pc2gocmVzKSlcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtb25pdG9yRmlsZShcbiAgICBwYXRoOiBzdHJpbmcsXG4gICAgY2FsbGJhY2s6IChmaWxlOiBzdHJpbmcsIGV2ZW50OiBHaW8uRmlsZU1vbml0b3JFdmVudCkgPT4gdm9pZCxcbik6IEdpby5GaWxlTW9uaXRvciB7XG4gICAgcmV0dXJuIEFzdGFsLm1vbml0b3JfZmlsZShwYXRoLCAoZmlsZTogc3RyaW5nLCBldmVudDogR2lvLkZpbGVNb25pdG9yRXZlbnQpID0+IHtcbiAgICAgICAgY2FsbGJhY2soZmlsZSwgZXZlbnQpXG4gICAgfSkhXG59XG4iLCAiaW1wb3J0IFwiLi9vdmVycmlkZXMuanNcIlxuZXhwb3J0IHsgZGVmYXVsdCBhcyBBc3RhbElPIH0gZnJvbSBcImdpOi8vQXN0YWxJTz92ZXJzaW9uPTAuMVwiXG5leHBvcnQgKiBmcm9tIFwiLi9wcm9jZXNzLmpzXCJcbmV4cG9ydCAqIGZyb20gXCIuL3RpbWUuanNcIlxuZXhwb3J0ICogZnJvbSBcIi4vZmlsZS5qc1wiXG5leHBvcnQgKiBmcm9tIFwiLi9nb2JqZWN0LmpzXCJcbmV4cG9ydCB7IEJpbmRpbmcsIGJpbmQgfSBmcm9tIFwiLi9iaW5kaW5nLmpzXCJcbmV4cG9ydCB7IFZhcmlhYmxlLCBkZXJpdmUgfSBmcm9tIFwiLi92YXJpYWJsZS5qc1wiXG4iLCAiaW1wb3J0IEdPYmplY3QgZnJvbSBcImdpOi8vR09iamVjdFwiXG5cbmV4cG9ydCB7IGRlZmF1bHQgYXMgR0xpYiB9IGZyb20gXCJnaTovL0dMaWI/dmVyc2lvbj0yLjBcIlxuZXhwb3J0IHsgR09iamVjdCwgR09iamVjdCBhcyBkZWZhdWx0IH1cblxuY29uc3QgbWV0YSA9IFN5bWJvbChcIm1ldGFcIilcbmNvbnN0IHByaXYgPSBTeW1ib2woXCJwcml2XCIpXG5cbmNvbnN0IHsgUGFyYW1TcGVjLCBQYXJhbUZsYWdzIH0gPSBHT2JqZWN0XG5cbmNvbnN0IGtlYmFiaWZ5ID0gKHN0cjogc3RyaW5nKSA9PiBzdHJcbiAgICAucmVwbGFjZSgvKFthLXpdKShbQS1aXSkvZywgXCIkMS0kMlwiKVxuICAgIC5yZXBsYWNlQWxsKFwiX1wiLCBcIi1cIilcbiAgICAudG9Mb3dlckNhc2UoKVxuXG50eXBlIFNpZ25hbERlY2xhcmF0aW9uID0ge1xuICAgIGZsYWdzPzogR09iamVjdC5TaWduYWxGbGFnc1xuICAgIGFjY3VtdWxhdG9yPzogR09iamVjdC5BY2N1bXVsYXRvclR5cGVcbiAgICByZXR1cm5fdHlwZT86IEdPYmplY3QuR1R5cGVcbiAgICBwYXJhbV90eXBlcz86IEFycmF5PEdPYmplY3QuR1R5cGU+XG59XG5cbnR5cGUgUHJvcGVydHlEZWNsYXJhdGlvbiA9XG4gICAgfCBJbnN0YW5jZVR5cGU8dHlwZW9mIEdPYmplY3QuUGFyYW1TcGVjPlxuICAgIHwgeyAkZ3R5cGU6IEdPYmplY3QuR1R5cGUgfVxuICAgIHwgdHlwZW9mIFN0cmluZ1xuICAgIHwgdHlwZW9mIE51bWJlclxuICAgIHwgdHlwZW9mIEJvb2xlYW5cbiAgICB8IHR5cGVvZiBPYmplY3RcblxudHlwZSBHT2JqZWN0Q29uc3RydWN0b3IgPSB7XG4gICAgW21ldGFdPzoge1xuICAgICAgICBQcm9wZXJ0aWVzPzogeyBba2V5OiBzdHJpbmddOiBHT2JqZWN0LlBhcmFtU3BlYyB9XG4gICAgICAgIFNpZ25hbHM/OiB7IFtrZXk6IHN0cmluZ106IEdPYmplY3QuU2lnbmFsRGVmaW5pdGlvbiB9XG4gICAgfVxuICAgIG5ldyguLi5hcmdzOiBhbnlbXSk6IGFueVxufVxuXG50eXBlIE1ldGFJbmZvID0gR09iamVjdC5NZXRhSW5mbzxuZXZlciwgQXJyYXk8eyAkZ3R5cGU6IEdPYmplY3QuR1R5cGUgfT4sIG5ldmVyPlxuXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXIob3B0aW9uczogTWV0YUluZm8gPSB7fSkge1xuICAgIHJldHVybiBmdW5jdGlvbiAoY2xzOiBHT2JqZWN0Q29uc3RydWN0b3IpIHtcbiAgICAgICAgY29uc3QgdCA9IG9wdGlvbnMuVGVtcGxhdGVcbiAgICAgICAgaWYgKHR5cGVvZiB0ID09PSBcInN0cmluZ1wiICYmICF0LnN0YXJ0c1dpdGgoXCJyZXNvdXJjZTovL1wiKSAmJiAhdC5zdGFydHNXaXRoKFwiZmlsZTovL1wiKSkge1xuICAgICAgICAgICAgLy8gYXNzdW1lIHhtbCB0ZW1wbGF0ZVxuICAgICAgICAgICAgb3B0aW9ucy5UZW1wbGF0ZSA9IG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZSh0KVxuICAgICAgICB9XG5cbiAgICAgICAgR09iamVjdC5yZWdpc3RlckNsYXNzKHtcbiAgICAgICAgICAgIFNpZ25hbHM6IHsgLi4uY2xzW21ldGFdPy5TaWduYWxzIH0sXG4gICAgICAgICAgICBQcm9wZXJ0aWVzOiB7IC4uLmNsc1ttZXRhXT8uUHJvcGVydGllcyB9LFxuICAgICAgICAgICAgLi4ub3B0aW9ucyxcbiAgICAgICAgfSwgY2xzKVxuXG4gICAgICAgIGRlbGV0ZSBjbHNbbWV0YV1cbiAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwcm9wZXJ0eShkZWNsYXJhdGlvbjogUHJvcGVydHlEZWNsYXJhdGlvbiA9IE9iamVjdCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodGFyZ2V0OiBhbnksIHByb3A6IGFueSwgZGVzYz86IFByb3BlcnR5RGVzY3JpcHRvcikge1xuICAgICAgICB0YXJnZXQuY29uc3RydWN0b3JbbWV0YV0gPz89IHt9XG4gICAgICAgIHRhcmdldC5jb25zdHJ1Y3RvclttZXRhXS5Qcm9wZXJ0aWVzID8/PSB7fVxuXG4gICAgICAgIGNvbnN0IG5hbWUgPSBrZWJhYmlmeShwcm9wKVxuXG4gICAgICAgIGlmICghZGVzYykge1xuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgcHJvcCwge1xuICAgICAgICAgICAgICAgIGdldCgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXNbcHJpdl0/Lltwcm9wXSA/PyBkZWZhdWx0VmFsdWUoZGVjbGFyYXRpb24pXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBzZXQodjogYW55KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh2ICE9PSB0aGlzW3Byb3BdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzW3ByaXZdID8/PSB7fVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpc1twcml2XVtwcm9wXSA9IHZcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubm90aWZ5KG5hbWUpXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgYHNldF8ke25hbWUucmVwbGFjZShcIi1cIiwgXCJfXCIpfWAsIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSh2OiBhbnkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpc1twcm9wXSA9IHZcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgYGdldF8ke25hbWUucmVwbGFjZShcIi1cIiwgXCJfXCIpfWAsIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXNbcHJvcF1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgdGFyZ2V0LmNvbnN0cnVjdG9yW21ldGFdLlByb3BlcnRpZXNba2ViYWJpZnkocHJvcCldID0gcHNwZWMobmFtZSwgUGFyYW1GbGFncy5SRUFEV1JJVEUsIGRlY2xhcmF0aW9uKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbGV0IGZsYWdzID0gMFxuICAgICAgICAgICAgaWYgKGRlc2MuZ2V0KSBmbGFncyB8PSBQYXJhbUZsYWdzLlJFQURBQkxFXG4gICAgICAgICAgICBpZiAoZGVzYy5zZXQpIGZsYWdzIHw9IFBhcmFtRmxhZ3MuV1JJVEFCTEVcblxuICAgICAgICAgICAgdGFyZ2V0LmNvbnN0cnVjdG9yW21ldGFdLlByb3BlcnRpZXNba2ViYWJpZnkocHJvcCldID0gcHNwZWMobmFtZSwgZmxhZ3MsIGRlY2xhcmF0aW9uKVxuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gc2lnbmFsKC4uLnBhcmFtczogQXJyYXk8eyAkZ3R5cGU6IEdPYmplY3QuR1R5cGUgfSB8IHR5cGVvZiBPYmplY3Q+KTpcbih0YXJnZXQ6IGFueSwgc2lnbmFsOiBhbnksIGRlc2M/OiBQcm9wZXJ0eURlc2NyaXB0b3IpID0+IHZvaWRcblxuZXhwb3J0IGZ1bmN0aW9uIHNpZ25hbChkZWNsYXJhdGlvbj86IFNpZ25hbERlY2xhcmF0aW9uKTpcbih0YXJnZXQ6IGFueSwgc2lnbmFsOiBhbnksIGRlc2M/OiBQcm9wZXJ0eURlc2NyaXB0b3IpID0+IHZvaWRcblxuZXhwb3J0IGZ1bmN0aW9uIHNpZ25hbChcbiAgICBkZWNsYXJhdGlvbj86IFNpZ25hbERlY2xhcmF0aW9uIHwgeyAkZ3R5cGU6IEdPYmplY3QuR1R5cGUgfSB8IHR5cGVvZiBPYmplY3QsXG4gICAgLi4ucGFyYW1zOiBBcnJheTx7ICRndHlwZTogR09iamVjdC5HVHlwZSB9IHwgdHlwZW9mIE9iamVjdD5cbikge1xuICAgIHJldHVybiBmdW5jdGlvbiAodGFyZ2V0OiBhbnksIHNpZ25hbDogYW55LCBkZXNjPzogUHJvcGVydHlEZXNjcmlwdG9yKSB7XG4gICAgICAgIHRhcmdldC5jb25zdHJ1Y3RvclttZXRhXSA/Pz0ge31cbiAgICAgICAgdGFyZ2V0LmNvbnN0cnVjdG9yW21ldGFdLlNpZ25hbHMgPz89IHt9XG5cbiAgICAgICAgY29uc3QgbmFtZSA9IGtlYmFiaWZ5KHNpZ25hbClcblxuICAgICAgICBpZiAoZGVjbGFyYXRpb24gfHwgcGFyYW1zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgVE9ETzogdHlwZSBhc3NlcnRcbiAgICAgICAgICAgIGNvbnN0IGFyciA9IFtkZWNsYXJhdGlvbiwgLi4ucGFyYW1zXS5tYXAodiA9PiB2LiRndHlwZSlcbiAgICAgICAgICAgIHRhcmdldC5jb25zdHJ1Y3RvclttZXRhXS5TaWduYWxzW25hbWVdID0ge1xuICAgICAgICAgICAgICAgIHBhcmFtX3R5cGVzOiBhcnIsXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0YXJnZXQuY29uc3RydWN0b3JbbWV0YV0uU2lnbmFsc1tuYW1lXSA9IGRlY2xhcmF0aW9uIHx8IHtcbiAgICAgICAgICAgICAgICBwYXJhbV90eXBlczogW10sXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWRlc2MpIHtcbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIHNpZ25hbCwge1xuICAgICAgICAgICAgICAgIHZhbHVlOiBmdW5jdGlvbiAoLi4uYXJnczogYW55W10pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KG5hbWUsIC4uLmFyZ3MpXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBvZzogKCguLi5hcmdzOiBhbnlbXSkgPT4gdm9pZCkgPSBkZXNjLnZhbHVlXG4gICAgICAgICAgICBkZXNjLnZhbHVlID0gZnVuY3Rpb24gKC4uLmFyZ3M6IGFueVtdKSB7XG4gICAgICAgICAgICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvciBub3QgdHlwZWRcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQobmFtZSwgLi4uYXJncylcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGBvbl8ke25hbWUucmVwbGFjZShcIi1cIiwgXCJfXCIpfWAsIHtcbiAgICAgICAgICAgICAgICB2YWx1ZTogZnVuY3Rpb24gKC4uLmFyZ3M6IGFueVtdKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvZyguLi5hcmdzKVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBwc3BlYyhuYW1lOiBzdHJpbmcsIGZsYWdzOiBudW1iZXIsIGRlY2xhcmF0aW9uOiBQcm9wZXJ0eURlY2xhcmF0aW9uKSB7XG4gICAgaWYgKGRlY2xhcmF0aW9uIGluc3RhbmNlb2YgUGFyYW1TcGVjKVxuICAgICAgICByZXR1cm4gZGVjbGFyYXRpb25cblxuICAgIHN3aXRjaCAoZGVjbGFyYXRpb24pIHtcbiAgICAgICAgY2FzZSBTdHJpbmc6XG4gICAgICAgICAgICByZXR1cm4gUGFyYW1TcGVjLnN0cmluZyhuYW1lLCBcIlwiLCBcIlwiLCBmbGFncywgXCJcIilcbiAgICAgICAgY2FzZSBOdW1iZXI6XG4gICAgICAgICAgICByZXR1cm4gUGFyYW1TcGVjLmRvdWJsZShuYW1lLCBcIlwiLCBcIlwiLCBmbGFncywgLU51bWJlci5NQVhfVkFMVUUsIE51bWJlci5NQVhfVkFMVUUsIDApXG4gICAgICAgIGNhc2UgQm9vbGVhbjpcbiAgICAgICAgICAgIHJldHVybiBQYXJhbVNwZWMuYm9vbGVhbihuYW1lLCBcIlwiLCBcIlwiLCBmbGFncywgZmFsc2UpXG4gICAgICAgIGNhc2UgT2JqZWN0OlxuICAgICAgICAgICAgcmV0dXJuIFBhcmFtU3BlYy5qc29iamVjdChuYW1lLCBcIlwiLCBcIlwiLCBmbGFncylcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgbWlzc3R5cGVkXG4gICAgICAgICAgICByZXR1cm4gUGFyYW1TcGVjLm9iamVjdChuYW1lLCBcIlwiLCBcIlwiLCBmbGFncywgZGVjbGFyYXRpb24uJGd0eXBlKVxuICAgIH1cbn1cblxuZnVuY3Rpb24gZGVmYXVsdFZhbHVlKGRlY2xhcmF0aW9uOiBQcm9wZXJ0eURlY2xhcmF0aW9uKSB7XG4gICAgaWYgKGRlY2xhcmF0aW9uIGluc3RhbmNlb2YgUGFyYW1TcGVjKVxuICAgICAgICByZXR1cm4gZGVjbGFyYXRpb24uZ2V0X2RlZmF1bHRfdmFsdWUoKVxuXG4gICAgc3dpdGNoIChkZWNsYXJhdGlvbikge1xuICAgICAgICBjYXNlIFN0cmluZzpcbiAgICAgICAgICAgIHJldHVybiBcIlwiXG4gICAgICAgIGNhc2UgTnVtYmVyOlxuICAgICAgICAgICAgcmV0dXJuIDBcbiAgICAgICAgY2FzZSBCb29sZWFuOlxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIGNhc2UgT2JqZWN0OlxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuIG51bGxcbiAgICB9XG59XG4iLCAiZXhwb3J0ICogZnJvbSBcIi4vZXJyb3JzLmpzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9oZWxwZXJzL3BhcnNlVXRpbC5qc1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vaGVscGVycy90eXBlQWxpYXNlcy5qc1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vaGVscGVycy91dGlsLmpzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi90eXBlcy5qc1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vWm9kRXJyb3IuanNcIjtcbiIsICJleHBvcnQgdmFyIHV0aWw7XG4oZnVuY3Rpb24gKHV0aWwpIHtcbiAgICB1dGlsLmFzc2VydEVxdWFsID0gKF8pID0+IHsgfTtcbiAgICBmdW5jdGlvbiBhc3NlcnRJcyhfYXJnKSB7IH1cbiAgICB1dGlsLmFzc2VydElzID0gYXNzZXJ0SXM7XG4gICAgZnVuY3Rpb24gYXNzZXJ0TmV2ZXIoX3gpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCk7XG4gICAgfVxuICAgIHV0aWwuYXNzZXJ0TmV2ZXIgPSBhc3NlcnROZXZlcjtcbiAgICB1dGlsLmFycmF5VG9FbnVtID0gKGl0ZW1zKSA9PiB7XG4gICAgICAgIGNvbnN0IG9iaiA9IHt9O1xuICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgaXRlbXMpIHtcbiAgICAgICAgICAgIG9ialtpdGVtXSA9IGl0ZW07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG9iajtcbiAgICB9O1xuICAgIHV0aWwuZ2V0VmFsaWRFbnVtVmFsdWVzID0gKG9iaikgPT4ge1xuICAgICAgICBjb25zdCB2YWxpZEtleXMgPSB1dGlsLm9iamVjdEtleXMob2JqKS5maWx0ZXIoKGspID0+IHR5cGVvZiBvYmpbb2JqW2tdXSAhPT0gXCJudW1iZXJcIik7XG4gICAgICAgIGNvbnN0IGZpbHRlcmVkID0ge307XG4gICAgICAgIGZvciAoY29uc3QgayBvZiB2YWxpZEtleXMpIHtcbiAgICAgICAgICAgIGZpbHRlcmVkW2tdID0gb2JqW2tdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1dGlsLm9iamVjdFZhbHVlcyhmaWx0ZXJlZCk7XG4gICAgfTtcbiAgICB1dGlsLm9iamVjdFZhbHVlcyA9IChvYmopID0+IHtcbiAgICAgICAgcmV0dXJuIHV0aWwub2JqZWN0S2V5cyhvYmopLm1hcChmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgcmV0dXJuIG9ialtlXTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICB1dGlsLm9iamVjdEtleXMgPSB0eXBlb2YgT2JqZWN0LmtleXMgPT09IFwiZnVuY3Rpb25cIiAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGJhbi9iYW5cbiAgICAgICAgPyAob2JqKSA9PiBPYmplY3Qua2V5cyhvYmopIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgYmFuL2JhblxuICAgICAgICA6IChvYmplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGtleXMgPSBbXTtcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IGluIG9iamVjdCkge1xuICAgICAgICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgIGtleXMucHVzaChrZXkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBrZXlzO1xuICAgICAgICB9O1xuICAgIHV0aWwuZmluZCA9IChhcnIsIGNoZWNrZXIpID0+IHtcbiAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIGFycikge1xuICAgICAgICAgICAgaWYgKGNoZWNrZXIoaXRlbSkpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGl0ZW07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9O1xuICAgIHV0aWwuaXNJbnRlZ2VyID0gdHlwZW9mIE51bWJlci5pc0ludGVnZXIgPT09IFwiZnVuY3Rpb25cIlxuICAgICAgICA/ICh2YWwpID0+IE51bWJlci5pc0ludGVnZXIodmFsKSAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGJhbi9iYW5cbiAgICAgICAgOiAodmFsKSA9PiB0eXBlb2YgdmFsID09PSBcIm51bWJlclwiICYmIE51bWJlci5pc0Zpbml0ZSh2YWwpICYmIE1hdGguZmxvb3IodmFsKSA9PT0gdmFsO1xuICAgIGZ1bmN0aW9uIGpvaW5WYWx1ZXMoYXJyYXksIHNlcGFyYXRvciA9IFwiIHwgXCIpIHtcbiAgICAgICAgcmV0dXJuIGFycmF5Lm1hcCgodmFsKSA9PiAodHlwZW9mIHZhbCA9PT0gXCJzdHJpbmdcIiA/IGAnJHt2YWx9J2AgOiB2YWwpKS5qb2luKHNlcGFyYXRvcik7XG4gICAgfVxuICAgIHV0aWwuam9pblZhbHVlcyA9IGpvaW5WYWx1ZXM7XG4gICAgdXRpbC5qc29uU3RyaW5naWZ5UmVwbGFjZXIgPSAoXywgdmFsdWUpID0+IHtcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJiaWdpbnRcIikge1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlLnRvU3RyaW5nKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH07XG59KSh1dGlsIHx8ICh1dGlsID0ge30pKTtcbmV4cG9ydCB2YXIgb2JqZWN0VXRpbDtcbihmdW5jdGlvbiAob2JqZWN0VXRpbCkge1xuICAgIG9iamVjdFV0aWwubWVyZ2VTaGFwZXMgPSAoZmlyc3QsIHNlY29uZCkgPT4ge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLi4uZmlyc3QsXG4gICAgICAgICAgICAuLi5zZWNvbmQsIC8vIHNlY29uZCBvdmVyd3JpdGVzIGZpcnN0XG4gICAgICAgIH07XG4gICAgfTtcbn0pKG9iamVjdFV0aWwgfHwgKG9iamVjdFV0aWwgPSB7fSkpO1xuZXhwb3J0IGNvbnN0IFpvZFBhcnNlZFR5cGUgPSB1dGlsLmFycmF5VG9FbnVtKFtcbiAgICBcInN0cmluZ1wiLFxuICAgIFwibmFuXCIsXG4gICAgXCJudW1iZXJcIixcbiAgICBcImludGVnZXJcIixcbiAgICBcImZsb2F0XCIsXG4gICAgXCJib29sZWFuXCIsXG4gICAgXCJkYXRlXCIsXG4gICAgXCJiaWdpbnRcIixcbiAgICBcInN5bWJvbFwiLFxuICAgIFwiZnVuY3Rpb25cIixcbiAgICBcInVuZGVmaW5lZFwiLFxuICAgIFwibnVsbFwiLFxuICAgIFwiYXJyYXlcIixcbiAgICBcIm9iamVjdFwiLFxuICAgIFwidW5rbm93blwiLFxuICAgIFwicHJvbWlzZVwiLFxuICAgIFwidm9pZFwiLFxuICAgIFwibmV2ZXJcIixcbiAgICBcIm1hcFwiLFxuICAgIFwic2V0XCIsXG5dKTtcbmV4cG9ydCBjb25zdCBnZXRQYXJzZWRUeXBlID0gKGRhdGEpID0+IHtcbiAgICBjb25zdCB0ID0gdHlwZW9mIGRhdGE7XG4gICAgc3dpdGNoICh0KSB7XG4gICAgICAgIGNhc2UgXCJ1bmRlZmluZWRcIjpcbiAgICAgICAgICAgIHJldHVybiBab2RQYXJzZWRUeXBlLnVuZGVmaW5lZDtcbiAgICAgICAgY2FzZSBcInN0cmluZ1wiOlxuICAgICAgICAgICAgcmV0dXJuIFpvZFBhcnNlZFR5cGUuc3RyaW5nO1xuICAgICAgICBjYXNlIFwibnVtYmVyXCI6XG4gICAgICAgICAgICByZXR1cm4gTnVtYmVyLmlzTmFOKGRhdGEpID8gWm9kUGFyc2VkVHlwZS5uYW4gOiBab2RQYXJzZWRUeXBlLm51bWJlcjtcbiAgICAgICAgY2FzZSBcImJvb2xlYW5cIjpcbiAgICAgICAgICAgIHJldHVybiBab2RQYXJzZWRUeXBlLmJvb2xlYW47XG4gICAgICAgIGNhc2UgXCJmdW5jdGlvblwiOlxuICAgICAgICAgICAgcmV0dXJuIFpvZFBhcnNlZFR5cGUuZnVuY3Rpb247XG4gICAgICAgIGNhc2UgXCJiaWdpbnRcIjpcbiAgICAgICAgICAgIHJldHVybiBab2RQYXJzZWRUeXBlLmJpZ2ludDtcbiAgICAgICAgY2FzZSBcInN5bWJvbFwiOlxuICAgICAgICAgICAgcmV0dXJuIFpvZFBhcnNlZFR5cGUuc3ltYm9sO1xuICAgICAgICBjYXNlIFwib2JqZWN0XCI6XG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShkYXRhKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBab2RQYXJzZWRUeXBlLmFycmF5O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGRhdGEgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gWm9kUGFyc2VkVHlwZS5udWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGRhdGEudGhlbiAmJiB0eXBlb2YgZGF0YS50aGVuID09PSBcImZ1bmN0aW9uXCIgJiYgZGF0YS5jYXRjaCAmJiB0eXBlb2YgZGF0YS5jYXRjaCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFpvZFBhcnNlZFR5cGUucHJvbWlzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0eXBlb2YgTWFwICE9PSBcInVuZGVmaW5lZFwiICYmIGRhdGEgaW5zdGFuY2VvZiBNYXApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gWm9kUGFyc2VkVHlwZS5tYXA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodHlwZW9mIFNldCAhPT0gXCJ1bmRlZmluZWRcIiAmJiBkYXRhIGluc3RhbmNlb2YgU2V0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFpvZFBhcnNlZFR5cGUuc2V0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBEYXRlICE9PSBcInVuZGVmaW5lZFwiICYmIGRhdGEgaW5zdGFuY2VvZiBEYXRlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFpvZFBhcnNlZFR5cGUuZGF0ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBab2RQYXJzZWRUeXBlLm9iamVjdDtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiBab2RQYXJzZWRUeXBlLnVua25vd247XG4gICAgfVxufTtcbiIsICJpbXBvcnQgeyB1dGlsIH0gZnJvbSBcIi4vaGVscGVycy91dGlsLmpzXCI7XG5leHBvcnQgY29uc3QgWm9kSXNzdWVDb2RlID0gdXRpbC5hcnJheVRvRW51bShbXG4gICAgXCJpbnZhbGlkX3R5cGVcIixcbiAgICBcImludmFsaWRfbGl0ZXJhbFwiLFxuICAgIFwiY3VzdG9tXCIsXG4gICAgXCJpbnZhbGlkX3VuaW9uXCIsXG4gICAgXCJpbnZhbGlkX3VuaW9uX2Rpc2NyaW1pbmF0b3JcIixcbiAgICBcImludmFsaWRfZW51bV92YWx1ZVwiLFxuICAgIFwidW5yZWNvZ25pemVkX2tleXNcIixcbiAgICBcImludmFsaWRfYXJndW1lbnRzXCIsXG4gICAgXCJpbnZhbGlkX3JldHVybl90eXBlXCIsXG4gICAgXCJpbnZhbGlkX2RhdGVcIixcbiAgICBcImludmFsaWRfc3RyaW5nXCIsXG4gICAgXCJ0b29fc21hbGxcIixcbiAgICBcInRvb19iaWdcIixcbiAgICBcImludmFsaWRfaW50ZXJzZWN0aW9uX3R5cGVzXCIsXG4gICAgXCJub3RfbXVsdGlwbGVfb2ZcIixcbiAgICBcIm5vdF9maW5pdGVcIixcbl0pO1xuZXhwb3J0IGNvbnN0IHF1b3RlbGVzc0pzb24gPSAob2JqKSA9PiB7XG4gICAgY29uc3QganNvbiA9IEpTT04uc3RyaW5naWZ5KG9iaiwgbnVsbCwgMik7XG4gICAgcmV0dXJuIGpzb24ucmVwbGFjZSgvXCIoW15cIl0rKVwiOi9nLCBcIiQxOlwiKTtcbn07XG5leHBvcnQgY2xhc3MgWm9kRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gICAgZ2V0IGVycm9ycygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNzdWVzO1xuICAgIH1cbiAgICBjb25zdHJ1Y3Rvcihpc3N1ZXMpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5pc3N1ZXMgPSBbXTtcbiAgICAgICAgdGhpcy5hZGRJc3N1ZSA9IChzdWIpID0+IHtcbiAgICAgICAgICAgIHRoaXMuaXNzdWVzID0gWy4uLnRoaXMuaXNzdWVzLCBzdWJdO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLmFkZElzc3VlcyA9IChzdWJzID0gW10pID0+IHtcbiAgICAgICAgICAgIHRoaXMuaXNzdWVzID0gWy4uLnRoaXMuaXNzdWVzLCAuLi5zdWJzXTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgYWN0dWFsUHJvdG8gPSBuZXcudGFyZ2V0LnByb3RvdHlwZTtcbiAgICAgICAgaWYgKE9iamVjdC5zZXRQcm90b3R5cGVPZikge1xuICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGJhbi9iYW5cbiAgICAgICAgICAgIE9iamVjdC5zZXRQcm90b3R5cGVPZih0aGlzLCBhY3R1YWxQcm90byk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9fcHJvdG9fXyA9IGFjdHVhbFByb3RvO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubmFtZSA9IFwiWm9kRXJyb3JcIjtcbiAgICAgICAgdGhpcy5pc3N1ZXMgPSBpc3N1ZXM7XG4gICAgfVxuICAgIGZvcm1hdChfbWFwcGVyKSB7XG4gICAgICAgIGNvbnN0IG1hcHBlciA9IF9tYXBwZXIgfHxcbiAgICAgICAgICAgIGZ1bmN0aW9uIChpc3N1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpc3N1ZS5tZXNzYWdlO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgY29uc3QgZmllbGRFcnJvcnMgPSB7IF9lcnJvcnM6IFtdIH07XG4gICAgICAgIGNvbnN0IHByb2Nlc3NFcnJvciA9IChlcnJvcikgPT4ge1xuICAgICAgICAgICAgZm9yIChjb25zdCBpc3N1ZSBvZiBlcnJvci5pc3N1ZXMpIHtcbiAgICAgICAgICAgICAgICBpZiAoaXNzdWUuY29kZSA9PT0gXCJpbnZhbGlkX3VuaW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgaXNzdWUudW5pb25FcnJvcnMubWFwKHByb2Nlc3NFcnJvcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGlzc3VlLmNvZGUgPT09IFwiaW52YWxpZF9yZXR1cm5fdHlwZVwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHByb2Nlc3NFcnJvcihpc3N1ZS5yZXR1cm5UeXBlRXJyb3IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChpc3N1ZS5jb2RlID09PSBcImludmFsaWRfYXJndW1lbnRzXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvY2Vzc0Vycm9yKGlzc3VlLmFyZ3VtZW50c0Vycm9yKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoaXNzdWUucGF0aC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgZmllbGRFcnJvcnMuX2Vycm9ycy5wdXNoKG1hcHBlcihpc3N1ZSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGN1cnIgPSBmaWVsZEVycm9ycztcbiAgICAgICAgICAgICAgICAgICAgbGV0IGkgPSAwO1xuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoaSA8IGlzc3VlLnBhdGgubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBlbCA9IGlzc3VlLnBhdGhbaV07XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0ZXJtaW5hbCA9IGkgPT09IGlzc3VlLnBhdGgubGVuZ3RoIC0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdGVybWluYWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyW2VsXSA9IGN1cnJbZWxdIHx8IHsgX2Vycm9yczogW10gfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpZiAodHlwZW9mIGVsID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICBjdXJyW2VsXSA9IGN1cnJbZWxdIHx8IHsgX2Vycm9yczogW10gfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB9IGVsc2UgaWYgKHR5cGVvZiBlbCA9PT0gXCJudW1iZXJcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgY29uc3QgZXJyb3JBcnJheTogYW55ID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICBlcnJvckFycmF5Ll9lcnJvcnMgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgIGN1cnJbZWxdID0gY3VycltlbF0gfHwgZXJyb3JBcnJheTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyW2VsXSA9IGN1cnJbZWxdIHx8IHsgX2Vycm9yczogW10gfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyW2VsXS5fZXJyb3JzLnB1c2gobWFwcGVyKGlzc3VlKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyID0gY3VycltlbF07XG4gICAgICAgICAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHByb2Nlc3NFcnJvcih0aGlzKTtcbiAgICAgICAgcmV0dXJuIGZpZWxkRXJyb3JzO1xuICAgIH1cbiAgICBzdGF0aWMgYXNzZXJ0KHZhbHVlKSB7XG4gICAgICAgIGlmICghKHZhbHVlIGluc3RhbmNlb2YgWm9kRXJyb3IpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE5vdCBhIFpvZEVycm9yOiAke3ZhbHVlfWApO1xuICAgICAgICB9XG4gICAgfVxuICAgIHRvU3RyaW5nKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5tZXNzYWdlO1xuICAgIH1cbiAgICBnZXQgbWVzc2FnZSgpIHtcbiAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHRoaXMuaXNzdWVzLCB1dGlsLmpzb25TdHJpbmdpZnlSZXBsYWNlciwgMik7XG4gICAgfVxuICAgIGdldCBpc0VtcHR5KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pc3N1ZXMubGVuZ3RoID09PSAwO1xuICAgIH1cbiAgICBmbGF0dGVuKG1hcHBlciA9IChpc3N1ZSkgPT4gaXNzdWUubWVzc2FnZSkge1xuICAgICAgICBjb25zdCBmaWVsZEVycm9ycyA9IHt9O1xuICAgICAgICBjb25zdCBmb3JtRXJyb3JzID0gW107XG4gICAgICAgIGZvciAoY29uc3Qgc3ViIG9mIHRoaXMuaXNzdWVzKSB7XG4gICAgICAgICAgICBpZiAoc3ViLnBhdGgubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpcnN0RWwgPSBzdWIucGF0aFswXTtcbiAgICAgICAgICAgICAgICBmaWVsZEVycm9yc1tmaXJzdEVsXSA9IGZpZWxkRXJyb3JzW2ZpcnN0RWxdIHx8IFtdO1xuICAgICAgICAgICAgICAgIGZpZWxkRXJyb3JzW2ZpcnN0RWxdLnB1c2gobWFwcGVyKHN1YikpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZm9ybUVycm9ycy5wdXNoKG1hcHBlcihzdWIpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4geyBmb3JtRXJyb3JzLCBmaWVsZEVycm9ycyB9O1xuICAgIH1cbiAgICBnZXQgZm9ybUVycm9ycygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZmxhdHRlbigpO1xuICAgIH1cbn1cblpvZEVycm9yLmNyZWF0ZSA9IChpc3N1ZXMpID0+IHtcbiAgICBjb25zdCBlcnJvciA9IG5ldyBab2RFcnJvcihpc3N1ZXMpO1xuICAgIHJldHVybiBlcnJvcjtcbn07XG4iLCAiaW1wb3J0IHsgWm9kSXNzdWVDb2RlIH0gZnJvbSBcIi4uL1pvZEVycm9yLmpzXCI7XG5pbXBvcnQgeyB1dGlsLCBab2RQYXJzZWRUeXBlIH0gZnJvbSBcIi4uL2hlbHBlcnMvdXRpbC5qc1wiO1xuY29uc3QgZXJyb3JNYXAgPSAoaXNzdWUsIF9jdHgpID0+IHtcbiAgICBsZXQgbWVzc2FnZTtcbiAgICBzd2l0Y2ggKGlzc3VlLmNvZGUpIHtcbiAgICAgICAgY2FzZSBab2RJc3N1ZUNvZGUuaW52YWxpZF90eXBlOlxuICAgICAgICAgICAgaWYgKGlzc3VlLnJlY2VpdmVkID09PSBab2RQYXJzZWRUeXBlLnVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSBcIlJlcXVpcmVkXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlID0gYEV4cGVjdGVkICR7aXNzdWUuZXhwZWN0ZWR9LCByZWNlaXZlZCAke2lzc3VlLnJlY2VpdmVkfWA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBab2RJc3N1ZUNvZGUuaW52YWxpZF9saXRlcmFsOlxuICAgICAgICAgICAgbWVzc2FnZSA9IGBJbnZhbGlkIGxpdGVyYWwgdmFsdWUsIGV4cGVjdGVkICR7SlNPTi5zdHJpbmdpZnkoaXNzdWUuZXhwZWN0ZWQsIHV0aWwuanNvblN0cmluZ2lmeVJlcGxhY2VyKX1gO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgWm9kSXNzdWVDb2RlLnVucmVjb2duaXplZF9rZXlzOlxuICAgICAgICAgICAgbWVzc2FnZSA9IGBVbnJlY29nbml6ZWQga2V5KHMpIGluIG9iamVjdDogJHt1dGlsLmpvaW5WYWx1ZXMoaXNzdWUua2V5cywgXCIsIFwiKX1gO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgWm9kSXNzdWVDb2RlLmludmFsaWRfdW5pb246XG4gICAgICAgICAgICBtZXNzYWdlID0gYEludmFsaWQgaW5wdXRgO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgWm9kSXNzdWVDb2RlLmludmFsaWRfdW5pb25fZGlzY3JpbWluYXRvcjpcbiAgICAgICAgICAgIG1lc3NhZ2UgPSBgSW52YWxpZCBkaXNjcmltaW5hdG9yIHZhbHVlLiBFeHBlY3RlZCAke3V0aWwuam9pblZhbHVlcyhpc3N1ZS5vcHRpb25zKX1gO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgWm9kSXNzdWVDb2RlLmludmFsaWRfZW51bV92YWx1ZTpcbiAgICAgICAgICAgIG1lc3NhZ2UgPSBgSW52YWxpZCBlbnVtIHZhbHVlLiBFeHBlY3RlZCAke3V0aWwuam9pblZhbHVlcyhpc3N1ZS5vcHRpb25zKX0sIHJlY2VpdmVkICcke2lzc3VlLnJlY2VpdmVkfSdgO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgWm9kSXNzdWVDb2RlLmludmFsaWRfYXJndW1lbnRzOlxuICAgICAgICAgICAgbWVzc2FnZSA9IGBJbnZhbGlkIGZ1bmN0aW9uIGFyZ3VtZW50c2A7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBab2RJc3N1ZUNvZGUuaW52YWxpZF9yZXR1cm5fdHlwZTpcbiAgICAgICAgICAgIG1lc3NhZ2UgPSBgSW52YWxpZCBmdW5jdGlvbiByZXR1cm4gdHlwZWA7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBab2RJc3N1ZUNvZGUuaW52YWxpZF9kYXRlOlxuICAgICAgICAgICAgbWVzc2FnZSA9IGBJbnZhbGlkIGRhdGVgO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgWm9kSXNzdWVDb2RlLmludmFsaWRfc3RyaW5nOlxuICAgICAgICAgICAgaWYgKHR5cGVvZiBpc3N1ZS52YWxpZGF0aW9uID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgICAgICAgaWYgKFwiaW5jbHVkZXNcIiBpbiBpc3N1ZS52YWxpZGF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSBgSW52YWxpZCBpbnB1dDogbXVzdCBpbmNsdWRlIFwiJHtpc3N1ZS52YWxpZGF0aW9uLmluY2x1ZGVzfVwiYDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBpc3N1ZS52YWxpZGF0aW9uLnBvc2l0aW9uID09PSBcIm51bWJlclwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlID0gYCR7bWVzc2FnZX0gYXQgb25lIG9yIG1vcmUgcG9zaXRpb25zIGdyZWF0ZXIgdGhhbiBvciBlcXVhbCB0byAke2lzc3VlLnZhbGlkYXRpb24ucG9zaXRpb259YDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChcInN0YXJ0c1dpdGhcIiBpbiBpc3N1ZS52YWxpZGF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSBgSW52YWxpZCBpbnB1dDogbXVzdCBzdGFydCB3aXRoIFwiJHtpc3N1ZS52YWxpZGF0aW9uLnN0YXJ0c1dpdGh9XCJgO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChcImVuZHNXaXRoXCIgaW4gaXNzdWUudmFsaWRhdGlvbikge1xuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlID0gYEludmFsaWQgaW5wdXQ6IG11c3QgZW5kIHdpdGggXCIke2lzc3VlLnZhbGlkYXRpb24uZW5kc1dpdGh9XCJgO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdXRpbC5hc3NlcnROZXZlcihpc3N1ZS52YWxpZGF0aW9uKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChpc3N1ZS52YWxpZGF0aW9uICE9PSBcInJlZ2V4XCIpIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlID0gYEludmFsaWQgJHtpc3N1ZS52YWxpZGF0aW9ufWA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlID0gXCJJbnZhbGlkXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBab2RJc3N1ZUNvZGUudG9vX3NtYWxsOlxuICAgICAgICAgICAgaWYgKGlzc3VlLnR5cGUgPT09IFwiYXJyYXlcIilcbiAgICAgICAgICAgICAgICBtZXNzYWdlID0gYEFycmF5IG11c3QgY29udGFpbiAke2lzc3VlLmV4YWN0ID8gXCJleGFjdGx5XCIgOiBpc3N1ZS5pbmNsdXNpdmUgPyBgYXQgbGVhc3RgIDogYG1vcmUgdGhhbmB9ICR7aXNzdWUubWluaW11bX0gZWxlbWVudChzKWA7XG4gICAgICAgICAgICBlbHNlIGlmIChpc3N1ZS50eXBlID09PSBcInN0cmluZ1wiKVxuICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSBgU3RyaW5nIG11c3QgY29udGFpbiAke2lzc3VlLmV4YWN0ID8gXCJleGFjdGx5XCIgOiBpc3N1ZS5pbmNsdXNpdmUgPyBgYXQgbGVhc3RgIDogYG92ZXJgfSAke2lzc3VlLm1pbmltdW19IGNoYXJhY3RlcihzKWA7XG4gICAgICAgICAgICBlbHNlIGlmIChpc3N1ZS50eXBlID09PSBcIm51bWJlclwiKVxuICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSBgTnVtYmVyIG11c3QgYmUgJHtpc3N1ZS5leGFjdCA/IGBleGFjdGx5IGVxdWFsIHRvIGAgOiBpc3N1ZS5pbmNsdXNpdmUgPyBgZ3JlYXRlciB0aGFuIG9yIGVxdWFsIHRvIGAgOiBgZ3JlYXRlciB0aGFuIGB9JHtpc3N1ZS5taW5pbXVtfWA7XG4gICAgICAgICAgICBlbHNlIGlmIChpc3N1ZS50eXBlID09PSBcImJpZ2ludFwiKVxuICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSBgTnVtYmVyIG11c3QgYmUgJHtpc3N1ZS5leGFjdCA/IGBleGFjdGx5IGVxdWFsIHRvIGAgOiBpc3N1ZS5pbmNsdXNpdmUgPyBgZ3JlYXRlciB0aGFuIG9yIGVxdWFsIHRvIGAgOiBgZ3JlYXRlciB0aGFuIGB9JHtpc3N1ZS5taW5pbXVtfWA7XG4gICAgICAgICAgICBlbHNlIGlmIChpc3N1ZS50eXBlID09PSBcImRhdGVcIilcbiAgICAgICAgICAgICAgICBtZXNzYWdlID0gYERhdGUgbXVzdCBiZSAke2lzc3VlLmV4YWN0ID8gYGV4YWN0bHkgZXF1YWwgdG8gYCA6IGlzc3VlLmluY2x1c2l2ZSA/IGBncmVhdGVyIHRoYW4gb3IgZXF1YWwgdG8gYCA6IGBncmVhdGVyIHRoYW4gYH0ke25ldyBEYXRlKE51bWJlcihpc3N1ZS5taW5pbXVtKSl9YDtcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBtZXNzYWdlID0gXCJJbnZhbGlkIGlucHV0XCI7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBab2RJc3N1ZUNvZGUudG9vX2JpZzpcbiAgICAgICAgICAgIGlmIChpc3N1ZS50eXBlID09PSBcImFycmF5XCIpXG4gICAgICAgICAgICAgICAgbWVzc2FnZSA9IGBBcnJheSBtdXN0IGNvbnRhaW4gJHtpc3N1ZS5leGFjdCA/IGBleGFjdGx5YCA6IGlzc3VlLmluY2x1c2l2ZSA/IGBhdCBtb3N0YCA6IGBsZXNzIHRoYW5gfSAke2lzc3VlLm1heGltdW19IGVsZW1lbnQocylgO1xuICAgICAgICAgICAgZWxzZSBpZiAoaXNzdWUudHlwZSA9PT0gXCJzdHJpbmdcIilcbiAgICAgICAgICAgICAgICBtZXNzYWdlID0gYFN0cmluZyBtdXN0IGNvbnRhaW4gJHtpc3N1ZS5leGFjdCA/IGBleGFjdGx5YCA6IGlzc3VlLmluY2x1c2l2ZSA/IGBhdCBtb3N0YCA6IGB1bmRlcmB9ICR7aXNzdWUubWF4aW11bX0gY2hhcmFjdGVyKHMpYDtcbiAgICAgICAgICAgIGVsc2UgaWYgKGlzc3VlLnR5cGUgPT09IFwibnVtYmVyXCIpXG4gICAgICAgICAgICAgICAgbWVzc2FnZSA9IGBOdW1iZXIgbXVzdCBiZSAke2lzc3VlLmV4YWN0ID8gYGV4YWN0bHlgIDogaXNzdWUuaW5jbHVzaXZlID8gYGxlc3MgdGhhbiBvciBlcXVhbCB0b2AgOiBgbGVzcyB0aGFuYH0gJHtpc3N1ZS5tYXhpbXVtfWA7XG4gICAgICAgICAgICBlbHNlIGlmIChpc3N1ZS50eXBlID09PSBcImJpZ2ludFwiKVxuICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSBgQmlnSW50IG11c3QgYmUgJHtpc3N1ZS5leGFjdCA/IGBleGFjdGx5YCA6IGlzc3VlLmluY2x1c2l2ZSA/IGBsZXNzIHRoYW4gb3IgZXF1YWwgdG9gIDogYGxlc3MgdGhhbmB9ICR7aXNzdWUubWF4aW11bX1gO1xuICAgICAgICAgICAgZWxzZSBpZiAoaXNzdWUudHlwZSA9PT0gXCJkYXRlXCIpXG4gICAgICAgICAgICAgICAgbWVzc2FnZSA9IGBEYXRlIG11c3QgYmUgJHtpc3N1ZS5leGFjdCA/IGBleGFjdGx5YCA6IGlzc3VlLmluY2x1c2l2ZSA/IGBzbWFsbGVyIHRoYW4gb3IgZXF1YWwgdG9gIDogYHNtYWxsZXIgdGhhbmB9ICR7bmV3IERhdGUoTnVtYmVyKGlzc3VlLm1heGltdW0pKX1gO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSBcIkludmFsaWQgaW5wdXRcIjtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFpvZElzc3VlQ29kZS5jdXN0b206XG4gICAgICAgICAgICBtZXNzYWdlID0gYEludmFsaWQgaW5wdXRgO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgWm9kSXNzdWVDb2RlLmludmFsaWRfaW50ZXJzZWN0aW9uX3R5cGVzOlxuICAgICAgICAgICAgbWVzc2FnZSA9IGBJbnRlcnNlY3Rpb24gcmVzdWx0cyBjb3VsZCBub3QgYmUgbWVyZ2VkYDtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFpvZElzc3VlQ29kZS5ub3RfbXVsdGlwbGVfb2Y6XG4gICAgICAgICAgICBtZXNzYWdlID0gYE51bWJlciBtdXN0IGJlIGEgbXVsdGlwbGUgb2YgJHtpc3N1ZS5tdWx0aXBsZU9mfWA7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBab2RJc3N1ZUNvZGUubm90X2Zpbml0ZTpcbiAgICAgICAgICAgIG1lc3NhZ2UgPSBcIk51bWJlciBtdXN0IGJlIGZpbml0ZVwiO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBtZXNzYWdlID0gX2N0eC5kZWZhdWx0RXJyb3I7XG4gICAgICAgICAgICB1dGlsLmFzc2VydE5ldmVyKGlzc3VlKTtcbiAgICB9XG4gICAgcmV0dXJuIHsgbWVzc2FnZSB9O1xufTtcbmV4cG9ydCBkZWZhdWx0IGVycm9yTWFwO1xuIiwgImltcG9ydCBkZWZhdWx0RXJyb3JNYXAgZnJvbSBcIi4vbG9jYWxlcy9lbi5qc1wiO1xubGV0IG92ZXJyaWRlRXJyb3JNYXAgPSBkZWZhdWx0RXJyb3JNYXA7XG5leHBvcnQgeyBkZWZhdWx0RXJyb3JNYXAgfTtcbmV4cG9ydCBmdW5jdGlvbiBzZXRFcnJvck1hcChtYXApIHtcbiAgICBvdmVycmlkZUVycm9yTWFwID0gbWFwO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGdldEVycm9yTWFwKCkge1xuICAgIHJldHVybiBvdmVycmlkZUVycm9yTWFwO1xufVxuIiwgImltcG9ydCB7IGdldEVycm9yTWFwIH0gZnJvbSBcIi4uL2Vycm9ycy5qc1wiO1xuaW1wb3J0IGRlZmF1bHRFcnJvck1hcCBmcm9tIFwiLi4vbG9jYWxlcy9lbi5qc1wiO1xuZXhwb3J0IGNvbnN0IG1ha2VJc3N1ZSA9IChwYXJhbXMpID0+IHtcbiAgICBjb25zdCB7IGRhdGEsIHBhdGgsIGVycm9yTWFwcywgaXNzdWVEYXRhIH0gPSBwYXJhbXM7XG4gICAgY29uc3QgZnVsbFBhdGggPSBbLi4ucGF0aCwgLi4uKGlzc3VlRGF0YS5wYXRoIHx8IFtdKV07XG4gICAgY29uc3QgZnVsbElzc3VlID0ge1xuICAgICAgICAuLi5pc3N1ZURhdGEsXG4gICAgICAgIHBhdGg6IGZ1bGxQYXRoLFxuICAgIH07XG4gICAgaWYgKGlzc3VlRGF0YS5tZXNzYWdlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC4uLmlzc3VlRGF0YSxcbiAgICAgICAgICAgIHBhdGg6IGZ1bGxQYXRoLFxuICAgICAgICAgICAgbWVzc2FnZTogaXNzdWVEYXRhLm1lc3NhZ2UsXG4gICAgICAgIH07XG4gICAgfVxuICAgIGxldCBlcnJvck1lc3NhZ2UgPSBcIlwiO1xuICAgIGNvbnN0IG1hcHMgPSBlcnJvck1hcHNcbiAgICAgICAgLmZpbHRlcigobSkgPT4gISFtKVxuICAgICAgICAuc2xpY2UoKVxuICAgICAgICAucmV2ZXJzZSgpO1xuICAgIGZvciAoY29uc3QgbWFwIG9mIG1hcHMpIHtcbiAgICAgICAgZXJyb3JNZXNzYWdlID0gbWFwKGZ1bGxJc3N1ZSwgeyBkYXRhLCBkZWZhdWx0RXJyb3I6IGVycm9yTWVzc2FnZSB9KS5tZXNzYWdlO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICAuLi5pc3N1ZURhdGEsXG4gICAgICAgIHBhdGg6IGZ1bGxQYXRoLFxuICAgICAgICBtZXNzYWdlOiBlcnJvck1lc3NhZ2UsXG4gICAgfTtcbn07XG5leHBvcnQgY29uc3QgRU1QVFlfUEFUSCA9IFtdO1xuZXhwb3J0IGZ1bmN0aW9uIGFkZElzc3VlVG9Db250ZXh0KGN0eCwgaXNzdWVEYXRhKSB7XG4gICAgY29uc3Qgb3ZlcnJpZGVNYXAgPSBnZXRFcnJvck1hcCgpO1xuICAgIGNvbnN0IGlzc3VlID0gbWFrZUlzc3VlKHtcbiAgICAgICAgaXNzdWVEYXRhOiBpc3N1ZURhdGEsXG4gICAgICAgIGRhdGE6IGN0eC5kYXRhLFxuICAgICAgICBwYXRoOiBjdHgucGF0aCxcbiAgICAgICAgZXJyb3JNYXBzOiBbXG4gICAgICAgICAgICBjdHguY29tbW9uLmNvbnRleHR1YWxFcnJvck1hcCwgLy8gY29udGV4dHVhbCBlcnJvciBtYXAgaXMgZmlyc3QgcHJpb3JpdHlcbiAgICAgICAgICAgIGN0eC5zY2hlbWFFcnJvck1hcCwgLy8gdGhlbiBzY2hlbWEtYm91bmQgbWFwIGlmIGF2YWlsYWJsZVxuICAgICAgICAgICAgb3ZlcnJpZGVNYXAsIC8vIHRoZW4gZ2xvYmFsIG92ZXJyaWRlIG1hcFxuICAgICAgICAgICAgb3ZlcnJpZGVNYXAgPT09IGRlZmF1bHRFcnJvck1hcCA/IHVuZGVmaW5lZCA6IGRlZmF1bHRFcnJvck1hcCwgLy8gdGhlbiBnbG9iYWwgZGVmYXVsdCBtYXBcbiAgICAgICAgXS5maWx0ZXIoKHgpID0+ICEheCksXG4gICAgfSk7XG4gICAgY3R4LmNvbW1vbi5pc3N1ZXMucHVzaChpc3N1ZSk7XG59XG5leHBvcnQgY2xhc3MgUGFyc2VTdGF0dXMge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnZhbHVlID0gXCJ2YWxpZFwiO1xuICAgIH1cbiAgICBkaXJ0eSgpIHtcbiAgICAgICAgaWYgKHRoaXMudmFsdWUgPT09IFwidmFsaWRcIilcbiAgICAgICAgICAgIHRoaXMudmFsdWUgPSBcImRpcnR5XCI7XG4gICAgfVxuICAgIGFib3J0KCkge1xuICAgICAgICBpZiAodGhpcy52YWx1ZSAhPT0gXCJhYm9ydGVkXCIpXG4gICAgICAgICAgICB0aGlzLnZhbHVlID0gXCJhYm9ydGVkXCI7XG4gICAgfVxuICAgIHN0YXRpYyBtZXJnZUFycmF5KHN0YXR1cywgcmVzdWx0cykge1xuICAgICAgICBjb25zdCBhcnJheVZhbHVlID0gW107XG4gICAgICAgIGZvciAoY29uc3QgcyBvZiByZXN1bHRzKSB7XG4gICAgICAgICAgICBpZiAocy5zdGF0dXMgPT09IFwiYWJvcnRlZFwiKVxuICAgICAgICAgICAgICAgIHJldHVybiBJTlZBTElEO1xuICAgICAgICAgICAgaWYgKHMuc3RhdHVzID09PSBcImRpcnR5XCIpXG4gICAgICAgICAgICAgICAgc3RhdHVzLmRpcnR5KCk7XG4gICAgICAgICAgICBhcnJheVZhbHVlLnB1c2gocy52YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHsgc3RhdHVzOiBzdGF0dXMudmFsdWUsIHZhbHVlOiBhcnJheVZhbHVlIH07XG4gICAgfVxuICAgIHN0YXRpYyBhc3luYyBtZXJnZU9iamVjdEFzeW5jKHN0YXR1cywgcGFpcnMpIHtcbiAgICAgICAgY29uc3Qgc3luY1BhaXJzID0gW107XG4gICAgICAgIGZvciAoY29uc3QgcGFpciBvZiBwYWlycykge1xuICAgICAgICAgICAgY29uc3Qga2V5ID0gYXdhaXQgcGFpci5rZXk7XG4gICAgICAgICAgICBjb25zdCB2YWx1ZSA9IGF3YWl0IHBhaXIudmFsdWU7XG4gICAgICAgICAgICBzeW5jUGFpcnMucHVzaCh7XG4gICAgICAgICAgICAgICAga2V5LFxuICAgICAgICAgICAgICAgIHZhbHVlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFBhcnNlU3RhdHVzLm1lcmdlT2JqZWN0U3luYyhzdGF0dXMsIHN5bmNQYWlycyk7XG4gICAgfVxuICAgIHN0YXRpYyBtZXJnZU9iamVjdFN5bmMoc3RhdHVzLCBwYWlycykge1xuICAgICAgICBjb25zdCBmaW5hbE9iamVjdCA9IHt9O1xuICAgICAgICBmb3IgKGNvbnN0IHBhaXIgb2YgcGFpcnMpIHtcbiAgICAgICAgICAgIGNvbnN0IHsga2V5LCB2YWx1ZSB9ID0gcGFpcjtcbiAgICAgICAgICAgIGlmIChrZXkuc3RhdHVzID09PSBcImFib3J0ZWRcIilcbiAgICAgICAgICAgICAgICByZXR1cm4gSU5WQUxJRDtcbiAgICAgICAgICAgIGlmICh2YWx1ZS5zdGF0dXMgPT09IFwiYWJvcnRlZFwiKVxuICAgICAgICAgICAgICAgIHJldHVybiBJTlZBTElEO1xuICAgICAgICAgICAgaWYgKGtleS5zdGF0dXMgPT09IFwiZGlydHlcIilcbiAgICAgICAgICAgICAgICBzdGF0dXMuZGlydHkoKTtcbiAgICAgICAgICAgIGlmICh2YWx1ZS5zdGF0dXMgPT09IFwiZGlydHlcIilcbiAgICAgICAgICAgICAgICBzdGF0dXMuZGlydHkoKTtcbiAgICAgICAgICAgIGlmIChrZXkudmFsdWUgIT09IFwiX19wcm90b19fXCIgJiYgKHR5cGVvZiB2YWx1ZS52YWx1ZSAhPT0gXCJ1bmRlZmluZWRcIiB8fCBwYWlyLmFsd2F5c1NldCkpIHtcbiAgICAgICAgICAgICAgICBmaW5hbE9iamVjdFtrZXkudmFsdWVdID0gdmFsdWUudmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHsgc3RhdHVzOiBzdGF0dXMudmFsdWUsIHZhbHVlOiBmaW5hbE9iamVjdCB9O1xuICAgIH1cbn1cbmV4cG9ydCBjb25zdCBJTlZBTElEID0gT2JqZWN0LmZyZWV6ZSh7XG4gICAgc3RhdHVzOiBcImFib3J0ZWRcIixcbn0pO1xuZXhwb3J0IGNvbnN0IERJUlRZID0gKHZhbHVlKSA9PiAoeyBzdGF0dXM6IFwiZGlydHlcIiwgdmFsdWUgfSk7XG5leHBvcnQgY29uc3QgT0sgPSAodmFsdWUpID0+ICh7IHN0YXR1czogXCJ2YWxpZFwiLCB2YWx1ZSB9KTtcbmV4cG9ydCBjb25zdCBpc0Fib3J0ZWQgPSAoeCkgPT4geC5zdGF0dXMgPT09IFwiYWJvcnRlZFwiO1xuZXhwb3J0IGNvbnN0IGlzRGlydHkgPSAoeCkgPT4geC5zdGF0dXMgPT09IFwiZGlydHlcIjtcbmV4cG9ydCBjb25zdCBpc1ZhbGlkID0gKHgpID0+IHguc3RhdHVzID09PSBcInZhbGlkXCI7XG5leHBvcnQgY29uc3QgaXNBc3luYyA9ICh4KSA9PiB0eXBlb2YgUHJvbWlzZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiB4IGluc3RhbmNlb2YgUHJvbWlzZTtcbiIsICJleHBvcnQgdmFyIGVycm9yVXRpbDtcbihmdW5jdGlvbiAoZXJyb3JVdGlsKSB7XG4gICAgZXJyb3JVdGlsLmVyclRvT2JqID0gKG1lc3NhZ2UpID0+IHR5cGVvZiBtZXNzYWdlID09PSBcInN0cmluZ1wiID8geyBtZXNzYWdlIH0gOiBtZXNzYWdlIHx8IHt9O1xuICAgIC8vIGJpb21lLWlnbm9yZSBsaW50OlxuICAgIGVycm9yVXRpbC50b1N0cmluZyA9IChtZXNzYWdlKSA9PiB0eXBlb2YgbWVzc2FnZSA9PT0gXCJzdHJpbmdcIiA/IG1lc3NhZ2UgOiBtZXNzYWdlPy5tZXNzYWdlO1xufSkoZXJyb3JVdGlsIHx8IChlcnJvclV0aWwgPSB7fSkpO1xuIiwgImltcG9ydCB7IFpvZEVycm9yLCBab2RJc3N1ZUNvZGUsIH0gZnJvbSBcIi4vWm9kRXJyb3IuanNcIjtcbmltcG9ydCB7IGRlZmF1bHRFcnJvck1hcCwgZ2V0RXJyb3JNYXAgfSBmcm9tIFwiLi9lcnJvcnMuanNcIjtcbmltcG9ydCB7IGVycm9yVXRpbCB9IGZyb20gXCIuL2hlbHBlcnMvZXJyb3JVdGlsLmpzXCI7XG5pbXBvcnQgeyBESVJUWSwgSU5WQUxJRCwgT0ssIFBhcnNlU3RhdHVzLCBhZGRJc3N1ZVRvQ29udGV4dCwgaXNBYm9ydGVkLCBpc0FzeW5jLCBpc0RpcnR5LCBpc1ZhbGlkLCBtYWtlSXNzdWUsIH0gZnJvbSBcIi4vaGVscGVycy9wYXJzZVV0aWwuanNcIjtcbmltcG9ydCB7IHV0aWwsIFpvZFBhcnNlZFR5cGUsIGdldFBhcnNlZFR5cGUgfSBmcm9tIFwiLi9oZWxwZXJzL3V0aWwuanNcIjtcbmNsYXNzIFBhcnNlSW5wdXRMYXp5UGF0aCB7XG4gICAgY29uc3RydWN0b3IocGFyZW50LCB2YWx1ZSwgcGF0aCwga2V5KSB7XG4gICAgICAgIHRoaXMuX2NhY2hlZFBhdGggPSBbXTtcbiAgICAgICAgdGhpcy5wYXJlbnQgPSBwYXJlbnQ7XG4gICAgICAgIHRoaXMuZGF0YSA9IHZhbHVlO1xuICAgICAgICB0aGlzLl9wYXRoID0gcGF0aDtcbiAgICAgICAgdGhpcy5fa2V5ID0ga2V5O1xuICAgIH1cbiAgICBnZXQgcGF0aCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9jYWNoZWRQYXRoLmxlbmd0aCkge1xuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodGhpcy5fa2V5KSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2NhY2hlZFBhdGgucHVzaCguLi50aGlzLl9wYXRoLCAuLi50aGlzLl9rZXkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fY2FjaGVkUGF0aC5wdXNoKC4uLnRoaXMuX3BhdGgsIHRoaXMuX2tleSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX2NhY2hlZFBhdGg7XG4gICAgfVxufVxuY29uc3QgaGFuZGxlUmVzdWx0ID0gKGN0eCwgcmVzdWx0KSA9PiB7XG4gICAgaWYgKGlzVmFsaWQocmVzdWx0KSkge1xuICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlLCBkYXRhOiByZXN1bHQudmFsdWUgfTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGlmICghY3R4LmNvbW1vbi5pc3N1ZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJWYWxpZGF0aW9uIGZhaWxlZCBidXQgbm8gaXNzdWVzIGRldGVjdGVkLlwiKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICBnZXQgZXJyb3IoKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2Vycm9yKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fZXJyb3I7XG4gICAgICAgICAgICAgICAgY29uc3QgZXJyb3IgPSBuZXcgWm9kRXJyb3IoY3R4LmNvbW1vbi5pc3N1ZXMpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2Vycm9yID0gZXJyb3I7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2Vycm9yO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfTtcbiAgICB9XG59O1xuZnVuY3Rpb24gcHJvY2Vzc0NyZWF0ZVBhcmFtcyhwYXJhbXMpIHtcbiAgICBpZiAoIXBhcmFtcylcbiAgICAgICAgcmV0dXJuIHt9O1xuICAgIGNvbnN0IHsgZXJyb3JNYXAsIGludmFsaWRfdHlwZV9lcnJvciwgcmVxdWlyZWRfZXJyb3IsIGRlc2NyaXB0aW9uIH0gPSBwYXJhbXM7XG4gICAgaWYgKGVycm9yTWFwICYmIChpbnZhbGlkX3R5cGVfZXJyb3IgfHwgcmVxdWlyZWRfZXJyb3IpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgQ2FuJ3QgdXNlIFwiaW52YWxpZF90eXBlX2Vycm9yXCIgb3IgXCJyZXF1aXJlZF9lcnJvclwiIGluIGNvbmp1bmN0aW9uIHdpdGggY3VzdG9tIGVycm9yIG1hcC5gKTtcbiAgICB9XG4gICAgaWYgKGVycm9yTWFwKVxuICAgICAgICByZXR1cm4geyBlcnJvck1hcDogZXJyb3JNYXAsIGRlc2NyaXB0aW9uIH07XG4gICAgY29uc3QgY3VzdG9tTWFwID0gKGlzcywgY3R4KSA9PiB7XG4gICAgICAgIGNvbnN0IHsgbWVzc2FnZSB9ID0gcGFyYW1zO1xuICAgICAgICBpZiAoaXNzLmNvZGUgPT09IFwiaW52YWxpZF9lbnVtX3ZhbHVlXCIpIHtcbiAgICAgICAgICAgIHJldHVybiB7IG1lc3NhZ2U6IG1lc3NhZ2UgPz8gY3R4LmRlZmF1bHRFcnJvciB9O1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgY3R4LmRhdGEgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgIHJldHVybiB7IG1lc3NhZ2U6IG1lc3NhZ2UgPz8gcmVxdWlyZWRfZXJyb3IgPz8gY3R4LmRlZmF1bHRFcnJvciB9O1xuICAgICAgICB9XG4gICAgICAgIGlmIChpc3MuY29kZSAhPT0gXCJpbnZhbGlkX3R5cGVcIilcbiAgICAgICAgICAgIHJldHVybiB7IG1lc3NhZ2U6IGN0eC5kZWZhdWx0RXJyb3IgfTtcbiAgICAgICAgcmV0dXJuIHsgbWVzc2FnZTogbWVzc2FnZSA/PyBpbnZhbGlkX3R5cGVfZXJyb3IgPz8gY3R4LmRlZmF1bHRFcnJvciB9O1xuICAgIH07XG4gICAgcmV0dXJuIHsgZXJyb3JNYXA6IGN1c3RvbU1hcCwgZGVzY3JpcHRpb24gfTtcbn1cbmV4cG9ydCBjbGFzcyBab2RUeXBlIHtcbiAgICBnZXQgZGVzY3JpcHRpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9kZWYuZGVzY3JpcHRpb247XG4gICAgfVxuICAgIF9nZXRUeXBlKGlucHV0KSB7XG4gICAgICAgIHJldHVybiBnZXRQYXJzZWRUeXBlKGlucHV0LmRhdGEpO1xuICAgIH1cbiAgICBfZ2V0T3JSZXR1cm5DdHgoaW5wdXQsIGN0eCkge1xuICAgICAgICByZXR1cm4gKGN0eCB8fCB7XG4gICAgICAgICAgICBjb21tb246IGlucHV0LnBhcmVudC5jb21tb24sXG4gICAgICAgICAgICBkYXRhOiBpbnB1dC5kYXRhLFxuICAgICAgICAgICAgcGFyc2VkVHlwZTogZ2V0UGFyc2VkVHlwZShpbnB1dC5kYXRhKSxcbiAgICAgICAgICAgIHNjaGVtYUVycm9yTWFwOiB0aGlzLl9kZWYuZXJyb3JNYXAsXG4gICAgICAgICAgICBwYXRoOiBpbnB1dC5wYXRoLFxuICAgICAgICAgICAgcGFyZW50OiBpbnB1dC5wYXJlbnQsXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBfcHJvY2Vzc0lucHV0UGFyYW1zKGlucHV0KSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdGF0dXM6IG5ldyBQYXJzZVN0YXR1cygpLFxuICAgICAgICAgICAgY3R4OiB7XG4gICAgICAgICAgICAgICAgY29tbW9uOiBpbnB1dC5wYXJlbnQuY29tbW9uLFxuICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0LmRhdGEsXG4gICAgICAgICAgICAgICAgcGFyc2VkVHlwZTogZ2V0UGFyc2VkVHlwZShpbnB1dC5kYXRhKSxcbiAgICAgICAgICAgICAgICBzY2hlbWFFcnJvck1hcDogdGhpcy5fZGVmLmVycm9yTWFwLFxuICAgICAgICAgICAgICAgIHBhdGg6IGlucHV0LnBhdGgsXG4gICAgICAgICAgICAgICAgcGFyZW50OiBpbnB1dC5wYXJlbnQsXG4gICAgICAgICAgICB9LFxuICAgICAgICB9O1xuICAgIH1cbiAgICBfcGFyc2VTeW5jKGlucHV0KSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuX3BhcnNlKGlucHV0KTtcbiAgICAgICAgaWYgKGlzQXN5bmMocmVzdWx0KSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU3luY2hyb25vdXMgcGFyc2UgZW5jb3VudGVyZWQgcHJvbWlzZS5cIik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gICAgX3BhcnNlQXN5bmMoaW5wdXQpIHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gdGhpcy5fcGFyc2UoaW5wdXQpO1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHJlc3VsdCk7XG4gICAgfVxuICAgIHBhcnNlKGRhdGEsIHBhcmFtcykge1xuICAgICAgICBjb25zdCByZXN1bHQgPSB0aGlzLnNhZmVQYXJzZShkYXRhLCBwYXJhbXMpO1xuICAgICAgICBpZiAocmVzdWx0LnN1Y2Nlc3MpXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0LmRhdGE7XG4gICAgICAgIHRocm93IHJlc3VsdC5lcnJvcjtcbiAgICB9XG4gICAgc2FmZVBhcnNlKGRhdGEsIHBhcmFtcykge1xuICAgICAgICBjb25zdCBjdHggPSB7XG4gICAgICAgICAgICBjb21tb246IHtcbiAgICAgICAgICAgICAgICBpc3N1ZXM6IFtdLFxuICAgICAgICAgICAgICAgIGFzeW5jOiBwYXJhbXM/LmFzeW5jID8/IGZhbHNlLFxuICAgICAgICAgICAgICAgIGNvbnRleHR1YWxFcnJvck1hcDogcGFyYW1zPy5lcnJvck1hcCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwYXRoOiBwYXJhbXM/LnBhdGggfHwgW10sXG4gICAgICAgICAgICBzY2hlbWFFcnJvck1hcDogdGhpcy5fZGVmLmVycm9yTWFwLFxuICAgICAgICAgICAgcGFyZW50OiBudWxsLFxuICAgICAgICAgICAgZGF0YSxcbiAgICAgICAgICAgIHBhcnNlZFR5cGU6IGdldFBhcnNlZFR5cGUoZGF0YSksXG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuX3BhcnNlU3luYyh7IGRhdGEsIHBhdGg6IGN0eC5wYXRoLCBwYXJlbnQ6IGN0eCB9KTtcbiAgICAgICAgcmV0dXJuIGhhbmRsZVJlc3VsdChjdHgsIHJlc3VsdCk7XG4gICAgfVxuICAgIFwifnZhbGlkYXRlXCIoZGF0YSkge1xuICAgICAgICBjb25zdCBjdHggPSB7XG4gICAgICAgICAgICBjb21tb246IHtcbiAgICAgICAgICAgICAgICBpc3N1ZXM6IFtdLFxuICAgICAgICAgICAgICAgIGFzeW5jOiAhIXRoaXNbXCJ+c3RhbmRhcmRcIl0uYXN5bmMsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcGF0aDogW10sXG4gICAgICAgICAgICBzY2hlbWFFcnJvck1hcDogdGhpcy5fZGVmLmVycm9yTWFwLFxuICAgICAgICAgICAgcGFyZW50OiBudWxsLFxuICAgICAgICAgICAgZGF0YSxcbiAgICAgICAgICAgIHBhcnNlZFR5cGU6IGdldFBhcnNlZFR5cGUoZGF0YSksXG4gICAgICAgIH07XG4gICAgICAgIGlmICghdGhpc1tcIn5zdGFuZGFyZFwiXS5hc3luYykge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSB0aGlzLl9wYXJzZVN5bmMoeyBkYXRhLCBwYXRoOiBbXSwgcGFyZW50OiBjdHggfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGlzVmFsaWQocmVzdWx0KVxuICAgICAgICAgICAgICAgICAgICA/IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiByZXN1bHQudmFsdWUsXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpc3N1ZXM6IGN0eC5jb21tb24uaXNzdWVzLFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIGlmIChlcnI/Lm1lc3NhZ2U/LnRvTG93ZXJDYXNlKCk/LmluY2x1ZGVzKFwiZW5jb3VudGVyZWRcIikpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpc1tcIn5zdGFuZGFyZFwiXS5hc3luYyA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGN0eC5jb21tb24gPSB7XG4gICAgICAgICAgICAgICAgICAgIGlzc3VlczogW10sXG4gICAgICAgICAgICAgICAgICAgIGFzeW5jOiB0cnVlLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX3BhcnNlQXN5bmMoeyBkYXRhLCBwYXRoOiBbXSwgcGFyZW50OiBjdHggfSkudGhlbigocmVzdWx0KSA9PiBpc1ZhbGlkKHJlc3VsdClcbiAgICAgICAgICAgID8ge1xuICAgICAgICAgICAgICAgIHZhbHVlOiByZXN1bHQudmFsdWUsXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICA6IHtcbiAgICAgICAgICAgICAgICBpc3N1ZXM6IGN0eC5jb21tb24uaXNzdWVzLFxuICAgICAgICAgICAgfSk7XG4gICAgfVxuICAgIGFzeW5jIHBhcnNlQXN5bmMoZGF0YSwgcGFyYW1zKSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuc2FmZVBhcnNlQXN5bmMoZGF0YSwgcGFyYW1zKTtcbiAgICAgICAgaWYgKHJlc3VsdC5zdWNjZXNzKVxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdC5kYXRhO1xuICAgICAgICB0aHJvdyByZXN1bHQuZXJyb3I7XG4gICAgfVxuICAgIGFzeW5jIHNhZmVQYXJzZUFzeW5jKGRhdGEsIHBhcmFtcykge1xuICAgICAgICBjb25zdCBjdHggPSB7XG4gICAgICAgICAgICBjb21tb246IHtcbiAgICAgICAgICAgICAgICBpc3N1ZXM6IFtdLFxuICAgICAgICAgICAgICAgIGNvbnRleHR1YWxFcnJvck1hcDogcGFyYW1zPy5lcnJvck1hcCxcbiAgICAgICAgICAgICAgICBhc3luYzogdHJ1ZSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwYXRoOiBwYXJhbXM/LnBhdGggfHwgW10sXG4gICAgICAgICAgICBzY2hlbWFFcnJvck1hcDogdGhpcy5fZGVmLmVycm9yTWFwLFxuICAgICAgICAgICAgcGFyZW50OiBudWxsLFxuICAgICAgICAgICAgZGF0YSxcbiAgICAgICAgICAgIHBhcnNlZFR5cGU6IGdldFBhcnNlZFR5cGUoZGF0YSksXG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IG1heWJlQXN5bmNSZXN1bHQgPSB0aGlzLl9wYXJzZSh7IGRhdGEsIHBhdGg6IGN0eC5wYXRoLCBwYXJlbnQ6IGN0eCB9KTtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgKGlzQXN5bmMobWF5YmVBc3luY1Jlc3VsdCkgPyBtYXliZUFzeW5jUmVzdWx0IDogUHJvbWlzZS5yZXNvbHZlKG1heWJlQXN5bmNSZXN1bHQpKTtcbiAgICAgICAgcmV0dXJuIGhhbmRsZVJlc3VsdChjdHgsIHJlc3VsdCk7XG4gICAgfVxuICAgIHJlZmluZShjaGVjaywgbWVzc2FnZSkge1xuICAgICAgICBjb25zdCBnZXRJc3N1ZVByb3BlcnRpZXMgPSAodmFsKSA9PiB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIG1lc3NhZ2UgPT09IFwic3RyaW5nXCIgfHwgdHlwZW9mIG1lc3NhZ2UgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geyBtZXNzYWdlIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICh0eXBlb2YgbWVzc2FnZSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1lc3NhZ2UodmFsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBtZXNzYWdlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gdGhpcy5fcmVmaW5lbWVudCgodmFsLCBjdHgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGNoZWNrKHZhbCk7XG4gICAgICAgICAgICBjb25zdCBzZXRFcnJvciA9ICgpID0+IGN0eC5hZGRJc3N1ZSh7XG4gICAgICAgICAgICAgICAgY29kZTogWm9kSXNzdWVDb2RlLmN1c3RvbSxcbiAgICAgICAgICAgICAgICAuLi5nZXRJc3N1ZVByb3BlcnRpZXModmFsKSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBQcm9taXNlICE9PSBcInVuZGVmaW5lZFwiICYmIHJlc3VsdCBpbnN0YW5jZW9mIFByb21pc2UpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0LnRoZW4oKGRhdGEpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRFcnJvcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghcmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgc2V0RXJyb3IoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJlZmluZW1lbnQoY2hlY2ssIHJlZmluZW1lbnREYXRhKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9yZWZpbmVtZW50KCh2YWwsIGN0eCkgPT4ge1xuICAgICAgICAgICAgaWYgKCFjaGVjayh2YWwpKSB7XG4gICAgICAgICAgICAgICAgY3R4LmFkZElzc3VlKHR5cGVvZiByZWZpbmVtZW50RGF0YSA9PT0gXCJmdW5jdGlvblwiID8gcmVmaW5lbWVudERhdGEodmFsLCBjdHgpIDogcmVmaW5lbWVudERhdGEpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgX3JlZmluZW1lbnQocmVmaW5lbWVudCkge1xuICAgICAgICByZXR1cm4gbmV3IFpvZEVmZmVjdHMoe1xuICAgICAgICAgICAgc2NoZW1hOiB0aGlzLFxuICAgICAgICAgICAgdHlwZU5hbWU6IFpvZEZpcnN0UGFydHlUeXBlS2luZC5ab2RFZmZlY3RzLFxuICAgICAgICAgICAgZWZmZWN0OiB7IHR5cGU6IFwicmVmaW5lbWVudFwiLCByZWZpbmVtZW50IH0sXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBzdXBlclJlZmluZShyZWZpbmVtZW50KSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9yZWZpbmVtZW50KHJlZmluZW1lbnQpO1xuICAgIH1cbiAgICBjb25zdHJ1Y3RvcihkZWYpIHtcbiAgICAgICAgLyoqIEFsaWFzIG9mIHNhZmVQYXJzZUFzeW5jICovXG4gICAgICAgIHRoaXMuc3BhID0gdGhpcy5zYWZlUGFyc2VBc3luYztcbiAgICAgICAgdGhpcy5fZGVmID0gZGVmO1xuICAgICAgICB0aGlzLnBhcnNlID0gdGhpcy5wYXJzZS5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLnNhZmVQYXJzZSA9IHRoaXMuc2FmZVBhcnNlLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMucGFyc2VBc3luYyA9IHRoaXMucGFyc2VBc3luYy5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLnNhZmVQYXJzZUFzeW5jID0gdGhpcy5zYWZlUGFyc2VBc3luYy5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLnNwYSA9IHRoaXMuc3BhLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMucmVmaW5lID0gdGhpcy5yZWZpbmUuYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5yZWZpbmVtZW50ID0gdGhpcy5yZWZpbmVtZW50LmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMuc3VwZXJSZWZpbmUgPSB0aGlzLnN1cGVyUmVmaW5lLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMub3B0aW9uYWwgPSB0aGlzLm9wdGlvbmFsLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMubnVsbGFibGUgPSB0aGlzLm51bGxhYmxlLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMubnVsbGlzaCA9IHRoaXMubnVsbGlzaC5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLmFycmF5ID0gdGhpcy5hcnJheS5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLnByb21pc2UgPSB0aGlzLnByb21pc2UuYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5vciA9IHRoaXMub3IuYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5hbmQgPSB0aGlzLmFuZC5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLnRyYW5zZm9ybSA9IHRoaXMudHJhbnNmb3JtLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMuYnJhbmQgPSB0aGlzLmJyYW5kLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMuZGVmYXVsdCA9IHRoaXMuZGVmYXVsdC5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLmNhdGNoID0gdGhpcy5jYXRjaC5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLmRlc2NyaWJlID0gdGhpcy5kZXNjcmliZS5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLnBpcGUgPSB0aGlzLnBpcGUuYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5yZWFkb25seSA9IHRoaXMucmVhZG9ubHkuYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5pc051bGxhYmxlID0gdGhpcy5pc051bGxhYmxlLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMuaXNPcHRpb25hbCA9IHRoaXMuaXNPcHRpb25hbC5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzW1wifnN0YW5kYXJkXCJdID0ge1xuICAgICAgICAgICAgdmVyc2lvbjogMSxcbiAgICAgICAgICAgIHZlbmRvcjogXCJ6b2RcIixcbiAgICAgICAgICAgIHZhbGlkYXRlOiAoZGF0YSkgPT4gdGhpc1tcIn52YWxpZGF0ZVwiXShkYXRhKSxcbiAgICAgICAgfTtcbiAgICB9XG4gICAgb3B0aW9uYWwoKSB7XG4gICAgICAgIHJldHVybiBab2RPcHRpb25hbC5jcmVhdGUodGhpcywgdGhpcy5fZGVmKTtcbiAgICB9XG4gICAgbnVsbGFibGUoKSB7XG4gICAgICAgIHJldHVybiBab2ROdWxsYWJsZS5jcmVhdGUodGhpcywgdGhpcy5fZGVmKTtcbiAgICB9XG4gICAgbnVsbGlzaCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubnVsbGFibGUoKS5vcHRpb25hbCgpO1xuICAgIH1cbiAgICBhcnJheSgpIHtcbiAgICAgICAgcmV0dXJuIFpvZEFycmF5LmNyZWF0ZSh0aGlzKTtcbiAgICB9XG4gICAgcHJvbWlzZSgpIHtcbiAgICAgICAgcmV0dXJuIFpvZFByb21pc2UuY3JlYXRlKHRoaXMsIHRoaXMuX2RlZik7XG4gICAgfVxuICAgIG9yKG9wdGlvbikge1xuICAgICAgICByZXR1cm4gWm9kVW5pb24uY3JlYXRlKFt0aGlzLCBvcHRpb25dLCB0aGlzLl9kZWYpO1xuICAgIH1cbiAgICBhbmQoaW5jb21pbmcpIHtcbiAgICAgICAgcmV0dXJuIFpvZEludGVyc2VjdGlvbi5jcmVhdGUodGhpcywgaW5jb21pbmcsIHRoaXMuX2RlZik7XG4gICAgfVxuICAgIHRyYW5zZm9ybSh0cmFuc2Zvcm0pIHtcbiAgICAgICAgcmV0dXJuIG5ldyBab2RFZmZlY3RzKHtcbiAgICAgICAgICAgIC4uLnByb2Nlc3NDcmVhdGVQYXJhbXModGhpcy5fZGVmKSxcbiAgICAgICAgICAgIHNjaGVtYTogdGhpcyxcbiAgICAgICAgICAgIHR5cGVOYW1lOiBab2RGaXJzdFBhcnR5VHlwZUtpbmQuWm9kRWZmZWN0cyxcbiAgICAgICAgICAgIGVmZmVjdDogeyB0eXBlOiBcInRyYW5zZm9ybVwiLCB0cmFuc2Zvcm0gfSxcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGRlZmF1bHQoZGVmKSB7XG4gICAgICAgIGNvbnN0IGRlZmF1bHRWYWx1ZUZ1bmMgPSB0eXBlb2YgZGVmID09PSBcImZ1bmN0aW9uXCIgPyBkZWYgOiAoKSA9PiBkZWY7XG4gICAgICAgIHJldHVybiBuZXcgWm9kRGVmYXVsdCh7XG4gICAgICAgICAgICAuLi5wcm9jZXNzQ3JlYXRlUGFyYW1zKHRoaXMuX2RlZiksXG4gICAgICAgICAgICBpbm5lclR5cGU6IHRoaXMsXG4gICAgICAgICAgICBkZWZhdWx0VmFsdWU6IGRlZmF1bHRWYWx1ZUZ1bmMsXG4gICAgICAgICAgICB0eXBlTmFtZTogWm9kRmlyc3RQYXJ0eVR5cGVLaW5kLlpvZERlZmF1bHQsXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBicmFuZCgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBab2RCcmFuZGVkKHtcbiAgICAgICAgICAgIHR5cGVOYW1lOiBab2RGaXJzdFBhcnR5VHlwZUtpbmQuWm9kQnJhbmRlZCxcbiAgICAgICAgICAgIHR5cGU6IHRoaXMsXG4gICAgICAgICAgICAuLi5wcm9jZXNzQ3JlYXRlUGFyYW1zKHRoaXMuX2RlZiksXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBjYXRjaChkZWYpIHtcbiAgICAgICAgY29uc3QgY2F0Y2hWYWx1ZUZ1bmMgPSB0eXBlb2YgZGVmID09PSBcImZ1bmN0aW9uXCIgPyBkZWYgOiAoKSA9PiBkZWY7XG4gICAgICAgIHJldHVybiBuZXcgWm9kQ2F0Y2goe1xuICAgICAgICAgICAgLi4ucHJvY2Vzc0NyZWF0ZVBhcmFtcyh0aGlzLl9kZWYpLFxuICAgICAgICAgICAgaW5uZXJUeXBlOiB0aGlzLFxuICAgICAgICAgICAgY2F0Y2hWYWx1ZTogY2F0Y2hWYWx1ZUZ1bmMsXG4gICAgICAgICAgICB0eXBlTmFtZTogWm9kRmlyc3RQYXJ0eVR5cGVLaW5kLlpvZENhdGNoLFxuICAgICAgICB9KTtcbiAgICB9XG4gICAgZGVzY3JpYmUoZGVzY3JpcHRpb24pIHtcbiAgICAgICAgY29uc3QgVGhpcyA9IHRoaXMuY29uc3RydWN0b3I7XG4gICAgICAgIHJldHVybiBuZXcgVGhpcyh7XG4gICAgICAgICAgICAuLi50aGlzLl9kZWYsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbixcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHBpcGUodGFyZ2V0KSB7XG4gICAgICAgIHJldHVybiBab2RQaXBlbGluZS5jcmVhdGUodGhpcywgdGFyZ2V0KTtcbiAgICB9XG4gICAgcmVhZG9ubHkoKSB7XG4gICAgICAgIHJldHVybiBab2RSZWFkb25seS5jcmVhdGUodGhpcyk7XG4gICAgfVxuICAgIGlzT3B0aW9uYWwoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNhZmVQYXJzZSh1bmRlZmluZWQpLnN1Y2Nlc3M7XG4gICAgfVxuICAgIGlzTnVsbGFibGUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNhZmVQYXJzZShudWxsKS5zdWNjZXNzO1xuICAgIH1cbn1cbmNvbnN0IGN1aWRSZWdleCA9IC9eY1teXFxzLV17OCx9JC9pO1xuY29uc3QgY3VpZDJSZWdleCA9IC9eWzAtOWEtel0rJC87XG5jb25zdCB1bGlkUmVnZXggPSAvXlswLTlBLUhKS01OUC1UVi1aXXsyNn0kL2k7XG4vLyBjb25zdCB1dWlkUmVnZXggPVxuLy8gICAvXihbYS1mMC05XXs4fS1bYS1mMC05XXs0fS1bMS01XVthLWYwLTldezN9LVthLWYwLTldezR9LVthLWYwLTldezEyfXwwMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDApJC9pO1xuY29uc3QgdXVpZFJlZ2V4ID0gL15bMC05YS1mQS1GXXs4fVxcYi1bMC05YS1mQS1GXXs0fVxcYi1bMC05YS1mQS1GXXs0fVxcYi1bMC05YS1mQS1GXXs0fVxcYi1bMC05YS1mQS1GXXsxMn0kL2k7XG5jb25zdCBuYW5vaWRSZWdleCA9IC9eW2EtejAtOV8tXXsyMX0kL2k7XG5jb25zdCBqd3RSZWdleCA9IC9eW0EtWmEtejAtOS1fXStcXC5bQS1aYS16MC05LV9dK1xcLltBLVphLXowLTktX10qJC87XG5jb25zdCBkdXJhdGlvblJlZ2V4ID0gL15bLStdP1AoPyEkKSg/Oig/OlstK10/XFxkK1kpfCg/OlstK10/XFxkK1suLF1cXGQrWSQpKT8oPzooPzpbLStdP1xcZCtNKXwoPzpbLStdP1xcZCtbLixdXFxkK00kKSk/KD86KD86Wy0rXT9cXGQrVyl8KD86Wy0rXT9cXGQrWy4sXVxcZCtXJCkpPyg/Oig/OlstK10/XFxkK0QpfCg/OlstK10/XFxkK1suLF1cXGQrRCQpKT8oPzpUKD89W1xcZCstXSkoPzooPzpbLStdP1xcZCtIKXwoPzpbLStdP1xcZCtbLixdXFxkK0gkKSk/KD86KD86Wy0rXT9cXGQrTSl8KD86Wy0rXT9cXGQrWy4sXVxcZCtNJCkpPyg/OlstK10/XFxkKyg/OlsuLF1cXGQrKT9TKT8pPz8kLztcbi8vIGZyb20gaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9hLzQ2MTgxLzE1NTAxNTVcbi8vIG9sZCB2ZXJzaW9uOiB0b28gc2xvdywgZGlkbid0IHN1cHBvcnQgdW5pY29kZVxuLy8gY29uc3QgZW1haWxSZWdleCA9IC9eKCgoW2Etel18XFxkfFshI1xcJCUmJ1xcKlxcK1xcLVxcLz1cXD9cXF5fYHtcXHx9fl18W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pKyhcXC4oW2Etel18XFxkfFshI1xcJCUmJ1xcKlxcK1xcLVxcLz1cXD9cXF5fYHtcXHx9fl18W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pKykqKXwoKFxceDIyKSgoKChcXHgyMHxcXHgwOSkqKFxceDBkXFx4MGEpKT8oXFx4MjB8XFx4MDkpKyk/KChbXFx4MDEtXFx4MDhcXHgwYlxceDBjXFx4MGUtXFx4MWZcXHg3Zl18XFx4MjF8W1xceDIzLVxceDViXXxbXFx4NWQtXFx4N2VdfFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKXwoXFxcXChbXFx4MDEtXFx4MDlcXHgwYlxceDBjXFx4MGQtXFx4N2ZdfFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKSkpKSooKChcXHgyMHxcXHgwOSkqKFxceDBkXFx4MGEpKT8oXFx4MjB8XFx4MDkpKyk/KFxceDIyKSkpQCgoKFthLXpdfFxcZHxbXFx1MDBBMC1cXHVEN0ZGXFx1RjkwMC1cXHVGRENGXFx1RkRGMC1cXHVGRkVGXSl8KChbYS16XXxcXGR8W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pKFthLXpdfFxcZHwtfFxcLnxffH58W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pKihbYS16XXxcXGR8W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pKSlcXC4pKygoW2Etel18W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pfCgoW2Etel18W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pKFthLXpdfFxcZHwtfFxcLnxffH58W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pKihbYS16XXxbXFx1MDBBMC1cXHVEN0ZGXFx1RjkwMC1cXHVGRENGXFx1RkRGMC1cXHVGRkVGXSkpKSQvaTtcbi8vb2xkIGVtYWlsIHJlZ2V4XG4vLyBjb25zdCBlbWFpbFJlZ2V4ID0gL14oKFtePD4oKVtcXF0uLDs6XFxzQFwiXSsoXFwuW148PigpW1xcXS4sOzpcXHNAXCJdKykqKXwoXCIuK1wiKSlAKCg/IS0pKFtePD4oKVtcXF0uLDs6XFxzQFwiXStcXC4pK1tePD4oKVtcXF0uLDs6XFxzQFwiXXsxLH0pW14tPD4oKVtcXF0uLDs6XFxzQFwiXSQvaTtcbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZVxuLy8gY29uc3QgZW1haWxSZWdleCA9XG4vLyAgIC9eKChbXjw+KClbXFxdXFxcXC4sOzpcXHNAXFxcIl0rKFxcLltePD4oKVtcXF1cXFxcLiw7Olxcc0BcXFwiXSspKil8KFxcXCIuK1xcXCIpKUAoKFxcWygoKDI1WzAtNV0pfCgyWzAtNF1bMC05XSl8KDFbMC05XXsyfSl8KFswLTldezEsMn0pKVxcLil7M30oKDI1WzAtNV0pfCgyWzAtNF1bMC05XSl8KDFbMC05XXsyfSl8KFswLTldezEsMn0pKVxcXSl8KFxcW0lQdjY6KChbYS1mMC05XXsxLDR9Oil7N318OjooW2EtZjAtOV17MSw0fTopezAsNn18KFthLWYwLTldezEsNH06KXsxfTooW2EtZjAtOV17MSw0fTopezAsNX18KFthLWYwLTldezEsNH06KXsyfTooW2EtZjAtOV17MSw0fTopezAsNH18KFthLWYwLTldezEsNH06KXszfTooW2EtZjAtOV17MSw0fTopezAsM318KFthLWYwLTldezEsNH06KXs0fTooW2EtZjAtOV17MSw0fTopezAsMn18KFthLWYwLTldezEsNH06KXs1fTooW2EtZjAtOV17MSw0fTopezAsMX0pKFthLWYwLTldezEsNH18KCgoMjVbMC01XSl8KDJbMC00XVswLTldKXwoMVswLTldezJ9KXwoWzAtOV17MSwyfSkpXFwuKXszfSgoMjVbMC01XSl8KDJbMC00XVswLTldKXwoMVswLTldezJ9KXwoWzAtOV17MSwyfSkpKVxcXSl8KFtBLVphLXowLTldKFtBLVphLXowLTktXSpbQS1aYS16MC05XSkqKFxcLltBLVphLXpdezIsfSkrKSkkLztcbi8vIGNvbnN0IGVtYWlsUmVnZXggPVxuLy8gICAvXlthLXpBLVowLTlcXC5cXCFcXCNcXCRcXCVcXCZcXCdcXCpcXCtcXC9cXD1cXD9cXF5cXF9cXGBcXHtcXHxcXH1cXH5cXC1dK0BbYS16QS1aMC05XSg/OlthLXpBLVowLTktXXswLDYxfVthLXpBLVowLTldKT8oPzpcXC5bYS16QS1aMC05XSg/OlthLXpBLVowLTktXXswLDYxfVthLXpBLVowLTldKT8pKiQvO1xuLy8gY29uc3QgZW1haWxSZWdleCA9XG4vLyAgIC9eKD86W2EtejAtOSEjJCUmJyorLz0/Xl9ge3x9fi1dKyg/OlxcLlthLXowLTkhIyQlJicqKy89P15fYHt8fX4tXSspKnxcIig/OltcXHgwMS1cXHgwOFxceDBiXFx4MGNcXHgwZS1cXHgxZlxceDIxXFx4MjMtXFx4NWJcXHg1ZC1cXHg3Zl18XFxcXFtcXHgwMS1cXHgwOVxceDBiXFx4MGNcXHgwZS1cXHg3Zl0pKlwiKUAoPzooPzpbYS16MC05XSg/OlthLXowLTktXSpbYS16MC05XSk/XFwuKStbYS16MC05XSg/OlthLXowLTktXSpbYS16MC05XSk/fFxcWyg/Oig/OjI1WzAtNV18MlswLTRdWzAtOV18WzAxXT9bMC05XVswLTldPylcXC4pezN9KD86MjVbMC01XXwyWzAtNF1bMC05XXxbMDFdP1swLTldWzAtOV0/fFthLXowLTktXSpbYS16MC05XTooPzpbXFx4MDEtXFx4MDhcXHgwYlxceDBjXFx4MGUtXFx4MWZcXHgyMS1cXHg1YVxceDUzLVxceDdmXXxcXFxcW1xceDAxLVxceDA5XFx4MGJcXHgwY1xceDBlLVxceDdmXSkrKVxcXSkkL2k7XG5jb25zdCBlbWFpbFJlZ2V4ID0gL14oPyFcXC4pKD8hLipcXC5cXC4pKFtBLVowLTlfJytcXC1cXC5dKilbQS1aMC05XystXUAoW0EtWjAtOV1bQS1aMC05XFwtXSpcXC4pK1tBLVpdezIsfSQvaTtcbi8vIGNvbnN0IGVtYWlsUmVnZXggPVxuLy8gICAvXlthLXowLTkuISMkJSZcdTIwMTkqKy89P15fYHt8fX4tXStAW2EtejAtOS1dKyg/OlxcLlthLXowLTlcXC1dKykqJC9pO1xuLy8gZnJvbSBodHRwczovL3RoZWtldmluc2NvdHQuY29tL2Vtb2ppcy1pbi1qYXZhc2NyaXB0LyN3cml0aW5nLWEtcmVndWxhci1leHByZXNzaW9uXG5jb25zdCBfZW1vamlSZWdleCA9IGBeKFxcXFxwe0V4dGVuZGVkX1BpY3RvZ3JhcGhpY318XFxcXHB7RW1vamlfQ29tcG9uZW50fSkrJGA7XG5sZXQgZW1vamlSZWdleDtcbi8vIGZhc3Rlciwgc2ltcGxlciwgc2FmZXJcbmNvbnN0IGlwdjRSZWdleCA9IC9eKD86KD86MjVbMC01XXwyWzAtNF1bMC05XXwxWzAtOV1bMC05XXxbMS05XVswLTldfFswLTldKVxcLil7M30oPzoyNVswLTVdfDJbMC00XVswLTldfDFbMC05XVswLTldfFsxLTldWzAtOV18WzAtOV0pJC87XG5jb25zdCBpcHY0Q2lkclJlZ2V4ID0gL14oPzooPzoyNVswLTVdfDJbMC00XVswLTldfDFbMC05XVswLTldfFsxLTldWzAtOV18WzAtOV0pXFwuKXszfSg/OjI1WzAtNV18MlswLTRdWzAtOV18MVswLTldWzAtOV18WzEtOV1bMC05XXxbMC05XSlcXC8oM1swLTJdfFsxMl0/WzAtOV0pJC87XG4vLyBjb25zdCBpcHY2UmVnZXggPVxuLy8gL14oKFthLWYwLTldezEsNH06KXs3fXw6OihbYS1mMC05XXsxLDR9Oil7MCw2fXwoW2EtZjAtOV17MSw0fTopezF9OihbYS1mMC05XXsxLDR9Oil7MCw1fXwoW2EtZjAtOV17MSw0fTopezJ9OihbYS1mMC05XXsxLDR9Oil7MCw0fXwoW2EtZjAtOV17MSw0fTopezN9OihbYS1mMC05XXsxLDR9Oil7MCwzfXwoW2EtZjAtOV17MSw0fTopezR9OihbYS1mMC05XXsxLDR9Oil7MCwyfXwoW2EtZjAtOV17MSw0fTopezV9OihbYS1mMC05XXsxLDR9Oil7MCwxfSkoW2EtZjAtOV17MSw0fXwoKCgyNVswLTVdKXwoMlswLTRdWzAtOV0pfCgxWzAtOV17Mn0pfChbMC05XXsxLDJ9KSlcXC4pezN9KCgyNVswLTVdKXwoMlswLTRdWzAtOV0pfCgxWzAtOV17Mn0pfChbMC05XXsxLDJ9KSkpJC87XG5jb25zdCBpcHY2UmVnZXggPSAvXigoWzAtOWEtZkEtRl17MSw0fTopezcsN31bMC05YS1mQS1GXXsxLDR9fChbMC05YS1mQS1GXXsxLDR9Oil7MSw3fTp8KFswLTlhLWZBLUZdezEsNH06KXsxLDZ9OlswLTlhLWZBLUZdezEsNH18KFswLTlhLWZBLUZdezEsNH06KXsxLDV9KDpbMC05YS1mQS1GXXsxLDR9KXsxLDJ9fChbMC05YS1mQS1GXXsxLDR9Oil7MSw0fSg6WzAtOWEtZkEtRl17MSw0fSl7MSwzfXwoWzAtOWEtZkEtRl17MSw0fTopezEsM30oOlswLTlhLWZBLUZdezEsNH0pezEsNH18KFswLTlhLWZBLUZdezEsNH06KXsxLDJ9KDpbMC05YS1mQS1GXXsxLDR9KXsxLDV9fFswLTlhLWZBLUZdezEsNH06KCg6WzAtOWEtZkEtRl17MSw0fSl7MSw2fSl8OigoOlswLTlhLWZBLUZdezEsNH0pezEsN318Oil8ZmU4MDooOlswLTlhLWZBLUZdezAsNH0pezAsNH0lWzAtOWEtekEtWl17MSx9fDo6KGZmZmYoOjB7MSw0fSl7MCwxfTopezAsMX0oKDI1WzAtNV18KDJbMC00XXwxezAsMX1bMC05XSl7MCwxfVswLTldKVxcLil7MywzfSgyNVswLTVdfCgyWzAtNF18MXswLDF9WzAtOV0pezAsMX1bMC05XSl8KFswLTlhLWZBLUZdezEsNH06KXsxLDR9OigoMjVbMC01XXwoMlswLTRdfDF7MCwxfVswLTldKXswLDF9WzAtOV0pXFwuKXszLDN9KDI1WzAtNV18KDJbMC00XXwxezAsMX1bMC05XSl7MCwxfVswLTldKSkkLztcbmNvbnN0IGlwdjZDaWRyUmVnZXggPSAvXigoWzAtOWEtZkEtRl17MSw0fTopezcsN31bMC05YS1mQS1GXXsxLDR9fChbMC05YS1mQS1GXXsxLDR9Oil7MSw3fTp8KFswLTlhLWZBLUZdezEsNH06KXsxLDZ9OlswLTlhLWZBLUZdezEsNH18KFswLTlhLWZBLUZdezEsNH06KXsxLDV9KDpbMC05YS1mQS1GXXsxLDR9KXsxLDJ9fChbMC05YS1mQS1GXXsxLDR9Oil7MSw0fSg6WzAtOWEtZkEtRl17MSw0fSl7MSwzfXwoWzAtOWEtZkEtRl17MSw0fTopezEsM30oOlswLTlhLWZBLUZdezEsNH0pezEsNH18KFswLTlhLWZBLUZdezEsNH06KXsxLDJ9KDpbMC05YS1mQS1GXXsxLDR9KXsxLDV9fFswLTlhLWZBLUZdezEsNH06KCg6WzAtOWEtZkEtRl17MSw0fSl7MSw2fSl8OigoOlswLTlhLWZBLUZdezEsNH0pezEsN318Oil8ZmU4MDooOlswLTlhLWZBLUZdezAsNH0pezAsNH0lWzAtOWEtekEtWl17MSx9fDo6KGZmZmYoOjB7MSw0fSl7MCwxfTopezAsMX0oKDI1WzAtNV18KDJbMC00XXwxezAsMX1bMC05XSl7MCwxfVswLTldKVxcLil7MywzfSgyNVswLTVdfCgyWzAtNF18MXswLDF9WzAtOV0pezAsMX1bMC05XSl8KFswLTlhLWZBLUZdezEsNH06KXsxLDR9OigoMjVbMC01XXwoMlswLTRdfDF7MCwxfVswLTldKXswLDF9WzAtOV0pXFwuKXszLDN9KDI1WzAtNV18KDJbMC00XXwxezAsMX1bMC05XSl7MCwxfVswLTldKSlcXC8oMTJbMC04XXwxWzAxXVswLTldfFsxLTldP1swLTldKSQvO1xuLy8gaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvNzg2MDM5Mi9kZXRlcm1pbmUtaWYtc3RyaW5nLWlzLWluLWJhc2U2NC11c2luZy1qYXZhc2NyaXB0XG5jb25zdCBiYXNlNjRSZWdleCA9IC9eKFswLTlhLXpBLVorL117NH0pKigoWzAtOWEtekEtWisvXXsyfT09KXwoWzAtOWEtekEtWisvXXszfT0pKT8kLztcbi8vIGh0dHBzOi8vYmFzZTY0Lmd1cnUvc3RhbmRhcmRzL2Jhc2U2NHVybFxuY29uc3QgYmFzZTY0dXJsUmVnZXggPSAvXihbMC05YS16QS1aLV9dezR9KSooKFswLTlhLXpBLVotX117Mn0oPT0pPyl8KFswLTlhLXpBLVotX117M30oPSk/KSk/JC87XG4vLyBzaW1wbGVcbi8vIGNvbnN0IGRhdGVSZWdleFNvdXJjZSA9IGBcXFxcZHs0fS1cXFxcZHsyfS1cXFxcZHsyfWA7XG4vLyBubyBsZWFwIHllYXIgdmFsaWRhdGlvblxuLy8gY29uc3QgZGF0ZVJlZ2V4U291cmNlID0gYFxcXFxkezR9LSgoMFsxMzU3OF18MTB8MTIpLTMxfCgwWzEzLTldfDFbMC0yXSktMzB8KDBbMS05XXwxWzAtMl0pLSgwWzEtOV18MVxcXFxkfDJcXFxcZCkpYDtcbi8vIHdpdGggbGVhcCB5ZWFyIHZhbGlkYXRpb25cbmNvbnN0IGRhdGVSZWdleFNvdXJjZSA9IGAoKFxcXFxkXFxcXGRbMjQ2OF1bMDQ4XXxcXFxcZFxcXFxkWzEzNTc5XVsyNl18XFxcXGRcXFxcZDBbNDhdfFswMjQ2OF1bMDQ4XTAwfFsxMzU3OV1bMjZdMDApLTAyLTI5fFxcXFxkezR9LSgoMFsxMzU3OF18MVswMl0pLSgwWzEtOV18WzEyXVxcXFxkfDNbMDFdKXwoMFs0NjldfDExKS0oMFsxLTldfFsxMl1cXFxcZHwzMCl8KDAyKS0oMFsxLTldfDFcXFxcZHwyWzAtOF0pKSlgO1xuY29uc3QgZGF0ZVJlZ2V4ID0gbmV3IFJlZ0V4cChgXiR7ZGF0ZVJlZ2V4U291cmNlfSRgKTtcbmZ1bmN0aW9uIHRpbWVSZWdleFNvdXJjZShhcmdzKSB7XG4gICAgbGV0IHNlY29uZHNSZWdleFNvdXJjZSA9IGBbMC01XVxcXFxkYDtcbiAgICBpZiAoYXJncy5wcmVjaXNpb24pIHtcbiAgICAgICAgc2Vjb25kc1JlZ2V4U291cmNlID0gYCR7c2Vjb25kc1JlZ2V4U291cmNlfVxcXFwuXFxcXGR7JHthcmdzLnByZWNpc2lvbn19YDtcbiAgICB9XG4gICAgZWxzZSBpZiAoYXJncy5wcmVjaXNpb24gPT0gbnVsbCkge1xuICAgICAgICBzZWNvbmRzUmVnZXhTb3VyY2UgPSBgJHtzZWNvbmRzUmVnZXhTb3VyY2V9KFxcXFwuXFxcXGQrKT9gO1xuICAgIH1cbiAgICBjb25zdCBzZWNvbmRzUXVhbnRpZmllciA9IGFyZ3MucHJlY2lzaW9uID8gXCIrXCIgOiBcIj9cIjsgLy8gcmVxdWlyZSBzZWNvbmRzIGlmIHByZWNpc2lvbiBpcyBub256ZXJvXG4gICAgcmV0dXJuIGAoWzAxXVxcXFxkfDJbMC0zXSk6WzAtNV1cXFxcZCg6JHtzZWNvbmRzUmVnZXhTb3VyY2V9KSR7c2Vjb25kc1F1YW50aWZpZXJ9YDtcbn1cbmZ1bmN0aW9uIHRpbWVSZWdleChhcmdzKSB7XG4gICAgcmV0dXJuIG5ldyBSZWdFeHAoYF4ke3RpbWVSZWdleFNvdXJjZShhcmdzKX0kYCk7XG59XG4vLyBBZGFwdGVkIGZyb20gaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9hLzMxNDMyMzFcbmV4cG9ydCBmdW5jdGlvbiBkYXRldGltZVJlZ2V4KGFyZ3MpIHtcbiAgICBsZXQgcmVnZXggPSBgJHtkYXRlUmVnZXhTb3VyY2V9VCR7dGltZVJlZ2V4U291cmNlKGFyZ3MpfWA7XG4gICAgY29uc3Qgb3B0cyA9IFtdO1xuICAgIG9wdHMucHVzaChhcmdzLmxvY2FsID8gYFo/YCA6IGBaYCk7XG4gICAgaWYgKGFyZ3Mub2Zmc2V0KVxuICAgICAgICBvcHRzLnB1c2goYChbKy1dXFxcXGR7Mn06P1xcXFxkezJ9KWApO1xuICAgIHJlZ2V4ID0gYCR7cmVnZXh9KCR7b3B0cy5qb2luKFwifFwiKX0pYDtcbiAgICByZXR1cm4gbmV3IFJlZ0V4cChgXiR7cmVnZXh9JGApO1xufVxuZnVuY3Rpb24gaXNWYWxpZElQKGlwLCB2ZXJzaW9uKSB7XG4gICAgaWYgKCh2ZXJzaW9uID09PSBcInY0XCIgfHwgIXZlcnNpb24pICYmIGlwdjRSZWdleC50ZXN0KGlwKSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKCh2ZXJzaW9uID09PSBcInY2XCIgfHwgIXZlcnNpb24pICYmIGlwdjZSZWdleC50ZXN0KGlwKSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xufVxuZnVuY3Rpb24gaXNWYWxpZEpXVChqd3QsIGFsZykge1xuICAgIGlmICghand0UmVnZXgudGVzdChqd3QpKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3QgW2hlYWRlcl0gPSBqd3Quc3BsaXQoXCIuXCIpO1xuICAgICAgICBpZiAoIWhlYWRlcilcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgLy8gQ29udmVydCBiYXNlNjR1cmwgdG8gYmFzZTY0XG4gICAgICAgIGNvbnN0IGJhc2U2NCA9IGhlYWRlclxuICAgICAgICAgICAgLnJlcGxhY2UoLy0vZywgXCIrXCIpXG4gICAgICAgICAgICAucmVwbGFjZSgvXy9nLCBcIi9cIilcbiAgICAgICAgICAgIC5wYWRFbmQoaGVhZGVyLmxlbmd0aCArICgoNCAtIChoZWFkZXIubGVuZ3RoICUgNCkpICUgNCksIFwiPVwiKTtcbiAgICAgICAgY29uc3QgZGVjb2RlZCA9IEpTT04ucGFyc2UoYXRvYihiYXNlNjQpKTtcbiAgICAgICAgaWYgKHR5cGVvZiBkZWNvZGVkICE9PSBcIm9iamVjdFwiIHx8IGRlY29kZWQgPT09IG51bGwpXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIGlmIChcInR5cFwiIGluIGRlY29kZWQgJiYgZGVjb2RlZD8udHlwICE9PSBcIkpXVFwiKVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICBpZiAoIWRlY29kZWQuYWxnKVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICBpZiAoYWxnICYmIGRlY29kZWQuYWxnICE9PSBhbGcpXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBjYXRjaCB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG59XG5mdW5jdGlvbiBpc1ZhbGlkQ2lkcihpcCwgdmVyc2lvbikge1xuICAgIGlmICgodmVyc2lvbiA9PT0gXCJ2NFwiIHx8ICF2ZXJzaW9uKSAmJiBpcHY0Q2lkclJlZ2V4LnRlc3QoaXApKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAoKHZlcnNpb24gPT09IFwidjZcIiB8fCAhdmVyc2lvbikgJiYgaXB2NkNpZHJSZWdleC50ZXN0KGlwKSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xufVxuZXhwb3J0IGNsYXNzIFpvZFN0cmluZyBleHRlbmRzIFpvZFR5cGUge1xuICAgIF9wYXJzZShpbnB1dCkge1xuICAgICAgICBpZiAodGhpcy5fZGVmLmNvZXJjZSkge1xuICAgICAgICAgICAgaW5wdXQuZGF0YSA9IFN0cmluZyhpbnB1dC5kYXRhKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBwYXJzZWRUeXBlID0gdGhpcy5fZ2V0VHlwZShpbnB1dCk7XG4gICAgICAgIGlmIChwYXJzZWRUeXBlICE9PSBab2RQYXJzZWRUeXBlLnN0cmluZykge1xuICAgICAgICAgICAgY29uc3QgY3R4ID0gdGhpcy5fZ2V0T3JSZXR1cm5DdHgoaW5wdXQpO1xuICAgICAgICAgICAgYWRkSXNzdWVUb0NvbnRleHQoY3R4LCB7XG4gICAgICAgICAgICAgICAgY29kZTogWm9kSXNzdWVDb2RlLmludmFsaWRfdHlwZSxcbiAgICAgICAgICAgICAgICBleHBlY3RlZDogWm9kUGFyc2VkVHlwZS5zdHJpbmcsXG4gICAgICAgICAgICAgICAgcmVjZWl2ZWQ6IGN0eC5wYXJzZWRUeXBlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gSU5WQUxJRDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzdGF0dXMgPSBuZXcgUGFyc2VTdGF0dXMoKTtcbiAgICAgICAgbGV0IGN0eCA9IHVuZGVmaW5lZDtcbiAgICAgICAgZm9yIChjb25zdCBjaGVjayBvZiB0aGlzLl9kZWYuY2hlY2tzKSB7XG4gICAgICAgICAgICBpZiAoY2hlY2sua2luZCA9PT0gXCJtaW5cIikge1xuICAgICAgICAgICAgICAgIGlmIChpbnB1dC5kYXRhLmxlbmd0aCA8IGNoZWNrLnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGN0eCA9IHRoaXMuX2dldE9yUmV0dXJuQ3R4KGlucHV0LCBjdHgpO1xuICAgICAgICAgICAgICAgICAgICBhZGRJc3N1ZVRvQ29udGV4dChjdHgsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvZGU6IFpvZElzc3VlQ29kZS50b29fc21hbGwsXG4gICAgICAgICAgICAgICAgICAgICAgICBtaW5pbXVtOiBjaGVjay52YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwic3RyaW5nXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmNsdXNpdmU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBleGFjdDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBjaGVjay5tZXNzYWdlLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgc3RhdHVzLmRpcnR5KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoY2hlY2sua2luZCA9PT0gXCJtYXhcIikge1xuICAgICAgICAgICAgICAgIGlmIChpbnB1dC5kYXRhLmxlbmd0aCA+IGNoZWNrLnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGN0eCA9IHRoaXMuX2dldE9yUmV0dXJuQ3R4KGlucHV0LCBjdHgpO1xuICAgICAgICAgICAgICAgICAgICBhZGRJc3N1ZVRvQ29udGV4dChjdHgsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvZGU6IFpvZElzc3VlQ29kZS50b29fYmlnLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWF4aW11bTogY2hlY2sudmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcInN0cmluZ1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgaW5jbHVzaXZlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXhhY3Q6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogY2hlY2subWVzc2FnZSxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHN0YXR1cy5kaXJ0eSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGNoZWNrLmtpbmQgPT09IFwibGVuZ3RoXCIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB0b29CaWcgPSBpbnB1dC5kYXRhLmxlbmd0aCA+IGNoZWNrLnZhbHVlO1xuICAgICAgICAgICAgICAgIGNvbnN0IHRvb1NtYWxsID0gaW5wdXQuZGF0YS5sZW5ndGggPCBjaGVjay52YWx1ZTtcbiAgICAgICAgICAgICAgICBpZiAodG9vQmlnIHx8IHRvb1NtYWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGN0eCA9IHRoaXMuX2dldE9yUmV0dXJuQ3R4KGlucHV0LCBjdHgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAodG9vQmlnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhZGRJc3N1ZVRvQ29udGV4dChjdHgsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2RlOiBab2RJc3N1ZUNvZGUudG9vX2JpZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXhpbXVtOiBjaGVjay52YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcInN0cmluZ1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluY2x1c2l2ZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBleGFjdDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBjaGVjay5tZXNzYWdlLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAodG9vU21hbGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFkZElzc3VlVG9Db250ZXh0KGN0eCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvZGU6IFpvZElzc3VlQ29kZS50b29fc21hbGwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWluaW11bTogY2hlY2sudmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJzdHJpbmdcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmNsdXNpdmU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhhY3Q6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogY2hlY2subWVzc2FnZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHN0YXR1cy5kaXJ0eSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGNoZWNrLmtpbmQgPT09IFwiZW1haWxcIikge1xuICAgICAgICAgICAgICAgIGlmICghZW1haWxSZWdleC50ZXN0KGlucHV0LmRhdGEpKSB7XG4gICAgICAgICAgICAgICAgICAgIGN0eCA9IHRoaXMuX2dldE9yUmV0dXJuQ3R4KGlucHV0LCBjdHgpO1xuICAgICAgICAgICAgICAgICAgICBhZGRJc3N1ZVRvQ29udGV4dChjdHgsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbGlkYXRpb246IFwiZW1haWxcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvZGU6IFpvZElzc3VlQ29kZS5pbnZhbGlkX3N0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGNoZWNrLm1lc3NhZ2UsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBzdGF0dXMuZGlydHkoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChjaGVjay5raW5kID09PSBcImVtb2ppXCIpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWVtb2ppUmVnZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgZW1vamlSZWdleCA9IG5ldyBSZWdFeHAoX2Vtb2ppUmVnZXgsIFwidVwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCFlbW9qaVJlZ2V4LnRlc3QoaW5wdXQuZGF0YSkpIHtcbiAgICAgICAgICAgICAgICAgICAgY3R4ID0gdGhpcy5fZ2V0T3JSZXR1cm5DdHgoaW5wdXQsIGN0eCk7XG4gICAgICAgICAgICAgICAgICAgIGFkZElzc3VlVG9Db250ZXh0KGN0eCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsaWRhdGlvbjogXCJlbW9qaVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29kZTogWm9kSXNzdWVDb2RlLmludmFsaWRfc3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogY2hlY2subWVzc2FnZSxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHN0YXR1cy5kaXJ0eSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGNoZWNrLmtpbmQgPT09IFwidXVpZFwiKSB7XG4gICAgICAgICAgICAgICAgaWYgKCF1dWlkUmVnZXgudGVzdChpbnB1dC5kYXRhKSkge1xuICAgICAgICAgICAgICAgICAgICBjdHggPSB0aGlzLl9nZXRPclJldHVybkN0eChpbnB1dCwgY3R4KTtcbiAgICAgICAgICAgICAgICAgICAgYWRkSXNzdWVUb0NvbnRleHQoY3R4LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWxpZGF0aW9uOiBcInV1aWRcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvZGU6IFpvZElzc3VlQ29kZS5pbnZhbGlkX3N0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGNoZWNrLm1lc3NhZ2UsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBzdGF0dXMuZGlydHkoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChjaGVjay5raW5kID09PSBcIm5hbm9pZFwiKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFuYW5vaWRSZWdleC50ZXN0KGlucHV0LmRhdGEpKSB7XG4gICAgICAgICAgICAgICAgICAgIGN0eCA9IHRoaXMuX2dldE9yUmV0dXJuQ3R4KGlucHV0LCBjdHgpO1xuICAgICAgICAgICAgICAgICAgICBhZGRJc3N1ZVRvQ29udGV4dChjdHgsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbGlkYXRpb246IFwibmFub2lkXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2RlOiBab2RJc3N1ZUNvZGUuaW52YWxpZF9zdHJpbmcsXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBjaGVjay5tZXNzYWdlLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgc3RhdHVzLmRpcnR5KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoY2hlY2sua2luZCA9PT0gXCJjdWlkXCIpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWN1aWRSZWdleC50ZXN0KGlucHV0LmRhdGEpKSB7XG4gICAgICAgICAgICAgICAgICAgIGN0eCA9IHRoaXMuX2dldE9yUmV0dXJuQ3R4KGlucHV0LCBjdHgpO1xuICAgICAgICAgICAgICAgICAgICBhZGRJc3N1ZVRvQ29udGV4dChjdHgsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbGlkYXRpb246IFwiY3VpZFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29kZTogWm9kSXNzdWVDb2RlLmludmFsaWRfc3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogY2hlY2subWVzc2FnZSxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHN0YXR1cy5kaXJ0eSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGNoZWNrLmtpbmQgPT09IFwiY3VpZDJcIikge1xuICAgICAgICAgICAgICAgIGlmICghY3VpZDJSZWdleC50ZXN0KGlucHV0LmRhdGEpKSB7XG4gICAgICAgICAgICAgICAgICAgIGN0eCA9IHRoaXMuX2dldE9yUmV0dXJuQ3R4KGlucHV0LCBjdHgpO1xuICAgICAgICAgICAgICAgICAgICBhZGRJc3N1ZVRvQ29udGV4dChjdHgsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbGlkYXRpb246IFwiY3VpZDJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvZGU6IFpvZElzc3VlQ29kZS5pbnZhbGlkX3N0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGNoZWNrLm1lc3NhZ2UsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBzdGF0dXMuZGlydHkoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChjaGVjay5raW5kID09PSBcInVsaWRcIikge1xuICAgICAgICAgICAgICAgIGlmICghdWxpZFJlZ2V4LnRlc3QoaW5wdXQuZGF0YSkpIHtcbiAgICAgICAgICAgICAgICAgICAgY3R4ID0gdGhpcy5fZ2V0T3JSZXR1cm5DdHgoaW5wdXQsIGN0eCk7XG4gICAgICAgICAgICAgICAgICAgIGFkZElzc3VlVG9Db250ZXh0KGN0eCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsaWRhdGlvbjogXCJ1bGlkXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2RlOiBab2RJc3N1ZUNvZGUuaW52YWxpZF9zdHJpbmcsXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBjaGVjay5tZXNzYWdlLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgc3RhdHVzLmRpcnR5KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoY2hlY2sua2luZCA9PT0gXCJ1cmxcIikge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIG5ldyBVUkwoaW5wdXQuZGF0YSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoIHtcbiAgICAgICAgICAgICAgICAgICAgY3R4ID0gdGhpcy5fZ2V0T3JSZXR1cm5DdHgoaW5wdXQsIGN0eCk7XG4gICAgICAgICAgICAgICAgICAgIGFkZElzc3VlVG9Db250ZXh0KGN0eCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsaWRhdGlvbjogXCJ1cmxcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvZGU6IFpvZElzc3VlQ29kZS5pbnZhbGlkX3N0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGNoZWNrLm1lc3NhZ2UsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBzdGF0dXMuZGlydHkoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChjaGVjay5raW5kID09PSBcInJlZ2V4XCIpIHtcbiAgICAgICAgICAgICAgICBjaGVjay5yZWdleC5sYXN0SW5kZXggPSAwO1xuICAgICAgICAgICAgICAgIGNvbnN0IHRlc3RSZXN1bHQgPSBjaGVjay5yZWdleC50ZXN0KGlucHV0LmRhdGEpO1xuICAgICAgICAgICAgICAgIGlmICghdGVzdFJlc3VsdCkge1xuICAgICAgICAgICAgICAgICAgICBjdHggPSB0aGlzLl9nZXRPclJldHVybkN0eChpbnB1dCwgY3R4KTtcbiAgICAgICAgICAgICAgICAgICAgYWRkSXNzdWVUb0NvbnRleHQoY3R4LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWxpZGF0aW9uOiBcInJlZ2V4XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2RlOiBab2RJc3N1ZUNvZGUuaW52YWxpZF9zdHJpbmcsXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBjaGVjay5tZXNzYWdlLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgc3RhdHVzLmRpcnR5KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoY2hlY2sua2luZCA9PT0gXCJ0cmltXCIpIHtcbiAgICAgICAgICAgICAgICBpbnB1dC5kYXRhID0gaW5wdXQuZGF0YS50cmltKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChjaGVjay5raW5kID09PSBcImluY2x1ZGVzXCIpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWlucHV0LmRhdGEuaW5jbHVkZXMoY2hlY2sudmFsdWUsIGNoZWNrLnBvc2l0aW9uKSkge1xuICAgICAgICAgICAgICAgICAgICBjdHggPSB0aGlzLl9nZXRPclJldHVybkN0eChpbnB1dCwgY3R4KTtcbiAgICAgICAgICAgICAgICAgICAgYWRkSXNzdWVUb0NvbnRleHQoY3R4LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2RlOiBab2RJc3N1ZUNvZGUuaW52YWxpZF9zdHJpbmcsXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWxpZGF0aW9uOiB7IGluY2x1ZGVzOiBjaGVjay52YWx1ZSwgcG9zaXRpb246IGNoZWNrLnBvc2l0aW9uIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBjaGVjay5tZXNzYWdlLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgc3RhdHVzLmRpcnR5KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoY2hlY2sua2luZCA9PT0gXCJ0b0xvd2VyQ2FzZVwiKSB7XG4gICAgICAgICAgICAgICAgaW5wdXQuZGF0YSA9IGlucHV0LmRhdGEudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGNoZWNrLmtpbmQgPT09IFwidG9VcHBlckNhc2VcIikge1xuICAgICAgICAgICAgICAgIGlucHV0LmRhdGEgPSBpbnB1dC5kYXRhLnRvVXBwZXJDYXNlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChjaGVjay5raW5kID09PSBcInN0YXJ0c1dpdGhcIikge1xuICAgICAgICAgICAgICAgIGlmICghaW5wdXQuZGF0YS5zdGFydHNXaXRoKGNoZWNrLnZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICBjdHggPSB0aGlzLl9nZXRPclJldHVybkN0eChpbnB1dCwgY3R4KTtcbiAgICAgICAgICAgICAgICAgICAgYWRkSXNzdWVUb0NvbnRleHQoY3R4LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2RlOiBab2RJc3N1ZUNvZGUuaW52YWxpZF9zdHJpbmcsXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWxpZGF0aW9uOiB7IHN0YXJ0c1dpdGg6IGNoZWNrLnZhbHVlIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBjaGVjay5tZXNzYWdlLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgc3RhdHVzLmRpcnR5KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoY2hlY2sua2luZCA9PT0gXCJlbmRzV2l0aFwiKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFpbnB1dC5kYXRhLmVuZHNXaXRoKGNoZWNrLnZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICBjdHggPSB0aGlzLl9nZXRPclJldHVybkN0eChpbnB1dCwgY3R4KTtcbiAgICAgICAgICAgICAgICAgICAgYWRkSXNzdWVUb0NvbnRleHQoY3R4LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2RlOiBab2RJc3N1ZUNvZGUuaW52YWxpZF9zdHJpbmcsXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWxpZGF0aW9uOiB7IGVuZHNXaXRoOiBjaGVjay52YWx1ZSB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogY2hlY2subWVzc2FnZSxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHN0YXR1cy5kaXJ0eSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGNoZWNrLmtpbmQgPT09IFwiZGF0ZXRpbWVcIikge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlZ2V4ID0gZGF0ZXRpbWVSZWdleChjaGVjayk7XG4gICAgICAgICAgICAgICAgaWYgKCFyZWdleC50ZXN0KGlucHV0LmRhdGEpKSB7XG4gICAgICAgICAgICAgICAgICAgIGN0eCA9IHRoaXMuX2dldE9yUmV0dXJuQ3R4KGlucHV0LCBjdHgpO1xuICAgICAgICAgICAgICAgICAgICBhZGRJc3N1ZVRvQ29udGV4dChjdHgsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvZGU6IFpvZElzc3VlQ29kZS5pbnZhbGlkX3N0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbGlkYXRpb246IFwiZGF0ZXRpbWVcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGNoZWNrLm1lc3NhZ2UsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBzdGF0dXMuZGlydHkoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChjaGVjay5raW5kID09PSBcImRhdGVcIikge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlZ2V4ID0gZGF0ZVJlZ2V4O1xuICAgICAgICAgICAgICAgIGlmICghcmVnZXgudGVzdChpbnB1dC5kYXRhKSkge1xuICAgICAgICAgICAgICAgICAgICBjdHggPSB0aGlzLl9nZXRPclJldHVybkN0eChpbnB1dCwgY3R4KTtcbiAgICAgICAgICAgICAgICAgICAgYWRkSXNzdWVUb0NvbnRleHQoY3R4LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2RlOiBab2RJc3N1ZUNvZGUuaW52YWxpZF9zdHJpbmcsXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWxpZGF0aW9uOiBcImRhdGVcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGNoZWNrLm1lc3NhZ2UsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBzdGF0dXMuZGlydHkoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChjaGVjay5raW5kID09PSBcInRpbWVcIikge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlZ2V4ID0gdGltZVJlZ2V4KGNoZWNrKTtcbiAgICAgICAgICAgICAgICBpZiAoIXJlZ2V4LnRlc3QoaW5wdXQuZGF0YSkpIHtcbiAgICAgICAgICAgICAgICAgICAgY3R4ID0gdGhpcy5fZ2V0T3JSZXR1cm5DdHgoaW5wdXQsIGN0eCk7XG4gICAgICAgICAgICAgICAgICAgIGFkZElzc3VlVG9Db250ZXh0KGN0eCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29kZTogWm9kSXNzdWVDb2RlLmludmFsaWRfc3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsaWRhdGlvbjogXCJ0aW1lXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBjaGVjay5tZXNzYWdlLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgc3RhdHVzLmRpcnR5KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoY2hlY2sua2luZCA9PT0gXCJkdXJhdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFkdXJhdGlvblJlZ2V4LnRlc3QoaW5wdXQuZGF0YSkpIHtcbiAgICAgICAgICAgICAgICAgICAgY3R4ID0gdGhpcy5fZ2V0T3JSZXR1cm5DdHgoaW5wdXQsIGN0eCk7XG4gICAgICAgICAgICAgICAgICAgIGFkZElzc3VlVG9Db250ZXh0KGN0eCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsaWRhdGlvbjogXCJkdXJhdGlvblwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29kZTogWm9kSXNzdWVDb2RlLmludmFsaWRfc3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogY2hlY2subWVzc2FnZSxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHN0YXR1cy5kaXJ0eSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGNoZWNrLmtpbmQgPT09IFwiaXBcIikge1xuICAgICAgICAgICAgICAgIGlmICghaXNWYWxpZElQKGlucHV0LmRhdGEsIGNoZWNrLnZlcnNpb24pKSB7XG4gICAgICAgICAgICAgICAgICAgIGN0eCA9IHRoaXMuX2dldE9yUmV0dXJuQ3R4KGlucHV0LCBjdHgpO1xuICAgICAgICAgICAgICAgICAgICBhZGRJc3N1ZVRvQ29udGV4dChjdHgsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbGlkYXRpb246IFwiaXBcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvZGU6IFpvZElzc3VlQ29kZS5pbnZhbGlkX3N0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGNoZWNrLm1lc3NhZ2UsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBzdGF0dXMuZGlydHkoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChjaGVjay5raW5kID09PSBcImp3dFwiKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFpc1ZhbGlkSldUKGlucHV0LmRhdGEsIGNoZWNrLmFsZykpIHtcbiAgICAgICAgICAgICAgICAgICAgY3R4ID0gdGhpcy5fZ2V0T3JSZXR1cm5DdHgoaW5wdXQsIGN0eCk7XG4gICAgICAgICAgICAgICAgICAgIGFkZElzc3VlVG9Db250ZXh0KGN0eCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsaWRhdGlvbjogXCJqd3RcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvZGU6IFpvZElzc3VlQ29kZS5pbnZhbGlkX3N0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGNoZWNrLm1lc3NhZ2UsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBzdGF0dXMuZGlydHkoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChjaGVjay5raW5kID09PSBcImNpZHJcIikge1xuICAgICAgICAgICAgICAgIGlmICghaXNWYWxpZENpZHIoaW5wdXQuZGF0YSwgY2hlY2sudmVyc2lvbikpIHtcbiAgICAgICAgICAgICAgICAgICAgY3R4ID0gdGhpcy5fZ2V0T3JSZXR1cm5DdHgoaW5wdXQsIGN0eCk7XG4gICAgICAgICAgICAgICAgICAgIGFkZElzc3VlVG9Db250ZXh0KGN0eCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsaWRhdGlvbjogXCJjaWRyXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2RlOiBab2RJc3N1ZUNvZGUuaW52YWxpZF9zdHJpbmcsXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBjaGVjay5tZXNzYWdlLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgc3RhdHVzLmRpcnR5KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoY2hlY2sua2luZCA9PT0gXCJiYXNlNjRcIikge1xuICAgICAgICAgICAgICAgIGlmICghYmFzZTY0UmVnZXgudGVzdChpbnB1dC5kYXRhKSkge1xuICAgICAgICAgICAgICAgICAgICBjdHggPSB0aGlzLl9nZXRPclJldHVybkN0eChpbnB1dCwgY3R4KTtcbiAgICAgICAgICAgICAgICAgICAgYWRkSXNzdWVUb0NvbnRleHQoY3R4LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWxpZGF0aW9uOiBcImJhc2U2NFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29kZTogWm9kSXNzdWVDb2RlLmludmFsaWRfc3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogY2hlY2subWVzc2FnZSxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHN0YXR1cy5kaXJ0eSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGNoZWNrLmtpbmQgPT09IFwiYmFzZTY0dXJsXCIpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWJhc2U2NHVybFJlZ2V4LnRlc3QoaW5wdXQuZGF0YSkpIHtcbiAgICAgICAgICAgICAgICAgICAgY3R4ID0gdGhpcy5fZ2V0T3JSZXR1cm5DdHgoaW5wdXQsIGN0eCk7XG4gICAgICAgICAgICAgICAgICAgIGFkZElzc3VlVG9Db250ZXh0KGN0eCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsaWRhdGlvbjogXCJiYXNlNjR1cmxcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvZGU6IFpvZElzc3VlQ29kZS5pbnZhbGlkX3N0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGNoZWNrLm1lc3NhZ2UsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBzdGF0dXMuZGlydHkoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB1dGlsLmFzc2VydE5ldmVyKGNoZWNrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4geyBzdGF0dXM6IHN0YXR1cy52YWx1ZSwgdmFsdWU6IGlucHV0LmRhdGEgfTtcbiAgICB9XG4gICAgX3JlZ2V4KHJlZ2V4LCB2YWxpZGF0aW9uLCBtZXNzYWdlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlZmluZW1lbnQoKGRhdGEpID0+IHJlZ2V4LnRlc3QoZGF0YSksIHtcbiAgICAgICAgICAgIHZhbGlkYXRpb24sXG4gICAgICAgICAgICBjb2RlOiBab2RJc3N1ZUNvZGUuaW52YWxpZF9zdHJpbmcsXG4gICAgICAgICAgICAuLi5lcnJvclV0aWwuZXJyVG9PYmoobWVzc2FnZSksXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBfYWRkQ2hlY2soY2hlY2spIHtcbiAgICAgICAgcmV0dXJuIG5ldyBab2RTdHJpbmcoe1xuICAgICAgICAgICAgLi4udGhpcy5fZGVmLFxuICAgICAgICAgICAgY2hlY2tzOiBbLi4udGhpcy5fZGVmLmNoZWNrcywgY2hlY2tdLFxuICAgICAgICB9KTtcbiAgICB9XG4gICAgZW1haWwobWVzc2FnZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fYWRkQ2hlY2soeyBraW5kOiBcImVtYWlsXCIsIC4uLmVycm9yVXRpbC5lcnJUb09iaihtZXNzYWdlKSB9KTtcbiAgICB9XG4gICAgdXJsKG1lc3NhZ2UpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2FkZENoZWNrKHsga2luZDogXCJ1cmxcIiwgLi4uZXJyb3JVdGlsLmVyclRvT2JqKG1lc3NhZ2UpIH0pO1xuICAgIH1cbiAgICBlbW9qaShtZXNzYWdlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9hZGRDaGVjayh7IGtpbmQ6IFwiZW1vamlcIiwgLi4uZXJyb3JVdGlsLmVyclRvT2JqKG1lc3NhZ2UpIH0pO1xuICAgIH1cbiAgICB1dWlkKG1lc3NhZ2UpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2FkZENoZWNrKHsga2luZDogXCJ1dWlkXCIsIC4uLmVycm9yVXRpbC5lcnJUb09iaihtZXNzYWdlKSB9KTtcbiAgICB9XG4gICAgbmFub2lkKG1lc3NhZ2UpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2FkZENoZWNrKHsga2luZDogXCJuYW5vaWRcIiwgLi4uZXJyb3JVdGlsLmVyclRvT2JqKG1lc3NhZ2UpIH0pO1xuICAgIH1cbiAgICBjdWlkKG1lc3NhZ2UpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2FkZENoZWNrKHsga2luZDogXCJjdWlkXCIsIC4uLmVycm9yVXRpbC5lcnJUb09iaihtZXNzYWdlKSB9KTtcbiAgICB9XG4gICAgY3VpZDIobWVzc2FnZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fYWRkQ2hlY2soeyBraW5kOiBcImN1aWQyXCIsIC4uLmVycm9yVXRpbC5lcnJUb09iaihtZXNzYWdlKSB9KTtcbiAgICB9XG4gICAgdWxpZChtZXNzYWdlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9hZGRDaGVjayh7IGtpbmQ6IFwidWxpZFwiLCAuLi5lcnJvclV0aWwuZXJyVG9PYmoobWVzc2FnZSkgfSk7XG4gICAgfVxuICAgIGJhc2U2NChtZXNzYWdlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9hZGRDaGVjayh7IGtpbmQ6IFwiYmFzZTY0XCIsIC4uLmVycm9yVXRpbC5lcnJUb09iaihtZXNzYWdlKSB9KTtcbiAgICB9XG4gICAgYmFzZTY0dXJsKG1lc3NhZ2UpIHtcbiAgICAgICAgLy8gYmFzZTY0dXJsIGVuY29kaW5nIGlzIGEgbW9kaWZpY2F0aW9uIG9mIGJhc2U2NCB0aGF0IGNhbiBzYWZlbHkgYmUgdXNlZCBpbiBVUkxzIGFuZCBmaWxlbmFtZXNcbiAgICAgICAgcmV0dXJuIHRoaXMuX2FkZENoZWNrKHtcbiAgICAgICAgICAgIGtpbmQ6IFwiYmFzZTY0dXJsXCIsXG4gICAgICAgICAgICAuLi5lcnJvclV0aWwuZXJyVG9PYmoobWVzc2FnZSksXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBqd3Qob3B0aW9ucykge1xuICAgICAgICByZXR1cm4gdGhpcy5fYWRkQ2hlY2soeyBraW5kOiBcImp3dFwiLCAuLi5lcnJvclV0aWwuZXJyVG9PYmoob3B0aW9ucykgfSk7XG4gICAgfVxuICAgIGlwKG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2FkZENoZWNrKHsga2luZDogXCJpcFwiLCAuLi5lcnJvclV0aWwuZXJyVG9PYmoob3B0aW9ucykgfSk7XG4gICAgfVxuICAgIGNpZHIob3B0aW9ucykge1xuICAgICAgICByZXR1cm4gdGhpcy5fYWRkQ2hlY2soeyBraW5kOiBcImNpZHJcIiwgLi4uZXJyb3JVdGlsLmVyclRvT2JqKG9wdGlvbnMpIH0pO1xuICAgIH1cbiAgICBkYXRldGltZShvcHRpb25zKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2FkZENoZWNrKHtcbiAgICAgICAgICAgICAgICBraW5kOiBcImRhdGV0aW1lXCIsXG4gICAgICAgICAgICAgICAgcHJlY2lzaW9uOiBudWxsLFxuICAgICAgICAgICAgICAgIG9mZnNldDogZmFsc2UsXG4gICAgICAgICAgICAgICAgbG9jYWw6IGZhbHNlLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IG9wdGlvbnMsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5fYWRkQ2hlY2soe1xuICAgICAgICAgICAga2luZDogXCJkYXRldGltZVwiLFxuICAgICAgICAgICAgcHJlY2lzaW9uOiB0eXBlb2Ygb3B0aW9ucz8ucHJlY2lzaW9uID09PSBcInVuZGVmaW5lZFwiID8gbnVsbCA6IG9wdGlvbnM/LnByZWNpc2lvbixcbiAgICAgICAgICAgIG9mZnNldDogb3B0aW9ucz8ub2Zmc2V0ID8/IGZhbHNlLFxuICAgICAgICAgICAgbG9jYWw6IG9wdGlvbnM/LmxvY2FsID8/IGZhbHNlLFxuICAgICAgICAgICAgLi4uZXJyb3JVdGlsLmVyclRvT2JqKG9wdGlvbnM/Lm1lc3NhZ2UpLFxuICAgICAgICB9KTtcbiAgICB9XG4gICAgZGF0ZShtZXNzYWdlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9hZGRDaGVjayh7IGtpbmQ6IFwiZGF0ZVwiLCBtZXNzYWdlIH0pO1xuICAgIH1cbiAgICB0aW1lKG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fYWRkQ2hlY2soe1xuICAgICAgICAgICAgICAgIGtpbmQ6IFwidGltZVwiLFxuICAgICAgICAgICAgICAgIHByZWNpc2lvbjogbnVsbCxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBvcHRpb25zLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX2FkZENoZWNrKHtcbiAgICAgICAgICAgIGtpbmQ6IFwidGltZVwiLFxuICAgICAgICAgICAgcHJlY2lzaW9uOiB0eXBlb2Ygb3B0aW9ucz8ucHJlY2lzaW9uID09PSBcInVuZGVmaW5lZFwiID8gbnVsbCA6IG9wdGlvbnM/LnByZWNpc2lvbixcbiAgICAgICAgICAgIC4uLmVycm9yVXRpbC5lcnJUb09iaihvcHRpb25zPy5tZXNzYWdlKSxcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGR1cmF0aW9uKG1lc3NhZ2UpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2FkZENoZWNrKHsga2luZDogXCJkdXJhdGlvblwiLCAuLi5lcnJvclV0aWwuZXJyVG9PYmoobWVzc2FnZSkgfSk7XG4gICAgfVxuICAgIHJlZ2V4KHJlZ2V4LCBtZXNzYWdlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9hZGRDaGVjayh7XG4gICAgICAgICAgICBraW5kOiBcInJlZ2V4XCIsXG4gICAgICAgICAgICByZWdleDogcmVnZXgsXG4gICAgICAgICAgICAuLi5lcnJvclV0aWwuZXJyVG9PYmoobWVzc2FnZSksXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBpbmNsdWRlcyh2YWx1ZSwgb3B0aW9ucykge1xuICAgICAgICByZXR1cm4gdGhpcy5fYWRkQ2hlY2soe1xuICAgICAgICAgICAga2luZDogXCJpbmNsdWRlc1wiLFxuICAgICAgICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgICAgICAgcG9zaXRpb246IG9wdGlvbnM/LnBvc2l0aW9uLFxuICAgICAgICAgICAgLi4uZXJyb3JVdGlsLmVyclRvT2JqKG9wdGlvbnM/Lm1lc3NhZ2UpLFxuICAgICAgICB9KTtcbiAgICB9XG4gICAgc3RhcnRzV2l0aCh2YWx1ZSwgbWVzc2FnZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fYWRkQ2hlY2soe1xuICAgICAgICAgICAga2luZDogXCJzdGFydHNXaXRoXCIsXG4gICAgICAgICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICAgICAgICAuLi5lcnJvclV0aWwuZXJyVG9PYmoobWVzc2FnZSksXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBlbmRzV2l0aCh2YWx1ZSwgbWVzc2FnZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fYWRkQ2hlY2soe1xuICAgICAgICAgICAga2luZDogXCJlbmRzV2l0aFwiLFxuICAgICAgICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgICAgICAgLi4uZXJyb3JVdGlsLmVyclRvT2JqKG1lc3NhZ2UpLFxuICAgICAgICB9KTtcbiAgICB9XG4gICAgbWluKG1pbkxlbmd0aCwgbWVzc2FnZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fYWRkQ2hlY2soe1xuICAgICAgICAgICAga2luZDogXCJtaW5cIixcbiAgICAgICAgICAgIHZhbHVlOiBtaW5MZW5ndGgsXG4gICAgICAgICAgICAuLi5lcnJvclV0aWwuZXJyVG9PYmoobWVzc2FnZSksXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBtYXgobWF4TGVuZ3RoLCBtZXNzYWdlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9hZGRDaGVjayh7XG4gICAgICAgICAgICBraW5kOiBcIm1heFwiLFxuICAgICAgICAgICAgdmFsdWU6IG1heExlbmd0aCxcbiAgICAgICAgICAgIC4uLmVycm9yVXRpbC5lcnJUb09iaihtZXNzYWdlKSxcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGxlbmd0aChsZW4sIG1lc3NhZ2UpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2FkZENoZWNrKHtcbiAgICAgICAgICAgIGtpbmQ6IFwibGVuZ3RoXCIsXG4gICAgICAgICAgICB2YWx1ZTogbGVuLFxuICAgICAgICAgICAgLi4uZXJyb3JVdGlsLmVyclRvT2JqKG1lc3NhZ2UpLFxuICAgICAgICB9KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRXF1aXZhbGVudCB0byBgLm1pbigxKWBcbiAgICAgKi9cbiAgICBub25lbXB0eShtZXNzYWdlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1pbigxLCBlcnJvclV0aWwuZXJyVG9PYmoobWVzc2FnZSkpO1xuICAgIH1cbiAgICB0cmltKCkge1xuICAgICAgICByZXR1cm4gbmV3IFpvZFN0cmluZyh7XG4gICAgICAgICAgICAuLi50aGlzLl9kZWYsXG4gICAgICAgICAgICBjaGVja3M6IFsuLi50aGlzLl9kZWYuY2hlY2tzLCB7IGtpbmQ6IFwidHJpbVwiIH1dLFxuICAgICAgICB9KTtcbiAgICB9XG4gICAgdG9Mb3dlckNhc2UoKSB7XG4gICAgICAgIHJldHVybiBuZXcgWm9kU3RyaW5nKHtcbiAgICAgICAgICAgIC4uLnRoaXMuX2RlZixcbiAgICAgICAgICAgIGNoZWNrczogWy4uLnRoaXMuX2RlZi5jaGVja3MsIHsga2luZDogXCJ0b0xvd2VyQ2FzZVwiIH1dLFxuICAgICAgICB9KTtcbiAgICB9XG4gICAgdG9VcHBlckNhc2UoKSB7XG4gICAgICAgIHJldHVybiBuZXcgWm9kU3RyaW5nKHtcbiAgICAgICAgICAgIC4uLnRoaXMuX2RlZixcbiAgICAgICAgICAgIGNoZWNrczogWy4uLnRoaXMuX2RlZi5jaGVja3MsIHsga2luZDogXCJ0b1VwcGVyQ2FzZVwiIH1dLFxuICAgICAgICB9KTtcbiAgICB9XG4gICAgZ2V0IGlzRGF0ZXRpbWUoKSB7XG4gICAgICAgIHJldHVybiAhIXRoaXMuX2RlZi5jaGVja3MuZmluZCgoY2gpID0+IGNoLmtpbmQgPT09IFwiZGF0ZXRpbWVcIik7XG4gICAgfVxuICAgIGdldCBpc0RhdGUoKSB7XG4gICAgICAgIHJldHVybiAhIXRoaXMuX2RlZi5jaGVja3MuZmluZCgoY2gpID0+IGNoLmtpbmQgPT09IFwiZGF0ZVwiKTtcbiAgICB9XG4gICAgZ2V0IGlzVGltZSgpIHtcbiAgICAgICAgcmV0dXJuICEhdGhpcy5fZGVmLmNoZWNrcy5maW5kKChjaCkgPT4gY2gua2luZCA9PT0gXCJ0aW1lXCIpO1xuICAgIH1cbiAgICBnZXQgaXNEdXJhdGlvbigpIHtcbiAgICAgICAgcmV0dXJuICEhdGhpcy5fZGVmLmNoZWNrcy5maW5kKChjaCkgPT4gY2gua2luZCA9PT0gXCJkdXJhdGlvblwiKTtcbiAgICB9XG4gICAgZ2V0IGlzRW1haWwoKSB7XG4gICAgICAgIHJldHVybiAhIXRoaXMuX2RlZi5jaGVja3MuZmluZCgoY2gpID0+IGNoLmtpbmQgPT09IFwiZW1haWxcIik7XG4gICAgfVxuICAgIGdldCBpc1VSTCgpIHtcbiAgICAgICAgcmV0dXJuICEhdGhpcy5fZGVmLmNoZWNrcy5maW5kKChjaCkgPT4gY2gua2luZCA9PT0gXCJ1cmxcIik7XG4gICAgfVxuICAgIGdldCBpc0Vtb2ppKCkge1xuICAgICAgICByZXR1cm4gISF0aGlzLl9kZWYuY2hlY2tzLmZpbmQoKGNoKSA9PiBjaC5raW5kID09PSBcImVtb2ppXCIpO1xuICAgIH1cbiAgICBnZXQgaXNVVUlEKCkge1xuICAgICAgICByZXR1cm4gISF0aGlzLl9kZWYuY2hlY2tzLmZpbmQoKGNoKSA9PiBjaC5raW5kID09PSBcInV1aWRcIik7XG4gICAgfVxuICAgIGdldCBpc05BTk9JRCgpIHtcbiAgICAgICAgcmV0dXJuICEhdGhpcy5fZGVmLmNoZWNrcy5maW5kKChjaCkgPT4gY2gua2luZCA9PT0gXCJuYW5vaWRcIik7XG4gICAgfVxuICAgIGdldCBpc0NVSUQoKSB7XG4gICAgICAgIHJldHVybiAhIXRoaXMuX2RlZi5jaGVja3MuZmluZCgoY2gpID0+IGNoLmtpbmQgPT09IFwiY3VpZFwiKTtcbiAgICB9XG4gICAgZ2V0IGlzQ1VJRDIoKSB7XG4gICAgICAgIHJldHVybiAhIXRoaXMuX2RlZi5jaGVja3MuZmluZCgoY2gpID0+IGNoLmtpbmQgPT09IFwiY3VpZDJcIik7XG4gICAgfVxuICAgIGdldCBpc1VMSUQoKSB7XG4gICAgICAgIHJldHVybiAhIXRoaXMuX2RlZi5jaGVja3MuZmluZCgoY2gpID0+IGNoLmtpbmQgPT09IFwidWxpZFwiKTtcbiAgICB9XG4gICAgZ2V0IGlzSVAoKSB7XG4gICAgICAgIHJldHVybiAhIXRoaXMuX2RlZi5jaGVja3MuZmluZCgoY2gpID0+IGNoLmtpbmQgPT09IFwiaXBcIik7XG4gICAgfVxuICAgIGdldCBpc0NJRFIoKSB7XG4gICAgICAgIHJldHVybiAhIXRoaXMuX2RlZi5jaGVja3MuZmluZCgoY2gpID0+IGNoLmtpbmQgPT09IFwiY2lkclwiKTtcbiAgICB9XG4gICAgZ2V0IGlzQmFzZTY0KCkge1xuICAgICAgICByZXR1cm4gISF0aGlzLl9kZWYuY2hlY2tzLmZpbmQoKGNoKSA9PiBjaC5raW5kID09PSBcImJhc2U2NFwiKTtcbiAgICB9XG4gICAgZ2V0IGlzQmFzZTY0dXJsKCkge1xuICAgICAgICAvLyBiYXNlNjR1cmwgZW5jb2RpbmcgaXMgYSBtb2RpZmljYXRpb24gb2YgYmFzZTY0IHRoYXQgY2FuIHNhZmVseSBiZSB1c2VkIGluIFVSTHMgYW5kIGZpbGVuYW1lc1xuICAgICAgICByZXR1cm4gISF0aGlzLl9kZWYuY2hlY2tzLmZpbmQoKGNoKSA9PiBjaC5raW5kID09PSBcImJhc2U2NHVybFwiKTtcbiAgICB9XG4gICAgZ2V0IG1pbkxlbmd0aCgpIHtcbiAgICAgICAgbGV0IG1pbiA9IG51bGw7XG4gICAgICAgIGZvciAoY29uc3QgY2ggb2YgdGhpcy5fZGVmLmNoZWNrcykge1xuICAgICAgICAgICAgaWYgKGNoLmtpbmQgPT09IFwibWluXCIpIHtcbiAgICAgICAgICAgICAgICBpZiAobWluID09PSBudWxsIHx8IGNoLnZhbHVlID4gbWluKVxuICAgICAgICAgICAgICAgICAgICBtaW4gPSBjaC52YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbWluO1xuICAgIH1cbiAgICBnZXQgbWF4TGVuZ3RoKCkge1xuICAgICAgICBsZXQgbWF4ID0gbnVsbDtcbiAgICAgICAgZm9yIChjb25zdCBjaCBvZiB0aGlzLl9kZWYuY2hlY2tzKSB7XG4gICAgICAgICAgICBpZiAoY2gua2luZCA9PT0gXCJtYXhcIikge1xuICAgICAgICAgICAgICAgIGlmIChtYXggPT09IG51bGwgfHwgY2gudmFsdWUgPCBtYXgpXG4gICAgICAgICAgICAgICAgICAgIG1heCA9IGNoLnZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtYXg7XG4gICAgfVxufVxuWm9kU3RyaW5nLmNyZWF0ZSA9IChwYXJhbXMpID0+IHtcbiAgICByZXR1cm4gbmV3IFpvZFN0cmluZyh7XG4gICAgICAgIGNoZWNrczogW10sXG4gICAgICAgIHR5cGVOYW1lOiBab2RGaXJzdFBhcnR5VHlwZUtpbmQuWm9kU3RyaW5nLFxuICAgICAgICBjb2VyY2U6IHBhcmFtcz8uY29lcmNlID8/IGZhbHNlLFxuICAgICAgICAuLi5wcm9jZXNzQ3JlYXRlUGFyYW1zKHBhcmFtcyksXG4gICAgfSk7XG59O1xuLy8gaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMzk2NjQ4NC93aHktZG9lcy1tb2R1bHVzLW9wZXJhdG9yLXJldHVybi1mcmFjdGlvbmFsLW51bWJlci1pbi1qYXZhc2NyaXB0LzMxNzExMDM0IzMxNzExMDM0XG5mdW5jdGlvbiBmbG9hdFNhZmVSZW1haW5kZXIodmFsLCBzdGVwKSB7XG4gICAgY29uc3QgdmFsRGVjQ291bnQgPSAodmFsLnRvU3RyaW5nKCkuc3BsaXQoXCIuXCIpWzFdIHx8IFwiXCIpLmxlbmd0aDtcbiAgICBjb25zdCBzdGVwRGVjQ291bnQgPSAoc3RlcC50b1N0cmluZygpLnNwbGl0KFwiLlwiKVsxXSB8fCBcIlwiKS5sZW5ndGg7XG4gICAgY29uc3QgZGVjQ291bnQgPSB2YWxEZWNDb3VudCA+IHN0ZXBEZWNDb3VudCA/IHZhbERlY0NvdW50IDogc3RlcERlY0NvdW50O1xuICAgIGNvbnN0IHZhbEludCA9IE51bWJlci5wYXJzZUludCh2YWwudG9GaXhlZChkZWNDb3VudCkucmVwbGFjZShcIi5cIiwgXCJcIikpO1xuICAgIGNvbnN0IHN0ZXBJbnQgPSBOdW1iZXIucGFyc2VJbnQoc3RlcC50b0ZpeGVkKGRlY0NvdW50KS5yZXBsYWNlKFwiLlwiLCBcIlwiKSk7XG4gICAgcmV0dXJuICh2YWxJbnQgJSBzdGVwSW50KSAvIDEwICoqIGRlY0NvdW50O1xufVxuZXhwb3J0IGNsYXNzIFpvZE51bWJlciBleHRlbmRzIFpvZFR5cGUge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlciguLi5hcmd1bWVudHMpO1xuICAgICAgICB0aGlzLm1pbiA9IHRoaXMuZ3RlO1xuICAgICAgICB0aGlzLm1heCA9IHRoaXMubHRlO1xuICAgICAgICB0aGlzLnN0ZXAgPSB0aGlzLm11bHRpcGxlT2Y7XG4gICAgfVxuICAgIF9wYXJzZShpbnB1dCkge1xuICAgICAgICBpZiAodGhpcy5fZGVmLmNvZXJjZSkge1xuICAgICAgICAgICAgaW5wdXQuZGF0YSA9IE51bWJlcihpbnB1dC5kYXRhKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBwYXJzZWRUeXBlID0gdGhpcy5fZ2V0VHlwZShpbnB1dCk7XG4gICAgICAgIGlmIChwYXJzZWRUeXBlICE9PSBab2RQYXJzZWRUeXBlLm51bWJlcikge1xuICAgICAgICAgICAgY29uc3QgY3R4ID0gdGhpcy5fZ2V0T3JSZXR1cm5DdHgoaW5wdXQpO1xuICAgICAgICAgICAgYWRkSXNzdWVUb0NvbnRleHQoY3R4LCB7XG4gICAgICAgICAgICAgICAgY29kZTogWm9kSXNzdWVDb2RlLmludmFsaWRfdHlwZSxcbiAgICAgICAgICAgICAgICBleHBlY3RlZDogWm9kUGFyc2VkVHlwZS5udW1iZXIsXG4gICAgICAgICAgICAgICAgcmVjZWl2ZWQ6IGN0eC5wYXJzZWRUeXBlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gSU5WQUxJRDtcbiAgICAgICAgfVxuICAgICAgICBsZXQgY3R4ID0gdW5kZWZpbmVkO1xuICAgICAgICBjb25zdCBzdGF0dXMgPSBuZXcgUGFyc2VTdGF0dXMoKTtcbiAgICAgICAgZm9yIChjb25zdCBjaGVjayBvZiB0aGlzLl9kZWYuY2hlY2tzKSB7XG4gICAgICAgICAgICBpZiAoY2hlY2sua2luZCA9PT0gXCJpbnRcIikge1xuICAgICAgICAgICAgICAgIGlmICghdXRpbC5pc0ludGVnZXIoaW5wdXQuZGF0YSkpIHtcbiAgICAgICAgICAgICAgICAgICAgY3R4ID0gdGhpcy5fZ2V0T3JSZXR1cm5DdHgoaW5wdXQsIGN0eCk7XG4gICAgICAgICAgICAgICAgICAgIGFkZElzc3VlVG9Db250ZXh0KGN0eCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29kZTogWm9kSXNzdWVDb2RlLmludmFsaWRfdHlwZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcImludGVnZXJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlY2VpdmVkOiBcImZsb2F0XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBjaGVjay5tZXNzYWdlLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgc3RhdHVzLmRpcnR5KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoY2hlY2sua2luZCA9PT0gXCJtaW5cIikge1xuICAgICAgICAgICAgICAgIGNvbnN0IHRvb1NtYWxsID0gY2hlY2suaW5jbHVzaXZlID8gaW5wdXQuZGF0YSA8IGNoZWNrLnZhbHVlIDogaW5wdXQuZGF0YSA8PSBjaGVjay52YWx1ZTtcbiAgICAgICAgICAgICAgICBpZiAodG9vU21hbGwpIHtcbiAgICAgICAgICAgICAgICAgICAgY3R4ID0gdGhpcy5fZ2V0T3JSZXR1cm5DdHgoaW5wdXQsIGN0eCk7XG4gICAgICAgICAgICAgICAgICAgIGFkZElzc3VlVG9Db250ZXh0KGN0eCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29kZTogWm9kSXNzdWVDb2RlLnRvb19zbWFsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1pbmltdW06IGNoZWNrLnZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJudW1iZXJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIGluY2x1c2l2ZTogY2hlY2suaW5jbHVzaXZlLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXhhY3Q6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogY2hlY2subWVzc2FnZSxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHN0YXR1cy5kaXJ0eSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGNoZWNrLmtpbmQgPT09IFwibWF4XCIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB0b29CaWcgPSBjaGVjay5pbmNsdXNpdmUgPyBpbnB1dC5kYXRhID4gY2hlY2sudmFsdWUgOiBpbnB1dC5kYXRhID49IGNoZWNrLnZhbHVlO1xuICAgICAgICAgICAgICAgIGlmICh0b29CaWcpIHtcbiAgICAgICAgICAgICAgICAgICAgY3R4ID0gdGhpcy5fZ2V0T3JSZXR1cm5DdHgoaW5wdXQsIGN0eCk7XG4gICAgICAgICAgICAgICAgICAgIGFkZElzc3VlVG9Db250ZXh0KGN0eCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29kZTogWm9kSXNzdWVDb2RlLnRvb19iaWcsXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXhpbXVtOiBjaGVjay52YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwibnVtYmVyXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmNsdXNpdmU6IGNoZWNrLmluY2x1c2l2ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4YWN0OiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGNoZWNrLm1lc3NhZ2UsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBzdGF0dXMuZGlydHkoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChjaGVjay5raW5kID09PSBcIm11bHRpcGxlT2ZcIikge1xuICAgICAgICAgICAgICAgIGlmIChmbG9hdFNhZmVSZW1haW5kZXIoaW5wdXQuZGF0YSwgY2hlY2sudmFsdWUpICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGN0eCA9IHRoaXMuX2dldE9yUmV0dXJuQ3R4KGlucHV0LCBjdHgpO1xuICAgICAgICAgICAgICAgICAgICBhZGRJc3N1ZVRvQ29udGV4dChjdHgsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvZGU6IFpvZElzc3VlQ29kZS5ub3RfbXVsdGlwbGVfb2YsXG4gICAgICAgICAgICAgICAgICAgICAgICBtdWx0aXBsZU9mOiBjaGVjay52YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGNoZWNrLm1lc3NhZ2UsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBzdGF0dXMuZGlydHkoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChjaGVjay5raW5kID09PSBcImZpbml0ZVwiKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFOdW1iZXIuaXNGaW5pdGUoaW5wdXQuZGF0YSkpIHtcbiAgICAgICAgICAgICAgICAgICAgY3R4ID0gdGhpcy5fZ2V0T3JSZXR1cm5DdHgoaW5wdXQsIGN0eCk7XG4gICAgICAgICAgICAgICAgICAgIGFkZElzc3VlVG9Db250ZXh0KGN0eCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29kZTogWm9kSXNzdWVDb2RlLm5vdF9maW5pdGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBjaGVjay5tZXNzYWdlLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgc3RhdHVzLmRpcnR5KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdXRpbC5hc3NlcnROZXZlcihjaGVjayk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHsgc3RhdHVzOiBzdGF0dXMudmFsdWUsIHZhbHVlOiBpbnB1dC5kYXRhIH07XG4gICAgfVxuICAgIGd0ZSh2YWx1ZSwgbWVzc2FnZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5zZXRMaW1pdChcIm1pblwiLCB2YWx1ZSwgdHJ1ZSwgZXJyb3JVdGlsLnRvU3RyaW5nKG1lc3NhZ2UpKTtcbiAgICB9XG4gICAgZ3QodmFsdWUsIG1lc3NhZ2UpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2V0TGltaXQoXCJtaW5cIiwgdmFsdWUsIGZhbHNlLCBlcnJvclV0aWwudG9TdHJpbmcobWVzc2FnZSkpO1xuICAgIH1cbiAgICBsdGUodmFsdWUsIG1lc3NhZ2UpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2V0TGltaXQoXCJtYXhcIiwgdmFsdWUsIHRydWUsIGVycm9yVXRpbC50b1N0cmluZyhtZXNzYWdlKSk7XG4gICAgfVxuICAgIGx0KHZhbHVlLCBtZXNzYWdlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNldExpbWl0KFwibWF4XCIsIHZhbHVlLCBmYWxzZSwgZXJyb3JVdGlsLnRvU3RyaW5nKG1lc3NhZ2UpKTtcbiAgICB9XG4gICAgc2V0TGltaXQoa2luZCwgdmFsdWUsIGluY2x1c2l2ZSwgbWVzc2FnZSkge1xuICAgICAgICByZXR1cm4gbmV3IFpvZE51bWJlcih7XG4gICAgICAgICAgICAuLi50aGlzLl9kZWYsXG4gICAgICAgICAgICBjaGVja3M6IFtcbiAgICAgICAgICAgICAgICAuLi50aGlzLl9kZWYuY2hlY2tzLFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAga2luZCxcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUsXG4gICAgICAgICAgICAgICAgICAgIGluY2x1c2l2ZSxcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogZXJyb3JVdGlsLnRvU3RyaW5nKG1lc3NhZ2UpLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICB9KTtcbiAgICB9XG4gICAgX2FkZENoZWNrKGNoZWNrKSB7XG4gICAgICAgIHJldHVybiBuZXcgWm9kTnVtYmVyKHtcbiAgICAgICAgICAgIC4uLnRoaXMuX2RlZixcbiAgICAgICAgICAgIGNoZWNrczogWy4uLnRoaXMuX2RlZi5jaGVja3MsIGNoZWNrXSxcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGludChtZXNzYWdlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9hZGRDaGVjayh7XG4gICAgICAgICAgICBraW5kOiBcImludFwiLFxuICAgICAgICAgICAgbWVzc2FnZTogZXJyb3JVdGlsLnRvU3RyaW5nKG1lc3NhZ2UpLFxuICAgICAgICB9KTtcbiAgICB9XG4gICAgcG9zaXRpdmUobWVzc2FnZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fYWRkQ2hlY2soe1xuICAgICAgICAgICAga2luZDogXCJtaW5cIixcbiAgICAgICAgICAgIHZhbHVlOiAwLFxuICAgICAgICAgICAgaW5jbHVzaXZlOiBmYWxzZSxcbiAgICAgICAgICAgIG1lc3NhZ2U6IGVycm9yVXRpbC50b1N0cmluZyhtZXNzYWdlKSxcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIG5lZ2F0aXZlKG1lc3NhZ2UpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2FkZENoZWNrKHtcbiAgICAgICAgICAgIGtpbmQ6IFwibWF4XCIsXG4gICAgICAgICAgICB2YWx1ZTogMCxcbiAgICAgICAgICAgIGluY2x1c2l2ZTogZmFsc2UsXG4gICAgICAgICAgICBtZXNzYWdlOiBlcnJvclV0aWwudG9TdHJpbmcobWVzc2FnZSksXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBub25wb3NpdGl2ZShtZXNzYWdlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9hZGRDaGVjayh7XG4gICAgICAgICAgICBraW5kOiBcIm1heFwiLFxuICAgICAgICAgICAgdmFsdWU6IDAsXG4gICAgICAgICAgICBpbmNsdXNpdmU6IHRydWUsXG4gICAgICAgICAgICBtZXNzYWdlOiBlcnJvclV0aWwudG9TdHJpbmcobWVzc2FnZSksXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBub25uZWdhdGl2ZShtZXNzYWdlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9hZGRDaGVjayh7XG4gICAgICAgICAgICBraW5kOiBcIm1pblwiLFxuICAgICAgICAgICAgdmFsdWU6IDAsXG4gICAgICAgICAgICBpbmNsdXNpdmU6IHRydWUsXG4gICAgICAgICAgICBtZXNzYWdlOiBlcnJvclV0aWwudG9TdHJpbmcobWVzc2FnZSksXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBtdWx0aXBsZU9mKHZhbHVlLCBtZXNzYWdlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9hZGRDaGVjayh7XG4gICAgICAgICAgICBraW5kOiBcIm11bHRpcGxlT2ZcIixcbiAgICAgICAgICAgIHZhbHVlOiB2YWx1ZSxcbiAgICAgICAgICAgIG1lc3NhZ2U6IGVycm9yVXRpbC50b1N0cmluZyhtZXNzYWdlKSxcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGZpbml0ZShtZXNzYWdlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9hZGRDaGVjayh7XG4gICAgICAgICAgICBraW5kOiBcImZpbml0ZVwiLFxuICAgICAgICAgICAgbWVzc2FnZTogZXJyb3JVdGlsLnRvU3RyaW5nKG1lc3NhZ2UpLFxuICAgICAgICB9KTtcbiAgICB9XG4gICAgc2FmZShtZXNzYWdlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9hZGRDaGVjayh7XG4gICAgICAgICAgICBraW5kOiBcIm1pblwiLFxuICAgICAgICAgICAgaW5jbHVzaXZlOiB0cnVlLFxuICAgICAgICAgICAgdmFsdWU6IE51bWJlci5NSU5fU0FGRV9JTlRFR0VSLFxuICAgICAgICAgICAgbWVzc2FnZTogZXJyb3JVdGlsLnRvU3RyaW5nKG1lc3NhZ2UpLFxuICAgICAgICB9KS5fYWRkQ2hlY2soe1xuICAgICAgICAgICAga2luZDogXCJtYXhcIixcbiAgICAgICAgICAgIGluY2x1c2l2ZTogdHJ1ZSxcbiAgICAgICAgICAgIHZhbHVlOiBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUixcbiAgICAgICAgICAgIG1lc3NhZ2U6IGVycm9yVXRpbC50b1N0cmluZyhtZXNzYWdlKSxcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGdldCBtaW5WYWx1ZSgpIHtcbiAgICAgICAgbGV0IG1pbiA9IG51bGw7XG4gICAgICAgIGZvciAoY29uc3QgY2ggb2YgdGhpcy5fZGVmLmNoZWNrcykge1xuICAgICAgICAgICAgaWYgKGNoLmtpbmQgPT09IFwibWluXCIpIHtcbiAgICAgICAgICAgICAgICBpZiAobWluID09PSBudWxsIHx8IGNoLnZhbHVlID4gbWluKVxuICAgICAgICAgICAgICAgICAgICBtaW4gPSBjaC52YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbWluO1xuICAgIH1cbiAgICBnZXQgbWF4VmFsdWUoKSB7XG4gICAgICAgIGxldCBtYXggPSBudWxsO1xuICAgICAgICBmb3IgKGNvbnN0IGNoIG9mIHRoaXMuX2RlZi5jaGVja3MpIHtcbiAgICAgICAgICAgIGlmIChjaC5raW5kID09PSBcIm1heFwiKSB7XG4gICAgICAgICAgICAgICAgaWYgKG1heCA9PT0gbnVsbCB8fCBjaC52YWx1ZSA8IG1heClcbiAgICAgICAgICAgICAgICAgICAgbWF4ID0gY2gudmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG1heDtcbiAgICB9XG4gICAgZ2V0IGlzSW50KCkge1xuICAgICAgICByZXR1cm4gISF0aGlzLl9kZWYuY2hlY2tzLmZpbmQoKGNoKSA9PiBjaC5raW5kID09PSBcImludFwiIHx8IChjaC5raW5kID09PSBcIm11bHRpcGxlT2ZcIiAmJiB1dGlsLmlzSW50ZWdlcihjaC52YWx1ZSkpKTtcbiAgICB9XG4gICAgZ2V0IGlzRmluaXRlKCkge1xuICAgICAgICBsZXQgbWF4ID0gbnVsbDtcbiAgICAgICAgbGV0IG1pbiA9IG51bGw7XG4gICAgICAgIGZvciAoY29uc3QgY2ggb2YgdGhpcy5fZGVmLmNoZWNrcykge1xuICAgICAgICAgICAgaWYgKGNoLmtpbmQgPT09IFwiZmluaXRlXCIgfHwgY2gua2luZCA9PT0gXCJpbnRcIiB8fCBjaC5raW5kID09PSBcIm11bHRpcGxlT2ZcIikge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoY2gua2luZCA9PT0gXCJtaW5cIikge1xuICAgICAgICAgICAgICAgIGlmIChtaW4gPT09IG51bGwgfHwgY2gudmFsdWUgPiBtaW4pXG4gICAgICAgICAgICAgICAgICAgIG1pbiA9IGNoLnZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoY2gua2luZCA9PT0gXCJtYXhcIikge1xuICAgICAgICAgICAgICAgIGlmIChtYXggPT09IG51bGwgfHwgY2gudmFsdWUgPCBtYXgpXG4gICAgICAgICAgICAgICAgICAgIG1heCA9IGNoLnZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBOdW1iZXIuaXNGaW5pdGUobWluKSAmJiBOdW1iZXIuaXNGaW5pdGUobWF4KTtcbiAgICB9XG59XG5ab2ROdW1iZXIuY3JlYXRlID0gKHBhcmFtcykgPT4ge1xuICAgIHJldHVybiBuZXcgWm9kTnVtYmVyKHtcbiAgICAgICAgY2hlY2tzOiBbXSxcbiAgICAgICAgdHlwZU5hbWU6IFpvZEZpcnN0UGFydHlUeXBlS2luZC5ab2ROdW1iZXIsXG4gICAgICAgIGNvZXJjZTogcGFyYW1zPy5jb2VyY2UgfHwgZmFsc2UsXG4gICAgICAgIC4uLnByb2Nlc3NDcmVhdGVQYXJhbXMocGFyYW1zKSxcbiAgICB9KTtcbn07XG5leHBvcnQgY2xhc3MgWm9kQmlnSW50IGV4dGVuZHMgWm9kVHlwZSB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKC4uLmFyZ3VtZW50cyk7XG4gICAgICAgIHRoaXMubWluID0gdGhpcy5ndGU7XG4gICAgICAgIHRoaXMubWF4ID0gdGhpcy5sdGU7XG4gICAgfVxuICAgIF9wYXJzZShpbnB1dCkge1xuICAgICAgICBpZiAodGhpcy5fZGVmLmNvZXJjZSkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBpbnB1dC5kYXRhID0gQmlnSW50KGlucHV0LmRhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2gge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9nZXRJbnZhbGlkSW5wdXQoaW5wdXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHBhcnNlZFR5cGUgPSB0aGlzLl9nZXRUeXBlKGlucHV0KTtcbiAgICAgICAgaWYgKHBhcnNlZFR5cGUgIT09IFpvZFBhcnNlZFR5cGUuYmlnaW50KSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fZ2V0SW52YWxpZElucHV0KGlucHV0KTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgY3R4ID0gdW5kZWZpbmVkO1xuICAgICAgICBjb25zdCBzdGF0dXMgPSBuZXcgUGFyc2VTdGF0dXMoKTtcbiAgICAgICAgZm9yIChjb25zdCBjaGVjayBvZiB0aGlzLl9kZWYuY2hlY2tzKSB7XG4gICAgICAgICAgICBpZiAoY2hlY2sua2luZCA9PT0gXCJtaW5cIikge1xuICAgICAgICAgICAgICAgIGNvbnN0IHRvb1NtYWxsID0gY2hlY2suaW5jbHVzaXZlID8gaW5wdXQuZGF0YSA8IGNoZWNrLnZhbHVlIDogaW5wdXQuZGF0YSA8PSBjaGVjay52YWx1ZTtcbiAgICAgICAgICAgICAgICBpZiAodG9vU21hbGwpIHtcbiAgICAgICAgICAgICAgICAgICAgY3R4ID0gdGhpcy5fZ2V0T3JSZXR1cm5DdHgoaW5wdXQsIGN0eCk7XG4gICAgICAgICAgICAgICAgICAgIGFkZElzc3VlVG9Db250ZXh0KGN0eCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29kZTogWm9kSXNzdWVDb2RlLnRvb19zbWFsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiYmlnaW50XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBtaW5pbXVtOiBjaGVjay52YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGluY2x1c2l2ZTogY2hlY2suaW5jbHVzaXZlLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogY2hlY2subWVzc2FnZSxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHN0YXR1cy5kaXJ0eSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGNoZWNrLmtpbmQgPT09IFwibWF4XCIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB0b29CaWcgPSBjaGVjay5pbmNsdXNpdmUgPyBpbnB1dC5kYXRhID4gY2hlY2sudmFsdWUgOiBpbnB1dC5kYXRhID49IGNoZWNrLnZhbHVlO1xuICAgICAgICAgICAgICAgIGlmICh0b29CaWcpIHtcbiAgICAgICAgICAgICAgICAgICAgY3R4ID0gdGhpcy5fZ2V0T3JSZXR1cm5DdHgoaW5wdXQsIGN0eCk7XG4gICAgICAgICAgICAgICAgICAgIGFkZElzc3VlVG9Db250ZXh0KGN0eCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29kZTogWm9kSXNzdWVDb2RlLnRvb19iaWcsXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcImJpZ2ludFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWF4aW11bTogY2hlY2sudmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmNsdXNpdmU6IGNoZWNrLmluY2x1c2l2ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGNoZWNrLm1lc3NhZ2UsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBzdGF0dXMuZGlydHkoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChjaGVjay5raW5kID09PSBcIm11bHRpcGxlT2ZcIikge1xuICAgICAgICAgICAgICAgIGlmIChpbnB1dC5kYXRhICUgY2hlY2sudmFsdWUgIT09IEJpZ0ludCgwKSkge1xuICAgICAgICAgICAgICAgICAgICBjdHggPSB0aGlzLl9nZXRPclJldHVybkN0eChpbnB1dCwgY3R4KTtcbiAgICAgICAgICAgICAgICAgICAgYWRkSXNzdWVUb0NvbnRleHQoY3R4LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2RlOiBab2RJc3N1ZUNvZGUubm90X211bHRpcGxlX29mLFxuICAgICAgICAgICAgICAgICAgICAgICAgbXVsdGlwbGVPZjogY2hlY2sudmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBjaGVjay5tZXNzYWdlLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgc3RhdHVzLmRpcnR5KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdXRpbC5hc3NlcnROZXZlcihjaGVjayk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHsgc3RhdHVzOiBzdGF0dXMudmFsdWUsIHZhbHVlOiBpbnB1dC5kYXRhIH07XG4gICAgfVxuICAgIF9nZXRJbnZhbGlkSW5wdXQoaW5wdXQpIHtcbiAgICAgICAgY29uc3QgY3R4ID0gdGhpcy5fZ2V0T3JSZXR1cm5DdHgoaW5wdXQpO1xuICAgICAgICBhZGRJc3N1ZVRvQ29udGV4dChjdHgsIHtcbiAgICAgICAgICAgIGNvZGU6IFpvZElzc3VlQ29kZS5pbnZhbGlkX3R5cGUsXG4gICAgICAgICAgICBleHBlY3RlZDogWm9kUGFyc2VkVHlwZS5iaWdpbnQsXG4gICAgICAgICAgICByZWNlaXZlZDogY3R4LnBhcnNlZFR5cGUsXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gSU5WQUxJRDtcbiAgICB9XG4gICAgZ3RlKHZhbHVlLCBtZXNzYWdlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNldExpbWl0KFwibWluXCIsIHZhbHVlLCB0cnVlLCBlcnJvclV0aWwudG9TdHJpbmcobWVzc2FnZSkpO1xuICAgIH1cbiAgICBndCh2YWx1ZSwgbWVzc2FnZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5zZXRMaW1pdChcIm1pblwiLCB2YWx1ZSwgZmFsc2UsIGVycm9yVXRpbC50b1N0cmluZyhtZXNzYWdlKSk7XG4gICAgfVxuICAgIGx0ZSh2YWx1ZSwgbWVzc2FnZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5zZXRMaW1pdChcIm1heFwiLCB2YWx1ZSwgdHJ1ZSwgZXJyb3JVdGlsLnRvU3RyaW5nKG1lc3NhZ2UpKTtcbiAgICB9XG4gICAgbHQodmFsdWUsIG1lc3NhZ2UpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2V0TGltaXQoXCJtYXhcIiwgdmFsdWUsIGZhbHNlLCBlcnJvclV0aWwudG9TdHJpbmcobWVzc2FnZSkpO1xuICAgIH1cbiAgICBzZXRMaW1pdChraW5kLCB2YWx1ZSwgaW5jbHVzaXZlLCBtZXNzYWdlKSB7XG4gICAgICAgIHJldHVybiBuZXcgWm9kQmlnSW50KHtcbiAgICAgICAgICAgIC4uLnRoaXMuX2RlZixcbiAgICAgICAgICAgIGNoZWNrczogW1xuICAgICAgICAgICAgICAgIC4uLnRoaXMuX2RlZi5jaGVja3MsXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBraW5kLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgaW5jbHVzaXZlLFxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBlcnJvclV0aWwudG9TdHJpbmcobWVzc2FnZSksXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBfYWRkQ2hlY2soY2hlY2spIHtcbiAgICAgICAgcmV0dXJuIG5ldyBab2RCaWdJbnQoe1xuICAgICAgICAgICAgLi4udGhpcy5fZGVmLFxuICAgICAgICAgICAgY2hlY2tzOiBbLi4udGhpcy5fZGVmLmNoZWNrcywgY2hlY2tdLFxuICAgICAgICB9KTtcbiAgICB9XG4gICAgcG9zaXRpdmUobWVzc2FnZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fYWRkQ2hlY2soe1xuICAgICAgICAgICAga2luZDogXCJtaW5cIixcbiAgICAgICAgICAgIHZhbHVlOiBCaWdJbnQoMCksXG4gICAgICAgICAgICBpbmNsdXNpdmU6IGZhbHNlLFxuICAgICAgICAgICAgbWVzc2FnZTogZXJyb3JVdGlsLnRvU3RyaW5nKG1lc3NhZ2UpLFxuICAgICAgICB9KTtcbiAgICB9XG4gICAgbmVnYXRpdmUobWVzc2FnZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fYWRkQ2hlY2soe1xuICAgICAgICAgICAga2luZDogXCJtYXhcIixcbiAgICAgICAgICAgIHZhbHVlOiBCaWdJbnQoMCksXG4gICAgICAgICAgICBpbmNsdXNpdmU6IGZhbHNlLFxuICAgICAgICAgICAgbWVzc2FnZTogZXJyb3JVdGlsLnRvU3RyaW5nKG1lc3NhZ2UpLFxuICAgICAgICB9KTtcbiAgICB9XG4gICAgbm9ucG9zaXRpdmUobWVzc2FnZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fYWRkQ2hlY2soe1xuICAgICAgICAgICAga2luZDogXCJtYXhcIixcbiAgICAgICAgICAgIHZhbHVlOiBCaWdJbnQoMCksXG4gICAgICAgICAgICBpbmNsdXNpdmU6IHRydWUsXG4gICAgICAgICAgICBtZXNzYWdlOiBlcnJvclV0aWwudG9TdHJpbmcobWVzc2FnZSksXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBub25uZWdhdGl2ZShtZXNzYWdlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9hZGRDaGVjayh7XG4gICAgICAgICAgICBraW5kOiBcIm1pblwiLFxuICAgICAgICAgICAgdmFsdWU6IEJpZ0ludCgwKSxcbiAgICAgICAgICAgIGluY2x1c2l2ZTogdHJ1ZSxcbiAgICAgICAgICAgIG1lc3NhZ2U6IGVycm9yVXRpbC50b1N0cmluZyhtZXNzYWdlKSxcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIG11bHRpcGxlT2YodmFsdWUsIG1lc3NhZ2UpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2FkZENoZWNrKHtcbiAgICAgICAgICAgIGtpbmQ6IFwibXVsdGlwbGVPZlwiLFxuICAgICAgICAgICAgdmFsdWUsXG4gICAgICAgICAgICBtZXNzYWdlOiBlcnJvclV0aWwudG9TdHJpbmcobWVzc2FnZSksXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBnZXQgbWluVmFsdWUoKSB7XG4gICAgICAgIGxldCBtaW4gPSBudWxsO1xuICAgICAgICBmb3IgKGNvbnN0IGNoIG9mIHRoaXMuX2RlZi5jaGVja3MpIHtcbiAgICAgICAgICAgIGlmIChjaC5raW5kID09PSBcIm1pblwiKSB7XG4gICAgICAgICAgICAgICAgaWYgKG1pbiA9PT0gbnVsbCB8fCBjaC52YWx1ZSA+IG1pbilcbiAgICAgICAgICAgICAgICAgICAgbWluID0gY2gudmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG1pbjtcbiAgICB9XG4gICAgZ2V0IG1heFZhbHVlKCkge1xuICAgICAgICBsZXQgbWF4ID0gbnVsbDtcbiAgICAgICAgZm9yIChjb25zdCBjaCBvZiB0aGlzLl9kZWYuY2hlY2tzKSB7XG4gICAgICAgICAgICBpZiAoY2gua2luZCA9PT0gXCJtYXhcIikge1xuICAgICAgICAgICAgICAgIGlmIChtYXggPT09IG51bGwgfHwgY2gudmFsdWUgPCBtYXgpXG4gICAgICAgICAgICAgICAgICAgIG1heCA9IGNoLnZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtYXg7XG4gICAgfVxufVxuWm9kQmlnSW50LmNyZWF0ZSA9IChwYXJhbXMpID0+IHtcbiAgICByZXR1cm4gbmV3IFpvZEJpZ0ludCh7XG4gICAgICAgIGNoZWNrczogW10sXG4gICAgICAgIHR5cGVOYW1lOiBab2RGaXJzdFBhcnR5VHlwZUtpbmQuWm9kQmlnSW50LFxuICAgICAgICBjb2VyY2U6IHBhcmFtcz8uY29lcmNlID8/IGZhbHNlLFxuICAgICAgICAuLi5wcm9jZXNzQ3JlYXRlUGFyYW1zKHBhcmFtcyksXG4gICAgfSk7XG59O1xuZXhwb3J0IGNsYXNzIFpvZEJvb2xlYW4gZXh0ZW5kcyBab2RUeXBlIHtcbiAgICBfcGFyc2UoaW5wdXQpIHtcbiAgICAgICAgaWYgKHRoaXMuX2RlZi5jb2VyY2UpIHtcbiAgICAgICAgICAgIGlucHV0LmRhdGEgPSBCb29sZWFuKGlucHV0LmRhdGEpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHBhcnNlZFR5cGUgPSB0aGlzLl9nZXRUeXBlKGlucHV0KTtcbiAgICAgICAgaWYgKHBhcnNlZFR5cGUgIT09IFpvZFBhcnNlZFR5cGUuYm9vbGVhbikge1xuICAgICAgICAgICAgY29uc3QgY3R4ID0gdGhpcy5fZ2V0T3JSZXR1cm5DdHgoaW5wdXQpO1xuICAgICAgICAgICAgYWRkSXNzdWVUb0NvbnRleHQoY3R4LCB7XG4gICAgICAgICAgICAgICAgY29kZTogWm9kSXNzdWVDb2RlLmludmFsaWRfdHlwZSxcbiAgICAgICAgICAgICAgICBleHBlY3RlZDogWm9kUGFyc2VkVHlwZS5ib29sZWFuLFxuICAgICAgICAgICAgICAgIHJlY2VpdmVkOiBjdHgucGFyc2VkVHlwZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIElOVkFMSUQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIE9LKGlucHV0LmRhdGEpO1xuICAgIH1cbn1cblpvZEJvb2xlYW4uY3JlYXRlID0gKHBhcmFtcykgPT4ge1xuICAgIHJldHVybiBuZXcgWm9kQm9vbGVhbih7XG4gICAgICAgIHR5cGVOYW1lOiBab2RGaXJzdFBhcnR5VHlwZUtpbmQuWm9kQm9vbGVhbixcbiAgICAgICAgY29lcmNlOiBwYXJhbXM/LmNvZXJjZSB8fCBmYWxzZSxcbiAgICAgICAgLi4ucHJvY2Vzc0NyZWF0ZVBhcmFtcyhwYXJhbXMpLFxuICAgIH0pO1xufTtcbmV4cG9ydCBjbGFzcyBab2REYXRlIGV4dGVuZHMgWm9kVHlwZSB7XG4gICAgX3BhcnNlKGlucHV0KSB7XG4gICAgICAgIGlmICh0aGlzLl9kZWYuY29lcmNlKSB7XG4gICAgICAgICAgICBpbnB1dC5kYXRhID0gbmV3IERhdGUoaW5wdXQuZGF0YSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcGFyc2VkVHlwZSA9IHRoaXMuX2dldFR5cGUoaW5wdXQpO1xuICAgICAgICBpZiAocGFyc2VkVHlwZSAhPT0gWm9kUGFyc2VkVHlwZS5kYXRlKSB7XG4gICAgICAgICAgICBjb25zdCBjdHggPSB0aGlzLl9nZXRPclJldHVybkN0eChpbnB1dCk7XG4gICAgICAgICAgICBhZGRJc3N1ZVRvQ29udGV4dChjdHgsIHtcbiAgICAgICAgICAgICAgICBjb2RlOiBab2RJc3N1ZUNvZGUuaW52YWxpZF90eXBlLFxuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBab2RQYXJzZWRUeXBlLmRhdGUsXG4gICAgICAgICAgICAgICAgcmVjZWl2ZWQ6IGN0eC5wYXJzZWRUeXBlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gSU5WQUxJRDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoTnVtYmVyLmlzTmFOKGlucHV0LmRhdGEuZ2V0VGltZSgpKSkge1xuICAgICAgICAgICAgY29uc3QgY3R4ID0gdGhpcy5fZ2V0T3JSZXR1cm5DdHgoaW5wdXQpO1xuICAgICAgICAgICAgYWRkSXNzdWVUb0NvbnRleHQoY3R4LCB7XG4gICAgICAgICAgICAgICAgY29kZTogWm9kSXNzdWVDb2RlLmludmFsaWRfZGF0ZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIElOVkFMSUQ7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgc3RhdHVzID0gbmV3IFBhcnNlU3RhdHVzKCk7XG4gICAgICAgIGxldCBjdHggPSB1bmRlZmluZWQ7XG4gICAgICAgIGZvciAoY29uc3QgY2hlY2sgb2YgdGhpcy5fZGVmLmNoZWNrcykge1xuICAgICAgICAgICAgaWYgKGNoZWNrLmtpbmQgPT09IFwibWluXCIpIHtcbiAgICAgICAgICAgICAgICBpZiAoaW5wdXQuZGF0YS5nZXRUaW1lKCkgPCBjaGVjay52YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICBjdHggPSB0aGlzLl9nZXRPclJldHVybkN0eChpbnB1dCwgY3R4KTtcbiAgICAgICAgICAgICAgICAgICAgYWRkSXNzdWVUb0NvbnRleHQoY3R4LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2RlOiBab2RJc3N1ZUNvZGUudG9vX3NtYWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogY2hlY2subWVzc2FnZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGluY2x1c2l2ZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4YWN0OiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1pbmltdW06IGNoZWNrLnZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJkYXRlXCIsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBzdGF0dXMuZGlydHkoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChjaGVjay5raW5kID09PSBcIm1heFwiKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlucHV0LmRhdGEuZ2V0VGltZSgpID4gY2hlY2sudmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgY3R4ID0gdGhpcy5fZ2V0T3JSZXR1cm5DdHgoaW5wdXQsIGN0eCk7XG4gICAgICAgICAgICAgICAgICAgIGFkZElzc3VlVG9Db250ZXh0KGN0eCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29kZTogWm9kSXNzdWVDb2RlLnRvb19iaWcsXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBjaGVjay5tZXNzYWdlLFxuICAgICAgICAgICAgICAgICAgICAgICAgaW5jbHVzaXZlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXhhY3Q6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWF4aW11bTogY2hlY2sudmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcImRhdGVcIixcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHN0YXR1cy5kaXJ0eSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHV0aWwuYXNzZXJ0TmV2ZXIoY2hlY2spO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdGF0dXM6IHN0YXR1cy52YWx1ZSxcbiAgICAgICAgICAgIHZhbHVlOiBuZXcgRGF0ZShpbnB1dC5kYXRhLmdldFRpbWUoKSksXG4gICAgICAgIH07XG4gICAgfVxuICAgIF9hZGRDaGVjayhjaGVjaykge1xuICAgICAgICByZXR1cm4gbmV3IFpvZERhdGUoe1xuICAgICAgICAgICAgLi4udGhpcy5fZGVmLFxuICAgICAgICAgICAgY2hlY2tzOiBbLi4udGhpcy5fZGVmLmNoZWNrcywgY2hlY2tdLFxuICAgICAgICB9KTtcbiAgICB9XG4gICAgbWluKG1pbkRhdGUsIG1lc3NhZ2UpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2FkZENoZWNrKHtcbiAgICAgICAgICAgIGtpbmQ6IFwibWluXCIsXG4gICAgICAgICAgICB2YWx1ZTogbWluRGF0ZS5nZXRUaW1lKCksXG4gICAgICAgICAgICBtZXNzYWdlOiBlcnJvclV0aWwudG9TdHJpbmcobWVzc2FnZSksXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBtYXgobWF4RGF0ZSwgbWVzc2FnZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fYWRkQ2hlY2soe1xuICAgICAgICAgICAga2luZDogXCJtYXhcIixcbiAgICAgICAgICAgIHZhbHVlOiBtYXhEYXRlLmdldFRpbWUoKSxcbiAgICAgICAgICAgIG1lc3NhZ2U6IGVycm9yVXRpbC50b1N0cmluZyhtZXNzYWdlKSxcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGdldCBtaW5EYXRlKCkge1xuICAgICAgICBsZXQgbWluID0gbnVsbDtcbiAgICAgICAgZm9yIChjb25zdCBjaCBvZiB0aGlzLl9kZWYuY2hlY2tzKSB7XG4gICAgICAgICAgICBpZiAoY2gua2luZCA9PT0gXCJtaW5cIikge1xuICAgICAgICAgICAgICAgIGlmIChtaW4gPT09IG51bGwgfHwgY2gudmFsdWUgPiBtaW4pXG4gICAgICAgICAgICAgICAgICAgIG1pbiA9IGNoLnZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtaW4gIT0gbnVsbCA/IG5ldyBEYXRlKG1pbikgOiBudWxsO1xuICAgIH1cbiAgICBnZXQgbWF4RGF0ZSgpIHtcbiAgICAgICAgbGV0IG1heCA9IG51bGw7XG4gICAgICAgIGZvciAoY29uc3QgY2ggb2YgdGhpcy5fZGVmLmNoZWNrcykge1xuICAgICAgICAgICAgaWYgKGNoLmtpbmQgPT09IFwibWF4XCIpIHtcbiAgICAgICAgICAgICAgICBpZiAobWF4ID09PSBudWxsIHx8IGNoLnZhbHVlIDwgbWF4KVxuICAgICAgICAgICAgICAgICAgICBtYXggPSBjaC52YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbWF4ICE9IG51bGwgPyBuZXcgRGF0ZShtYXgpIDogbnVsbDtcbiAgICB9XG59XG5ab2REYXRlLmNyZWF0ZSA9IChwYXJhbXMpID0+IHtcbiAgICByZXR1cm4gbmV3IFpvZERhdGUoe1xuICAgICAgICBjaGVja3M6IFtdLFxuICAgICAgICBjb2VyY2U6IHBhcmFtcz8uY29lcmNlIHx8IGZhbHNlLFxuICAgICAgICB0eXBlTmFtZTogWm9kRmlyc3RQYXJ0eVR5cGVLaW5kLlpvZERhdGUsXG4gICAgICAgIC4uLnByb2Nlc3NDcmVhdGVQYXJhbXMocGFyYW1zKSxcbiAgICB9KTtcbn07XG5leHBvcnQgY2xhc3MgWm9kU3ltYm9sIGV4dGVuZHMgWm9kVHlwZSB7XG4gICAgX3BhcnNlKGlucHV0KSB7XG4gICAgICAgIGNvbnN0IHBhcnNlZFR5cGUgPSB0aGlzLl9nZXRUeXBlKGlucHV0KTtcbiAgICAgICAgaWYgKHBhcnNlZFR5cGUgIT09IFpvZFBhcnNlZFR5cGUuc3ltYm9sKSB7XG4gICAgICAgICAgICBjb25zdCBjdHggPSB0aGlzLl9nZXRPclJldHVybkN0eChpbnB1dCk7XG4gICAgICAgICAgICBhZGRJc3N1ZVRvQ29udGV4dChjdHgsIHtcbiAgICAgICAgICAgICAgICBjb2RlOiBab2RJc3N1ZUNvZGUuaW52YWxpZF90eXBlLFxuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBab2RQYXJzZWRUeXBlLnN5bWJvbCxcbiAgICAgICAgICAgICAgICByZWNlaXZlZDogY3R4LnBhcnNlZFR5cGUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBJTlZBTElEO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBPSyhpbnB1dC5kYXRhKTtcbiAgICB9XG59XG5ab2RTeW1ib2wuY3JlYXRlID0gKHBhcmFtcykgPT4ge1xuICAgIHJldHVybiBuZXcgWm9kU3ltYm9sKHtcbiAgICAgICAgdHlwZU5hbWU6IFpvZEZpcnN0UGFydHlUeXBlS2luZC5ab2RTeW1ib2wsXG4gICAgICAgIC4uLnByb2Nlc3NDcmVhdGVQYXJhbXMocGFyYW1zKSxcbiAgICB9KTtcbn07XG5leHBvcnQgY2xhc3MgWm9kVW5kZWZpbmVkIGV4dGVuZHMgWm9kVHlwZSB7XG4gICAgX3BhcnNlKGlucHV0KSB7XG4gICAgICAgIGNvbnN0IHBhcnNlZFR5cGUgPSB0aGlzLl9nZXRUeXBlKGlucHV0KTtcbiAgICAgICAgaWYgKHBhcnNlZFR5cGUgIT09IFpvZFBhcnNlZFR5cGUudW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBjb25zdCBjdHggPSB0aGlzLl9nZXRPclJldHVybkN0eChpbnB1dCk7XG4gICAgICAgICAgICBhZGRJc3N1ZVRvQ29udGV4dChjdHgsIHtcbiAgICAgICAgICAgICAgICBjb2RlOiBab2RJc3N1ZUNvZGUuaW52YWxpZF90eXBlLFxuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBab2RQYXJzZWRUeXBlLnVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICByZWNlaXZlZDogY3R4LnBhcnNlZFR5cGUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBJTlZBTElEO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBPSyhpbnB1dC5kYXRhKTtcbiAgICB9XG59XG5ab2RVbmRlZmluZWQuY3JlYXRlID0gKHBhcmFtcykgPT4ge1xuICAgIHJldHVybiBuZXcgWm9kVW5kZWZpbmVkKHtcbiAgICAgICAgdHlwZU5hbWU6IFpvZEZpcnN0UGFydHlUeXBlS2luZC5ab2RVbmRlZmluZWQsXG4gICAgICAgIC4uLnByb2Nlc3NDcmVhdGVQYXJhbXMocGFyYW1zKSxcbiAgICB9KTtcbn07XG5leHBvcnQgY2xhc3MgWm9kTnVsbCBleHRlbmRzIFpvZFR5cGUge1xuICAgIF9wYXJzZShpbnB1dCkge1xuICAgICAgICBjb25zdCBwYXJzZWRUeXBlID0gdGhpcy5fZ2V0VHlwZShpbnB1dCk7XG4gICAgICAgIGlmIChwYXJzZWRUeXBlICE9PSBab2RQYXJzZWRUeXBlLm51bGwpIHtcbiAgICAgICAgICAgIGNvbnN0IGN0eCA9IHRoaXMuX2dldE9yUmV0dXJuQ3R4KGlucHV0KTtcbiAgICAgICAgICAgIGFkZElzc3VlVG9Db250ZXh0KGN0eCwge1xuICAgICAgICAgICAgICAgIGNvZGU6IFpvZElzc3VlQ29kZS5pbnZhbGlkX3R5cGUsXG4gICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFpvZFBhcnNlZFR5cGUubnVsbCxcbiAgICAgICAgICAgICAgICByZWNlaXZlZDogY3R4LnBhcnNlZFR5cGUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBJTlZBTElEO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBPSyhpbnB1dC5kYXRhKTtcbiAgICB9XG59XG5ab2ROdWxsLmNyZWF0ZSA9IChwYXJhbXMpID0+IHtcbiAgICByZXR1cm4gbmV3IFpvZE51bGwoe1xuICAgICAgICB0eXBlTmFtZTogWm9kRmlyc3RQYXJ0eVR5cGVLaW5kLlpvZE51bGwsXG4gICAgICAgIC4uLnByb2Nlc3NDcmVhdGVQYXJhbXMocGFyYW1zKSxcbiAgICB9KTtcbn07XG5leHBvcnQgY2xhc3MgWm9kQW55IGV4dGVuZHMgWm9kVHlwZSB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKC4uLmFyZ3VtZW50cyk7XG4gICAgICAgIC8vIHRvIHByZXZlbnQgaW5zdGFuY2VzIG9mIG90aGVyIGNsYXNzZXMgZnJvbSBleHRlbmRpbmcgWm9kQW55LiB0aGlzIGNhdXNlcyBpc3N1ZXMgd2l0aCBjYXRjaGFsbCBpbiBab2RPYmplY3QuXG4gICAgICAgIHRoaXMuX2FueSA9IHRydWU7XG4gICAgfVxuICAgIF9wYXJzZShpbnB1dCkge1xuICAgICAgICByZXR1cm4gT0soaW5wdXQuZGF0YSk7XG4gICAgfVxufVxuWm9kQW55LmNyZWF0ZSA9IChwYXJhbXMpID0+IHtcbiAgICByZXR1cm4gbmV3IFpvZEFueSh7XG4gICAgICAgIHR5cGVOYW1lOiBab2RGaXJzdFBhcnR5VHlwZUtpbmQuWm9kQW55LFxuICAgICAgICAuLi5wcm9jZXNzQ3JlYXRlUGFyYW1zKHBhcmFtcyksXG4gICAgfSk7XG59O1xuZXhwb3J0IGNsYXNzIFpvZFVua25vd24gZXh0ZW5kcyBab2RUeXBlIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoLi4uYXJndW1lbnRzKTtcbiAgICAgICAgLy8gcmVxdWlyZWRcbiAgICAgICAgdGhpcy5fdW5rbm93biA9IHRydWU7XG4gICAgfVxuICAgIF9wYXJzZShpbnB1dCkge1xuICAgICAgICByZXR1cm4gT0soaW5wdXQuZGF0YSk7XG4gICAgfVxufVxuWm9kVW5rbm93bi5jcmVhdGUgPSAocGFyYW1zKSA9PiB7XG4gICAgcmV0dXJuIG5ldyBab2RVbmtub3duKHtcbiAgICAgICAgdHlwZU5hbWU6IFpvZEZpcnN0UGFydHlUeXBlS2luZC5ab2RVbmtub3duLFxuICAgICAgICAuLi5wcm9jZXNzQ3JlYXRlUGFyYW1zKHBhcmFtcyksXG4gICAgfSk7XG59O1xuZXhwb3J0IGNsYXNzIFpvZE5ldmVyIGV4dGVuZHMgWm9kVHlwZSB7XG4gICAgX3BhcnNlKGlucHV0KSB7XG4gICAgICAgIGNvbnN0IGN0eCA9IHRoaXMuX2dldE9yUmV0dXJuQ3R4KGlucHV0KTtcbiAgICAgICAgYWRkSXNzdWVUb0NvbnRleHQoY3R4LCB7XG4gICAgICAgICAgICBjb2RlOiBab2RJc3N1ZUNvZGUuaW52YWxpZF90eXBlLFxuICAgICAgICAgICAgZXhwZWN0ZWQ6IFpvZFBhcnNlZFR5cGUubmV2ZXIsXG4gICAgICAgICAgICByZWNlaXZlZDogY3R4LnBhcnNlZFR5cGUsXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gSU5WQUxJRDtcbiAgICB9XG59XG5ab2ROZXZlci5jcmVhdGUgPSAocGFyYW1zKSA9PiB7XG4gICAgcmV0dXJuIG5ldyBab2ROZXZlcih7XG4gICAgICAgIHR5cGVOYW1lOiBab2RGaXJzdFBhcnR5VHlwZUtpbmQuWm9kTmV2ZXIsXG4gICAgICAgIC4uLnByb2Nlc3NDcmVhdGVQYXJhbXMocGFyYW1zKSxcbiAgICB9KTtcbn07XG5leHBvcnQgY2xhc3MgWm9kVm9pZCBleHRlbmRzIFpvZFR5cGUge1xuICAgIF9wYXJzZShpbnB1dCkge1xuICAgICAgICBjb25zdCBwYXJzZWRUeXBlID0gdGhpcy5fZ2V0VHlwZShpbnB1dCk7XG4gICAgICAgIGlmIChwYXJzZWRUeXBlICE9PSBab2RQYXJzZWRUeXBlLnVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY29uc3QgY3R4ID0gdGhpcy5fZ2V0T3JSZXR1cm5DdHgoaW5wdXQpO1xuICAgICAgICAgICAgYWRkSXNzdWVUb0NvbnRleHQoY3R4LCB7XG4gICAgICAgICAgICAgICAgY29kZTogWm9kSXNzdWVDb2RlLmludmFsaWRfdHlwZSxcbiAgICAgICAgICAgICAgICBleHBlY3RlZDogWm9kUGFyc2VkVHlwZS52b2lkLFxuICAgICAgICAgICAgICAgIHJlY2VpdmVkOiBjdHgucGFyc2VkVHlwZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIElOVkFMSUQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIE9LKGlucHV0LmRhdGEpO1xuICAgIH1cbn1cblpvZFZvaWQuY3JlYXRlID0gKHBhcmFtcykgPT4ge1xuICAgIHJldHVybiBuZXcgWm9kVm9pZCh7XG4gICAgICAgIHR5cGVOYW1lOiBab2RGaXJzdFBhcnR5VHlwZUtpbmQuWm9kVm9pZCxcbiAgICAgICAgLi4ucHJvY2Vzc0NyZWF0ZVBhcmFtcyhwYXJhbXMpLFxuICAgIH0pO1xufTtcbmV4cG9ydCBjbGFzcyBab2RBcnJheSBleHRlbmRzIFpvZFR5cGUge1xuICAgIF9wYXJzZShpbnB1dCkge1xuICAgICAgICBjb25zdCB7IGN0eCwgc3RhdHVzIH0gPSB0aGlzLl9wcm9jZXNzSW5wdXRQYXJhbXMoaW5wdXQpO1xuICAgICAgICBjb25zdCBkZWYgPSB0aGlzLl9kZWY7XG4gICAgICAgIGlmIChjdHgucGFyc2VkVHlwZSAhPT0gWm9kUGFyc2VkVHlwZS5hcnJheSkge1xuICAgICAgICAgICAgYWRkSXNzdWVUb0NvbnRleHQoY3R4LCB7XG4gICAgICAgICAgICAgICAgY29kZTogWm9kSXNzdWVDb2RlLmludmFsaWRfdHlwZSxcbiAgICAgICAgICAgICAgICBleHBlY3RlZDogWm9kUGFyc2VkVHlwZS5hcnJheSxcbiAgICAgICAgICAgICAgICByZWNlaXZlZDogY3R4LnBhcnNlZFR5cGUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBJTlZBTElEO1xuICAgICAgICB9XG4gICAgICAgIGlmIChkZWYuZXhhY3RMZW5ndGggIT09IG51bGwpIHtcbiAgICAgICAgICAgIGNvbnN0IHRvb0JpZyA9IGN0eC5kYXRhLmxlbmd0aCA+IGRlZi5leGFjdExlbmd0aC52YWx1ZTtcbiAgICAgICAgICAgIGNvbnN0IHRvb1NtYWxsID0gY3R4LmRhdGEubGVuZ3RoIDwgZGVmLmV4YWN0TGVuZ3RoLnZhbHVlO1xuICAgICAgICAgICAgaWYgKHRvb0JpZyB8fCB0b29TbWFsbCkge1xuICAgICAgICAgICAgICAgIGFkZElzc3VlVG9Db250ZXh0KGN0eCwge1xuICAgICAgICAgICAgICAgICAgICBjb2RlOiB0b29CaWcgPyBab2RJc3N1ZUNvZGUudG9vX2JpZyA6IFpvZElzc3VlQ29kZS50b29fc21hbGwsXG4gICAgICAgICAgICAgICAgICAgIG1pbmltdW06ICh0b29TbWFsbCA/IGRlZi5leGFjdExlbmd0aC52YWx1ZSA6IHVuZGVmaW5lZCksXG4gICAgICAgICAgICAgICAgICAgIG1heGltdW06ICh0b29CaWcgPyBkZWYuZXhhY3RMZW5ndGgudmFsdWUgOiB1bmRlZmluZWQpLFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcImFycmF5XCIsXG4gICAgICAgICAgICAgICAgICAgIGluY2x1c2l2ZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgZXhhY3Q6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGRlZi5leGFjdExlbmd0aC5tZXNzYWdlLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHN0YXR1cy5kaXJ0eSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChkZWYubWluTGVuZ3RoICE9PSBudWxsKSB7XG4gICAgICAgICAgICBpZiAoY3R4LmRhdGEubGVuZ3RoIDwgZGVmLm1pbkxlbmd0aC52YWx1ZSkge1xuICAgICAgICAgICAgICAgIGFkZElzc3VlVG9Db250ZXh0KGN0eCwge1xuICAgICAgICAgICAgICAgICAgICBjb2RlOiBab2RJc3N1ZUNvZGUudG9vX3NtYWxsLFxuICAgICAgICAgICAgICAgICAgICBtaW5pbXVtOiBkZWYubWluTGVuZ3RoLnZhbHVlLFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcImFycmF5XCIsXG4gICAgICAgICAgICAgICAgICAgIGluY2x1c2l2ZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgZXhhY3Q6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBkZWYubWluTGVuZ3RoLm1lc3NhZ2UsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgc3RhdHVzLmRpcnR5KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRlZi5tYXhMZW5ndGggIT09IG51bGwpIHtcbiAgICAgICAgICAgIGlmIChjdHguZGF0YS5sZW5ndGggPiBkZWYubWF4TGVuZ3RoLnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgYWRkSXNzdWVUb0NvbnRleHQoY3R4LCB7XG4gICAgICAgICAgICAgICAgICAgIGNvZGU6IFpvZElzc3VlQ29kZS50b29fYmlnLFxuICAgICAgICAgICAgICAgICAgICBtYXhpbXVtOiBkZWYubWF4TGVuZ3RoLnZhbHVlLFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcImFycmF5XCIsXG4gICAgICAgICAgICAgICAgICAgIGluY2x1c2l2ZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgZXhhY3Q6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBkZWYubWF4TGVuZ3RoLm1lc3NhZ2UsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgc3RhdHVzLmRpcnR5KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGN0eC5jb21tb24uYXN5bmMpIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLmFsbChbLi4uY3R4LmRhdGFdLm1hcCgoaXRlbSwgaSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBkZWYudHlwZS5fcGFyc2VBc3luYyhuZXcgUGFyc2VJbnB1dExhenlQYXRoKGN0eCwgaXRlbSwgY3R4LnBhdGgsIGkpKTtcbiAgICAgICAgICAgIH0pKS50aGVuKChyZXN1bHQpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gUGFyc2VTdGF0dXMubWVyZ2VBcnJheShzdGF0dXMsIHJlc3VsdCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCByZXN1bHQgPSBbLi4uY3R4LmRhdGFdLm1hcCgoaXRlbSwgaSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGRlZi50eXBlLl9wYXJzZVN5bmMobmV3IFBhcnNlSW5wdXRMYXp5UGF0aChjdHgsIGl0ZW0sIGN0eC5wYXRoLCBpKSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gUGFyc2VTdGF0dXMubWVyZ2VBcnJheShzdGF0dXMsIHJlc3VsdCk7XG4gICAgfVxuICAgIGdldCBlbGVtZW50KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZGVmLnR5cGU7XG4gICAgfVxuICAgIG1pbihtaW5MZW5ndGgsIG1lc3NhZ2UpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBab2RBcnJheSh7XG4gICAgICAgICAgICAuLi50aGlzLl9kZWYsXG4gICAgICAgICAgICBtaW5MZW5ndGg6IHsgdmFsdWU6IG1pbkxlbmd0aCwgbWVzc2FnZTogZXJyb3JVdGlsLnRvU3RyaW5nKG1lc3NhZ2UpIH0sXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBtYXgobWF4TGVuZ3RoLCBtZXNzYWdlKSB7XG4gICAgICAgIHJldHVybiBuZXcgWm9kQXJyYXkoe1xuICAgICAgICAgICAgLi4udGhpcy5fZGVmLFxuICAgICAgICAgICAgbWF4TGVuZ3RoOiB7IHZhbHVlOiBtYXhMZW5ndGgsIG1lc3NhZ2U6IGVycm9yVXRpbC50b1N0cmluZyhtZXNzYWdlKSB9LFxuICAgICAgICB9KTtcbiAgICB9XG4gICAgbGVuZ3RoKGxlbiwgbWVzc2FnZSkge1xuICAgICAgICByZXR1cm4gbmV3IFpvZEFycmF5KHtcbiAgICAgICAgICAgIC4uLnRoaXMuX2RlZixcbiAgICAgICAgICAgIGV4YWN0TGVuZ3RoOiB7IHZhbHVlOiBsZW4sIG1lc3NhZ2U6IGVycm9yVXRpbC50b1N0cmluZyhtZXNzYWdlKSB9LFxuICAgICAgICB9KTtcbiAgICB9XG4gICAgbm9uZW1wdHkobWVzc2FnZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5taW4oMSwgbWVzc2FnZSk7XG4gICAgfVxufVxuWm9kQXJyYXkuY3JlYXRlID0gKHNjaGVtYSwgcGFyYW1zKSA9PiB7XG4gICAgcmV0dXJuIG5ldyBab2RBcnJheSh7XG4gICAgICAgIHR5cGU6IHNjaGVtYSxcbiAgICAgICAgbWluTGVuZ3RoOiBudWxsLFxuICAgICAgICBtYXhMZW5ndGg6IG51bGwsXG4gICAgICAgIGV4YWN0TGVuZ3RoOiBudWxsLFxuICAgICAgICB0eXBlTmFtZTogWm9kRmlyc3RQYXJ0eVR5cGVLaW5kLlpvZEFycmF5LFxuICAgICAgICAuLi5wcm9jZXNzQ3JlYXRlUGFyYW1zKHBhcmFtcyksXG4gICAgfSk7XG59O1xuZnVuY3Rpb24gZGVlcFBhcnRpYWxpZnkoc2NoZW1hKSB7XG4gICAgaWYgKHNjaGVtYSBpbnN0YW5jZW9mIFpvZE9iamVjdCkge1xuICAgICAgICBjb25zdCBuZXdTaGFwZSA9IHt9O1xuICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBzY2hlbWEuc2hhcGUpIHtcbiAgICAgICAgICAgIGNvbnN0IGZpZWxkU2NoZW1hID0gc2NoZW1hLnNoYXBlW2tleV07XG4gICAgICAgICAgICBuZXdTaGFwZVtrZXldID0gWm9kT3B0aW9uYWwuY3JlYXRlKGRlZXBQYXJ0aWFsaWZ5KGZpZWxkU2NoZW1hKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ldyBab2RPYmplY3Qoe1xuICAgICAgICAgICAgLi4uc2NoZW1hLl9kZWYsXG4gICAgICAgICAgICBzaGFwZTogKCkgPT4gbmV3U2hhcGUsXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBlbHNlIGlmIChzY2hlbWEgaW5zdGFuY2VvZiBab2RBcnJheSkge1xuICAgICAgICByZXR1cm4gbmV3IFpvZEFycmF5KHtcbiAgICAgICAgICAgIC4uLnNjaGVtYS5fZGVmLFxuICAgICAgICAgICAgdHlwZTogZGVlcFBhcnRpYWxpZnkoc2NoZW1hLmVsZW1lbnQpLFxuICAgICAgICB9KTtcbiAgICB9XG4gICAgZWxzZSBpZiAoc2NoZW1hIGluc3RhbmNlb2YgWm9kT3B0aW9uYWwpIHtcbiAgICAgICAgcmV0dXJuIFpvZE9wdGlvbmFsLmNyZWF0ZShkZWVwUGFydGlhbGlmeShzY2hlbWEudW53cmFwKCkpKTtcbiAgICB9XG4gICAgZWxzZSBpZiAoc2NoZW1hIGluc3RhbmNlb2YgWm9kTnVsbGFibGUpIHtcbiAgICAgICAgcmV0dXJuIFpvZE51bGxhYmxlLmNyZWF0ZShkZWVwUGFydGlhbGlmeShzY2hlbWEudW53cmFwKCkpKTtcbiAgICB9XG4gICAgZWxzZSBpZiAoc2NoZW1hIGluc3RhbmNlb2YgWm9kVHVwbGUpIHtcbiAgICAgICAgcmV0dXJuIFpvZFR1cGxlLmNyZWF0ZShzY2hlbWEuaXRlbXMubWFwKChpdGVtKSA9PiBkZWVwUGFydGlhbGlmeShpdGVtKSkpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHNjaGVtYTtcbiAgICB9XG59XG5leHBvcnQgY2xhc3MgWm9kT2JqZWN0IGV4dGVuZHMgWm9kVHlwZSB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKC4uLmFyZ3VtZW50cyk7XG4gICAgICAgIHRoaXMuX2NhY2hlZCA9IG51bGw7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAZGVwcmVjYXRlZCBJbiBtb3N0IGNhc2VzLCB0aGlzIGlzIG5vIGxvbmdlciBuZWVkZWQgLSB1bmtub3duIHByb3BlcnRpZXMgYXJlIG5vdyBzaWxlbnRseSBzdHJpcHBlZC5cbiAgICAgICAgICogSWYgeW91IHdhbnQgdG8gcGFzcyB0aHJvdWdoIHVua25vd24gcHJvcGVydGllcywgdXNlIGAucGFzc3Rocm91Z2goKWAgaW5zdGVhZC5cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMubm9uc3RyaWN0ID0gdGhpcy5wYXNzdGhyb3VnaDtcbiAgICAgICAgLy8gZXh0ZW5kPFxuICAgICAgICAvLyAgIEF1Z21lbnRhdGlvbiBleHRlbmRzIFpvZFJhd1NoYXBlLFxuICAgICAgICAvLyAgIE5ld091dHB1dCBleHRlbmRzIHV0aWwuZmxhdHRlbjx7XG4gICAgICAgIC8vICAgICBbayBpbiBrZXlvZiBBdWdtZW50YXRpb24gfCBrZXlvZiBPdXRwdXRdOiBrIGV4dGVuZHMga2V5b2YgQXVnbWVudGF0aW9uXG4gICAgICAgIC8vICAgICAgID8gQXVnbWVudGF0aW9uW2tdW1wiX291dHB1dFwiXVxuICAgICAgICAvLyAgICAgICA6IGsgZXh0ZW5kcyBrZXlvZiBPdXRwdXRcbiAgICAgICAgLy8gICAgICAgPyBPdXRwdXRba11cbiAgICAgICAgLy8gICAgICAgOiBuZXZlcjtcbiAgICAgICAgLy8gICB9PixcbiAgICAgICAgLy8gICBOZXdJbnB1dCBleHRlbmRzIHV0aWwuZmxhdHRlbjx7XG4gICAgICAgIC8vICAgICBbayBpbiBrZXlvZiBBdWdtZW50YXRpb24gfCBrZXlvZiBJbnB1dF06IGsgZXh0ZW5kcyBrZXlvZiBBdWdtZW50YXRpb25cbiAgICAgICAgLy8gICAgICAgPyBBdWdtZW50YXRpb25ba11bXCJfaW5wdXRcIl1cbiAgICAgICAgLy8gICAgICAgOiBrIGV4dGVuZHMga2V5b2YgSW5wdXRcbiAgICAgICAgLy8gICAgICAgPyBJbnB1dFtrXVxuICAgICAgICAvLyAgICAgICA6IG5ldmVyO1xuICAgICAgICAvLyAgIH0+XG4gICAgICAgIC8vID4oXG4gICAgICAgIC8vICAgYXVnbWVudGF0aW9uOiBBdWdtZW50YXRpb25cbiAgICAgICAgLy8gKTogWm9kT2JqZWN0PFxuICAgICAgICAvLyAgIGV4dGVuZFNoYXBlPFQsIEF1Z21lbnRhdGlvbj4sXG4gICAgICAgIC8vICAgVW5rbm93bktleXMsXG4gICAgICAgIC8vICAgQ2F0Y2hhbGwsXG4gICAgICAgIC8vICAgTmV3T3V0cHV0LFxuICAgICAgICAvLyAgIE5ld0lucHV0XG4gICAgICAgIC8vID4ge1xuICAgICAgICAvLyAgIHJldHVybiBuZXcgWm9kT2JqZWN0KHtcbiAgICAgICAgLy8gICAgIC4uLnRoaXMuX2RlZixcbiAgICAgICAgLy8gICAgIHNoYXBlOiAoKSA9PiAoe1xuICAgICAgICAvLyAgICAgICAuLi50aGlzLl9kZWYuc2hhcGUoKSxcbiAgICAgICAgLy8gICAgICAgLi4uYXVnbWVudGF0aW9uLFxuICAgICAgICAvLyAgICAgfSksXG4gICAgICAgIC8vICAgfSkgYXMgYW55O1xuICAgICAgICAvLyB9XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAZGVwcmVjYXRlZCBVc2UgYC5leHRlbmRgIGluc3RlYWRcbiAgICAgICAgICogICovXG4gICAgICAgIHRoaXMuYXVnbWVudCA9IHRoaXMuZXh0ZW5kO1xuICAgIH1cbiAgICBfZ2V0Q2FjaGVkKCkge1xuICAgICAgICBpZiAodGhpcy5fY2FjaGVkICE9PSBudWxsKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2NhY2hlZDtcbiAgICAgICAgY29uc3Qgc2hhcGUgPSB0aGlzLl9kZWYuc2hhcGUoKTtcbiAgICAgICAgY29uc3Qga2V5cyA9IHV0aWwub2JqZWN0S2V5cyhzaGFwZSk7XG4gICAgICAgIHRoaXMuX2NhY2hlZCA9IHsgc2hhcGUsIGtleXMgfTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NhY2hlZDtcbiAgICB9XG4gICAgX3BhcnNlKGlucHV0KSB7XG4gICAgICAgIGNvbnN0IHBhcnNlZFR5cGUgPSB0aGlzLl9nZXRUeXBlKGlucHV0KTtcbiAgICAgICAgaWYgKHBhcnNlZFR5cGUgIT09IFpvZFBhcnNlZFR5cGUub2JqZWN0KSB7XG4gICAgICAgICAgICBjb25zdCBjdHggPSB0aGlzLl9nZXRPclJldHVybkN0eChpbnB1dCk7XG4gICAgICAgICAgICBhZGRJc3N1ZVRvQ29udGV4dChjdHgsIHtcbiAgICAgICAgICAgICAgICBjb2RlOiBab2RJc3N1ZUNvZGUuaW52YWxpZF90eXBlLFxuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBab2RQYXJzZWRUeXBlLm9iamVjdCxcbiAgICAgICAgICAgICAgICByZWNlaXZlZDogY3R4LnBhcnNlZFR5cGUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBJTlZBTElEO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHsgc3RhdHVzLCBjdHggfSA9IHRoaXMuX3Byb2Nlc3NJbnB1dFBhcmFtcyhpbnB1dCk7XG4gICAgICAgIGNvbnN0IHsgc2hhcGUsIGtleXM6IHNoYXBlS2V5cyB9ID0gdGhpcy5fZ2V0Q2FjaGVkKCk7XG4gICAgICAgIGNvbnN0IGV4dHJhS2V5cyA9IFtdO1xuICAgICAgICBpZiAoISh0aGlzLl9kZWYuY2F0Y2hhbGwgaW5zdGFuY2VvZiBab2ROZXZlciAmJiB0aGlzLl9kZWYudW5rbm93bktleXMgPT09IFwic3RyaXBcIikpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IGluIGN0eC5kYXRhKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFzaGFwZUtleXMuaW5jbHVkZXMoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICBleHRyYUtleXMucHVzaChrZXkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zdCBwYWlycyA9IFtdO1xuICAgICAgICBmb3IgKGNvbnN0IGtleSBvZiBzaGFwZUtleXMpIHtcbiAgICAgICAgICAgIGNvbnN0IGtleVZhbGlkYXRvciA9IHNoYXBlW2tleV07XG4gICAgICAgICAgICBjb25zdCB2YWx1ZSA9IGN0eC5kYXRhW2tleV07XG4gICAgICAgICAgICBwYWlycy5wdXNoKHtcbiAgICAgICAgICAgICAgICBrZXk6IHsgc3RhdHVzOiBcInZhbGlkXCIsIHZhbHVlOiBrZXkgfSxcbiAgICAgICAgICAgICAgICB2YWx1ZToga2V5VmFsaWRhdG9yLl9wYXJzZShuZXcgUGFyc2VJbnB1dExhenlQYXRoKGN0eCwgdmFsdWUsIGN0eC5wYXRoLCBrZXkpKSxcbiAgICAgICAgICAgICAgICBhbHdheXNTZXQ6IGtleSBpbiBjdHguZGF0YSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl9kZWYuY2F0Y2hhbGwgaW5zdGFuY2VvZiBab2ROZXZlcikge1xuICAgICAgICAgICAgY29uc3QgdW5rbm93bktleXMgPSB0aGlzLl9kZWYudW5rbm93bktleXM7XG4gICAgICAgICAgICBpZiAodW5rbm93bktleXMgPT09IFwicGFzc3Rocm91Z2hcIikge1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IG9mIGV4dHJhS2V5cykge1xuICAgICAgICAgICAgICAgICAgICBwYWlycy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGtleTogeyBzdGF0dXM6IFwidmFsaWRcIiwgdmFsdWU6IGtleSB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHsgc3RhdHVzOiBcInZhbGlkXCIsIHZhbHVlOiBjdHguZGF0YVtrZXldIH0sXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHVua25vd25LZXlzID09PSBcInN0cmljdFwiKSB7XG4gICAgICAgICAgICAgICAgaWYgKGV4dHJhS2V5cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGFkZElzc3VlVG9Db250ZXh0KGN0eCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29kZTogWm9kSXNzdWVDb2RlLnVucmVjb2duaXplZF9rZXlzLFxuICAgICAgICAgICAgICAgICAgICAgICAga2V5czogZXh0cmFLZXlzLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgc3RhdHVzLmRpcnR5KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodW5rbm93bktleXMgPT09IFwic3RyaXBcIikge1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnRlcm5hbCBab2RPYmplY3QgZXJyb3I6IGludmFsaWQgdW5rbm93bktleXMgdmFsdWUuYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvLyBydW4gY2F0Y2hhbGwgdmFsaWRhdGlvblxuICAgICAgICAgICAgY29uc3QgY2F0Y2hhbGwgPSB0aGlzLl9kZWYuY2F0Y2hhbGw7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBvZiBleHRyYUtleXMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZSA9IGN0eC5kYXRhW2tleV07XG4gICAgICAgICAgICAgICAgcGFpcnMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIGtleTogeyBzdGF0dXM6IFwidmFsaWRcIiwgdmFsdWU6IGtleSB9LFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogY2F0Y2hhbGwuX3BhcnNlKG5ldyBQYXJzZUlucHV0TGF6eVBhdGgoY3R4LCB2YWx1ZSwgY3R4LnBhdGgsIGtleSkgLy8sIGN0eC5jaGlsZChrZXkpLCB2YWx1ZSwgZ2V0UGFyc2VkVHlwZSh2YWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgICAgICAgYWx3YXlzU2V0OiBrZXkgaW4gY3R4LmRhdGEsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGN0eC5jb21tb24uYXN5bmMpIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuICAgICAgICAgICAgICAgIC50aGVuKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBzeW5jUGFpcnMgPSBbXTtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHBhaXIgb2YgcGFpcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qga2V5ID0gYXdhaXQgcGFpci5rZXk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gYXdhaXQgcGFpci52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgc3luY1BhaXJzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAga2V5LFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBhbHdheXNTZXQ6IHBhaXIuYWx3YXlzU2V0LFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN5bmNQYWlycztcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLnRoZW4oKHN5bmNQYWlycykgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBQYXJzZVN0YXR1cy5tZXJnZU9iamVjdFN5bmMoc3RhdHVzLCBzeW5jUGFpcnMpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gUGFyc2VTdGF0dXMubWVyZ2VPYmplY3RTeW5jKHN0YXR1cywgcGFpcnMpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGdldCBzaGFwZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2RlZi5zaGFwZSgpO1xuICAgIH1cbiAgICBzdHJpY3QobWVzc2FnZSkge1xuICAgICAgICBlcnJvclV0aWwuZXJyVG9PYmo7XG4gICAgICAgIHJldHVybiBuZXcgWm9kT2JqZWN0KHtcbiAgICAgICAgICAgIC4uLnRoaXMuX2RlZixcbiAgICAgICAgICAgIHVua25vd25LZXlzOiBcInN0cmljdFwiLFxuICAgICAgICAgICAgLi4uKG1lc3NhZ2UgIT09IHVuZGVmaW5lZFxuICAgICAgICAgICAgICAgID8ge1xuICAgICAgICAgICAgICAgICAgICBlcnJvck1hcDogKGlzc3VlLCBjdHgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGRlZmF1bHRFcnJvciA9IHRoaXMuX2RlZi5lcnJvck1hcD8uKGlzc3VlLCBjdHgpLm1lc3NhZ2UgPz8gY3R4LmRlZmF1bHRFcnJvcjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc3N1ZS5jb2RlID09PSBcInVucmVjb2duaXplZF9rZXlzXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogZXJyb3JVdGlsLmVyclRvT2JqKG1lc3NhZ2UpLm1lc3NhZ2UgPz8gZGVmYXVsdEVycm9yLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGRlZmF1bHRFcnJvcixcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIDoge30pLFxuICAgICAgICB9KTtcbiAgICB9XG4gICAgc3RyaXAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgWm9kT2JqZWN0KHtcbiAgICAgICAgICAgIC4uLnRoaXMuX2RlZixcbiAgICAgICAgICAgIHVua25vd25LZXlzOiBcInN0cmlwXCIsXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBwYXNzdGhyb3VnaCgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBab2RPYmplY3Qoe1xuICAgICAgICAgICAgLi4udGhpcy5fZGVmLFxuICAgICAgICAgICAgdW5rbm93bktleXM6IFwicGFzc3Rocm91Z2hcIixcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIC8vIGNvbnN0IEF1Z21lbnRGYWN0b3J5ID1cbiAgICAvLyAgIDxEZWYgZXh0ZW5kcyBab2RPYmplY3REZWY+KGRlZjogRGVmKSA9PlxuICAgIC8vICAgPEF1Z21lbnRhdGlvbiBleHRlbmRzIFpvZFJhd1NoYXBlPihcbiAgICAvLyAgICAgYXVnbWVudGF0aW9uOiBBdWdtZW50YXRpb25cbiAgICAvLyAgICk6IFpvZE9iamVjdDxcbiAgICAvLyAgICAgZXh0ZW5kU2hhcGU8UmV0dXJuVHlwZTxEZWZbXCJzaGFwZVwiXT4sIEF1Z21lbnRhdGlvbj4sXG4gICAgLy8gICAgIERlZltcInVua25vd25LZXlzXCJdLFxuICAgIC8vICAgICBEZWZbXCJjYXRjaGFsbFwiXVxuICAgIC8vICAgPiA9PiB7XG4gICAgLy8gICAgIHJldHVybiBuZXcgWm9kT2JqZWN0KHtcbiAgICAvLyAgICAgICAuLi5kZWYsXG4gICAgLy8gICAgICAgc2hhcGU6ICgpID0+ICh7XG4gICAgLy8gICAgICAgICAuLi5kZWYuc2hhcGUoKSxcbiAgICAvLyAgICAgICAgIC4uLmF1Z21lbnRhdGlvbixcbiAgICAvLyAgICAgICB9KSxcbiAgICAvLyAgICAgfSkgYXMgYW55O1xuICAgIC8vICAgfTtcbiAgICBleHRlbmQoYXVnbWVudGF0aW9uKSB7XG4gICAgICAgIHJldHVybiBuZXcgWm9kT2JqZWN0KHtcbiAgICAgICAgICAgIC4uLnRoaXMuX2RlZixcbiAgICAgICAgICAgIHNoYXBlOiAoKSA9PiAoe1xuICAgICAgICAgICAgICAgIC4uLnRoaXMuX2RlZi5zaGFwZSgpLFxuICAgICAgICAgICAgICAgIC4uLmF1Z21lbnRhdGlvbixcbiAgICAgICAgICAgIH0pLFxuICAgICAgICB9KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUHJpb3IgdG8gem9kQDEuMC4xMiB0aGVyZSB3YXMgYSBidWcgaW4gdGhlXG4gICAgICogaW5mZXJyZWQgdHlwZSBvZiBtZXJnZWQgb2JqZWN0cy4gUGxlYXNlXG4gICAgICogdXBncmFkZSBpZiB5b3UgYXJlIGV4cGVyaWVuY2luZyBpc3N1ZXMuXG4gICAgICovXG4gICAgbWVyZ2UobWVyZ2luZykge1xuICAgICAgICBjb25zdCBtZXJnZWQgPSBuZXcgWm9kT2JqZWN0KHtcbiAgICAgICAgICAgIHVua25vd25LZXlzOiBtZXJnaW5nLl9kZWYudW5rbm93bktleXMsXG4gICAgICAgICAgICBjYXRjaGFsbDogbWVyZ2luZy5fZGVmLmNhdGNoYWxsLFxuICAgICAgICAgICAgc2hhcGU6ICgpID0+ICh7XG4gICAgICAgICAgICAgICAgLi4udGhpcy5fZGVmLnNoYXBlKCksXG4gICAgICAgICAgICAgICAgLi4ubWVyZ2luZy5fZGVmLnNoYXBlKCksXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIHR5cGVOYW1lOiBab2RGaXJzdFBhcnR5VHlwZUtpbmQuWm9kT2JqZWN0LFxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIG1lcmdlZDtcbiAgICB9XG4gICAgLy8gbWVyZ2U8XG4gICAgLy8gICBJbmNvbWluZyBleHRlbmRzIEFueVpvZE9iamVjdCxcbiAgICAvLyAgIEF1Z21lbnRhdGlvbiBleHRlbmRzIEluY29taW5nW1wic2hhcGVcIl0sXG4gICAgLy8gICBOZXdPdXRwdXQgZXh0ZW5kcyB7XG4gICAgLy8gICAgIFtrIGluIGtleW9mIEF1Z21lbnRhdGlvbiB8IGtleW9mIE91dHB1dF06IGsgZXh0ZW5kcyBrZXlvZiBBdWdtZW50YXRpb25cbiAgICAvLyAgICAgICA/IEF1Z21lbnRhdGlvbltrXVtcIl9vdXRwdXRcIl1cbiAgICAvLyAgICAgICA6IGsgZXh0ZW5kcyBrZXlvZiBPdXRwdXRcbiAgICAvLyAgICAgICA/IE91dHB1dFtrXVxuICAgIC8vICAgICAgIDogbmV2ZXI7XG4gICAgLy8gICB9LFxuICAgIC8vICAgTmV3SW5wdXQgZXh0ZW5kcyB7XG4gICAgLy8gICAgIFtrIGluIGtleW9mIEF1Z21lbnRhdGlvbiB8IGtleW9mIElucHV0XTogayBleHRlbmRzIGtleW9mIEF1Z21lbnRhdGlvblxuICAgIC8vICAgICAgID8gQXVnbWVudGF0aW9uW2tdW1wiX2lucHV0XCJdXG4gICAgLy8gICAgICAgOiBrIGV4dGVuZHMga2V5b2YgSW5wdXRcbiAgICAvLyAgICAgICA/IElucHV0W2tdXG4gICAgLy8gICAgICAgOiBuZXZlcjtcbiAgICAvLyAgIH1cbiAgICAvLyA+KFxuICAgIC8vICAgbWVyZ2luZzogSW5jb21pbmdcbiAgICAvLyApOiBab2RPYmplY3Q8XG4gICAgLy8gICBleHRlbmRTaGFwZTxULCBSZXR1cm5UeXBlPEluY29taW5nW1wiX2RlZlwiXVtcInNoYXBlXCJdPj4sXG4gICAgLy8gICBJbmNvbWluZ1tcIl9kZWZcIl1bXCJ1bmtub3duS2V5c1wiXSxcbiAgICAvLyAgIEluY29taW5nW1wiX2RlZlwiXVtcImNhdGNoYWxsXCJdLFxuICAgIC8vICAgTmV3T3V0cHV0LFxuICAgIC8vICAgTmV3SW5wdXRcbiAgICAvLyA+IHtcbiAgICAvLyAgIGNvbnN0IG1lcmdlZDogYW55ID0gbmV3IFpvZE9iamVjdCh7XG4gICAgLy8gICAgIHVua25vd25LZXlzOiBtZXJnaW5nLl9kZWYudW5rbm93bktleXMsXG4gICAgLy8gICAgIGNhdGNoYWxsOiBtZXJnaW5nLl9kZWYuY2F0Y2hhbGwsXG4gICAgLy8gICAgIHNoYXBlOiAoKSA9PlxuICAgIC8vICAgICAgIG9iamVjdFV0aWwubWVyZ2VTaGFwZXModGhpcy5fZGVmLnNoYXBlKCksIG1lcmdpbmcuX2RlZi5zaGFwZSgpKSxcbiAgICAvLyAgICAgdHlwZU5hbWU6IFpvZEZpcnN0UGFydHlUeXBlS2luZC5ab2RPYmplY3QsXG4gICAgLy8gICB9KSBhcyBhbnk7XG4gICAgLy8gICByZXR1cm4gbWVyZ2VkO1xuICAgIC8vIH1cbiAgICBzZXRLZXkoa2V5LCBzY2hlbWEpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXVnbWVudCh7IFtrZXldOiBzY2hlbWEgfSk7XG4gICAgfVxuICAgIC8vIG1lcmdlPEluY29taW5nIGV4dGVuZHMgQW55Wm9kT2JqZWN0PihcbiAgICAvLyAgIG1lcmdpbmc6IEluY29taW5nXG4gICAgLy8gKTogLy9ab2RPYmplY3Q8VCAmIEluY29taW5nW1wiX3NoYXBlXCJdLCBVbmtub3duS2V5cywgQ2F0Y2hhbGw+ID0gKG1lcmdpbmcpID0+IHtcbiAgICAvLyBab2RPYmplY3Q8XG4gICAgLy8gICBleHRlbmRTaGFwZTxULCBSZXR1cm5UeXBlPEluY29taW5nW1wiX2RlZlwiXVtcInNoYXBlXCJdPj4sXG4gICAgLy8gICBJbmNvbWluZ1tcIl9kZWZcIl1bXCJ1bmtub3duS2V5c1wiXSxcbiAgICAvLyAgIEluY29taW5nW1wiX2RlZlwiXVtcImNhdGNoYWxsXCJdXG4gICAgLy8gPiB7XG4gICAgLy8gICAvLyBjb25zdCBtZXJnZWRTaGFwZSA9IG9iamVjdFV0aWwubWVyZ2VTaGFwZXMoXG4gICAgLy8gICAvLyAgIHRoaXMuX2RlZi5zaGFwZSgpLFxuICAgIC8vICAgLy8gICBtZXJnaW5nLl9kZWYuc2hhcGUoKVxuICAgIC8vICAgLy8gKTtcbiAgICAvLyAgIGNvbnN0IG1lcmdlZDogYW55ID0gbmV3IFpvZE9iamVjdCh7XG4gICAgLy8gICAgIHVua25vd25LZXlzOiBtZXJnaW5nLl9kZWYudW5rbm93bktleXMsXG4gICAgLy8gICAgIGNhdGNoYWxsOiBtZXJnaW5nLl9kZWYuY2F0Y2hhbGwsXG4gICAgLy8gICAgIHNoYXBlOiAoKSA9PlxuICAgIC8vICAgICAgIG9iamVjdFV0aWwubWVyZ2VTaGFwZXModGhpcy5fZGVmLnNoYXBlKCksIG1lcmdpbmcuX2RlZi5zaGFwZSgpKSxcbiAgICAvLyAgICAgdHlwZU5hbWU6IFpvZEZpcnN0UGFydHlUeXBlS2luZC5ab2RPYmplY3QsXG4gICAgLy8gICB9KSBhcyBhbnk7XG4gICAgLy8gICByZXR1cm4gbWVyZ2VkO1xuICAgIC8vIH1cbiAgICBjYXRjaGFsbChpbmRleCkge1xuICAgICAgICByZXR1cm4gbmV3IFpvZE9iamVjdCh7XG4gICAgICAgICAgICAuLi50aGlzLl9kZWYsXG4gICAgICAgICAgICBjYXRjaGFsbDogaW5kZXgsXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBwaWNrKG1hc2spIHtcbiAgICAgICAgY29uc3Qgc2hhcGUgPSB7fTtcbiAgICAgICAgZm9yIChjb25zdCBrZXkgb2YgdXRpbC5vYmplY3RLZXlzKG1hc2spKSB7XG4gICAgICAgICAgICBpZiAobWFza1trZXldICYmIHRoaXMuc2hhcGVba2V5XSkge1xuICAgICAgICAgICAgICAgIHNoYXBlW2tleV0gPSB0aGlzLnNoYXBlW2tleV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ldyBab2RPYmplY3Qoe1xuICAgICAgICAgICAgLi4udGhpcy5fZGVmLFxuICAgICAgICAgICAgc2hhcGU6ICgpID0+IHNoYXBlLFxuICAgICAgICB9KTtcbiAgICB9XG4gICAgb21pdChtYXNrKSB7XG4gICAgICAgIGNvbnN0IHNoYXBlID0ge307XG4gICAgICAgIGZvciAoY29uc3Qga2V5IG9mIHV0aWwub2JqZWN0S2V5cyh0aGlzLnNoYXBlKSkge1xuICAgICAgICAgICAgaWYgKCFtYXNrW2tleV0pIHtcbiAgICAgICAgICAgICAgICBzaGFwZVtrZXldID0gdGhpcy5zaGFwZVtrZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXcgWm9kT2JqZWN0KHtcbiAgICAgICAgICAgIC4uLnRoaXMuX2RlZixcbiAgICAgICAgICAgIHNoYXBlOiAoKSA9PiBzaGFwZSxcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEBkZXByZWNhdGVkXG4gICAgICovXG4gICAgZGVlcFBhcnRpYWwoKSB7XG4gICAgICAgIHJldHVybiBkZWVwUGFydGlhbGlmeSh0aGlzKTtcbiAgICB9XG4gICAgcGFydGlhbChtYXNrKSB7XG4gICAgICAgIGNvbnN0IG5ld1NoYXBlID0ge307XG4gICAgICAgIGZvciAoY29uc3Qga2V5IG9mIHV0aWwub2JqZWN0S2V5cyh0aGlzLnNoYXBlKSkge1xuICAgICAgICAgICAgY29uc3QgZmllbGRTY2hlbWEgPSB0aGlzLnNoYXBlW2tleV07XG4gICAgICAgICAgICBpZiAobWFzayAmJiAhbWFza1trZXldKSB7XG4gICAgICAgICAgICAgICAgbmV3U2hhcGVba2V5XSA9IGZpZWxkU2NoZW1hO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgbmV3U2hhcGVba2V5XSA9IGZpZWxkU2NoZW1hLm9wdGlvbmFsKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ldyBab2RPYmplY3Qoe1xuICAgICAgICAgICAgLi4udGhpcy5fZGVmLFxuICAgICAgICAgICAgc2hhcGU6ICgpID0+IG5ld1NoYXBlLFxuICAgICAgICB9KTtcbiAgICB9XG4gICAgcmVxdWlyZWQobWFzaykge1xuICAgICAgICBjb25zdCBuZXdTaGFwZSA9IHt9O1xuICAgICAgICBmb3IgKGNvbnN0IGtleSBvZiB1dGlsLm9iamVjdEtleXModGhpcy5zaGFwZSkpIHtcbiAgICAgICAgICAgIGlmIChtYXNrICYmICFtYXNrW2tleV0pIHtcbiAgICAgICAgICAgICAgICBuZXdTaGFwZVtrZXldID0gdGhpcy5zaGFwZVtrZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmllbGRTY2hlbWEgPSB0aGlzLnNoYXBlW2tleV07XG4gICAgICAgICAgICAgICAgbGV0IG5ld0ZpZWxkID0gZmllbGRTY2hlbWE7XG4gICAgICAgICAgICAgICAgd2hpbGUgKG5ld0ZpZWxkIGluc3RhbmNlb2YgWm9kT3B0aW9uYWwpIHtcbiAgICAgICAgICAgICAgICAgICAgbmV3RmllbGQgPSBuZXdGaWVsZC5fZGVmLmlubmVyVHlwZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbmV3U2hhcGVba2V5XSA9IG5ld0ZpZWxkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXcgWm9kT2JqZWN0KHtcbiAgICAgICAgICAgIC4uLnRoaXMuX2RlZixcbiAgICAgICAgICAgIHNoYXBlOiAoKSA9PiBuZXdTaGFwZSxcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGtleW9mKCkge1xuICAgICAgICByZXR1cm4gY3JlYXRlWm9kRW51bSh1dGlsLm9iamVjdEtleXModGhpcy5zaGFwZSkpO1xuICAgIH1cbn1cblpvZE9iamVjdC5jcmVhdGUgPSAoc2hhcGUsIHBhcmFtcykgPT4ge1xuICAgIHJldHVybiBuZXcgWm9kT2JqZWN0KHtcbiAgICAgICAgc2hhcGU6ICgpID0+IHNoYXBlLFxuICAgICAgICB1bmtub3duS2V5czogXCJzdHJpcFwiLFxuICAgICAgICBjYXRjaGFsbDogWm9kTmV2ZXIuY3JlYXRlKCksXG4gICAgICAgIHR5cGVOYW1lOiBab2RGaXJzdFBhcnR5VHlwZUtpbmQuWm9kT2JqZWN0LFxuICAgICAgICAuLi5wcm9jZXNzQ3JlYXRlUGFyYW1zKHBhcmFtcyksXG4gICAgfSk7XG59O1xuWm9kT2JqZWN0LnN0cmljdENyZWF0ZSA9IChzaGFwZSwgcGFyYW1zKSA9PiB7XG4gICAgcmV0dXJuIG5ldyBab2RPYmplY3Qoe1xuICAgICAgICBzaGFwZTogKCkgPT4gc2hhcGUsXG4gICAgICAgIHVua25vd25LZXlzOiBcInN0cmljdFwiLFxuICAgICAgICBjYXRjaGFsbDogWm9kTmV2ZXIuY3JlYXRlKCksXG4gICAgICAgIHR5cGVOYW1lOiBab2RGaXJzdFBhcnR5VHlwZUtpbmQuWm9kT2JqZWN0LFxuICAgICAgICAuLi5wcm9jZXNzQ3JlYXRlUGFyYW1zKHBhcmFtcyksXG4gICAgfSk7XG59O1xuWm9kT2JqZWN0LmxhenljcmVhdGUgPSAoc2hhcGUsIHBhcmFtcykgPT4ge1xuICAgIHJldHVybiBuZXcgWm9kT2JqZWN0KHtcbiAgICAgICAgc2hhcGUsXG4gICAgICAgIHVua25vd25LZXlzOiBcInN0cmlwXCIsXG4gICAgICAgIGNhdGNoYWxsOiBab2ROZXZlci5jcmVhdGUoKSxcbiAgICAgICAgdHlwZU5hbWU6IFpvZEZpcnN0UGFydHlUeXBlS2luZC5ab2RPYmplY3QsXG4gICAgICAgIC4uLnByb2Nlc3NDcmVhdGVQYXJhbXMocGFyYW1zKSxcbiAgICB9KTtcbn07XG5leHBvcnQgY2xhc3MgWm9kVW5pb24gZXh0ZW5kcyBab2RUeXBlIHtcbiAgICBfcGFyc2UoaW5wdXQpIHtcbiAgICAgICAgY29uc3QgeyBjdHggfSA9IHRoaXMuX3Byb2Nlc3NJbnB1dFBhcmFtcyhpbnB1dCk7XG4gICAgICAgIGNvbnN0IG9wdGlvbnMgPSB0aGlzLl9kZWYub3B0aW9ucztcbiAgICAgICAgZnVuY3Rpb24gaGFuZGxlUmVzdWx0cyhyZXN1bHRzKSB7XG4gICAgICAgICAgICAvLyByZXR1cm4gZmlyc3QgaXNzdWUtZnJlZSB2YWxpZGF0aW9uIGlmIGl0IGV4aXN0c1xuICAgICAgICAgICAgZm9yIChjb25zdCByZXN1bHQgb2YgcmVzdWx0cykge1xuICAgICAgICAgICAgICAgIGlmIChyZXN1bHQucmVzdWx0LnN0YXR1cyA9PT0gXCJ2YWxpZFwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQucmVzdWx0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAoY29uc3QgcmVzdWx0IG9mIHJlc3VsdHMpIHtcbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0LnJlc3VsdC5zdGF0dXMgPT09IFwiZGlydHlcIikge1xuICAgICAgICAgICAgICAgICAgICAvLyBhZGQgaXNzdWVzIGZyb20gZGlydHkgb3B0aW9uXG4gICAgICAgICAgICAgICAgICAgIGN0eC5jb21tb24uaXNzdWVzLnB1c2goLi4ucmVzdWx0LmN0eC5jb21tb24uaXNzdWVzKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdC5yZXN1bHQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gcmV0dXJuIGludmFsaWRcbiAgICAgICAgICAgIGNvbnN0IHVuaW9uRXJyb3JzID0gcmVzdWx0cy5tYXAoKHJlc3VsdCkgPT4gbmV3IFpvZEVycm9yKHJlc3VsdC5jdHguY29tbW9uLmlzc3VlcykpO1xuICAgICAgICAgICAgYWRkSXNzdWVUb0NvbnRleHQoY3R4LCB7XG4gICAgICAgICAgICAgICAgY29kZTogWm9kSXNzdWVDb2RlLmludmFsaWRfdW5pb24sXG4gICAgICAgICAgICAgICAgdW5pb25FcnJvcnMsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBJTlZBTElEO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjdHguY29tbW9uLmFzeW5jKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwob3B0aW9ucy5tYXAoYXN5bmMgKG9wdGlvbikgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNoaWxkQ3R4ID0ge1xuICAgICAgICAgICAgICAgICAgICAuLi5jdHgsXG4gICAgICAgICAgICAgICAgICAgIGNvbW1vbjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgLi4uY3R4LmNvbW1vbixcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzc3VlczogW10sXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHBhcmVudDogbnVsbCxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdDogYXdhaXQgb3B0aW9uLl9wYXJzZUFzeW5jKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IGN0eC5kYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDogY3R4LnBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnQ6IGNoaWxkQ3R4LFxuICAgICAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICAgICAgY3R4OiBjaGlsZEN0eCxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSkpLnRoZW4oaGFuZGxlUmVzdWx0cyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBsZXQgZGlydHkgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICBjb25zdCBpc3N1ZXMgPSBbXTtcbiAgICAgICAgICAgIGZvciAoY29uc3Qgb3B0aW9uIG9mIG9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjaGlsZEN0eCA9IHtcbiAgICAgICAgICAgICAgICAgICAgLi4uY3R4LFxuICAgICAgICAgICAgICAgICAgICBjb21tb246IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC4uLmN0eC5jb21tb24sXG4gICAgICAgICAgICAgICAgICAgICAgICBpc3N1ZXM6IFtdLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBwYXJlbnQ6IG51bGwsXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBvcHRpb24uX3BhcnNlU3luYyh7XG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGN0eC5kYXRhLFxuICAgICAgICAgICAgICAgICAgICBwYXRoOiBjdHgucGF0aCxcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50OiBjaGlsZEN0eCxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0LnN0YXR1cyA9PT0gXCJ2YWxpZFwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHJlc3VsdC5zdGF0dXMgPT09IFwiZGlydHlcIiAmJiAhZGlydHkpIHtcbiAgICAgICAgICAgICAgICAgICAgZGlydHkgPSB7IHJlc3VsdCwgY3R4OiBjaGlsZEN0eCB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoY2hpbGRDdHguY29tbW9uLmlzc3Vlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgaXNzdWVzLnB1c2goY2hpbGRDdHguY29tbW9uLmlzc3Vlcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGRpcnR5KSB7XG4gICAgICAgICAgICAgICAgY3R4LmNvbW1vbi5pc3N1ZXMucHVzaCguLi5kaXJ0eS5jdHguY29tbW9uLmlzc3Vlcyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRpcnR5LnJlc3VsdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHVuaW9uRXJyb3JzID0gaXNzdWVzLm1hcCgoaXNzdWVzKSA9PiBuZXcgWm9kRXJyb3IoaXNzdWVzKSk7XG4gICAgICAgICAgICBhZGRJc3N1ZVRvQ29udGV4dChjdHgsIHtcbiAgICAgICAgICAgICAgICBjb2RlOiBab2RJc3N1ZUNvZGUuaW52YWxpZF91bmlvbixcbiAgICAgICAgICAgICAgICB1bmlvbkVycm9ycyxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIElOVkFMSUQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZ2V0IG9wdGlvbnMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9kZWYub3B0aW9ucztcbiAgICB9XG59XG5ab2RVbmlvbi5jcmVhdGUgPSAodHlwZXMsIHBhcmFtcykgPT4ge1xuICAgIHJldHVybiBuZXcgWm9kVW5pb24oe1xuICAgICAgICBvcHRpb25zOiB0eXBlcyxcbiAgICAgICAgdHlwZU5hbWU6IFpvZEZpcnN0UGFydHlUeXBlS2luZC5ab2RVbmlvbixcbiAgICAgICAgLi4ucHJvY2Vzc0NyZWF0ZVBhcmFtcyhwYXJhbXMpLFxuICAgIH0pO1xufTtcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLy8vLy8vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vLy8vLy8vLy9cbi8vLy8vLy8vLy8gICAgICBab2REaXNjcmltaW5hdGVkVW5pb24gICAgICAvLy8vLy8vLy8vXG4vLy8vLy8vLy8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8vLy8vLy8vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5jb25zdCBnZXREaXNjcmltaW5hdG9yID0gKHR5cGUpID0+IHtcbiAgICBpZiAodHlwZSBpbnN0YW5jZW9mIFpvZExhenkpIHtcbiAgICAgICAgcmV0dXJuIGdldERpc2NyaW1pbmF0b3IodHlwZS5zY2hlbWEpO1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlIGluc3RhbmNlb2YgWm9kRWZmZWN0cykge1xuICAgICAgICByZXR1cm4gZ2V0RGlzY3JpbWluYXRvcih0eXBlLmlubmVyVHlwZSgpKTtcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZSBpbnN0YW5jZW9mIFpvZExpdGVyYWwpIHtcbiAgICAgICAgcmV0dXJuIFt0eXBlLnZhbHVlXTtcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZSBpbnN0YW5jZW9mIFpvZEVudW0pIHtcbiAgICAgICAgcmV0dXJuIHR5cGUub3B0aW9ucztcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZSBpbnN0YW5jZW9mIFpvZE5hdGl2ZUVudW0pIHtcbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGJhbi9iYW5cbiAgICAgICAgcmV0dXJuIHV0aWwub2JqZWN0VmFsdWVzKHR5cGUuZW51bSk7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGUgaW5zdGFuY2VvZiBab2REZWZhdWx0KSB7XG4gICAgICAgIHJldHVybiBnZXREaXNjcmltaW5hdG9yKHR5cGUuX2RlZi5pbm5lclR5cGUpO1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlIGluc3RhbmNlb2YgWm9kVW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBbdW5kZWZpbmVkXTtcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZSBpbnN0YW5jZW9mIFpvZE51bGwpIHtcbiAgICAgICAgcmV0dXJuIFtudWxsXTtcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZSBpbnN0YW5jZW9mIFpvZE9wdGlvbmFsKSB7XG4gICAgICAgIHJldHVybiBbdW5kZWZpbmVkLCAuLi5nZXREaXNjcmltaW5hdG9yKHR5cGUudW53cmFwKCkpXTtcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZSBpbnN0YW5jZW9mIFpvZE51bGxhYmxlKSB7XG4gICAgICAgIHJldHVybiBbbnVsbCwgLi4uZ2V0RGlzY3JpbWluYXRvcih0eXBlLnVud3JhcCgpKV07XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGUgaW5zdGFuY2VvZiBab2RCcmFuZGVkKSB7XG4gICAgICAgIHJldHVybiBnZXREaXNjcmltaW5hdG9yKHR5cGUudW53cmFwKCkpO1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlIGluc3RhbmNlb2YgWm9kUmVhZG9ubHkpIHtcbiAgICAgICAgcmV0dXJuIGdldERpc2NyaW1pbmF0b3IodHlwZS51bndyYXAoKSk7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGUgaW5zdGFuY2VvZiBab2RDYXRjaCkge1xuICAgICAgICByZXR1cm4gZ2V0RGlzY3JpbWluYXRvcih0eXBlLl9kZWYuaW5uZXJUeXBlKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHJldHVybiBbXTtcbiAgICB9XG59O1xuZXhwb3J0IGNsYXNzIFpvZERpc2NyaW1pbmF0ZWRVbmlvbiBleHRlbmRzIFpvZFR5cGUge1xuICAgIF9wYXJzZShpbnB1dCkge1xuICAgICAgICBjb25zdCB7IGN0eCB9ID0gdGhpcy5fcHJvY2Vzc0lucHV0UGFyYW1zKGlucHV0KTtcbiAgICAgICAgaWYgKGN0eC5wYXJzZWRUeXBlICE9PSBab2RQYXJzZWRUeXBlLm9iamVjdCkge1xuICAgICAgICAgICAgYWRkSXNzdWVUb0NvbnRleHQoY3R4LCB7XG4gICAgICAgICAgICAgICAgY29kZTogWm9kSXNzdWVDb2RlLmludmFsaWRfdHlwZSxcbiAgICAgICAgICAgICAgICBleHBlY3RlZDogWm9kUGFyc2VkVHlwZS5vYmplY3QsXG4gICAgICAgICAgICAgICAgcmVjZWl2ZWQ6IGN0eC5wYXJzZWRUeXBlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gSU5WQUxJRDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBkaXNjcmltaW5hdG9yID0gdGhpcy5kaXNjcmltaW5hdG9yO1xuICAgICAgICBjb25zdCBkaXNjcmltaW5hdG9yVmFsdWUgPSBjdHguZGF0YVtkaXNjcmltaW5hdG9yXTtcbiAgICAgICAgY29uc3Qgb3B0aW9uID0gdGhpcy5vcHRpb25zTWFwLmdldChkaXNjcmltaW5hdG9yVmFsdWUpO1xuICAgICAgICBpZiAoIW9wdGlvbikge1xuICAgICAgICAgICAgYWRkSXNzdWVUb0NvbnRleHQoY3R4LCB7XG4gICAgICAgICAgICAgICAgY29kZTogWm9kSXNzdWVDb2RlLmludmFsaWRfdW5pb25fZGlzY3JpbWluYXRvcixcbiAgICAgICAgICAgICAgICBvcHRpb25zOiBBcnJheS5mcm9tKHRoaXMub3B0aW9uc01hcC5rZXlzKCkpLFxuICAgICAgICAgICAgICAgIHBhdGg6IFtkaXNjcmltaW5hdG9yXSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIElOVkFMSUQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGN0eC5jb21tb24uYXN5bmMpIHtcbiAgICAgICAgICAgIHJldHVybiBvcHRpb24uX3BhcnNlQXN5bmMoe1xuICAgICAgICAgICAgICAgIGRhdGE6IGN0eC5kYXRhLFxuICAgICAgICAgICAgICAgIHBhdGg6IGN0eC5wYXRoLFxuICAgICAgICAgICAgICAgIHBhcmVudDogY3R4LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gb3B0aW9uLl9wYXJzZVN5bmMoe1xuICAgICAgICAgICAgICAgIGRhdGE6IGN0eC5kYXRhLFxuICAgICAgICAgICAgICAgIHBhdGg6IGN0eC5wYXRoLFxuICAgICAgICAgICAgICAgIHBhcmVudDogY3R4LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZ2V0IGRpc2NyaW1pbmF0b3IoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9kZWYuZGlzY3JpbWluYXRvcjtcbiAgICB9XG4gICAgZ2V0IG9wdGlvbnMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9kZWYub3B0aW9ucztcbiAgICB9XG4gICAgZ2V0IG9wdGlvbnNNYXAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9kZWYub3B0aW9uc01hcDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogVGhlIGNvbnN0cnVjdG9yIG9mIHRoZSBkaXNjcmltaW5hdGVkIHVuaW9uIHNjaGVtYS4gSXRzIGJlaGF2aW91ciBpcyB2ZXJ5IHNpbWlsYXIgdG8gdGhhdCBvZiB0aGUgbm9ybWFsIHoudW5pb24oKSBjb25zdHJ1Y3Rvci5cbiAgICAgKiBIb3dldmVyLCBpdCBvbmx5IGFsbG93cyBhIHVuaW9uIG9mIG9iamVjdHMsIGFsbCBvZiB3aGljaCBuZWVkIHRvIHNoYXJlIGEgZGlzY3JpbWluYXRvciBwcm9wZXJ0eS4gVGhpcyBwcm9wZXJ0eSBtdXN0XG4gICAgICogaGF2ZSBhIGRpZmZlcmVudCB2YWx1ZSBmb3IgZWFjaCBvYmplY3QgaW4gdGhlIHVuaW9uLlxuICAgICAqIEBwYXJhbSBkaXNjcmltaW5hdG9yIHRoZSBuYW1lIG9mIHRoZSBkaXNjcmltaW5hdG9yIHByb3BlcnR5XG4gICAgICogQHBhcmFtIHR5cGVzIGFuIGFycmF5IG9mIG9iamVjdCBzY2hlbWFzXG4gICAgICogQHBhcmFtIHBhcmFtc1xuICAgICAqL1xuICAgIHN0YXRpYyBjcmVhdGUoZGlzY3JpbWluYXRvciwgb3B0aW9ucywgcGFyYW1zKSB7XG4gICAgICAgIC8vIEdldCBhbGwgdGhlIHZhbGlkIGRpc2NyaW1pbmF0b3IgdmFsdWVzXG4gICAgICAgIGNvbnN0IG9wdGlvbnNNYXAgPSBuZXcgTWFwKCk7XG4gICAgICAgIC8vIHRyeSB7XG4gICAgICAgIGZvciAoY29uc3QgdHlwZSBvZiBvcHRpb25zKSB7XG4gICAgICAgICAgICBjb25zdCBkaXNjcmltaW5hdG9yVmFsdWVzID0gZ2V0RGlzY3JpbWluYXRvcih0eXBlLnNoYXBlW2Rpc2NyaW1pbmF0b3JdKTtcbiAgICAgICAgICAgIGlmICghZGlzY3JpbWluYXRvclZhbHVlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEEgZGlzY3JpbWluYXRvciB2YWx1ZSBmb3Iga2V5IFxcYCR7ZGlzY3JpbWluYXRvcn1cXGAgY291bGQgbm90IGJlIGV4dHJhY3RlZCBmcm9tIGFsbCBzY2hlbWEgb3B0aW9uc2ApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yIChjb25zdCB2YWx1ZSBvZiBkaXNjcmltaW5hdG9yVmFsdWVzKSB7XG4gICAgICAgICAgICAgICAgaWYgKG9wdGlvbnNNYXAuaGFzKHZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYERpc2NyaW1pbmF0b3IgcHJvcGVydHkgJHtTdHJpbmcoZGlzY3JpbWluYXRvcil9IGhhcyBkdXBsaWNhdGUgdmFsdWUgJHtTdHJpbmcodmFsdWUpfWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBvcHRpb25zTWFwLnNldCh2YWx1ZSwgdHlwZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ldyBab2REaXNjcmltaW5hdGVkVW5pb24oe1xuICAgICAgICAgICAgdHlwZU5hbWU6IFpvZEZpcnN0UGFydHlUeXBlS2luZC5ab2REaXNjcmltaW5hdGVkVW5pb24sXG4gICAgICAgICAgICBkaXNjcmltaW5hdG9yLFxuICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgIG9wdGlvbnNNYXAsXG4gICAgICAgICAgICAuLi5wcm9jZXNzQ3JlYXRlUGFyYW1zKHBhcmFtcyksXG4gICAgICAgIH0pO1xuICAgIH1cbn1cbmZ1bmN0aW9uIG1lcmdlVmFsdWVzKGEsIGIpIHtcbiAgICBjb25zdCBhVHlwZSA9IGdldFBhcnNlZFR5cGUoYSk7XG4gICAgY29uc3QgYlR5cGUgPSBnZXRQYXJzZWRUeXBlKGIpO1xuICAgIGlmIChhID09PSBiKSB7XG4gICAgICAgIHJldHVybiB7IHZhbGlkOiB0cnVlLCBkYXRhOiBhIH07XG4gICAgfVxuICAgIGVsc2UgaWYgKGFUeXBlID09PSBab2RQYXJzZWRUeXBlLm9iamVjdCAmJiBiVHlwZSA9PT0gWm9kUGFyc2VkVHlwZS5vYmplY3QpIHtcbiAgICAgICAgY29uc3QgYktleXMgPSB1dGlsLm9iamVjdEtleXMoYik7XG4gICAgICAgIGNvbnN0IHNoYXJlZEtleXMgPSB1dGlsLm9iamVjdEtleXMoYSkuZmlsdGVyKChrZXkpID0+IGJLZXlzLmluZGV4T2Yoa2V5KSAhPT0gLTEpO1xuICAgICAgICBjb25zdCBuZXdPYmogPSB7IC4uLmEsIC4uLmIgfTtcbiAgICAgICAgZm9yIChjb25zdCBrZXkgb2Ygc2hhcmVkS2V5cykge1xuICAgICAgICAgICAgY29uc3Qgc2hhcmVkVmFsdWUgPSBtZXJnZVZhbHVlcyhhW2tleV0sIGJba2V5XSk7XG4gICAgICAgICAgICBpZiAoIXNoYXJlZFZhbHVlLnZhbGlkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgdmFsaWQ6IGZhbHNlIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBuZXdPYmpba2V5XSA9IHNoYXJlZFZhbHVlLmRhdGE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHsgdmFsaWQ6IHRydWUsIGRhdGE6IG5ld09iaiB9O1xuICAgIH1cbiAgICBlbHNlIGlmIChhVHlwZSA9PT0gWm9kUGFyc2VkVHlwZS5hcnJheSAmJiBiVHlwZSA9PT0gWm9kUGFyc2VkVHlwZS5hcnJheSkge1xuICAgICAgICBpZiAoYS5sZW5ndGggIT09IGIubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4geyB2YWxpZDogZmFsc2UgfTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBuZXdBcnJheSA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgYS5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgICAgIGNvbnN0IGl0ZW1BID0gYVtpbmRleF07XG4gICAgICAgICAgICBjb25zdCBpdGVtQiA9IGJbaW5kZXhdO1xuICAgICAgICAgICAgY29uc3Qgc2hhcmVkVmFsdWUgPSBtZXJnZVZhbHVlcyhpdGVtQSwgaXRlbUIpO1xuICAgICAgICAgICAgaWYgKCFzaGFyZWRWYWx1ZS52YWxpZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IHZhbGlkOiBmYWxzZSB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbmV3QXJyYXkucHVzaChzaGFyZWRWYWx1ZS5kYXRhKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4geyB2YWxpZDogdHJ1ZSwgZGF0YTogbmV3QXJyYXkgfTtcbiAgICB9XG4gICAgZWxzZSBpZiAoYVR5cGUgPT09IFpvZFBhcnNlZFR5cGUuZGF0ZSAmJiBiVHlwZSA9PT0gWm9kUGFyc2VkVHlwZS5kYXRlICYmICthID09PSArYikge1xuICAgICAgICByZXR1cm4geyB2YWxpZDogdHJ1ZSwgZGF0YTogYSB9O1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHsgdmFsaWQ6IGZhbHNlIH07XG4gICAgfVxufVxuZXhwb3J0IGNsYXNzIFpvZEludGVyc2VjdGlvbiBleHRlbmRzIFpvZFR5cGUge1xuICAgIF9wYXJzZShpbnB1dCkge1xuICAgICAgICBjb25zdCB7IHN0YXR1cywgY3R4IH0gPSB0aGlzLl9wcm9jZXNzSW5wdXRQYXJhbXMoaW5wdXQpO1xuICAgICAgICBjb25zdCBoYW5kbGVQYXJzZWQgPSAocGFyc2VkTGVmdCwgcGFyc2VkUmlnaHQpID0+IHtcbiAgICAgICAgICAgIGlmIChpc0Fib3J0ZWQocGFyc2VkTGVmdCkgfHwgaXNBYm9ydGVkKHBhcnNlZFJpZ2h0KSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBJTlZBTElEO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgbWVyZ2VkID0gbWVyZ2VWYWx1ZXMocGFyc2VkTGVmdC52YWx1ZSwgcGFyc2VkUmlnaHQudmFsdWUpO1xuICAgICAgICAgICAgaWYgKCFtZXJnZWQudmFsaWQpIHtcbiAgICAgICAgICAgICAgICBhZGRJc3N1ZVRvQ29udGV4dChjdHgsIHtcbiAgICAgICAgICAgICAgICAgICAgY29kZTogWm9kSXNzdWVDb2RlLmludmFsaWRfaW50ZXJzZWN0aW9uX3R5cGVzLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiBJTlZBTElEO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlzRGlydHkocGFyc2VkTGVmdCkgfHwgaXNEaXJ0eShwYXJzZWRSaWdodCkpIHtcbiAgICAgICAgICAgICAgICBzdGF0dXMuZGlydHkoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7IHN0YXR1czogc3RhdHVzLnZhbHVlLCB2YWx1ZTogbWVyZ2VkLmRhdGEgfTtcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKGN0eC5jb21tb24uYXN5bmMpIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLmFsbChbXG4gICAgICAgICAgICAgICAgdGhpcy5fZGVmLmxlZnQuX3BhcnNlQXN5bmMoe1xuICAgICAgICAgICAgICAgICAgICBkYXRhOiBjdHguZGF0YSxcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogY3R4LnBhdGgsXG4gICAgICAgICAgICAgICAgICAgIHBhcmVudDogY3R4LFxuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgIHRoaXMuX2RlZi5yaWdodC5fcGFyc2VBc3luYyh7XG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGN0eC5kYXRhLFxuICAgICAgICAgICAgICAgICAgICBwYXRoOiBjdHgucGF0aCxcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50OiBjdHgsXG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBdKS50aGVuKChbbGVmdCwgcmlnaHRdKSA9PiBoYW5kbGVQYXJzZWQobGVmdCwgcmlnaHQpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBoYW5kbGVQYXJzZWQodGhpcy5fZGVmLmxlZnQuX3BhcnNlU3luYyh7XG4gICAgICAgICAgICAgICAgZGF0YTogY3R4LmRhdGEsXG4gICAgICAgICAgICAgICAgcGF0aDogY3R4LnBhdGgsXG4gICAgICAgICAgICAgICAgcGFyZW50OiBjdHgsXG4gICAgICAgICAgICB9KSwgdGhpcy5fZGVmLnJpZ2h0Ll9wYXJzZVN5bmMoe1xuICAgICAgICAgICAgICAgIGRhdGE6IGN0eC5kYXRhLFxuICAgICAgICAgICAgICAgIHBhdGg6IGN0eC5wYXRoLFxuICAgICAgICAgICAgICAgIHBhcmVudDogY3R4LFxuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9XG4gICAgfVxufVxuWm9kSW50ZXJzZWN0aW9uLmNyZWF0ZSA9IChsZWZ0LCByaWdodCwgcGFyYW1zKSA9PiB7XG4gICAgcmV0dXJuIG5ldyBab2RJbnRlcnNlY3Rpb24oe1xuICAgICAgICBsZWZ0OiBsZWZ0LFxuICAgICAgICByaWdodDogcmlnaHQsXG4gICAgICAgIHR5cGVOYW1lOiBab2RGaXJzdFBhcnR5VHlwZUtpbmQuWm9kSW50ZXJzZWN0aW9uLFxuICAgICAgICAuLi5wcm9jZXNzQ3JlYXRlUGFyYW1zKHBhcmFtcyksXG4gICAgfSk7XG59O1xuLy8gdHlwZSBab2RUdXBsZUl0ZW1zID0gW1pvZFR5cGVBbnksIC4uLlpvZFR5cGVBbnlbXV07XG5leHBvcnQgY2xhc3MgWm9kVHVwbGUgZXh0ZW5kcyBab2RUeXBlIHtcbiAgICBfcGFyc2UoaW5wdXQpIHtcbiAgICAgICAgY29uc3QgeyBzdGF0dXMsIGN0eCB9ID0gdGhpcy5fcHJvY2Vzc0lucHV0UGFyYW1zKGlucHV0KTtcbiAgICAgICAgaWYgKGN0eC5wYXJzZWRUeXBlICE9PSBab2RQYXJzZWRUeXBlLmFycmF5KSB7XG4gICAgICAgICAgICBhZGRJc3N1ZVRvQ29udGV4dChjdHgsIHtcbiAgICAgICAgICAgICAgICBjb2RlOiBab2RJc3N1ZUNvZGUuaW52YWxpZF90eXBlLFxuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBab2RQYXJzZWRUeXBlLmFycmF5LFxuICAgICAgICAgICAgICAgIHJlY2VpdmVkOiBjdHgucGFyc2VkVHlwZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIElOVkFMSUQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGN0eC5kYXRhLmxlbmd0aCA8IHRoaXMuX2RlZi5pdGVtcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGFkZElzc3VlVG9Db250ZXh0KGN0eCwge1xuICAgICAgICAgICAgICAgIGNvZGU6IFpvZElzc3VlQ29kZS50b29fc21hbGwsXG4gICAgICAgICAgICAgICAgbWluaW11bTogdGhpcy5fZGVmLml0ZW1zLmxlbmd0aCxcbiAgICAgICAgICAgICAgICBpbmNsdXNpdmU6IHRydWUsXG4gICAgICAgICAgICAgICAgZXhhY3Q6IGZhbHNlLFxuICAgICAgICAgICAgICAgIHR5cGU6IFwiYXJyYXlcIixcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIElOVkFMSUQ7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcmVzdCA9IHRoaXMuX2RlZi5yZXN0O1xuICAgICAgICBpZiAoIXJlc3QgJiYgY3R4LmRhdGEubGVuZ3RoID4gdGhpcy5fZGVmLml0ZW1zLmxlbmd0aCkge1xuICAgICAgICAgICAgYWRkSXNzdWVUb0NvbnRleHQoY3R4LCB7XG4gICAgICAgICAgICAgICAgY29kZTogWm9kSXNzdWVDb2RlLnRvb19iaWcsXG4gICAgICAgICAgICAgICAgbWF4aW11bTogdGhpcy5fZGVmLml0ZW1zLmxlbmd0aCxcbiAgICAgICAgICAgICAgICBpbmNsdXNpdmU6IHRydWUsXG4gICAgICAgICAgICAgICAgZXhhY3Q6IGZhbHNlLFxuICAgICAgICAgICAgICAgIHR5cGU6IFwiYXJyYXlcIixcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgc3RhdHVzLmRpcnR5KCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgaXRlbXMgPSBbLi4uY3R4LmRhdGFdXG4gICAgICAgICAgICAubWFwKChpdGVtLCBpdGVtSW5kZXgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHNjaGVtYSA9IHRoaXMuX2RlZi5pdGVtc1tpdGVtSW5kZXhdIHx8IHRoaXMuX2RlZi5yZXN0O1xuICAgICAgICAgICAgaWYgKCFzY2hlbWEpXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICByZXR1cm4gc2NoZW1hLl9wYXJzZShuZXcgUGFyc2VJbnB1dExhenlQYXRoKGN0eCwgaXRlbSwgY3R4LnBhdGgsIGl0ZW1JbmRleCkpO1xuICAgICAgICB9KVxuICAgICAgICAgICAgLmZpbHRlcigoeCkgPT4gISF4KTsgLy8gZmlsdGVyIG51bGxzXG4gICAgICAgIGlmIChjdHguY29tbW9uLmFzeW5jKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoaXRlbXMpLnRoZW4oKHJlc3VsdHMpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gUGFyc2VTdGF0dXMubWVyZ2VBcnJheShzdGF0dXMsIHJlc3VsdHMpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gUGFyc2VTdGF0dXMubWVyZ2VBcnJheShzdGF0dXMsIGl0ZW1zKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBnZXQgaXRlbXMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9kZWYuaXRlbXM7XG4gICAgfVxuICAgIHJlc3QocmVzdCkge1xuICAgICAgICByZXR1cm4gbmV3IFpvZFR1cGxlKHtcbiAgICAgICAgICAgIC4uLnRoaXMuX2RlZixcbiAgICAgICAgICAgIHJlc3QsXG4gICAgICAgIH0pO1xuICAgIH1cbn1cblpvZFR1cGxlLmNyZWF0ZSA9IChzY2hlbWFzLCBwYXJhbXMpID0+IHtcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkoc2NoZW1hcykpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiWW91IG11c3QgcGFzcyBhbiBhcnJheSBvZiBzY2hlbWFzIHRvIHoudHVwbGUoWyAuLi4gXSlcIik7XG4gICAgfVxuICAgIHJldHVybiBuZXcgWm9kVHVwbGUoe1xuICAgICAgICBpdGVtczogc2NoZW1hcyxcbiAgICAgICAgdHlwZU5hbWU6IFpvZEZpcnN0UGFydHlUeXBlS2luZC5ab2RUdXBsZSxcbiAgICAgICAgcmVzdDogbnVsbCxcbiAgICAgICAgLi4ucHJvY2Vzc0NyZWF0ZVBhcmFtcyhwYXJhbXMpLFxuICAgIH0pO1xufTtcbmV4cG9ydCBjbGFzcyBab2RSZWNvcmQgZXh0ZW5kcyBab2RUeXBlIHtcbiAgICBnZXQga2V5U2NoZW1hKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZGVmLmtleVR5cGU7XG4gICAgfVxuICAgIGdldCB2YWx1ZVNjaGVtYSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2RlZi52YWx1ZVR5cGU7XG4gICAgfVxuICAgIF9wYXJzZShpbnB1dCkge1xuICAgICAgICBjb25zdCB7IHN0YXR1cywgY3R4IH0gPSB0aGlzLl9wcm9jZXNzSW5wdXRQYXJhbXMoaW5wdXQpO1xuICAgICAgICBpZiAoY3R4LnBhcnNlZFR5cGUgIT09IFpvZFBhcnNlZFR5cGUub2JqZWN0KSB7XG4gICAgICAgICAgICBhZGRJc3N1ZVRvQ29udGV4dChjdHgsIHtcbiAgICAgICAgICAgICAgICBjb2RlOiBab2RJc3N1ZUNvZGUuaW52YWxpZF90eXBlLFxuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBab2RQYXJzZWRUeXBlLm9iamVjdCxcbiAgICAgICAgICAgICAgICByZWNlaXZlZDogY3R4LnBhcnNlZFR5cGUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBJTlZBTElEO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHBhaXJzID0gW107XG4gICAgICAgIGNvbnN0IGtleVR5cGUgPSB0aGlzLl9kZWYua2V5VHlwZTtcbiAgICAgICAgY29uc3QgdmFsdWVUeXBlID0gdGhpcy5fZGVmLnZhbHVlVHlwZTtcbiAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gY3R4LmRhdGEpIHtcbiAgICAgICAgICAgIHBhaXJzLnB1c2goe1xuICAgICAgICAgICAgICAgIGtleToga2V5VHlwZS5fcGFyc2UobmV3IFBhcnNlSW5wdXRMYXp5UGF0aChjdHgsIGtleSwgY3R4LnBhdGgsIGtleSkpLFxuICAgICAgICAgICAgICAgIHZhbHVlOiB2YWx1ZVR5cGUuX3BhcnNlKG5ldyBQYXJzZUlucHV0TGF6eVBhdGgoY3R4LCBjdHguZGF0YVtrZXldLCBjdHgucGF0aCwga2V5KSksXG4gICAgICAgICAgICAgICAgYWx3YXlzU2V0OiBrZXkgaW4gY3R4LmRhdGEsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY3R4LmNvbW1vbi5hc3luYykge1xuICAgICAgICAgICAgcmV0dXJuIFBhcnNlU3RhdHVzLm1lcmdlT2JqZWN0QXN5bmMoc3RhdHVzLCBwYWlycyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gUGFyc2VTdGF0dXMubWVyZ2VPYmplY3RTeW5jKHN0YXR1cywgcGFpcnMpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGdldCBlbGVtZW50KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZGVmLnZhbHVlVHlwZTtcbiAgICB9XG4gICAgc3RhdGljIGNyZWF0ZShmaXJzdCwgc2Vjb25kLCB0aGlyZCkge1xuICAgICAgICBpZiAoc2Vjb25kIGluc3RhbmNlb2YgWm9kVHlwZSkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBab2RSZWNvcmQoe1xuICAgICAgICAgICAgICAgIGtleVR5cGU6IGZpcnN0LFxuICAgICAgICAgICAgICAgIHZhbHVlVHlwZTogc2Vjb25kLFxuICAgICAgICAgICAgICAgIHR5cGVOYW1lOiBab2RGaXJzdFBhcnR5VHlwZUtpbmQuWm9kUmVjb3JkLFxuICAgICAgICAgICAgICAgIC4uLnByb2Nlc3NDcmVhdGVQYXJhbXModGhpcmQpLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ldyBab2RSZWNvcmQoe1xuICAgICAgICAgICAga2V5VHlwZTogWm9kU3RyaW5nLmNyZWF0ZSgpLFxuICAgICAgICAgICAgdmFsdWVUeXBlOiBmaXJzdCxcbiAgICAgICAgICAgIHR5cGVOYW1lOiBab2RGaXJzdFBhcnR5VHlwZUtpbmQuWm9kUmVjb3JkLFxuICAgICAgICAgICAgLi4ucHJvY2Vzc0NyZWF0ZVBhcmFtcyhzZWNvbmQpLFxuICAgICAgICB9KTtcbiAgICB9XG59XG5leHBvcnQgY2xhc3MgWm9kTWFwIGV4dGVuZHMgWm9kVHlwZSB7XG4gICAgZ2V0IGtleVNjaGVtYSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2RlZi5rZXlUeXBlO1xuICAgIH1cbiAgICBnZXQgdmFsdWVTY2hlbWEoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9kZWYudmFsdWVUeXBlO1xuICAgIH1cbiAgICBfcGFyc2UoaW5wdXQpIHtcbiAgICAgICAgY29uc3QgeyBzdGF0dXMsIGN0eCB9ID0gdGhpcy5fcHJvY2Vzc0lucHV0UGFyYW1zKGlucHV0KTtcbiAgICAgICAgaWYgKGN0eC5wYXJzZWRUeXBlICE9PSBab2RQYXJzZWRUeXBlLm1hcCkge1xuICAgICAgICAgICAgYWRkSXNzdWVUb0NvbnRleHQoY3R4LCB7XG4gICAgICAgICAgICAgICAgY29kZTogWm9kSXNzdWVDb2RlLmludmFsaWRfdHlwZSxcbiAgICAgICAgICAgICAgICBleHBlY3RlZDogWm9kUGFyc2VkVHlwZS5tYXAsXG4gICAgICAgICAgICAgICAgcmVjZWl2ZWQ6IGN0eC5wYXJzZWRUeXBlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gSU5WQUxJRDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBrZXlUeXBlID0gdGhpcy5fZGVmLmtleVR5cGU7XG4gICAgICAgIGNvbnN0IHZhbHVlVHlwZSA9IHRoaXMuX2RlZi52YWx1ZVR5cGU7XG4gICAgICAgIGNvbnN0IHBhaXJzID0gWy4uLmN0eC5kYXRhLmVudHJpZXMoKV0ubWFwKChba2V5LCB2YWx1ZV0sIGluZGV4KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGtleToga2V5VHlwZS5fcGFyc2UobmV3IFBhcnNlSW5wdXRMYXp5UGF0aChjdHgsIGtleSwgY3R4LnBhdGgsIFtpbmRleCwgXCJrZXlcIl0pKSxcbiAgICAgICAgICAgICAgICB2YWx1ZTogdmFsdWVUeXBlLl9wYXJzZShuZXcgUGFyc2VJbnB1dExhenlQYXRoKGN0eCwgdmFsdWUsIGN0eC5wYXRoLCBbaW5kZXgsIFwidmFsdWVcIl0pKSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoY3R4LmNvbW1vbi5hc3luYykge1xuICAgICAgICAgICAgY29uc3QgZmluYWxNYXAgPSBuZXcgTWFwKCk7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbihhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBwYWlyIG9mIHBhaXJzKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGtleSA9IGF3YWl0IHBhaXIua2V5O1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZSA9IGF3YWl0IHBhaXIudmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIGlmIChrZXkuc3RhdHVzID09PSBcImFib3J0ZWRcIiB8fCB2YWx1ZS5zdGF0dXMgPT09IFwiYWJvcnRlZFwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gSU5WQUxJRDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoa2V5LnN0YXR1cyA9PT0gXCJkaXJ0eVwiIHx8IHZhbHVlLnN0YXR1cyA9PT0gXCJkaXJ0eVwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXMuZGlydHkoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBmaW5hbE1hcC5zZXQoa2V5LnZhbHVlLCB2YWx1ZS52YWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB7IHN0YXR1czogc3RhdHVzLnZhbHVlLCB2YWx1ZTogZmluYWxNYXAgfTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgZmluYWxNYXAgPSBuZXcgTWFwKCk7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IHBhaXIgb2YgcGFpcnMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBrZXkgPSBwYWlyLmtleTtcbiAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZSA9IHBhaXIudmFsdWU7XG4gICAgICAgICAgICAgICAgaWYgKGtleS5zdGF0dXMgPT09IFwiYWJvcnRlZFwiIHx8IHZhbHVlLnN0YXR1cyA9PT0gXCJhYm9ydGVkXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIElOVkFMSUQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChrZXkuc3RhdHVzID09PSBcImRpcnR5XCIgfHwgdmFsdWUuc3RhdHVzID09PSBcImRpcnR5XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RhdHVzLmRpcnR5KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZpbmFsTWFwLnNldChrZXkudmFsdWUsIHZhbHVlLnZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7IHN0YXR1czogc3RhdHVzLnZhbHVlLCB2YWx1ZTogZmluYWxNYXAgfTtcbiAgICAgICAgfVxuICAgIH1cbn1cblpvZE1hcC5jcmVhdGUgPSAoa2V5VHlwZSwgdmFsdWVUeXBlLCBwYXJhbXMpID0+IHtcbiAgICByZXR1cm4gbmV3IFpvZE1hcCh7XG4gICAgICAgIHZhbHVlVHlwZSxcbiAgICAgICAga2V5VHlwZSxcbiAgICAgICAgdHlwZU5hbWU6IFpvZEZpcnN0UGFydHlUeXBlS2luZC5ab2RNYXAsXG4gICAgICAgIC4uLnByb2Nlc3NDcmVhdGVQYXJhbXMocGFyYW1zKSxcbiAgICB9KTtcbn07XG5leHBvcnQgY2xhc3MgWm9kU2V0IGV4dGVuZHMgWm9kVHlwZSB7XG4gICAgX3BhcnNlKGlucHV0KSB7XG4gICAgICAgIGNvbnN0IHsgc3RhdHVzLCBjdHggfSA9IHRoaXMuX3Byb2Nlc3NJbnB1dFBhcmFtcyhpbnB1dCk7XG4gICAgICAgIGlmIChjdHgucGFyc2VkVHlwZSAhPT0gWm9kUGFyc2VkVHlwZS5zZXQpIHtcbiAgICAgICAgICAgIGFkZElzc3VlVG9Db250ZXh0KGN0eCwge1xuICAgICAgICAgICAgICAgIGNvZGU6IFpvZElzc3VlQ29kZS5pbnZhbGlkX3R5cGUsXG4gICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFpvZFBhcnNlZFR5cGUuc2V0LFxuICAgICAgICAgICAgICAgIHJlY2VpdmVkOiBjdHgucGFyc2VkVHlwZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIElOVkFMSUQ7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZGVmID0gdGhpcy5fZGVmO1xuICAgICAgICBpZiAoZGVmLm1pblNpemUgIT09IG51bGwpIHtcbiAgICAgICAgICAgIGlmIChjdHguZGF0YS5zaXplIDwgZGVmLm1pblNpemUudmFsdWUpIHtcbiAgICAgICAgICAgICAgICBhZGRJc3N1ZVRvQ29udGV4dChjdHgsIHtcbiAgICAgICAgICAgICAgICAgICAgY29kZTogWm9kSXNzdWVDb2RlLnRvb19zbWFsbCxcbiAgICAgICAgICAgICAgICAgICAgbWluaW11bTogZGVmLm1pblNpemUudmFsdWUsXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwic2V0XCIsXG4gICAgICAgICAgICAgICAgICAgIGluY2x1c2l2ZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgZXhhY3Q6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBkZWYubWluU2l6ZS5tZXNzYWdlLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHN0YXR1cy5kaXJ0eSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChkZWYubWF4U2l6ZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgaWYgKGN0eC5kYXRhLnNpemUgPiBkZWYubWF4U2l6ZS52YWx1ZSkge1xuICAgICAgICAgICAgICAgIGFkZElzc3VlVG9Db250ZXh0KGN0eCwge1xuICAgICAgICAgICAgICAgICAgICBjb2RlOiBab2RJc3N1ZUNvZGUudG9vX2JpZyxcbiAgICAgICAgICAgICAgICAgICAgbWF4aW11bTogZGVmLm1heFNpemUudmFsdWUsXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwic2V0XCIsXG4gICAgICAgICAgICAgICAgICAgIGluY2x1c2l2ZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgZXhhY3Q6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBkZWYubWF4U2l6ZS5tZXNzYWdlLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHN0YXR1cy5kaXJ0eSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHZhbHVlVHlwZSA9IHRoaXMuX2RlZi52YWx1ZVR5cGU7XG4gICAgICAgIGZ1bmN0aW9uIGZpbmFsaXplU2V0KGVsZW1lbnRzKSB7XG4gICAgICAgICAgICBjb25zdCBwYXJzZWRTZXQgPSBuZXcgU2V0KCk7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGVsZW1lbnQgb2YgZWxlbWVudHMpIHtcbiAgICAgICAgICAgICAgICBpZiAoZWxlbWVudC5zdGF0dXMgPT09IFwiYWJvcnRlZFwiKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gSU5WQUxJRDtcbiAgICAgICAgICAgICAgICBpZiAoZWxlbWVudC5zdGF0dXMgPT09IFwiZGlydHlcIilcbiAgICAgICAgICAgICAgICAgICAgc3RhdHVzLmRpcnR5KCk7XG4gICAgICAgICAgICAgICAgcGFyc2VkU2V0LmFkZChlbGVtZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7IHN0YXR1czogc3RhdHVzLnZhbHVlLCB2YWx1ZTogcGFyc2VkU2V0IH07XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZWxlbWVudHMgPSBbLi4uY3R4LmRhdGEudmFsdWVzKCldLm1hcCgoaXRlbSwgaSkgPT4gdmFsdWVUeXBlLl9wYXJzZShuZXcgUGFyc2VJbnB1dExhenlQYXRoKGN0eCwgaXRlbSwgY3R4LnBhdGgsIGkpKSk7XG4gICAgICAgIGlmIChjdHguY29tbW9uLmFzeW5jKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoZWxlbWVudHMpLnRoZW4oKGVsZW1lbnRzKSA9PiBmaW5hbGl6ZVNldChlbGVtZW50cykpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGZpbmFsaXplU2V0KGVsZW1lbnRzKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBtaW4obWluU2l6ZSwgbWVzc2FnZSkge1xuICAgICAgICByZXR1cm4gbmV3IFpvZFNldCh7XG4gICAgICAgICAgICAuLi50aGlzLl9kZWYsXG4gICAgICAgICAgICBtaW5TaXplOiB7IHZhbHVlOiBtaW5TaXplLCBtZXNzYWdlOiBlcnJvclV0aWwudG9TdHJpbmcobWVzc2FnZSkgfSxcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIG1heChtYXhTaXplLCBtZXNzYWdlKSB7XG4gICAgICAgIHJldHVybiBuZXcgWm9kU2V0KHtcbiAgICAgICAgICAgIC4uLnRoaXMuX2RlZixcbiAgICAgICAgICAgIG1heFNpemU6IHsgdmFsdWU6IG1heFNpemUsIG1lc3NhZ2U6IGVycm9yVXRpbC50b1N0cmluZyhtZXNzYWdlKSB9LFxuICAgICAgICB9KTtcbiAgICB9XG4gICAgc2l6ZShzaXplLCBtZXNzYWdlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1pbihzaXplLCBtZXNzYWdlKS5tYXgoc2l6ZSwgbWVzc2FnZSk7XG4gICAgfVxuICAgIG5vbmVtcHR5KG1lc3NhZ2UpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubWluKDEsIG1lc3NhZ2UpO1xuICAgIH1cbn1cblpvZFNldC5jcmVhdGUgPSAodmFsdWVUeXBlLCBwYXJhbXMpID0+IHtcbiAgICByZXR1cm4gbmV3IFpvZFNldCh7XG4gICAgICAgIHZhbHVlVHlwZSxcbiAgICAgICAgbWluU2l6ZTogbnVsbCxcbiAgICAgICAgbWF4U2l6ZTogbnVsbCxcbiAgICAgICAgdHlwZU5hbWU6IFpvZEZpcnN0UGFydHlUeXBlS2luZC5ab2RTZXQsXG4gICAgICAgIC4uLnByb2Nlc3NDcmVhdGVQYXJhbXMocGFyYW1zKSxcbiAgICB9KTtcbn07XG5leHBvcnQgY2xhc3MgWm9kRnVuY3Rpb24gZXh0ZW5kcyBab2RUeXBlIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoLi4uYXJndW1lbnRzKTtcbiAgICAgICAgdGhpcy52YWxpZGF0ZSA9IHRoaXMuaW1wbGVtZW50O1xuICAgIH1cbiAgICBfcGFyc2UoaW5wdXQpIHtcbiAgICAgICAgY29uc3QgeyBjdHggfSA9IHRoaXMuX3Byb2Nlc3NJbnB1dFBhcmFtcyhpbnB1dCk7XG4gICAgICAgIGlmIChjdHgucGFyc2VkVHlwZSAhPT0gWm9kUGFyc2VkVHlwZS5mdW5jdGlvbikge1xuICAgICAgICAgICAgYWRkSXNzdWVUb0NvbnRleHQoY3R4LCB7XG4gICAgICAgICAgICAgICAgY29kZTogWm9kSXNzdWVDb2RlLmludmFsaWRfdHlwZSxcbiAgICAgICAgICAgICAgICBleHBlY3RlZDogWm9kUGFyc2VkVHlwZS5mdW5jdGlvbixcbiAgICAgICAgICAgICAgICByZWNlaXZlZDogY3R4LnBhcnNlZFR5cGUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBJTlZBTElEO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIG1ha2VBcmdzSXNzdWUoYXJncywgZXJyb3IpIHtcbiAgICAgICAgICAgIHJldHVybiBtYWtlSXNzdWUoe1xuICAgICAgICAgICAgICAgIGRhdGE6IGFyZ3MsXG4gICAgICAgICAgICAgICAgcGF0aDogY3R4LnBhdGgsXG4gICAgICAgICAgICAgICAgZXJyb3JNYXBzOiBbY3R4LmNvbW1vbi5jb250ZXh0dWFsRXJyb3JNYXAsIGN0eC5zY2hlbWFFcnJvck1hcCwgZ2V0RXJyb3JNYXAoKSwgZGVmYXVsdEVycm9yTWFwXS5maWx0ZXIoKHgpID0+ICEheCksXG4gICAgICAgICAgICAgICAgaXNzdWVEYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgIGNvZGU6IFpvZElzc3VlQ29kZS5pbnZhbGlkX2FyZ3VtZW50cyxcbiAgICAgICAgICAgICAgICAgICAgYXJndW1lbnRzRXJyb3I6IGVycm9yLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBtYWtlUmV0dXJuc0lzc3VlKHJldHVybnMsIGVycm9yKSB7XG4gICAgICAgICAgICByZXR1cm4gbWFrZUlzc3VlKHtcbiAgICAgICAgICAgICAgICBkYXRhOiByZXR1cm5zLFxuICAgICAgICAgICAgICAgIHBhdGg6IGN0eC5wYXRoLFxuICAgICAgICAgICAgICAgIGVycm9yTWFwczogW2N0eC5jb21tb24uY29udGV4dHVhbEVycm9yTWFwLCBjdHguc2NoZW1hRXJyb3JNYXAsIGdldEVycm9yTWFwKCksIGRlZmF1bHRFcnJvck1hcF0uZmlsdGVyKCh4KSA9PiAhIXgpLFxuICAgICAgICAgICAgICAgIGlzc3VlRGF0YToge1xuICAgICAgICAgICAgICAgICAgICBjb2RlOiBab2RJc3N1ZUNvZGUuaW52YWxpZF9yZXR1cm5fdHlwZSxcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuVHlwZUVycm9yOiBlcnJvcixcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcGFyYW1zID0geyBlcnJvck1hcDogY3R4LmNvbW1vbi5jb250ZXh0dWFsRXJyb3JNYXAgfTtcbiAgICAgICAgY29uc3QgZm4gPSBjdHguZGF0YTtcbiAgICAgICAgaWYgKHRoaXMuX2RlZi5yZXR1cm5zIGluc3RhbmNlb2YgWm9kUHJvbWlzZSkge1xuICAgICAgICAgICAgLy8gV291bGQgbG92ZSBhIHdheSB0byBhdm9pZCBkaXNhYmxpbmcgdGhpcyBydWxlLCBidXQgd2UgbmVlZFxuICAgICAgICAgICAgLy8gYW4gYWxpYXMgKHVzaW5nIGFuIGFycm93IGZ1bmN0aW9uIHdhcyB3aGF0IGNhdXNlZCAyNjUxKS5cbiAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdGhpcy1hbGlhc1xuICAgICAgICAgICAgY29uc3QgbWUgPSB0aGlzO1xuICAgICAgICAgICAgcmV0dXJuIE9LKGFzeW5jIGZ1bmN0aW9uICguLi5hcmdzKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZXJyb3IgPSBuZXcgWm9kRXJyb3IoW10pO1xuICAgICAgICAgICAgICAgIGNvbnN0IHBhcnNlZEFyZ3MgPSBhd2FpdCBtZS5fZGVmLmFyZ3MucGFyc2VBc3luYyhhcmdzLCBwYXJhbXMpLmNhdGNoKChlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yLmFkZElzc3VlKG1ha2VBcmdzSXNzdWUoYXJncywgZSkpO1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBSZWZsZWN0LmFwcGx5KGZuLCB0aGlzLCBwYXJzZWRBcmdzKTtcbiAgICAgICAgICAgICAgICBjb25zdCBwYXJzZWRSZXR1cm5zID0gYXdhaXQgbWUuX2RlZi5yZXR1cm5zLl9kZWYudHlwZVxuICAgICAgICAgICAgICAgICAgICAucGFyc2VBc3luYyhyZXN1bHQsIHBhcmFtcylcbiAgICAgICAgICAgICAgICAgICAgLmNhdGNoKChlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yLmFkZElzc3VlKG1ha2VSZXR1cm5zSXNzdWUocmVzdWx0LCBlKSk7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJzZWRSZXR1cm5zO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvLyBXb3VsZCBsb3ZlIGEgd2F5IHRvIGF2b2lkIGRpc2FibGluZyB0aGlzIHJ1bGUsIGJ1dCB3ZSBuZWVkXG4gICAgICAgICAgICAvLyBhbiBhbGlhcyAodXNpbmcgYW4gYXJyb3cgZnVuY3Rpb24gd2FzIHdoYXQgY2F1c2VkIDI2NTEpLlxuICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby10aGlzLWFsaWFzXG4gICAgICAgICAgICBjb25zdCBtZSA9IHRoaXM7XG4gICAgICAgICAgICByZXR1cm4gT0soZnVuY3Rpb24gKC4uLmFyZ3MpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwYXJzZWRBcmdzID0gbWUuX2RlZi5hcmdzLnNhZmVQYXJzZShhcmdzLCBwYXJhbXMpO1xuICAgICAgICAgICAgICAgIGlmICghcGFyc2VkQXJncy5zdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBab2RFcnJvcihbbWFrZUFyZ3NJc3N1ZShhcmdzLCBwYXJzZWRBcmdzLmVycm9yKV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBSZWZsZWN0LmFwcGx5KGZuLCB0aGlzLCBwYXJzZWRBcmdzLmRhdGEpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHBhcnNlZFJldHVybnMgPSBtZS5fZGVmLnJldHVybnMuc2FmZVBhcnNlKHJlc3VsdCwgcGFyYW1zKTtcbiAgICAgICAgICAgICAgICBpZiAoIXBhcnNlZFJldHVybnMuc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgWm9kRXJyb3IoW21ha2VSZXR1cm5zSXNzdWUocmVzdWx0LCBwYXJzZWRSZXR1cm5zLmVycm9yKV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VkUmV0dXJucy5kYXRhO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcGFyYW1ldGVycygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2RlZi5hcmdzO1xuICAgIH1cbiAgICByZXR1cm5UeXBlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZGVmLnJldHVybnM7XG4gICAgfVxuICAgIGFyZ3MoLi4uaXRlbXMpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBab2RGdW5jdGlvbih7XG4gICAgICAgICAgICAuLi50aGlzLl9kZWYsXG4gICAgICAgICAgICBhcmdzOiBab2RUdXBsZS5jcmVhdGUoaXRlbXMpLnJlc3QoWm9kVW5rbm93bi5jcmVhdGUoKSksXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm5zKHJldHVyblR5cGUpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBab2RGdW5jdGlvbih7XG4gICAgICAgICAgICAuLi50aGlzLl9kZWYsXG4gICAgICAgICAgICByZXR1cm5zOiByZXR1cm5UeXBlLFxuICAgICAgICB9KTtcbiAgICB9XG4gICAgaW1wbGVtZW50KGZ1bmMpIHtcbiAgICAgICAgY29uc3QgdmFsaWRhdGVkRnVuYyA9IHRoaXMucGFyc2UoZnVuYyk7XG4gICAgICAgIHJldHVybiB2YWxpZGF0ZWRGdW5jO1xuICAgIH1cbiAgICBzdHJpY3RJbXBsZW1lbnQoZnVuYykge1xuICAgICAgICBjb25zdCB2YWxpZGF0ZWRGdW5jID0gdGhpcy5wYXJzZShmdW5jKTtcbiAgICAgICAgcmV0dXJuIHZhbGlkYXRlZEZ1bmM7XG4gICAgfVxuICAgIHN0YXRpYyBjcmVhdGUoYXJncywgcmV0dXJucywgcGFyYW1zKSB7XG4gICAgICAgIHJldHVybiBuZXcgWm9kRnVuY3Rpb24oe1xuICAgICAgICAgICAgYXJnczogKGFyZ3MgPyBhcmdzIDogWm9kVHVwbGUuY3JlYXRlKFtdKS5yZXN0KFpvZFVua25vd24uY3JlYXRlKCkpKSxcbiAgICAgICAgICAgIHJldHVybnM6IHJldHVybnMgfHwgWm9kVW5rbm93bi5jcmVhdGUoKSxcbiAgICAgICAgICAgIHR5cGVOYW1lOiBab2RGaXJzdFBhcnR5VHlwZUtpbmQuWm9kRnVuY3Rpb24sXG4gICAgICAgICAgICAuLi5wcm9jZXNzQ3JlYXRlUGFyYW1zKHBhcmFtcyksXG4gICAgICAgIH0pO1xuICAgIH1cbn1cbmV4cG9ydCBjbGFzcyBab2RMYXp5IGV4dGVuZHMgWm9kVHlwZSB7XG4gICAgZ2V0IHNjaGVtYSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2RlZi5nZXR0ZXIoKTtcbiAgICB9XG4gICAgX3BhcnNlKGlucHV0KSB7XG4gICAgICAgIGNvbnN0IHsgY3R4IH0gPSB0aGlzLl9wcm9jZXNzSW5wdXRQYXJhbXMoaW5wdXQpO1xuICAgICAgICBjb25zdCBsYXp5U2NoZW1hID0gdGhpcy5fZGVmLmdldHRlcigpO1xuICAgICAgICByZXR1cm4gbGF6eVNjaGVtYS5fcGFyc2UoeyBkYXRhOiBjdHguZGF0YSwgcGF0aDogY3R4LnBhdGgsIHBhcmVudDogY3R4IH0pO1xuICAgIH1cbn1cblpvZExhenkuY3JlYXRlID0gKGdldHRlciwgcGFyYW1zKSA9PiB7XG4gICAgcmV0dXJuIG5ldyBab2RMYXp5KHtcbiAgICAgICAgZ2V0dGVyOiBnZXR0ZXIsXG4gICAgICAgIHR5cGVOYW1lOiBab2RGaXJzdFBhcnR5VHlwZUtpbmQuWm9kTGF6eSxcbiAgICAgICAgLi4ucHJvY2Vzc0NyZWF0ZVBhcmFtcyhwYXJhbXMpLFxuICAgIH0pO1xufTtcbmV4cG9ydCBjbGFzcyBab2RMaXRlcmFsIGV4dGVuZHMgWm9kVHlwZSB7XG4gICAgX3BhcnNlKGlucHV0KSB7XG4gICAgICAgIGlmIChpbnB1dC5kYXRhICE9PSB0aGlzLl9kZWYudmFsdWUpIHtcbiAgICAgICAgICAgIGNvbnN0IGN0eCA9IHRoaXMuX2dldE9yUmV0dXJuQ3R4KGlucHV0KTtcbiAgICAgICAgICAgIGFkZElzc3VlVG9Db250ZXh0KGN0eCwge1xuICAgICAgICAgICAgICAgIHJlY2VpdmVkOiBjdHguZGF0YSxcbiAgICAgICAgICAgICAgICBjb2RlOiBab2RJc3N1ZUNvZGUuaW52YWxpZF9saXRlcmFsLFxuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiB0aGlzLl9kZWYudmFsdWUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBJTlZBTElEO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7IHN0YXR1czogXCJ2YWxpZFwiLCB2YWx1ZTogaW5wdXQuZGF0YSB9O1xuICAgIH1cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9kZWYudmFsdWU7XG4gICAgfVxufVxuWm9kTGl0ZXJhbC5jcmVhdGUgPSAodmFsdWUsIHBhcmFtcykgPT4ge1xuICAgIHJldHVybiBuZXcgWm9kTGl0ZXJhbCh7XG4gICAgICAgIHZhbHVlOiB2YWx1ZSxcbiAgICAgICAgdHlwZU5hbWU6IFpvZEZpcnN0UGFydHlUeXBlS2luZC5ab2RMaXRlcmFsLFxuICAgICAgICAuLi5wcm9jZXNzQ3JlYXRlUGFyYW1zKHBhcmFtcyksXG4gICAgfSk7XG59O1xuZnVuY3Rpb24gY3JlYXRlWm9kRW51bSh2YWx1ZXMsIHBhcmFtcykge1xuICAgIHJldHVybiBuZXcgWm9kRW51bSh7XG4gICAgICAgIHZhbHVlcyxcbiAgICAgICAgdHlwZU5hbWU6IFpvZEZpcnN0UGFydHlUeXBlS2luZC5ab2RFbnVtLFxuICAgICAgICAuLi5wcm9jZXNzQ3JlYXRlUGFyYW1zKHBhcmFtcyksXG4gICAgfSk7XG59XG5leHBvcnQgY2xhc3MgWm9kRW51bSBleHRlbmRzIFpvZFR5cGUge1xuICAgIF9wYXJzZShpbnB1dCkge1xuICAgICAgICBpZiAodHlwZW9mIGlucHV0LmRhdGEgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIGNvbnN0IGN0eCA9IHRoaXMuX2dldE9yUmV0dXJuQ3R4KGlucHV0KTtcbiAgICAgICAgICAgIGNvbnN0IGV4cGVjdGVkVmFsdWVzID0gdGhpcy5fZGVmLnZhbHVlcztcbiAgICAgICAgICAgIGFkZElzc3VlVG9Db250ZXh0KGN0eCwge1xuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiB1dGlsLmpvaW5WYWx1ZXMoZXhwZWN0ZWRWYWx1ZXMpLFxuICAgICAgICAgICAgICAgIHJlY2VpdmVkOiBjdHgucGFyc2VkVHlwZSxcbiAgICAgICAgICAgICAgICBjb2RlOiBab2RJc3N1ZUNvZGUuaW52YWxpZF90eXBlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gSU5WQUxJRDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMuX2NhY2hlKSB7XG4gICAgICAgICAgICB0aGlzLl9jYWNoZSA9IG5ldyBTZXQodGhpcy5fZGVmLnZhbHVlcyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLl9jYWNoZS5oYXMoaW5wdXQuZGF0YSkpIHtcbiAgICAgICAgICAgIGNvbnN0IGN0eCA9IHRoaXMuX2dldE9yUmV0dXJuQ3R4KGlucHV0KTtcbiAgICAgICAgICAgIGNvbnN0IGV4cGVjdGVkVmFsdWVzID0gdGhpcy5fZGVmLnZhbHVlcztcbiAgICAgICAgICAgIGFkZElzc3VlVG9Db250ZXh0KGN0eCwge1xuICAgICAgICAgICAgICAgIHJlY2VpdmVkOiBjdHguZGF0YSxcbiAgICAgICAgICAgICAgICBjb2RlOiBab2RJc3N1ZUNvZGUuaW52YWxpZF9lbnVtX3ZhbHVlLFxuICAgICAgICAgICAgICAgIG9wdGlvbnM6IGV4cGVjdGVkVmFsdWVzLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gSU5WQUxJRDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gT0soaW5wdXQuZGF0YSk7XG4gICAgfVxuICAgIGdldCBvcHRpb25zKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZGVmLnZhbHVlcztcbiAgICB9XG4gICAgZ2V0IGVudW0oKSB7XG4gICAgICAgIGNvbnN0IGVudW1WYWx1ZXMgPSB7fTtcbiAgICAgICAgZm9yIChjb25zdCB2YWwgb2YgdGhpcy5fZGVmLnZhbHVlcykge1xuICAgICAgICAgICAgZW51bVZhbHVlc1t2YWxdID0gdmFsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBlbnVtVmFsdWVzO1xuICAgIH1cbiAgICBnZXQgVmFsdWVzKCkge1xuICAgICAgICBjb25zdCBlbnVtVmFsdWVzID0ge307XG4gICAgICAgIGZvciAoY29uc3QgdmFsIG9mIHRoaXMuX2RlZi52YWx1ZXMpIHtcbiAgICAgICAgICAgIGVudW1WYWx1ZXNbdmFsXSA9IHZhbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZW51bVZhbHVlcztcbiAgICB9XG4gICAgZ2V0IEVudW0oKSB7XG4gICAgICAgIGNvbnN0IGVudW1WYWx1ZXMgPSB7fTtcbiAgICAgICAgZm9yIChjb25zdCB2YWwgb2YgdGhpcy5fZGVmLnZhbHVlcykge1xuICAgICAgICAgICAgZW51bVZhbHVlc1t2YWxdID0gdmFsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBlbnVtVmFsdWVzO1xuICAgIH1cbiAgICBleHRyYWN0KHZhbHVlcywgbmV3RGVmID0gdGhpcy5fZGVmKSB7XG4gICAgICAgIHJldHVybiBab2RFbnVtLmNyZWF0ZSh2YWx1ZXMsIHtcbiAgICAgICAgICAgIC4uLnRoaXMuX2RlZixcbiAgICAgICAgICAgIC4uLm5ld0RlZixcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGV4Y2x1ZGUodmFsdWVzLCBuZXdEZWYgPSB0aGlzLl9kZWYpIHtcbiAgICAgICAgcmV0dXJuIFpvZEVudW0uY3JlYXRlKHRoaXMub3B0aW9ucy5maWx0ZXIoKG9wdCkgPT4gIXZhbHVlcy5pbmNsdWRlcyhvcHQpKSwge1xuICAgICAgICAgICAgLi4udGhpcy5fZGVmLFxuICAgICAgICAgICAgLi4ubmV3RGVmLFxuICAgICAgICB9KTtcbiAgICB9XG59XG5ab2RFbnVtLmNyZWF0ZSA9IGNyZWF0ZVpvZEVudW07XG5leHBvcnQgY2xhc3MgWm9kTmF0aXZlRW51bSBleHRlbmRzIFpvZFR5cGUge1xuICAgIF9wYXJzZShpbnB1dCkge1xuICAgICAgICBjb25zdCBuYXRpdmVFbnVtVmFsdWVzID0gdXRpbC5nZXRWYWxpZEVudW1WYWx1ZXModGhpcy5fZGVmLnZhbHVlcyk7XG4gICAgICAgIGNvbnN0IGN0eCA9IHRoaXMuX2dldE9yUmV0dXJuQ3R4KGlucHV0KTtcbiAgICAgICAgaWYgKGN0eC5wYXJzZWRUeXBlICE9PSBab2RQYXJzZWRUeXBlLnN0cmluZyAmJiBjdHgucGFyc2VkVHlwZSAhPT0gWm9kUGFyc2VkVHlwZS5udW1iZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IGV4cGVjdGVkVmFsdWVzID0gdXRpbC5vYmplY3RWYWx1ZXMobmF0aXZlRW51bVZhbHVlcyk7XG4gICAgICAgICAgICBhZGRJc3N1ZVRvQ29udGV4dChjdHgsIHtcbiAgICAgICAgICAgICAgICBleHBlY3RlZDogdXRpbC5qb2luVmFsdWVzKGV4cGVjdGVkVmFsdWVzKSxcbiAgICAgICAgICAgICAgICByZWNlaXZlZDogY3R4LnBhcnNlZFR5cGUsXG4gICAgICAgICAgICAgICAgY29kZTogWm9kSXNzdWVDb2RlLmludmFsaWRfdHlwZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIElOVkFMSUQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLl9jYWNoZSkge1xuICAgICAgICAgICAgdGhpcy5fY2FjaGUgPSBuZXcgU2V0KHV0aWwuZ2V0VmFsaWRFbnVtVmFsdWVzKHRoaXMuX2RlZi52YWx1ZXMpKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMuX2NhY2hlLmhhcyhpbnB1dC5kYXRhKSkge1xuICAgICAgICAgICAgY29uc3QgZXhwZWN0ZWRWYWx1ZXMgPSB1dGlsLm9iamVjdFZhbHVlcyhuYXRpdmVFbnVtVmFsdWVzKTtcbiAgICAgICAgICAgIGFkZElzc3VlVG9Db250ZXh0KGN0eCwge1xuICAgICAgICAgICAgICAgIHJlY2VpdmVkOiBjdHguZGF0YSxcbiAgICAgICAgICAgICAgICBjb2RlOiBab2RJc3N1ZUNvZGUuaW52YWxpZF9lbnVtX3ZhbHVlLFxuICAgICAgICAgICAgICAgIG9wdGlvbnM6IGV4cGVjdGVkVmFsdWVzLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gSU5WQUxJRDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gT0soaW5wdXQuZGF0YSk7XG4gICAgfVxuICAgIGdldCBlbnVtKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZGVmLnZhbHVlcztcbiAgICB9XG59XG5ab2ROYXRpdmVFbnVtLmNyZWF0ZSA9ICh2YWx1ZXMsIHBhcmFtcykgPT4ge1xuICAgIHJldHVybiBuZXcgWm9kTmF0aXZlRW51bSh7XG4gICAgICAgIHZhbHVlczogdmFsdWVzLFxuICAgICAgICB0eXBlTmFtZTogWm9kRmlyc3RQYXJ0eVR5cGVLaW5kLlpvZE5hdGl2ZUVudW0sXG4gICAgICAgIC4uLnByb2Nlc3NDcmVhdGVQYXJhbXMocGFyYW1zKSxcbiAgICB9KTtcbn07XG5leHBvcnQgY2xhc3MgWm9kUHJvbWlzZSBleHRlbmRzIFpvZFR5cGUge1xuICAgIHVud3JhcCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2RlZi50eXBlO1xuICAgIH1cbiAgICBfcGFyc2UoaW5wdXQpIHtcbiAgICAgICAgY29uc3QgeyBjdHggfSA9IHRoaXMuX3Byb2Nlc3NJbnB1dFBhcmFtcyhpbnB1dCk7XG4gICAgICAgIGlmIChjdHgucGFyc2VkVHlwZSAhPT0gWm9kUGFyc2VkVHlwZS5wcm9taXNlICYmIGN0eC5jb21tb24uYXN5bmMgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICBhZGRJc3N1ZVRvQ29udGV4dChjdHgsIHtcbiAgICAgICAgICAgICAgICBjb2RlOiBab2RJc3N1ZUNvZGUuaW52YWxpZF90eXBlLFxuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBab2RQYXJzZWRUeXBlLnByb21pc2UsXG4gICAgICAgICAgICAgICAgcmVjZWl2ZWQ6IGN0eC5wYXJzZWRUeXBlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gSU5WQUxJRDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBwcm9taXNpZmllZCA9IGN0eC5wYXJzZWRUeXBlID09PSBab2RQYXJzZWRUeXBlLnByb21pc2UgPyBjdHguZGF0YSA6IFByb21pc2UucmVzb2x2ZShjdHguZGF0YSk7XG4gICAgICAgIHJldHVybiBPSyhwcm9taXNpZmllZC50aGVuKChkYXRhKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fZGVmLnR5cGUucGFyc2VBc3luYyhkYXRhLCB7XG4gICAgICAgICAgICAgICAgcGF0aDogY3R4LnBhdGgsXG4gICAgICAgICAgICAgICAgZXJyb3JNYXA6IGN0eC5jb21tb24uY29udGV4dHVhbEVycm9yTWFwLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pKTtcbiAgICB9XG59XG5ab2RQcm9taXNlLmNyZWF0ZSA9IChzY2hlbWEsIHBhcmFtcykgPT4ge1xuICAgIHJldHVybiBuZXcgWm9kUHJvbWlzZSh7XG4gICAgICAgIHR5cGU6IHNjaGVtYSxcbiAgICAgICAgdHlwZU5hbWU6IFpvZEZpcnN0UGFydHlUeXBlS2luZC5ab2RQcm9taXNlLFxuICAgICAgICAuLi5wcm9jZXNzQ3JlYXRlUGFyYW1zKHBhcmFtcyksXG4gICAgfSk7XG59O1xuZXhwb3J0IGNsYXNzIFpvZEVmZmVjdHMgZXh0ZW5kcyBab2RUeXBlIHtcbiAgICBpbm5lclR5cGUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9kZWYuc2NoZW1hO1xuICAgIH1cbiAgICBzb3VyY2VUeXBlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZGVmLnNjaGVtYS5fZGVmLnR5cGVOYW1lID09PSBab2RGaXJzdFBhcnR5VHlwZUtpbmQuWm9kRWZmZWN0c1xuICAgICAgICAgICAgPyB0aGlzLl9kZWYuc2NoZW1hLnNvdXJjZVR5cGUoKVxuICAgICAgICAgICAgOiB0aGlzLl9kZWYuc2NoZW1hO1xuICAgIH1cbiAgICBfcGFyc2UoaW5wdXQpIHtcbiAgICAgICAgY29uc3QgeyBzdGF0dXMsIGN0eCB9ID0gdGhpcy5fcHJvY2Vzc0lucHV0UGFyYW1zKGlucHV0KTtcbiAgICAgICAgY29uc3QgZWZmZWN0ID0gdGhpcy5fZGVmLmVmZmVjdCB8fCBudWxsO1xuICAgICAgICBjb25zdCBjaGVja0N0eCA9IHtcbiAgICAgICAgICAgIGFkZElzc3VlOiAoYXJnKSA9PiB7XG4gICAgICAgICAgICAgICAgYWRkSXNzdWVUb0NvbnRleHQoY3R4LCBhcmcpO1xuICAgICAgICAgICAgICAgIGlmIChhcmcuZmF0YWwpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RhdHVzLmFib3J0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzdGF0dXMuZGlydHkoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0IHBhdGgoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGN0eC5wYXRoO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfTtcbiAgICAgICAgY2hlY2tDdHguYWRkSXNzdWUgPSBjaGVja0N0eC5hZGRJc3N1ZS5iaW5kKGNoZWNrQ3R4KTtcbiAgICAgICAgaWYgKGVmZmVjdC50eXBlID09PSBcInByZXByb2Nlc3NcIikge1xuICAgICAgICAgICAgY29uc3QgcHJvY2Vzc2VkID0gZWZmZWN0LnRyYW5zZm9ybShjdHguZGF0YSwgY2hlY2tDdHgpO1xuICAgICAgICAgICAgaWYgKGN0eC5jb21tb24uYXN5bmMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHByb2Nlc3NlZCkudGhlbihhc3luYyAocHJvY2Vzc2VkKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzdGF0dXMudmFsdWUgPT09IFwiYWJvcnRlZFwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIElOVkFMSUQ7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuX2RlZi5zY2hlbWEuX3BhcnNlQXN5bmMoe1xuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YTogcHJvY2Vzc2VkLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDogY3R4LnBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnQ6IGN0eCxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQuc3RhdHVzID09PSBcImFib3J0ZWRcIilcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBJTlZBTElEO1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0LnN0YXR1cyA9PT0gXCJkaXJ0eVwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIERJUlRZKHJlc3VsdC52YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzdGF0dXMudmFsdWUgPT09IFwiZGlydHlcIilcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBESVJUWShyZXN1bHQudmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXR1cy52YWx1ZSA9PT0gXCJhYm9ydGVkXCIpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBJTlZBTElEO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuX2RlZi5zY2hlbWEuX3BhcnNlU3luYyh7XG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHByb2Nlc3NlZCxcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogY3R4LnBhdGgsXG4gICAgICAgICAgICAgICAgICAgIHBhcmVudDogY3R4LFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGlmIChyZXN1bHQuc3RhdHVzID09PSBcImFib3J0ZWRcIilcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIElOVkFMSUQ7XG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdC5zdGF0dXMgPT09IFwiZGlydHlcIilcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIERJUlRZKHJlc3VsdC52YWx1ZSk7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXR1cy52YWx1ZSA9PT0gXCJkaXJ0eVwiKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gRElSVFkocmVzdWx0LnZhbHVlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChlZmZlY3QudHlwZSA9PT0gXCJyZWZpbmVtZW50XCIpIHtcbiAgICAgICAgICAgIGNvbnN0IGV4ZWN1dGVSZWZpbmVtZW50ID0gKGFjYykgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGVmZmVjdC5yZWZpbmVtZW50KGFjYywgY2hlY2tDdHgpO1xuICAgICAgICAgICAgICAgIGlmIChjdHguY29tbW9uLmFzeW5jKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUocmVzdWx0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdCBpbnN0YW5jZW9mIFByb21pc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQXN5bmMgcmVmaW5lbWVudCBlbmNvdW50ZXJlZCBkdXJpbmcgc3luY2hyb25vdXMgcGFyc2Ugb3BlcmF0aW9uLiBVc2UgLnBhcnNlQXN5bmMgaW5zdGVhZC5cIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaWYgKGN0eC5jb21tb24uYXN5bmMgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaW5uZXIgPSB0aGlzLl9kZWYuc2NoZW1hLl9wYXJzZVN5bmMoe1xuICAgICAgICAgICAgICAgICAgICBkYXRhOiBjdHguZGF0YSxcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogY3R4LnBhdGgsXG4gICAgICAgICAgICAgICAgICAgIHBhcmVudDogY3R4LFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGlmIChpbm5lci5zdGF0dXMgPT09IFwiYWJvcnRlZFwiKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gSU5WQUxJRDtcbiAgICAgICAgICAgICAgICBpZiAoaW5uZXIuc3RhdHVzID09PSBcImRpcnR5XCIpXG4gICAgICAgICAgICAgICAgICAgIHN0YXR1cy5kaXJ0eSgpO1xuICAgICAgICAgICAgICAgIC8vIHJldHVybiB2YWx1ZSBpcyBpZ25vcmVkXG4gICAgICAgICAgICAgICAgZXhlY3V0ZVJlZmluZW1lbnQoaW5uZXIudmFsdWUpO1xuICAgICAgICAgICAgICAgIHJldHVybiB7IHN0YXR1czogc3RhdHVzLnZhbHVlLCB2YWx1ZTogaW5uZXIudmFsdWUgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9kZWYuc2NoZW1hLl9wYXJzZUFzeW5jKHsgZGF0YTogY3R4LmRhdGEsIHBhdGg6IGN0eC5wYXRoLCBwYXJlbnQ6IGN0eCB9KS50aGVuKChpbm5lcikgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5uZXIuc3RhdHVzID09PSBcImFib3J0ZWRcIilcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBJTlZBTElEO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5uZXIuc3RhdHVzID09PSBcImRpcnR5XCIpXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXMuZGlydHkoKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGV4ZWN1dGVSZWZpbmVtZW50KGlubmVyLnZhbHVlKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7IHN0YXR1czogc3RhdHVzLnZhbHVlLCB2YWx1ZTogaW5uZXIudmFsdWUgfTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGVmZmVjdC50eXBlID09PSBcInRyYW5zZm9ybVwiKSB7XG4gICAgICAgICAgICBpZiAoY3R4LmNvbW1vbi5hc3luYyA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBiYXNlID0gdGhpcy5fZGVmLnNjaGVtYS5fcGFyc2VTeW5jKHtcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogY3R4LmRhdGEsXG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IGN0eC5wYXRoLFxuICAgICAgICAgICAgICAgICAgICBwYXJlbnQ6IGN0eCxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBpZiAoIWlzVmFsaWQoYmFzZSkpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBJTlZBTElEO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGVmZmVjdC50cmFuc2Zvcm0oYmFzZS52YWx1ZSwgY2hlY2tDdHgpO1xuICAgICAgICAgICAgICAgIGlmIChyZXN1bHQgaW5zdGFuY2VvZiBQcm9taXNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQXN5bmNocm9ub3VzIHRyYW5zZm9ybSBlbmNvdW50ZXJlZCBkdXJpbmcgc3luY2hyb25vdXMgcGFyc2Ugb3BlcmF0aW9uLiBVc2UgLnBhcnNlQXN5bmMgaW5zdGVhZC5gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgc3RhdHVzOiBzdGF0dXMudmFsdWUsIHZhbHVlOiByZXN1bHQgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9kZWYuc2NoZW1hLl9wYXJzZUFzeW5jKHsgZGF0YTogY3R4LmRhdGEsIHBhdGg6IGN0eC5wYXRoLCBwYXJlbnQ6IGN0eCB9KS50aGVuKChiYXNlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghaXNWYWxpZChiYXNlKSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBJTlZBTElEO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGVmZmVjdC50cmFuc2Zvcm0oYmFzZS52YWx1ZSwgY2hlY2tDdHgpKS50aGVuKChyZXN1bHQpID0+ICh7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXM6IHN0YXR1cy52YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiByZXN1bHQsXG4gICAgICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB1dGlsLmFzc2VydE5ldmVyKGVmZmVjdCk7XG4gICAgfVxufVxuWm9kRWZmZWN0cy5jcmVhdGUgPSAoc2NoZW1hLCBlZmZlY3QsIHBhcmFtcykgPT4ge1xuICAgIHJldHVybiBuZXcgWm9kRWZmZWN0cyh7XG4gICAgICAgIHNjaGVtYSxcbiAgICAgICAgdHlwZU5hbWU6IFpvZEZpcnN0UGFydHlUeXBlS2luZC5ab2RFZmZlY3RzLFxuICAgICAgICBlZmZlY3QsXG4gICAgICAgIC4uLnByb2Nlc3NDcmVhdGVQYXJhbXMocGFyYW1zKSxcbiAgICB9KTtcbn07XG5ab2RFZmZlY3RzLmNyZWF0ZVdpdGhQcmVwcm9jZXNzID0gKHByZXByb2Nlc3MsIHNjaGVtYSwgcGFyYW1zKSA9PiB7XG4gICAgcmV0dXJuIG5ldyBab2RFZmZlY3RzKHtcbiAgICAgICAgc2NoZW1hLFxuICAgICAgICBlZmZlY3Q6IHsgdHlwZTogXCJwcmVwcm9jZXNzXCIsIHRyYW5zZm9ybTogcHJlcHJvY2VzcyB9LFxuICAgICAgICB0eXBlTmFtZTogWm9kRmlyc3RQYXJ0eVR5cGVLaW5kLlpvZEVmZmVjdHMsXG4gICAgICAgIC4uLnByb2Nlc3NDcmVhdGVQYXJhbXMocGFyYW1zKSxcbiAgICB9KTtcbn07XG5leHBvcnQgeyBab2RFZmZlY3RzIGFzIFpvZFRyYW5zZm9ybWVyIH07XG5leHBvcnQgY2xhc3MgWm9kT3B0aW9uYWwgZXh0ZW5kcyBab2RUeXBlIHtcbiAgICBfcGFyc2UoaW5wdXQpIHtcbiAgICAgICAgY29uc3QgcGFyc2VkVHlwZSA9IHRoaXMuX2dldFR5cGUoaW5wdXQpO1xuICAgICAgICBpZiAocGFyc2VkVHlwZSA9PT0gWm9kUGFyc2VkVHlwZS51bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBPSyh1bmRlZmluZWQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLl9kZWYuaW5uZXJUeXBlLl9wYXJzZShpbnB1dCk7XG4gICAgfVxuICAgIHVud3JhcCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2RlZi5pbm5lclR5cGU7XG4gICAgfVxufVxuWm9kT3B0aW9uYWwuY3JlYXRlID0gKHR5cGUsIHBhcmFtcykgPT4ge1xuICAgIHJldHVybiBuZXcgWm9kT3B0aW9uYWwoe1xuICAgICAgICBpbm5lclR5cGU6IHR5cGUsXG4gICAgICAgIHR5cGVOYW1lOiBab2RGaXJzdFBhcnR5VHlwZUtpbmQuWm9kT3B0aW9uYWwsXG4gICAgICAgIC4uLnByb2Nlc3NDcmVhdGVQYXJhbXMocGFyYW1zKSxcbiAgICB9KTtcbn07XG5leHBvcnQgY2xhc3MgWm9kTnVsbGFibGUgZXh0ZW5kcyBab2RUeXBlIHtcbiAgICBfcGFyc2UoaW5wdXQpIHtcbiAgICAgICAgY29uc3QgcGFyc2VkVHlwZSA9IHRoaXMuX2dldFR5cGUoaW5wdXQpO1xuICAgICAgICBpZiAocGFyc2VkVHlwZSA9PT0gWm9kUGFyc2VkVHlwZS5udWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gT0sobnVsbCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX2RlZi5pbm5lclR5cGUuX3BhcnNlKGlucHV0KTtcbiAgICB9XG4gICAgdW53cmFwKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZGVmLmlubmVyVHlwZTtcbiAgICB9XG59XG5ab2ROdWxsYWJsZS5jcmVhdGUgPSAodHlwZSwgcGFyYW1zKSA9PiB7XG4gICAgcmV0dXJuIG5ldyBab2ROdWxsYWJsZSh7XG4gICAgICAgIGlubmVyVHlwZTogdHlwZSxcbiAgICAgICAgdHlwZU5hbWU6IFpvZEZpcnN0UGFydHlUeXBlS2luZC5ab2ROdWxsYWJsZSxcbiAgICAgICAgLi4ucHJvY2Vzc0NyZWF0ZVBhcmFtcyhwYXJhbXMpLFxuICAgIH0pO1xufTtcbmV4cG9ydCBjbGFzcyBab2REZWZhdWx0IGV4dGVuZHMgWm9kVHlwZSB7XG4gICAgX3BhcnNlKGlucHV0KSB7XG4gICAgICAgIGNvbnN0IHsgY3R4IH0gPSB0aGlzLl9wcm9jZXNzSW5wdXRQYXJhbXMoaW5wdXQpO1xuICAgICAgICBsZXQgZGF0YSA9IGN0eC5kYXRhO1xuICAgICAgICBpZiAoY3R4LnBhcnNlZFR5cGUgPT09IFpvZFBhcnNlZFR5cGUudW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBkYXRhID0gdGhpcy5fZGVmLmRlZmF1bHRWYWx1ZSgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLl9kZWYuaW5uZXJUeXBlLl9wYXJzZSh7XG4gICAgICAgICAgICBkYXRhLFxuICAgICAgICAgICAgcGF0aDogY3R4LnBhdGgsXG4gICAgICAgICAgICBwYXJlbnQ6IGN0eCxcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJlbW92ZURlZmF1bHQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9kZWYuaW5uZXJUeXBlO1xuICAgIH1cbn1cblpvZERlZmF1bHQuY3JlYXRlID0gKHR5cGUsIHBhcmFtcykgPT4ge1xuICAgIHJldHVybiBuZXcgWm9kRGVmYXVsdCh7XG4gICAgICAgIGlubmVyVHlwZTogdHlwZSxcbiAgICAgICAgdHlwZU5hbWU6IFpvZEZpcnN0UGFydHlUeXBlS2luZC5ab2REZWZhdWx0LFxuICAgICAgICBkZWZhdWx0VmFsdWU6IHR5cGVvZiBwYXJhbXMuZGVmYXVsdCA9PT0gXCJmdW5jdGlvblwiID8gcGFyYW1zLmRlZmF1bHQgOiAoKSA9PiBwYXJhbXMuZGVmYXVsdCxcbiAgICAgICAgLi4ucHJvY2Vzc0NyZWF0ZVBhcmFtcyhwYXJhbXMpLFxuICAgIH0pO1xufTtcbmV4cG9ydCBjbGFzcyBab2RDYXRjaCBleHRlbmRzIFpvZFR5cGUge1xuICAgIF9wYXJzZShpbnB1dCkge1xuICAgICAgICBjb25zdCB7IGN0eCB9ID0gdGhpcy5fcHJvY2Vzc0lucHV0UGFyYW1zKGlucHV0KTtcbiAgICAgICAgLy8gbmV3Q3R4IGlzIHVzZWQgdG8gbm90IGNvbGxlY3QgaXNzdWVzIGZyb20gaW5uZXIgdHlwZXMgaW4gY3R4XG4gICAgICAgIGNvbnN0IG5ld0N0eCA9IHtcbiAgICAgICAgICAgIC4uLmN0eCxcbiAgICAgICAgICAgIGNvbW1vbjoge1xuICAgICAgICAgICAgICAgIC4uLmN0eC5jb21tb24sXG4gICAgICAgICAgICAgICAgaXNzdWVzOiBbXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuX2RlZi5pbm5lclR5cGUuX3BhcnNlKHtcbiAgICAgICAgICAgIGRhdGE6IG5ld0N0eC5kYXRhLFxuICAgICAgICAgICAgcGF0aDogbmV3Q3R4LnBhdGgsXG4gICAgICAgICAgICBwYXJlbnQ6IHtcbiAgICAgICAgICAgICAgICAuLi5uZXdDdHgsXG4gICAgICAgICAgICB9LFxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKGlzQXN5bmMocmVzdWx0KSkge1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdC50aGVuKChyZXN1bHQpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBzdGF0dXM6IFwidmFsaWRcIixcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHJlc3VsdC5zdGF0dXMgPT09IFwidmFsaWRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgPyByZXN1bHQudmFsdWVcbiAgICAgICAgICAgICAgICAgICAgICAgIDogdGhpcy5fZGVmLmNhdGNoVmFsdWUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldCBlcnJvcigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBab2RFcnJvcihuZXdDdHguY29tbW9uLmlzc3Vlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnB1dDogbmV3Q3R4LmRhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN0YXR1czogXCJ2YWxpZFwiLFxuICAgICAgICAgICAgICAgIHZhbHVlOiByZXN1bHQuc3RhdHVzID09PSBcInZhbGlkXCJcbiAgICAgICAgICAgICAgICAgICAgPyByZXN1bHQudmFsdWVcbiAgICAgICAgICAgICAgICAgICAgOiB0aGlzLl9kZWYuY2F0Y2hWYWx1ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICBnZXQgZXJyb3IoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBab2RFcnJvcihuZXdDdHguY29tbW9uLmlzc3Vlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXQ6IG5ld0N0eC5kYXRhLFxuICAgICAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmVtb3ZlQ2F0Y2goKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9kZWYuaW5uZXJUeXBlO1xuICAgIH1cbn1cblpvZENhdGNoLmNyZWF0ZSA9ICh0eXBlLCBwYXJhbXMpID0+IHtcbiAgICByZXR1cm4gbmV3IFpvZENhdGNoKHtcbiAgICAgICAgaW5uZXJUeXBlOiB0eXBlLFxuICAgICAgICB0eXBlTmFtZTogWm9kRmlyc3RQYXJ0eVR5cGVLaW5kLlpvZENhdGNoLFxuICAgICAgICBjYXRjaFZhbHVlOiB0eXBlb2YgcGFyYW1zLmNhdGNoID09PSBcImZ1bmN0aW9uXCIgPyBwYXJhbXMuY2F0Y2ggOiAoKSA9PiBwYXJhbXMuY2F0Y2gsXG4gICAgICAgIC4uLnByb2Nlc3NDcmVhdGVQYXJhbXMocGFyYW1zKSxcbiAgICB9KTtcbn07XG5leHBvcnQgY2xhc3MgWm9kTmFOIGV4dGVuZHMgWm9kVHlwZSB7XG4gICAgX3BhcnNlKGlucHV0KSB7XG4gICAgICAgIGNvbnN0IHBhcnNlZFR5cGUgPSB0aGlzLl9nZXRUeXBlKGlucHV0KTtcbiAgICAgICAgaWYgKHBhcnNlZFR5cGUgIT09IFpvZFBhcnNlZFR5cGUubmFuKSB7XG4gICAgICAgICAgICBjb25zdCBjdHggPSB0aGlzLl9nZXRPclJldHVybkN0eChpbnB1dCk7XG4gICAgICAgICAgICBhZGRJc3N1ZVRvQ29udGV4dChjdHgsIHtcbiAgICAgICAgICAgICAgICBjb2RlOiBab2RJc3N1ZUNvZGUuaW52YWxpZF90eXBlLFxuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBab2RQYXJzZWRUeXBlLm5hbixcbiAgICAgICAgICAgICAgICByZWNlaXZlZDogY3R4LnBhcnNlZFR5cGUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBJTlZBTElEO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7IHN0YXR1czogXCJ2YWxpZFwiLCB2YWx1ZTogaW5wdXQuZGF0YSB9O1xuICAgIH1cbn1cblpvZE5hTi5jcmVhdGUgPSAocGFyYW1zKSA9PiB7XG4gICAgcmV0dXJuIG5ldyBab2ROYU4oe1xuICAgICAgICB0eXBlTmFtZTogWm9kRmlyc3RQYXJ0eVR5cGVLaW5kLlpvZE5hTixcbiAgICAgICAgLi4ucHJvY2Vzc0NyZWF0ZVBhcmFtcyhwYXJhbXMpLFxuICAgIH0pO1xufTtcbmV4cG9ydCBjb25zdCBCUkFORCA9IFN5bWJvbChcInpvZF9icmFuZFwiKTtcbmV4cG9ydCBjbGFzcyBab2RCcmFuZGVkIGV4dGVuZHMgWm9kVHlwZSB7XG4gICAgX3BhcnNlKGlucHV0KSB7XG4gICAgICAgIGNvbnN0IHsgY3R4IH0gPSB0aGlzLl9wcm9jZXNzSW5wdXRQYXJhbXMoaW5wdXQpO1xuICAgICAgICBjb25zdCBkYXRhID0gY3R4LmRhdGE7XG4gICAgICAgIHJldHVybiB0aGlzLl9kZWYudHlwZS5fcGFyc2Uoe1xuICAgICAgICAgICAgZGF0YSxcbiAgICAgICAgICAgIHBhdGg6IGN0eC5wYXRoLFxuICAgICAgICAgICAgcGFyZW50OiBjdHgsXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICB1bndyYXAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9kZWYudHlwZTtcbiAgICB9XG59XG5leHBvcnQgY2xhc3MgWm9kUGlwZWxpbmUgZXh0ZW5kcyBab2RUeXBlIHtcbiAgICBfcGFyc2UoaW5wdXQpIHtcbiAgICAgICAgY29uc3QgeyBzdGF0dXMsIGN0eCB9ID0gdGhpcy5fcHJvY2Vzc0lucHV0UGFyYW1zKGlucHV0KTtcbiAgICAgICAgaWYgKGN0eC5jb21tb24uYXN5bmMpIHtcbiAgICAgICAgICAgIGNvbnN0IGhhbmRsZUFzeW5jID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGluUmVzdWx0ID0gYXdhaXQgdGhpcy5fZGVmLmluLl9wYXJzZUFzeW5jKHtcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogY3R4LmRhdGEsXG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IGN0eC5wYXRoLFxuICAgICAgICAgICAgICAgICAgICBwYXJlbnQ6IGN0eCxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBpZiAoaW5SZXN1bHQuc3RhdHVzID09PSBcImFib3J0ZWRcIilcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIElOVkFMSUQ7XG4gICAgICAgICAgICAgICAgaWYgKGluUmVzdWx0LnN0YXR1cyA9PT0gXCJkaXJ0eVwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXR1cy5kaXJ0eSgpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gRElSVFkoaW5SZXN1bHQudmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2RlZi5vdXQuX3BhcnNlQXN5bmMoe1xuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YTogaW5SZXN1bHQudmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRoOiBjdHgucGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudDogY3R4LFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmV0dXJuIGhhbmRsZUFzeW5jKCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBpblJlc3VsdCA9IHRoaXMuX2RlZi5pbi5fcGFyc2VTeW5jKHtcbiAgICAgICAgICAgICAgICBkYXRhOiBjdHguZGF0YSxcbiAgICAgICAgICAgICAgICBwYXRoOiBjdHgucGF0aCxcbiAgICAgICAgICAgICAgICBwYXJlbnQ6IGN0eCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKGluUmVzdWx0LnN0YXR1cyA9PT0gXCJhYm9ydGVkXCIpXG4gICAgICAgICAgICAgICAgcmV0dXJuIElOVkFMSUQ7XG4gICAgICAgICAgICBpZiAoaW5SZXN1bHQuc3RhdHVzID09PSBcImRpcnR5XCIpIHtcbiAgICAgICAgICAgICAgICBzdGF0dXMuZGlydHkoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBzdGF0dXM6IFwiZGlydHlcIixcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGluUmVzdWx0LnZhbHVlLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fZGVmLm91dC5fcGFyc2VTeW5jKHtcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogaW5SZXN1bHQudmFsdWUsXG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IGN0eC5wYXRoLFxuICAgICAgICAgICAgICAgICAgICBwYXJlbnQ6IGN0eCxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBzdGF0aWMgY3JlYXRlKGEsIGIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBab2RQaXBlbGluZSh7XG4gICAgICAgICAgICBpbjogYSxcbiAgICAgICAgICAgIG91dDogYixcbiAgICAgICAgICAgIHR5cGVOYW1lOiBab2RGaXJzdFBhcnR5VHlwZUtpbmQuWm9kUGlwZWxpbmUsXG4gICAgICAgIH0pO1xuICAgIH1cbn1cbmV4cG9ydCBjbGFzcyBab2RSZWFkb25seSBleHRlbmRzIFpvZFR5cGUge1xuICAgIF9wYXJzZShpbnB1dCkge1xuICAgICAgICBjb25zdCByZXN1bHQgPSB0aGlzLl9kZWYuaW5uZXJUeXBlLl9wYXJzZShpbnB1dCk7XG4gICAgICAgIGNvbnN0IGZyZWV6ZSA9IChkYXRhKSA9PiB7XG4gICAgICAgICAgICBpZiAoaXNWYWxpZChkYXRhKSkge1xuICAgICAgICAgICAgICAgIGRhdGEudmFsdWUgPSBPYmplY3QuZnJlZXplKGRhdGEudmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBpc0FzeW5jKHJlc3VsdCkgPyByZXN1bHQudGhlbigoZGF0YSkgPT4gZnJlZXplKGRhdGEpKSA6IGZyZWV6ZShyZXN1bHQpO1xuICAgIH1cbiAgICB1bndyYXAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9kZWYuaW5uZXJUeXBlO1xuICAgIH1cbn1cblpvZFJlYWRvbmx5LmNyZWF0ZSA9ICh0eXBlLCBwYXJhbXMpID0+IHtcbiAgICByZXR1cm4gbmV3IFpvZFJlYWRvbmx5KHtcbiAgICAgICAgaW5uZXJUeXBlOiB0eXBlLFxuICAgICAgICB0eXBlTmFtZTogWm9kRmlyc3RQYXJ0eVR5cGVLaW5kLlpvZFJlYWRvbmx5LFxuICAgICAgICAuLi5wcm9jZXNzQ3JlYXRlUGFyYW1zKHBhcmFtcyksXG4gICAgfSk7XG59O1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLy8vLy8vLyAgICAgICAgICAgICAgICAgICAgLy8vLy8vLy8vL1xuLy8vLy8vLy8vLyAgICAgIHouY3VzdG9tICAgICAgLy8vLy8vLy8vL1xuLy8vLy8vLy8vLyAgICAgICAgICAgICAgICAgICAgLy8vLy8vLy8vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuZnVuY3Rpb24gY2xlYW5QYXJhbXMocGFyYW1zLCBkYXRhKSB7XG4gICAgY29uc3QgcCA9IHR5cGVvZiBwYXJhbXMgPT09IFwiZnVuY3Rpb25cIiA/IHBhcmFtcyhkYXRhKSA6IHR5cGVvZiBwYXJhbXMgPT09IFwic3RyaW5nXCIgPyB7IG1lc3NhZ2U6IHBhcmFtcyB9IDogcGFyYW1zO1xuICAgIGNvbnN0IHAyID0gdHlwZW9mIHAgPT09IFwic3RyaW5nXCIgPyB7IG1lc3NhZ2U6IHAgfSA6IHA7XG4gICAgcmV0dXJuIHAyO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGN1c3RvbShjaGVjaywgX3BhcmFtcyA9IHt9LCBcbi8qKlxuICogQGRlcHJlY2F0ZWRcbiAqXG4gKiBQYXNzIGBmYXRhbGAgaW50byB0aGUgcGFyYW1zIG9iamVjdCBpbnN0ZWFkOlxuICpcbiAqIGBgYHRzXG4gKiB6LnN0cmluZygpLmN1c3RvbSgodmFsKSA9PiB2YWwubGVuZ3RoID4gNSwgeyBmYXRhbDogZmFsc2UgfSlcbiAqIGBgYFxuICpcbiAqL1xuZmF0YWwpIHtcbiAgICBpZiAoY2hlY2spXG4gICAgICAgIHJldHVybiBab2RBbnkuY3JlYXRlKCkuc3VwZXJSZWZpbmUoKGRhdGEsIGN0eCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgciA9IGNoZWNrKGRhdGEpO1xuICAgICAgICAgICAgaWYgKHIgaW5zdGFuY2VvZiBQcm9taXNlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHIudGhlbigocikgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhcmFtcyA9IGNsZWFuUGFyYW1zKF9wYXJhbXMsIGRhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgX2ZhdGFsID0gcGFyYW1zLmZhdGFsID8/IGZhdGFsID8/IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHguYWRkSXNzdWUoeyBjb2RlOiBcImN1c3RvbVwiLCAuLi5wYXJhbXMsIGZhdGFsOiBfZmF0YWwgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IHBhcmFtcyA9IGNsZWFuUGFyYW1zKF9wYXJhbXMsIGRhdGEpO1xuICAgICAgICAgICAgICAgIGNvbnN0IF9mYXRhbCA9IHBhcmFtcy5mYXRhbCA/PyBmYXRhbCA/PyB0cnVlO1xuICAgICAgICAgICAgICAgIGN0eC5hZGRJc3N1ZSh7IGNvZGU6IFwiY3VzdG9tXCIsIC4uLnBhcmFtcywgZmF0YWw6IF9mYXRhbCB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfSk7XG4gICAgcmV0dXJuIFpvZEFueS5jcmVhdGUoKTtcbn1cbmV4cG9ydCB7IFpvZFR5cGUgYXMgU2NoZW1hLCBab2RUeXBlIGFzIFpvZFNjaGVtYSB9O1xuZXhwb3J0IGNvbnN0IGxhdGUgPSB7XG4gICAgb2JqZWN0OiBab2RPYmplY3QubGF6eWNyZWF0ZSxcbn07XG5leHBvcnQgdmFyIFpvZEZpcnN0UGFydHlUeXBlS2luZDtcbihmdW5jdGlvbiAoWm9kRmlyc3RQYXJ0eVR5cGVLaW5kKSB7XG4gICAgWm9kRmlyc3RQYXJ0eVR5cGVLaW5kW1wiWm9kU3RyaW5nXCJdID0gXCJab2RTdHJpbmdcIjtcbiAgICBab2RGaXJzdFBhcnR5VHlwZUtpbmRbXCJab2ROdW1iZXJcIl0gPSBcIlpvZE51bWJlclwiO1xuICAgIFpvZEZpcnN0UGFydHlUeXBlS2luZFtcIlpvZE5hTlwiXSA9IFwiWm9kTmFOXCI7XG4gICAgWm9kRmlyc3RQYXJ0eVR5cGVLaW5kW1wiWm9kQmlnSW50XCJdID0gXCJab2RCaWdJbnRcIjtcbiAgICBab2RGaXJzdFBhcnR5VHlwZUtpbmRbXCJab2RCb29sZWFuXCJdID0gXCJab2RCb29sZWFuXCI7XG4gICAgWm9kRmlyc3RQYXJ0eVR5cGVLaW5kW1wiWm9kRGF0ZVwiXSA9IFwiWm9kRGF0ZVwiO1xuICAgIFpvZEZpcnN0UGFydHlUeXBlS2luZFtcIlpvZFN5bWJvbFwiXSA9IFwiWm9kU3ltYm9sXCI7XG4gICAgWm9kRmlyc3RQYXJ0eVR5cGVLaW5kW1wiWm9kVW5kZWZpbmVkXCJdID0gXCJab2RVbmRlZmluZWRcIjtcbiAgICBab2RGaXJzdFBhcnR5VHlwZUtpbmRbXCJab2ROdWxsXCJdID0gXCJab2ROdWxsXCI7XG4gICAgWm9kRmlyc3RQYXJ0eVR5cGVLaW5kW1wiWm9kQW55XCJdID0gXCJab2RBbnlcIjtcbiAgICBab2RGaXJzdFBhcnR5VHlwZUtpbmRbXCJab2RVbmtub3duXCJdID0gXCJab2RVbmtub3duXCI7XG4gICAgWm9kRmlyc3RQYXJ0eVR5cGVLaW5kW1wiWm9kTmV2ZXJcIl0gPSBcIlpvZE5ldmVyXCI7XG4gICAgWm9kRmlyc3RQYXJ0eVR5cGVLaW5kW1wiWm9kVm9pZFwiXSA9IFwiWm9kVm9pZFwiO1xuICAgIFpvZEZpcnN0UGFydHlUeXBlS2luZFtcIlpvZEFycmF5XCJdID0gXCJab2RBcnJheVwiO1xuICAgIFpvZEZpcnN0UGFydHlUeXBlS2luZFtcIlpvZE9iamVjdFwiXSA9IFwiWm9kT2JqZWN0XCI7XG4gICAgWm9kRmlyc3RQYXJ0eVR5cGVLaW5kW1wiWm9kVW5pb25cIl0gPSBcIlpvZFVuaW9uXCI7XG4gICAgWm9kRmlyc3RQYXJ0eVR5cGVLaW5kW1wiWm9kRGlzY3JpbWluYXRlZFVuaW9uXCJdID0gXCJab2REaXNjcmltaW5hdGVkVW5pb25cIjtcbiAgICBab2RGaXJzdFBhcnR5VHlwZUtpbmRbXCJab2RJbnRlcnNlY3Rpb25cIl0gPSBcIlpvZEludGVyc2VjdGlvblwiO1xuICAgIFpvZEZpcnN0UGFydHlUeXBlS2luZFtcIlpvZFR1cGxlXCJdID0gXCJab2RUdXBsZVwiO1xuICAgIFpvZEZpcnN0UGFydHlUeXBlS2luZFtcIlpvZFJlY29yZFwiXSA9IFwiWm9kUmVjb3JkXCI7XG4gICAgWm9kRmlyc3RQYXJ0eVR5cGVLaW5kW1wiWm9kTWFwXCJdID0gXCJab2RNYXBcIjtcbiAgICBab2RGaXJzdFBhcnR5VHlwZUtpbmRbXCJab2RTZXRcIl0gPSBcIlpvZFNldFwiO1xuICAgIFpvZEZpcnN0UGFydHlUeXBlS2luZFtcIlpvZEZ1bmN0aW9uXCJdID0gXCJab2RGdW5jdGlvblwiO1xuICAgIFpvZEZpcnN0UGFydHlUeXBlS2luZFtcIlpvZExhenlcIl0gPSBcIlpvZExhenlcIjtcbiAgICBab2RGaXJzdFBhcnR5VHlwZUtpbmRbXCJab2RMaXRlcmFsXCJdID0gXCJab2RMaXRlcmFsXCI7XG4gICAgWm9kRmlyc3RQYXJ0eVR5cGVLaW5kW1wiWm9kRW51bVwiXSA9IFwiWm9kRW51bVwiO1xuICAgIFpvZEZpcnN0UGFydHlUeXBlS2luZFtcIlpvZEVmZmVjdHNcIl0gPSBcIlpvZEVmZmVjdHNcIjtcbiAgICBab2RGaXJzdFBhcnR5VHlwZUtpbmRbXCJab2ROYXRpdmVFbnVtXCJdID0gXCJab2ROYXRpdmVFbnVtXCI7XG4gICAgWm9kRmlyc3RQYXJ0eVR5cGVLaW5kW1wiWm9kT3B0aW9uYWxcIl0gPSBcIlpvZE9wdGlvbmFsXCI7XG4gICAgWm9kRmlyc3RQYXJ0eVR5cGVLaW5kW1wiWm9kTnVsbGFibGVcIl0gPSBcIlpvZE51bGxhYmxlXCI7XG4gICAgWm9kRmlyc3RQYXJ0eVR5cGVLaW5kW1wiWm9kRGVmYXVsdFwiXSA9IFwiWm9kRGVmYXVsdFwiO1xuICAgIFpvZEZpcnN0UGFydHlUeXBlS2luZFtcIlpvZENhdGNoXCJdID0gXCJab2RDYXRjaFwiO1xuICAgIFpvZEZpcnN0UGFydHlUeXBlS2luZFtcIlpvZFByb21pc2VcIl0gPSBcIlpvZFByb21pc2VcIjtcbiAgICBab2RGaXJzdFBhcnR5VHlwZUtpbmRbXCJab2RCcmFuZGVkXCJdID0gXCJab2RCcmFuZGVkXCI7XG4gICAgWm9kRmlyc3RQYXJ0eVR5cGVLaW5kW1wiWm9kUGlwZWxpbmVcIl0gPSBcIlpvZFBpcGVsaW5lXCI7XG4gICAgWm9kRmlyc3RQYXJ0eVR5cGVLaW5kW1wiWm9kUmVhZG9ubHlcIl0gPSBcIlpvZFJlYWRvbmx5XCI7XG59KShab2RGaXJzdFBhcnR5VHlwZUtpbmQgfHwgKFpvZEZpcnN0UGFydHlUeXBlS2luZCA9IHt9KSk7XG4vLyByZXF1aXJlcyBUUyA0LjQrXG5jbGFzcyBDbGFzcyB7XG4gICAgY29uc3RydWN0b3IoLi4uXykgeyB9XG59XG5jb25zdCBpbnN0YW5jZU9mVHlwZSA9IChcbi8vIGNvbnN0IGluc3RhbmNlT2ZUeXBlID0gPFQgZXh0ZW5kcyBuZXcgKC4uLmFyZ3M6IGFueVtdKSA9PiBhbnk+KFxuY2xzLCBwYXJhbXMgPSB7XG4gICAgbWVzc2FnZTogYElucHV0IG5vdCBpbnN0YW5jZSBvZiAke2Nscy5uYW1lfWAsXG59KSA9PiBjdXN0b20oKGRhdGEpID0+IGRhdGEgaW5zdGFuY2VvZiBjbHMsIHBhcmFtcyk7XG5jb25zdCBzdHJpbmdUeXBlID0gWm9kU3RyaW5nLmNyZWF0ZTtcbmNvbnN0IG51bWJlclR5cGUgPSBab2ROdW1iZXIuY3JlYXRlO1xuY29uc3QgbmFuVHlwZSA9IFpvZE5hTi5jcmVhdGU7XG5jb25zdCBiaWdJbnRUeXBlID0gWm9kQmlnSW50LmNyZWF0ZTtcbmNvbnN0IGJvb2xlYW5UeXBlID0gWm9kQm9vbGVhbi5jcmVhdGU7XG5jb25zdCBkYXRlVHlwZSA9IFpvZERhdGUuY3JlYXRlO1xuY29uc3Qgc3ltYm9sVHlwZSA9IFpvZFN5bWJvbC5jcmVhdGU7XG5jb25zdCB1bmRlZmluZWRUeXBlID0gWm9kVW5kZWZpbmVkLmNyZWF0ZTtcbmNvbnN0IG51bGxUeXBlID0gWm9kTnVsbC5jcmVhdGU7XG5jb25zdCBhbnlUeXBlID0gWm9kQW55LmNyZWF0ZTtcbmNvbnN0IHVua25vd25UeXBlID0gWm9kVW5rbm93bi5jcmVhdGU7XG5jb25zdCBuZXZlclR5cGUgPSBab2ROZXZlci5jcmVhdGU7XG5jb25zdCB2b2lkVHlwZSA9IFpvZFZvaWQuY3JlYXRlO1xuY29uc3QgYXJyYXlUeXBlID0gWm9kQXJyYXkuY3JlYXRlO1xuY29uc3Qgb2JqZWN0VHlwZSA9IFpvZE9iamVjdC5jcmVhdGU7XG5jb25zdCBzdHJpY3RPYmplY3RUeXBlID0gWm9kT2JqZWN0LnN0cmljdENyZWF0ZTtcbmNvbnN0IHVuaW9uVHlwZSA9IFpvZFVuaW9uLmNyZWF0ZTtcbmNvbnN0IGRpc2NyaW1pbmF0ZWRVbmlvblR5cGUgPSBab2REaXNjcmltaW5hdGVkVW5pb24uY3JlYXRlO1xuY29uc3QgaW50ZXJzZWN0aW9uVHlwZSA9IFpvZEludGVyc2VjdGlvbi5jcmVhdGU7XG5jb25zdCB0dXBsZVR5cGUgPSBab2RUdXBsZS5jcmVhdGU7XG5jb25zdCByZWNvcmRUeXBlID0gWm9kUmVjb3JkLmNyZWF0ZTtcbmNvbnN0IG1hcFR5cGUgPSBab2RNYXAuY3JlYXRlO1xuY29uc3Qgc2V0VHlwZSA9IFpvZFNldC5jcmVhdGU7XG5jb25zdCBmdW5jdGlvblR5cGUgPSBab2RGdW5jdGlvbi5jcmVhdGU7XG5jb25zdCBsYXp5VHlwZSA9IFpvZExhenkuY3JlYXRlO1xuY29uc3QgbGl0ZXJhbFR5cGUgPSBab2RMaXRlcmFsLmNyZWF0ZTtcbmNvbnN0IGVudW1UeXBlID0gWm9kRW51bS5jcmVhdGU7XG5jb25zdCBuYXRpdmVFbnVtVHlwZSA9IFpvZE5hdGl2ZUVudW0uY3JlYXRlO1xuY29uc3QgcHJvbWlzZVR5cGUgPSBab2RQcm9taXNlLmNyZWF0ZTtcbmNvbnN0IGVmZmVjdHNUeXBlID0gWm9kRWZmZWN0cy5jcmVhdGU7XG5jb25zdCBvcHRpb25hbFR5cGUgPSBab2RPcHRpb25hbC5jcmVhdGU7XG5jb25zdCBudWxsYWJsZVR5cGUgPSBab2ROdWxsYWJsZS5jcmVhdGU7XG5jb25zdCBwcmVwcm9jZXNzVHlwZSA9IFpvZEVmZmVjdHMuY3JlYXRlV2l0aFByZXByb2Nlc3M7XG5jb25zdCBwaXBlbGluZVR5cGUgPSBab2RQaXBlbGluZS5jcmVhdGU7XG5jb25zdCBvc3RyaW5nID0gKCkgPT4gc3RyaW5nVHlwZSgpLm9wdGlvbmFsKCk7XG5jb25zdCBvbnVtYmVyID0gKCkgPT4gbnVtYmVyVHlwZSgpLm9wdGlvbmFsKCk7XG5jb25zdCBvYm9vbGVhbiA9ICgpID0+IGJvb2xlYW5UeXBlKCkub3B0aW9uYWwoKTtcbmV4cG9ydCBjb25zdCBjb2VyY2UgPSB7XG4gICAgc3RyaW5nOiAoKGFyZykgPT4gWm9kU3RyaW5nLmNyZWF0ZSh7IC4uLmFyZywgY29lcmNlOiB0cnVlIH0pKSxcbiAgICBudW1iZXI6ICgoYXJnKSA9PiBab2ROdW1iZXIuY3JlYXRlKHsgLi4uYXJnLCBjb2VyY2U6IHRydWUgfSkpLFxuICAgIGJvb2xlYW46ICgoYXJnKSA9PiBab2RCb29sZWFuLmNyZWF0ZSh7XG4gICAgICAgIC4uLmFyZyxcbiAgICAgICAgY29lcmNlOiB0cnVlLFxuICAgIH0pKSxcbiAgICBiaWdpbnQ6ICgoYXJnKSA9PiBab2RCaWdJbnQuY3JlYXRlKHsgLi4uYXJnLCBjb2VyY2U6IHRydWUgfSkpLFxuICAgIGRhdGU6ICgoYXJnKSA9PiBab2REYXRlLmNyZWF0ZSh7IC4uLmFyZywgY29lcmNlOiB0cnVlIH0pKSxcbn07XG5leHBvcnQgeyBhbnlUeXBlIGFzIGFueSwgYXJyYXlUeXBlIGFzIGFycmF5LCBiaWdJbnRUeXBlIGFzIGJpZ2ludCwgYm9vbGVhblR5cGUgYXMgYm9vbGVhbiwgZGF0ZVR5cGUgYXMgZGF0ZSwgZGlzY3JpbWluYXRlZFVuaW9uVHlwZSBhcyBkaXNjcmltaW5hdGVkVW5pb24sIGVmZmVjdHNUeXBlIGFzIGVmZmVjdCwgZW51bVR5cGUgYXMgZW51bSwgZnVuY3Rpb25UeXBlIGFzIGZ1bmN0aW9uLCBpbnN0YW5jZU9mVHlwZSBhcyBpbnN0YW5jZW9mLCBpbnRlcnNlY3Rpb25UeXBlIGFzIGludGVyc2VjdGlvbiwgbGF6eVR5cGUgYXMgbGF6eSwgbGl0ZXJhbFR5cGUgYXMgbGl0ZXJhbCwgbWFwVHlwZSBhcyBtYXAsIG5hblR5cGUgYXMgbmFuLCBuYXRpdmVFbnVtVHlwZSBhcyBuYXRpdmVFbnVtLCBuZXZlclR5cGUgYXMgbmV2ZXIsIG51bGxUeXBlIGFzIG51bGwsIG51bGxhYmxlVHlwZSBhcyBudWxsYWJsZSwgbnVtYmVyVHlwZSBhcyBudW1iZXIsIG9iamVjdFR5cGUgYXMgb2JqZWN0LCBvYm9vbGVhbiwgb251bWJlciwgb3B0aW9uYWxUeXBlIGFzIG9wdGlvbmFsLCBvc3RyaW5nLCBwaXBlbGluZVR5cGUgYXMgcGlwZWxpbmUsIHByZXByb2Nlc3NUeXBlIGFzIHByZXByb2Nlc3MsIHByb21pc2VUeXBlIGFzIHByb21pc2UsIHJlY29yZFR5cGUgYXMgcmVjb3JkLCBzZXRUeXBlIGFzIHNldCwgc3RyaWN0T2JqZWN0VHlwZSBhcyBzdHJpY3RPYmplY3QsIHN0cmluZ1R5cGUgYXMgc3RyaW5nLCBzeW1ib2xUeXBlIGFzIHN5bWJvbCwgZWZmZWN0c1R5cGUgYXMgdHJhbnNmb3JtZXIsIHR1cGxlVHlwZSBhcyB0dXBsZSwgdW5kZWZpbmVkVHlwZSBhcyB1bmRlZmluZWQsIHVuaW9uVHlwZSBhcyB1bmlvbiwgdW5rbm93blR5cGUgYXMgdW5rbm93biwgdm9pZFR5cGUgYXMgdm9pZCwgfTtcbmV4cG9ydCBjb25zdCBORVZFUiA9IElOVkFMSUQ7XG4iLCAiLyohXG4gKiBDb3B5cmlnaHQgKGMpIFNxdWlycmVsIENoYXQgZXQgYWwuLCBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICogU1BEWC1MaWNlbnNlLUlkZW50aWZpZXI6IEJTRC0zLUNsYXVzZVxuICpcbiAqIFJlZGlzdHJpYnV0aW9uIGFuZCB1c2UgaW4gc291cmNlIGFuZCBiaW5hcnkgZm9ybXMsIHdpdGggb3Igd2l0aG91dFxuICogbW9kaWZpY2F0aW9uLCBhcmUgcGVybWl0dGVkIHByb3ZpZGVkIHRoYXQgdGhlIGZvbGxvd2luZyBjb25kaXRpb25zIGFyZSBtZXQ6XG4gKlxuICogMS4gUmVkaXN0cmlidXRpb25zIG9mIHNvdXJjZSBjb2RlIG11c3QgcmV0YWluIHRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlLCB0aGlzXG4gKiAgICBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmcgZGlzY2xhaW1lci5cbiAqIDIuIFJlZGlzdHJpYnV0aW9ucyBpbiBiaW5hcnkgZm9ybSBtdXN0IHJlcHJvZHVjZSB0aGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSxcbiAqICAgIHRoaXMgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nIGRpc2NsYWltZXIgaW4gdGhlXG4gKiAgICBkb2N1bWVudGF0aW9uIGFuZC9vciBvdGhlciBtYXRlcmlhbHMgcHJvdmlkZWQgd2l0aCB0aGUgZGlzdHJpYnV0aW9uLlxuICogMy4gTmVpdGhlciB0aGUgbmFtZSBvZiB0aGUgY29weXJpZ2h0IGhvbGRlciBub3IgdGhlIG5hbWVzIG9mIGl0cyBjb250cmlidXRvcnNcbiAqICAgIG1heSBiZSB1c2VkIHRvIGVuZG9yc2Ugb3IgcHJvbW90ZSBwcm9kdWN0cyBkZXJpdmVkIGZyb20gdGhpcyBzb2Z0d2FyZSB3aXRob3V0XG4gKiAgICBzcGVjaWZpYyBwcmlvciB3cml0dGVuIHBlcm1pc3Npb24uXG4gKlxuICogVEhJUyBTT0ZUV0FSRSBJUyBQUk9WSURFRCBCWSBUSEUgQ09QWVJJR0hUIEhPTERFUlMgQU5EIENPTlRSSUJVVE9SUyBcIkFTIElTXCIgQU5EXG4gKiBBTlkgRVhQUkVTUyBPUiBJTVBMSUVEIFdBUlJBTlRJRVMsIElOQ0xVRElORywgQlVUIE5PVCBMSU1JVEVEIFRPLCBUSEUgSU1QTElFRFxuICogV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFkgQU5EIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFSRVxuICogRElTQ0xBSU1FRC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFIENPUFlSSUdIVCBIT0xERVIgT1IgQ09OVFJJQlVUT1JTIEJFIExJQUJMRVxuICogRk9SIEFOWSBESVJFQ1QsIElORElSRUNULCBJTkNJREVOVEFMLCBTUEVDSUFMLCBFWEVNUExBUlksIE9SIENPTlNFUVVFTlRJQUxcbiAqIERBTUFHRVMgKElOQ0xVRElORywgQlVUIE5PVCBMSU1JVEVEIFRPLCBQUk9DVVJFTUVOVCBPRiBTVUJTVElUVVRFIEdPT0RTIE9SXG4gKiBTRVJWSUNFUzsgTE9TUyBPRiBVU0UsIERBVEEsIE9SIFBST0ZJVFM7IE9SIEJVU0lORVNTIElOVEVSUlVQVElPTikgSE9XRVZFUlxuICogQ0FVU0VEIEFORCBPTiBBTlkgVEhFT1JZIE9GIExJQUJJTElUWSwgV0hFVEhFUiBJTiBDT05UUkFDVCwgU1RSSUNUIExJQUJJTElUWSxcbiAqIE9SIFRPUlQgKElOQ0xVRElORyBORUdMSUdFTkNFIE9SIE9USEVSV0lTRSkgQVJJU0lORyBJTiBBTlkgV0FZIE9VVCBPRiBUSEUgVVNFXG4gKiBPRiBUSElTIFNPRlRXQVJFLCBFVkVOIElGIEFEVklTRUQgT0YgVEhFIFBPU1NJQklMSVRZIE9GIFNVQ0ggREFNQUdFLlxuICovXG5mdW5jdGlvbiBnZXRMaW5lQ29sRnJvbVB0cihzdHJpbmcsIHB0cikge1xuICAgIGxldCBsaW5lcyA9IHN0cmluZy5zbGljZSgwLCBwdHIpLnNwbGl0KC9cXHJcXG58XFxufFxcci9nKTtcbiAgICByZXR1cm4gW2xpbmVzLmxlbmd0aCwgbGluZXMucG9wKCkubGVuZ3RoICsgMV07XG59XG5mdW5jdGlvbiBtYWtlQ29kZUJsb2NrKHN0cmluZywgbGluZSwgY29sdW1uKSB7XG4gICAgbGV0IGxpbmVzID0gc3RyaW5nLnNwbGl0KC9cXHJcXG58XFxufFxcci9nKTtcbiAgICBsZXQgY29kZWJsb2NrID0gJyc7XG4gICAgbGV0IG51bWJlckxlbiA9IChNYXRoLmxvZzEwKGxpbmUgKyAxKSB8IDApICsgMTtcbiAgICBmb3IgKGxldCBpID0gbGluZSAtIDE7IGkgPD0gbGluZSArIDE7IGkrKykge1xuICAgICAgICBsZXQgbCA9IGxpbmVzW2kgLSAxXTtcbiAgICAgICAgaWYgKCFsKVxuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIGNvZGVibG9jayArPSBpLnRvU3RyaW5nKCkucGFkRW5kKG51bWJlckxlbiwgJyAnKTtcbiAgICAgICAgY29kZWJsb2NrICs9ICc6ICAnO1xuICAgICAgICBjb2RlYmxvY2sgKz0gbDtcbiAgICAgICAgY29kZWJsb2NrICs9ICdcXG4nO1xuICAgICAgICBpZiAoaSA9PT0gbGluZSkge1xuICAgICAgICAgICAgY29kZWJsb2NrICs9ICcgJy5yZXBlYXQobnVtYmVyTGVuICsgY29sdW1uICsgMik7XG4gICAgICAgICAgICBjb2RlYmxvY2sgKz0gJ15cXG4nO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjb2RlYmxvY2s7XG59XG5leHBvcnQgY2xhc3MgVG9tbEVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICAgIGxpbmU7XG4gICAgY29sdW1uO1xuICAgIGNvZGVibG9jaztcbiAgICBjb25zdHJ1Y3RvcihtZXNzYWdlLCBvcHRpb25zKSB7XG4gICAgICAgIGNvbnN0IFtsaW5lLCBjb2x1bW5dID0gZ2V0TGluZUNvbEZyb21QdHIob3B0aW9ucy50b21sLCBvcHRpb25zLnB0cik7XG4gICAgICAgIGNvbnN0IGNvZGVibG9jayA9IG1ha2VDb2RlQmxvY2sob3B0aW9ucy50b21sLCBsaW5lLCBjb2x1bW4pO1xuICAgICAgICBzdXBlcihgSW52YWxpZCBUT01MIGRvY3VtZW50OiAke21lc3NhZ2V9XFxuXFxuJHtjb2RlYmxvY2t9YCwgb3B0aW9ucyk7XG4gICAgICAgIHRoaXMubGluZSA9IGxpbmU7XG4gICAgICAgIHRoaXMuY29sdW1uID0gY29sdW1uO1xuICAgICAgICB0aGlzLmNvZGVibG9jayA9IGNvZGVibG9jaztcbiAgICB9XG59XG4iLCAiLyohXG4gKiBDb3B5cmlnaHQgKGMpIFNxdWlycmVsIENoYXQgZXQgYWwuLCBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICogU1BEWC1MaWNlbnNlLUlkZW50aWZpZXI6IEJTRC0zLUNsYXVzZVxuICpcbiAqIFJlZGlzdHJpYnV0aW9uIGFuZCB1c2UgaW4gc291cmNlIGFuZCBiaW5hcnkgZm9ybXMsIHdpdGggb3Igd2l0aG91dFxuICogbW9kaWZpY2F0aW9uLCBhcmUgcGVybWl0dGVkIHByb3ZpZGVkIHRoYXQgdGhlIGZvbGxvd2luZyBjb25kaXRpb25zIGFyZSBtZXQ6XG4gKlxuICogMS4gUmVkaXN0cmlidXRpb25zIG9mIHNvdXJjZSBjb2RlIG11c3QgcmV0YWluIHRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlLCB0aGlzXG4gKiAgICBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmcgZGlzY2xhaW1lci5cbiAqIDIuIFJlZGlzdHJpYnV0aW9ucyBpbiBiaW5hcnkgZm9ybSBtdXN0IHJlcHJvZHVjZSB0aGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSxcbiAqICAgIHRoaXMgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nIGRpc2NsYWltZXIgaW4gdGhlXG4gKiAgICBkb2N1bWVudGF0aW9uIGFuZC9vciBvdGhlciBtYXRlcmlhbHMgcHJvdmlkZWQgd2l0aCB0aGUgZGlzdHJpYnV0aW9uLlxuICogMy4gTmVpdGhlciB0aGUgbmFtZSBvZiB0aGUgY29weXJpZ2h0IGhvbGRlciBub3IgdGhlIG5hbWVzIG9mIGl0cyBjb250cmlidXRvcnNcbiAqICAgIG1heSBiZSB1c2VkIHRvIGVuZG9yc2Ugb3IgcHJvbW90ZSBwcm9kdWN0cyBkZXJpdmVkIGZyb20gdGhpcyBzb2Z0d2FyZSB3aXRob3V0XG4gKiAgICBzcGVjaWZpYyBwcmlvciB3cml0dGVuIHBlcm1pc3Npb24uXG4gKlxuICogVEhJUyBTT0ZUV0FSRSBJUyBQUk9WSURFRCBCWSBUSEUgQ09QWVJJR0hUIEhPTERFUlMgQU5EIENPTlRSSUJVVE9SUyBcIkFTIElTXCIgQU5EXG4gKiBBTlkgRVhQUkVTUyBPUiBJTVBMSUVEIFdBUlJBTlRJRVMsIElOQ0xVRElORywgQlVUIE5PVCBMSU1JVEVEIFRPLCBUSEUgSU1QTElFRFxuICogV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFkgQU5EIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFSRVxuICogRElTQ0xBSU1FRC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFIENPUFlSSUdIVCBIT0xERVIgT1IgQ09OVFJJQlVUT1JTIEJFIExJQUJMRVxuICogRk9SIEFOWSBESVJFQ1QsIElORElSRUNULCBJTkNJREVOVEFMLCBTUEVDSUFMLCBFWEVNUExBUlksIE9SIENPTlNFUVVFTlRJQUxcbiAqIERBTUFHRVMgKElOQ0xVRElORywgQlVUIE5PVCBMSU1JVEVEIFRPLCBQUk9DVVJFTUVOVCBPRiBTVUJTVElUVVRFIEdPT0RTIE9SXG4gKiBTRVJWSUNFUzsgTE9TUyBPRiBVU0UsIERBVEEsIE9SIFBST0ZJVFM7IE9SIEJVU0lORVNTIElOVEVSUlVQVElPTikgSE9XRVZFUlxuICogQ0FVU0VEIEFORCBPTiBBTlkgVEhFT1JZIE9GIExJQUJJTElUWSwgV0hFVEhFUiBJTiBDT05UUkFDVCwgU1RSSUNUIExJQUJJTElUWSxcbiAqIE9SIFRPUlQgKElOQ0xVRElORyBORUdMSUdFTkNFIE9SIE9USEVSV0lTRSkgQVJJU0lORyBJTiBBTlkgV0FZIE9VVCBPRiBUSEUgVVNFXG4gKiBPRiBUSElTIFNPRlRXQVJFLCBFVkVOIElGIEFEVklTRUQgT0YgVEhFIFBPU1NJQklMSVRZIE9GIFNVQ0ggREFNQUdFLlxuICovXG5pbXBvcnQgeyBUb21sRXJyb3IgfSBmcm9tICcuL2Vycm9yLmpzJztcbmZ1bmN0aW9uIGlzRXNjYXBlZChzdHIsIHB0cikge1xuICAgIGxldCBpID0gMDtcbiAgICB3aGlsZSAoc3RyW3B0ciAtICsraV0gPT09ICdcXFxcJylcbiAgICAgICAgO1xuICAgIHJldHVybiAtLWkgJiYgKGkgJSAyKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBpbmRleE9mTmV3bGluZShzdHIsIHN0YXJ0ID0gMCwgZW5kID0gc3RyLmxlbmd0aCkge1xuICAgIGxldCBpZHggPSBzdHIuaW5kZXhPZignXFxuJywgc3RhcnQpO1xuICAgIGlmIChzdHJbaWR4IC0gMV0gPT09ICdcXHInKVxuICAgICAgICBpZHgtLTtcbiAgICByZXR1cm4gaWR4IDw9IGVuZCA/IGlkeCA6IC0xO1xufVxuZXhwb3J0IGZ1bmN0aW9uIHNraXBDb21tZW50KHN0ciwgcHRyKSB7XG4gICAgZm9yIChsZXQgaSA9IHB0cjsgaSA8IHN0ci5sZW5ndGg7IGkrKykge1xuICAgICAgICBsZXQgYyA9IHN0cltpXTtcbiAgICAgICAgaWYgKGMgPT09ICdcXG4nKVxuICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgIGlmIChjID09PSAnXFxyJyAmJiBzdHJbaSArIDFdID09PSAnXFxuJylcbiAgICAgICAgICAgIHJldHVybiBpICsgMTtcbiAgICAgICAgaWYgKChjIDwgJ1xceDIwJyAmJiBjICE9PSAnXFx0JykgfHwgYyA9PT0gJ1xceDdmJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFRvbWxFcnJvcignY29udHJvbCBjaGFyYWN0ZXJzIGFyZSBub3QgYWxsb3dlZCBpbiBjb21tZW50cycsIHtcbiAgICAgICAgICAgICAgICB0b21sOiBzdHIsXG4gICAgICAgICAgICAgICAgcHRyOiBwdHIsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc3RyLmxlbmd0aDtcbn1cbmV4cG9ydCBmdW5jdGlvbiBza2lwVm9pZChzdHIsIHB0ciwgYmFuTmV3TGluZXMsIGJhbkNvbW1lbnRzKSB7XG4gICAgbGV0IGM7XG4gICAgd2hpbGUgKChjID0gc3RyW3B0cl0pID09PSAnICcgfHwgYyA9PT0gJ1xcdCcgfHwgKCFiYW5OZXdMaW5lcyAmJiAoYyA9PT0gJ1xcbicgfHwgYyA9PT0gJ1xccicgJiYgc3RyW3B0ciArIDFdID09PSAnXFxuJykpKVxuICAgICAgICBwdHIrKztcbiAgICByZXR1cm4gYmFuQ29tbWVudHMgfHwgYyAhPT0gJyMnXG4gICAgICAgID8gcHRyXG4gICAgICAgIDogc2tpcFZvaWQoc3RyLCBza2lwQ29tbWVudChzdHIsIHB0ciksIGJhbk5ld0xpbmVzKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBza2lwVW50aWwoc3RyLCBwdHIsIHNlcCwgZW5kLCBiYW5OZXdMaW5lcyA9IGZhbHNlKSB7XG4gICAgaWYgKCFlbmQpIHtcbiAgICAgICAgcHRyID0gaW5kZXhPZk5ld2xpbmUoc3RyLCBwdHIpO1xuICAgICAgICByZXR1cm4gcHRyIDwgMCA/IHN0ci5sZW5ndGggOiBwdHI7XG4gICAgfVxuICAgIGZvciAobGV0IGkgPSBwdHI7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbGV0IGMgPSBzdHJbaV07XG4gICAgICAgIGlmIChjID09PSAnIycpIHtcbiAgICAgICAgICAgIGkgPSBpbmRleE9mTmV3bGluZShzdHIsIGkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGMgPT09IHNlcCkge1xuICAgICAgICAgICAgcmV0dXJuIGkgKyAxO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGMgPT09IGVuZCB8fCAoYmFuTmV3TGluZXMgJiYgKGMgPT09ICdcXG4nIHx8IChjID09PSAnXFxyJyAmJiBzdHJbaSArIDFdID09PSAnXFxuJykpKSkge1xuICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdGhyb3cgbmV3IFRvbWxFcnJvcignY2Fubm90IGZpbmQgZW5kIG9mIHN0cnVjdHVyZScsIHtcbiAgICAgICAgdG9tbDogc3RyLFxuICAgICAgICBwdHI6IHB0clxuICAgIH0pO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGdldFN0cmluZ0VuZChzdHIsIHNlZWspIHtcbiAgICBsZXQgZmlyc3QgPSBzdHJbc2Vla107XG4gICAgbGV0IHRhcmdldCA9IGZpcnN0ID09PSBzdHJbc2VlayArIDFdICYmIHN0cltzZWVrICsgMV0gPT09IHN0cltzZWVrICsgMl1cbiAgICAgICAgPyBzdHIuc2xpY2Uoc2Vlaywgc2VlayArIDMpXG4gICAgICAgIDogZmlyc3Q7XG4gICAgc2VlayArPSB0YXJnZXQubGVuZ3RoIC0gMTtcbiAgICBkb1xuICAgICAgICBzZWVrID0gc3RyLmluZGV4T2YodGFyZ2V0LCArK3NlZWspO1xuICAgIHdoaWxlIChzZWVrID4gLTEgJiYgZmlyc3QgIT09IFwiJ1wiICYmIGlzRXNjYXBlZChzdHIsIHNlZWspKTtcbiAgICBpZiAoc2VlayA+IC0xKSB7XG4gICAgICAgIHNlZWsgKz0gdGFyZ2V0Lmxlbmd0aDtcbiAgICAgICAgaWYgKHRhcmdldC5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICBpZiAoc3RyW3NlZWtdID09PSBmaXJzdClcbiAgICAgICAgICAgICAgICBzZWVrKys7XG4gICAgICAgICAgICBpZiAoc3RyW3NlZWtdID09PSBmaXJzdClcbiAgICAgICAgICAgICAgICBzZWVrKys7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHNlZWs7XG59XG4iLCAiLyohXG4gKiBDb3B5cmlnaHQgKGMpIFNxdWlycmVsIENoYXQgZXQgYWwuLCBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICogU1BEWC1MaWNlbnNlLUlkZW50aWZpZXI6IEJTRC0zLUNsYXVzZVxuICpcbiAqIFJlZGlzdHJpYnV0aW9uIGFuZCB1c2UgaW4gc291cmNlIGFuZCBiaW5hcnkgZm9ybXMsIHdpdGggb3Igd2l0aG91dFxuICogbW9kaWZpY2F0aW9uLCBhcmUgcGVybWl0dGVkIHByb3ZpZGVkIHRoYXQgdGhlIGZvbGxvd2luZyBjb25kaXRpb25zIGFyZSBtZXQ6XG4gKlxuICogMS4gUmVkaXN0cmlidXRpb25zIG9mIHNvdXJjZSBjb2RlIG11c3QgcmV0YWluIHRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlLCB0aGlzXG4gKiAgICBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmcgZGlzY2xhaW1lci5cbiAqIDIuIFJlZGlzdHJpYnV0aW9ucyBpbiBiaW5hcnkgZm9ybSBtdXN0IHJlcHJvZHVjZSB0aGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSxcbiAqICAgIHRoaXMgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nIGRpc2NsYWltZXIgaW4gdGhlXG4gKiAgICBkb2N1bWVudGF0aW9uIGFuZC9vciBvdGhlciBtYXRlcmlhbHMgcHJvdmlkZWQgd2l0aCB0aGUgZGlzdHJpYnV0aW9uLlxuICogMy4gTmVpdGhlciB0aGUgbmFtZSBvZiB0aGUgY29weXJpZ2h0IGhvbGRlciBub3IgdGhlIG5hbWVzIG9mIGl0cyBjb250cmlidXRvcnNcbiAqICAgIG1heSBiZSB1c2VkIHRvIGVuZG9yc2Ugb3IgcHJvbW90ZSBwcm9kdWN0cyBkZXJpdmVkIGZyb20gdGhpcyBzb2Z0d2FyZSB3aXRob3V0XG4gKiAgICBzcGVjaWZpYyBwcmlvciB3cml0dGVuIHBlcm1pc3Npb24uXG4gKlxuICogVEhJUyBTT0ZUV0FSRSBJUyBQUk9WSURFRCBCWSBUSEUgQ09QWVJJR0hUIEhPTERFUlMgQU5EIENPTlRSSUJVVE9SUyBcIkFTIElTXCIgQU5EXG4gKiBBTlkgRVhQUkVTUyBPUiBJTVBMSUVEIFdBUlJBTlRJRVMsIElOQ0xVRElORywgQlVUIE5PVCBMSU1JVEVEIFRPLCBUSEUgSU1QTElFRFxuICogV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFkgQU5EIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFSRVxuICogRElTQ0xBSU1FRC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFIENPUFlSSUdIVCBIT0xERVIgT1IgQ09OVFJJQlVUT1JTIEJFIExJQUJMRVxuICogRk9SIEFOWSBESVJFQ1QsIElORElSRUNULCBJTkNJREVOVEFMLCBTUEVDSUFMLCBFWEVNUExBUlksIE9SIENPTlNFUVVFTlRJQUxcbiAqIERBTUFHRVMgKElOQ0xVRElORywgQlVUIE5PVCBMSU1JVEVEIFRPLCBQUk9DVVJFTUVOVCBPRiBTVUJTVElUVVRFIEdPT0RTIE9SXG4gKiBTRVJWSUNFUzsgTE9TUyBPRiBVU0UsIERBVEEsIE9SIFBST0ZJVFM7IE9SIEJVU0lORVNTIElOVEVSUlVQVElPTikgSE9XRVZFUlxuICogQ0FVU0VEIEFORCBPTiBBTlkgVEhFT1JZIE9GIExJQUJJTElUWSwgV0hFVEhFUiBJTiBDT05UUkFDVCwgU1RSSUNUIExJQUJJTElUWSxcbiAqIE9SIFRPUlQgKElOQ0xVRElORyBORUdMSUdFTkNFIE9SIE9USEVSV0lTRSkgQVJJU0lORyBJTiBBTlkgV0FZIE9VVCBPRiBUSEUgVVNFXG4gKiBPRiBUSElTIFNPRlRXQVJFLCBFVkVOIElGIEFEVklTRUQgT0YgVEhFIFBPU1NJQklMSVRZIE9GIFNVQ0ggREFNQUdFLlxuICovXG5sZXQgREFURV9USU1FX1JFID0gL14oXFxkezR9LVxcZHsyfS1cXGR7Mn0pP1tUIF0/KD86KFxcZHsyfSk6XFxkezJ9OlxcZHsyfSg/OlxcLlxcZCspPyk/KFp8Wy0rXVxcZHsyfTpcXGR7Mn0pPyQvaTtcbmV4cG9ydCBjbGFzcyBUb21sRGF0ZSBleHRlbmRzIERhdGUge1xuICAgICNoYXNEYXRlID0gZmFsc2U7XG4gICAgI2hhc1RpbWUgPSBmYWxzZTtcbiAgICAjb2Zmc2V0ID0gbnVsbDtcbiAgICBjb25zdHJ1Y3RvcihkYXRlKSB7XG4gICAgICAgIGxldCBoYXNEYXRlID0gdHJ1ZTtcbiAgICAgICAgbGV0IGhhc1RpbWUgPSB0cnVlO1xuICAgICAgICBsZXQgb2Zmc2V0ID0gJ1onO1xuICAgICAgICBpZiAodHlwZW9mIGRhdGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBsZXQgbWF0Y2ggPSBkYXRlLm1hdGNoKERBVEVfVElNRV9SRSk7XG4gICAgICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICAgICAgICBpZiAoIW1hdGNoWzFdKSB7XG4gICAgICAgICAgICAgICAgICAgIGhhc0RhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgZGF0ZSA9IGAwMDAwLTAxLTAxVCR7ZGF0ZX1gO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBoYXNUaW1lID0gISFtYXRjaFsyXTtcbiAgICAgICAgICAgICAgICAvLyBNYWtlIHN1cmUgdG8gdXNlIFQgaW5zdGVhZCBvZiBhIHNwYWNlLiBCcmVha3MgaW4gY2FzZSBvZiBleHRyZW1lIHZhbHVlcyBvdGhlcndpc2UuXG4gICAgICAgICAgICAgICAgaGFzVGltZSAmJiBkYXRlWzEwXSA9PT0gJyAnICYmIChkYXRlID0gZGF0ZS5yZXBsYWNlKCcgJywgJ1QnKSk7XG4gICAgICAgICAgICAgICAgLy8gRG8gbm90IGFsbG93IHJvbGxvdmVyIGhvdXJzLlxuICAgICAgICAgICAgICAgIGlmIChtYXRjaFsyXSAmJiArbWF0Y2hbMl0gPiAyMykge1xuICAgICAgICAgICAgICAgICAgICBkYXRlID0gJyc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBvZmZzZXQgPSBtYXRjaFszXSB8fCBudWxsO1xuICAgICAgICAgICAgICAgICAgICBkYXRlID0gZGF0ZS50b1VwcGVyQ2FzZSgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIW9mZnNldCAmJiBoYXNUaW1lKVxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZSArPSAnWic7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZGF0ZSA9ICcnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHN1cGVyKGRhdGUpO1xuICAgICAgICBpZiAoIWlzTmFOKHRoaXMuZ2V0VGltZSgpKSkge1xuICAgICAgICAgICAgdGhpcy4jaGFzRGF0ZSA9IGhhc0RhdGU7XG4gICAgICAgICAgICB0aGlzLiNoYXNUaW1lID0gaGFzVGltZTtcbiAgICAgICAgICAgIHRoaXMuI29mZnNldCA9IG9mZnNldDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpc0RhdGVUaW1lKCkge1xuICAgICAgICByZXR1cm4gdGhpcy4jaGFzRGF0ZSAmJiB0aGlzLiNoYXNUaW1lO1xuICAgIH1cbiAgICBpc0xvY2FsKCkge1xuICAgICAgICByZXR1cm4gIXRoaXMuI2hhc0RhdGUgfHwgIXRoaXMuI2hhc1RpbWUgfHwgIXRoaXMuI29mZnNldDtcbiAgICB9XG4gICAgaXNEYXRlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy4jaGFzRGF0ZSAmJiAhdGhpcy4jaGFzVGltZTtcbiAgICB9XG4gICAgaXNUaW1lKCkge1xuICAgICAgICByZXR1cm4gdGhpcy4jaGFzVGltZSAmJiAhdGhpcy4jaGFzRGF0ZTtcbiAgICB9XG4gICAgaXNWYWxpZCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuI2hhc0RhdGUgfHwgdGhpcy4jaGFzVGltZTtcbiAgICB9XG4gICAgdG9JU09TdHJpbmcoKSB7XG4gICAgICAgIGxldCBpc28gPSBzdXBlci50b0lTT1N0cmluZygpO1xuICAgICAgICAvLyBMb2NhbCBEYXRlXG4gICAgICAgIGlmICh0aGlzLmlzRGF0ZSgpKVxuICAgICAgICAgICAgcmV0dXJuIGlzby5zbGljZSgwLCAxMCk7XG4gICAgICAgIC8vIExvY2FsIFRpbWVcbiAgICAgICAgaWYgKHRoaXMuaXNUaW1lKCkpXG4gICAgICAgICAgICByZXR1cm4gaXNvLnNsaWNlKDExLCAyMyk7XG4gICAgICAgIC8vIExvY2FsIERhdGVUaW1lXG4gICAgICAgIGlmICh0aGlzLiNvZmZzZXQgPT09IG51bGwpXG4gICAgICAgICAgICByZXR1cm4gaXNvLnNsaWNlKDAsIC0xKTtcbiAgICAgICAgLy8gT2Zmc2V0IERhdGVUaW1lXG4gICAgICAgIGlmICh0aGlzLiNvZmZzZXQgPT09ICdaJylcbiAgICAgICAgICAgIHJldHVybiBpc287XG4gICAgICAgIC8vIFRoaXMgcGFydCBpcyBxdWl0ZSBhbm5veWluZzogSlMgc3RyaXBzIHRoZSBvcmlnaW5hbCB0aW1lem9uZSBmcm9tIHRoZSBJU08gc3RyaW5nIHJlcHJlc2VudGF0aW9uXG4gICAgICAgIC8vIEluc3RlYWQgb2YgdXNpbmcgYSBcIm1vZGlmaWVkXCIgZGF0ZSBhbmQgXCJaXCIsIHdlIHJlc3RvcmUgdGhlIHJlcHJlc2VudGF0aW9uIFwiYXMgYXV0aG9yZWRcIlxuICAgICAgICBsZXQgb2Zmc2V0ID0gKCsodGhpcy4jb2Zmc2V0LnNsaWNlKDEsIDMpKSAqIDYwKSArICsodGhpcy4jb2Zmc2V0LnNsaWNlKDQsIDYpKTtcbiAgICAgICAgb2Zmc2V0ID0gdGhpcy4jb2Zmc2V0WzBdID09PSAnLScgPyBvZmZzZXQgOiAtb2Zmc2V0O1xuICAgICAgICBsZXQgb2Zmc2V0RGF0ZSA9IG5ldyBEYXRlKHRoaXMuZ2V0VGltZSgpIC0gKG9mZnNldCAqIDYwZTMpKTtcbiAgICAgICAgcmV0dXJuIG9mZnNldERhdGUudG9JU09TdHJpbmcoKS5zbGljZSgwLCAtMSkgKyB0aGlzLiNvZmZzZXQ7XG4gICAgfVxuICAgIHN0YXRpYyB3cmFwQXNPZmZzZXREYXRlVGltZShqc0RhdGUsIG9mZnNldCA9ICdaJykge1xuICAgICAgICBsZXQgZGF0ZSA9IG5ldyBUb21sRGF0ZShqc0RhdGUpO1xuICAgICAgICBkYXRlLiNvZmZzZXQgPSBvZmZzZXQ7XG4gICAgICAgIHJldHVybiBkYXRlO1xuICAgIH1cbiAgICBzdGF0aWMgd3JhcEFzTG9jYWxEYXRlVGltZShqc0RhdGUpIHtcbiAgICAgICAgbGV0IGRhdGUgPSBuZXcgVG9tbERhdGUoanNEYXRlKTtcbiAgICAgICAgZGF0ZS4jb2Zmc2V0ID0gbnVsbDtcbiAgICAgICAgcmV0dXJuIGRhdGU7XG4gICAgfVxuICAgIHN0YXRpYyB3cmFwQXNMb2NhbERhdGUoanNEYXRlKSB7XG4gICAgICAgIGxldCBkYXRlID0gbmV3IFRvbWxEYXRlKGpzRGF0ZSk7XG4gICAgICAgIGRhdGUuI2hhc1RpbWUgPSBmYWxzZTtcbiAgICAgICAgZGF0ZS4jb2Zmc2V0ID0gbnVsbDtcbiAgICAgICAgcmV0dXJuIGRhdGU7XG4gICAgfVxuICAgIHN0YXRpYyB3cmFwQXNMb2NhbFRpbWUoanNEYXRlKSB7XG4gICAgICAgIGxldCBkYXRlID0gbmV3IFRvbWxEYXRlKGpzRGF0ZSk7XG4gICAgICAgIGRhdGUuI2hhc0RhdGUgPSBmYWxzZTtcbiAgICAgICAgZGF0ZS4jb2Zmc2V0ID0gbnVsbDtcbiAgICAgICAgcmV0dXJuIGRhdGU7XG4gICAgfVxufVxuIiwgIi8qIVxuICogQ29weXJpZ2h0IChjKSBTcXVpcnJlbCBDaGF0IGV0IGFsLiwgQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqIFNQRFgtTGljZW5zZS1JZGVudGlmaWVyOiBCU0QtMy1DbGF1c2VcbiAqXG4gKiBSZWRpc3RyaWJ1dGlvbiBhbmQgdXNlIGluIHNvdXJjZSBhbmQgYmluYXJ5IGZvcm1zLCB3aXRoIG9yIHdpdGhvdXRcbiAqIG1vZGlmaWNhdGlvbiwgYXJlIHBlcm1pdHRlZCBwcm92aWRlZCB0aGF0IHRoZSBmb2xsb3dpbmcgY29uZGl0aW9ucyBhcmUgbWV0OlxuICpcbiAqIDEuIFJlZGlzdHJpYnV0aW9ucyBvZiBzb3VyY2UgY29kZSBtdXN0IHJldGFpbiB0aGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSwgdGhpc1xuICogICAgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nIGRpc2NsYWltZXIuXG4gKiAyLiBSZWRpc3RyaWJ1dGlvbnMgaW4gYmluYXJ5IGZvcm0gbXVzdCByZXByb2R1Y2UgdGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UsXG4gKiAgICB0aGlzIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZyBkaXNjbGFpbWVyIGluIHRoZVxuICogICAgZG9jdW1lbnRhdGlvbiBhbmQvb3Igb3RoZXIgbWF0ZXJpYWxzIHByb3ZpZGVkIHdpdGggdGhlIGRpc3RyaWJ1dGlvbi5cbiAqIDMuIE5laXRoZXIgdGhlIG5hbWUgb2YgdGhlIGNvcHlyaWdodCBob2xkZXIgbm9yIHRoZSBuYW1lcyBvZiBpdHMgY29udHJpYnV0b3JzXG4gKiAgICBtYXkgYmUgdXNlZCB0byBlbmRvcnNlIG9yIHByb21vdGUgcHJvZHVjdHMgZGVyaXZlZCBmcm9tIHRoaXMgc29mdHdhcmUgd2l0aG91dFxuICogICAgc3BlY2lmaWMgcHJpb3Igd3JpdHRlbiBwZXJtaXNzaW9uLlxuICpcbiAqIFRISVMgU09GVFdBUkUgSVMgUFJPVklERUQgQlkgVEhFIENPUFlSSUdIVCBIT0xERVJTIEFORCBDT05UUklCVVRPUlMgXCJBUyBJU1wiIEFORFxuICogQU5ZIEVYUFJFU1MgT1IgSU1QTElFRCBXQVJSQU5USUVTLCBJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTywgVEhFIElNUExJRURcbiAqIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZIEFORCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBUkVcbiAqIERJU0NMQUlNRUQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBDT1BZUklHSFQgSE9MREVSIE9SIENPTlRSSUJVVE9SUyBCRSBMSUFCTEVcbiAqIEZPUiBBTlkgRElSRUNULCBJTkRJUkVDVCwgSU5DSURFTlRBTCwgU1BFQ0lBTCwgRVhFTVBMQVJZLCBPUiBDT05TRVFVRU5USUFMXG4gKiBEQU1BR0VTIChJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTywgUFJPQ1VSRU1FTlQgT0YgU1VCU1RJVFVURSBHT09EUyBPUlxuICogU0VSVklDRVM7IExPU1MgT0YgVVNFLCBEQVRBLCBPUiBQUk9GSVRTOyBPUiBCVVNJTkVTUyBJTlRFUlJVUFRJT04pIEhPV0VWRVJcbiAqIENBVVNFRCBBTkQgT04gQU5ZIFRIRU9SWSBPRiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQ09OVFJBQ1QsIFNUUklDVCBMSUFCSUxJVFksXG4gKiBPUiBUT1JUIChJTkNMVURJTkcgTkVHTElHRU5DRSBPUiBPVEhFUldJU0UpIEFSSVNJTkcgSU4gQU5ZIFdBWSBPVVQgT0YgVEhFIFVTRVxuICogT0YgVEhJUyBTT0ZUV0FSRSwgRVZFTiBJRiBBRFZJU0VEIE9GIFRIRSBQT1NTSUJJTElUWSBPRiBTVUNIIERBTUFHRS5cbiAqL1xuaW1wb3J0IHsgc2tpcFZvaWQgfSBmcm9tICcuL3V0aWwuanMnO1xuaW1wb3J0IHsgVG9tbERhdGUgfSBmcm9tICcuL2RhdGUuanMnO1xuaW1wb3J0IHsgVG9tbEVycm9yIH0gZnJvbSAnLi9lcnJvci5qcyc7XG5sZXQgSU5UX1JFR0VYID0gL14oKDB4WzAtOWEtZkEtRl0oXz9bMC05YS1mQS1GXSkqKXwoKFsrLV18MFtvYl0pP1xcZChfP1xcZCkqKSkkLztcbmxldCBGTE9BVF9SRUdFWCA9IC9eWystXT9cXGQoXz9cXGQpKihcXC5cXGQoXz9cXGQpKik/KFtlRV1bKy1dP1xcZChfP1xcZCkqKT8kLztcbmxldCBMRUFESU5HX1pFUk8gPSAvXlsrLV0/MFswLTlfXS87XG5sZXQgRVNDQVBFX1JFR0VYID0gL15bMC05YS1mXXs0LDh9JC9pO1xubGV0IEVTQ19NQVAgPSB7XG4gICAgYjogJ1xcYicsXG4gICAgdDogJ1xcdCcsXG4gICAgbjogJ1xcbicsXG4gICAgZjogJ1xcZicsXG4gICAgcjogJ1xccicsXG4gICAgJ1wiJzogJ1wiJyxcbiAgICAnXFxcXCc6ICdcXFxcJyxcbn07XG5leHBvcnQgZnVuY3Rpb24gcGFyc2VTdHJpbmcoc3RyLCBwdHIgPSAwLCBlbmRQdHIgPSBzdHIubGVuZ3RoKSB7XG4gICAgbGV0IGlzTGl0ZXJhbCA9IHN0cltwdHJdID09PSAnXFwnJztcbiAgICBsZXQgaXNNdWx0aWxpbmUgPSBzdHJbcHRyKytdID09PSBzdHJbcHRyXSAmJiBzdHJbcHRyXSA9PT0gc3RyW3B0ciArIDFdO1xuICAgIGlmIChpc011bHRpbGluZSkge1xuICAgICAgICBlbmRQdHIgLT0gMjtcbiAgICAgICAgaWYgKHN0cltwdHIgKz0gMl0gPT09ICdcXHInKVxuICAgICAgICAgICAgcHRyKys7XG4gICAgICAgIGlmIChzdHJbcHRyXSA9PT0gJ1xcbicpXG4gICAgICAgICAgICBwdHIrKztcbiAgICB9XG4gICAgbGV0IHRtcCA9IDA7XG4gICAgbGV0IGlzRXNjYXBlO1xuICAgIGxldCBwYXJzZWQgPSAnJztcbiAgICBsZXQgc2xpY2VTdGFydCA9IHB0cjtcbiAgICB3aGlsZSAocHRyIDwgZW5kUHRyIC0gMSkge1xuICAgICAgICBsZXQgYyA9IHN0cltwdHIrK107XG4gICAgICAgIGlmIChjID09PSAnXFxuJyB8fCAoYyA9PT0gJ1xccicgJiYgc3RyW3B0cl0gPT09ICdcXG4nKSkge1xuICAgICAgICAgICAgaWYgKCFpc011bHRpbGluZSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUb21sRXJyb3IoJ25ld2xpbmVzIGFyZSBub3QgYWxsb3dlZCBpbiBzdHJpbmdzJywge1xuICAgICAgICAgICAgICAgICAgICB0b21sOiBzdHIsXG4gICAgICAgICAgICAgICAgICAgIHB0cjogcHRyIC0gMSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICgoYyA8ICdcXHgyMCcgJiYgYyAhPT0gJ1xcdCcpIHx8IGMgPT09ICdcXHg3ZicpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUb21sRXJyb3IoJ2NvbnRyb2wgY2hhcmFjdGVycyBhcmUgbm90IGFsbG93ZWQgaW4gc3RyaW5ncycsIHtcbiAgICAgICAgICAgICAgICB0b21sOiBzdHIsXG4gICAgICAgICAgICAgICAgcHRyOiBwdHIgLSAxLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzRXNjYXBlKSB7XG4gICAgICAgICAgICBpc0VzY2FwZSA9IGZhbHNlO1xuICAgICAgICAgICAgaWYgKGMgPT09ICd1JyB8fCBjID09PSAnVScpIHtcbiAgICAgICAgICAgICAgICAvLyBVbmljb2RlIGVzY2FwZVxuICAgICAgICAgICAgICAgIGxldCBjb2RlID0gc3RyLnNsaWNlKHB0ciwgKHB0ciArPSAoYyA9PT0gJ3UnID8gNCA6IDgpKSk7XG4gICAgICAgICAgICAgICAgaWYgKCFFU0NBUEVfUkVHRVgudGVzdChjb2RlKSkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVG9tbEVycm9yKCdpbnZhbGlkIHVuaWNvZGUgZXNjYXBlJywge1xuICAgICAgICAgICAgICAgICAgICAgICAgdG9tbDogc3RyLFxuICAgICAgICAgICAgICAgICAgICAgICAgcHRyOiB0bXAsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBwYXJzZWQgKz0gU3RyaW5nLmZyb21Db2RlUG9pbnQocGFyc2VJbnQoY29kZSwgMTYpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2F0Y2gge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVG9tbEVycm9yKCdpbnZhbGlkIHVuaWNvZGUgZXNjYXBlJywge1xuICAgICAgICAgICAgICAgICAgICAgICAgdG9tbDogc3RyLFxuICAgICAgICAgICAgICAgICAgICAgICAgcHRyOiB0bXAsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGlzTXVsdGlsaW5lICYmIChjID09PSAnXFxuJyB8fCBjID09PSAnICcgfHwgYyA9PT0gJ1xcdCcgfHwgYyA9PT0gJ1xccicpKSB7XG4gICAgICAgICAgICAgICAgLy8gTXVsdGlsaW5lIGVzY2FwZVxuICAgICAgICAgICAgICAgIHB0ciA9IHNraXBWb2lkKHN0ciwgcHRyIC0gMSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgaWYgKHN0cltwdHJdICE9PSAnXFxuJyAmJiBzdHJbcHRyXSAhPT0gJ1xccicpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFRvbWxFcnJvcignaW52YWxpZCBlc2NhcGU6IG9ubHkgbGluZS1lbmRpbmcgd2hpdGVzcGFjZSBtYXkgYmUgZXNjYXBlZCcsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvbWw6IHN0cixcbiAgICAgICAgICAgICAgICAgICAgICAgIHB0cjogdG1wLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcHRyID0gc2tpcFZvaWQoc3RyLCBwdHIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoYyBpbiBFU0NfTUFQKSB7XG4gICAgICAgICAgICAgICAgLy8gQ2xhc3NpYyBlc2NhcGVcbiAgICAgICAgICAgICAgICBwYXJzZWQgKz0gRVNDX01BUFtjXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUb21sRXJyb3IoJ3VucmVjb2duaXplZCBlc2NhcGUgc2VxdWVuY2UnLCB7XG4gICAgICAgICAgICAgICAgICAgIHRvbWw6IHN0cixcbiAgICAgICAgICAgICAgICAgICAgcHRyOiB0bXAsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzbGljZVN0YXJ0ID0gcHRyO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKCFpc0xpdGVyYWwgJiYgYyA9PT0gJ1xcXFwnKSB7XG4gICAgICAgICAgICB0bXAgPSBwdHIgLSAxO1xuICAgICAgICAgICAgaXNFc2NhcGUgPSB0cnVlO1xuICAgICAgICAgICAgcGFyc2VkICs9IHN0ci5zbGljZShzbGljZVN0YXJ0LCB0bXApO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBwYXJzZWQgKyBzdHIuc2xpY2Uoc2xpY2VTdGFydCwgZW5kUHRyIC0gMSk7XG59XG5leHBvcnQgZnVuY3Rpb24gcGFyc2VWYWx1ZSh2YWx1ZSwgdG9tbCwgcHRyLCBpbnRlZ2Vyc0FzQmlnSW50KSB7XG4gICAgLy8gQ29uc3RhbnQgdmFsdWVzXG4gICAgaWYgKHZhbHVlID09PSAndHJ1ZScpXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIGlmICh2YWx1ZSA9PT0gJ2ZhbHNlJylcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIGlmICh2YWx1ZSA9PT0gJy1pbmYnKVxuICAgICAgICByZXR1cm4gLUluZmluaXR5O1xuICAgIGlmICh2YWx1ZSA9PT0gJ2luZicgfHwgdmFsdWUgPT09ICcraW5mJylcbiAgICAgICAgcmV0dXJuIEluZmluaXR5O1xuICAgIGlmICh2YWx1ZSA9PT0gJ25hbicgfHwgdmFsdWUgPT09ICcrbmFuJyB8fCB2YWx1ZSA9PT0gJy1uYW4nKVxuICAgICAgICByZXR1cm4gTmFOO1xuICAgIC8vIEF2b2lkIEZQIHJlcHJlc2VudGF0aW9uIG9mIC0wXG4gICAgaWYgKHZhbHVlID09PSAnLTAnKVxuICAgICAgICByZXR1cm4gaW50ZWdlcnNBc0JpZ0ludCA/IDBuIDogMDtcbiAgICAvLyBOdW1iZXJzXG4gICAgbGV0IGlzSW50ID0gSU5UX1JFR0VYLnRlc3QodmFsdWUpO1xuICAgIGlmIChpc0ludCB8fCBGTE9BVF9SRUdFWC50ZXN0KHZhbHVlKSkge1xuICAgICAgICBpZiAoTEVBRElOR19aRVJPLnRlc3QodmFsdWUpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVG9tbEVycm9yKCdsZWFkaW5nIHplcm9lcyBhcmUgbm90IGFsbG93ZWQnLCB7XG4gICAgICAgICAgICAgICAgdG9tbDogdG9tbCxcbiAgICAgICAgICAgICAgICBwdHI6IHB0cixcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHZhbHVlID0gdmFsdWUucmVwbGFjZSgvXy9nLCAnJyk7XG4gICAgICAgIGxldCBudW1lcmljID0gK3ZhbHVlO1xuICAgICAgICBpZiAoaXNOYU4obnVtZXJpYykpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUb21sRXJyb3IoJ2ludmFsaWQgbnVtYmVyJywge1xuICAgICAgICAgICAgICAgIHRvbWw6IHRvbWwsXG4gICAgICAgICAgICAgICAgcHRyOiBwdHIsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNJbnQpIHtcbiAgICAgICAgICAgIGlmICgoaXNJbnQgPSAhTnVtYmVyLmlzU2FmZUludGVnZXIobnVtZXJpYykpICYmICFpbnRlZ2Vyc0FzQmlnSW50KSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFRvbWxFcnJvcignaW50ZWdlciB2YWx1ZSBjYW5ub3QgYmUgcmVwcmVzZW50ZWQgbG9zc2xlc3NseScsIHtcbiAgICAgICAgICAgICAgICAgICAgdG9tbDogdG9tbCxcbiAgICAgICAgICAgICAgICAgICAgcHRyOiBwdHIsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaXNJbnQgfHwgaW50ZWdlcnNBc0JpZ0ludCA9PT0gdHJ1ZSlcbiAgICAgICAgICAgICAgICBudW1lcmljID0gQmlnSW50KHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVtZXJpYztcbiAgICB9XG4gICAgY29uc3QgZGF0ZSA9IG5ldyBUb21sRGF0ZSh2YWx1ZSk7XG4gICAgaWYgKCFkYXRlLmlzVmFsaWQoKSkge1xuICAgICAgICB0aHJvdyBuZXcgVG9tbEVycm9yKCdpbnZhbGlkIHZhbHVlJywge1xuICAgICAgICAgICAgdG9tbDogdG9tbCxcbiAgICAgICAgICAgIHB0cjogcHRyLFxuICAgICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIGRhdGU7XG59XG4iLCAiLyohXG4gKiBDb3B5cmlnaHQgKGMpIFNxdWlycmVsIENoYXQgZXQgYWwuLCBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICogU1BEWC1MaWNlbnNlLUlkZW50aWZpZXI6IEJTRC0zLUNsYXVzZVxuICpcbiAqIFJlZGlzdHJpYnV0aW9uIGFuZCB1c2UgaW4gc291cmNlIGFuZCBiaW5hcnkgZm9ybXMsIHdpdGggb3Igd2l0aG91dFxuICogbW9kaWZpY2F0aW9uLCBhcmUgcGVybWl0dGVkIHByb3ZpZGVkIHRoYXQgdGhlIGZvbGxvd2luZyBjb25kaXRpb25zIGFyZSBtZXQ6XG4gKlxuICogMS4gUmVkaXN0cmlidXRpb25zIG9mIHNvdXJjZSBjb2RlIG11c3QgcmV0YWluIHRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlLCB0aGlzXG4gKiAgICBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmcgZGlzY2xhaW1lci5cbiAqIDIuIFJlZGlzdHJpYnV0aW9ucyBpbiBiaW5hcnkgZm9ybSBtdXN0IHJlcHJvZHVjZSB0aGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSxcbiAqICAgIHRoaXMgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nIGRpc2NsYWltZXIgaW4gdGhlXG4gKiAgICBkb2N1bWVudGF0aW9uIGFuZC9vciBvdGhlciBtYXRlcmlhbHMgcHJvdmlkZWQgd2l0aCB0aGUgZGlzdHJpYnV0aW9uLlxuICogMy4gTmVpdGhlciB0aGUgbmFtZSBvZiB0aGUgY29weXJpZ2h0IGhvbGRlciBub3IgdGhlIG5hbWVzIG9mIGl0cyBjb250cmlidXRvcnNcbiAqICAgIG1heSBiZSB1c2VkIHRvIGVuZG9yc2Ugb3IgcHJvbW90ZSBwcm9kdWN0cyBkZXJpdmVkIGZyb20gdGhpcyBzb2Z0d2FyZSB3aXRob3V0XG4gKiAgICBzcGVjaWZpYyBwcmlvciB3cml0dGVuIHBlcm1pc3Npb24uXG4gKlxuICogVEhJUyBTT0ZUV0FSRSBJUyBQUk9WSURFRCBCWSBUSEUgQ09QWVJJR0hUIEhPTERFUlMgQU5EIENPTlRSSUJVVE9SUyBcIkFTIElTXCIgQU5EXG4gKiBBTlkgRVhQUkVTUyBPUiBJTVBMSUVEIFdBUlJBTlRJRVMsIElOQ0xVRElORywgQlVUIE5PVCBMSU1JVEVEIFRPLCBUSEUgSU1QTElFRFxuICogV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFkgQU5EIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFSRVxuICogRElTQ0xBSU1FRC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFIENPUFlSSUdIVCBIT0xERVIgT1IgQ09OVFJJQlVUT1JTIEJFIExJQUJMRVxuICogRk9SIEFOWSBESVJFQ1QsIElORElSRUNULCBJTkNJREVOVEFMLCBTUEVDSUFMLCBFWEVNUExBUlksIE9SIENPTlNFUVVFTlRJQUxcbiAqIERBTUFHRVMgKElOQ0xVRElORywgQlVUIE5PVCBMSU1JVEVEIFRPLCBQUk9DVVJFTUVOVCBPRiBTVUJTVElUVVRFIEdPT0RTIE9SXG4gKiBTRVJWSUNFUzsgTE9TUyBPRiBVU0UsIERBVEEsIE9SIFBST0ZJVFM7IE9SIEJVU0lORVNTIElOVEVSUlVQVElPTikgSE9XRVZFUlxuICogQ0FVU0VEIEFORCBPTiBBTlkgVEhFT1JZIE9GIExJQUJJTElUWSwgV0hFVEhFUiBJTiBDT05UUkFDVCwgU1RSSUNUIExJQUJJTElUWSxcbiAqIE9SIFRPUlQgKElOQ0xVRElORyBORUdMSUdFTkNFIE9SIE9USEVSV0lTRSkgQVJJU0lORyBJTiBBTlkgV0FZIE9VVCBPRiBUSEUgVVNFXG4gKiBPRiBUSElTIFNPRlRXQVJFLCBFVkVOIElGIEFEVklTRUQgT0YgVEhFIFBPU1NJQklMSVRZIE9GIFNVQ0ggREFNQUdFLlxuICovXG5pbXBvcnQgeyBwYXJzZVN0cmluZywgcGFyc2VWYWx1ZSB9IGZyb20gJy4vcHJpbWl0aXZlLmpzJztcbmltcG9ydCB7IHBhcnNlQXJyYXksIHBhcnNlSW5saW5lVGFibGUgfSBmcm9tICcuL3N0cnVjdC5qcyc7XG5pbXBvcnQgeyBpbmRleE9mTmV3bGluZSwgc2tpcFZvaWQsIHNraXBVbnRpbCwgc2tpcENvbW1lbnQsIGdldFN0cmluZ0VuZCB9IGZyb20gJy4vdXRpbC5qcyc7XG5pbXBvcnQgeyBUb21sRXJyb3IgfSBmcm9tICcuL2Vycm9yLmpzJztcbmZ1bmN0aW9uIHNsaWNlQW5kVHJpbUVuZE9mKHN0ciwgc3RhcnRQdHIsIGVuZFB0ciwgYWxsb3dOZXdMaW5lcykge1xuICAgIGxldCB2YWx1ZSA9IHN0ci5zbGljZShzdGFydFB0ciwgZW5kUHRyKTtcbiAgICBsZXQgY29tbWVudElkeCA9IHZhbHVlLmluZGV4T2YoJyMnKTtcbiAgICBpZiAoY29tbWVudElkeCA+IC0xKSB7XG4gICAgICAgIC8vIFRoZSBjYWxsIHRvIHNraXBDb21tZW50IGFsbG93cyB0byBcInZhbGlkYXRlXCIgdGhlIGNvbW1lbnRcbiAgICAgICAgLy8gKGFic2VuY2Ugb2YgY29udHJvbCBjaGFyYWN0ZXJzKVxuICAgICAgICBza2lwQ29tbWVudChzdHIsIGNvbW1lbnRJZHgpO1xuICAgICAgICB2YWx1ZSA9IHZhbHVlLnNsaWNlKDAsIGNvbW1lbnRJZHgpO1xuICAgIH1cbiAgICBsZXQgdHJpbW1lZCA9IHZhbHVlLnRyaW1FbmQoKTtcbiAgICBpZiAoIWFsbG93TmV3TGluZXMpIHtcbiAgICAgICAgbGV0IG5ld2xpbmVJZHggPSB2YWx1ZS5pbmRleE9mKCdcXG4nLCB0cmltbWVkLmxlbmd0aCk7XG4gICAgICAgIGlmIChuZXdsaW5lSWR4ID4gLTEpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUb21sRXJyb3IoJ25ld2xpbmVzIGFyZSBub3QgYWxsb3dlZCBpbiBpbmxpbmUgdGFibGVzJywge1xuICAgICAgICAgICAgICAgIHRvbWw6IHN0cixcbiAgICAgICAgICAgICAgICBwdHI6IHN0YXJ0UHRyICsgbmV3bGluZUlkeFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIFt0cmltbWVkLCBjb21tZW50SWR4XTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0VmFsdWUoc3RyLCBwdHIsIGVuZCwgZGVwdGgsIGludGVnZXJzQXNCaWdJbnQpIHtcbiAgICBpZiAoZGVwdGggPT09IDApIHtcbiAgICAgICAgdGhyb3cgbmV3IFRvbWxFcnJvcignZG9jdW1lbnQgY29udGFpbnMgZXhjZXNzaXZlbHkgbmVzdGVkIHN0cnVjdHVyZXMuIGFib3J0aW5nLicsIHtcbiAgICAgICAgICAgIHRvbWw6IHN0cixcbiAgICAgICAgICAgIHB0cjogcHRyXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBsZXQgYyA9IHN0cltwdHJdO1xuICAgIGlmIChjID09PSAnWycgfHwgYyA9PT0gJ3snKSB7XG4gICAgICAgIGxldCBbdmFsdWUsIGVuZFB0cl0gPSBjID09PSAnWydcbiAgICAgICAgICAgID8gcGFyc2VBcnJheShzdHIsIHB0ciwgZGVwdGgsIGludGVnZXJzQXNCaWdJbnQpXG4gICAgICAgICAgICA6IHBhcnNlSW5saW5lVGFibGUoc3RyLCBwdHIsIGRlcHRoLCBpbnRlZ2Vyc0FzQmlnSW50KTtcbiAgICAgICAgbGV0IG5ld1B0ciA9IGVuZCA/IHNraXBVbnRpbChzdHIsIGVuZFB0ciwgJywnLCBlbmQpIDogZW5kUHRyO1xuICAgICAgICBpZiAoZW5kUHRyIC0gbmV3UHRyICYmIGVuZCA9PT0gJ30nKSB7XG4gICAgICAgICAgICBsZXQgbmV4dE5ld0xpbmUgPSBpbmRleE9mTmV3bGluZShzdHIsIGVuZFB0ciwgbmV3UHRyKTtcbiAgICAgICAgICAgIGlmIChuZXh0TmV3TGluZSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFRvbWxFcnJvcignbmV3bGluZXMgYXJlIG5vdCBhbGxvd2VkIGluIGlubGluZSB0YWJsZXMnLCB7XG4gICAgICAgICAgICAgICAgICAgIHRvbWw6IHN0cixcbiAgICAgICAgICAgICAgICAgICAgcHRyOiBuZXh0TmV3TGluZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBbdmFsdWUsIG5ld1B0cl07XG4gICAgfVxuICAgIGxldCBlbmRQdHI7XG4gICAgaWYgKGMgPT09ICdcIicgfHwgYyA9PT0gXCInXCIpIHtcbiAgICAgICAgZW5kUHRyID0gZ2V0U3RyaW5nRW5kKHN0ciwgcHRyKTtcbiAgICAgICAgbGV0IHBhcnNlZCA9IHBhcnNlU3RyaW5nKHN0ciwgcHRyLCBlbmRQdHIpO1xuICAgICAgICBpZiAoZW5kKSB7XG4gICAgICAgICAgICBlbmRQdHIgPSBza2lwVm9pZChzdHIsIGVuZFB0ciwgZW5kICE9PSAnXScpO1xuICAgICAgICAgICAgaWYgKHN0cltlbmRQdHJdICYmIHN0cltlbmRQdHJdICE9PSAnLCcgJiYgc3RyW2VuZFB0cl0gIT09IGVuZCAmJiBzdHJbZW5kUHRyXSAhPT0gJ1xcbicgJiYgc3RyW2VuZFB0cl0gIT09ICdcXHInKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFRvbWxFcnJvcigndW5leHBlY3RlZCBjaGFyYWN0ZXIgZW5jb3VudGVyZWQnLCB7XG4gICAgICAgICAgICAgICAgICAgIHRvbWw6IHN0cixcbiAgICAgICAgICAgICAgICAgICAgcHRyOiBlbmRQdHIsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbmRQdHIgKz0gKCsoc3RyW2VuZFB0cl0gPT09ICcsJykpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBbcGFyc2VkLCBlbmRQdHJdO1xuICAgIH1cbiAgICBlbmRQdHIgPSBza2lwVW50aWwoc3RyLCBwdHIsICcsJywgZW5kKTtcbiAgICBsZXQgc2xpY2UgPSBzbGljZUFuZFRyaW1FbmRPZihzdHIsIHB0ciwgZW5kUHRyIC0gKCsoc3RyW2VuZFB0ciAtIDFdID09PSAnLCcpKSwgZW5kID09PSAnXScpO1xuICAgIGlmICghc2xpY2VbMF0pIHtcbiAgICAgICAgdGhyb3cgbmV3IFRvbWxFcnJvcignaW5jb21wbGV0ZSBrZXktdmFsdWUgZGVjbGFyYXRpb246IG5vIHZhbHVlIHNwZWNpZmllZCcsIHtcbiAgICAgICAgICAgIHRvbWw6IHN0cixcbiAgICAgICAgICAgIHB0cjogcHRyXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBpZiAoZW5kICYmIHNsaWNlWzFdID4gLTEpIHtcbiAgICAgICAgZW5kUHRyID0gc2tpcFZvaWQoc3RyLCBwdHIgKyBzbGljZVsxXSk7XG4gICAgICAgIGVuZFB0ciArPSArKHN0cltlbmRQdHJdID09PSAnLCcpO1xuICAgIH1cbiAgICByZXR1cm4gW1xuICAgICAgICBwYXJzZVZhbHVlKHNsaWNlWzBdLCBzdHIsIHB0ciwgaW50ZWdlcnNBc0JpZ0ludCksXG4gICAgICAgIGVuZFB0cixcbiAgICBdO1xufVxuIiwgIi8qIVxuICogQ29weXJpZ2h0IChjKSBTcXVpcnJlbCBDaGF0IGV0IGFsLiwgQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqIFNQRFgtTGljZW5zZS1JZGVudGlmaWVyOiBCU0QtMy1DbGF1c2VcbiAqXG4gKiBSZWRpc3RyaWJ1dGlvbiBhbmQgdXNlIGluIHNvdXJjZSBhbmQgYmluYXJ5IGZvcm1zLCB3aXRoIG9yIHdpdGhvdXRcbiAqIG1vZGlmaWNhdGlvbiwgYXJlIHBlcm1pdHRlZCBwcm92aWRlZCB0aGF0IHRoZSBmb2xsb3dpbmcgY29uZGl0aW9ucyBhcmUgbWV0OlxuICpcbiAqIDEuIFJlZGlzdHJpYnV0aW9ucyBvZiBzb3VyY2UgY29kZSBtdXN0IHJldGFpbiB0aGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSwgdGhpc1xuICogICAgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nIGRpc2NsYWltZXIuXG4gKiAyLiBSZWRpc3RyaWJ1dGlvbnMgaW4gYmluYXJ5IGZvcm0gbXVzdCByZXByb2R1Y2UgdGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UsXG4gKiAgICB0aGlzIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZyBkaXNjbGFpbWVyIGluIHRoZVxuICogICAgZG9jdW1lbnRhdGlvbiBhbmQvb3Igb3RoZXIgbWF0ZXJpYWxzIHByb3ZpZGVkIHdpdGggdGhlIGRpc3RyaWJ1dGlvbi5cbiAqIDMuIE5laXRoZXIgdGhlIG5hbWUgb2YgdGhlIGNvcHlyaWdodCBob2xkZXIgbm9yIHRoZSBuYW1lcyBvZiBpdHMgY29udHJpYnV0b3JzXG4gKiAgICBtYXkgYmUgdXNlZCB0byBlbmRvcnNlIG9yIHByb21vdGUgcHJvZHVjdHMgZGVyaXZlZCBmcm9tIHRoaXMgc29mdHdhcmUgd2l0aG91dFxuICogICAgc3BlY2lmaWMgcHJpb3Igd3JpdHRlbiBwZXJtaXNzaW9uLlxuICpcbiAqIFRISVMgU09GVFdBUkUgSVMgUFJPVklERUQgQlkgVEhFIENPUFlSSUdIVCBIT0xERVJTIEFORCBDT05UUklCVVRPUlMgXCJBUyBJU1wiIEFORFxuICogQU5ZIEVYUFJFU1MgT1IgSU1QTElFRCBXQVJSQU5USUVTLCBJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTywgVEhFIElNUExJRURcbiAqIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZIEFORCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBUkVcbiAqIERJU0NMQUlNRUQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBDT1BZUklHSFQgSE9MREVSIE9SIENPTlRSSUJVVE9SUyBCRSBMSUFCTEVcbiAqIEZPUiBBTlkgRElSRUNULCBJTkRJUkVDVCwgSU5DSURFTlRBTCwgU1BFQ0lBTCwgRVhFTVBMQVJZLCBPUiBDT05TRVFVRU5USUFMXG4gKiBEQU1BR0VTIChJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTywgUFJPQ1VSRU1FTlQgT0YgU1VCU1RJVFVURSBHT09EUyBPUlxuICogU0VSVklDRVM7IExPU1MgT0YgVVNFLCBEQVRBLCBPUiBQUk9GSVRTOyBPUiBCVVNJTkVTUyBJTlRFUlJVUFRJT04pIEhPV0VWRVJcbiAqIENBVVNFRCBBTkQgT04gQU5ZIFRIRU9SWSBPRiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQ09OVFJBQ1QsIFNUUklDVCBMSUFCSUxJVFksXG4gKiBPUiBUT1JUIChJTkNMVURJTkcgTkVHTElHRU5DRSBPUiBPVEhFUldJU0UpIEFSSVNJTkcgSU4gQU5ZIFdBWSBPVVQgT0YgVEhFIFVTRVxuICogT0YgVEhJUyBTT0ZUV0FSRSwgRVZFTiBJRiBBRFZJU0VEIE9GIFRIRSBQT1NTSUJJTElUWSBPRiBTVUNIIERBTUFHRS5cbiAqL1xuaW1wb3J0IHsgcGFyc2VTdHJpbmcgfSBmcm9tICcuL3ByaW1pdGl2ZS5qcyc7XG5pbXBvcnQgeyBleHRyYWN0VmFsdWUgfSBmcm9tICcuL2V4dHJhY3QuanMnO1xuaW1wb3J0IHsgZ2V0U3RyaW5nRW5kLCBpbmRleE9mTmV3bGluZSwgc2tpcENvbW1lbnQsIHNraXBWb2lkIH0gZnJvbSAnLi91dGlsLmpzJztcbmltcG9ydCB7IFRvbWxFcnJvciB9IGZyb20gJy4vZXJyb3IuanMnO1xubGV0IEtFWV9QQVJUX1JFID0gL15bYS16QS1aMC05LV9dK1sgXFx0XSokLztcbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUtleShzdHIsIHB0ciwgZW5kID0gJz0nKSB7XG4gICAgbGV0IGRvdCA9IHB0ciAtIDE7XG4gICAgbGV0IHBhcnNlZCA9IFtdO1xuICAgIGxldCBlbmRQdHIgPSBzdHIuaW5kZXhPZihlbmQsIHB0cik7XG4gICAgaWYgKGVuZFB0ciA8IDApIHtcbiAgICAgICAgdGhyb3cgbmV3IFRvbWxFcnJvcignaW5jb21wbGV0ZSBrZXktdmFsdWU6IGNhbm5vdCBmaW5kIGVuZCBvZiBrZXknLCB7XG4gICAgICAgICAgICB0b21sOiBzdHIsXG4gICAgICAgICAgICBwdHI6IHB0cixcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGRvIHtcbiAgICAgICAgbGV0IGMgPSBzdHJbcHRyID0gKytkb3RdO1xuICAgICAgICAvLyBJZiBpdCdzIHdoaXRlc3BhY2UsIGlnbm9yZVxuICAgICAgICBpZiAoYyAhPT0gJyAnICYmIGMgIT09ICdcXHQnKSB7XG4gICAgICAgICAgICAvLyBJZiBpdCdzIGEgc3RyaW5nXG4gICAgICAgICAgICBpZiAoYyA9PT0gJ1wiJyB8fCBjID09PSAnXFwnJykge1xuICAgICAgICAgICAgICAgIGlmIChjID09PSBzdHJbcHRyICsgMV0gJiYgYyA9PT0gc3RyW3B0ciArIDJdKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBUb21sRXJyb3IoJ211bHRpbGluZSBzdHJpbmdzIGFyZSBub3QgYWxsb3dlZCBpbiBrZXlzJywge1xuICAgICAgICAgICAgICAgICAgICAgICAgdG9tbDogc3RyLFxuICAgICAgICAgICAgICAgICAgICAgICAgcHRyOiBwdHIsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBsZXQgZW9zID0gZ2V0U3RyaW5nRW5kKHN0ciwgcHRyKTtcbiAgICAgICAgICAgICAgICBpZiAoZW9zIDwgMCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVG9tbEVycm9yKCd1bmZpbmlzaGVkIHN0cmluZyBlbmNvdW50ZXJlZCcsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvbWw6IHN0cixcbiAgICAgICAgICAgICAgICAgICAgICAgIHB0cjogcHRyLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZG90ID0gc3RyLmluZGV4T2YoJy4nLCBlb3MpO1xuICAgICAgICAgICAgICAgIGxldCBzdHJFbmQgPSBzdHIuc2xpY2UoZW9zLCBkb3QgPCAwIHx8IGRvdCA+IGVuZFB0ciA/IGVuZFB0ciA6IGRvdCk7XG4gICAgICAgICAgICAgICAgbGV0IG5ld0xpbmUgPSBpbmRleE9mTmV3bGluZShzdHJFbmQpO1xuICAgICAgICAgICAgICAgIGlmIChuZXdMaW5lID4gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFRvbWxFcnJvcignbmV3bGluZXMgYXJlIG5vdCBhbGxvd2VkIGluIGtleXMnLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0b21sOiBzdHIsXG4gICAgICAgICAgICAgICAgICAgICAgICBwdHI6IHB0ciArIGRvdCArIG5ld0xpbmUsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoc3RyRW5kLnRyaW1TdGFydCgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBUb21sRXJyb3IoJ2ZvdW5kIGV4dHJhIHRva2VucyBhZnRlciB0aGUgc3RyaW5nIHBhcnQnLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0b21sOiBzdHIsXG4gICAgICAgICAgICAgICAgICAgICAgICBwdHI6IGVvcyxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChlbmRQdHIgPCBlb3MpIHtcbiAgICAgICAgICAgICAgICAgICAgZW5kUHRyID0gc3RyLmluZGV4T2YoZW5kLCBlb3MpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZW5kUHRyIDwgMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFRvbWxFcnJvcignaW5jb21wbGV0ZSBrZXktdmFsdWU6IGNhbm5vdCBmaW5kIGVuZCBvZiBrZXknLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9tbDogc3RyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHB0cjogcHRyLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcGFyc2VkLnB1c2gocGFyc2VTdHJpbmcoc3RyLCBwdHIsIGVvcykpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gTm9ybWFsIHJhdyBrZXkgcGFydCBjb25zdW1wdGlvbiBhbmQgdmFsaWRhdGlvblxuICAgICAgICAgICAgICAgIGRvdCA9IHN0ci5pbmRleE9mKCcuJywgcHRyKTtcbiAgICAgICAgICAgICAgICBsZXQgcGFydCA9IHN0ci5zbGljZShwdHIsIGRvdCA8IDAgfHwgZG90ID4gZW5kUHRyID8gZW5kUHRyIDogZG90KTtcbiAgICAgICAgICAgICAgICBpZiAoIUtFWV9QQVJUX1JFLnRlc3QocGFydCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFRvbWxFcnJvcignb25seSBsZXR0ZXIsIG51bWJlcnMsIGRhc2hlcyBhbmQgdW5kZXJzY29yZXMgYXJlIGFsbG93ZWQgaW4ga2V5cycsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvbWw6IHN0cixcbiAgICAgICAgICAgICAgICAgICAgICAgIHB0cjogcHRyLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcGFyc2VkLnB1c2gocGFydC50cmltRW5kKCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIFVudGlsIHRoZXJlJ3Mgbm8gbW9yZSBkb3RcbiAgICB9IHdoaWxlIChkb3QgKyAxICYmIGRvdCA8IGVuZFB0cik7XG4gICAgcmV0dXJuIFtwYXJzZWQsIHNraXBWb2lkKHN0ciwgZW5kUHRyICsgMSwgdHJ1ZSwgdHJ1ZSldO1xufVxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlSW5saW5lVGFibGUoc3RyLCBwdHIsIGRlcHRoLCBpbnRlZ2Vyc0FzQmlnSW50KSB7XG4gICAgbGV0IHJlcyA9IHt9O1xuICAgIGxldCBzZWVuID0gbmV3IFNldCgpO1xuICAgIGxldCBjO1xuICAgIGxldCBjb21tYSA9IDA7XG4gICAgcHRyKys7XG4gICAgd2hpbGUgKChjID0gc3RyW3B0cisrXSkgIT09ICd9JyAmJiBjKSB7XG4gICAgICAgIGxldCBlcnIgPSB7IHRvbWw6IHN0ciwgcHRyOiBwdHIgLSAxIH07XG4gICAgICAgIGlmIChjID09PSAnXFxuJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFRvbWxFcnJvcignbmV3bGluZXMgYXJlIG5vdCBhbGxvd2VkIGluIGlubGluZSB0YWJsZXMnLCBlcnIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGMgPT09ICcjJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFRvbWxFcnJvcignaW5saW5lIHRhYmxlcyBjYW5ub3QgY29udGFpbiBjb21tZW50cycsIGVycik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoYyA9PT0gJywnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVG9tbEVycm9yKCdleHBlY3RlZCBrZXktdmFsdWUsIGZvdW5kIGNvbW1hJywgZXJyKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChjICE9PSAnICcgJiYgYyAhPT0gJ1xcdCcpIHtcbiAgICAgICAgICAgIGxldCBrO1xuICAgICAgICAgICAgbGV0IHQgPSByZXM7XG4gICAgICAgICAgICBsZXQgaGFzT3duID0gZmFsc2U7XG4gICAgICAgICAgICBsZXQgW2tleSwga2V5RW5kUHRyXSA9IHBhcnNlS2V5KHN0ciwgcHRyIC0gMSk7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGtleS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChpKVxuICAgICAgICAgICAgICAgICAgICB0ID0gaGFzT3duID8gdFtrXSA6ICh0W2tdID0ge30pO1xuICAgICAgICAgICAgICAgIGsgPSBrZXlbaV07XG4gICAgICAgICAgICAgICAgaWYgKChoYXNPd24gPSBPYmplY3QuaGFzT3duKHQsIGspKSAmJiAodHlwZW9mIHRba10gIT09ICdvYmplY3QnIHx8IHNlZW4uaGFzKHRba10pKSkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVG9tbEVycm9yKCd0cnlpbmcgdG8gcmVkZWZpbmUgYW4gYWxyZWFkeSBkZWZpbmVkIHZhbHVlJywge1xuICAgICAgICAgICAgICAgICAgICAgICAgdG9tbDogc3RyLFxuICAgICAgICAgICAgICAgICAgICAgICAgcHRyOiBwdHIsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIWhhc093biAmJiBrID09PSAnX19wcm90b19fJykge1xuICAgICAgICAgICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodCwgaywgeyBlbnVtZXJhYmxlOiB0cnVlLCBjb25maWd1cmFibGU6IHRydWUsIHdyaXRhYmxlOiB0cnVlIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChoYXNPd24pIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVG9tbEVycm9yKCd0cnlpbmcgdG8gcmVkZWZpbmUgYW4gYWxyZWFkeSBkZWZpbmVkIHZhbHVlJywge1xuICAgICAgICAgICAgICAgICAgICB0b21sOiBzdHIsXG4gICAgICAgICAgICAgICAgICAgIHB0cjogcHRyLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IFt2YWx1ZSwgdmFsdWVFbmRQdHJdID0gZXh0cmFjdFZhbHVlKHN0ciwga2V5RW5kUHRyLCAnfScsIGRlcHRoIC0gMSwgaW50ZWdlcnNBc0JpZ0ludCk7XG4gICAgICAgICAgICBzZWVuLmFkZCh2YWx1ZSk7XG4gICAgICAgICAgICB0W2tdID0gdmFsdWU7XG4gICAgICAgICAgICBwdHIgPSB2YWx1ZUVuZFB0cjtcbiAgICAgICAgICAgIGNvbW1hID0gc3RyW3B0ciAtIDFdID09PSAnLCcgPyBwdHIgLSAxIDogMDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoY29tbWEpIHtcbiAgICAgICAgdGhyb3cgbmV3IFRvbWxFcnJvcigndHJhaWxpbmcgY29tbWFzIGFyZSBub3QgYWxsb3dlZCBpbiBpbmxpbmUgdGFibGVzJywge1xuICAgICAgICAgICAgdG9tbDogc3RyLFxuICAgICAgICAgICAgcHRyOiBjb21tYSxcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGlmICghYykge1xuICAgICAgICB0aHJvdyBuZXcgVG9tbEVycm9yKCd1bmZpbmlzaGVkIHRhYmxlIGVuY291bnRlcmVkJywge1xuICAgICAgICAgICAgdG9tbDogc3RyLFxuICAgICAgICAgICAgcHRyOiBwdHIsXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gW3JlcywgcHRyXTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUFycmF5KHN0ciwgcHRyLCBkZXB0aCwgaW50ZWdlcnNBc0JpZ0ludCkge1xuICAgIGxldCByZXMgPSBbXTtcbiAgICBsZXQgYztcbiAgICBwdHIrKztcbiAgICB3aGlsZSAoKGMgPSBzdHJbcHRyKytdKSAhPT0gJ10nICYmIGMpIHtcbiAgICAgICAgaWYgKGMgPT09ICcsJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFRvbWxFcnJvcignZXhwZWN0ZWQgdmFsdWUsIGZvdW5kIGNvbW1hJywge1xuICAgICAgICAgICAgICAgIHRvbWw6IHN0cixcbiAgICAgICAgICAgICAgICBwdHI6IHB0ciAtIDEsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChjID09PSAnIycpXG4gICAgICAgICAgICBwdHIgPSBza2lwQ29tbWVudChzdHIsIHB0cik7XG4gICAgICAgIGVsc2UgaWYgKGMgIT09ICcgJyAmJiBjICE9PSAnXFx0JyAmJiBjICE9PSAnXFxuJyAmJiBjICE9PSAnXFxyJykge1xuICAgICAgICAgICAgbGV0IGUgPSBleHRyYWN0VmFsdWUoc3RyLCBwdHIgLSAxLCAnXScsIGRlcHRoIC0gMSwgaW50ZWdlcnNBc0JpZ0ludCk7XG4gICAgICAgICAgICByZXMucHVzaChlWzBdKTtcbiAgICAgICAgICAgIHB0ciA9IGVbMV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKCFjKSB7XG4gICAgICAgIHRocm93IG5ldyBUb21sRXJyb3IoJ3VuZmluaXNoZWQgYXJyYXkgZW5jb3VudGVyZWQnLCB7XG4gICAgICAgICAgICB0b21sOiBzdHIsXG4gICAgICAgICAgICBwdHI6IHB0cixcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBbcmVzLCBwdHJdO1xufVxuIiwgIi8qIVxuICogQ29weXJpZ2h0IChjKSBTcXVpcnJlbCBDaGF0IGV0IGFsLiwgQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqIFNQRFgtTGljZW5zZS1JZGVudGlmaWVyOiBCU0QtMy1DbGF1c2VcbiAqXG4gKiBSZWRpc3RyaWJ1dGlvbiBhbmQgdXNlIGluIHNvdXJjZSBhbmQgYmluYXJ5IGZvcm1zLCB3aXRoIG9yIHdpdGhvdXRcbiAqIG1vZGlmaWNhdGlvbiwgYXJlIHBlcm1pdHRlZCBwcm92aWRlZCB0aGF0IHRoZSBmb2xsb3dpbmcgY29uZGl0aW9ucyBhcmUgbWV0OlxuICpcbiAqIDEuIFJlZGlzdHJpYnV0aW9ucyBvZiBzb3VyY2UgY29kZSBtdXN0IHJldGFpbiB0aGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSwgdGhpc1xuICogICAgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nIGRpc2NsYWltZXIuXG4gKiAyLiBSZWRpc3RyaWJ1dGlvbnMgaW4gYmluYXJ5IGZvcm0gbXVzdCByZXByb2R1Y2UgdGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UsXG4gKiAgICB0aGlzIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZyBkaXNjbGFpbWVyIGluIHRoZVxuICogICAgZG9jdW1lbnRhdGlvbiBhbmQvb3Igb3RoZXIgbWF0ZXJpYWxzIHByb3ZpZGVkIHdpdGggdGhlIGRpc3RyaWJ1dGlvbi5cbiAqIDMuIE5laXRoZXIgdGhlIG5hbWUgb2YgdGhlIGNvcHlyaWdodCBob2xkZXIgbm9yIHRoZSBuYW1lcyBvZiBpdHMgY29udHJpYnV0b3JzXG4gKiAgICBtYXkgYmUgdXNlZCB0byBlbmRvcnNlIG9yIHByb21vdGUgcHJvZHVjdHMgZGVyaXZlZCBmcm9tIHRoaXMgc29mdHdhcmUgd2l0aG91dFxuICogICAgc3BlY2lmaWMgcHJpb3Igd3JpdHRlbiBwZXJtaXNzaW9uLlxuICpcbiAqIFRISVMgU09GVFdBUkUgSVMgUFJPVklERUQgQlkgVEhFIENPUFlSSUdIVCBIT0xERVJTIEFORCBDT05UUklCVVRPUlMgXCJBUyBJU1wiIEFORFxuICogQU5ZIEVYUFJFU1MgT1IgSU1QTElFRCBXQVJSQU5USUVTLCBJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTywgVEhFIElNUExJRURcbiAqIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZIEFORCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBUkVcbiAqIERJU0NMQUlNRUQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBDT1BZUklHSFQgSE9MREVSIE9SIENPTlRSSUJVVE9SUyBCRSBMSUFCTEVcbiAqIEZPUiBBTlkgRElSRUNULCBJTkRJUkVDVCwgSU5DSURFTlRBTCwgU1BFQ0lBTCwgRVhFTVBMQVJZLCBPUiBDT05TRVFVRU5USUFMXG4gKiBEQU1BR0VTIChJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTywgUFJPQ1VSRU1FTlQgT0YgU1VCU1RJVFVURSBHT09EUyBPUlxuICogU0VSVklDRVM7IExPU1MgT0YgVVNFLCBEQVRBLCBPUiBQUk9GSVRTOyBPUiBCVVNJTkVTUyBJTlRFUlJVUFRJT04pIEhPV0VWRVJcbiAqIENBVVNFRCBBTkQgT04gQU5ZIFRIRU9SWSBPRiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQ09OVFJBQ1QsIFNUUklDVCBMSUFCSUxJVFksXG4gKiBPUiBUT1JUIChJTkNMVURJTkcgTkVHTElHRU5DRSBPUiBPVEhFUldJU0UpIEFSSVNJTkcgSU4gQU5ZIFdBWSBPVVQgT0YgVEhFIFVTRVxuICogT0YgVEhJUyBTT0ZUV0FSRSwgRVZFTiBJRiBBRFZJU0VEIE9GIFRIRSBQT1NTSUJJTElUWSBPRiBTVUNIIERBTUFHRS5cbiAqL1xuaW1wb3J0IHsgcGFyc2VLZXkgfSBmcm9tICcuL3N0cnVjdC5qcyc7XG5pbXBvcnQgeyBleHRyYWN0VmFsdWUgfSBmcm9tICcuL2V4dHJhY3QuanMnO1xuaW1wb3J0IHsgc2tpcFZvaWQgfSBmcm9tICcuL3V0aWwuanMnO1xuaW1wb3J0IHsgVG9tbEVycm9yIH0gZnJvbSAnLi9lcnJvci5qcyc7XG5mdW5jdGlvbiBwZWVrVGFibGUoa2V5LCB0YWJsZSwgbWV0YSwgdHlwZSkge1xuICAgIGxldCB0ID0gdGFibGU7XG4gICAgbGV0IG0gPSBtZXRhO1xuICAgIGxldCBrO1xuICAgIGxldCBoYXNPd24gPSBmYWxzZTtcbiAgICBsZXQgc3RhdGU7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBrZXkubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGkpIHtcbiAgICAgICAgICAgIHQgPSBoYXNPd24gPyB0W2tdIDogKHRba10gPSB7fSk7XG4gICAgICAgICAgICBtID0gKHN0YXRlID0gbVtrXSkuYztcbiAgICAgICAgICAgIGlmICh0eXBlID09PSAwIC8qIFR5cGUuRE9UVEVEICovICYmIChzdGF0ZS50ID09PSAxIC8qIFR5cGUuRVhQTElDSVQgKi8gfHwgc3RhdGUudCA9PT0gMiAvKiBUeXBlLkFSUkFZICovKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHN0YXRlLnQgPT09IDIgLyogVHlwZS5BUlJBWSAqLykge1xuICAgICAgICAgICAgICAgIGxldCBsID0gdC5sZW5ndGggLSAxO1xuICAgICAgICAgICAgICAgIHQgPSB0W2xdO1xuICAgICAgICAgICAgICAgIG0gPSBtW2xdLmM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgayA9IGtleVtpXTtcbiAgICAgICAgaWYgKChoYXNPd24gPSBPYmplY3QuaGFzT3duKHQsIGspKSAmJiBtW2tdPy50ID09PSAwIC8qIFR5cGUuRE9UVEVEICovICYmIG1ba10/LmQpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGlmICghaGFzT3duKSB7XG4gICAgICAgICAgICBpZiAoayA9PT0gJ19fcHJvdG9fXycpIHtcbiAgICAgICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodCwgaywgeyBlbnVtZXJhYmxlOiB0cnVlLCBjb25maWd1cmFibGU6IHRydWUsIHdyaXRhYmxlOiB0cnVlIH0pO1xuICAgICAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShtLCBrLCB7IGVudW1lcmFibGU6IHRydWUsIGNvbmZpZ3VyYWJsZTogdHJ1ZSwgd3JpdGFibGU6IHRydWUgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBtW2tdID0ge1xuICAgICAgICAgICAgICAgIHQ6IGkgPCBrZXkubGVuZ3RoIC0gMSAmJiB0eXBlID09PSAyIC8qIFR5cGUuQVJSQVkgKi9cbiAgICAgICAgICAgICAgICAgICAgPyAzIC8qIFR5cGUuQVJSQVlfRE9UVEVEICovXG4gICAgICAgICAgICAgICAgICAgIDogdHlwZSxcbiAgICAgICAgICAgICAgICBkOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBpOiAwLFxuICAgICAgICAgICAgICAgIGM6IHt9LFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBzdGF0ZSA9IG1ba107XG4gICAgaWYgKHN0YXRlLnQgIT09IHR5cGUgJiYgISh0eXBlID09PSAxIC8qIFR5cGUuRVhQTElDSVQgKi8gJiYgc3RhdGUudCA9PT0gMyAvKiBUeXBlLkFSUkFZX0RPVFRFRCAqLykpIHtcbiAgICAgICAgLy8gQmFkIGtleSB0eXBlIVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgaWYgKHR5cGUgPT09IDIgLyogVHlwZS5BUlJBWSAqLykge1xuICAgICAgICBpZiAoIXN0YXRlLmQpIHtcbiAgICAgICAgICAgIHN0YXRlLmQgPSB0cnVlO1xuICAgICAgICAgICAgdFtrXSA9IFtdO1xuICAgICAgICB9XG4gICAgICAgIHRba10ucHVzaCh0ID0ge30pO1xuICAgICAgICBzdGF0ZS5jW3N0YXRlLmkrK10gPSAoc3RhdGUgPSB7IHQ6IDEgLyogVHlwZS5FWFBMSUNJVCAqLywgZDogZmFsc2UsIGk6IDAsIGM6IHt9IH0pO1xuICAgIH1cbiAgICBpZiAoc3RhdGUuZCkge1xuICAgICAgICAvLyBSZWRlZmluaW5nIGEgdGFibGUhXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBzdGF0ZS5kID0gdHJ1ZTtcbiAgICBpZiAodHlwZSA9PT0gMSAvKiBUeXBlLkVYUExJQ0lUICovKSB7XG4gICAgICAgIHQgPSBoYXNPd24gPyB0W2tdIDogKHRba10gPSB7fSk7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGUgPT09IDAgLyogVHlwZS5ET1RURUQgKi8gJiYgaGFzT3duKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gW2ssIHQsIHN0YXRlLmNdO1xufVxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlKHRvbWwsIHsgbWF4RGVwdGggPSAxMDAwLCBpbnRlZ2Vyc0FzQmlnSW50IH0gPSB7fSkge1xuICAgIGxldCByZXMgPSB7fTtcbiAgICBsZXQgbWV0YSA9IHt9O1xuICAgIGxldCB0YmwgPSByZXM7XG4gICAgbGV0IG0gPSBtZXRhO1xuICAgIGZvciAobGV0IHB0ciA9IHNraXBWb2lkKHRvbWwsIDApOyBwdHIgPCB0b21sLmxlbmd0aDspIHtcbiAgICAgICAgaWYgKHRvbWxbcHRyXSA9PT0gJ1snKSB7XG4gICAgICAgICAgICBsZXQgaXNUYWJsZUFycmF5ID0gdG9tbFsrK3B0cl0gPT09ICdbJztcbiAgICAgICAgICAgIGxldCBrID0gcGFyc2VLZXkodG9tbCwgcHRyICs9ICtpc1RhYmxlQXJyYXksICddJyk7XG4gICAgICAgICAgICBpZiAoaXNUYWJsZUFycmF5KSB7XG4gICAgICAgICAgICAgICAgaWYgKHRvbWxba1sxXSAtIDFdICE9PSAnXScpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFRvbWxFcnJvcignZXhwZWN0ZWQgZW5kIG9mIHRhYmxlIGRlY2xhcmF0aW9uJywge1xuICAgICAgICAgICAgICAgICAgICAgICAgdG9tbDogdG9tbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHB0cjoga1sxXSAtIDEsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBrWzFdKys7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgcCA9IHBlZWtUYWJsZShrWzBdLCByZXMsIG1ldGEsIGlzVGFibGVBcnJheSA/IDIgLyogVHlwZS5BUlJBWSAqLyA6IDEgLyogVHlwZS5FWFBMSUNJVCAqLyk7XG4gICAgICAgICAgICBpZiAoIXApIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVG9tbEVycm9yKCd0cnlpbmcgdG8gcmVkZWZpbmUgYW4gYWxyZWFkeSBkZWZpbmVkIHRhYmxlIG9yIHZhbHVlJywge1xuICAgICAgICAgICAgICAgICAgICB0b21sOiB0b21sLFxuICAgICAgICAgICAgICAgICAgICBwdHI6IHB0cixcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG0gPSBwWzJdO1xuICAgICAgICAgICAgdGJsID0gcFsxXTtcbiAgICAgICAgICAgIHB0ciA9IGtbMV07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBsZXQgayA9IHBhcnNlS2V5KHRvbWwsIHB0cik7XG4gICAgICAgICAgICBsZXQgcCA9IHBlZWtUYWJsZShrWzBdLCB0YmwsIG0sIDAgLyogVHlwZS5ET1RURUQgKi8pO1xuICAgICAgICAgICAgaWYgKCFwKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFRvbWxFcnJvcigndHJ5aW5nIHRvIHJlZGVmaW5lIGFuIGFscmVhZHkgZGVmaW5lZCB0YWJsZSBvciB2YWx1ZScsIHtcbiAgICAgICAgICAgICAgICAgICAgdG9tbDogdG9tbCxcbiAgICAgICAgICAgICAgICAgICAgcHRyOiBwdHIsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgdiA9IGV4dHJhY3RWYWx1ZSh0b21sLCBrWzFdLCB2b2lkIDAsIG1heERlcHRoLCBpbnRlZ2Vyc0FzQmlnSW50KTtcbiAgICAgICAgICAgIHBbMV1bcFswXV0gPSB2WzBdO1xuICAgICAgICAgICAgcHRyID0gdlsxXTtcbiAgICAgICAgfVxuICAgICAgICBwdHIgPSBza2lwVm9pZCh0b21sLCBwdHIsIHRydWUpO1xuICAgICAgICBpZiAodG9tbFtwdHJdICYmIHRvbWxbcHRyXSAhPT0gJ1xcbicgJiYgdG9tbFtwdHJdICE9PSAnXFxyJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFRvbWxFcnJvcignZWFjaCBrZXktdmFsdWUgZGVjbGFyYXRpb24gbXVzdCBiZSBmb2xsb3dlZCBieSBhbiBlbmQtb2YtbGluZScsIHtcbiAgICAgICAgICAgICAgICB0b21sOiB0b21sLFxuICAgICAgICAgICAgICAgIHB0cjogcHRyXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBwdHIgPSBza2lwVm9pZCh0b21sLCBwdHIpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xufVxuIiwgImltcG9ydCB7IFZhcmlhYmxlLCBHTGliIH0gZnJvbSBcImFzdGFsXCJcbmltcG9ydCB7IG1vbml0b3JGaWxlLCByZWFkRmlsZUFzeW5jLCB3cml0ZUZpbGVBc3luYyB9IGZyb20gXCJhc3RhbC9maWxlXCJcbmltcG9ydCB7IHogfSBmcm9tIFwiem9kXCJcbmltcG9ydCB7IHBhcnNlIH0gZnJvbSBcInNtb2wtdG9tbFwiXG5cbi8vIC0tLSBaT0QgU0NIRU1BUyAtLS1cblxuY29uc3QgU2NhbGluZ1NjaGVtYSA9IHoub2JqZWN0KHtcbiAgICB1bml0UmF0aW86IHoubnVtYmVyKCkuZGVmYXVsdCgwLjA1KSxcbiAgICByYWRpdXNSYXRpbzogei5udW1iZXIoKS5kZWZhdWx0KDIuMCksXG4gICAgZm9udFJhdGlvOiB6Lm51bWJlcigpLmRlZmF1bHQoMC40NSksXG4gICAgbWluRm9udFNpemU6IHoubnVtYmVyKCkuZGVmYXVsdCgxMSksXG59KVxuXG5jb25zdCBMYXlvdXRDb25maWdTY2hlbWEgPSB6Lm9iamVjdCh7XG4gICAgYmFySGVpZ2h0OiB6Lm51bWJlcigpLmRlZmF1bHQoMzApLFxuICAgIHNjcmVlbldpZHRoOiB6Lm51bWJlcigpLmRlZmF1bHQoMCksXG4gICAgbGF1bmNoZXJXaWR0aDogei5udW1iZXIoKS5kZWZhdWx0KDgwMCksXG4gICAgbGF1bmNoZXJIZWlnaHQ6IHoubnVtYmVyKCkuZGVmYXVsdCg1NDApLFxuICAgIGNsaXBib2FyZFdpZHRoOiB6Lm51bWJlcigpLmRlZmF1bHQoMC44NSksXG4gICAgY2xpcGJvYXJkSGVpZ2h0OiB6Lm51bWJlcigpLmRlZmF1bHQoMTQ0KSxcbiAgICBiYXI6IHoub2JqZWN0KHtcbiAgICAgICAgd29ya3NwYWNlU2NhbGU6IHoubnVtYmVyKCkuZGVmYXVsdCgwLjUpLFxuICAgICAgICBsZWZ0OiB6LmFycmF5KHouc3RyaW5nKCkpLmRlZmF1bHQoW1wiZGFzaGJvYXJkYnV0dG9uXCIsIFwiZGF0ZXRpbWVcIiwgXCJ3ZWF0aGVyXCIsIFwid2luZG93dGl0bGVcIl0pLFxuICAgICAgICBjZW50ZXI6IHouYXJyYXkoei5zdHJpbmcoKSkuZGVmYXVsdChbXCJ3b3Jrc3BhY2VzXCJdKSxcbiAgICAgICAgcmlnaHQ6IHouYXJyYXkoei5zdHJpbmcoKSkuZGVmYXVsdChbXCJ0cmF5XCIsIFwiYXVkaW9cIiwgXCJyZXNvdXJjZXVzYWdlXCIsIFwibWVkaWFcIl0pLFxuICAgIH0pLmRlZmF1bHQoe30pLFxuICAgIHBhZGRpbmc6IHoub2JqZWN0KHtcbiAgICAgICAgdmVydGljYWw6IHoubnVtYmVyKCkuZGVmYXVsdCgwKSxcbiAgICAgICAgaG9yaXpvbnRhbDogei5udW1iZXIoKS5kZWZhdWx0KDMpLFxuICAgIH0pLmRlZmF1bHQoe30pLFxuICAgIGxhdW5jaGVyOiB6Lm9iamVjdCh7XG5cbiAgICAgICAgc2lkZWJhcldpZHRoOiB6Lm51bWJlcigpLmRlZmF1bHQoMzIwKSxcbiAgICAgICAgZ3JpZENvbHVtbnM6IHoubnVtYmVyKCkuZGVmYXVsdCg1KSxcbiAgICAgICAgbWF4QXBwTmFtZUxlbmd0aDogei5udW1iZXIoKS5kZWZhdWx0KDEyKSxcbiAgICAgICAgc2VhcmNoQmFySGVpZ2h0UmF0aW86IHoubnVtYmVyKCkuZGVmYXVsdCgwLjEyKSxcbiAgICB9KS5kZWZhdWx0KHt9KSxcbiAgICBjbGlwYm9hcmQ6IHoub2JqZWN0KHtcbiAgICAgICAgY2FyZFdpZHRoOiB6Lm51bWJlcigpLmRlZmF1bHQoMTgwKSxcbiAgICAgICAgY2FyZEhlaWdodDogei5udW1iZXIoKS5kZWZhdWx0KDEyMCksXG4gICAgICAgIGltYWdlUHJldmlld1NpemU6IHoubnVtYmVyKCkuZGVmYXVsdCgwLjc1KSxcblxuICAgICAgICBtYXhWaXNpYmxlQ2FyZHM6IHoubnVtYmVyKCkuZGVmYXVsdCg4KSxcbiAgICAgICAgcHJldmlld0xpbmVzOiB6Lm51bWJlcigpLmRlZmF1bHQoMyksXG4gICAgfSkuZGVmYXVsdCh7fSksXG59KVxuXG5jb25zdCBBcHBlYXJhbmNlQ29uZmlnU2NoZW1hID0gei5vYmplY3Qoe1xuICAgIG1vbm9jaHJvbWVJY29uczogei5ib29sZWFuKCkuZGVmYXVsdCh0cnVlKSxcbiAgICBmdXp6eVNlYXJjaDogei5ib29sZWFuKCkuZGVmYXVsdCh0cnVlKSxcbiAgICBtYXhIaXN0b3J5SXRlbXM6IHoubnVtYmVyKCkuZGVmYXVsdCg1MCksXG4gICAgY29sb3JzOiB6Lm9iamVjdCh7XG4gICAgICAgIHByaW1hcnk6IHouc3RyaW5nKCkuZGVmYXVsdChcIiNGRjMzNTVcIiksXG4gICAgICAgIHN1cmZhY2U6IHouc3RyaW5nKCkuZGVmYXVsdChcIiMwQjBCMEJcIiksXG4gICAgICAgIHN1cmZhY2VEYXJrZXI6IHouc3RyaW5nKCkuZGVmYXVsdChcIiMwNzA3MDdcIiksXG4gICAgICAgIHRleHQ6IHouc3RyaW5nKCkuZGVmYXVsdChcIiNGMEYwRjBcIiksXG4gICAgICAgIGJvcmRlcjogei5zdHJpbmcoKS5kZWZhdWx0KFwicmdiYSgyNTUsIDI1NSwgMjU1LCAwLjA4KVwiKSxcbiAgICAgICAgYWNjZW50OiB6LnN0cmluZygpLmRlZmF1bHQoXCIjRkYzMzU1XCIpLFxuICAgICAgICBiYXJfYmc6IHouc3RyaW5nKCkuZGVmYXVsdChcInJnYmEoMCwgMCwgMCwgMC44NSlcIiksXG4gICAgfSkuZGVmYXVsdCh7fSksXG4gICAgZ2xhc3M6IHoub2JqZWN0KHtcbiAgICAgICAgYmx1cjogei5udW1iZXIoKS5kZWZhdWx0KDEyKSxcbiAgICAgICAgc3VyZmFjZU9wYWNpdHk6IHoubnVtYmVyKCkuZGVmYXVsdCgwLjA4KSxcbiAgICAgICAgYm9yZGVyT3BhY2l0eTogei5udW1iZXIoKS5kZWZhdWx0KDAuMTIpLFxuICAgICAgICBzYXR1cmF0aW9uOiB6Lm51bWJlcigpLmRlZmF1bHQoMS4xNSksXG4gICAgfSkuZGVmYXVsdCh7fSksXG4gICAgZWxldmF0aW9uOiB6Lm9iamVjdCh7XG4gICAgICAgIGxhdW5jaGVyOiB6Lm51bWJlcigpLmRlZmF1bHQoMSksXG4gICAgICAgIGNsaXBib2FyZDogei5udW1iZXIoKS5kZWZhdWx0KDApLFxuICAgIH0pLmRlZmF1bHQoe30pLFxufSlcblxuY29uc3QgQW5pbWF0aW9uQ29uZmlnU2NoZW1hID0gei5vYmplY3Qoe1xuICAgIHVpRHVyYXRpb246IHoubnVtYmVyKCkuZGVmYXVsdCgxNTApLFxuICAgIHdpbmRvd0R1cmF0aW9uOiB6Lm51bWJlcigpLmRlZmF1bHQoMzAwKSxcbiAgICBjdXJ2ZTogei5zdHJpbmcoKS5kZWZhdWx0KFwibGluZWFyXCIpLFxufSlcblxuY29uc3QgTGltaXRzU2NoZW1hID0gei5vYmplY3Qoe1xuICAgIG1lZGlhVGl0bGU6IHoubnVtYmVyKCkuZGVmYXVsdCgyNSksXG4gICAgbWVkaWFBcnRpc3Q6IHoubnVtYmVyKCkuZGVmYXVsdCgxNSksXG4gICAgd2luZG93VGl0bGU6IHoubnVtYmVyKCkuZGVmYXVsdCg0MCksXG59KVxuXG5jb25zdCBXaWRnZXRzU2NoZW1hID0gei5vYmplY3Qoe1xuICAgIGNsb2NrOiB6Lm9iamVjdCh7XG4gICAgICAgIGZvcm1hdDogei5zdHJpbmcoKS5kZWZhdWx0KFwiJUg6JU1cIiksXG4gICAgfSkuZGVmYXVsdCh7fSksXG59KVxuXG4vLyBNYWluIENvbmZpZyBTY2hlbWFcbmNvbnN0IENvbmZpZ1NjaGVtYSA9IHoub2JqZWN0KHtcbiAgICBzY2FsaW5nOiBTY2FsaW5nU2NoZW1hLmRlZmF1bHQoe30pLFxuICAgIGxheW91dDogTGF5b3V0Q29uZmlnU2NoZW1hLmRlZmF1bHQoe30pLFxuICAgIGFwcGVhcmFuY2U6IEFwcGVhcmFuY2VDb25maWdTY2hlbWEuZGVmYXVsdCh7fSksXG4gICAgYW5pbWF0aW9uOiBBbmltYXRpb25Db25maWdTY2hlbWEuZGVmYXVsdCh7fSksXG4gICAgbGltaXRzOiBMaW1pdHNTY2hlbWEuZGVmYXVsdCh7fSksXG4gICAgd2lkZ2V0czogV2lkZ2V0c1NjaGVtYS5kZWZhdWx0KHt9KSxcbn0pXG5cbmV4cG9ydCB0eXBlIENvbmZpZyA9IHouaW5mZXI8dHlwZW9mIENvbmZpZ1NjaGVtYT5cbmV4cG9ydCB0eXBlIFNjYWxpbmdDb25maWcgPSB6LmluZmVyPHR5cGVvZiBTY2FsaW5nU2NoZW1hPlxuZXhwb3J0IHR5cGUgTGF5b3V0Q29uZmlnID0gei5pbmZlcjx0eXBlb2YgTGF5b3V0Q29uZmlnU2NoZW1hPlxuZXhwb3J0IHR5cGUgQXBwZWFyYW5jZUNvbmZpZyA9IHouaW5mZXI8dHlwZW9mIEFwcGVhcmFuY2VDb25maWdTY2hlbWE+XG5leHBvcnQgdHlwZSBBbmltYXRpb25Db25maWcgPSB6LmluZmVyPHR5cGVvZiBBbmltYXRpb25Db25maWdTY2hlbWE+XG5cbi8vIC0tLSBBREFQVEVSIC0tLVxuXG5jb25zdCBTQ1JJUFRfRElSID0gR0xpYi5wYXRoX2dldF9kaXJuYW1lKGltcG9ydC5tZXRhLnVybC5yZXBsYWNlKFwiZmlsZTovL1wiLCBcIlwiKSlcbmNvbnN0IEFQUF9OQU1FID0gXCJsaXMtYmFyXCJcbmNvbnN0IENPTkZJR19ESVIgPSBgJHtHTGliLmdldF9ob21lX2RpcigpfS8uY29uZmlnLyR7QVBQX05BTUV9YFxuLy8gRGV2IE1vZGUgT3ZlcnJpZGVcbmNvbnN0IERFVl9UT01MX1BBVEggPSBgJHtHTGliLmdldF9ob21lX2RpcigpfS9MaXMtb3MvbW9kdWxlcy9ob21lL2Rlc2t0b3AvYXN0YWwvZGVmYXVsdC50b21sYFxuY29uc3QgQVBQRUFSQU5DRV9KU09OX1BBVEggPSBgJHtHTGliLmdldF9ob21lX2RpcigpfS8uY29uZmlnL2FzdGFsL2FwcGVhcmFuY2UuanNvbmBcblxuZXhwb3J0IGNsYXNzIENvbmZpZ0FkYXB0ZXIge1xuICAgIHByaXZhdGUgc3RhdGljIGluc3RhbmNlOiBDb25maWdBZGFwdGVyXG4gICAgcHJpdmF0ZSBfc3RhdGUgPSBuZXcgVmFyaWFibGU8Q29uZmlnPihDb25maWdTY2hlbWEucGFyc2Uoe30pKVxuICAgIHByaXZhdGUgX3RvbWxNb25pdG9yOiBhbnkgPSBudWxsXG4gICAgcHJpdmF0ZSBfdGhlbWVNb25pdG9yOiBhbnkgPSBudWxsXG5cbiAgICBwcml2YXRlIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmluaXQoKVxuICAgIH1cblxuICAgIHN0YXRpYyBnZXQoKTogQ29uZmlnQWRhcHRlciB7XG4gICAgICAgIGlmICghQ29uZmlnQWRhcHRlci5pbnN0YW5jZSkge1xuICAgICAgICAgICAgQ29uZmlnQWRhcHRlci5pbnN0YW5jZSA9IG5ldyBDb25maWdBZGFwdGVyKClcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gQ29uZmlnQWRhcHRlci5pbnN0YW5jZVxuICAgIH1cblxuICAgIGdldCBhZGFwdGVyKCk6IFZhcmlhYmxlPENvbmZpZz4ge1xuICAgICAgICByZXR1cm4gdGhpcy5fc3RhdGVcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKTogQ29uZmlnIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3N0YXRlLmdldCgpXG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBpbml0KCkge1xuICAgICAgICBjb25zb2xlLmxvZyhgW0NvbmZpZ0FkYXB0ZXJdIEluaXRpYWxpemluZy4uLmApXG5cbiAgICAgICAgLy8gUHJpb3JpdHk6IERldiBQYXRoID4gU2NyaXB0IERpciBQYXRoXG4gICAgICAgIGxldCB0b21sUGF0aCA9IERFVl9UT01MX1BBVEhcbiAgICAgICAgaWYgKEdMaWIuZmlsZV90ZXN0KHRvbWxQYXRoLCBHTGliLkZpbGVUZXN0LkVYSVNUUykpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbQ29uZmlnQWRhcHRlcl0gRGV2IE1vZGUgQWN0aXZlOiB1c2luZyBsb2NhbCBzb3VyY2UgY29uZmlnIGF0ICR7dG9tbFBhdGh9YClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRvbWxQYXRoID0gYCR7U0NSSVBUX0RJUn0vZGVmYXVsdC50b21sYFxuICAgICAgICAgICAgaWYgKCFHTGliLmZpbGVfdGVzdCh0b21sUGF0aCwgR0xpYi5GaWxlVGVzdC5FWElTVFMpKSB7XG4gICAgICAgICAgICAgICAgdG9tbFBhdGggPSBgJHtHTGliLnBhdGhfZ2V0X2Rpcm5hbWUoU0NSSVBUX0RJUil9L2RlZmF1bHQudG9tbGBcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChHTGliLmZpbGVfdGVzdCh0b21sUGF0aCwgR0xpYi5GaWxlVGVzdC5FWElTVFMpKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgW0NvbmZpZ0FkYXB0ZXJdIE1vbml0b3JpbmcgVE9NTCBhdDogJHt0b21sUGF0aH1gKVxuICAgICAgICAgICAgYXdhaXQgdGhpcy5sb2FkKHRvbWxQYXRoKVxuXG4gICAgICAgICAgICB0aGlzLl90b21sTW9uaXRvciA9IG1vbml0b3JGaWxlKHRvbWxQYXRoLCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJbQ29uZmlnQWRhcHRlcl0gZGVmYXVsdC50b21sIGNoYW5nZWQuIFJlbG9hZGluZy4uLlwiKVxuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMubG9hZCh0b21sUGF0aClcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBbQ29uZmlnQWRhcHRlcl0gRkFUQUw6IGRlZmF1bHQudG9tbCBub3QgZm91bmQgYXQgJHt0b21sUGF0aH1gKVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gTW9uaXRvciBUaGVtZSBFbmdpbmUgT3V0cHV0XG4gICAgICAgIGlmIChHTGliLmZpbGVfdGVzdChBUFBFQVJBTkNFX0pTT05fUEFUSCwgR0xpYi5GaWxlVGVzdC5FWElTVFMpKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgW0NvbmZpZ0FkYXB0ZXJdIE1vbml0b3JpbmcgVGhlbWUgYXQ6ICR7QVBQRUFSQU5DRV9KU09OX1BBVEh9YClcbiAgICAgICAgICAgIHRoaXMuX3RoZW1lTW9uaXRvciA9IG1vbml0b3JGaWxlKEFQUEVBUkFOQ0VfSlNPTl9QQVRILCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJbQ29uZmlnQWRhcHRlcl0gYXBwZWFyYW5jZS5qc29uIGNoYW5nZWQuIFJlbG9hZGluZy4uLlwiKVxuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMubG9hZCh0b21sUGF0aClcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGxvYWQodG9tbFBhdGg6IHN0cmluZykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gMS4gTG9hZCBUT01MXG4gICAgICAgICAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgcmVhZEZpbGVBc3luYyh0b21sUGF0aClcbiAgICAgICAgICAgIGNvbnN0IHBhcnNlZFRvbWwgPSBwYXJzZShjb250ZW50KVxuXG4gICAgICAgICAgICAvLyAyLiBMb2FkIFRoZW1lIChhcHBlYXJhbmNlLmpzb24pXG4gICAgICAgICAgICBsZXQgdGhlbWVDb2xvcnM6IGFueSA9IHt9XG4gICAgICAgICAgICBpZiAoR0xpYi5maWxlX3Rlc3QoQVBQRUFSQU5DRV9KU09OX1BBVEgsIEdMaWIuRmlsZVRlc3QuRVhJU1RTKSkge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGpzb25Db250ZW50ID0gYXdhaXQgcmVhZEZpbGVBc3luYyhBUFBFQVJBTkNFX0pTT05fUEFUSClcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdGhlbWVEYXRhID0gSlNPTi5wYXJzZShqc29uQ29udGVudClcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoZW1lRGF0YS5jb2xvcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoZW1lQ29sb3JzID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByaW1hcnk6IHRoZW1lRGF0YS5jb2xvcnMudWlfcHJpbSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdXJmYWNlOiB0aGVtZURhdGEuY29sb3JzLnN1cmZhY2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VyZmFjZURhcmtlcjogdGhlbWVEYXRhLmNvbG9ycy5zdXJmYWNlRGFya2VyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IHRoZW1lRGF0YS5jb2xvcnMudGV4dCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBib3JkZXI6IHRoZW1lRGF0YS5jb2xvcnMuc3VyZmFjZUxpZ2h0ZXIsIC8vIE9wdGlvbmFsIG1hcHBpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY2NlbnQ6IHRoZW1lRGF0YS5jb2xvcnMuc3luX2FjYyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYXJfYmc6IHRoZW1lRGF0YS5jb2xvcnMuYmFyX2JnLFxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJbQ29uZmlnQWRhcHRlcl0gTWVyZ2VkIHRoZW1lIGVuZ2luZSBjb2xvcnMuXCIpXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFtDb25maWdBZGFwdGVyXSBGYWlsZWQgdG8gcGFyc2UgYXBwZWFyYW5jZS5qc29uOiAke2V9YClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIDMuIE1lcmdlXG4gICAgICAgICAgICBjb25zdCBtZXJnZWRDb25maWcgPSB7XG4gICAgICAgICAgICAgICAgLi4ucGFyc2VkVG9tbCxcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChPYmplY3Qua2V5cyh0aGVtZUNvbG9ycykubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIC8vIEVuc3VyZSBhcHBlYXJhbmNlIG9iamVjdCBleGlzdHNcbiAgICAgICAgICAgICAgICBpZiAoIW1lcmdlZENvbmZpZy5hcHBlYXJhbmNlKSBtZXJnZWRDb25maWcuYXBwZWFyYW5jZSA9IHt9XG4gICAgICAgICAgICAgICAgLy8gRW5zdXJlIGNvbG9ycyBvYmplY3QgZXhpc3RzXG4gICAgICAgICAgICAgICAgaWYgKCFtZXJnZWRDb25maWcuYXBwZWFyYW5jZS5jb2xvcnMpIG1lcmdlZENvbmZpZy5hcHBlYXJhbmNlLmNvbG9ycyA9IHt9XG5cbiAgICAgICAgICAgICAgICAvLyBPdmVycmlkZSBjb2xvcnNcbiAgICAgICAgICAgICAgICBPYmplY3QuYXNzaWduKG1lcmdlZENvbmZpZy5hcHBlYXJhbmNlLmNvbG9ycywgdGhlbWVDb2xvcnMpXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIDQuIFZhbGlkYXRlIHdpdGggWm9kXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBDb25maWdTY2hlbWEuc2FmZVBhcnNlKG1lcmdlZENvbmZpZylcblxuICAgICAgICAgICAgaWYgKHJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc3RhdGUuc2V0KHJlc3VsdC5kYXRhKVxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiW0NvbmZpZ0FkYXB0ZXJdIENvbmZpZyBsb2FkZWQgYW5kIHZhbGlkYXRlZCBzdWNjZXNzZnVsbHkuXCIpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJbQ29uZmlnQWRhcHRlcl0gQ29uZmlnIFZhbGlkYXRpb24gRmFpbGVkOlwiLCByZXN1bHQuZXJyb3IpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFtDb25maWdBZGFwdGVyXSBGYWlsZWQgdG8gcGFyc2UgZGVmYXVsdC50b21sOiAke2V9YClcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgQ29uZmlnQWRhcHRlclxuIiwgImltcG9ydCB7IFZhcmlhYmxlLCBiaW5kLCBCaW5kaW5nIH0gZnJvbSBcImFzdGFsXCI7XG5pbXBvcnQgeyBHZGsgfSBmcm9tIFwiYXN0YWwvZ3RrM1wiO1xuaW1wb3J0IENvbmZpZ0FkYXB0ZXIsIHsgQ29uZmlnIH0gZnJvbSBcIi4vQ29uZmlnQWRhcHRlclwiO1xuXG4vLyBUeXBlcyBjb3JyZXNwb25kaW5nIHRvIGNvbnN1bWVyc1xuaW50ZXJmYWNlIExhdW5jaGVyQ29uZmlnIHtcbiAgICB3aWR0aDogbnVtYmVyO1xuICAgIGhlaWdodDogbnVtYmVyO1xuICAgIHNpZGViYXJXaWR0aDogbnVtYmVyO1xuICAgIGdyaWRDb2x1bW5zOiBudW1iZXI7XG4gICAgZ3JpZFJvd3M6IG51bWJlcjtcbiAgICBtYXhBcHBOYW1lTGVuZ3RoOiBudW1iZXI7XG4gICAgc2VhcmNoQmFyUGFkZGluZzogbnVtYmVyO1xuICAgIGFwcENhcmRQYWRkaW5nOiBudW1iZXI7XG4gICAgbW9kZUJ1dHRvblBhZGRpbmc6IG51bWJlcjtcbiAgICBzaWRlYmFyT3BhY2l0eTogbnVtYmVyO1xuICAgIHNlYXJjaEJhckhlaWdodFJhdGlvOiBudW1iZXI7XG59XG5cbmludGVyZmFjZSBDbGlwYm9hcmRDb25maWcge1xuICAgIHdpZHRoUmF0aW86IG51bWJlcjtcbiAgICBoZWlnaHQ6IG51bWJlcjtcbiAgICBjYXJkV2lkdGg6IG51bWJlcjtcbiAgICBjYXJkSGVpZ2h0OiBudW1iZXI7XG4gICAgaW1hZ2VQcmV2aWV3U2l6ZTogbnVtYmVyO1xuICAgIGNhcmRTcGFjaW5nOiBudW1iZXI7XG4gICAgbWF4VmlzaWJsZUNhcmRzOiBudW1iZXI7XG4gICAgcHJldmlld0xpbmVzOiBudW1iZXI7XG59XG5cbmludGVyZmFjZSBHbGFzc0NvbmZpZyB7XG4gICAgYmx1cjogbnVtYmVyO1xuICAgIHN1cmZhY2VPcGFjaXR5OiBudW1iZXI7XG4gICAgYm9yZGVyT3BhY2l0eTogbnVtYmVyO1xuICAgIHNhdHVyYXRpb246IG51bWJlcjtcbn1cblxuaW50ZXJmYWNlIENvbG9yc0NvbmZpZyB7XG4gICAgcHJpbWFyeTogc3RyaW5nO1xuICAgIHN1cmZhY2U6IHN0cmluZztcbiAgICBzdXJmYWNlRGFya2VyOiBzdHJpbmc7XG4gICAgdGV4dDogc3RyaW5nO1xuICAgIGJvcmRlcjogc3RyaW5nO1xuICAgIGFjY2VudDogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgRWxldmF0aW9uQ29uZmlnIHtcbiAgICBsYXVuY2hlcjogbnVtYmVyO1xuICAgIGNsaXBib2FyZDogbnVtYmVyO1xufVxuXG5pbnRlcmZhY2UgQW5pbWF0aW9uQ29uZmlnIHtcbiAgICB1aUR1cmF0aW9uOiBudW1iZXI7XG4gICAgd2luZG93RHVyYXRpb246IG51bWJlcjtcbiAgICBjdXJ2ZTogc3RyaW5nO1xufVxuXG5jbGFzcyBMYXlvdXRTZXJ2aWNlIHtcbiAgICBzdGF0aWMgaW5zdGFuY2U6IExheW91dFNlcnZpY2U7XG5cbiAgICBzdGF0aWMgZ2V0X2RlZmF1bHQoKSB7XG4gICAgICAgIGlmICghdGhpcy5pbnN0YW5jZSkgdGhpcy5pbnN0YW5jZSA9IG5ldyBMYXlvdXRTZXJ2aWNlKCk7XG4gICAgICAgIHJldHVybiB0aGlzLmluc3RhbmNlO1xuICAgIH1cblxuICAgIHByaXZhdGUgY29uZmlnOiBCaW5kaW5nPENvbmZpZz47XG5cbiAgICAvLyAtLS0gUmVhY3RpdmUgUHJpbWl0aXZlcyAtLS1cbiAgICByZWFkb25seSBiYXJIZWlnaHQ6IEJpbmRpbmc8bnVtYmVyPjtcbiAgICByZWFkb25seSB1bml0UmF0aW86IEJpbmRpbmc8bnVtYmVyPjtcbiAgICByZWFkb25seSByYWRpdXNSYXRpbzogQmluZGluZzxudW1iZXI+O1xuICAgIHJlYWRvbmx5IGZvbnRSYXRpbzogQmluZGluZzxudW1iZXI+O1xuICAgIHJlYWRvbmx5IG1pbkZvbnRTaXplOiBCaW5kaW5nPG51bWJlcj47XG5cbiAgICAvLyBUaGUgQmFzZSBVbml0IFVcbiAgICByZWFkb25seSBVOiBCaW5kaW5nPG51bWJlcj47XG5cbiAgICAvLyAtLS0gQ29tcG9uZW50LVNwZWNpZmljIENvbmZpZ3MgLS0tXG4gICAgcmVhZG9ubHkgbGF1bmNoZXI6IEJpbmRpbmc8TGF1bmNoZXJDb25maWc+O1xuICAgIHJlYWRvbmx5IGNsaXBib2FyZDogQmluZGluZzxDbGlwYm9hcmRDb25maWc+O1xuICAgIHJlYWRvbmx5IGdsYXNzOiBCaW5kaW5nPEdsYXNzQ29uZmlnPjtcbiAgICByZWFkb25seSBjb2xvcnM6IEJpbmRpbmc8Q29sb3JzQ29uZmlnPjtcbiAgICByZWFkb25seSBlbGV2YXRpb246IEJpbmRpbmc8RWxldmF0aW9uQ29uZmlnPjtcbiAgICByZWFkb25seSBhbmltYXRpb246IEJpbmRpbmc8QW5pbWF0aW9uQ29uZmlnPjtcblxuICAgIC8vIC0tLSBXaWRnZXQgQmluZGluZ3MgKFByZS1jYWxjdWxhdGVkIHR5cGVzKSAtLS1cbiAgICByZWFkb25seSB3b3Jrc3BhY2VJY29uU2l6ZTogQmluZGluZzxudW1iZXI+O1xuICAgIHJlYWRvbmx5IHdvcmtzcGFjZVBhZGRpbmc6IEJpbmRpbmc8bnVtYmVyPjtcbiAgICByZWFkb25seSB3b3Jrc3BhY2VGb250U2l6ZTogQmluZGluZzxudW1iZXI+O1xuXG5cbiAgICAvLyAtLS0gRHluYW1pYyBFbnZpcm9ubWVudGFsIEJpbmRpbmdzIC0tLVxuICAgIHJlYWRvbmx5IHNjcmVlbldpZHRoOiBCaW5kaW5nPG51bWJlcj47XG5cbiAgICAvLyAtLS0gUnVsZSBTZXQgR2FtbWEgJiBEZWx0YSAoQ29tcHV0ZWQgTGF5b3V0cykgLS0tXG5cbiAgICByZWFkb25seSBsYXVuY2hlckdlb21ldHJ5OiBCaW5kaW5nPHtcbiAgICAgICAgbWFpbldpZHRoOiBudW1iZXI7XG4gICAgICAgIHNpZGViYXJXaWR0aDogbnVtYmVyO1xuICAgICAgICBzZWFyY2hCYXJIZWlnaHQ6IG51bWJlcjtcbiAgICAgICAgZ3JpZEl0ZW1XaWR0aDogbnVtYmVyO1xuICAgICAgICBncmlkSXRlbUhlaWdodDogbnVtYmVyO1xuICAgIH0+O1xuXG4gICAgcmVhZG9ubHkgY2xpcGJvYXJkR2VvbWV0cnk6IEJpbmRpbmc8e1xuICAgICAgICB2aXNpYmxlV2lkdGg6IG51bWJlcjtcbiAgICAgICAgY2FyZEltYWdlU2l6ZTogbnVtYmVyO1xuICAgICAgICBjYXJkV2lkdGg6IG51bWJlcjtcbiAgICAgICAgY2FyZEhlaWdodDogbnVtYmVyO1xuICAgIH0+O1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuY29uZmlnID0gYmluZChDb25maWdBZGFwdGVyLmdldCgpLmFkYXB0ZXIpO1xuICAgICAgICBjb25zdCBjb25maWcgPSB0aGlzLmNvbmZpZztcblxuICAgICAgICAvLyAxLiBNYXN0ZXIgU2NhbGluZyBTb3VyY2U6IEJhciBIZWlnaHRcbiAgICAgICAgdGhpcy5iYXJIZWlnaHQgPSBjb25maWcuYXMoYyA9PiBjLmxheW91dC5iYXJIZWlnaHQpO1xuXG4gICAgICAgIC8vIDIuIFVuaXQgUmF0aW9cbiAgICAgICAgdGhpcy51bml0UmF0aW8gPSBjb25maWcuYXMoYyA9PiBjLnNjYWxpbmcudW5pdFJhdGlvKTtcblxuICAgICAgICAvLyAzLiBUaGUgQmFzZSBVbml0IFUgKENvbXB1dGVkIFByaW9yaXR5KVxuICAgICAgICAvLyBVID0gZmxvb3IoYmFySGVpZ2h0ICogcmF0aW8pXG4gICAgICAgIHRoaXMuVSA9IGJpbmQoVmFyaWFibGUuZGVyaXZlKFt0aGlzLmJhckhlaWdodCwgdGhpcy51bml0UmF0aW9dLCAoYmFyOiBudW1iZXIsIHJhdGlvOiBudW1iZXIpID0+XG4gICAgICAgICAgICBNYXRoLmZsb29yKGJhciAqIHJhdGlvKVxuICAgICAgICApKTtcblxuICAgICAgICAvLyBEeW5hbWljIFNjcmVlbiBXaWR0aFxuICAgICAgICB0aGlzLnNjcmVlbldpZHRoID0gY29uZmlnLmFzKGMgPT4ge1xuICAgICAgICAgICAgY29uc3Qgb3ZlcnJpZGUgPSBjLmxheW91dC5zY3JlZW5XaWR0aDtcbiAgICAgICAgICAgIGlmIChvdmVycmlkZSA+IDApIHJldHVybiBvdmVycmlkZTtcbiAgICAgICAgICAgIGNvbnN0IHNjcmVlbiA9IEdkay5TY3JlZW4uZ2V0X2RlZmF1bHQoKTtcbiAgICAgICAgICAgIHJldHVybiBzY3JlZW4gPyBzY3JlZW4uZ2V0X3dpZHRoKCkgOiAxOTIwO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyA0LiBSYWRpdXMgJiBGb250IFJhdGlvc1xuICAgICAgICB0aGlzLnJhZGl1c1JhdGlvID0gY29uZmlnLmFzKGMgPT4gYy5zY2FsaW5nLnJhZGl1c1JhdGlvKTtcbiAgICAgICAgdGhpcy5mb250UmF0aW8gPSBjb25maWcuYXMoYyA9PiBjLnNjYWxpbmcuZm9udFJhdGlvKTtcbiAgICAgICAgdGhpcy5taW5Gb250U2l6ZSA9IGNvbmZpZy5hcyhjID0+IGMuc2NhbGluZy5taW5Gb250U2l6ZSk7XG5cbiAgICAgICAgLy8gLS0tIENvbXBvbmVudC1TcGVjaWZpYyBDb25maWdzIC0tLVxuICAgICAgICAvLyBDb25zdHJ1Y3RpbmcgXCJWaWV3IE1vZGVsc1wiIGZyb20gdGhlIHJhdyBjb25maWdcbiAgICAgICAgdGhpcy5sYXVuY2hlciA9IGNvbmZpZy5hcyhjID0+ICh7XG4gICAgICAgICAgICB3aWR0aDogYy5sYXlvdXQubGF1bmNoZXJXaWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogYy5sYXlvdXQubGF1bmNoZXJIZWlnaHQsXG4gICAgICAgICAgICBzZWFyY2hCYXJIZWlnaHRSYXRpbzogYy5sYXlvdXQubGF1bmNoZXIuc2VhcmNoQmFySGVpZ2h0UmF0aW8sXG5cbiAgICAgICAgICAgIHNpZGViYXJXaWR0aDogYy5sYXlvdXQubGF1bmNoZXIuc2lkZWJhcldpZHRoLFxuICAgICAgICAgICAgZ3JpZENvbHVtbnM6IGMubGF5b3V0LmxhdW5jaGVyLmdyaWRDb2x1bW5zLFxuICAgICAgICAgICAgZ3JpZFJvd3M6IGMubGF5b3V0LmxhdW5jaGVyLmdyaWRSb3dzLFxuICAgICAgICAgICAgbWF4QXBwTmFtZUxlbmd0aDogYy5sYXlvdXQubGF1bmNoZXIubWF4QXBwTmFtZUxlbmd0aCxcblxuICAgICAgICAgICAgLy8gQXBwZWFyYW5jZSBtaXhlZCBpblxuICAgICAgICAgICAgc2VhcmNoQmFyUGFkZGluZzogYy5hcHBlYXJhbmNlLmxhdW5jaGVyPy5zZWFyY2hCYXJQYWRkaW5nID8/IDMsXG4gICAgICAgICAgICBhcHBDYXJkUGFkZGluZzogYy5hcHBlYXJhbmNlLmxhdW5jaGVyPy5hcHBDYXJkUGFkZGluZyA/PyA0LFxuICAgICAgICAgICAgbW9kZUJ1dHRvblBhZGRpbmc6IGMuYXBwZWFyYW5jZS5sYXVuY2hlcj8ubW9kZUJ1dHRvblBhZGRpbmcgPz8gMS41LFxuICAgICAgICAgICAgc2lkZWJhck9wYWNpdHk6IGMuYXBwZWFyYW5jZS5sYXVuY2hlcj8uc2lkZWJhck9wYWNpdHkgPz8gMC45LFxuICAgICAgICB9KSk7XG5cbiAgICAgICAgdGhpcy5jbGlwYm9hcmQgPSBjb25maWcuYXMoYyA9PiAoe1xuICAgICAgICAgICAgd2lkdGhSYXRpbzogYy5sYXlvdXQuY2xpcGJvYXJkV2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IGMubGF5b3V0LmNsaXBib2FyZEhlaWdodCxcblxuICAgICAgICAgICAgY2FyZFdpZHRoOiBjLmxheW91dC5jbGlwYm9hcmQuY2FyZFdpZHRoLFxuICAgICAgICAgICAgY2FyZEhlaWdodDogYy5sYXlvdXQuY2xpcGJvYXJkLmNhcmRIZWlnaHQsXG4gICAgICAgICAgICBpbWFnZVByZXZpZXdTaXplOiBjLmxheW91dC5jbGlwYm9hcmQuaW1hZ2VQcmV2aWV3U2l6ZSxcbiAgICAgICAgICAgIGNhcmRTcGFjaW5nOiBjLmxheW91dC5jbGlwYm9hcmQuY2FyZFNwYWNpbmcsXG4gICAgICAgICAgICBtYXhWaXNpYmxlQ2FyZHM6IGMubGF5b3V0LmNsaXBib2FyZC5tYXhWaXNpYmxlQ2FyZHMsXG4gICAgICAgICAgICBwcmV2aWV3TGluZXM6IGMubGF5b3V0LmNsaXBib2FyZC5wcmV2aWV3TGluZXMsXG4gICAgICAgIH0pKTtcblxuICAgICAgICB0aGlzLmdsYXNzID0gY29uZmlnLmFzKGMgPT4gKHtcbiAgICAgICAgICAgIGJsdXI6IGMuYXBwZWFyYW5jZS5nbGFzcy5ibHVyLFxuICAgICAgICAgICAgc3VyZmFjZU9wYWNpdHk6IGMuYXBwZWFyYW5jZS5nbGFzcy5zdXJmYWNlT3BhY2l0eSxcbiAgICAgICAgICAgIGJvcmRlck9wYWNpdHk6IGMuYXBwZWFyYW5jZS5nbGFzcy5ib3JkZXJPcGFjaXR5LFxuICAgICAgICAgICAgc2F0dXJhdGlvbjogYy5hcHBlYXJhbmNlLmdsYXNzLnNhdHVyYXRpb24sXG4gICAgICAgIH0pKTtcblxuICAgICAgICB0aGlzLmNvbG9ycyA9IGNvbmZpZy5hcyhjID0+ICh7XG4gICAgICAgICAgICBwcmltYXJ5OiBjLmFwcGVhcmFuY2UuY29sb3JzLnByaW1hcnksXG4gICAgICAgICAgICBzdXJmYWNlOiBjLmFwcGVhcmFuY2UuY29sb3JzLnN1cmZhY2UsXG4gICAgICAgICAgICBzdXJmYWNlRGFya2VyOiBjLmFwcGVhcmFuY2UuY29sb3JzLnN1cmZhY2VEYXJrZXIsXG4gICAgICAgICAgICB0ZXh0OiBjLmFwcGVhcmFuY2UuY29sb3JzLnRleHQsXG4gICAgICAgICAgICBib3JkZXI6IGMuYXBwZWFyYW5jZS5jb2xvcnMuYm9yZGVyLFxuICAgICAgICAgICAgYWNjZW50OiBjLmFwcGVhcmFuY2UuY29sb3JzLmFjY2VudCxcbiAgICAgICAgfSkpO1xuXG4gICAgICAgIHRoaXMuZWxldmF0aW9uID0gY29uZmlnLmFzKGMgPT4gKHtcbiAgICAgICAgICAgIGxhdW5jaGVyOiBjLmFwcGVhcmFuY2UuZWxldmF0aW9uPy5sYXVuY2hlciA/PyAxLFxuICAgICAgICAgICAgY2xpcGJvYXJkOiBjLmFwcGVhcmFuY2UuZWxldmF0aW9uPy5jbGlwYm9hcmQgPz8gMCxcbiAgICAgICAgfSkpO1xuXG4gICAgICAgIHRoaXMuYW5pbWF0aW9uID0gY29uZmlnLmFzKGMgPT4gKHtcbiAgICAgICAgICAgIHVpRHVyYXRpb246IGMuYW5pbWF0aW9uLnVpRHVyYXRpb24sXG4gICAgICAgICAgICB3aW5kb3dEdXJhdGlvbjogYy5hbmltYXRpb24ud2luZG93RHVyYXRpb24sXG4gICAgICAgICAgICBjdXJ2ZTogYy5hbmltYXRpb24uY3VydmUsXG4gICAgICAgIH0pKTtcblxuICAgICAgICAvLyAtLS0gV2lkZ2V0IEJpbmRpbmdzIChJbXBsZW1lbnRhdGlvbikgLS0tXG4gICAgICAgIC8vIFdvcmtzcGFjZSBTY2FsZSBzdHJpY3RseSBmcm9tIGNvbmZpZ1xuICAgICAgICBjb25zdCB3b3Jrc3BhY2VTY2FsZSA9IGNvbmZpZy5hcyhjID0+IGMubGF5b3V0LmJhci53b3Jrc3BhY2VTY2FsZSk7XG5cbiAgICAgICAgLy8gQmFyLVJlbGF0aXZlIFVuaXQgKEJVKSBzdHJpY3RseSBmb3IgQmFyIGNvbnRlbnRzXG4gICAgICAgIGNvbnN0IEJVID0gYmluZChWYXJpYWJsZS5kZXJpdmUoW3RoaXMuYmFySGVpZ2h0LCB3b3Jrc3BhY2VTY2FsZV0sIChoOiBudW1iZXIsIHM6IG51bWJlcikgPT4gTWF0aC5mbG9vcihoICogcykpKTtcbiAgICAgICAgdGhpcy53b3Jrc3BhY2VJY29uU2l6ZSA9IEJVO1xuICAgICAgICB0aGlzLndvcmtzcGFjZVBhZGRpbmcgPSBCVTtcblxuICAgICAgICB0aGlzLndvcmtzcGFjZUZvbnRTaXplID0gYmluZChWYXJpYWJsZS5kZXJpdmUoW0JVLCB0aGlzLmZvbnRSYXRpbywgdGhpcy5taW5Gb250U2l6ZV0sIChidTogbnVtYmVyLCBmcjogbnVtYmVyLCBtaW46IG51bWJlcikgPT5cbiAgICAgICAgICAgIE1hdGgubWF4KE1hdGguZmxvb3IoYnUgKiBmciksIG1pbilcbiAgICAgICAgKSk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFAoeCksIFJhZGl1cyh4KSwgRm9udFNpemUoeCkgYXJlIEJBTk5FRC5cbiAgICAgICAgICogVXNlIENTUyBWYXJpYWJsZXMgaW5qZWN0ZWQgYnkgQ3NzSW5qZWN0aW9uU2VydmljZS5cbiAgICAgICAgICovXG5cblxuXG4gICAgICAgIC8vIC0tLSBSdWxlIFNldCBHYW1tYSAoTGF1bmNoZXIpIC0tLVxuICAgICAgICB0aGlzLmxhdW5jaGVyR2VvbWV0cnkgPSBiaW5kKFZhcmlhYmxlLmRlcml2ZShbdGhpcy5sYXVuY2hlciwgdGhpcy5VLCB0aGlzLmZvbnRSYXRpbywgdGhpcy5taW5Gb250U2l6ZV0sIChsOiBMYXVuY2hlckNvbmZpZywgdTogbnVtYmVyLCBmcjogbnVtYmVyLCBtaW5Gb250OiBudW1iZXIpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IFAgPSAoeDogbnVtYmVyKSA9PiBNYXRoLmZsb29yKHUgKiB4KTtcbiAgICAgICAgICAgIGNvbnN0IEZvbnRTaXplID0gKGg6IG51bWJlcikgPT4gTWF0aC5tYXgoTWF0aC5mbG9vcihoICogZnIpLCBtaW5Gb250KTtcblxuICAgICAgICAgICAgY29uc3Qgc2VhcmNoQmFySGVpZ2h0ID0gRm9udFNpemUobC5oZWlnaHQgKiAwLjEyKSArIFAobC5zZWFyY2hCYXJQYWRkaW5nICogMik7XG4gICAgICAgICAgICBjb25zdCBtYWluV2lkdGggPSBsLndpZHRoIC0gbC5zaWRlYmFyV2lkdGg7XG5cbiAgICAgICAgICAgIC8vIEdyaWQgSXRlbSBXaWR0aDogKE1haW5XIC0gUGFkICogKENvbHMrMSkpIC8gQ29sc1xuICAgICAgICAgICAgY29uc3QgdG90YWxIUGFkID0gUChsLmFwcENhcmRQYWRkaW5nKSAqIChsLmdyaWRDb2x1bW5zICsgMSk7XG4gICAgICAgICAgICBjb25zdCBncmlkSXRlbVdpZHRoID0gTWF0aC5mbG9vcigobWFpbldpZHRoIC0gdG90YWxIUGFkKSAvIGwuZ3JpZENvbHVtbnMpO1xuXG4gICAgICAgICAgICAvLyBHcmlkIEl0ZW0gSGVpZ2h0OiAoTWFpbkggLSBTZWFyY2ggLSBQYWQgKiAoUm93cysxKSkgLyBSb3dzXG4gICAgICAgICAgICBjb25zdCBtYWluSGVpZ2h0ID0gbC5oZWlnaHQ7XG4gICAgICAgICAgICBjb25zdCBhdmFpbGFibGVIZWlnaHQgPSBtYWluSGVpZ2h0IC0gc2VhcmNoQmFySGVpZ2h0O1xuICAgICAgICAgICAgY29uc3QgdG90YWxWUGFkID0gUChsLmFwcENhcmRQYWRkaW5nKSAqIChsLmdyaWRSb3dzICsgMSk7XG4gICAgICAgICAgICBjb25zdCBncmlkSXRlbUhlaWdodCA9IE1hdGguZmxvb3IoKGF2YWlsYWJsZUhlaWdodCAtIHRvdGFsVlBhZCkgLyBsLmdyaWRSb3dzKTtcblxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBtYWluV2lkdGgsXG4gICAgICAgICAgICAgICAgc2lkZWJhcldpZHRoOiBsLnNpZGViYXJXaWR0aCxcbiAgICAgICAgICAgICAgICBzZWFyY2hCYXJIZWlnaHQsXG4gICAgICAgICAgICAgICAgZ3JpZEl0ZW1XaWR0aCxcbiAgICAgICAgICAgICAgICBncmlkSXRlbUhlaWdodFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSkpO1xuXG4gICAgICAgIC8vIC0tLSBSdWxlIFNldCBEZWx0YSAoQ2xpcGJvYXJkKSAtLS1cbiAgICAgICAgdGhpcy5jbGlwYm9hcmRHZW9tZXRyeSA9IHRoaXMuY2xpcGJvYXJkLmFzKGMgPT4gKHtcbiAgICAgICAgICAgIHZpc2libGVXaWR0aDogMTkyMCAqIGMud2lkdGhSYXRpbyxcbiAgICAgICAgICAgIGNhcmRJbWFnZVNpemU6IE1hdGguZmxvb3IoYy5jYXJkSGVpZ2h0ICogYy5pbWFnZVByZXZpZXdTaXplKSxcbiAgICAgICAgICAgIGNhcmRXaWR0aDogYy5jYXJkV2lkdGgsXG4gICAgICAgICAgICBjYXJkSGVpZ2h0OiBjLmNhcmRIZWlnaHRcbiAgICAgICAgfSkpO1xuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgTGF5b3V0U2VydmljZTtcbiIsICJpbXBvcnQgQXN0YWxXcCBmcm9tIFwiZ2k6Ly9Bc3RhbFdwP3ZlcnNpb249MC4xXCJcbmltcG9ydCB7IGJpbmQgfSBmcm9tIFwiYXN0YWxcIlxuaW1wb3J0IExheW91dFNlcnZpY2UgZnJvbSBcIi4uL3NyYy9MYXlvdXRTZXJ2aWNlXCJcbmltcG9ydCB7IEd0ayB9IGZyb20gXCJhc3RhbC9ndGszXCJcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gQXVkaW8oKSB7XG4gIGNvbnN0IHdwID0gQXN0YWxXcC5nZXRfZGVmYXVsdCgpXG4gIGNvbnN0IHNwZWFrZXIgPSB3cD8uYXVkaW8/LmRlZmF1bHRTcGVha2VyXG4gIGNvbnN0IGxheW91dCA9IExheW91dFNlcnZpY2UuZ2V0X2RlZmF1bHQoKVxuXG4gIC8vIFVzZSBDU1MgVmFyaWFibGUgZm9yIGZvbnQgc2l6ZVxuICAvLyBGb250IHNpemUgbm93IGhhbmRsZWQgYnkgQ3NzSW5qZWN0aW9uU2VydmljZSB2aWEgLldpZGdldFBpbGwgbGFiZWwgc2VsZWN0b3JcblxuICByZXR1cm4gPGJveCBjbGFzc05hbWU9XCJXaWRnZXRQaWxsXCIgdmFsaWduPXtHdGsuQWxpZ24uRklMTH0+XG4gICAge3NwZWFrZXIgPyAoXG4gICAgICA8ZXZlbnRib3hcbiAgICAgICAgb25TY3JvbGw9eyhfLCBldmVudCkgPT4ge1xuICAgICAgICAgIGlmIChldmVudC5kZWx0YV95IDwgMCkgc3BlYWtlci52b2x1bWUgPSBNYXRoLm1pbigxLCBzcGVha2VyLnZvbHVtZSArIDAuMDUpXG4gICAgICAgICAgZWxzZSBzcGVha2VyLnZvbHVtZSA9IE1hdGgubWF4KDAsIHNwZWFrZXIudm9sdW1lIC0gMC4wNSlcbiAgICAgICAgfX1cbiAgICAgICAgb25DbGljaz17KF8sIGV2ZW50KSA9PiB7IGlmIChldmVudC5idXR0b24gPT09IDEpIHNwZWFrZXIubXV0ZSA9ICFzcGVha2VyLm11dGUgfX1cbiAgICAgID5cbiAgICAgICAgPGJveCBjbGFzc05hbWU9XCJBdWRpb0NvbnRlbnQgZ2FwLTFcIiB2YWxpZ249e0d0ay5BbGlnbi5DRU5URVJ9PlxuICAgICAgICAgIDxpY29uIGljb249e2JpbmQoc3BlYWtlciwgXCJ2b2x1bWVJY29uXCIpfSAvPlxuICAgICAgICAgIDxsYWJlbCBsYWJlbD17YmluZChzcGVha2VyLCBcInZvbHVtZVwiKS5hcyh2ID0+IGAke01hdGguZmxvb3IodiAqIDEwMCl9JWApfSAvPlxuICAgICAgICA8L2JveD5cbiAgICAgIDwvZXZlbnRib3g+XG4gICAgKSA6IChcbiAgICAgIDxpY29uIGljb249XCJhdWRpby12b2x1bWUtbXV0ZWQtc3ltYm9saWNcIiAvPlxuICAgICl9XG4gIDwvYm94PlxufVxuIiwgImltcG9ydCBHdGsgZnJvbSBcImdpOi8vR3RrP3ZlcnNpb249My4wXCJcbmltcG9ydCB7IHR5cGUgQmluZGFibGVDaGlsZCB9IGZyb20gXCIuL2FzdGFsaWZ5LmpzXCJcbmltcG9ydCB7IG1lcmdlQmluZGluZ3MsIGpzeCBhcyBfanN4IH0gZnJvbSBcIi4uL19hc3RhbC5qc1wiXG5pbXBvcnQgKiBhcyBXaWRnZXQgZnJvbSBcIi4vd2lkZ2V0LmpzXCJcblxuZXhwb3J0IGZ1bmN0aW9uIEZyYWdtZW50KHsgY2hpbGRyZW4gPSBbXSwgY2hpbGQgfToge1xuICAgIGNoaWxkPzogQmluZGFibGVDaGlsZFxuICAgIGNoaWxkcmVuPzogQXJyYXk8QmluZGFibGVDaGlsZD5cbn0pIHtcbiAgICBpZiAoY2hpbGQpIGNoaWxkcmVuLnB1c2goY2hpbGQpXG4gICAgcmV0dXJuIG1lcmdlQmluZGluZ3MoY2hpbGRyZW4pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBqc3goXG4gICAgY3Rvcjoga2V5b2YgdHlwZW9mIGN0b3JzIHwgdHlwZW9mIEd0ay5XaWRnZXQsXG4gICAgcHJvcHM6IGFueSxcbikge1xuICAgIHJldHVybiBfanN4KGN0b3JzLCBjdG9yIGFzIGFueSwgcHJvcHMpXG59XG5cbmNvbnN0IGN0b3JzID0ge1xuICAgIGJveDogV2lkZ2V0LkJveCxcbiAgICBidXR0b246IFdpZGdldC5CdXR0b24sXG4gICAgY2VudGVyYm94OiBXaWRnZXQuQ2VudGVyQm94LFxuICAgIGNpcmN1bGFycHJvZ3Jlc3M6IFdpZGdldC5DaXJjdWxhclByb2dyZXNzLFxuICAgIGRyYXdpbmdhcmVhOiBXaWRnZXQuRHJhd2luZ0FyZWEsXG4gICAgZW50cnk6IFdpZGdldC5FbnRyeSxcbiAgICBldmVudGJveDogV2lkZ2V0LkV2ZW50Qm94LFxuICAgIC8vIFRPRE86IGZpeGVkXG4gICAgLy8gVE9ETzogZmxvd2JveFxuICAgIGljb246IFdpZGdldC5JY29uLFxuICAgIGxhYmVsOiBXaWRnZXQuTGFiZWwsXG4gICAgbGV2ZWxiYXI6IFdpZGdldC5MZXZlbEJhcixcbiAgICAvLyBUT0RPOiBsaXN0Ym94XG4gICAgbWVudWJ1dHRvbjogV2lkZ2V0Lk1lbnVCdXR0b24sXG4gICAgb3ZlcmxheTogV2lkZ2V0Lk92ZXJsYXksXG4gICAgcmV2ZWFsZXI6IFdpZGdldC5SZXZlYWxlcixcbiAgICBzY3JvbGxhYmxlOiBXaWRnZXQuU2Nyb2xsYWJsZSxcbiAgICBzbGlkZXI6IFdpZGdldC5TbGlkZXIsXG4gICAgc3RhY2s6IFdpZGdldC5TdGFjayxcbiAgICBzd2l0Y2g6IFdpZGdldC5Td2l0Y2gsXG4gICAgd2luZG93OiBXaWRnZXQuV2luZG93LFxufVxuXG5kZWNsYXJlIGdsb2JhbCB7XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1uYW1lc3BhY2VcbiAgICBuYW1lc3BhY2UgSlNYIHtcbiAgICAgICAgdHlwZSBFbGVtZW50ID0gR3RrLldpZGdldFxuICAgICAgICB0eXBlIEVsZW1lbnRDbGFzcyA9IEd0ay5XaWRnZXRcbiAgICAgICAgaW50ZXJmYWNlIEludHJpbnNpY0VsZW1lbnRzIHtcbiAgICAgICAgICAgIGJveDogV2lkZ2V0LkJveFByb3BzXG4gICAgICAgICAgICBidXR0b246IFdpZGdldC5CdXR0b25Qcm9wc1xuICAgICAgICAgICAgY2VudGVyYm94OiBXaWRnZXQuQ2VudGVyQm94UHJvcHNcbiAgICAgICAgICAgIGNpcmN1bGFycHJvZ3Jlc3M6IFdpZGdldC5DaXJjdWxhclByb2dyZXNzUHJvcHNcbiAgICAgICAgICAgIGRyYXdpbmdhcmVhOiBXaWRnZXQuRHJhd2luZ0FyZWFQcm9wc1xuICAgICAgICAgICAgZW50cnk6IFdpZGdldC5FbnRyeVByb3BzXG4gICAgICAgICAgICBldmVudGJveDogV2lkZ2V0LkV2ZW50Qm94UHJvcHNcbiAgICAgICAgICAgIC8vIFRPRE86IGZpeGVkXG4gICAgICAgICAgICAvLyBUT0RPOiBmbG93Ym94XG4gICAgICAgICAgICBpY29uOiBXaWRnZXQuSWNvblByb3BzXG4gICAgICAgICAgICBsYWJlbDogV2lkZ2V0LkxhYmVsUHJvcHNcbiAgICAgICAgICAgIGxldmVsYmFyOiBXaWRnZXQuTGV2ZWxCYXJQcm9wc1xuICAgICAgICAgICAgLy8gVE9ETzogbGlzdGJveFxuICAgICAgICAgICAgbWVudWJ1dHRvbjogV2lkZ2V0Lk1lbnVCdXR0b25Qcm9wc1xuICAgICAgICAgICAgb3ZlcmxheTogV2lkZ2V0Lk92ZXJsYXlQcm9wc1xuICAgICAgICAgICAgcmV2ZWFsZXI6IFdpZGdldC5SZXZlYWxlclByb3BzXG4gICAgICAgICAgICBzY3JvbGxhYmxlOiBXaWRnZXQuU2Nyb2xsYWJsZVByb3BzXG4gICAgICAgICAgICBzbGlkZXI6IFdpZGdldC5TbGlkZXJQcm9wc1xuICAgICAgICAgICAgc3RhY2s6IFdpZGdldC5TdGFja1Byb3BzXG4gICAgICAgICAgICBzd2l0Y2g6IFdpZGdldC5Td2l0Y2hQcm9wc1xuICAgICAgICAgICAgd2luZG93OiBXaWRnZXQuV2luZG93UHJvcHNcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0IGNvbnN0IGpzeHMgPSBqc3hcbiIsICJpbXBvcnQgeyBBcHAsIEd0ayB9IGZyb20gXCJhc3RhbC9ndGszXCI7XG5pbXBvcnQgTGF5b3V0U2VydmljZSBmcm9tIFwiLi4vc3JjL0xheW91dFNlcnZpY2VcIjtcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gRGFzaGJvYXJkQnV0dG9uKCkge1xuICAgIGNvbnN0IGxheW91dCA9IExheW91dFNlcnZpY2UuZ2V0X2RlZmF1bHQoKTtcbiAgICAvLyBHVEszIGNhbid0IHVzZSB2YXIoKSBpbiBpbmxpbmUgY3NzIC0gdXNlIExheW91dFNlcnZpY2UgYmluZGluZ1xuICAgIGNvbnN0IGljb25Dc3MgPSBsYXlvdXQuYmFySGVpZ2h0LmFzKGggPT4gYGZvbnQtc2l6ZTogJHtNYXRoLmZsb29yKGggKiAwLjcpfXB4O2ApO1xuXG4gICAgcmV0dXJuIDxidXR0b25cbiAgICAgICAgY2xhc3NOYW1lPVwiRGFzaGJvYXJkSWNvblwiXG4gICAgICAgIG9uQ2xpY2tlZD17KCkgPT4gQXBwLnRvZ2dsZV93aW5kb3coXCJkYXNoYm9hcmRcIil9XG4gICAgICAgIHZhbGlnbj17R3RrLkFsaWduLkNFTlRFUn1cbiAgICA+XG4gICAgICAgIDxpY29uIGljb249XCJ2aWV3LWFwcC1ncmlkLXN5bWJvbGljXCIgY3NzPXtpY29uQ3NzfSAvPlxuICAgIDwvYnV0dG9uPlxufVxuIiwgImltcG9ydCB7IEdMaWIsIFZhcmlhYmxlLCBiaW5kIH0gZnJvbSBcImFzdGFsXCJcbmltcG9ydCBMYXlvdXRTZXJ2aWNlIGZyb20gXCIuLi9zcmMvTGF5b3V0U2VydmljZVwiO1xuaW1wb3J0IENvbmZpZ0FkYXB0ZXIgZnJvbSBcIi4uL3NyYy9Db25maWdBZGFwdGVyXCI7XG5pbXBvcnQgeyBHdGsgfSBmcm9tIFwiYXN0YWwvZ3RrM1wiO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBEYXRlVGltZSgpIHtcbiAgY29uc3QgbGF5b3V0ID0gTGF5b3V0U2VydmljZS5nZXRfZGVmYXVsdCgpO1xuICAvLyBHZXQgZm9ybWF0IGZyb20gcHJvcGVyIGNvbmZpZyBwYXRoXG4gIGNvbnN0IGZvcm1hdCA9IENvbmZpZ0FkYXB0ZXIuZ2V0KCkudmFsdWUud2lkZ2V0cz8uY2xvY2s/LmZvcm1hdCA/PyBcIiVIOiVNXCI7XG5cbiAgLy8gVGltZSB2YXJpYWJsZVxuICBjb25zdCB0aW1lID0gVmFyaWFibGU8c3RyaW5nPihcIlwiKS5wb2xsKDEwMDAsICgpID0+IHtcbiAgICByZXR1cm4gR0xpYi5EYXRlVGltZS5uZXdfbm93X2xvY2FsKCkuZm9ybWF0KGZvcm1hdCkhO1xuICB9KTtcblxuICByZXR1cm4gKFxuICAgIDxib3hcbiAgICAgIGNsYXNzTmFtZT1cIldpZGdldFBpbGwgYWNjZW50IERhdGVUaW1lUGlsbFwiXG4gICAgICB2YWxpZ249e0d0ay5BbGlnbi5GSUxMfVxuICAgID5cbiAgICAgIDxsYWJlbFxuICAgICAgICBjbGFzc05hbWU9XCJEYXRlVGltZVwiXG4gICAgICAgIG9uRGVzdHJveT17KCkgPT4gdGltZS5kcm9wKCl9XG4gICAgICAgIGxhYmVsPXt0aW1lKCl9XG4gICAgICAvPlxuICAgIDwvYm94PlxuICApO1xufVxuIiwgIi8qKlxuICogTWVkaWFTZXJ2aWNlLnRzXG4gKiBcbiAqIFY1IENvbXBsaWFudCBNZWRpYSBTZXJ2aWNlXG4gKiAtIFByaW9yaXR5LWJhc2VkIHBsYXllciBzZWxlY3Rpb24gKHN0cmVhbWluZyA+IGJyb3dzZXJzKVxuICogLSBJZGxlIHRpbWVvdXQgd2l0aCBkZW1vdGlvblxuICogLSBNZW1vcnktc2FmZSBiaW5kaW5nc1xuICovXG5cbmltcG9ydCBBc3RhbE1wcmlzIGZyb20gXCJnaTovL0FzdGFsTXByaXNcIjtcbmltcG9ydCB7IFZhcmlhYmxlLCBHTGliLCBiaW5kIH0gZnJvbSBcImFzdGFsXCI7XG5cbi8vIFByaW9yaXR5IHBhdHRlcm5zIC0gaGlnaGVyIGluZGV4ID0gbG93ZXIgcHJpb3JpdHlcbmNvbnN0IFBSSU9SSVRZX1BBVFRFUk5TOiBSZWdFeHBbXSA9IFtcbiAgICAvZGVlemVyL2ksXG4gICAgL3Nwb3RpZnkvaSxcbiAgICAvdGlkYWwvaSxcbiAgICAveW91dHViZS4qbXVzaWMvaSxcbiAgICAvdml2YWxkaXxmaXJlZm94fGNocm9tZXxjaHJvbWl1bS9pLFxuXTtcblxuY29uc3QgSURMRV9USU1FT1VUX01TID0gMzAwMDA7IC8vIDMwIHNlY29uZHNcblxuaW50ZXJmYWNlIFBsYXllclN0YXRlIHtcbiAgICBwbGF5ZXI6IEFzdGFsTXByaXMuUGxheWVyO1xuICAgIHByaW9yaXR5OiBudW1iZXI7XG4gICAgaWRsZVRpbWVySWQ6IG51bWJlciB8IG51bGw7XG4gICAgbGFzdFBsYXlpbmc6IG51bWJlcjsgLy8gdGltZXN0YW1wXG59XG5cbmNsYXNzIE1lZGlhU2VydmljZSB7XG4gICAgcHJpdmF0ZSBzdGF0aWMgaW5zdGFuY2U6IE1lZGlhU2VydmljZTtcbiAgICBwcml2YXRlIG1wcmlzOiBBc3RhbE1wcmlzLk1wcmlzO1xuICAgIHByaXZhdGUgcGxheWVyU3RhdGVzOiBNYXA8c3RyaW5nLCBQbGF5ZXJTdGF0ZT4gPSBuZXcgTWFwKCk7XG5cbiAgICAvLyBQdWJsaWMgcmVhY3RpdmUgc3RhdGVcbiAgICByZWFkb25seSBhY3RpdmVQbGF5ZXIgPSBWYXJpYWJsZTxBc3RhbE1wcmlzLlBsYXllciB8IG51bGw+KG51bGwpO1xuICAgIHJlYWRvbmx5IGlzUGxheWluZyA9IFZhcmlhYmxlPGJvb2xlYW4+KGZhbHNlKTtcbiAgICByZWFkb25seSB0aXRsZSA9IFZhcmlhYmxlPHN0cmluZz4oXCJcIik7XG4gICAgcmVhZG9ubHkgYXJ0aXN0ID0gVmFyaWFibGU8c3RyaW5nPihcIlwiKTtcbiAgICByZWFkb25seSBjb3ZlckFydCA9IFZhcmlhYmxlPHN0cmluZz4oXCJcIik7XG4gICAgcmVhZG9ubHkgcG9zaXRpb24gPSBWYXJpYWJsZTxudW1iZXI+KDApO1xuICAgIHJlYWRvbmx5IGxlbmd0aCA9IFZhcmlhYmxlPG51bWJlcj4oMCk7XG5cbiAgICBwcml2YXRlIHBvc2l0aW9uUG9sbElkOiBudW1iZXIgfCBudWxsID0gbnVsbDtcblxuICAgIHN0YXRpYyBnZXRfZGVmYXVsdCgpOiBNZWRpYVNlcnZpY2Uge1xuICAgICAgICBpZiAoIXRoaXMuaW5zdGFuY2UpIHtcbiAgICAgICAgICAgIHRoaXMuaW5zdGFuY2UgPSBuZXcgTWVkaWFTZXJ2aWNlKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuaW5zdGFuY2U7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5tcHJpcyA9IEFzdGFsTXByaXMuZ2V0X2RlZmF1bHQoKTtcbiAgICAgICAgdGhpcy5pbml0KCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBpbml0KCkge1xuICAgICAgICAvLyBTdWJzY3JpYmUgdG8gcGxheWVyIGxpc3QgY2hhbmdlc1xuICAgICAgICB0aGlzLm1wcmlzLmNvbm5lY3QoXCJub3RpZnk6OnBsYXllcnNcIiwgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVQbGF5ZXJzKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIEluaXRpYWwgdXBkYXRlXG4gICAgICAgIHRoaXMudXBkYXRlUGxheWVycygpO1xuXG4gICAgICAgIC8vIFN0YXJ0IHBvc2l0aW9uIHBvbGxpbmdcbiAgICAgICAgdGhpcy5zdGFydFBvc2l0aW9uUG9sbCgpO1xuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0U2NvcmUocGxheWVyOiBBc3RhbE1wcmlzLlBsYXllcik6IG51bWJlciB7XG4gICAgICAgIGNvbnN0IGlkZW50aXR5ID0gcGxheWVyLmlkZW50aXR5Py50b0xvd2VyQ2FzZSgpIHx8IFwiXCI7XG4gICAgICAgIGNvbnN0IGJ1c05hbWUgPSBwbGF5ZXIuYnVzTmFtZT8udG9Mb3dlckNhc2UoKSB8fCBcIlwiO1xuICAgICAgICBjb25zdCBzZWFyY2hTdHIgPSBgJHtpZGVudGl0eX0gJHtidXNOYW1lfWA7XG5cbiAgICAgICAgbGV0IGJhc2VTY29yZSA9IDA7XG5cbiAgICAgICAgLy8gQmFzZSBzY29yZSBmcm9tIHByaW9yaXR5IHBhdHRlcm5zIChoaWdoZXIgaW5kZXggPSBsb3dlciBwcmlvcml0eSBpbiBhcnJheSwgc28gd2UgaW52ZXJ0KVxuICAgICAgICAvLyBMZXQncyB1c2Ugc3BlY2lmaWMgd2VpZ2h0czpcbiAgICAgICAgLy8gRGVlemVyL1Nwb3RpZnkgPSAxMDBcbiAgICAgICAgLy8gVGlkYWwgPSA4MFxuICAgICAgICAvLyBZVCBNdXNpYyA9IDcwXG4gICAgICAgIC8vIEJyb3dzZXJzID0gMTBcblxuICAgICAgICBpZiAoL2RlZXplcnxzcG90aWZ5L2kudGVzdChzZWFyY2hTdHIpKSBiYXNlU2NvcmUgPSAxMDA7XG4gICAgICAgIGVsc2UgaWYgKC90aWRhbC9pLnRlc3Qoc2VhcmNoU3RyKSkgYmFzZVNjb3JlID0gODA7XG4gICAgICAgIGVsc2UgaWYgKC95b3V0dWJlLiptdXNpYy9pLnRlc3Qoc2VhcmNoU3RyKSkgYmFzZVNjb3JlID0gNzA7XG4gICAgICAgIGVsc2UgaWYgKC92aXZhbGRpfGZpcmVmb3h8Y2hyb21lfGNocm9taXVtL2kudGVzdChzZWFyY2hTdHIpKSBiYXNlU2NvcmUgPSAxMDtcbiAgICAgICAgZWxzZSBiYXNlU2NvcmUgPSA1MDsgLy8gVW5rbm93biBwbGF5ZXJzIGdldCBtZWRpdW0gcHJpb3JpdHlcblxuICAgICAgICAvLyBCb251cyBmb3IgcGxheWluZyBzdGF0dXNcbiAgICAgICAgaWYgKHBsYXllci5wbGF5YmFja1N0YXR1cyA9PT0gQXN0YWxNcHJpcy5QbGF5YmFja1N0YXR1cy5QTEFZSU5HKSB7XG4gICAgICAgICAgICBiYXNlU2NvcmUgKz0gMTAwO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGJhc2VTY29yZTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHVwZGF0ZVBsYXllcnMoKSB7XG4gICAgICAgIGNvbnN0IHBsYXllcnMgPSB0aGlzLm1wcmlzLnBsYXllcnM7XG4gICAgICAgIGNvbnN0IGN1cnJlbnRJZHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICAgICAgICAvLyBVcGRhdGUgb3IgYWRkIHBsYXllcnNcbiAgICAgICAgZm9yIChjb25zdCBwbGF5ZXIgb2YgcGxheWVycykge1xuICAgICAgICAgICAgY29uc3QgaWQgPSBwbGF5ZXIuYnVzTmFtZTtcbiAgICAgICAgICAgIGN1cnJlbnRJZHMuYWRkKGlkKTtcblxuICAgICAgICAgICAgaWYgKCF0aGlzLnBsYXllclN0YXRlcy5oYXMoaWQpKSB7XG4gICAgICAgICAgICAgICAgLy8gTmV3IHBsYXllclxuICAgICAgICAgICAgICAgIGNvbnN0IHN0YXRlOiBQbGF5ZXJTdGF0ZSA9IHtcbiAgICAgICAgICAgICAgICAgICAgcGxheWVyLFxuICAgICAgICAgICAgICAgICAgICBwcmlvcml0eTogdGhpcy5nZXRTY29yZShwbGF5ZXIpLFxuICAgICAgICAgICAgICAgICAgICBpZGxlVGltZXJJZDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgbGFzdFBsYXlpbmc6IERhdGUubm93KCksXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB0aGlzLnBsYXllclN0YXRlcy5zZXQoaWQsIHN0YXRlKTtcblxuICAgICAgICAgICAgICAgIC8vIFdhdGNoIHBsYXliYWNrIHN0YXR1c1xuICAgICAgICAgICAgICAgIHBsYXllci5jb25uZWN0KFwibm90aWZ5OjpwbGF5YmFjay1zdGF0dXNcIiwgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9uUGxheWJhY2tTdGF0dXNDaGFuZ2VkKGlkKTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIC8vIFdhdGNoIG1ldGFkYXRhIGNoYW5nZXNcbiAgICAgICAgICAgICAgICBwbGF5ZXIuY29ubmVjdChcIm5vdGlmeTo6dGl0bGVcIiwgKCkgPT4gdGhpcy51cGRhdGVBY3RpdmVQbGF5ZXJEYXRhKCkpO1xuICAgICAgICAgICAgICAgIHBsYXllci5jb25uZWN0KFwibm90aWZ5OjphcnRpc3RcIiwgKCkgPT4gdGhpcy51cGRhdGVBY3RpdmVQbGF5ZXJEYXRhKCkpO1xuICAgICAgICAgICAgICAgIHBsYXllci5jb25uZWN0KFwibm90aWZ5Ojpjb3Zlci1hcnRcIiwgKCkgPT4gdGhpcy51cGRhdGVBY3RpdmVQbGF5ZXJEYXRhKCkpO1xuICAgICAgICAgICAgICAgIHBsYXllci5jb25uZWN0KFwibm90aWZ5OjpsZW5ndGhcIiwgKCkgPT4gdGhpcy51cGRhdGVBY3RpdmVQbGF5ZXJEYXRhKCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmVtb3ZlIHN0YWxlIHBsYXllcnNcbiAgICAgICAgZm9yIChjb25zdCBbaWQsIHN0YXRlXSBvZiB0aGlzLnBsYXllclN0YXRlcykge1xuICAgICAgICAgICAgaWYgKCFjdXJyZW50SWRzLmhhcyhpZCkpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3RhdGUuaWRsZVRpbWVySWQpIHtcbiAgICAgICAgICAgICAgICAgICAgR0xpYi5zb3VyY2VfcmVtb3ZlKHN0YXRlLmlkbGVUaW1lcklkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5wbGF5ZXJTdGF0ZXMuZGVsZXRlKGlkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc2VsZWN0QmVzdFBsYXllcigpO1xuICAgIH1cblxuICAgIHByaXZhdGUgb25QbGF5YmFja1N0YXR1c0NoYW5nZWQocGxheWVySWQ6IHN0cmluZykge1xuICAgICAgICBjb25zdCBzdGF0ZSA9IHRoaXMucGxheWVyU3RhdGVzLmdldChwbGF5ZXJJZCk7XG4gICAgICAgIGlmICghc3RhdGUpIHJldHVybjtcblxuICAgICAgICBjb25zdCBpc1BsYXlpbmcgPSBzdGF0ZS5wbGF5ZXIucGxheWJhY2tTdGF0dXMgPT09IEFzdGFsTXByaXMuUGxheWJhY2tTdGF0dXMuUExBWUlORztcblxuICAgICAgICAvLyBVcGRhdGUgcHJpb3JpdHkgc2NvcmUgYmFzZWQgb24gbmV3IHN0YXR1c1xuICAgICAgICBzdGF0ZS5wcmlvcml0eSA9IHRoaXMuZ2V0U2NvcmUoc3RhdGUucGxheWVyKTtcblxuICAgICAgICBpZiAoaXNQbGF5aW5nKSB7XG4gICAgICAgICAgICAvLyBDYW5jZWwgaWRsZSB0aW1lclxuICAgICAgICAgICAgaWYgKHN0YXRlLmlkbGVUaW1lcklkKSB7XG4gICAgICAgICAgICAgICAgR0xpYi5zb3VyY2VfcmVtb3ZlKHN0YXRlLmlkbGVUaW1lcklkKTtcbiAgICAgICAgICAgICAgICBzdGF0ZS5pZGxlVGltZXJJZCA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzdGF0ZS5sYXN0UGxheWluZyA9IERhdGUubm93KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBTdGFydCBpZGxlIHRpbWVyXG4gICAgICAgICAgICBpZiAoIXN0YXRlLmlkbGVUaW1lcklkKSB7XG4gICAgICAgICAgICAgICAgc3RhdGUuaWRsZVRpbWVySWQgPSBHTGliLnRpbWVvdXRfYWRkKEdMaWIuUFJJT1JJVFlfREVGQVVMVCwgSURMRV9USU1FT1VUX01TLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXRlLmlkbGVUaW1lcklkID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZWxlY3RCZXN0UGxheWVyKCk7IC8vIFJlLWV2YWx1YXRlIGFmdGVyIHRpbWVvdXRcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEdMaWIuU09VUkNFX1JFTU9WRTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc2VsZWN0QmVzdFBsYXllcigpO1xuICAgIH1cblxuICAgIHByaXZhdGUgc2VsZWN0QmVzdFBsYXllcigpIHtcbiAgICAgICAgbGV0IGJlc3RQbGF5ZXI6IEFzdGFsTXByaXMuUGxheWVyIHwgbnVsbCA9IG51bGw7XG4gICAgICAgIGxldCBiZXN0U2NvcmUgPSAtMTtcblxuICAgICAgICBmb3IgKGNvbnN0IFtpZCwgc3RhdGVdIG9mIHRoaXMucGxheWVyU3RhdGVzKSB7XG4gICAgICAgICAgICBjb25zdCBpc1BsYXlpbmcgPSBzdGF0ZS5wbGF5ZXIucGxheWJhY2tTdGF0dXMgPT09IEFzdGFsTXByaXMuUGxheWJhY2tTdGF0dXMuUExBWUlORztcbiAgICAgICAgICAgIGNvbnN0IGlzSWRsZSA9ICFpc1BsYXlpbmcgJiYgKERhdGUubm93KCkgLSBzdGF0ZS5sYXN0UGxheWluZyA+IElETEVfVElNRU9VVF9NUyk7XG5cbiAgICAgICAgICAgIC8vIFNraXAgaWRsZSBwbGF5ZXJzXG4gICAgICAgICAgICBpZiAoaXNJZGxlKSBjb250aW51ZTtcblxuICAgICAgICAgICAgLy8gQ2hlY2sgZHluYW1pYyBzY29yZVxuICAgICAgICAgICAgaWYgKHN0YXRlLnByaW9yaXR5ID4gYmVzdFNjb3JlKSB7XG4gICAgICAgICAgICAgICAgYmVzdFNjb3JlID0gc3RhdGUucHJpb3JpdHk7XG4gICAgICAgICAgICAgICAgYmVzdFBsYXllciA9IHN0YXRlLnBsYXllcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE9ubHkgdXBkYXRlIGlmIGNoYW5nZWQgKG9wdGltaXphdGlvbilcbiAgICAgICAgaWYgKHRoaXMuYWN0aXZlUGxheWVyLmdldCgpICE9PSBiZXN0UGxheWVyKSB7XG4gICAgICAgICAgICB0aGlzLmFjdGl2ZVBsYXllci5zZXQoYmVzdFBsYXllcik7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUFjdGl2ZVBsYXllckRhdGEoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIEp1c3QgdXBkYXRlIGRhdGEgaWYgc2FtZSBwbGF5ZXJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQWN0aXZlUGxheWVyRGF0YSgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSB1cGRhdGVBY3RpdmVQbGF5ZXJEYXRhKCkge1xuICAgICAgICBjb25zdCBwbGF5ZXIgPSB0aGlzLmFjdGl2ZVBsYXllci5nZXQoKTtcblxuICAgICAgICBpZiAocGxheWVyKSB7XG4gICAgICAgICAgICB0aGlzLmlzUGxheWluZy5zZXQocGxheWVyLnBsYXliYWNrU3RhdHVzID09PSBBc3RhbE1wcmlzLlBsYXliYWNrU3RhdHVzLlBMQVlJTkcpO1xuXG4gICAgICAgICAgICAvLyBEZWJ1ZzogTG9nIHdoYXQgd2UncmUgZ2V0dGluZ1xuICAgICAgICAgICAgY29uc29sZS5sb2coYFtNZWRpYVNlcnZpY2VdIFBsYXllcjogJHtwbGF5ZXIuaWRlbnRpdHl9LCBUaXRsZTogJHtwbGF5ZXIudGl0bGV9LCBBcnRpc3Q6ICR7cGxheWVyLmFydGlzdH1gKTtcblxuICAgICAgICAgICAgLy8gVGl0bGUgaXMgYSBzdHJpbmdcbiAgICAgICAgICAgIGNvbnN0IHRpdGxlU3RyID0gdHlwZW9mIHBsYXllci50aXRsZSA9PT0gJ3N0cmluZycgPyBwbGF5ZXIudGl0bGUgOiBTdHJpbmcocGxheWVyLnRpdGxlIHx8IFwiVW5rbm93blwiKTtcbiAgICAgICAgICAgIHRoaXMudGl0bGUuc2V0KHRpdGxlU3RyIHx8IFwiVW5rbm93blwiKTtcblxuICAgICAgICAgICAgLy8gQXJ0aXN0IG1pZ2h0IGJlIGFycmF5IG9yIHN0cmluZ1xuICAgICAgICAgICAgbGV0IGFydGlzdFN0cjogc3RyaW5nO1xuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkocGxheWVyLmFydGlzdCkpIHtcbiAgICAgICAgICAgICAgICBhcnRpc3RTdHIgPSBwbGF5ZXIuYXJ0aXN0LmpvaW4oXCIsIFwiKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHBsYXllci5hcnRpc3QgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgYXJ0aXN0U3RyID0gcGxheWVyLmFydGlzdDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYXJ0aXN0U3RyID0gU3RyaW5nKHBsYXllci5hcnRpc3QgfHwgXCJVbmtub3duXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5hcnRpc3Quc2V0KGFydGlzdFN0ciB8fCBcIlVua25vd25cIik7XG5cbiAgICAgICAgICAgIHRoaXMuY292ZXJBcnQuc2V0KHBsYXllci5jb3ZlckFydCB8fCBcIlwiKTtcbiAgICAgICAgICAgIHRoaXMubGVuZ3RoLnNldChwbGF5ZXIubGVuZ3RoIHx8IDApO1xuICAgICAgICAgICAgdGhpcy5wb3NpdGlvbi5zZXQocGxheWVyLnBvc2l0aW9uIHx8IDApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5pc1BsYXlpbmcuc2V0KGZhbHNlKTtcbiAgICAgICAgICAgIHRoaXMudGl0bGUuc2V0KFwiXCIpO1xuICAgICAgICAgICAgdGhpcy5hcnRpc3Quc2V0KFwiXCIpO1xuICAgICAgICAgICAgdGhpcy5jb3ZlckFydC5zZXQoXCJcIik7XG4gICAgICAgICAgICB0aGlzLmxlbmd0aC5zZXQoMCk7XG4gICAgICAgICAgICB0aGlzLnBvc2l0aW9uLnNldCgwKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgc3RhcnRQb3NpdGlvblBvbGwoKSB7XG4gICAgICAgIHRoaXMucG9zaXRpb25Qb2xsSWQgPSBHTGliLnRpbWVvdXRfYWRkKEdMaWIuUFJJT1JJVFlfREVGQVVMVCwgMTAwMCwgKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcGxheWVyID0gdGhpcy5hY3RpdmVQbGF5ZXIuZ2V0KCk7XG4gICAgICAgICAgICBpZiAocGxheWVyICYmIHBsYXllci5wbGF5YmFja1N0YXR1cyA9PT0gQXN0YWxNcHJpcy5QbGF5YmFja1N0YXR1cy5QTEFZSU5HKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wb3NpdGlvbi5zZXQocGxheWVyLnBvc2l0aW9uIHx8IDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIEdMaWIuU09VUkNFX0NPTlRJTlVFO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBQdWJsaWMgbWV0aG9kcyBmb3IgY29udHJvbFxuICAgIHRvZ2dsZVBsYXlQYXVzZSgpIHtcbiAgICAgICAgY29uc3QgcGxheWVyID0gdGhpcy5hY3RpdmVQbGF5ZXIuZ2V0KCk7XG4gICAgICAgIGlmIChwbGF5ZXIpIHtcbiAgICAgICAgICAgIHBsYXllci5wbGF5X3BhdXNlKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBuZXh0KCkge1xuICAgICAgICBjb25zdCBwbGF5ZXIgPSB0aGlzLmFjdGl2ZVBsYXllci5nZXQoKTtcbiAgICAgICAgaWYgKHBsYXllcikge1xuICAgICAgICAgICAgcGxheWVyLm5leHQoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByZXZpb3VzKCkge1xuICAgICAgICBjb25zdCBwbGF5ZXIgPSB0aGlzLmFjdGl2ZVBsYXllci5nZXQoKTtcbiAgICAgICAgaWYgKHBsYXllcikge1xuICAgICAgICAgICAgcGxheWVyLnByZXZpb3VzKCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IE1lZGlhU2VydmljZTtcbiIsICIvKipcbiAqIE1lZGlhUHJvLnRzeFxuICogXG4gKiBWNSBDb21wbGlhbnQgTWVkaWEgV2lkZ2V0XG4gKiAtIFVzZXMgTWVkaWFTZXJ2aWNlIGZvciBwcmlvcml0eSBwbGF5ZXIgc2VsZWN0aW9uXG4gKiAtIFNpbmdsZSBpbnN0YW5jZSAobm8gY3JlYXRlL2Rlc3Ryb3kgY3ljbGVzKVxuICogLSBNZW1vcnktc2FmZSB3aXRoIG9uRGVzdHJveSBjbGVhbnVwXG4gKi9cblxuaW1wb3J0IHsgYmluZCB9IGZyb20gXCJhc3RhbFwiO1xuaW1wb3J0IHsgR3RrIH0gZnJvbSBcImFzdGFsL2d0azNcIjtcbmltcG9ydCBNZWRpYVNlcnZpY2UgZnJvbSBcIi4uL3NyYy9zZXJ2aWNlcy9NZWRpYVNlcnZpY2VcIjtcbmltcG9ydCBTYWZlV2lkZ2V0IGZyb20gXCIuLi9zcmMvY29tcG9uZW50cy9TYWZlV2lkZ2V0XCI7XG5pbXBvcnQgQ29uZmlnQWRhcHRlciBmcm9tIFwiLi4vc3JjL0NvbmZpZ0FkYXB0ZXJcIjtcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gTWVkaWFQcm8oKSB7XG4gICAgY29uc3QgbWVkaWEgPSBNZWRpYVNlcnZpY2UuZ2V0X2RlZmF1bHQoKTtcblxuICAgIC8vIFN0YXRpYyBjb25maWcgYWNjZXNzIGZvciBsaW1pdHMgYW5kIGdlb21ldHJ5XG4gICAgY29uc3QgY29uZmlnID0gQ29uZmlnQWRhcHRlci5nZXQoKS52YWx1ZTtcbiAgICBjb25zdCB0aXRsZUxpbWl0ID0gY29uZmlnLmxpbWl0cz8ubWVkaWFUaXRsZSA/PyAyNTtcbiAgICBjb25zdCBhcnRpc3RMaW1pdCA9IGNvbmZpZy5saW1pdHM/Lm1lZGlhQXJ0aXN0ID8/IDE1O1xuXG4gICAgLy8gR2VvbWV0cnkgbWF0aCAoTWF0aC1pbi1UUylcbiAgICAvLyBNdXN0IG1hdGNoIENzc0luamVjdGlvblNlcnZpY2U6IE1hdGguZmxvb3IoYy5sYXlvdXQuYmFySGVpZ2h0ICogMC45KVxuICAgIGNvbnN0IGFydFNpemUgPSBNYXRoLmZsb29yKGNvbmZpZy5sYXlvdXQuYmFySGVpZ2h0ICogMC45KTtcblxuICAgIC8vIFJlYWN0aXZlIGJpbmRpbmdzXG4gICAgY29uc3QgaGFzUGxheWVyID0gYmluZChtZWRpYS5hY3RpdmVQbGF5ZXIpLmFzKHAgPT4gcCAhPT0gbnVsbCk7XG4gICAgY29uc3QgdGl0bGUgPSBiaW5kKG1lZGlhLnRpdGxlKS5hcyh0ID0+IFN0cmluZyh0IHx8IFwiVW5rbm93blwiKSk7XG4gICAgY29uc3QgYXJ0aXN0ID0gYmluZChtZWRpYS5hcnRpc3QpLmFzKGEgPT4gU3RyaW5nKGEgfHwgXCJVbmtub3duXCIpKTtcbiAgICBjb25zdCBjb3ZlckFydCA9IGJpbmQobWVkaWEuY292ZXJBcnQpO1xuICAgIGNvbnN0IGlzUGxheWluZyA9IGJpbmQobWVkaWEuaXNQbGF5aW5nKTtcblxuICAgIHJldHVybiAoXG4gICAgICAgIDxib3hcbiAgICAgICAgICAgIGNsYXNzTmFtZT1cIk1lZGlhUHJvUGlsbFwiXG4gICAgICAgICAgICB2aXNpYmxlPXtoYXNQbGF5ZXJ9XG4gICAgICAgICAgICB2YWxpZ249e0d0ay5BbGlnbi5GSUxMfVxuICAgICAgICA+XG4gICAgICAgICAgICA8ZXZlbnRib3hcbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBtZWRpYS50b2dnbGVQbGF5UGF1c2UoKX1cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8Ym94IGNsYXNzTmFtZT1cIk1lZGlhUHJvQ29udGVudFwiIHZhbGlnbj17R3RrLkFsaWduLkNFTlRFUn0gc3BhY2luZz17OH0+XG4gICAgICAgICAgICAgICAgICAgIHsvKiBBbGJ1bSBBcnQgQ2lyY2xlIHdpdGggUHJvZ3Jlc3MgUmluZyAqL31cbiAgICAgICAgICAgICAgICAgICAgPG92ZXJsYXk+XG4gICAgICAgICAgICAgICAgICAgICAgICA8Ym94XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiQXJ0Q2lyY2xlXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aFJlcXVlc3Q9e2FydFNpemV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0UmVxdWVzdD17YXJ0U2l6ZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYWxpZ249e0d0ay5BbGlnbi5DRU5URVJ9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsaWduPXtHdGsuQWxpZ24uQ0VOVEVSfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNzcz17Y292ZXJBcnQuYXMoYXJ0ID0+IGFydFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IGBiYWNrZ3JvdW5kLWltYWdlOiB1cmwoJyR7YXJ0fScpO2BcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBcIlwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7LyogRmFsbGJhY2sgaWNvbiB3aGVuIG5vIGFydCAqL31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aWNvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpY29uPXtpc1BsYXlpbmcuYXMocCA9PiBwID8gXCJtZWRpYS1wbGF5YmFjay1wYXVzZS1zeW1ib2xpY1wiIDogXCJtZWRpYS1wbGF5YmFjay1zdGFydC1zeW1ib2xpY1wiKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmlzaWJsZT17Y292ZXJBcnQuYXMoYXJ0ID0+ICFhcnQpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2JveD5cblxuICAgICAgICAgICAgICAgICAgICAgICAgPGRyYXdpbmdhcmVhXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGhSZXF1ZXN0PXthcnRTaXplfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodFJlcXVlc3Q9e2FydFNpemV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFsaWduPXtHdGsuQWxpZ24uQ0VOVEVSfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbGlnbj17R3RrLkFsaWduLkNFTlRFUn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXR1cD17KHNlbGYpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUmVkcmF3IHdoZW4gcG9zaXRpb24gb3IgbGVuZ3RoIGNoYW5nZXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5ob29rKG1lZGlhLnBvc2l0aW9uLCAoKSA9PiBzZWxmLnF1ZXVlX2RyYXcoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuaG9vayhtZWRpYS5sZW5ndGgsICgpID0+IHNlbGYucXVldWVfZHJhdygpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uRHJhdz17KHNlbGYsIGNyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHcgPSBhcnRTaXplOyAvLyBVc2Ugc3RyaWN0IGFydFNpemUsIG5vdCBhbGxvY2F0ZWQgd2lkdGhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaCA9IGFydFNpemU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNlbnRlcl94ID0gdyAvIDI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNlbnRlcl95ID0gaCAvIDI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGxpbmVXaWR0aCA9IDI7IC8vIFRoaW5uZXIgYXMgcmVxdWVzdGVkICh3YXMgMylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUHJlY2lzZSByYWRpdXM6IChTaXplIC8gMikgLSAoTGluZVdpZHRoIC8gMilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGhpcyBwbGFjZXMgdGhlIGNlbnRlciBvZiB0aGUgc3Ryb2tlIGV4YWN0bHkgb24gdGhlIHRoZW9yZXRpY2FsIGNpcmNsZSB0aGF0IGZpdHMgdGhlIGJveFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBtaW51cyBoYWxmIHRoZSBzdHJva2Ugd2lkdGgsIHNvIHRoZSBvdXRlciBlZGdlIG9mIHRoZSBzdHJva2UgdG91Y2hlcyB0aGUgYm94IGVkZ2UuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJhZGl1cyA9IChNYXRoLm1pbih3LCBoKSAvIDIpIC0gKGxpbmVXaWR0aCAvIDIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGxlbiA9IG1lZGlhLmxlbmd0aC5nZXQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcG9zID0gbWVkaWEucG9zaXRpb24uZ2V0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHBlcmNlbnQgPSBsZW4gPiAwID8gcG9zIC8gbGVuIDogMDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBQYXJzZSBhY2NlbnQgY29sb3IgZnJvbSBjb25maWdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYWNjZW50SGV4ID0gY29uZmlnLmFwcGVhcmFuY2UuY29sb3JzLmFjY2VudDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgciA9IHBhcnNlSW50KGFjY2VudEhleC5zbGljZSgxLCAzKSwgMTYpIC8gMjU1O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBnID0gcGFyc2VJbnQoYWNjZW50SGV4LnNsaWNlKDMsIDUpLCAxNikgLyAyNTU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGIgPSBwYXJzZUludChhY2NlbnRIZXguc2xpY2UoNSwgNyksIDE2KSAvIDI1NTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBEcmF3IEJhY2tncm91bmQgUmluZyAoZmFpbnQsIHVuZGVyIGFjdGl2ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Iuc2V0U291cmNlUkdCQSgxLCAxLCAxLCAwLjEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjci5zZXRMaW5lV2lkdGgobGluZVdpZHRoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3IuYXJjKGNlbnRlcl94LCBjZW50ZXJfeSwgcmFkaXVzLCAwLCAyICogTWF0aC5QSSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNyLnN0cm9rZSgpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIERyYXcgUHJvZ3Jlc3MgQXJjXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwZXJjZW50ID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Iuc2V0U291cmNlUkdCQShyLCBnLCBiLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNyLnNldExpbmVXaWR0aChsaW5lV2lkdGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU3RhcnQgZnJvbSB0b3AgKC05MCBkZWcgb3IgLVBJLzIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzdGFydEFuZ2xlID0gLU1hdGguUEkgLyAyO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZW5kQW5nbGUgPSBzdGFydEFuZ2xlICsgKHBlcmNlbnQgKiAyICogTWF0aC5QSSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjci5hcmMoY2VudGVyX3gsIGNlbnRlcl95LCByYWRpdXMsIHN0YXJ0QW5nbGUsIGVuZEFuZ2xlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNyLnN0cm9rZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgIDwvb3ZlcmxheT5cblxuICAgICAgICAgICAgICAgICAgICB7LyogVHJhY2sgSW5mbyAqL31cbiAgICAgICAgICAgICAgICAgICAgPGJveCBjbGFzc05hbWU9XCJUcmFja0luZm9cIiB2YWxpZ249e0d0ay5BbGlnbi5DRU5URVJ9PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGxhYmVsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiVHJhY2tUaXRsZVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw9e3RpdGxlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRydW5jYXRlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF4V2lkdGhDaGFycz17dGl0bGVMaW1pdH1cbiAgICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICA8bGFiZWwgbGFiZWw9XCIgLSBcIiBjc3M9XCJjb2xvcjogYWxwaGEoQHRleHQsIDAuNSk7XCIgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxsYWJlbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIlRyYWNrQXJ0aXN0XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbD17YXJ0aXN0fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRydW5jYXRlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF4V2lkdGhDaGFycz17YXJ0aXN0TGltaXR9XG4gICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICA8L2JveD5cbiAgICAgICAgICAgICAgICA8L2JveD5cbiAgICAgICAgICAgIDwvZXZlbnRib3g+XG4gICAgICAgIDwvYm94PlxuICAgICk7XG59XG4iLCAiaW1wb3J0IHsgcmVnaXN0ZXIsIHByb3BlcnR5IH0gZnJvbSBcImFzdGFsL2dvYmplY3RcIlxuaW1wb3J0IHsgR0xpYiwgR09iamVjdCB9IGZyb20gXCJhc3RhbFwiXG5pbXBvcnQgeyByZWFkRmlsZSB9IGZyb20gXCJhc3RhbC9maWxlXCJcbmltcG9ydCB7IGludGVydmFsIH0gZnJvbSBcImFzdGFsXCJcblxudHlwZSBNZW1vcnlVc2FnZSA9IHsgcGVyY2VudGFnZTogbnVtYmVyLCB0b3RhbDogbnVtYmVyLCB1c2VkOiBudW1iZXIsIGZyZWU6IG51bWJlciwgYXZhaWxhYmxlOiBudW1iZXIgfVxudHlwZSBDcHVUaW1lID0geyB0b3RhbDogbnVtYmVyLCBpZGxlOiBudW1iZXIgfVxuXG5AcmVnaXN0ZXIoeyBHVHlwZU5hbWU6IFwiVXNhZ2VcIiB9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVXNhZ2UgZXh0ZW5kcyBHT2JqZWN0Lk9iamVjdCB7XG4gIHN0YXRpYyBpbnN0YW5jZTogVXNhZ2VcbiAgc3RhdGljIGdldF9kZWZhdWx0KCkge1xuICAgIGlmICghdGhpcy5pbnN0YW5jZSkgdGhpcy5pbnN0YW5jZSA9IG5ldyBVc2FnZSgpXG4gICAgcmV0dXJuIHRoaXMuaW5zdGFuY2VcbiAgfVxuXG4gIEBwcm9wZXJ0eShOdW1iZXIpIGdldCBjcHVVc2FnZSgpIHsgcmV0dXJuIHRoaXMuI2NwdVVzYWdlIH1cbiAgQHByb3BlcnR5KE9iamVjdCkgZ2V0IG1lbW9yeSgpIHsgcmV0dXJuIHRoaXMuI21lbW9yeSB9XG4gIEBwcm9wZXJ0eShOdW1iZXIpIGdldCB0ZW1wZXJhdHVyZSgpIHsgcmV0dXJuIHRoaXMuI3RlbXBlcmF0dXJlIH1cblxuICAjY3B1VXNhZ2UgPSAwXG4gICNtZW1vcnk6IE1lbW9yeVVzYWdlID0geyBwZXJjZW50YWdlOiAwLCB0b3RhbDogMCwgdXNlZDogMCwgZnJlZTogMCwgYXZhaWxhYmxlOiAwIH1cbiAgI3RlbXBlcmF0dXJlID0gMFxuICAjY3B1U3RhdHMgPSB7IHRvdGFsOiAwLCBpZGxlOiAwIH1cblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpXG4gICAgdGhpcy4jY3B1U3RhdHMgPSB0aGlzLmdldENQVVVzYWdlKClcbiAgICB0aGlzLiNtZW1vcnkgPSB0aGlzLmdldE1lbW9yeVVzYWdlKClcblxuICAgIGludGVydmFsKDIwMDAsICgpID0+IHtcbiAgICAgIGNvbnN0IHVzYWdlID0gdGhpcy5nZXRDUFVVc2FnZSgpXG4gICAgICBjb25zdCBkdG90YWwgPSB1c2FnZS50b3RhbCAtIHRoaXMuI2NwdVN0YXRzLnRvdGFsXG4gICAgICBjb25zdCBkaWRsZSA9IHVzYWdlLmlkbGUgLSB0aGlzLiNjcHVTdGF0cy5pZGxlXG4gICAgICB0aGlzLiNjcHVVc2FnZSA9IGR0b3RhbCA9PT0gMCA/IDAgOiAoZHRvdGFsIC0gZGlkbGUpIC8gZHRvdGFsXG4gICAgICB0aGlzLiNjcHVTdGF0cyA9IHVzYWdlXG4gICAgICB0aGlzLm5vdGlmeSgnY3B1LXVzYWdlJylcblxuICAgICAgdGhpcy4jdGVtcGVyYXR1cmUgPSB0aGlzLmdldFRlbXAoKTtcbiAgICAgIHRoaXMubm90aWZ5KCd0ZW1wZXJhdHVyZScpO1xuICAgIH0pXG5cbiAgICBpbnRlcnZhbCg1MDAwLCAoKSA9PiB7XG4gICAgICB0aGlzLiNtZW1vcnkgPSB0aGlzLmdldE1lbW9yeVVzYWdlKClcbiAgICAgIHRoaXMubm90aWZ5KCdtZW1vcnknKVxuICAgIH0pXG4gIH1cblxuICBwcml2YXRlIGdldENQVVVzYWdlKCk6IENwdVRpbWUge1xuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHN0YXQgPSByZWFkRmlsZSgnL3Byb2Mvc3RhdCcpXG4gICAgICAgIGNvbnN0IGxpbmUgPSBzdGF0LnNwbGl0KCdcXG4nKVswXVxuICAgICAgICBjb25zdCB0aW1lcyA9IGxpbmUucmVwbGFjZSgvY3B1XFxzKy8sICcnKS5zcGxpdCgnICcpLm1hcChOdW1iZXIpXG4gICAgICAgIGNvbnN0IGlkbGUgPSB0aW1lc1szXSArIHRpbWVzWzRdXG4gICAgICAgIGNvbnN0IHRvdGFsID0gdGltZXMucmVkdWNlKChhLCBiKSA9PiBhICsgYiwgMClcbiAgICAgICAgcmV0dXJuIHsgdG90YWwsIGlkbGUgfVxuICAgIH0gY2F0Y2ggKGUpIHsgcmV0dXJuIHsgdG90YWw6IDAsIGlkbGU6IDAgfSB9XG4gIH1cblxuICBwcml2YXRlIGdldE1lbW9yeVVzYWdlKCk6IE1lbW9yeVVzYWdlIHtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCBtZW1pbmZvID0gcmVhZEZpbGUoJy9wcm9jL21lbWluZm8nKVxuICAgICAgICBjb25zdCBsaW5lcyA9IG1lbWluZm8uc3BsaXQoXCJcXG5cIilcbiAgICAgICAgY29uc3QgZ2V0VmFsID0gKGtleTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBsaW5lID0gbGluZXMuZmluZChsID0+IGwuc3RhcnRzV2l0aChrZXkpKVxuICAgICAgICAgICAgaWYgKCFsaW5lKSByZXR1cm4gMFxuICAgICAgICAgICAgcmV0dXJuIHBhcnNlSW50KGxpbmUuc3BsaXQoL1xccysvKVsxXSkgKiAxMDI0XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdG90YWwgPSBnZXRWYWwoXCJNZW1Ub3RhbDpcIilcbiAgICAgICAgY29uc3QgYXZhaWxhYmxlID0gZ2V0VmFsKFwiTWVtQXZhaWxhYmxlOlwiKVxuICAgICAgICBjb25zdCB1c2VkID0gdG90YWwgLSBhdmFpbGFibGVcbiAgICAgICAgcmV0dXJuIHsgcGVyY2VudGFnZTogdG90YWwgPyAodXNlZCAvIHRvdGFsKSA6IDAsIHRvdGFsLCB1c2VkLCBmcmVlOiAwLCBhdmFpbGFibGU6IDAgfVxuICAgIH0gY2F0Y2ggKGUpIHsgcmV0dXJuIHsgcGVyY2VudGFnZTogMCwgdG90YWw6IDAsIHVzZWQ6IDAsIGZyZWU6IDAsIGF2YWlsYWJsZTogMCB9IH1cbiAgfVxuXG4gIC8vIEhPVFNQT1QgSFVOVEVSOiBGaW5kcyB0aGUgbWF4IENQVSB0ZW1wXG4gIHByaXZhdGUgZ2V0VGVtcCgpOiBudW1iZXIge1xuICAgICAgY29uc3QgYmFzZVBhdGhzID0gWycvc3lzL2NsYXNzL2h3bW9uJywgJy9zeXMvY2xhc3MvdGhlcm1hbCddO1xuICAgICAgbGV0IG1heFRlbXAgPSAwO1xuICAgICAgbGV0IGZvdW5kSGlnaFByaW9yaXR5ID0gZmFsc2U7XG5cbiAgICAgIC8vIEhlbHBlciB0byByZWFkIGEgbnVtYmVyIGZyb20gYSBmaWxlXG4gICAgICBjb25zdCByZWFkTnVtID0gKHBhdGg6IHN0cmluZykgPT4ge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGNvbnN0IFtvaywgZGF0YV0gPSBHTGliLmZpbGVfZ2V0X2NvbnRlbnRzKHBhdGgpO1xuICAgICAgICAgICAgICBpZiAob2spIHJldHVybiBwYXJzZUludChuZXcgVGV4dERlY29kZXIoKS5kZWNvZGUoZGF0YSkudHJpbSgpKSAvIDEwMDA7XG4gICAgICAgICAgfSBjYXRjaChlKSB7fVxuICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgIH1cblxuICAgICAgLy8gMS4gU2NhbiBIV01PTiAoQmVzdCBmb3IgQ1BVIFBhY2thZ2VzKVxuICAgICAgY29uc3QgaHdtb25EaXIgPSBHTGliLkRpci5vcGVuKCcvc3lzL2NsYXNzL2h3bW9uJywgMCk7XG4gICAgICBpZiAoaHdtb25EaXIpIHtcbiAgICAgICAgICBsZXQgbmFtZTogc3RyaW5nIHwgbnVsbDtcbiAgICAgICAgICB3aGlsZSAoKG5hbWUgPSBod21vbkRpci5yZWFkX25hbWUoKSkgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgY29uc3QgcGF0aCA9IGAvc3lzL2NsYXNzL2h3bW9uLyR7bmFtZX1gO1xuICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgLy8gSXRlcmF0ZSBwb3NzaWJsZSBpbnB1dHMgKHRlbXAxIHRvIHRlbXAxMClcbiAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gMTA7IGkrKykge1xuICAgICAgICAgICAgICAgICAgY29uc3QgbGFiZWxQYXRoID0gYCR7cGF0aH0vdGVtcCR7aX1fbGFiZWxgO1xuICAgICAgICAgICAgICAgICAgY29uc3QgaW5wdXRQYXRoID0gYCR7cGF0aH0vdGVtcCR7aX1faW5wdXRgO1xuICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICBpZiAoIUdMaWIuZmlsZV90ZXN0KGlucHV0UGF0aCwgR0xpYi5GaWxlVGVzdC5FWElTVFMpKSBjb250aW51ZTtcblxuICAgICAgICAgICAgICAgICAgLy8gQ2hlY2sgZm9yIEhpZ2ggUHJpb3JpdHkgTGFiZWxzIChBTUQgVGN0bC9UZGllLCBJbnRlbCBQYWNrYWdlKVxuICAgICAgICAgICAgICAgICAgaWYgKEdMaWIuZmlsZV90ZXN0KGxhYmVsUGF0aCwgR0xpYi5GaWxlVGVzdC5FWElTVFMpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgY29uc3QgW29rLCBsYWJlbERhdGFdID0gR0xpYi5maWxlX2dldF9jb250ZW50cyhsYWJlbFBhdGgpO1xuICAgICAgICAgICAgICAgICAgICAgIGlmIChvaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBsYWJlbCA9IG5ldyBUZXh0RGVjb2RlcigpLmRlY29kZShsYWJlbERhdGEpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsYWJlbC5pbmNsdWRlcygndGN0bCcpIHx8IGxhYmVsLmluY2x1ZGVzKCd0ZGllJykgfHwgbGFiZWwuaW5jbHVkZXMoJ3BhY2thZ2UnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdCA9IHJlYWROdW0oaW5wdXRQYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0ID4gMCkgcmV0dXJuIHQ7IC8vIFJldHVybiBpbW1lZGlhdGVseSBpZiB3ZSBmb3VuZCB0aGUgZXhhY3QgcGFja2FnZSBzZW5zb3JcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgLy8gS2VlcCB0cmFjayBvZiB0aGUgaGlnaGVzdCB0ZW1wIGZvdW5kIGFzIGEgZmFsbGJhY2tcbiAgICAgICAgICAgICAgICAgIGNvbnN0IHQgPSByZWFkTnVtKGlucHV0UGF0aCk7XG4gICAgICAgICAgICAgICAgICBpZiAodCA+IG1heFRlbXApIG1heFRlbXAgPSB0O1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGh3bW9uRGlyLmNsb3NlKCk7XG4gICAgICB9XG5cbiAgICAgIC8vIDIuIFNjYW4gVGhlcm1hbCBab25lcyAoRmFsbGJhY2spXG4gICAgICBpZiAobWF4VGVtcCA9PT0gMCkge1xuICAgICAgICAgIGNvbnN0IHRoZXJtYWxEaXIgPSBHTGliLkRpci5vcGVuKCcvc3lzL2NsYXNzL3RoZXJtYWwnLCAwKTtcbiAgICAgICAgICBpZiAodGhlcm1hbERpcikge1xuICAgICAgICAgICAgICBsZXQgbmFtZTogc3RyaW5nIHwgbnVsbDtcbiAgICAgICAgICAgICAgd2hpbGUgKChuYW1lID0gdGhlcm1hbERpci5yZWFkX25hbWUoKSkgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgIGlmIChuYW1lLnN0YXJ0c1dpdGgoJ3RoZXJtYWxfem9uZScpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgY29uc3QgdCA9IHJlYWROdW0oYC9zeXMvY2xhc3MvdGhlcm1hbC8ke25hbWV9L3RlbXBgKTtcbiAgICAgICAgICAgICAgICAgICAgICBpZiAodCA+IG1heFRlbXApIG1heFRlbXAgPSB0O1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHRoZXJtYWxEaXIuY2xvc2UoKTtcbiAgICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBtYXhUZW1wO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgYmluZCB9IGZyb20gXCJhc3RhbFwiXG5pbXBvcnQgVXNhZ2UgZnJvbSBcIi4uL3NyYy9zZXJ2aWNlcy91c2FnZVwiXG5pbXBvcnQgTGF5b3V0U2VydmljZSBmcm9tIFwiLi4vc3JjL0xheW91dFNlcnZpY2VcIlxuaW1wb3J0IHsgR3RrIH0gZnJvbSBcImFzdGFsL2d0azNcIlxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBSZXNvdXJjZVVzYWdlKCkge1xuICAgY29uc3QgdXNhZ2UgPSBVc2FnZS5nZXRfZGVmYXVsdCgpXG4gICBjb25zdCBsYXlvdXQgPSBMYXlvdXRTZXJ2aWNlLmdldF9kZWZhdWx0KClcblxuICAgLy8gRm9udCBzaXplIG5vdyBoYW5kbGVkIGJ5IENzc0luamVjdGlvblNlcnZpY2UgdmlhIC5XaWRnZXRQaWxsIGxhYmVsIHNlbGVjdG9yXG5cbiAgIGNvbnN0IGNwdUNsYXNzID0gYmluZCh1c2FnZSwgXCJjcHVVc2FnZVwiKS5hcyh2ID0+IHYgPiAwLjggPyBcInVyZ2VudFwiIDogXCJhY2NlbnRcIik7XG4gICBjb25zdCB0ZW1wQ2xhc3MgPSBiaW5kKHVzYWdlLCBcInRlbXBlcmF0dXJlXCIpLmFzKHQgPT4gdCA+IDgwID8gXCJ1cmdlbnRcIiA6IFwiYWNjZW50XCIpO1xuICAgY29uc3QgbWVtQ2xhc3MgPSBiaW5kKHVzYWdlLCBcIm1lbW9yeVwiKS5hcyhtID0+IChtLnVzZWQgLyBtLnRvdGFsKSA+IDAuOCA/IFwidXJnZW50XCIgOiBcImFjY2VudFwiKTtcblxuICAgcmV0dXJuIChcbiAgICAgIDxib3ggY2xhc3NOYW1lPVwiV2lkZ2V0UGlsbCBSZXNvdXJjZVVzYWdlIGdhcC0xXCIgdmFsaWduPXtHdGsuQWxpZ24uRklMTH0+XG4gICAgICAgICA8Ym94IGNsYXNzTmFtZT1cIkNwdSBnYXAtaGFsZlwiPlxuICAgICAgICAgICAgPGljb24gaWNvbj1cImNvbXB1dGVyLXN5bWJvbGljXCIgLz5cbiAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9e2NwdUNsYXNzfSBsYWJlbD17YmluZCh1c2FnZSwgXCJjcHVVc2FnZVwiKS5hcyh2ID0+IGAke01hdGguZmxvb3IodiAqIDEwMCl9JWApfSAvPlxuICAgICAgICAgPC9ib3g+XG4gICAgICAgICA8Ym94IGNsYXNzTmFtZT1cIlRlbXAgZ2FwLWhhbGZcIj5cbiAgICAgICAgICAgIDxpY29uIGljb249XCJ0ZW1wZXJhdHVyZS1zeW1ib2xpY1wiIC8+XG4gICAgICAgICAgICA8bGFiZWxcbiAgICAgICAgICAgICAgIGNsYXNzTmFtZT17dGVtcENsYXNzfVxuICAgICAgICAgICAgICAgbGFiZWw9e2JpbmQodXNhZ2UsIFwidGVtcGVyYXR1cmVcIikuYXModCA9PiBgJHtNYXRoLnJvdW5kKHQpfVx1MDBCMGApfVxuICAgICAgICAgICAgLz5cbiAgICAgICAgIDwvYm94PlxuICAgICAgICAgPGJveCBjbGFzc05hbWU9XCJNZW0gZ2FwLWhhbGZcIj5cbiAgICAgICAgICAgIDxpY29uIGljb249XCJkcml2ZS1oYXJkZGlzay1zeW1ib2xpY1wiIC8+XG4gICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPXttZW1DbGFzc30gbGFiZWw9e2JpbmQodXNhZ2UsIFwibWVtb3J5XCIpLmFzKG0gPT4gYCR7KG0udXNlZCAvIDEwNzM3NDE4MjQpLnRvRml4ZWQoMSl9R2ApfSAvPlxuICAgICAgICAgPC9ib3g+XG4gICAgICA8L2JveD5cbiAgIClcbn1cbiIsICJpbXBvcnQgQXN0YWxUcmF5IGZyb20gXCJnaTovL0FzdGFsVHJheT92ZXJzaW9uPTAuMVwiO1xuaW1wb3J0IHsgYmluZCwgVmFyaWFibGUsIEdMaWIgfSBmcm9tIFwiYXN0YWxcIjtcbmltcG9ydCBMYXlvdXRTZXJ2aWNlIGZyb20gXCIuLi9zcmMvTGF5b3V0U2VydmljZVwiXG5pbXBvcnQgeyBHdGsgfSBmcm9tIFwiYXN0YWwvZ3RrM1wiXG5pbXBvcnQgVGhlbWVkSWNvbiBmcm9tIFwiLi4vc3JjL2NvbXBvbmVudHMvVGhlbWVkSWNvblwiXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIFRyYXkoKSB7XG4gICAgY29uc3QgdHJheSA9IEFzdGFsVHJheS5nZXRfZGVmYXVsdCgpXG4gICAgY29uc3QgbGF5b3V0ID0gTGF5b3V0U2VydmljZS5nZXRfZGVmYXVsdCgpXG5cbiAgICBjb25zdCByZXZlYWxlZCA9IFZhcmlhYmxlKGZhbHNlKTtcbiAgICBsZXQgdGltZW91dElkOiBudW1iZXIgfCBudWxsID0gbnVsbDtcblxuICAgIC8vIERlcml2ZSBDU1MgZnJvbSBMYXlvdXRTZXJ2aWNlXG4gICAgY29uc3QgaWNvbkNzcyA9IGxheW91dC53b3Jrc3BhY2VJY29uU2l6ZS5hcyhzaXplID0+IGBmb250LXNpemU6ICR7c2l6ZX1weDtgKTtcblxuICAgIGNvbnN0IGNhbmNlbFRpbWVvdXQgPSAoKSA9PiB7XG4gICAgICAgIGlmICh0aW1lb3V0SWQpIHtcbiAgICAgICAgICAgIEdMaWIuc291cmNlX3JlbW92ZSh0aW1lb3V0SWQpO1xuICAgICAgICAgICAgdGltZW91dElkID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBjb25zdCBzdGFydFRpbWVvdXQgPSAoKSA9PiB7XG4gICAgICAgIGNhbmNlbFRpbWVvdXQoKTtcbiAgICAgICAgdGltZW91dElkID0gR0xpYi50aW1lb3V0X2FkZChHTGliLlBSSU9SSVRZX0RFRkFVTFQsIDMwMDAsICgpID0+IHtcbiAgICAgICAgICAgIHJldmVhbGVkLnNldChmYWxzZSk7XG4gICAgICAgICAgICB0aW1lb3V0SWQgPSBudWxsO1xuICAgICAgICAgICAgcmV0dXJuIEdMaWIuU09VUkNFX1JFTU9WRTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHJldHVybiAoXG4gICAgICAgIDxldmVudGJveCBvbkhvdmVyTG9zdD17c3RhcnRUaW1lb3V0fSBvbkhvdmVyPXtjYW5jZWxUaW1lb3V0fT5cbiAgICAgICAgICAgIDxib3ggY2xhc3NOYW1lPVwiV2lkZ2V0UGlsbFwiIHZhbGlnbj17R3RrLkFsaWduLkZJTEx9PlxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiVHJheVRvZ2dsZVwiXG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2tlZD17KCkgPT4gcmV2ZWFsZWQuc2V0KCFyZXZlYWxlZC5nZXQoKSl9XG4gICAgICAgICAgICAgICAgICAgIGNzcz1cInBhZGRpbmc6IDBweCA0cHg7IGJvcmRlcjogbm9uZTsgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7XCJcbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgIDxpY29uIGljb249e2JpbmQocmV2ZWFsZWQpLmFzKHIgPT4gciA/IFwicGFuLWVuZC1zeW1ib2xpY1wiIDogXCJwYW4tc3RhcnQtc3ltYm9saWNcIil9IGNzcz17aWNvbkNzc30gLz5cbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cblxuICAgICAgICAgICAgICAgIDxyZXZlYWxlclxuICAgICAgICAgICAgICAgICAgICB0cmFuc2l0aW9uVHlwZT17R3RrLlJldmVhbGVyVHJhbnNpdGlvblR5cGUuU0xJREVfTEVGVH1cbiAgICAgICAgICAgICAgICAgICAgcmV2ZWFsQ2hpbGQ9e2JpbmQocmV2ZWFsZWQpfVxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgPGJveCBjbGFzc05hbWU9XCJUcmF5SXRlbXMgZ2FwLTFcIiBjc3M9XCJwYWRkaW5nLWxlZnQ6IDRweDtcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtiaW5kKHRyYXksIFwiaXRlbXNcIikuYXMoaXRlbXMgPT4gaXRlbXMubWFwKGl0ZW0gPT4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxtZW51YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIlRyYXlJY29uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9vbHRpcE1hcmt1cD17YmluZChpdGVtLCBcInRvb2x0aXBNYXJrdXBcIil9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVzZVBvcG92ZXI9e2ZhbHNlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb25Hcm91cD17YmluZChpdGVtLCBcImFjdGlvbkdyb3VwXCIpLmFzKGFnID0+IFtcImRidXNtZW51XCIsIGFnXSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lbnVNb2RlbD17YmluZChpdGVtLCBcIm1lbnVNb2RlbFwiKX0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxUaGVtZWRJY29uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcHBJZD17YmluZChpdGVtLCBcImlkXCIpLmFzKGlkID0+IGlkIHx8IGl0ZW0uaWNvbk5hbWUgfHwgXCJcIil9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjc3M9e2ljb25Dc3N9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYWxldHRlPVwicHJpbWFyeVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9tZW51YnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgKSkpfVxuICAgICAgICAgICAgICAgICAgICA8L2JveD5cbiAgICAgICAgICAgICAgICA8L3JldmVhbGVyPlxuICAgICAgICAgICAgPC9ib3g+XG4gICAgICAgIDwvZXZlbnRib3g+XG4gICAgKVxufVxuIiwgImltcG9ydCB7IFZhcmlhYmxlLCBHTGliIH0gZnJvbSBcImFzdGFsXCI7XG5pbXBvcnQgeyBtb25pdG9yRmlsZSwgcmVhZEZpbGVBc3luYyB9IGZyb20gXCJhc3RhbC9maWxlXCI7XG5cbi8vIFRoaXMgbW9kdWxlIHByb3ZpZGVzIGEgc2luZ2xlLCBnbG9iYWwsIHJlYWN0aXZlIHZhcmlhYmxlXG4vLyBjb250YWluaW5nIHRoZSBpY29uIG1hbmlmZXN0IGdlbmVyYXRlZCBieSB0aGUgYmFja2VuZC5cblxuY29uc3QgTUFOSUZFU1RfUEFUSCA9IGAke0dMaWIuZ2V0X2hvbWVfZGlyKCl9Ly5jYWNoZS9saXMtaWNvbnMvbWFuaWZlc3QuanNvbmA7XG5jb25zdCBTSUdOQUxfRklMRSA9IGAke0dMaWIuZ2V0X2hvbWVfZGlyKCl9Ly5jYWNoZS90aGVtZS1lbmdpbmUvc2lnbmFsYDtcblxuZXhwb3J0IGludGVyZmFjZSBJY29uTWFuaWZlc3Qge1xuICBwcmltYXJ5OiB7IFthcHBfaWQ6IHN0cmluZ106IHN0cmluZyB9O1xuICBhY2NlbnQ6IHsgW2FwcF9pZDogc3RyaW5nXTogc3RyaW5nIH07XG59XG5cbi8vIDEuIENyZWF0ZSB0aGUgcmVhY3RpdmUgdmFyaWFibGUgdGhhdCB3aWxsIGJlIHRoZSBzaW5nbGUgc291cmNlIG9mIHRydXRoLlxuY29uc3QgaWNvbk1hbmlmZXN0ID0gbmV3IFZhcmlhYmxlPEljb25NYW5pZmVzdCB8IG51bGw+KG51bGwpO1xuXG4vLyAyLiBEZWZpbmUgdGhlIGZ1bmN0aW9uIHRoYXQgbG9hZHMgYW5kIHVwZGF0ZXMgdGhlIHZhcmlhYmxlLlxuY29uc3QgbG9hZE1hbmlmZXN0ID0gKCkgPT4ge1xuICByZWFkRmlsZUFzeW5jKE1BTklGRVNUX1BBVEgpXG4gICAgLnRoZW4oKGNvbnRlbnRzKSA9PiB7XG4gICAgICBjb25zdCBwYXJzZWQgPSBKU09OLnBhcnNlKGNvbnRlbnRzKSBhcyBJY29uTWFuaWZlc3Q7XG4gICAgICBpY29uTWFuaWZlc3Quc2V0KHBhcnNlZCk7XG4gICAgICBwcmludChcIltJY29uU2VydmljZV0gSWNvbiBtYW5pZmVzdCBsb2FkZWQgc3VjY2Vzc2Z1bGx5LlwiKTtcbiAgICB9KVxuICAgIC5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICBwcmludChgW0ljb25TZXJ2aWNlXSBDUklUSUNBTDogRmFpbGVkIHRvIGxvYWQgaWNvbiBtYW5pZmVzdDogJHtlcnJ9YCk7XG4gICAgICAvLyBPbiBmYWlsdXJlLCBzZXQgYSBkZWZhdWx0IGVtcHR5IHN0YXRlIHRvIHByZXZlbnQgY3Jhc2hlcy5cbiAgICAgIGljb25NYW5pZmVzdC5zZXQoeyBwcmltYXJ5OiB7fSwgYWNjZW50OiB7fSB9KTtcbiAgICB9KTtcbn07XG5cbi8vIDMuIFNldCB1cCB0aGUgd2F0Y2hlciB0byBhdXRvbWF0aWNhbGx5IHJlbG9hZCBvbiB0aGVtZSBjaGFuZ2VzLlxubW9uaXRvckZpbGUoU0lHTkFMX0ZJTEUsICgpID0+IHtcbiAgcHJpbnQoXCJbSWNvblNlcnZpY2VdIFNpZ25hbCByZWNlaXZlZC4gUmVsb2FkaW5nIGljb24gbWFuaWZlc3QuLi5cIik7XG4gIGxvYWRNYW5pZmVzdCgpO1xufSk7XG5cbi8vIDQuIFBlcmZvcm0gdGhlIGluaXRpYWwgbG9hZCB3aGVuIHRoZSBhcHBsaWNhdGlvbiBzdGFydHMuXG5sb2FkTWFuaWZlc3QoKTtcblxuLy8gNS4gRXhwb3J0IHRoZSByZWFjdGl2ZSB2YXJpYWJsZSBpdHNlbGYgZm9yIG90aGVyIGNvbXBvbmVudHMgdG8gdXNlLlxuZXhwb3J0IGRlZmF1bHQgaWNvbk1hbmlmZXN0O1xuIiwgImltcG9ydCB7IGJpbmQgfSBmcm9tIFwiYXN0YWxcIjtcbmltcG9ydCBpY29uTWFuaWZlc3QgZnJvbSBcIi4uL3NlcnZpY2VzL0ljb25TZXJ2aWNlXCI7XG5cbmludGVyZmFjZSBUaGVtZWRJY29uUHJvcHMge1xuICBhcHBJZDogc3RyaW5nO1xuICBjbGFzc05hbWU/OiBzdHJpbmc7XG4gIGNzcz86IHN0cmluZztcbiAgcGFsZXR0ZT86IFwicHJpbWFyeVwiIHwgXCJhY2NlbnRcIjtcbiAgc2l6ZT86IG51bWJlciB8IGltcG9ydChcImFzdGFsXCIpLkJpbmRpbmc8bnVtYmVyPjtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gVGhlbWVkSWNvbih7XG4gIGFwcElkLFxuICBjbGFzc05hbWUgPSBcIlwiLFxuICBjc3MgPSBcIlwiLFxuICBwYWxldHRlID0gXCJwcmltYXJ5XCIsXG4gIHNpemUsXG59OiBUaGVtZWRJY29uUHJvcHMpIHtcblxuICBjb25zdCBpY29uUGF0aCA9IGJpbmQoaWNvbk1hbmlmZXN0KS5hcyhtYW5pZmVzdCA9PiB7XG4gICAgY29uc3QgRkFMTEJBQ0sgPSBcImltYWdlLW1pc3NpbmdcIjtcblxuICAgIGlmICghbWFuaWZlc3QgfHwgIWFwcElkKSByZXR1cm4gRkFMTEJBQ0s7XG5cbiAgICAvLyBTdHJpY3QgbG9va3VwLiBUaGUgYmFja2VuZCBpcyB0aGUgc291cmNlIG9mIHRydXRoLlxuICAgIGNvbnN0IHBhdGggPSBtYW5pZmVzdFtwYWxldHRlXT8uW2FwcElkXTtcblxuICAgIGlmICghcGF0aCkge1xuICAgICAgLy8gVW5jb21tZW50IHRoaXMgdG8gc2VlIGV4YWN0bHkgd2h5IGl0IGZhaWxzIGluIHRoZSBsb2dzXG4gICAgICAvLyBwcmludChgW1RoZW1lZEljb25dIExvb2t1cCBmYWlsZWQgZm9yICcke2FwcElkfScgaW4gcGFsZXR0ZSAnJHtwYWxldHRlfSdgKTtcbiAgICAgIC8vIHByaW50KGBbVGhlbWVkSWNvbl0gTWFuaWZlc3Qga2V5cyBleGFtcGxlOiAke09iamVjdC5rZXlzKG1hbmlmZXN0W3BhbGV0dGVdKS5zbGljZSgwLCA1KS5qb2luKFwiLCBcIil9YCk7XG4gICAgICByZXR1cm4gRkFMTEJBQ0s7XG4gICAgfVxuXG4gICAgcmV0dXJuIHBhdGg7XG4gIH0pO1xuXG4gIGNvbnN0IGZpbmFsQ2xhc3NOYW1lID0gYFRoZW1lZEljb24gJHtjbGFzc05hbWV9YDtcblxuICAvLyBJZiBzaXplIGlzIHByb3ZpZGVkLCB3ZSB1c2UgcGl4ZWxTaXplIGZvciBzZW1hbnRpYyBjbGFyaXR5XG4gIC8vIElmIGl0J3MgYSBCaW5kaW5nLCBBc3RhbCBoYW5kbGVzIGl0LlxuICByZXR1cm4gKFxuICAgIDxpY29uXG4gICAgICBpY29uPXtpY29uUGF0aH1cbiAgICAgIGNsYXNzTmFtZT17ZmluYWxDbGFzc05hbWV9XG4gICAgICBjc3M9e2Nzc31cbiAgICAgIHBpeGVsU2l6ZT17c2l6ZX1cbiAgICAvPlxuICApO1xufVxuIiwgImltcG9ydCBHT2JqZWN0LCB7IHJlZ2lzdGVyLCBwcm9wZXJ0eSB9IGZyb20gXCJhc3RhbC9nb2JqZWN0XCJcbmltcG9ydCB7IGludGVydmFsLCBiaW5kIH0gZnJvbSBcImFzdGFsXCJcbmltcG9ydCB7IGV4ZWNBc3luYyB9IGZyb20gXCJhc3RhbC9wcm9jZXNzXCJcbmltcG9ydCBDb25maWdBZGFwdGVyIGZyb20gXCIuLi9Db25maWdBZGFwdGVyXCJcblxuY29uc3QgRkFMTEJBQ0tfTEFUID0gNDguODU2NjtcbmNvbnN0IEZBTExCQUNLX0xPTiA9IDIuMzUyMjtcblxuQHJlZ2lzdGVyKHsgR1R5cGVOYW1lOiBcIldlYXRoZXJcIiB9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgV2VhdGhlciBleHRlbmRzIEdPYmplY3QuT2JqZWN0IHtcbiAgICBzdGF0aWMgaW5zdGFuY2U6IFdlYXRoZXJcbiAgICBzdGF0aWMgZ2V0X2RlZmF1bHQoKSB7XG4gICAgICAgIGlmICghdGhpcy5pbnN0YW5jZSkgdGhpcy5pbnN0YW5jZSA9IG5ldyBXZWF0aGVyKClcbiAgICAgICAgcmV0dXJuIHRoaXMuaW5zdGFuY2VcbiAgICB9XG5cbiAgICBAcHJvcGVydHkoTnVtYmVyKSBnZXQgdGVtcGVyYXR1cmUoKSB7IHJldHVybiB0aGlzLiN0ZW1wZXJhdHVyZSB9XG4gICAgQHByb3BlcnR5KFN0cmluZykgZ2V0IGljb24oKSB7IHJldHVybiB0aGlzLiNpY29uIH1cbiAgICBAcHJvcGVydHkoU3RyaW5nKSBnZXQgZGVzY3JpcHRpb24oKSB7IHJldHVybiB0aGlzLiNkZXNjcmlwdGlvbiB9XG5cbiAgICAjdGVtcGVyYXR1cmUgPSAwXG4gICAgI2ljb24gPSBcIndlYXRoZXItc2V2ZXJlLWFsZXJ0LXN5bWJvbGljXCJcbiAgICAjZGVzY3JpcHRpb24gPSBcIlVua25vd25cIlxuICAgICNsYXQgPSAwXG4gICAgI2xvbiA9IDBcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpXG4gICAgICAgIHRoaXMuaW5pdCgpXG4gICAgICAgIGludGVydmFsKDE4MDAwMDAsICgpID0+IHRoaXMuZmV0Y2hXZWF0aGVyKCkpXG4gICAgfVxuXG4gICAgYXN5bmMgaW5pdCgpIHtcbiAgICAgICAgY29uc3QgY29uZmlnQWRhcHRlciA9IENvbmZpZ0FkYXB0ZXIuZ2V0KCk7XG4gICAgICAgIC8vIFdlIGNhbid0IGVhc2lseSBzeW5jIHdhaXQgZm9yIGNvbmZpZyBoZXJlLCBzbyB3ZSBkZWZhdWx0IHRvIGF1dG8sIFxuICAgICAgICAvLyBidXQgeW91IGNhbiBob3QtcmVsb2FkIHdlYXRoZXIgYnkgZWRpdGluZyB0aGUgY29uZmlnIGZpbGUgd2hpY2ggdHJpZ2dlcnMgYSBzZXJ2aWNlIHJlc3RhcnQgb3IgbG9naWMgdXBkYXRlIGlmIHdlIHdhdGNoZWQgaXQuXG4gICAgICAgIC8vIEZvciBzaW1wbGljaXR5IGluIHRoaXMgc2NyaXB0LCB3ZSBjaGVjayBpZiBhIGNpdHkgaXMgc2V0IGluIHRoZSBmaWxlLlxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyAxLiBUcnkgQ29uZmlnIENpdHkgTmFtZVxuICAgICAgICAgICAgY29uc3QgY2ZnID0gY29uZmlnQWRhcHRlci52YWx1ZTtcbiAgICAgICAgICAgIGNvbnN0IGNpdHkgPSAoY2ZnIGFzIGFueSk/LndpZGdldHM/LndlYXRoZXI/LmNpdHk7XG5cbiAgICAgICAgICAgIGlmIChjaXR5KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZ2VvVXJsID0gYGh0dHBzOi8vZ2VvY29kaW5nLWFwaS5vcGVuLW1ldGVvLmNvbS92MS9zZWFyY2g/bmFtZT0ke2VuY29kZVVSSUNvbXBvbmVudChjaXR5KX0mY291bnQ9MSZsYW5ndWFnZT1lbiZmb3JtYXQ9anNvbmA7XG4gICAgICAgICAgICAgICAgY29uc3QgZ2VvUmVzID0gYXdhaXQgZXhlY0FzeW5jKGBjdXJsIC1zIFwiJHtnZW9Vcmx9XCJgKTtcbiAgICAgICAgICAgICAgICBjb25zdCBnZW9Kc29uID0gSlNPTi5wYXJzZShnZW9SZXMpO1xuICAgICAgICAgICAgICAgIGlmIChnZW9Kc29uLnJlc3VsdHMgJiYgZ2VvSnNvbi5yZXN1bHRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy4jbGF0ID0gZ2VvSnNvbi5yZXN1bHRzWzBdLmxhdGl0dWRlO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLiNsb24gPSBnZW9Kc29uLnJlc3VsdHNbMF0ubG9uZ2l0dWRlO1xuICAgICAgICAgICAgICAgICAgICBwcmludChgW1dlYXRoZXJdIENvbmZpZ3VyZWQgQ2l0eTogJHtjaXR5fSAoJHt0aGlzLiNsYXR9LCAke3RoaXMuI2xvbn0pYCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZmV0Y2hXZWF0aGVyKCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIDIuIEF1dG8tbG9jYXRlXG4gICAgICAgICAgICBjb25zdCBsb2NSZXMgPSBhd2FpdCBleGVjQXN5bmMoXCJjdXJsIC1zIGh0dHA6Ly9pcC1hcGkuY29tL2pzb24vXCIpO1xuICAgICAgICAgICAgY29uc3QgbG9jSnNvbiA9IEpTT04ucGFyc2UobG9jUmVzKTtcbiAgICAgICAgICAgIGlmIChsb2NKc29uLmxhdCAmJiBsb2NKc29uLmxvbikge1xuICAgICAgICAgICAgICAgIHRoaXMuI2xhdCA9IGxvY0pzb24ubGF0O1xuICAgICAgICAgICAgICAgIHRoaXMuI2xvbiA9IGxvY0pzb24ubG9uO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJUCBHZW9sb2NhdGlvbiBmYWlsZWRcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHByaW50KGBbV2VhdGhlcl0gTG9jYXRpb24gZmFsbGJhY2sgdXNlZC5gKTtcbiAgICAgICAgICAgIHRoaXMuI2xhdCA9IEZBTExCQUNLX0xBVDtcbiAgICAgICAgICAgIHRoaXMuI2xvbiA9IEZBTExCQUNLX0xPTjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmZldGNoV2VhdGhlcigpO1xuICAgIH1cblxuICAgIGFzeW5jIGZldGNoV2VhdGhlcigpIHtcbiAgICAgICAgaWYgKHRoaXMuI2xhdCA9PT0gMCkgcmV0dXJuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCB1cmwgPSBgaHR0cHM6Ly9hcGkub3Blbi1tZXRlby5jb20vdjEvZm9yZWNhc3Q/bGF0aXR1ZGU9JHt0aGlzLiNsYXR9JmxvbmdpdHVkZT0ke3RoaXMuI2xvbn0mY3VycmVudF93ZWF0aGVyPXRydWVgO1xuICAgICAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgZXhlY0FzeW5jKGBjdXJsIC1zIFwiJHt1cmx9XCJgKTtcbiAgICAgICAgICAgIGNvbnN0IGpzb24gPSBKU09OLnBhcnNlKHJlcyk7XG4gICAgICAgICAgICBpZiAoanNvbi5jdXJyZW50X3dlYXRoZXIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLiN0ZW1wZXJhdHVyZSA9IGpzb24uY3VycmVudF93ZWF0aGVyLnRlbXBlcmF0dXJlO1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvZGUgPSBqc29uLmN1cnJlbnRfd2VhdGhlci53ZWF0aGVyY29kZTtcbiAgICAgICAgICAgICAgICB0aGlzLiNpY29uID0gdGhpcy5nZXRJY29uKGNvZGUpO1xuICAgICAgICAgICAgICAgIHRoaXMuI2Rlc2NyaXB0aW9uID0gdGhpcy5nZXREZXNjcmlwdGlvbihjb2RlKTtcblxuICAgICAgICAgICAgICAgIHRoaXMubm90aWZ5KFwidGVtcGVyYXR1cmVcIik7XG4gICAgICAgICAgICAgICAgdGhpcy5ub3RpZnkoXCJpY29uXCIpO1xuICAgICAgICAgICAgICAgIHRoaXMubm90aWZ5KFwiZGVzY3JpcHRpb25cIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJbV2VhdGhlcl0gRmFpbGVkIHRvIGZldGNoOlwiLCBlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdldEljb24oY29kZTogbnVtYmVyKSB7XG4gICAgICAgIGlmIChjb2RlID09PSAwKSByZXR1cm4gXCJ3ZWF0aGVyLWNsZWFyLXN5bWJvbGljXCJcbiAgICAgICAgaWYgKGNvZGUgPD0gMykgcmV0dXJuIFwid2VhdGhlci1mZXctY2xvdWRzLXN5bWJvbGljXCJcbiAgICAgICAgaWYgKGNvZGUgPD0gNDgpIHJldHVybiBcIndlYXRoZXItZm9nLXN5bWJvbGljXCJcbiAgICAgICAgaWYgKGNvZGUgPD0gNjcpIHJldHVybiBcIndlYXRoZXItc2hvd2Vycy1zeW1ib2xpY1wiXG4gICAgICAgIGlmIChjb2RlIDw9IDc3KSByZXR1cm4gXCJ3ZWF0aGVyLXNub3ctc3ltYm9saWNcIlxuICAgICAgICBpZiAoY29kZSA8PSA4MikgcmV0dXJuIFwid2VhdGhlci1zaG93ZXJzLXN5bWJvbGljXCJcbiAgICAgICAgaWYgKGNvZGUgPD0gOTkpIHJldHVybiBcIndlYXRoZXItc3Rvcm0tc3ltYm9saWNcIlxuICAgICAgICByZXR1cm4gXCJ3ZWF0aGVyLXNldmVyZS1hbGVydC1zeW1ib2xpY1wiXG4gICAgfVxuXG4gICAgZ2V0RGVzY3JpcHRpb24oY29kZTogbnVtYmVyKSB7XG4gICAgICAgIGlmIChjb2RlID09PSAwKSByZXR1cm4gXCJDbGVhciBza3lcIlxuICAgICAgICBpZiAoY29kZSA9PT0gMSkgcmV0dXJuIFwiTWFpbmx5IGNsZWFyXCJcbiAgICAgICAgaWYgKGNvZGUgPT09IDIpIHJldHVybiBcIlBhcnRseSBjbG91ZHlcIlxuICAgICAgICBpZiAoY29kZSA9PT0gMykgcmV0dXJuIFwiT3ZlcmNhc3RcIlxuICAgICAgICBpZiAoY29kZSA8PSA0OCkgcmV0dXJuIFwiRm9nXCJcbiAgICAgICAgaWYgKGNvZGUgPD0gNjcpIHJldHVybiBcIlJhaW5cIlxuICAgICAgICBpZiAoY29kZSA8PSA3NykgcmV0dXJuIFwiU25vd1wiXG4gICAgICAgIGlmIChjb2RlIDw9IDk5KSByZXR1cm4gXCJUaHVuZGVyc3Rvcm1cIlxuICAgICAgICByZXR1cm4gXCJVbmtub3duXCJcbiAgICB9XG59XG4iLCAiaW1wb3J0IHsgYmluZCB9IGZyb20gXCJhc3RhbFwiXG5pbXBvcnQgV2VhdGhlciBmcm9tIFwiLi4vc3JjL3NlcnZpY2VzL3dlYXRoZXJcIlxuaW1wb3J0IExheW91dFNlcnZpY2UgZnJvbSBcIi4uL3NyYy9MYXlvdXRTZXJ2aWNlXCJcbmltcG9ydCB7IEd0ayB9IGZyb20gXCJhc3RhbC9ndGszXCJcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gV2VhdGhlcldpZGdldCgpIHtcbiAgY29uc3Qgd2VhdGhlciA9IFdlYXRoZXIuZ2V0X2RlZmF1bHQoKVxuICBjb25zdCBsYXlvdXQgPSBMYXlvdXRTZXJ2aWNlLmdldF9kZWZhdWx0KClcblxuICAvLyBGb250IHNpemUgbm93IGhhbmRsZWQgYnkgQ3NzSW5qZWN0aW9uU2VydmljZSB2aWEgLldpZGdldFBpbGwgbGFiZWwgc2VsZWN0b3JcblxuICByZXR1cm4gPGJveCBjbGFzc05hbWU9XCJXaWRnZXRQaWxsXCIgdmFsaWduPXtHdGsuQWxpZ24uRklMTH0+XG4gICAgPGljb24gaWNvbj17YmluZCh3ZWF0aGVyLCBcImljb25cIil9IC8+XG4gICAgPGxhYmVsIGxhYmVsPXtiaW5kKHdlYXRoZXIsIFwidGVtcGVyYXR1cmVcIikuYXModCA9PiBgICR7dH1cdTAwQjBDYCl9IC8+XG4gIDwvYm94PlxufVxuIiwgImltcG9ydCBHT2JqZWN0LCB7IHByb3BlcnR5LCByZWdpc3RlciB9IGZyb20gXCJhc3RhbC9nb2JqZWN0XCI7XG5pbXBvcnQgR0xpYiBmcm9tIFwiZ2k6Ly9HTGliP3ZlcnNpb249Mi4wXCI7XG5pbXBvcnQgR2lvIGZyb20gXCJnaTovL0dpbz92ZXJzaW9uPTIuMFwiO1xuXG5leHBvcnQgdHlwZSBXb3Jrc3BhY2UgPSB7XG4gIGlkOiBudW1iZXIsXG4gIGlkeDogbnVtYmVyLFxuICBuYW1lOiBzdHJpbmcgfCBudWxsLFxuICBvdXRwdXQ6IHN0cmluZyxcbiAgaXNfYWN0aXZlOiBib29sZWFuLFxuICBpc19mb2N1c2VkOiBib29sZWFuLFxuICBhY3RpdmVfd2luZG93X2lkOiBudW1iZXIgfCBudWxsXG59XG5cbmV4cG9ydCB0eXBlIFdpbmRvdyA9IHtcbiAgaWQ6IG51bWJlcixcbiAgdGl0bGU6IHN0cmluZyB8IG51bGwsXG4gIGFwcF9pZDogc3RyaW5nLFxuICB3b3Jrc3BhY2VfaWQ6IG51bWJlciB8IG51bGwsXG4gIGlzX2ZvY3VzZWQ6IGJvb2xlYW5cbn1cblxuZXhwb3J0IHR5cGUgTW9uaXRvciA9IHtcbiAgbmFtZTogc3RyaW5nXG4gIG1ha2U6IHN0cmluZ1xuICBtb2RlbDogc3RyaW5nXG4gIHNlcmlhbDogc3RyaW5nXG59XG5cbmV4cG9ydCB0eXBlIFN0YXRlID0ge1xuICB3b3Jrc3BhY2VzOiBNYXA8bnVtYmVyLCBXb3Jrc3BhY2U+LFxuICB3aW5kb3dzOiBNYXA8bnVtYmVyLCBXaW5kb3c+LFxuICBtb25pdG9yczogTWFwPHN0cmluZywgTW9uaXRvcj5cbn1cblxuZXhwb3J0IHR5cGUgT3V0cHV0c1dpdGhXb3Jrc3BhY2VzV2l0aFdpbmRvd3MgPSBSZWNvcmQ8c3RyaW5nLCBPdXRwdXRXaXRoV29ya3NwYWNlc1dpdGhXaW5kb3dzPlxuZXhwb3J0IHR5cGUgT3V0cHV0V2l0aFdvcmtzcGFjZXNXaXRoV2luZG93cyA9IHtcbiAgb3V0cHV0OiBzdHJpbmcsXG4gIG1vbml0b3I6IE1vbml0b3IgfCBudWxsLFxuICB3b3Jrc3BhY2VzOiBSZWNvcmQ8bnVtYmVyLCBXb3Jrc3BhY2VXaXRoV2luZG93cz5cbn1cbmV4cG9ydCB0eXBlIFdvcmtzcGFjZVdpdGhXaW5kb3dzID0gV29ya3NwYWNlICYge1xuICB3aW5kb3dzOiBXaW5kb3dbXVxufVxuXG50eXBlIFJlc3BvbnNlT3V0cHV0cyA9IHtcbiAgT2s6IHtcbiAgICBPdXRwdXRzOiBSZWNvcmQ8c3RyaW5nLCBNb25pdG9yPlxuICB9XG59XG5cbkByZWdpc3Rlcih7IEdUeXBlTmFtZTogJ05pcmknIH0pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBOaXJpIGV4dGVuZHMgR09iamVjdC5PYmplY3Qge1xuICBzdGF0aWMgaW5zdGFuY2U6IE5pcmlcbiAgc3RhdGljIGdldF9kZWZhdWx0KCkge1xuICAgIGlmICghdGhpcy5pbnN0YW5jZSkge1xuICAgICAgdGhpcy5pbnN0YW5jZSA9IG5ldyBOaXJpKClcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuaW5zdGFuY2VcbiAgfVxuXG4gICNzdGF0ZTogU3RhdGVcblxuICBAcHJvcGVydHkoT2JqZWN0KVxuICBnZXQgb3V0cHV0cygpOiBPdXRwdXRzV2l0aFdvcmtzcGFjZXNXaXRoV2luZG93cyB7XG4gICAgY29uc3Qgd3NtYXA6IE91dHB1dHNXaXRoV29ya3NwYWNlc1dpdGhXaW5kb3dzID0ge31cbiAgICBcbiAgICAvLyBJbml0aWFsaXplIG91dHB1dHMgZnJvbSBtb25pdG9yc1xuICAgIGZvciAoY29uc3QgW25hbWUsIG1vbml0b3JdIG9mIHRoaXMuI3N0YXRlLm1vbml0b3JzKSB7XG4gICAgICAgIHdzbWFwW25hbWVdID0geyBvdXRwdXQ6IG5hbWUsIG1vbml0b3IsIHdvcmtzcGFjZXM6IHt9IH1cbiAgICB9XG5cbiAgICAvLyBQb3B1bGF0ZSB3b3Jrc3BhY2VzXG4gICAgZm9yIChjb25zdCB3cyBvZiB0aGlzLiNzdGF0ZS53b3Jrc3BhY2VzLnZhbHVlcygpKSB7XG4gICAgICAgIGNvbnN0IG91dHB1dCA9IHdzLm91dHB1dDtcbiAgICAgICAgaWYgKCF3c21hcFtvdXRwdXRdKSB7XG4gICAgICAgICAgICAgY29uc3QgbW9uaXRvciA9IHRoaXMuI3N0YXRlLm1vbml0b3JzLmdldChvdXRwdXQpID8/IG51bGw7XG4gICAgICAgICAgICAgd3NtYXBbb3V0cHV0XSA9IHsgb3V0cHV0LCBtb25pdG9yLCB3b3Jrc3BhY2VzOiB7fSB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIEFkZCB3aW5kb3dzIHRvIHdvcmtzcGFjZVxuICAgICAgICBjb25zdCB3aW5kb3dzID0gQXJyYXkuZnJvbSh0aGlzLiNzdGF0ZS53aW5kb3dzLnZhbHVlcygpKVxuICAgICAgICAgICAgLmZpbHRlcih3ID0+IHcud29ya3NwYWNlX2lkID09PSB3cy5pZCk7XG5cbiAgICAgICAgd3NtYXBbb3V0cHV0XS53b3Jrc3BhY2VzW3dzLmlkXSA9IHsgLi4ud3MsIHdpbmRvd3MgfVxuICAgIH1cblxuICAgIHJldHVybiB3c21hcFxuICB9XG5cbiAgQHByb3BlcnR5KE9iamVjdClcbiAgZ2V0IHdpbmRvd3MoKTogV2luZG93W10ge1xuICAgICAgcmV0dXJuIEFycmF5LmZyb20odGhpcy4jc3RhdGUud2luZG93cy52YWx1ZXMoKSk7XG4gIH1cblxuICAvLyBHT2JqZWN0IHByb3BlcnR5IG5hbWVzIGFyZSBjYW5vbmljYWxseSBrZWJhYi1jYXNlLiBcbiAgLy8gQXN0YWwgbWFwcyAnZm9jdXNlZFdpbmRvdycgZ2V0dGVyIHRvICdmb2N1c2VkLXdpbmRvdycgcHJvcGVydHkuXG4gIEBwcm9wZXJ0eShPYmplY3QpXG4gIGdldCBmb2N1c2VkV2luZG93KCk6IFdpbmRvdyB8IG51bGwge1xuICAgIGZvciAoY29uc3QgdyBvZiB0aGlzLiNzdGF0ZS53aW5kb3dzLnZhbHVlcygpKSB7XG4gICAgICAgIGlmICh3LmlzX2ZvY3VzZWQpIHJldHVybiB3O1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIEBwcm9wZXJ0eShPYmplY3QpXG4gIGdldCB3b3Jrc3BhY2VzKCk6IFdvcmtzcGFjZVtdIHtcbiAgICAgIHJldHVybiBBcnJheS5mcm9tKHRoaXMuI3N0YXRlLndvcmtzcGFjZXMudmFsdWVzKCkpO1xuICB9XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKVxuICAgIHRoaXMuI3N0YXRlID0ge1xuICAgICAgd29ya3NwYWNlczogbmV3IE1hcCgpLFxuICAgICAgd2luZG93czogbmV3IE1hcCgpLFxuICAgICAgbW9uaXRvcnM6IG5ldyBNYXAoKSxcbiAgICB9XG4gICAgdGhpcy5yZWxvYWRNb25pdG9ycygpXG4gICAgdGhpcy5saXN0ZW5FdmVudFN0cmVhbSgpXG4gIH1cblxuICBwdWJsaWMgZm9jdXNXb3Jrc3BhY2VJZChpZDogbnVtYmVyKSB7XG4gICAgY29uc3QgbXNnID0geyBBY3Rpb246IHsgRm9jdXNXb3Jrc3BhY2U6IHsgcmVmZXJlbmNlOiB7IElkOiBpZCB9IH0gfSB9XG4gICAgdGhpcy5vbmVPZmZDb21tYW5kKEpTT04uc3RyaW5naWZ5KG1zZykpXG4gIH1cblxuICBwdWJsaWMgcmVsb2FkTW9uaXRvcnMoKSB7XG4gICAgdGhpcy4jc3RhdGUubW9uaXRvcnMgPSB0aGlzLmdldE1vbml0b3JzKClcbiAgICB0aGlzLm5vdGlmeSgnb3V0cHV0cycpXG4gIH1cblxuICBwcml2YXRlIG5ld0Nvbm5lY3Rpb24oKTogR2lvLlNvY2tldENvbm5lY3Rpb24ge1xuICAgIGNvbnN0IHBhdGggPSBHTGliLmdldGVudignTklSSV9TT0NLRVQnKSFcbiAgICBjb25zdCBjbGllbnQgPSBuZXcgR2lvLlNvY2tldENsaWVudCgpLmNvbm5lY3QobmV3IEdpby5Vbml4U29ja2V0QWRkcmVzcyh7IHBhdGggfSksIG51bGwpXG4gICAgcmV0dXJuIGNsaWVudFxuICB9XG5cbiAgcHJpdmF0ZSBvbmVPZmZDb21tYW5kKGpzb25FbmNvZGVkQ29tbWFuZDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCBjbGllbnQgPSB0aGlzLm5ld0Nvbm5lY3Rpb24oKVxuICAgICAgICBjbGllbnQuZ2V0X291dHB1dF9zdHJlYW0oKS53cml0ZShqc29uRW5jb2RlZENvbW1hbmQgKyBcIlxcblwiLCBudWxsKVxuICAgICAgICBjb25zdCBpbnB1dHN0cmVhbSA9IG5ldyBHaW8uRGF0YUlucHV0U3RyZWFtKHtcbiAgICAgICAgY2xvc2VCYXNlU3RyZWFtOiB0cnVlLFxuICAgICAgICBiYXNlU3RyZWFtOiBjbGllbnQuZ2V0X2lucHV0X3N0cmVhbSgpXG4gICAgICAgIH0pXG4gICAgICAgIGNvbnN0IFtyZXNwb25zZSwgX2NvdW50XSA9IGlucHV0c3RyZWFtLnJlYWRfbGluZV91dGY4KG51bGwpXG4gICAgICAgIGlucHV0c3RyZWFtLmNsb3NlKG51bGwpXG4gICAgICAgIGlmICghcmVzcG9uc2UpIHJldHVybiBcIlwiXG4gICAgICAgIHJldHVybiByZXNwb25zZVxuICAgIH0gY2F0Y2goZSkge1xuICAgICAgICBjb25zb2xlLmVycm9yKGUpXG4gICAgICAgIHJldHVybiBcIlwiXG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBnZXRNb25pdG9ycygpOiBNYXA8c3RyaW5nLCBNb25pdG9yPiB7XG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcmVzcCA9IHRoaXMub25lT2ZmQ29tbWFuZChKU09OLnN0cmluZ2lmeShcIk91dHB1dHNcIikpXG4gICAgICAgIGlmIChyZXNwID09PSBcIlwiKSByZXR1cm4gbmV3IE1hcCgpXG4gICAgICAgIGNvbnN0IHBhcnNlZCA9IEpTT04ucGFyc2UocmVzcCkgYXMgUmVzcG9uc2VPdXRwdXRzXG4gICAgICAgIGNvbnN0IG91dHB1dHMgPSBwYXJzZWQuT2suT3V0cHV0c1xuICAgICAgICByZXR1cm4gbmV3IE1hcChPYmplY3QudmFsdWVzKG91dHB1dHMpLm1hcCgoeyBuYW1lLCBtYWtlLCBtb2RlbCwgc2VyaWFsIH0pID0+IFtuYW1lLCB7IG5hbWUsIG1ha2UsIG1vZGVsLCBzZXJpYWwgfV0pKVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBNYXAoKVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgbGlzdGVuRXZlbnRTdHJlYW0oKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3QgY2xpZW50ID0gdGhpcy5uZXdDb25uZWN0aW9uKClcbiAgICAgICAgY2xpZW50LmdldF9vdXRwdXRfc3RyZWFtKCkud3JpdGUoSlNPTi5zdHJpbmdpZnkoXCJFdmVudFN0cmVhbVwiKSArIFwiXFxuXCIsIG51bGwpXG4gICAgICAgIGNvbnN0IGlucHV0c3RyZWFtID0gbmV3IEdpby5EYXRhSW5wdXRTdHJlYW0oe1xuICAgICAgICBjbG9zZUJhc2VTdHJlYW06IHRydWUsXG4gICAgICAgIGJhc2VTdHJlYW06IGNsaWVudC5nZXRfaW5wdXRfc3RyZWFtKClcbiAgICAgICAgfSlcbiAgICAgICAgdGhpcy5yZWFkTGluZVNvY2tldChpbnB1dHN0cmVhbSwgKHN0cmVhbSwgcmVzdWx0KSA9PiB7XG4gICAgICAgIGlmICghc3RyZWFtKSByZXR1cm5cbiAgICAgICAgY29uc3QgbGluZSA9IHN0cmVhbS5yZWFkX2xpbmVfZmluaXNoKHJlc3VsdClbMF0gPz8gbmV3IFVpbnQ4QXJyYXkoW10pXG4gICAgICAgIGNvbnN0IHRleHQgPSBuZXcgVGV4dERlY29kZXIoKS5kZWNvZGUobGluZSlcbiAgICAgICAgaWYgKHRleHQpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbWVzc2FnZSA9IEpTT04ucGFyc2UodGV4dClcbiAgICAgICAgICAgICAgICB0aGlzLnJlY29uY2lsZVN0YXRlKG1lc3NhZ2UpXG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7IGNvbnNvbGUuZXJyb3IoXCJOaXJpIFBhcnNlIEVycm9yXCIsIGUpIH1cbiAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH0gY2F0Y2ggKGUpIHsgY29uc29sZS5lcnJvcihcIk5pcmkgU29ja2V0IEVycm9yXCIsIGUpIH1cbiAgfVxuXG4gIHByaXZhdGUgcmVhZExpbmVTb2NrZXQoaW5wdXRzdHJlYW06IEdpby5EYXRhSW5wdXRTdHJlYW0sIGNhbGxiYWNrOiAoc3RyZWFtOiBHaW8uRGF0YUlucHV0U3RyZWFtIHwgbnVsbCwgcmVzdWx0OiBHaW8uQXN5bmNSZXN1bHQpID0+IHZvaWQpIHtcbiAgICBpbnB1dHN0cmVhbS5yZWFkX2xpbmVfYXN5bmMoMCwgbnVsbCwgKHN0cmVhbTogR2lvLkRhdGFJbnB1dFN0cmVhbSB8IG51bGwsIHJlc3VsdDogR2lvLkFzeW5jUmVzdWx0KSA9PiB7XG4gICAgICBjYWxsYmFjayhzdHJlYW0sIHJlc3VsdClcbiAgICAgIGlmICghc3RyZWFtKSByZXR1cm5cbiAgICAgIHRoaXMucmVhZExpbmVTb2NrZXQoc3RyZWFtLCBjYWxsYmFjaylcbiAgICB9KVxuICB9XG5cbiAgcHJpdmF0ZSByZWNvbmNpbGVTdGF0ZShtZXNzYWdlOiBhbnkpIHtcbiAgICBsZXQgY2hhbmdlZCA9IGZhbHNlO1xuICAgIFxuICAgIGlmICgnV29ya3NwYWNlc0NoYW5nZWQnIGluIG1lc3NhZ2UpIHtcbiAgICAgIHRoaXMucmVjb25jaWxlV29ya3NwYWNlc0NoYW5nZWQobWVzc2FnZS5Xb3Jrc3BhY2VzQ2hhbmdlZC53b3Jrc3BhY2VzKVxuICAgICAgY2hhbmdlZCA9IHRydWU7XG4gICAgfVxuICAgIGlmICgnV29ya3NwYWNlQWN0aXZhdGVkJyBpbiBtZXNzYWdlKSB7XG4gICAgICB0aGlzLnJlY29uY2lsZVdvcmtzcGFjZUFjdGl2YXRlZChtZXNzYWdlLldvcmtzcGFjZUFjdGl2YXRlZClcbiAgICAgIGNoYW5nZWQgPSB0cnVlO1xuICAgIH1cbiAgICBpZiAoJ1dpbmRvd3NDaGFuZ2VkJyBpbiBtZXNzYWdlKSB7XG4gICAgICB0aGlzLnJlY29uY2lsZVdpbmRvd3NDaGFuZ2VkKG1lc3NhZ2UuV2luZG93c0NoYW5nZWQud2luZG93cylcbiAgICAgIGNoYW5nZWQgPSB0cnVlO1xuICAgIH1cbiAgICBpZiAoJ1dpbmRvd09wZW5lZE9yQ2hhbmdlZCcgaW4gbWVzc2FnZSkge1xuICAgICAgdGhpcy5yZWNvbmNpbGVXaW5kb3dPcGVuZWRPckNoYW5nZWQobWVzc2FnZS5XaW5kb3dPcGVuZWRPckNoYW5nZWQud2luZG93KVxuICAgICAgY2hhbmdlZCA9IHRydWU7XG4gICAgfVxuICAgIGlmICgnV2luZG93Q2xvc2VkJyBpbiBtZXNzYWdlKSB7XG4gICAgICB0aGlzLnJlY29uY2lsZVdpbmRvd0Nsb3NlZChtZXNzYWdlLldpbmRvd0Nsb3NlZClcbiAgICAgIGNoYW5nZWQgPSB0cnVlO1xuICAgIH1cbiAgICBpZiAoJ1dpbmRvd0ZvY3VzQ2hhbmdlZCcgaW4gbWVzc2FnZSkge1xuICAgICAgdGhpcy5yZWNvbmNpbGVXaW5kb3dGb2N1c0NoYW5nZWQobWVzc2FnZS5XaW5kb3dGb2N1c0NoYW5nZWQpXG4gICAgICBjaGFuZ2VkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoY2hhbmdlZCkge1xuICAgICAgICB0aGlzLm5vdGlmeSgnb3V0cHV0cycpXG4gICAgICAgIC8vIFVzZSBrZWJhYi1jYXNlIGZvciBHT2JqZWN0IHByb3BlcnR5IG5vdGlmaWNhdGlvblxuICAgICAgICB0aGlzLm5vdGlmeSgnZm9jdXNlZC13aW5kb3cnKVxuICAgICAgICB0aGlzLm5vdGlmeSgnd29ya3NwYWNlcycpXG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSByZWNvbmNpbGVXb3Jrc3BhY2VzQ2hhbmdlZCh3b3Jrc3BhY2VzOiBXb3Jrc3BhY2VbXSkge1xuICAgIHRoaXMuI3N0YXRlLndvcmtzcGFjZXMgPSBuZXcgTWFwKHdvcmtzcGFjZXMubWFwKHdzID0+IChbd3MuaWQsIHtcbiAgICAgIGlkOiB3cy5pZCxcbiAgICAgIGlkeDogd3MuaWR4LFxuICAgICAgbmFtZTogd3MubmFtZSxcbiAgICAgIG91dHB1dDogd3Mub3V0cHV0LFxuICAgICAgYWN0aXZlX3dpbmRvd19pZDogd3MuYWN0aXZlX3dpbmRvd19pZCxcbiAgICAgIGlzX2ZvY3VzZWQ6IHdzLmlzX2ZvY3VzZWQsXG4gICAgICBpc19hY3RpdmU6IHdzLmlzX2FjdGl2ZVxuICAgIH1dKSkpXG4gIH1cblxuICBwcml2YXRlIHJlY29uY2lsZVdvcmtzcGFjZUFjdGl2YXRlZCh3b3Jrc3BhY2VBY3RpdmF0ZWQ6IGFueSkge1xuICAgIGNvbnN0IGlkOiBudW1iZXIgPSB3b3Jrc3BhY2VBY3RpdmF0ZWQuaWRcbiAgICBjb25zdCBmb2N1c2VkOiBib29sZWFuID0gd29ya3NwYWNlQWN0aXZhdGVkLmZvY3VzZWRcbiAgICBjb25zdCB3b3Jrc3BhY2UgPSB0aGlzLiNzdGF0ZS53b3Jrc3BhY2VzLmdldChpZClcbiAgICBpZiAoIXdvcmtzcGFjZSkgcmV0dXJuXG4gICAgY29uc3Qgb3V0cHV0ID0gd29ya3NwYWNlLm91dHB1dFxuICAgIHRoaXMuI3N0YXRlLndvcmtzcGFjZXMgPSBuZXcgTWFwKEFycmF5LmZyb20odGhpcy4jc3RhdGUud29ya3NwYWNlcywgKFtrZXksIHdzXSkgPT4ge1xuICAgICAgaWYgKHdzLm91dHB1dCA9PSBvdXRwdXQpIHtcbiAgICAgICAgcmV0dXJuIFtrZXksIHsgLi4ud3MsIGlzX2FjdGl2ZTogZm9jdXNlZCAmJiBpZCA9PT0gd3MuaWQgfV1cbiAgICAgIH1cbiAgICAgIHJldHVybiBba2V5LCB3c11cbiAgICB9KSlcbiAgfVxuXG4gIHByaXZhdGUgcmVjb25jaWxlV2luZG93c0NoYW5nZWQod2luZG93czogV2luZG93W10pIHtcbiAgICB0aGlzLiNzdGF0ZS53aW5kb3dzID0gbmV3IE1hcCh3aW5kb3dzLm1hcCh3ID0+IFt3LmlkLCB3XSkpXG4gIH1cblxuICBwcml2YXRlIHJlY29uY2lsZVdpbmRvd09wZW5lZE9yQ2hhbmdlZCh3aW5kb3c6IFdpbmRvdykge1xuICAgIHRoaXMuI3N0YXRlLndpbmRvd3Muc2V0KHdpbmRvdy5pZCwgd2luZG93KVxuICAgIGlmICh3aW5kb3cuaXNfZm9jdXNlZCkge1xuICAgICAgICAvLyBVbmZvY3VzIG90aGVyc1xuICAgICAgICBmb3IgKGNvbnN0IFtpZCwgd10gb2YgdGhpcy4jc3RhdGUud2luZG93cykge1xuICAgICAgICAgICAgaWYgKGlkICE9PSB3aW5kb3cuaWQpIHcuaXNfZm9jdXNlZCA9IGZhbHNlXG4gICAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHJlY29uY2lsZVdpbmRvd0Nsb3NlZCh3aW5kb3dDbG9zZWQ6IHsgaWQ6IG51bWJlciB9KSB7XG4gICAgdGhpcy4jc3RhdGUud2luZG93cy5kZWxldGUod2luZG93Q2xvc2VkLmlkKVxuICB9XG5cbiAgcHJpdmF0ZSByZWNvbmNpbGVXaW5kb3dGb2N1c0NoYW5nZWQod2luZG93Rm9jdXNDaGFuZ2VkOiB7IGlkOiBudW1iZXIgfSkge1xuICAgIGZvciAoY29uc3QgW2lkLCB3XSBvZiB0aGlzLiNzdGF0ZS53aW5kb3dzKSB7XG4gICAgICAgIHcuaXNfZm9jdXNlZCA9IChpZCA9PT0gd2luZG93Rm9jdXNDaGFuZ2VkLmlkKTtcbiAgICB9XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBiaW5kLCBWYXJpYWJsZSB9IGZyb20gXCJhc3RhbFwiO1xuaW1wb3J0IE5pcmkgZnJvbSBcIi4uL3NyYy9zZXJ2aWNlcy9uaXJpXCI7XG5pbXBvcnQgQ29uZmlnQWRhcHRlciBmcm9tIFwiLi4vc3JjL0NvbmZpZ0FkYXB0ZXJcIjtcbmltcG9ydCBMYXlvdXRTZXJ2aWNlIGZyb20gXCIuLi9zcmMvTGF5b3V0U2VydmljZVwiO1xuaW1wb3J0IHsgR3RrIH0gZnJvbSBcImFzdGFsL2d0azNcIjtcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gV2luZG93VGl0bGUoKSB7XG4gIGNvbnN0IG5pcmkgPSBOaXJpLmdldF9kZWZhdWx0KCk7XG4gIGNvbnN0IGxheW91dCA9IExheW91dFNlcnZpY2UuZ2V0X2RlZmF1bHQoKTtcbiAgLy8gVXNlIHN0YXRpYyB2YWx1ZSBmcm9tIGNvbmZpZyAtIG1heFdpZHRoQ2hhcnMgZXhwZWN0cyBudW1iZXIsIG5vdCBCaW5kaW5nXG4gIGNvbnN0IG1heENoYXJzID0gQ29uZmlnQWRhcHRlci5nZXQoKS52YWx1ZS5saW1pdHM/LndpbmRvd1RpdGxlID8/IDQwO1xuXG4gIC8vIEZvbnQgc2l6ZSBub3cgaGFuZGxlZCBieSBDc3NJbmplY3Rpb25TZXJ2aWNlIHZpYSAuV2lkZ2V0UGlsbCBsYWJlbCBzZWxlY3RvclxuXG4gIHJldHVybiAoXG4gICAgPGJveCBjbGFzc05hbWU9XCJXaWRnZXRQaWxsXCIgdmFsaWduPXtHdGsuQWxpZ24uRklMTH0+XG4gICAgICA8bGFiZWxcbiAgICAgICAgY2xhc3NOYW1lPVwiV2luZG93VGl0bGVcIlxuICAgICAgICBsYWJlbD17YmluZChuaXJpLCBcImZvY3VzZWRXaW5kb3dcIikuYXMoKHcpID0+IHcgPyAody50aXRsZSB8fCB3LmFwcF9pZCkgOiBcIkRlc2t0b3BcIil9XG4gICAgICAgIHRydW5jYXRlXG4gICAgICAgIG1heFdpZHRoQ2hhcnM9e21heENoYXJzfVxuICAgICAgLz5cbiAgICA8L2JveD5cbiAgKTtcbn1cbiIsICJpbXBvcnQgeyBHZGssIEd0ayB9IGZyb20gXCJhc3RhbC9ndGszXCJcbmltcG9ydCB7IGJpbmQsIEJpbmRpbmcgfSBmcm9tIFwiYXN0YWxcIlxuaW1wb3J0IE5pcmksIHsgV29ya3NwYWNlV2l0aFdpbmRvd3MgfSBmcm9tIFwiLi4vc3JjL3NlcnZpY2VzL25pcmlcIlxuaW1wb3J0IExheW91dFNlcnZpY2UgZnJvbSBcIi4uL3NyYy9MYXlvdXRTZXJ2aWNlXCJcbmltcG9ydCBUaGVtZWRJY29uIGZyb20gXCIuLi9zcmMvY29tcG9uZW50cy9UaGVtZWRJY29uXCJcblxuY29uc3QgbmlyaSA9IE5pcmkuZ2V0X2RlZmF1bHQoKVxuXG5mdW5jdGlvbiBXb3Jrc3BhY2Uod29ya3NwYWNlOiBXb3Jrc3BhY2VXaXRoV2luZG93cywgc2hvd0luYWN0aXZlSWNvbnM6IGJvb2xlYW4sIGljb25TaXplOiBCaW5kaW5nPG51bWJlcj4pIHtcbiAgY29uc3QgdHJhaXRzID0gWyd3b3Jrc3BhY2UnXVxuICBpZiAod29ya3NwYWNlLmlzX2FjdGl2ZSkgdHJhaXRzLnB1c2goJ2FjdGl2ZScpXG4gIGlmICh3b3Jrc3BhY2Uud2luZG93cy5sZW5ndGggPiAwKSB0cmFpdHMucHVzaCgncG9wdWxhdGVkJylcblxuICBjb25zdCBzaG93SWNvbnMgPSAod29ya3NwYWNlLmlzX2FjdGl2ZSB8fCBzaG93SW5hY3RpdmVJY29ucykgJiYgd29ya3NwYWNlLndpbmRvd3MubGVuZ3RoID4gMFxuXG4gIHJldHVybiAoXG4gICAgPGJ1dHRvblxuICAgICAgb25DbGljaz17KCkgPT4gbmlyaS5mb2N1c1dvcmtzcGFjZUlkKHdvcmtzcGFjZS5pZCl9XG4gICAgICBjbGFzc05hbWU9e3RyYWl0cy5qb2luKCcgJyl9XG4gICAgICB2YWxpZ249e0d0ay5BbGlnbi5GSUxMfVxuICAgICAgaGFsaWduPXtHdGsuQWxpZ24uQ0VOVEVSfVxuICAgID5cbiAgICAgIDxib3hcbiAgICAgICAgY2xhc3NOYW1lPVwiV29ya3NwYWNlQ29udGVudFwiXG4gICAgICAgIHZhbGlnbj17R3RrLkFsaWduLkNFTlRFUn1cbiAgICAgICAgaGFsaWduPXtHdGsuQWxpZ24uQ0VOVEVSfVxuICAgICAgPlxuICAgICAgICA8bGFiZWxcbiAgICAgICAgICBjbGFzc05hbWU9XCJ3cy1pZHhcIlxuICAgICAgICAgIGxhYmVsPXt3b3Jrc3BhY2UuaWR4LnRvU3RyaW5nKCl9XG4gICAgICAgIC8+XG4gICAgICAgIHtzaG93SWNvbnMgJiYgd29ya3NwYWNlLndpbmRvd3MubWFwKHdpbiA9PiAoXG4gICAgICAgICAgPFRoZW1lZEljb25cbiAgICAgICAgICAgIGFwcElkPXt3aW4uYXBwX2lkfVxuICAgICAgICAgICAgY2xhc3NOYW1lPVwiV29ya3NwYWNlSWNvblwiXG4gICAgICAgICAgICBwYWxldHRlPXt3b3Jrc3BhY2UuaXNfYWN0aXZlID8gXCJhY2NlbnRcIiA6IFwicHJpbWFyeVwifVxuICAgICAgICAgICAgc2l6ZT17aWNvblNpemV9XG4gICAgICAgICAgLz5cbiAgICAgICAgKSl9XG4gICAgICA8L2JveD5cbiAgICA8L2J1dHRvbj5cbiAgKVxufVxuXG5mdW5jdGlvbiBnZXRNb25pdG9yTmFtZShnZGttb25pdG9yOiBHZGsuTW9uaXRvcikge1xuICBjb25zdCBkaXNwbGF5ID0gR2RrLkRpc3BsYXkuZ2V0X2RlZmF1bHQoKSE7XG4gIGNvbnN0IHNjcmVlbiA9IGRpc3BsYXkuZ2V0X2RlZmF1bHRfc2NyZWVuKCk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZGlzcGxheS5nZXRfbl9tb25pdG9ycygpOyArK2kpIHtcbiAgICBpZiAoZ2RrbW9uaXRvciA9PT0gZGlzcGxheS5nZXRfbW9uaXRvcihpKSkgcmV0dXJuIHNjcmVlbi5nZXRfbW9uaXRvcl9wbHVnX25hbWUoaSk7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIFdvcmtzcGFjZXMoeyBtb25pdG9yLCBzaG93SW5hY3RpdmVJY29ucyA9IHRydWUgfTogeyBtb25pdG9yOiBHZGsuTW9uaXRvciwgc2hvd0luYWN0aXZlSWNvbnM/OiBib29sZWFuIH0pIHtcbiAgY29uc3QgbW9uaXRvck5hbWUgPSBnZXRNb25pdG9yTmFtZShtb25pdG9yKTtcbiAgaWYgKCFtb25pdG9yTmFtZSkgcmV0dXJuIDxib3ggLz47XG5cbiAgLy8gR2V0IGR5bmFtaWMgaWNvbiBzaXplIGZyb20gTGF5b3V0U2VydmljZVxuICBjb25zdCBsYXlvdXQgPSBMYXlvdXRTZXJ2aWNlLmdldF9kZWZhdWx0KClcblxuICBjb25zdCB3b3Jrc3BhY2VzRm9yTWUgPSBiaW5kKG5pcmksICdvdXRwdXRzJykuYXMob3V0cHV0cyA9PlxuICAgIE9iamVjdC52YWx1ZXMob3V0cHV0cylcbiAgICAgIC5maWx0ZXIobyA9PiBvLm1vbml0b3I/Lm5hbWUgPT09IG1vbml0b3JOYW1lKVxuICAgICAgLmZsYXRNYXAobyA9PiBPYmplY3QudmFsdWVzKG8ud29ya3NwYWNlcykpXG4gICAgICAuc29ydCgoYSwgYikgPT4gYS5pZHggLSBiLmlkeClcbiAgKTtcblxuICByZXR1cm4gKFxuICAgIDxib3ggY2xhc3NOYW1lPVwiV29ya3NwYWNlcyBnYXAtMVwiIHZhbGlnbj17R3RrLkFsaWduLkZJTEx9PlxuICAgICAge3dvcmtzcGFjZXNGb3JNZS5hcyh3cyA9PiB3cy5tYXAodyA9PiBXb3Jrc3BhY2Uodywgc2hvd0luYWN0aXZlSWNvbnMsIGxheW91dC53b3Jrc3BhY2VJY29uU2l6ZSkpKX1cbiAgICA8L2JveD5cbiAgKVxufVxuIiwgIi8vIEFVVE8tR0VORVJBVEVEIEZJTEUgLSBETyBOT1QgRURJVFxuLy8gR2VuZXJhdGVkIGJ5IHNjcmlwdHMvZ2VuLXJlZ2lzdHJ5LmpzXG4vLyBEZWZpbml0aW9uIG9mIHRoZSBcIkJ1bmRsZSBSZWFsaXR5XCIgLSBBbGwgYXZhaWxhYmxlIHdpZGdldHMuXG5cbmltcG9ydCBBdWRpbyBmcm9tICcuLi93aWRnZXRzL0F1ZGlvJztcbmltcG9ydCBEYXNoYm9hcmRCdXR0b24gZnJvbSAnLi4vd2lkZ2V0cy9EYXNoYm9hcmRCdXR0b24nO1xuaW1wb3J0IERhdGVUaW1lIGZyb20gJy4uL3dpZGdldHMvRGF0ZVRpbWUnO1xuaW1wb3J0IE1lZGlhUHJvIGZyb20gJy4uL3dpZGdldHMvTWVkaWFQcm8nOyAvLyBWNSBDb21wbGlhbnQgTWVkaWFQcm9cbmltcG9ydCBSZXNvdXJjZVVzYWdlIGZyb20gJy4uL3dpZGdldHMvUmVzb3VyY2VVc2FnZSc7XG5pbXBvcnQgVHJheSBmcm9tICcuLi93aWRnZXRzL1RyYXknO1xuXG5pbXBvcnQgV2VhdGhlciBmcm9tICcuLi93aWRnZXRzL1dlYXRoZXInO1xuaW1wb3J0IFdpbmRvd1RpdGxlIGZyb20gJy4uL3dpZGdldHMvV2luZG93VGl0bGUnO1xuaW1wb3J0IFdvcmtzcGFjZXMgZnJvbSAnLi4vd2lkZ2V0cy9Xb3Jrc3BhY2VzJztcblxuZXhwb3J0IGNvbnN0IFdJREdFVF9NQVAgPSB7XG4gICAgXCJhdWRpb1wiOiBBdWRpbyxcbiAgICBcImRhc2hib2FyZGJ1dHRvblwiOiBEYXNoYm9hcmRCdXR0b24sXG4gICAgXCJkYXRldGltZVwiOiBEYXRlVGltZSxcbiAgICBcIm1lZGlhXCI6IE1lZGlhUHJvLFxuICAgIFwicmVzb3VyY2V1c2FnZVwiOiBSZXNvdXJjZVVzYWdlLFxuICAgIFwidHJheVwiOiBUcmF5LFxuXG4gICAgXCJ3ZWF0aGVyXCI6IFdlYXRoZXIsXG4gICAgXCJ3aW5kb3d0aXRsZVwiOiBXaW5kb3dUaXRsZSxcbiAgICBcIndvcmtzcGFjZXNcIjogV29ya3NwYWNlcyxcbn0gYXMgY29uc3Q7XG5cbmV4cG9ydCB0eXBlIFdpZGdldElkID0ga2V5b2YgdHlwZW9mIFdJREdFVF9NQVA7XG5cbmV4cG9ydCBkZWZhdWx0IFdJREdFVF9NQVA7XG4iLCAiLy8gQmFyLnRzeFxuaW1wb3J0IHsgQXBwLCBBc3RhbCwgR3RrIH0gZnJvbSBcImFzdGFsL2d0azNcIjtcbmltcG9ydCB7IGJpbmQgfSBmcm9tIFwiYXN0YWxcIjtcbmltcG9ydCBMYXlvdXRTZXJ2aWNlIGZyb20gXCIuLi9zcmMvTGF5b3V0U2VydmljZVwiO1xuaW1wb3J0IFdJREdFVF9NQVAsIHsgV2lkZ2V0SWQgfSBmcm9tIFwiLi4vc3JjL3JlZ2lzdHJ5XCI7XG5pbXBvcnQgQ29uZmlnQWRhcHRlciBmcm9tIFwiLi4vc3JjL0NvbmZpZ0FkYXB0ZXJcIjtcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gQmFyKG1vbml0b3I6IEdkay5Nb25pdG9yKSB7XG4gIGNvbnN0IHsgVE9QLCBMRUZULCBSSUdIVCB9ID0gQXN0YWwuV2luZG93QW5jaG9yO1xuICBjb25zdCBsYXlvdXQgPSBMYXlvdXRTZXJ2aWNlLmdldF9kZWZhdWx0KCk7XG4gIGNvbnN0IGNvbmZpZyA9IGJpbmQoQ29uZmlnQWRhcHRlci5nZXQoKS5hZGFwdGVyKTtcblxuICBjb25zdCByZW5kZXJTZWN0aW9uID0gKHNlY3Rpb25OYW1lOiBcImxlZnRcIiB8IFwiY2VudGVyXCIgfCBcInJpZ2h0XCIpID0+IHtcbiAgICAvLyBBY2Nlc3Mgc2FmZSBiaW5kaW5nIChmYWxsYmFjayBoYW5kbGVkIGluIEFkYXB0ZXIpXG4gICAgcmV0dXJuIGNvbmZpZy5hcyhjID0+IGMubGF5b3V0LmJhcltzZWN0aW9uTmFtZV0pLmFzKGlkcyA9PlxuICAgICAgaWRzLm1hcChpZCA9PiB7XG4gICAgICAgIC8vIENhc3QgaWQgdG8gV2lkZ2V0SWQgYmVjYXVzZSBjb25maWcgaWRzIGFyZSBzdHJpbmdzIGJ1dCB3ZSBrbm93IHRoZXkgbWFwIHRvIHdpZGdldHNcbiAgICAgICAgY29uc3QgQ29tcG9uZW50ID0gV0lER0VUX01BUFtpZCBhcyBXaWRnZXRJZF07XG4gICAgICAgIGlmICghQ29tcG9uZW50KSB7XG4gICAgICAgICAgcHJpbnQoYFtCYXJdIFdhcm5pbmc6IFdpZGdldCAnJHtpZH0nIG5vdCBmb3VuZCBpbiByZWdpc3RyeS5gKTtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICAvLyBQYXNzIG1vbml0b3IgYXMgc3RhbmRhcmQgcHJvcCAnbW9uaXRvcicgdG8gYWxsIHdpZGdldHNcbiAgICAgICAgLy8gRW5zdXJlIHVuaXF1ZW5lc3MgaWYgbmVlZGVkIGJ5IGFkZGluZyBrZXksIHRob3VnaCBHSlMgaGFuZGxlcyBpdCB1c3VhbGx5XG4gICAgICAgIHJldHVybiA8Q29tcG9uZW50IG1vbml0b3I9e21vbml0b3J9IC8+O1xuICAgICAgfSlcbiAgICApO1xuICB9O1xuXG4gIHJldHVybiAoXG4gICAgPHdpbmRvd1xuICAgICAgbmFtZT1cImJhclwiXG4gICAgICBjbGFzc05hbWU9XCJCYXJcIlxuICAgICAgZ2RrbW9uaXRvcj17bW9uaXRvcn1cbiAgICAgIGV4Y2x1c2l2aXR5PXtBc3RhbC5FeGNsdXNpdml0eS5FWENMVVNJVkV9XG4gICAgICBhbmNob3I9e1RPUCB8IExFRlQgfCBSSUdIVH1cbiAgICAgIGFwcGxpY2F0aW9uPXtBcHB9XG4gICAgICBoZWlnaHRSZXF1ZXN0PXtsYXlvdXQuYmFySGVpZ2h0fVxuICAgID5cbiAgICAgIDxjZW50ZXJib3ggY2xhc3NOYW1lPVwiQmFyQ29udGVudFwiPlxuICAgICAgICA8Ym94IGNsYXNzTmFtZT1cIkxlZnRcIiBoYWxpZ249e0d0ay5BbGlnbi5TVEFSVH0+XG4gICAgICAgICAge3JlbmRlclNlY3Rpb24oXCJsZWZ0XCIpfVxuICAgICAgICA8L2JveD5cblxuICAgICAgICA8Ym94IGNsYXNzTmFtZT1cIkNlbnRlclwiIGhhbGlnbj17R3RrLkFsaWduLkNFTlRFUn0+XG4gICAgICAgICAge3JlbmRlclNlY3Rpb24oXCJjZW50ZXJcIil9XG4gICAgICAgIDwvYm94PlxuXG4gICAgICAgIDxib3ggY2xhc3NOYW1lPVwiUmlnaHRcIiBoYWxpZ249e0d0ay5BbGlnbi5FTkR9PlxuICAgICAgICAgIHtyZW5kZXJTZWN0aW9uKFwicmlnaHRcIil9XG4gICAgICAgIDwvYm94PlxuICAgICAgPC9jZW50ZXJib3g+XG4gICAgPC93aW5kb3c+XG4gICk7XG59XG4iLCAiaW1wb3J0IHsgR0xpYiwgR09iamVjdCB9IGZyb20gXCJhc3RhbFwiO1xuaW1wb3J0IHsgcmVnaXN0ZXIgfSBmcm9tIFwiYXN0YWwvZ29iamVjdFwiO1xuaW1wb3J0IE5vdGlmZCBmcm9tIFwiZ2k6Ly9Bc3RhbE5vdGlmZD92ZXJzaW9uPTAuMVwiO1xuXG5AcmVnaXN0ZXIoeyBHVHlwZU5hbWU6IFwiTm90aWZpY2F0aW9uU2VydmljZVwiIH0pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBOb3RpZmljYXRpb25TZXJ2aWNlIGV4dGVuZHMgR09iamVjdC5PYmplY3Qge1xuICAgIHN0YXRpYyBpbnN0YW5jZTogTm90aWZpY2F0aW9uU2VydmljZTtcbiAgICBzdGF0aWMgZ2V0X2RlZmF1bHQoKSB7XG4gICAgICAgIGlmICghdGhpcy5pbnN0YW5jZSkgdGhpcy5pbnN0YW5jZSA9IG5ldyBOb3RpZmljYXRpb25TZXJ2aWNlKCk7XG4gICAgICAgIHJldHVybiB0aGlzLmluc3RhbmNlO1xuICAgIH1cblxuICAgICNub3RpZmQ6IE5vdGlmZC5Ob3RpZmQ7XG4gICAgI3JlY2VudE5vdGlmaWNhdGlvbnM6IE1hcDxzdHJpbmcsIG51bWJlcj4gPSBuZXcgTWFwKCk7IC8vIGhhc2ggLT4gdGltZXN0YW1wXG4gICAgI2RlZHVwV2luZG93ID0gMTAwMDsgLy8gbXNcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLiNub3RpZmQgPSBOb3RpZmQuZ2V0X2RlZmF1bHQoKTtcblxuICAgICAgICAvLyBTdWJzY3JpYmUgdG8gdGhlIG5vdGlmaWVkIHNpZ25hbFxuICAgICAgICAvLyBXZSB1c2UgY29ubmVjdCBkaXJlY3RseSBvbiB0aGUgR09iamVjdCBwcm94eVxuICAgICAgICB0aGlzLiNub3RpZmQuY29ubmVjdChcIm5vdGlmaWVkXCIsIChfLCBpZCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5oYW5kbGVOb3RpZmljYXRpb24oaWQpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGhhbmRsZU5vdGlmaWNhdGlvbihpZDogbnVtYmVyKSB7XG4gICAgICAgIGNvbnN0IG5vdGlmaWNhdGlvbiA9IHRoaXMuI25vdGlmZC5nZXRfbm90aWZpY2F0aW9uKGlkKTtcbiAgICAgICAgaWYgKCFub3RpZmljYXRpb24pIHJldHVybjtcblxuICAgICAgICAvLyBDYWxjdWxhdGUgaGFzaDogYXBwTmFtZSArIHN1bW1hcnkgKyBib2R5XG4gICAgICAgIGNvbnN0IGNvbnRlbnQgPSBgJHtub3RpZmljYXRpb24uYXBwTmFtZX0ke25vdGlmaWNhdGlvbi5zdW1tYXJ5fSR7bm90aWZpY2F0aW9uLmJvZHl9YDtcbiAgICAgICAgY29uc3QgY2hlY2tzdW0gPSBuZXcgR0xpYi5DaGVja3N1bShHTGliLkNoZWNrc3VtVHlwZS5TSEEyNTYpO1xuICAgICAgICBjaGVja3N1bS51cGRhdGUoY29udGVudCk7XG4gICAgICAgIGNvbnN0IGhhc2ggPSBjaGVja3N1bS5nZXRfc3RyaW5nKCk7XG4gICAgICAgIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XG5cbiAgICAgICAgLy8gQ2hlY2sgZm9yIGR1cGxpY2F0ZVxuICAgICAgICBpZiAodGhpcy4jcmVjZW50Tm90aWZpY2F0aW9ucy5oYXMoaGFzaCkpIHtcbiAgICAgICAgICAgIGNvbnN0IGxhc3RUaW1lID0gdGhpcy4jcmVjZW50Tm90aWZpY2F0aW9ucy5nZXQoaGFzaCkhO1xuICAgICAgICAgICAgaWYgKG5vdyAtIGxhc3RUaW1lIDwgdGhpcy4jZGVkdXBXaW5kb3cpIHtcbiAgICAgICAgICAgICAgICBwcmludChgW05vdGlmaWNhdGlvblNlcnZpY2VdIFNwYW0gZGV0ZWN0ZWQhIERpc21pc3Npbmc6ICR7bm90aWZpY2F0aW9uLnN1bW1hcnl9YCk7XG4gICAgICAgICAgICAgICAgbm90aWZpY2F0aW9uLmRpc21pc3MoKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBVcGRhdGUgbWFwXG4gICAgICAgIHRoaXMuI3JlY2VudE5vdGlmaWNhdGlvbnMuc2V0KGhhc2gsIG5vdyk7XG5cbiAgICAgICAgLy8gQ2xlYW51cCBvbGQgZW50cmllcyAoc2ltcGxlIEdDKVxuICAgICAgICBpZiAodGhpcy4jcmVjZW50Tm90aWZpY2F0aW9ucy5zaXplID4gNTApIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgW2ssIHRdIG9mIHRoaXMuI3JlY2VudE5vdGlmaWNhdGlvbnMpIHtcbiAgICAgICAgICAgICAgICBpZiAobm93IC0gdCA+IHRoaXMuI2RlZHVwV2luZG93KSB0aGlzLiNyZWNlbnROb3RpZmljYXRpb25zLmRlbGV0ZShrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cbiIsICJpbXBvcnQgeyBBcHAgfSBmcm9tIFwiYXN0YWwvZ3RrM1wiXG5pbXBvcnQgQ29uZmlnQWRhcHRlciwgeyBDb25maWcgfSBmcm9tIFwiLi4vQ29uZmlnQWRhcHRlclwiXG5cbmNsYXNzIENzc0luamVjdGlvblNlcnZpY2Uge1xuICAgIHByaXZhdGUgc3RhdGljIGluc3RhbmNlOiBDc3NJbmplY3Rpb25TZXJ2aWNlXG5cbiAgICBzdGF0aWMgZ2V0KCk6IENzc0luamVjdGlvblNlcnZpY2Uge1xuICAgICAgICBpZiAoIXRoaXMuaW5zdGFuY2UpIHRoaXMuaW5zdGFuY2UgPSBuZXcgQ3NzSW5qZWN0aW9uU2VydmljZSgpXG4gICAgICAgIHJldHVybiB0aGlzLmluc3RhbmNlXG4gICAgfVxuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuaW5pdCgpXG4gICAgfVxuXG4gICAgcHJpdmF0ZSBpbml0KCkge1xuICAgICAgICAvLyBTdWJzY3JpYmUgdG8gY29uZmlnIGNoYW5nZXNcbiAgICAgICAgQ29uZmlnQWRhcHRlci5nZXQoKS5hZGFwdGVyLnN1YnNjcmliZSgoY29uZmlnKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmdlbmVyYXRlQW5kQXBwbHkoY29uZmlnKVxuICAgICAgICB9KVxuXG4gICAgICAgIC8vIEluaXRpYWwgYXBwbHlcbiAgICAgICAgdGhpcy5nZW5lcmF0ZUFuZEFwcGx5KENvbmZpZ0FkYXB0ZXIuZ2V0KCkudmFsdWUpXG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZW5lcmF0ZUFuZEFwcGx5KGNvbmZpZzogQ29uZmlnKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjc3MgPSB0aGlzLmdlbmVyYXRlQ3NzKGNvbmZpZylcbiAgICAgICAgICAgIEFwcC5hcHBseV9jc3MoY3NzKVxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJbQ3NzSW5qZWN0aW9uU2VydmljZV0gQ1NTIGluamVjdGVkIHN1Y2Nlc3NmdWxseS5cIilcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgW0Nzc0luamVjdGlvblNlcnZpY2VdIEZhaWxlZCB0byBpbmplY3QgQ1NTOiAke2V9YClcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgZ2VuZXJhdGVDc3MoYzogQ29uZmlnKTogc3RyaW5nIHtcbiAgICAgICAgY29uc3QgcmF3VSA9IE1hdGguZmxvb3IoYy5sYXlvdXQuYmFySGVpZ2h0ICogYy5zY2FsaW5nLnVuaXRSYXRpbylcbiAgICAgICAgY29uc3QgVSA9IGlzTmFOKHJhd1UpIHx8IHJhd1UgPD0gMCA/IDggOiByYXdVXG4gICAgICAgIGNvbnN0IFIgPSBjLnNjYWxpbmcucmFkaXVzUmF0aW9cblxuICAgICAgICBjb25zdCBzcGFjaW5nMSA9IFUgKiAxXG4gICAgICAgIGNvbnN0IHNwYWNpbmcyID0gVSAqIDJcbiAgICAgICAgY29uc3Qgc3BhY2luZzMgPSBVICogM1xuICAgICAgICBjb25zdCBtYXJnaW5WID0gTWF0aC5mbG9vcihVICogKGMubGF5b3V0LnBhZGRpbmc/LnZlcnRpY2FsID8/IDApKVxuICAgICAgICBjb25zdCBtYXJnaW5IID0gTWF0aC5mbG9vcihVICogKGMubGF5b3V0LnBhZGRpbmc/Lmhvcml6b250YWwgPz8gMykpXG4gICAgICAgIGNvbnN0IHJhZGl1czIgPSBNYXRoLmZsb29yKFUgKiBSICogMilcbiAgICAgICAgY29uc3QgZm9udFNpemUgPSBNYXRoLm1heChNYXRoLmZsb29yKGMubGF5b3V0LmJhckhlaWdodCAqIGMuc2NhbGluZy5mb250UmF0aW8pLCBjLnNjYWxpbmcubWluRm9udFNpemUpXG4gICAgICAgIGNvbnN0IHdvcmtzcGFjZUljb25TaXplID0gTWF0aC5mbG9vcihjLmxheW91dC5iYXJIZWlnaHQgKiAoYy5sYXlvdXQuYmFyLndvcmtzcGFjZVNjYWxlID8/IDAuNSkpXG5cbiAgICAgICAgY29uc3QgYXJ0U2l6ZSA9IE1hdGguZmxvb3IoYy5sYXlvdXQuYmFySGVpZ2h0ICogMC45KTsgLy8gTGFyZ2VyIGZvciBwcmVtaXVtIGZlZWxcblxuICAgICAgICByZXR1cm4gYFxuQGRlZmluZS1jb2xvciBwcmltYXJ5ICR7Yy5hcHBlYXJhbmNlLmNvbG9ycy5wcmltYXJ5fTtcbkBkZWZpbmUtY29sb3Igc3VyZmFjZSAke2MuYXBwZWFyYW5jZS5jb2xvcnMuc3VyZmFjZX07XG5AZGVmaW5lLWNvbG9yIHN1cmZhY2VEYXJrZXIgJHtjLmFwcGVhcmFuY2UuY29sb3JzLnN1cmZhY2VEYXJrZXJ9O1xuQGRlZmluZS1jb2xvciB0ZXh0ICR7Yy5hcHBlYXJhbmNlLmNvbG9ycy50ZXh0fTtcbkBkZWZpbmUtY29sb3IgYm9yZGVyICR7Yy5hcHBlYXJhbmNlLmNvbG9ycy5ib3JkZXJ9O1xuQGRlZmluZS1jb2xvciBhY2NlbnQgJHtjLmFwcGVhcmFuY2UuY29sb3JzLmFjY2VudH07XG5AZGVmaW5lLWNvbG9yIGJhcl9iZyAke2MuYXBwZWFyYW5jZS5jb2xvcnMuYmFyX2JnfTtcblxuLldpZGdldFBpbGwsIC5NZWRpYVBpbGwge1xuICAgIGJhY2tncm91bmQtY29sb3I6IEBzdXJmYWNlO1xuICAgIHBhZGRpbmc6IDBweCAke3NwYWNpbmcyfXB4O1xuICAgIG1hcmdpbjogJHttYXJnaW5WfXB4ICR7bWFyZ2luSH1weDtcbiAgICBtaW4taGVpZ2h0OiAwcHg7XG4gICAgbWluLXdpZHRoOiAwcHg7XG4gICAgYm9yZGVyLXJhZGl1czogJHtyYWRpdXMyfXB4O1xufVxuXG4uV2lkZ2V0UGlsbCBsYWJlbCwgLk1lZGlhUGlsbCBsYWJlbCB7XG4gICAgZm9udC1zaXplOiAke2ZvbnRTaXplfXB4O1xuICAgIGNvbG9yOiBAdGV4dDtcbn1cblxuLkRhc2hib2FyZEljb24ge1xuICAgIHBhZGRpbmc6IDBweCAke3NwYWNpbmcxfXB4O1xufVxuXG4uRGF0ZVRpbWUge1xuICAgIGZvbnQtc2l6ZTogJHtmb250U2l6ZX1weDtcbn1cblxuLmFjY2VudCBsYWJlbCB7XG4gICAgY29sb3I6IEBhY2NlbnQ7XG59XG5cbi51cmdlbnQgbGFiZWwge1xuICAgIGNvbG9yOiBAcHJpbWFyeTtcbn1cblxuLk1lZGlhUHJvUGlsbCB7XG4gICAgYmFja2dyb3VuZC1jb2xvcjogQHN1cmZhY2U7XG4gICAgcGFkZGluZzogMHB4ICR7c3BhY2luZzJ9cHg7XG4gICAgbWFyZ2luOiAke21hcmdpblZ9cHggJHttYXJnaW5IfXB4O1xuICAgIG1pbi1oZWlnaHQ6IDBweDtcbiAgICBtaW4td2lkdGg6IDBweDtcbiAgICBib3JkZXItcmFkaXVzOiAke3JhZGl1czJ9cHg7XG59XG5cbi5NZWRpYVByb0NvbnRlbnQge1xuICAgIHBhZGRpbmc6IDBweDtcbiAgICBwYWRkaW5nLWxlZnQ6ICR7TWF0aC5mbG9vcihzcGFjaW5nMSAvIDIpfXB4O1xufVxuXG4uQXJ0Q2lyY2xlIHtcbiAgICBtaW4td2lkdGg6ICR7YXJ0U2l6ZX1weDtcbiAgICBtaW4taGVpZ2h0OiAke2FydFNpemV9cHg7XG4gICAgYm9yZGVyLXJhZGl1czogNTAlO1xuICAgIGJhY2tncm91bmQtc2l6ZTogY292ZXI7XG4gICAgYmFja2dyb3VuZC1wb3NpdGlvbjogY2VudGVyO1xuICAgIGJhY2tncm91bmQtY29sb3I6IEBzdXJmYWNlRGFya2VyO1xufVxuXG4uV29ya3NwYWNlcyAud29ya3NwYWNlIHtcbiAgICBib3JkZXItcmFkaXVzOiAke3JhZGl1czJ9cHg7XG59XG5cbi5Xb3Jrc3BhY2VJY29uIHtcbiAgICBtaW4td2lkdGg6ICR7d29ya3NwYWNlSWNvblNpemV9cHg7XG4gICAgbWluLWhlaWdodDogJHt3b3Jrc3BhY2VJY29uU2l6ZX1weDtcbiAgICBmb250LXNpemU6ICR7d29ya3NwYWNlSWNvblNpemV9cHg7XG59XG5cbi5BcnRDaXJjbGUgaWNvbiB7XG4gICAgY29sb3I6IEB0ZXh0O1xufVxuXG4uVHJhY2tJbmZvIHtcbiAgICBtYXJnaW46IDBweCAke3NwYWNpbmcxfXB4O1xufVxuXG4uVHJhY2tUaXRsZSB7XG4gICAgZm9udC1zaXplOiAke2ZvbnRTaXplfXB4O1xuICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gICAgY29sb3I6IEB0ZXh0O1xufVxuXG4uVHJhY2tBcnRpc3Qge1xuICAgIGZvbnQtc2l6ZTogJHtmb250U2l6ZX1weDtcbiAgICBmb250LXdlaWdodDogNTAwO1xuICAgIGNvbG9yOiBAYWNjZW50O1xufVxuXG4uZ2FwLTEgPiAqIHtcbiAgICBtYXJnaW4tcmlnaHQ6ICR7c3BhY2luZzF9cHg7XG59XG4uZ2FwLTEgPiAqOmxhc3QtY2hpbGQge1xuICAgIG1hcmdpbi1yaWdodDogMHB4O1xufVxuXG4uZ2FwLTIgPiAqIHtcbiAgICBtYXJnaW4tcmlnaHQ6ICR7c3BhY2luZzJ9cHg7XG59XG4uZ2FwLTIgPiAqOmxhc3QtY2hpbGQge1xuICAgIG1hcmdpbi1yaWdodDogMHB4O1xufVxuXG4uZ2FwLTMgPiAqIHtcbiAgICBtYXJnaW4tcmlnaHQ6ICR7c3BhY2luZzN9cHg7XG59XG4uZ2FwLTMgPiAqOmxhc3QtY2hpbGQge1xuICAgIG1hcmdpbi1yaWdodDogMHB4O1xufVxuXG4uZ2FwLWhhbGYgPiAqIHtcbiAgICBtYXJnaW4tcmlnaHQ6ICR7TWF0aC5mbG9vcihzcGFjaW5nMSAvIDIpfXB4O1xufVxuLmdhcC1oYWxmID4gKjpsYXN0LWNoaWxkIHtcbiAgICBtYXJnaW4tcmlnaHQ6IDBweDtcbn1cbmBcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IENzc0luamVjdGlvblNlcnZpY2VcbiIsICJpbXBvcnQgeyBBcHAsIEdkaywgR3RrIH0gZnJvbSBcImFzdGFsL2d0azNcIjtcbmltcG9ydCB7IG1vbml0b3JGaWxlLCByZWFkRmlsZUFzeW5jLCB3cml0ZUZpbGVBc3luYyB9IGZyb20gXCJhc3RhbC9maWxlXCI7XG5pbXBvcnQgeyBHTGliLCBHaW8gfSBmcm9tIFwiYXN0YWxcIjtcbmltcG9ydCBCYXIgZnJvbSBcIi4vd2luZG93cy9CYXJcIjtcbmltcG9ydCBOaXJpIGZyb20gXCIuL3NyYy9zZXJ2aWNlcy9uaXJpXCI7XG5pbXBvcnQgXCIuL3NyYy9zZXJ2aWNlcy9JY29uU2VydmljZVwiO1xuXG4vLyBTZXJ2aWNlICYgUmVnaXN0cnkgSW1wb3J0c1xuaW1wb3J0IENvbmZpZ0FkYXB0ZXIgZnJvbSBcIi4vc3JjL0NvbmZpZ0FkYXB0ZXJcIjtcbmltcG9ydCBMYXlvdXRTZXJ2aWNlIGZyb20gXCIuL3NyYy9MYXlvdXRTZXJ2aWNlXCI7XG5pbXBvcnQgTm90aWZpY2F0aW9uU2VydmljZSBmcm9tIFwiLi9zcmMvc2VydmljZXMvTm90aWZpY2F0aW9uU2VydmljZVwiO1xuaW1wb3J0IENzc0luamVjdGlvblNlcnZpY2UgZnJvbSBcIi4vc3JjL3NlcnZpY2VzL0Nzc0luamVjdGlvblNlcnZpY2VcIjtcblxuLy8gV2lkZ2V0IEltcG9ydHMgZm9yIFJlZ2lzdHJ5XG4vLyAoQXV0by1nZW5lcmF0ZWQgaW4gc3JjL3JlZ2lzdHJ5LnRzKVxuXG4vLyAtLS0gUEFUSCBERUZJTklUSU9OUyAtLS1cbmNvbnN0IFNDUklQVF9ESVIgPSBHTGliLnBhdGhfZ2V0X2Rpcm5hbWUoXG4gIGltcG9ydC5tZXRhLnVybC5yZXBsYWNlKFwiZmlsZTovL1wiLCBcIlwiKSxcbik7XG5jb25zdCBHVEtfQ1NTX1BBVEggPSBgJHtHTGliLmdldF9ob21lX2RpcigpfS8uY2FjaGUvd2FsL2Fncy1jb2xvcnMuY3NzYDtcbmNvbnN0IFNJR05BTF9GSUxFID0gYCR7R0xpYi5nZXRfaG9tZV9kaXIoKX0vLmNhY2hlL3RoZW1lLWVuZ2luZS9zaWduYWxgO1xuY29uc3QgTUFJTl9DU1NfUEFUSCA9IGAke1NDUklQVF9ESVJ9L3N0eWxlL21haW4uY3NzYDtcbmNvbnN0IFRNUF9TVFlMRV9QQVRIID0gXCIvdG1wL2FzdGFsLXN0eWxlLmNzc1wiO1xuY29uc3QgTE9BREVSX0NTU19QQVRIID0gXCIvdG1wL2FzdGFsLWxvYWRlci5jc3NcIjtcblxuLy8gLS0tIENTUyBMT0FERVIgTE9HSUMgLS0tXG4vLyBXZSBjcmVhdGUgYSBcIm1ldGFcIiBDU1MgZmlsZSB0aGF0IGltcG9ydHMgYm90aCB0aGUgY29sb3JzIGFuZCB0aGUgc3R5bGVzLlxuLy8gVGhpcyBmb3JjZXMgR1RLIHRvIHBhcnNlIHRoZW0gaW4gdGhlIHNhbWUgY29udGV4dCwgcmVzb2x2aW5nIHZhcmlhYmxlcyBjb3JyZWN0bHkuXG5jb25zdCBnZW5lcmF0ZUxvYWRlciA9ICgpID0+IHtcbiAgdHJ5IHtcbiAgICAvLyAxLiBDcmVhdGUgdGhlIGxvYWRlciBmaWxlIGNvbnRlbnRcbiAgICAvLyBOb3RlOiBXZSB1c2UgZmlsZTovLyBVUklzIGZvciByb2J1c3RuZXNzLiBcbiAgICAvLyBXZSBpbXBvcnQgTUFJTl9DU1NfUEFUSCBkaXJlY3RseSBzbyByZWxhdGl2ZSBpbXBvcnRzIGluc2lkZSBpdCAobGlrZSBAaW1wb3J0IFwiYmFyLmNzc1wiKSBcbiAgICAvLyByZXNvbHZlIHJlbGF0aXZlIHRvIHRoZSBvcmlnaW5hbCBmaWxlIGluIHRoZSBzdG9yZS9kaXJlY3RvcnkuXG4gICAgY29uc3QgY29udGVudCA9IGBcbkBpbXBvcnQgdXJsKFwiZmlsZTovLyR7R1RLX0NTU19QQVRIfVwiKTtcbkBpbXBvcnQgdXJsKFwiZmlsZTovLyR7TUFJTl9DU1NfUEFUSH1cIik7XG5gO1xuICAgIC8vIDIuIFdyaXRlIGl0IHN5bmNocm9ub3VzbHkgdG8gZW5zdXJlIGl0J3MgcmVhZHlcbiAgICBHTGliLmZpbGVfc2V0X2NvbnRlbnRzKExPQURFUl9DU1NfUEFUSCwgY29udGVudCk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBwcmludChgW0FwcF0gQ1JJVElDQUw6IEZhaWxlZCB0byBnZW5lcmF0ZSBDU1MgbG9hZGVyOiAke2V9YCk7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59O1xuXG50cnkge1xuICAvLyBHZW5lcmF0ZSB0aGUgbG9hZGVyIGJlZm9yZSBzdGFydGluZ1xuICBpZiAoIWdlbmVyYXRlTG9hZGVyKCkpIEFwcC5xdWl0KCk7XG5cbiAgY29uc3QgbmlyaSA9IE5pcmkuZ2V0X2RlZmF1bHQoKTtcblxuICBBcHAuc3RhcnQoe1xuICAgIGluc3RhbmNlTmFtZTogXCJjb20ubGlzLmJhclwiLFxuICAgIC8vIFdlIGxvYWQgdGhlIFVuaWZpZWQgTG9hZGVyIGZpbGUuXG4gICAgY3NzOiBMT0FERVJfQ1NTX1BBVEgsXG5cbiAgICBtYWluKCkge1xuICAgICAgLy8gV2Ugc3RpbGwgbmVlZCB0byBoYW5kbGUgaG90LXJlbG9hZGluZyBtYW51YWxseSBiZWNhdXNlIEFwcC5zdGFydCdzIGNzcyBwcm9wXG4gICAgICAvLyBvbmx5IGhhbmRsZXMgdGhlIGluaXRpYWwgbG9hZCBmb3IgdGhlIG1haW4gd2luZG93LCBidXQgd2Ugd2FudCB0byBlbnN1cmVcbiAgICAgIC8vIGdsb2JhbCBjb250ZXh0IHVwZGF0ZXMuXG5cbiAgICAgIC8vIEphbml0b3I6IENsZWFuIHVwIGNhY2hlZCBtZWRpYSBhcnQgb2xkZXIgdGhhbiAxIGRheVxuICAgICAgY29uc3QgY2FjaGVEaXIgPSBgJHtHTGliLmdldF9ob21lX2RpcigpfS8uY2FjaGUvYXN0YWwvbXByaXNgOyAvLyBVUERBVEUgVEhJUyBQQVRIXG4gICAgICBHTGliLnNwYXduX2NvbW1hbmRfbGluZV9hc3luYyhcbiAgICAgICAgYGZpbmQgJHtjYWNoZURpcn0gLXR5cGUgZiAtbXRpbWUgKzEgLWRlbGV0ZWAsXG4gICAgICApO1xuXG4gICAgICAvLyAtLS0gUEhBU0UgMzogSU5JVElBTElaRSBTRVJWSUNFUyAtLS1cbiAgICAgIENvbmZpZ0FkYXB0ZXIuZ2V0KCk7XG4gICAgICBDc3NJbmplY3Rpb25TZXJ2aWNlLmdldCgpO1xuICAgICAgTGF5b3V0U2VydmljZS5nZXRfZGVmYXVsdCgpO1xuICAgICAgTm90aWZpY2F0aW9uU2VydmljZS5nZXRfZGVmYXVsdCgpO1xuXG5cblxuICAgICAgY29uc3Qgc2NyZWVuID0gR2RrLlNjcmVlbi5nZXRfZGVmYXVsdCgpITtcbiAgICAgIC8vIFVzZSBhIGN1c3RvbSBwcm92aWRlciBmb3IgaG90LXJlbG9hZCB1cGRhdGVzXG4gICAgICBjb25zdCBjc3NQcm92aWRlciA9IG5ldyBHdGsuQ3NzUHJvdmlkZXIoKTtcblxuICAgICAgY29uc3QgYXBwbHlDc3MgPSAoKSA9PiB7XG4gICAgICAgIC8vIFJlZ2VuZXJhdGUgdG8gY2F0Y2ggYW55IGNoYW5nZXMgaW4gdGhlIHVuZGVybHlpbmcgZmlsZXNcbiAgICAgICAgZ2VuZXJhdGVMb2FkZXIoKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjc3NQcm92aWRlci5sb2FkX2Zyb21fcGF0aChMT0FERVJfQ1NTX1BBVEgpO1xuICAgICAgICAgIC8vIEZvcmNlIHJlc2V0IHRvIGFwcGx5IG5ldyBjb2xvcnNcbiAgICAgICAgICBHdGsuU3R5bGVDb250ZXh0LnJlc2V0X3dpZGdldHMoc2NyZWVuKTtcbiAgICAgICAgICBwcmludChgW0FwcF0gVGhlbWUgcmVsb2FkZWQgdmlhIFVuaWZpZWQgTG9hZGVyLmApO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgcHJpbnQoYFtBcHBdIENTUyBMb2FkIEVycm9yOiAke2V9YCk7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIC8vIEFkZCB0aGUgcHJvdmlkZXIgb25jZS5cbiAgICAgIC8vIE5vdGU6IEFwcC5zdGFydCBhZGRzIG9uZSBieSBkZWZhdWx0IGZvciB0aGUgJ2NzcycgcHJvcCwgYnV0IHdlIGFkZCB0aGlzXG4gICAgICAvLyBmb3Igb3VyIG1hbnVhbCBjb250cm9sIGR1cmluZyBob3QtcmVsb2FkLlxuICAgICAgR3RrLlN0eWxlQ29udGV4dC5hZGRfcHJvdmlkZXJfZm9yX3NjcmVlbihcbiAgICAgICAgc2NyZWVuLFxuICAgICAgICBjc3NQcm92aWRlcixcbiAgICAgICAgR3RrLlNUWUxFX1BST1ZJREVSX1BSSU9SSVRZX0FQUExJQ0FUSU9OICsgMTAwLFxuICAgICAgKTtcblxuICAgICAgLy8gV2F0Y2ggZm9yIFNpZ25hbHNcbiAgICAgIG1vbml0b3JGaWxlKFNJR05BTF9GSUxFLCAoKSA9PiB7XG4gICAgICAgIHByaW50KFwiW0FwcF0gUmVsb2FkIHNpZ25hbCByZWNlaXZlZC5cIik7XG4gICAgICAgIGFwcGx5Q3NzKCk7XG4gICAgICB9KTtcblxuICAgICAgLy8gRXhwb3NlIFRvZ2dsZSBBY3Rpb24gZm9yIENMSVxuICAgICAgY29uc3QgdG9nZ2xlQWN0aW9uID0gbmV3IEdpby5TaW1wbGVBY3Rpb24oe1xuICAgICAgICBuYW1lOiBcInRvZ2dsZS13aW5kb3dcIixcbiAgICAgICAgcGFyYW1ldGVyX3R5cGU6IG5ldyBHTGliLlZhcmlhbnRUeXBlKFwic1wiKSxcbiAgICAgIH0pO1xuICAgICAgdG9nZ2xlQWN0aW9uLmNvbm5lY3QoXCJhY3RpdmF0ZVwiLCAoXywgcGFyYW0pID0+IHtcbiAgICAgICAgaWYgKHBhcmFtKSB7XG4gICAgICAgICAgY29uc3Qgd2luTmFtZSA9IHBhcmFtLnVucGFjaygpIGFzIHN0cmluZztcbiAgICAgICAgICBBcHAudG9nZ2xlX3dpbmRvdyh3aW5OYW1lKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBBcHAuYWRkX2FjdGlvbih0b2dnbGVBY3Rpb24pO1xuXG4gICAgICAvLyBSZW5kZXIgV2luZG93c1xuICAgICAgY29uc3QgYmFycyA9IG5ldyBNYXA8R2RrLk1vbml0b3IsIEd0ay5XaWRnZXQ+KCk7XG4gICAgICBjb25zdCByZW5kZXJCYXJzID0gKCkgPT4ge1xuICAgICAgICBmb3IgKGNvbnN0IHcgb2YgYmFycy52YWx1ZXMoKSkgdy5kZXN0cm95KCk7XG4gICAgICAgIGJhcnMuY2xlYXIoKTtcbiAgICAgICAgZm9yIChjb25zdCBtIG9mIEFwcC5nZXRfbW9uaXRvcnMoKSkgYmFycy5zZXQobSwgQmFyKG0pKTtcbiAgICAgIH07XG5cbiAgICAgIHJlbmRlckJhcnMoKTtcbiAgICAgIC8vIE5PVEU6IERhc2hib2FyZCwgTGF1bmNoZXIsIENsaXBib2FyZCByZW1vdmVkIC0gd2lsbCBiZSByZWJ1aWx0IHdpdGggVjUgY29tcGxpYW5jZVxuXG4gICAgICBBcHAuY29ubmVjdChcIm1vbml0b3ItYWRkZWRcIiwgKF8sIG0pID0+IGJhcnMuc2V0KG0sIEJhcihtKSkpO1xuICAgICAgQXBwLmNvbm5lY3QoXCJtb25pdG9yLXJlbW92ZWRcIiwgKF8sIG0pID0+IHtcbiAgICAgICAgYmFycy5nZXQobSk/LmRlc3Ryb3koKTtcbiAgICAgICAgYmFycy5kZWxldGUobSk7XG4gICAgICB9KTtcbiAgICB9LFxuICB9KTtcbn0gY2F0Y2ggKGUpIHtcbiAgcHJpbnQoYENSSVRJQ0FMIEVSUk9SIGluIGFwcC50c3g6ICR7ZX1gKTtcbiAgQXBwLnF1aXQoKTtcbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxPQUFPQSxZQUFXO0FBQ2xCLE9BQU9DLFVBQVM7QUFDaEIsT0FBTyxTQUFTOzs7QUNGaEIsT0FBT0MsWUFBVzs7O0FDQVgsSUFBTSxXQUFXLENBQUMsUUFBZ0IsSUFDcEMsUUFBUSxtQkFBbUIsT0FBTyxFQUNsQyxXQUFXLEtBQUssR0FBRyxFQUNuQixZQUFZO0FBRVYsSUFBTSxXQUFXLENBQUMsUUFBZ0IsSUFDcEMsUUFBUSxtQkFBbUIsT0FBTyxFQUNsQyxXQUFXLEtBQUssR0FBRyxFQUNuQixZQUFZO0FBY1YsSUFBTSxVQUFOLE1BQU0sU0FBZTtBQUFBLEVBQ2hCLGNBQWMsQ0FBQyxNQUFXO0FBQUEsRUFFbEM7QUFBQSxFQUNBO0FBQUEsRUFTQSxPQUFPLEtBQUssU0FBcUMsTUFBZTtBQUM1RCxXQUFPLElBQUksU0FBUSxTQUFTLElBQUk7QUFBQSxFQUNwQztBQUFBLEVBRVEsWUFBWSxTQUE0QyxNQUFlO0FBQzNFLFNBQUssV0FBVztBQUNoQixTQUFLLFFBQVEsUUFBUSxTQUFTLElBQUk7QUFBQSxFQUN0QztBQUFBLEVBRUEsV0FBVztBQUNQLFdBQU8sV0FBVyxLQUFLLFFBQVEsR0FBRyxLQUFLLFFBQVEsTUFBTSxLQUFLLEtBQUssTUFBTSxFQUFFO0FBQUEsRUFDM0U7QUFBQSxFQUVBLEdBQU0sSUFBaUM7QUFDbkMsVUFBTUMsUUFBTyxJQUFJLFNBQVEsS0FBSyxVQUFVLEtBQUssS0FBSztBQUNsRCxJQUFBQSxNQUFLLGNBQWMsQ0FBQyxNQUFhLEdBQUcsS0FBSyxZQUFZLENBQUMsQ0FBQztBQUN2RCxXQUFPQTtBQUFBLEVBQ1g7QUFBQSxFQUVBLE1BQWE7QUFDVCxRQUFJLE9BQU8sS0FBSyxTQUFTLFFBQVE7QUFDN0IsYUFBTyxLQUFLLFlBQVksS0FBSyxTQUFTLElBQUksQ0FBQztBQUUvQyxRQUFJLE9BQU8sS0FBSyxVQUFVLFVBQVU7QUFDaEMsWUFBTSxTQUFTLE9BQU8sU0FBUyxLQUFLLEtBQUssQ0FBQztBQUMxQyxVQUFJLE9BQU8sS0FBSyxTQUFTLE1BQU0sTUFBTTtBQUNqQyxlQUFPLEtBQUssWUFBWSxLQUFLLFNBQVMsTUFBTSxFQUFFLENBQUM7QUFFbkQsYUFBTyxLQUFLLFlBQVksS0FBSyxTQUFTLEtBQUssS0FBSyxDQUFDO0FBQUEsSUFDckQ7QUFFQSxVQUFNLE1BQU0sOEJBQThCO0FBQUEsRUFDOUM7QUFBQSxFQUVBLFVBQVUsVUFBOEM7QUFDcEQsUUFBSSxPQUFPLEtBQUssU0FBUyxjQUFjLFlBQVk7QUFDL0MsYUFBTyxLQUFLLFNBQVMsVUFBVSxNQUFNO0FBQ2pDLGlCQUFTLEtBQUssSUFBSSxDQUFDO0FBQUEsTUFDdkIsQ0FBQztBQUFBLElBQ0wsV0FBVyxPQUFPLEtBQUssU0FBUyxZQUFZLFlBQVk7QUFDcEQsWUFBTSxTQUFTLFdBQVcsS0FBSyxLQUFLO0FBQ3BDLFlBQU0sS0FBSyxLQUFLLFNBQVMsUUFBUSxRQUFRLE1BQU07QUFDM0MsaUJBQVMsS0FBSyxJQUFJLENBQUM7QUFBQSxNQUN2QixDQUFDO0FBQ0QsYUFBTyxNQUFNO0FBQ1QsUUFBQyxLQUFLLFNBQVMsV0FBeUMsRUFBRTtBQUFBLE1BQzlEO0FBQUEsSUFDSjtBQUNBLFVBQU0sTUFBTSxHQUFHLEtBQUssUUFBUSxrQkFBa0I7QUFBQSxFQUNsRDtBQUNKO0FBRU8sSUFBTSxFQUFFLEtBQUssSUFBSTtBQUN4QixJQUFPLGtCQUFROzs7QUN4RmYsT0FBTyxXQUFXO0FBR1gsSUFBTSxPQUFPLE1BQU07QUFFbkIsU0FBUyxTQUFTQyxXQUFrQixVQUF1QjtBQUM5RCxTQUFPLE1BQU0sS0FBSyxTQUFTQSxXQUFVLE1BQU0sS0FBSyxXQUFXLENBQUM7QUFDaEU7OztBQ1BBLE9BQU9DLFlBQVc7QUFTWCxJQUFNLFVBQVVBLE9BQU07QUFVdEIsU0FBUyxXQUNaLFdBQ0EsUUFBa0MsT0FDbEMsUUFBa0MsVUFDcEM7QUFDRSxRQUFNLE9BQU8sTUFBTSxRQUFRLFNBQVMsS0FBSyxPQUFPLGNBQWM7QUFDOUQsUUFBTSxFQUFFLEtBQUssS0FBSyxJQUFJLElBQUk7QUFBQSxJQUN0QixLQUFLLE9BQU8sWUFBWSxVQUFVO0FBQUEsSUFDbEMsS0FBSyxPQUFPLFFBQVEsVUFBVSxPQUFPO0FBQUEsSUFDckMsS0FBSyxPQUFPLFFBQVEsVUFBVSxPQUFPO0FBQUEsRUFDekM7QUFFQSxRQUFNLE9BQU8sTUFBTSxRQUFRLEdBQUcsSUFDeEJBLE9BQU0sUUFBUSxZQUFZLEdBQUcsSUFDN0JBLE9BQU0sUUFBUSxXQUFXLEdBQUc7QUFFbEMsT0FBSyxRQUFRLFVBQVUsQ0FBQyxHQUFHLFdBQW1CLElBQUksTUFBTSxDQUFDO0FBQ3pELE9BQUssUUFBUSxVQUFVLENBQUMsR0FBRyxXQUFtQixJQUFJLE1BQU0sQ0FBQztBQUN6RCxTQUFPO0FBQ1g7QUFTTyxTQUFTLFVBQVUsS0FBeUM7QUFDL0QsU0FBTyxJQUFJLFFBQVEsQ0FBQyxTQUFTLFdBQVc7QUFDcEMsUUFBSSxNQUFNLFFBQVEsR0FBRyxHQUFHO0FBQ3BCLE1BQUFDLE9BQU0sUUFBUSxZQUFZLEtBQUssQ0FBQyxHQUFHLFFBQVE7QUFDdkMsWUFBSTtBQUNBLGtCQUFRQSxPQUFNLFFBQVEsbUJBQW1CLEdBQUcsQ0FBQztBQUFBLFFBQ2pELFNBQVMsT0FBTztBQUNaLGlCQUFPLEtBQUs7QUFBQSxRQUNoQjtBQUFBLE1BQ0osQ0FBQztBQUFBLElBQ0wsT0FBTztBQUNILE1BQUFBLE9BQU0sUUFBUSxXQUFXLEtBQUssQ0FBQyxHQUFHLFFBQVE7QUFDdEMsWUFBSTtBQUNBLGtCQUFRQSxPQUFNLFFBQVEsWUFBWSxHQUFHLENBQUM7QUFBQSxRQUMxQyxTQUFTLE9BQU87QUFDWixpQkFBTyxLQUFLO0FBQUEsUUFDaEI7QUFBQSxNQUNKLENBQUM7QUFBQSxJQUNMO0FBQUEsRUFDSixDQUFDO0FBQ0w7OztBSDlEQSxJQUFNLGtCQUFOLGNBQWlDLFNBQVM7QUFBQSxFQUM5QjtBQUFBLEVBQ0EsYUFBYyxRQUFRO0FBQUEsRUFFdEI7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUEsZUFBZTtBQUFBLEVBQ2Y7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFBQSxFQUNBO0FBQUEsRUFFUixZQUFZLE1BQVM7QUFDakIsVUFBTTtBQUNOLFNBQUssU0FBUztBQUNkLFNBQUssV0FBVyxJQUFJQyxPQUFNLGFBQWE7QUFDdkMsU0FBSyxTQUFTLFFBQVEsV0FBVyxNQUFNO0FBQ25DLFdBQUssVUFBVTtBQUNmLFdBQUssU0FBUztBQUFBLElBQ2xCLENBQUM7QUFDRCxTQUFLLFNBQVMsUUFBUSxTQUFTLENBQUMsR0FBRyxRQUFRLEtBQUssYUFBYSxHQUFHLENBQUM7QUFDakUsV0FBTyxJQUFJLE1BQU0sTUFBTTtBQUFBLE1BQ25CLE9BQU8sQ0FBQyxRQUFRLEdBQUcsU0FBUyxPQUFPLE1BQU0sS0FBSyxDQUFDLENBQUM7QUFBQSxJQUNwRCxDQUFDO0FBQUEsRUFDTDtBQUFBLEVBRVEsTUFBYSxXQUF5QztBQUMxRCxVQUFNLElBQUksZ0JBQVEsS0FBSyxJQUFJO0FBQzNCLFdBQU8sWUFBWSxFQUFFLEdBQUcsU0FBUyxJQUFJO0FBQUEsRUFDekM7QUFBQSxFQUVBLFdBQVc7QUFDUCxXQUFPLE9BQU8sWUFBWSxLQUFLLElBQUksQ0FBQyxHQUFHO0FBQUEsRUFDM0M7QUFBQSxFQUVBLE1BQVM7QUFBRSxXQUFPLEtBQUs7QUFBQSxFQUFPO0FBQUEsRUFDOUIsSUFBSSxPQUFVO0FBQ1YsUUFBSSxVQUFVLEtBQUssUUFBUTtBQUN2QixXQUFLLFNBQVM7QUFDZCxXQUFLLFNBQVMsS0FBSyxTQUFTO0FBQUEsSUFDaEM7QUFBQSxFQUNKO0FBQUEsRUFFQSxZQUFZO0FBQ1IsUUFBSSxLQUFLO0FBQ0w7QUFFSixRQUFJLEtBQUssUUFBUTtBQUNiLFdBQUssUUFBUSxTQUFTLEtBQUssY0FBYyxNQUFNO0FBQzNDLGNBQU0sSUFBSSxLQUFLLE9BQVEsS0FBSyxJQUFJLENBQUM7QUFDakMsWUFBSSxhQUFhLFNBQVM7QUFDdEIsWUFBRSxLQUFLLENBQUFDLE9BQUssS0FBSyxJQUFJQSxFQUFDLENBQUMsRUFDbEIsTUFBTSxTQUFPLEtBQUssU0FBUyxLQUFLLFNBQVMsR0FBRyxDQUFDO0FBQUEsUUFDdEQsT0FBTztBQUNILGVBQUssSUFBSSxDQUFDO0FBQUEsUUFDZDtBQUFBLE1BQ0osQ0FBQztBQUFBLElBQ0wsV0FBVyxLQUFLLFVBQVU7QUFDdEIsV0FBSyxRQUFRLFNBQVMsS0FBSyxjQUFjLE1BQU07QUFDM0Msa0JBQVUsS0FBSyxRQUFTLEVBQ25CLEtBQUssT0FBSyxLQUFLLElBQUksS0FBSyxjQUFlLEdBQUcsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQ3RELE1BQU0sU0FBTyxLQUFLLFNBQVMsS0FBSyxTQUFTLEdBQUcsQ0FBQztBQUFBLE1BQ3RELENBQUM7QUFBQSxJQUNMO0FBQUEsRUFDSjtBQUFBLEVBRUEsYUFBYTtBQUNULFFBQUksS0FBSztBQUNMO0FBRUosU0FBSyxTQUFTLFdBQVc7QUFBQSxNQUNyQixLQUFLLEtBQUs7QUFBQSxNQUNWLEtBQUssU0FBTyxLQUFLLElBQUksS0FBSyxlQUFnQixLQUFLLEtBQUssSUFBSSxDQUFDLENBQUM7QUFBQSxNQUMxRCxLQUFLLFNBQU8sS0FBSyxTQUFTLEtBQUssU0FBUyxHQUFHO0FBQUEsSUFDL0MsQ0FBQztBQUFBLEVBQ0w7QUFBQSxFQUVBLFdBQVc7QUFDUCxTQUFLLE9BQU8sT0FBTztBQUNuQixXQUFPLEtBQUs7QUFBQSxFQUNoQjtBQUFBLEVBRUEsWUFBWTtBQUNSLFNBQUssUUFBUSxLQUFLO0FBQ2xCLFdBQU8sS0FBSztBQUFBLEVBQ2hCO0FBQUEsRUFFQSxZQUFZO0FBQUUsV0FBTyxDQUFDLENBQUMsS0FBSztBQUFBLEVBQU07QUFBQSxFQUNsQyxhQUFhO0FBQUUsV0FBTyxDQUFDLENBQUMsS0FBSztBQUFBLEVBQU87QUFBQSxFQUVwQyxPQUFPO0FBQ0gsU0FBSyxTQUFTLEtBQUssU0FBUztBQUFBLEVBQ2hDO0FBQUEsRUFFQSxVQUFVLFVBQXNCO0FBQzVCLFNBQUssU0FBUyxRQUFRLFdBQVcsUUFBUTtBQUN6QyxXQUFPO0FBQUEsRUFDWDtBQUFBLEVBRUEsUUFBUSxVQUFpQztBQUNyQyxXQUFPLEtBQUs7QUFDWixTQUFLLFNBQVMsUUFBUSxTQUFTLENBQUMsR0FBRyxRQUFRLFNBQVMsR0FBRyxDQUFDO0FBQ3hELFdBQU87QUFBQSxFQUNYO0FBQUEsRUFFQSxVQUFVLFVBQThCO0FBQ3BDLFVBQU0sS0FBSyxLQUFLLFNBQVMsUUFBUSxXQUFXLE1BQU07QUFDOUMsZUFBUyxLQUFLLElBQUksQ0FBQztBQUFBLElBQ3ZCLENBQUM7QUFDRCxXQUFPLE1BQU0sS0FBSyxTQUFTLFdBQVcsRUFBRTtBQUFBLEVBQzVDO0FBQUEsRUFhQSxLQUNJQyxXQUNBLE1BQ0EsWUFBNEMsU0FBTyxLQUNyRDtBQUNFLFNBQUssU0FBUztBQUNkLFNBQUssZUFBZUE7QUFDcEIsU0FBSyxnQkFBZ0I7QUFDckIsUUFBSSxPQUFPLFNBQVMsWUFBWTtBQUM1QixXQUFLLFNBQVM7QUFDZCxhQUFPLEtBQUs7QUFBQSxJQUNoQixPQUFPO0FBQ0gsV0FBSyxXQUFXO0FBQ2hCLGFBQU8sS0FBSztBQUFBLElBQ2hCO0FBQ0EsU0FBSyxVQUFVO0FBQ2YsV0FBTztBQUFBLEVBQ1g7QUFBQSxFQUVBLE1BQ0ksTUFDQSxZQUE0QyxTQUFPLEtBQ3JEO0FBQ0UsU0FBSyxVQUFVO0FBQ2YsU0FBSyxZQUFZO0FBQ2pCLFNBQUssaUJBQWlCO0FBQ3RCLFNBQUssV0FBVztBQUNoQixXQUFPO0FBQUEsRUFDWDtBQUFBLEVBYUEsUUFDSSxNQUNBLFNBQ0EsVUFDRjtBQUNFLFVBQU0sSUFBSSxPQUFPLFlBQVksYUFBYSxVQUFVLGFBQWEsTUFBTSxLQUFLLElBQUk7QUFDaEYsVUFBTSxNQUFNLENBQUMsUUFBcUIsU0FBZ0IsS0FBSyxJQUFJLEVBQUUsS0FBSyxHQUFHLElBQUksQ0FBQztBQUUxRSxRQUFJLE1BQU0sUUFBUSxJQUFJLEdBQUc7QUFDckIsaUJBQVcsT0FBTyxNQUFNO0FBQ3BCLGNBQU0sQ0FBQyxHQUFHLENBQUMsSUFBSTtBQUNmLGNBQU0sS0FBSyxFQUFFLFFBQVEsR0FBRyxHQUFHO0FBQzNCLGFBQUssVUFBVSxNQUFNLEVBQUUsV0FBVyxFQUFFLENBQUM7QUFBQSxNQUN6QztBQUFBLElBQ0osT0FBTztBQUNILFVBQUksT0FBTyxZQUFZLFVBQVU7QUFDN0IsY0FBTSxLQUFLLEtBQUssUUFBUSxTQUFTLEdBQUc7QUFDcEMsYUFBSyxVQUFVLE1BQU0sS0FBSyxXQUFXLEVBQUUsQ0FBQztBQUFBLE1BQzVDO0FBQUEsSUFDSjtBQUVBLFdBQU87QUFBQSxFQUNYO0FBQUEsRUFFQSxPQUFPLE9BTUwsTUFBWSxLQUEyQixJQUFJLFNBQVMsTUFBc0I7QUFDeEUsVUFBTSxTQUFTLE1BQU0sR0FBRyxHQUFHLEtBQUssSUFBSSxPQUFLLEVBQUUsSUFBSSxDQUFDLENBQVM7QUFDekQsVUFBTSxVQUFVLElBQUksU0FBUyxPQUFPLENBQUM7QUFDckMsVUFBTSxTQUFTLEtBQUssSUFBSSxTQUFPLElBQUksVUFBVSxNQUFNLFFBQVEsSUFBSSxPQUFPLENBQUMsQ0FBQyxDQUFDO0FBQ3pFLFlBQVEsVUFBVSxNQUFNLE9BQU8sSUFBSSxXQUFTLE1BQU0sQ0FBQyxDQUFDO0FBQ3BELFdBQU87QUFBQSxFQUNYO0FBQ0o7QUFPTyxJQUFNLFdBQVcsSUFBSSxNQUFNLGlCQUF3QjtBQUFBLEVBQ3RELE9BQU8sQ0FBQyxJQUFJLElBQUksU0FBUyxJQUFJLGdCQUFnQixLQUFLLENBQUMsQ0FBQztBQUN4RCxDQUFDO0FBTU0sSUFBTSxFQUFFLE9BQU8sSUFBSTtBQUMxQixJQUFPLG1CQUFROzs7QUk5TlIsSUFBTSxvQkFBb0IsT0FBTyx3QkFBd0I7QUFDekQsSUFBTSxjQUFjLE9BQU8sd0JBQXdCO0FBRW5ELFNBQVMsY0FBYyxPQUFjO0FBQ3hDLFdBQVMsYUFBYSxNQUFhO0FBQy9CLFFBQUksSUFBSTtBQUNSLFdBQU8sTUFBTTtBQUFBLE1BQUksV0FBUyxpQkFBaUIsa0JBQ3JDLEtBQUssR0FBRyxJQUNSO0FBQUEsSUFDTjtBQUFBLEVBQ0o7QUFFQSxRQUFNLFdBQVcsTUFBTSxPQUFPLE9BQUssYUFBYSxlQUFPO0FBRXZELE1BQUksU0FBUyxXQUFXO0FBQ3BCLFdBQU87QUFFWCxNQUFJLFNBQVMsV0FBVztBQUNwQixXQUFPLFNBQVMsQ0FBQyxFQUFFLEdBQUcsU0FBUztBQUVuQyxTQUFPLGlCQUFTLE9BQU8sVUFBVSxTQUFTLEVBQUU7QUFDaEQ7QUFFTyxTQUFTLFFBQVEsS0FBVSxNQUFjLE9BQVk7QUFDeEQsTUFBSTtBQUNBLFVBQU0sU0FBUyxPQUFPLFNBQVMsSUFBSSxDQUFDO0FBQ3BDLFFBQUksT0FBTyxJQUFJLE1BQU0sTUFBTTtBQUN2QixhQUFPLElBQUksTUFBTSxFQUFFLEtBQUs7QUFFNUIsV0FBUSxJQUFJLElBQUksSUFBSTtBQUFBLEVBQ3hCLFNBQVMsT0FBTztBQUNaLFlBQVEsTUFBTSwyQkFBMkIsSUFBSSxRQUFRLEdBQUcsS0FBSyxLQUFLO0FBQUEsRUFDdEU7QUFDSjtBQU1PLFNBQVMsS0FDWixRQUNBLFFBQ0Esa0JBQ0EsVUFDRjtBQUNFLE1BQUksT0FBTyxPQUFPLFlBQVksY0FBYyxVQUFVO0FBQ2xELFVBQU0sS0FBSyxPQUFPLFFBQVEsa0JBQWtCLENBQUMsTUFBVyxTQUFvQjtBQUN4RSxhQUFPLFNBQVMsUUFBUSxHQUFHLElBQUk7QUFBQSxJQUNuQyxDQUFDO0FBQ0QsV0FBTyxRQUFRLFdBQVcsTUFBTTtBQUM1QixNQUFDLE9BQU8sV0FBeUMsRUFBRTtBQUFBLElBQ3ZELENBQUM7QUFBQSxFQUNMLFdBQVcsT0FBTyxPQUFPLGNBQWMsY0FBYyxPQUFPLHFCQUFxQixZQUFZO0FBQ3pGLFVBQU0sUUFBUSxPQUFPLFVBQVUsSUFBSSxTQUFvQjtBQUNuRCx1QkFBaUIsUUFBUSxHQUFHLElBQUk7QUFBQSxJQUNwQyxDQUFDO0FBQ0QsV0FBTyxRQUFRLFdBQVcsS0FBSztBQUFBLEVBQ25DO0FBQ0o7QUFFTyxTQUFTLFVBQXFGLFFBQWdCLFFBQWE7QUFFOUgsTUFBSSxFQUFFLE9BQU8sT0FBTyxXQUFXLENBQUMsR0FBRyxHQUFHLE1BQU0sSUFBSTtBQUVoRCxNQUFJLG9CQUFvQixpQkFBUztBQUM3QixlQUFXLENBQUMsUUFBUTtBQUFBLEVBQ3hCO0FBRUEsTUFBSSxPQUFPO0FBQ1AsYUFBUyxRQUFRLEtBQUs7QUFBQSxFQUMxQjtBQUdBLGFBQVcsQ0FBQyxLQUFLLEtBQUssS0FBSyxPQUFPLFFBQVEsS0FBSyxHQUFHO0FBQzlDLFFBQUksVUFBVSxRQUFXO0FBQ3JCLGFBQU8sTUFBTSxHQUFHO0FBQUEsSUFDcEI7QUFBQSxFQUNKO0FBR0EsUUFBTSxXQUEwQyxPQUMzQyxLQUFLLEtBQUssRUFDVixPQUFPLENBQUMsS0FBVSxTQUFTO0FBQ3hCLFFBQUksTUFBTSxJQUFJLGFBQWEsaUJBQVM7QUFDaEMsWUFBTSxVQUFVLE1BQU0sSUFBSTtBQUMxQixhQUFPLE1BQU0sSUFBSTtBQUNqQixhQUFPLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxPQUFPLENBQUM7QUFBQSxJQUNuQztBQUNBLFdBQU87QUFBQSxFQUNYLEdBQUcsQ0FBQyxDQUFDO0FBR1QsUUFBTSxhQUF3RCxPQUN6RCxLQUFLLEtBQUssRUFDVixPQUFPLENBQUMsS0FBVSxRQUFRO0FBQ3ZCLFFBQUksSUFBSSxXQUFXLElBQUksR0FBRztBQUN0QixZQUFNLE1BQU0sU0FBUyxHQUFHLEVBQUUsTUFBTSxHQUFHLEVBQUUsTUFBTSxDQUFDLEVBQUUsS0FBSyxHQUFHO0FBQ3RELFlBQU0sVUFBVSxNQUFNLEdBQUc7QUFDekIsYUFBTyxNQUFNLEdBQUc7QUFDaEIsYUFBTyxDQUFDLEdBQUcsS0FBSyxDQUFDLEtBQUssT0FBTyxDQUFDO0FBQUEsSUFDbEM7QUFDQSxXQUFPO0FBQUEsRUFDWCxHQUFHLENBQUMsQ0FBQztBQUdULFFBQU0saUJBQWlCLGNBQWMsU0FBUyxLQUFLLFFBQVEsQ0FBQztBQUM1RCxNQUFJLDBCQUEwQixpQkFBUztBQUNuQyxXQUFPLFdBQVcsRUFBRSxlQUFlLElBQUksQ0FBQztBQUN4QyxXQUFPLFFBQVEsV0FBVyxlQUFlLFVBQVUsQ0FBQyxNQUFNO0FBQ3RELGFBQU8sV0FBVyxFQUFFLENBQUM7QUFBQSxJQUN6QixDQUFDLENBQUM7QUFBQSxFQUNOLE9BQU87QUFDSCxRQUFJLGVBQWUsU0FBUyxHQUFHO0FBQzNCLGFBQU8sV0FBVyxFQUFFLGNBQWM7QUFBQSxJQUN0QztBQUFBLEVBQ0o7QUFHQSxhQUFXLENBQUMsUUFBUSxRQUFRLEtBQUssWUFBWTtBQUN6QyxVQUFNLE1BQU0sT0FBTyxXQUFXLFFBQVEsSUFDaEMsT0FBTyxRQUFRLEtBQUssSUFBSSxJQUN4QjtBQUVOLFFBQUksT0FBTyxhQUFhLFlBQVk7QUFDaEMsYUFBTyxRQUFRLEtBQUssUUFBUTtBQUFBLElBQ2hDLE9BQU87QUFDSCxhQUFPLFFBQVEsS0FBSyxNQUFNLFVBQVUsUUFBUSxFQUN2QyxLQUFLLEtBQUssRUFBRSxNQUFNLFFBQVEsS0FBSyxDQUFDO0FBQUEsSUFDekM7QUFBQSxFQUNKO0FBR0EsYUFBVyxDQUFDLE1BQU0sT0FBTyxLQUFLLFVBQVU7QUFDcEMsUUFBSSxTQUFTLFdBQVcsU0FBUyxZQUFZO0FBQ3pDLGFBQU8sUUFBUSxXQUFXLFFBQVEsVUFBVSxDQUFDLE1BQVc7QUFDcEQsZUFBTyxXQUFXLEVBQUUsQ0FBQztBQUFBLE1BQ3pCLENBQUMsQ0FBQztBQUFBLElBQ047QUFDQSxXQUFPLFFBQVEsV0FBVyxRQUFRLFVBQVUsQ0FBQyxNQUFXO0FBQ3BELGNBQVEsUUFBUSxNQUFNLENBQUM7QUFBQSxJQUMzQixDQUFDLENBQUM7QUFDRixZQUFRLFFBQVEsTUFBTSxRQUFRLElBQUksQ0FBQztBQUFBLEVBQ3ZDO0FBR0EsYUFBVyxDQUFDLEtBQUssS0FBSyxLQUFLLE9BQU8sUUFBUSxLQUFLLEdBQUc7QUFDOUMsUUFBSSxVQUFVLFFBQVc7QUFDckIsYUFBTyxNQUFNLEdBQUc7QUFBQSxJQUNwQjtBQUFBLEVBQ0o7QUFFQSxTQUFPLE9BQU8sUUFBUSxLQUFLO0FBQzNCLFVBQVEsTUFBTTtBQUNkLFNBQU87QUFDWDtBQUVBLFNBQVMsZ0JBQWdCLE1BQXVDO0FBQzVELFNBQU8sQ0FBQyxPQUFPLE9BQU8sTUFBTSxXQUFXO0FBQzNDO0FBRU8sU0FBUyxJQUNaQyxRQUNBLE1BQ0EsRUFBRSxVQUFVLEdBQUcsTUFBTSxHQUN2QjtBQUNFLGVBQWEsQ0FBQztBQUVkLE1BQUksQ0FBQyxNQUFNLFFBQVEsUUFBUTtBQUN2QixlQUFXLENBQUMsUUFBUTtBQUV4QixhQUFXLFNBQVMsT0FBTyxPQUFPO0FBRWxDLE1BQUksU0FBUyxXQUFXO0FBQ3BCLFVBQU0sUUFBUSxTQUFTLENBQUM7QUFBQSxXQUNuQixTQUFTLFNBQVM7QUFDdkIsVUFBTSxXQUFXO0FBRXJCLE1BQUksT0FBTyxTQUFTLFVBQVU7QUFDMUIsUUFBSSxnQkFBZ0JBLE9BQU0sSUFBSSxDQUFDO0FBQzNCLGFBQU9BLE9BQU0sSUFBSSxFQUFFLEtBQUs7QUFFNUIsV0FBTyxJQUFJQSxPQUFNLElBQUksRUFBRSxLQUFLO0FBQUEsRUFDaEM7QUFFQSxNQUFJLGdCQUFnQixJQUFJO0FBQ3BCLFdBQU8sS0FBSyxLQUFLO0FBRXJCLFNBQU8sSUFBSSxLQUFLLEtBQUs7QUFDekI7OztBQy9MQSxPQUFPQyxZQUFXO0FBQ2xCLE9BQU8sU0FBUztBQUVoQixPQUFPLGFBQWE7QUFNTCxTQUFSLFNBRUwsS0FBUSxVQUFVLElBQUksTUFBTTtBQUFBLEVBQzFCLE1BQU0sZUFBZSxJQUFJO0FBQUEsSUFDckIsSUFBSSxNQUFjO0FBQUUsYUFBT0MsT0FBTSxlQUFlLElBQUk7QUFBQSxJQUFFO0FBQUEsSUFDdEQsSUFBSSxJQUFJLEtBQWE7QUFBRSxNQUFBQSxPQUFNLGVBQWUsTUFBTSxHQUFHO0FBQUEsSUFBRTtBQUFBLElBQ3ZELFVBQWtCO0FBQUUsYUFBTyxLQUFLO0FBQUEsSUFBSTtBQUFBLElBQ3BDLFFBQVEsS0FBYTtBQUFFLFdBQUssTUFBTTtBQUFBLElBQUk7QUFBQSxJQUV0QyxJQUFJLFlBQW9CO0FBQUUsYUFBT0EsT0FBTSx1QkFBdUIsSUFBSSxFQUFFLEtBQUssR0FBRztBQUFBLElBQUU7QUFBQSxJQUM5RSxJQUFJLFVBQVUsV0FBbUI7QUFBRSxNQUFBQSxPQUFNLHVCQUF1QixNQUFNLFVBQVUsTUFBTSxLQUFLLENBQUM7QUFBQSxJQUFFO0FBQUEsSUFDOUYsaUJBQXlCO0FBQUUsYUFBTyxLQUFLO0FBQUEsSUFBVTtBQUFBLElBQ2pELGVBQWUsV0FBbUI7QUFBRSxXQUFLLFlBQVk7QUFBQSxJQUFVO0FBQUEsSUFFL0QsSUFBSSxTQUFpQjtBQUFFLGFBQU9BLE9BQU0sa0JBQWtCLElBQUk7QUFBQSxJQUFZO0FBQUEsSUFDdEUsSUFBSSxPQUFPLFFBQWdCO0FBQUUsTUFBQUEsT0FBTSxrQkFBa0IsTUFBTSxNQUFNO0FBQUEsSUFBRTtBQUFBLElBQ25FLGFBQXFCO0FBQUUsYUFBTyxLQUFLO0FBQUEsSUFBTztBQUFBLElBQzFDLFdBQVcsUUFBZ0I7QUFBRSxXQUFLLFNBQVM7QUFBQSxJQUFPO0FBQUEsSUFFbEQsSUFBSSxlQUF3QjtBQUFFLGFBQU9BLE9BQU0seUJBQXlCLElBQUk7QUFBQSxJQUFFO0FBQUEsSUFDMUUsSUFBSSxhQUFhLGNBQXVCO0FBQUUsTUFBQUEsT0FBTSx5QkFBeUIsTUFBTSxZQUFZO0FBQUEsSUFBRTtBQUFBLElBQzdGLG9CQUE2QjtBQUFFLGFBQU8sS0FBSztBQUFBLElBQWE7QUFBQSxJQUN4RCxrQkFBa0IsY0FBdUI7QUFBRSxXQUFLLGVBQWU7QUFBQSxJQUFhO0FBQUEsSUFHNUUsSUFBSSxvQkFBNkI7QUFBRSxhQUFPLEtBQUssaUJBQWlCO0FBQUEsSUFBRTtBQUFBLElBQ2xFLElBQUksa0JBQWtCLE9BQWdCO0FBQUUsV0FBSyxpQkFBaUIsSUFBSTtBQUFBLElBQU07QUFBQSxJQUV4RSxJQUFJLFlBQVksQ0FBQyxRQUFRLEtBQUssR0FBZ0I7QUFBRSxXQUFLLG9CQUFvQixRQUFRLEtBQUs7QUFBQSxJQUFFO0FBQUEsSUFDeEYsaUJBQWlCLGFBQTBCO0FBQUUsV0FBSyxjQUFjO0FBQUEsSUFBWTtBQUFBLElBRWxFLGNBQWlDO0FBQ3ZDLFVBQUksZ0JBQWdCLElBQUksS0FBSztBQUN6QixlQUFPLEtBQUssVUFBVSxJQUFJLENBQUMsS0FBSyxVQUFVLENBQUUsSUFBSSxDQUFDO0FBQUEsTUFDckQsV0FBVyxnQkFBZ0IsSUFBSSxXQUFXO0FBQ3RDLGVBQU8sS0FBSyxhQUFhO0FBQUEsTUFDN0I7QUFDQSxhQUFPLENBQUM7QUFBQSxJQUNaO0FBQUEsSUFFVSxZQUFZLFVBQWlCO0FBQ25DLGlCQUFXLFNBQVMsS0FBSyxRQUFRLEVBQUUsSUFBSSxRQUFNLGNBQWMsSUFBSSxTQUN6RCxLQUNBLElBQUksSUFBSSxNQUFNLEVBQUUsU0FBUyxNQUFNLE9BQU8sT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0FBRXpELFVBQUksZ0JBQWdCLElBQUksV0FBVztBQUMvQixtQkFBVyxNQUFNO0FBQ2IsZUFBSyxJQUFJLEVBQUU7QUFBQSxNQUNuQixPQUFPO0FBQ0gsY0FBTSxNQUFNLDJCQUEyQixLQUFLLFlBQVksSUFBSSxFQUFFO0FBQUEsTUFDbEU7QUFBQSxJQUNKO0FBQUEsSUFFQSxDQUFDLFdBQVcsRUFBRSxVQUFpQjtBQUUzQixVQUFJLGdCQUFnQixJQUFJLFdBQVc7QUFDL0IsbUJBQVcsTUFBTSxLQUFLLFlBQVksR0FBRztBQUNqQyxlQUFLLE9BQU8sRUFBRTtBQUNkLGNBQUksQ0FBQyxTQUFTLFNBQVMsRUFBRSxLQUFLLENBQUMsS0FBSztBQUNoQyxnQkFBSSxRQUFRO0FBQUEsUUFDcEI7QUFBQSxNQUNKO0FBR0EsV0FBSyxZQUFZLFFBQVE7QUFBQSxJQUM3QjtBQUFBLElBRUEsZ0JBQWdCLElBQVksT0FBTyxNQUFNO0FBQ3JDLE1BQUFBLE9BQU0seUJBQXlCLE1BQU0sSUFBSSxJQUFJO0FBQUEsSUFDakQ7QUFBQSxJQVdBLEtBQ0ksUUFDQSxrQkFDQSxVQUNGO0FBQ0UsV0FBSyxNQUFNLFFBQVEsa0JBQWtCLFFBQVE7QUFDN0MsYUFBTztBQUFBLElBQ1g7QUFBQSxJQUVBLGVBQWUsUUFBZTtBQUMxQixZQUFNO0FBQ04sWUFBTSxRQUFRLE9BQU8sQ0FBQyxLQUFLLENBQUM7QUFDNUIsWUFBTSxZQUFZO0FBQ2xCLGdCQUFVLE1BQU0sS0FBSztBQUFBLElBQ3pCO0FBQUEsRUFDSjtBQUVBLFVBQVEsY0FBYztBQUFBLElBQ2xCLFdBQVcsU0FBUyxPQUFPO0FBQUEsSUFDM0IsWUFBWTtBQUFBLE1BQ1IsY0FBYyxRQUFRLFVBQVU7QUFBQSxRQUM1QjtBQUFBLFFBQWM7QUFBQSxRQUFJO0FBQUEsUUFBSSxRQUFRLFdBQVc7QUFBQSxRQUFXO0FBQUEsTUFDeEQ7QUFBQSxNQUNBLE9BQU8sUUFBUSxVQUFVO0FBQUEsUUFDckI7QUFBQSxRQUFPO0FBQUEsUUFBSTtBQUFBLFFBQUksUUFBUSxXQUFXO0FBQUEsUUFBVztBQUFBLE1BQ2pEO0FBQUEsTUFDQSxVQUFVLFFBQVEsVUFBVTtBQUFBLFFBQ3hCO0FBQUEsUUFBVTtBQUFBLFFBQUk7QUFBQSxRQUFJLFFBQVEsV0FBVztBQUFBLFFBQVc7QUFBQSxNQUNwRDtBQUFBLE1BQ0EsaUJBQWlCLFFBQVEsVUFBVTtBQUFBLFFBQy9CO0FBQUEsUUFBaUI7QUFBQSxRQUFJO0FBQUEsUUFBSSxRQUFRLFdBQVc7QUFBQSxRQUFXO0FBQUEsTUFDM0Q7QUFBQSxNQUNBLHVCQUF1QixRQUFRLFVBQVU7QUFBQSxRQUNyQztBQUFBLFFBQXVCO0FBQUEsUUFBSTtBQUFBLFFBQUksUUFBUSxXQUFXO0FBQUEsUUFBVztBQUFBLE1BQ2pFO0FBQUEsSUFDSjtBQUFBLEVBQ0osR0FBRyxNQUFNO0FBRVQsU0FBTztBQUNYOzs7QUNqSUEsT0FBT0MsVUFBUztBQUNoQixPQUFPQyxZQUFXOzs7QUNLbEIsSUFBTUMsWUFBVyxDQUFDLFFBQWdCLElBQzdCLFFBQVEsbUJBQW1CLE9BQU8sRUFDbEMsV0FBVyxLQUFLLEdBQUcsRUFDbkIsWUFBWTtBQUVqQixlQUFlLFNBQVksS0FBOEJDLFFBQXVCO0FBQzVFLFNBQU8sSUFBSSxLQUFLLE9BQUtBLE9BQU0sRUFBRSxPQUFPLENBQUMsRUFBRSxNQUFNLE1BQU0sTUFBTTtBQUM3RDtBQUVBLFNBQVMsTUFBd0IsT0FBVSxNQUFnQztBQUN2RSxTQUFPLGVBQWUsT0FBTyxNQUFNO0FBQUEsSUFDL0IsTUFBTTtBQUFFLGFBQU8sS0FBSyxPQUFPRCxVQUFTLElBQUksQ0FBQyxFQUFFLEVBQUU7QUFBQSxJQUFFO0FBQUEsRUFDbkQsQ0FBQztBQUNMO0FBRUEsTUFBTSxTQUFTLE9BQU8sZ0JBQWdCLEdBQUcsQ0FBQyxFQUFFLE1BQU0sWUFBWSxNQUFNO0FBQ2hFLFFBQU0sS0FBSyxXQUFXLE1BQU07QUFDNUIsUUFBTSxZQUFZLFdBQVcsVUFBVTtBQUN2QyxRQUFNLFlBQVksV0FBVyxZQUFZO0FBQzdDLENBQUM7QUFFRCxNQUFNLFNBQVMsT0FBTyxtQkFBbUIsR0FBRyxDQUFDLEVBQUUsT0FBTyxNQUFNO0FBQ3hELFFBQU0sT0FBTyxXQUFXLFNBQVM7QUFDckMsQ0FBQztBQUVELE1BQU0sU0FBUyxPQUFPLHFCQUFxQixHQUFHLENBQUMsRUFBRSxTQUFTLFdBQVcsT0FBTyxNQUFNO0FBQzlFLFFBQU0sUUFBUSxXQUFXLE9BQU87QUFDaEMsUUFBTSxVQUFVLFdBQVcsVUFBVTtBQUNyQyxRQUFNLFVBQVUsV0FBVyxTQUFTO0FBQ3BDLFFBQU0sT0FBTyxXQUFXLE9BQU87QUFDbkMsQ0FBQztBQUVELE1BQU0sU0FBUyxPQUFPLG9CQUFvQixHQUFHLENBQUMsRUFBRSxVQUFVLFNBQVMsV0FBQUUsV0FBVSxNQUFNO0FBQy9FLFFBQU0sU0FBUyxXQUFXLFVBQVU7QUFDcEMsUUFBTSxTQUFTLFdBQVcsWUFBWTtBQUN0QyxRQUFNLFNBQVMsV0FBVyxTQUFTO0FBQ25DLFFBQU0sUUFBUSxXQUFXLGdCQUFnQjtBQUN6QyxRQUFNLFFBQVEsV0FBVyxpQkFBaUI7QUFDMUMsUUFBTUEsV0FBVSxXQUFXLFNBQVM7QUFDeEMsQ0FBQztBQUVELE1BQU0sU0FBUyxPQUFPLGlCQUFpQixHQUFHLENBQUMsRUFBRSxPQUFPLE9BQU8sTUFBTTtBQUM3RCxRQUFNLE1BQU0sV0FBVyxTQUFTO0FBQ2hDLFFBQU0sT0FBTyxXQUFXLHVCQUF1QjtBQUMvQyxRQUFNLE9BQU8sV0FBVyxxQkFBcUI7QUFDN0MsUUFBTSxPQUFPLFdBQVcsc0JBQXNCO0FBQzlDLFFBQU0sT0FBTyxXQUFXLG9CQUFvQjtBQUM1QyxRQUFNLE9BQU8sV0FBVyxVQUFVO0FBQ3RDLENBQUM7QUFFRCxNQUFNLFNBQVMsT0FBTyxtQkFBbUIsR0FBRyxDQUFDLEVBQUUsS0FBSyxNQUFNO0FBQ3RELFFBQU0sS0FBSyxXQUFXLGVBQWU7QUFDckMsUUFBTSxLQUFLLFdBQVcsY0FBYztBQUN4QyxDQUFDO0FBRUQsTUFBTSxTQUFTLE9BQU8sa0JBQWtCLEdBQUcsQ0FBQyxFQUFFLFFBQUFDLFNBQVEsYUFBYSxNQUFNO0FBQ3JFLFFBQU1BLFFBQU8sV0FBVyxlQUFlO0FBQ3ZDLFFBQU0sYUFBYSxXQUFXLFNBQVM7QUFDM0MsQ0FBQztBQUVELE1BQU0sU0FBUyxPQUFPLHlCQUF5QixHQUFHLENBQUMsRUFBRSxjQUFjLE1BQU07QUFDckUsUUFBTSxjQUFjLFdBQVcsU0FBUztBQUM1QyxDQUFDO0FBRUQsTUFBTSxTQUFTLE9BQU8sY0FBYyxHQUFHLENBQUMsRUFBRSxJQUFJLE9BQUFDLFFBQU8sTUFBTSxNQUFNO0FBQzdELFFBQU0sR0FBRyxXQUFXLFdBQVc7QUFDL0IsUUFBTSxHQUFHLFdBQVcsU0FBUztBQUM3QixRQUFNQSxPQUFNLFdBQVcsU0FBUztBQUNoQyxRQUFNQSxPQUFNLFdBQVcsV0FBVztBQUNsQyxRQUFNQSxPQUFNLFdBQVcsYUFBYTtBQUNwQyxRQUFNQSxPQUFNLFdBQVcsVUFBVTtBQUNqQyxRQUFNQSxPQUFNLFdBQVcsU0FBUztBQUNoQyxRQUFNLE1BQU0sV0FBVyxTQUFTO0FBQ2hDLFFBQU0sTUFBTSxXQUFXLFdBQVc7QUFDbEMsUUFBTSxNQUFNLFdBQVcsT0FBTztBQUM5QixRQUFNLE1BQU0sV0FBVyxTQUFTO0FBQ2hDLFFBQU0sTUFBTSxXQUFXLFNBQVM7QUFDcEMsQ0FBQzs7O0FDbEZELFNBQVMsMkJBQTJCO0FBQ3BDLFNBQVMsTUFBTSxtQkFBbUI7QUFDbEMsT0FBTyxRQUFRO0FBQ2YsT0FBT0MsY0FBYTtBQXdDYixTQUFTLE1BQU0sS0FBa0I7QUFDcEMsU0FBTyxJQUFLLE1BQU0sZ0JBQWdCLElBQUk7QUFBQSxJQUNsQyxPQUFPO0FBQUUsTUFBQUEsU0FBUSxjQUFjLEVBQUUsV0FBVyxVQUFVLEdBQUcsSUFBVztBQUFBLElBQUU7QUFBQSxJQUV0RSxLQUFLLE1BQTRCO0FBQzdCLGFBQU8sSUFBSSxRQUFRLENBQUMsS0FBSyxRQUFRO0FBQzdCLFlBQUk7QUFDQSxnQkFBTSxLQUFLLFNBQVM7QUFBQSwwQkFDZCxLQUFLLFNBQVMsR0FBRyxJQUFJLE9BQU8sVUFBVSxJQUFJLEdBQUc7QUFBQSx1QkFDaEQ7QUFDSCxhQUFHLEVBQUUsRUFBRSxLQUFLLEdBQUcsRUFBRSxNQUFNLEdBQUc7QUFBQSxRQUM5QixTQUFTLE9BQU87QUFDWixjQUFJLEtBQUs7QUFBQSxRQUNiO0FBQUEsTUFDSixDQUFDO0FBQUEsSUFDTDtBQUFBLElBRUE7QUFBQSxJQUVBLGNBQWMsS0FBYSxNQUFrQztBQUN6RCxVQUFJLE9BQU8sS0FBSyxtQkFBbUIsWUFBWTtBQUMzQyxhQUFLLGVBQWUsS0FBSyxDQUFDLGFBQWE7QUFDbkMsYUFBRztBQUFBLFlBQVc7QUFBQSxZQUFNLE9BQU8sUUFBUTtBQUFBLFlBQUcsQ0FBQyxHQUFHLFFBQ3RDLEdBQUcsa0JBQWtCLEdBQUc7QUFBQSxVQUM1QjtBQUFBLFFBQ0osQ0FBQztBQUFBLE1BQ0wsT0FBTztBQUNILGNBQU0sY0FBYyxLQUFLLElBQUk7QUFBQSxNQUNqQztBQUFBLElBQ0o7QUFBQSxJQUVBLFVBQVUsT0FBZSxRQUFRLE9BQU87QUFDcEMsWUFBTSxVQUFVLE9BQU8sS0FBSztBQUFBLElBQ2hDO0FBQUEsSUFFQSxLQUFLLE1BQXFCO0FBQ3RCLFlBQU0sS0FBSztBQUNYLFdBQUssUUFBUSxDQUFDO0FBQUEsSUFDbEI7QUFBQSxJQUVBLE1BQU0sRUFBRSxnQkFBZ0IsS0FBSyxNQUFNLE1BQU0sUUFBUSxPQUFPLEdBQUcsSUFBSSxJQUFZLENBQUMsR0FBRztBQUMzRSxZQUFNLE1BQU07QUFFWixpQkFBVyxNQUFNO0FBQ2IsY0FBTSxtQkFBbUIsSUFBSSxZQUFZLG1CQUFtQjtBQUM1RCxhQUFLLENBQUM7QUFBQSxNQUNWO0FBRUEsYUFBTyxPQUFPLE1BQU0sR0FBRztBQUN2QiwwQkFBb0IsSUFBSSxZQUFZO0FBRXBDLFdBQUssaUJBQWlCO0FBQ3RCLFVBQUksUUFBUSxZQUFZLE1BQU07QUFDMUIsZUFBTyxHQUFHLFdBQVc7QUFBQSxNQUN6QixDQUFDO0FBRUQsVUFBSTtBQUNBLFlBQUksZUFBZTtBQUFBLE1BQ3ZCLFNBQVMsT0FBTztBQUNaLGVBQU8sT0FBTyxTQUFPLEdBQUcsYUFBYSxJQUFJLGNBQWMsR0FBRyxHQUFJLEdBQUcsV0FBVztBQUFBLE1BQ2hGO0FBRUEsVUFBSTtBQUNBLGFBQUssVUFBVSxLQUFLLEtBQUs7QUFFN0IsVUFBSTtBQUNBLFlBQUksVUFBVSxLQUFLO0FBRXZCLGVBQVM7QUFDVCxVQUFJO0FBQ0EsWUFBSSxLQUFLO0FBRWIsVUFBSSxTQUFTLENBQUMsQ0FBQztBQUFBLElBQ25CO0FBQUEsRUFDSjtBQUNKOzs7QUZuSEFDLEtBQUksS0FBSyxJQUFJO0FBRWIsSUFBTyxjQUFRLE1BQU1DLE9BQU0sV0FBVzs7O0FHTHRDLE9BQU9DLFlBQVc7QUFDbEIsT0FBT0MsVUFBUztBQUNoQixPQUFPQyxjQUFhO0FBR3BCLFNBQVMsT0FBTyxVQUFpQjtBQUM3QixTQUFPLFNBQVMsS0FBSyxRQUFRLEVBQUUsSUFBSSxRQUFNLGNBQWNDLEtBQUksU0FDckQsS0FDQSxJQUFJQSxLQUFJLE1BQU0sRUFBRSxTQUFTLE1BQU0sT0FBTyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDN0Q7QUFHQSxPQUFPLGVBQWVDLE9BQU0sSUFBSSxXQUFXLFlBQVk7QUFBQSxFQUNuRCxNQUFNO0FBQUUsV0FBTyxLQUFLLGFBQWE7QUFBQSxFQUFFO0FBQUEsRUFDbkMsSUFBSSxHQUFHO0FBQUUsU0FBSyxhQUFhLENBQUM7QUFBQSxFQUFFO0FBQ2xDLENBQUM7QUFHTSxJQUFNLE1BQU4sY0FBa0IsU0FBU0EsT0FBTSxHQUFHLEVBQUU7QUFBQSxFQUN6QyxPQUFPO0FBQUUsSUFBQUMsU0FBUSxjQUFjLEVBQUUsV0FBVyxNQUFNLEdBQUcsSUFBSTtBQUFBLEVBQUU7QUFBQSxFQUMzRCxZQUFZLFVBQXFCLFVBQWdDO0FBQUUsVUFBTSxFQUFFLFVBQVUsR0FBRyxNQUFNLENBQVE7QUFBQSxFQUFFO0FBQUEsRUFDOUYsWUFBWSxVQUF1QjtBQUFFLFNBQUssYUFBYSxPQUFPLFFBQVEsQ0FBQztBQUFBLEVBQUU7QUFDdkY7QUFXTyxJQUFNLFNBQU4sY0FBcUIsU0FBU0QsT0FBTSxNQUFNLEVBQUU7QUFBQSxFQUMvQyxPQUFPO0FBQUUsSUFBQUMsU0FBUSxjQUFjLEVBQUUsV0FBVyxTQUFTLEdBQUcsSUFBSTtBQUFBLEVBQUU7QUFBQSxFQUM5RCxZQUFZLE9BQXFCLE9BQXVCO0FBQUUsVUFBTSxFQUFFLE9BQU8sR0FBRyxNQUFNLENBQVE7QUFBQSxFQUFFO0FBQ2hHO0FBSU8sSUFBTSxZQUFOLGNBQXdCLFNBQVNELE9BQU0sU0FBUyxFQUFFO0FBQUEsRUFDckQsT0FBTztBQUFFLElBQUFDLFNBQVEsY0FBYyxFQUFFLFdBQVcsWUFBWSxHQUFHLElBQUk7QUFBQSxFQUFFO0FBQUEsRUFDakUsWUFBWSxVQUEyQixVQUFnQztBQUFFLFVBQU0sRUFBRSxVQUFVLEdBQUcsTUFBTSxDQUFRO0FBQUEsRUFBRTtBQUFBLEVBQ3BHLFlBQVksVUFBdUI7QUFDekMsVUFBTSxLQUFLLE9BQU8sUUFBUTtBQUMxQixTQUFLLGNBQWMsR0FBRyxDQUFDLEtBQUssSUFBSUYsS0FBSTtBQUNwQyxTQUFLLGVBQWUsR0FBRyxDQUFDLEtBQUssSUFBSUEsS0FBSTtBQUNyQyxTQUFLLFlBQVksR0FBRyxDQUFDLEtBQUssSUFBSUEsS0FBSTtBQUFBLEVBQ3RDO0FBQ0o7QUFJTyxJQUFNLG1CQUFOLGNBQStCLFNBQVNDLE9BQU0sZ0JBQWdCLEVBQUU7QUFBQSxFQUNuRSxPQUFPO0FBQUUsSUFBQUMsU0FBUSxjQUFjLEVBQUUsV0FBVyxtQkFBbUIsR0FBRyxJQUFJO0FBQUEsRUFBRTtBQUFBLEVBQ3hFLFlBQVksT0FBK0IsT0FBdUI7QUFBRSxVQUFNLEVBQUUsT0FBTyxHQUFHLE1BQU0sQ0FBUTtBQUFBLEVBQUU7QUFDMUc7QUFNTyxJQUFNLGNBQU4sY0FBMEIsU0FBU0YsS0FBSSxXQUFXLEVBQUU7QUFBQSxFQUN2RCxPQUFPO0FBQUUsSUFBQUUsU0FBUSxjQUFjLEVBQUUsV0FBVyxjQUFjLEdBQUcsSUFBSTtBQUFBLEVBQUU7QUFBQSxFQUNuRSxZQUFZLE9BQTBCO0FBQUUsVUFBTSxLQUFZO0FBQUEsRUFBRTtBQUNoRTtBQU9PLElBQU0sUUFBTixjQUFvQixTQUFTRixLQUFJLEtBQUssRUFBRTtBQUFBLEVBQzNDLE9BQU87QUFBRSxJQUFBRSxTQUFRLGNBQWMsRUFBRSxXQUFXLFFBQVEsR0FBRyxJQUFJO0FBQUEsRUFBRTtBQUFBLEVBQzdELFlBQVksT0FBb0I7QUFBRSxVQUFNLEtBQVk7QUFBQSxFQUFFO0FBQzFEO0FBVU8sSUFBTSxXQUFOLGNBQXVCLFNBQVNELE9BQU0sUUFBUSxFQUFFO0FBQUEsRUFDbkQsT0FBTztBQUFFLElBQUFDLFNBQVEsY0FBYyxFQUFFLFdBQVcsV0FBVyxHQUFHLElBQUk7QUFBQSxFQUFFO0FBQUEsRUFDaEUsWUFBWSxPQUF1QixPQUF1QjtBQUFFLFVBQU0sRUFBRSxPQUFPLEdBQUcsTUFBTSxDQUFRO0FBQUEsRUFBRTtBQUNsRztBQU9PLElBQU0sT0FBTixjQUFtQixTQUFTRCxPQUFNLElBQUksRUFBRTtBQUFBLEVBQzNDLE9BQU87QUFBRSxJQUFBQyxTQUFRLGNBQWMsRUFBRSxXQUFXLE9BQU8sR0FBRyxJQUFJO0FBQUEsRUFBRTtBQUFBLEVBQzVELFlBQVksT0FBbUI7QUFBRSxVQUFNLEtBQVk7QUFBQSxFQUFFO0FBQ3pEO0FBSU8sSUFBTSxRQUFOLGNBQW9CLFNBQVNELE9BQU0sS0FBSyxFQUFFO0FBQUEsRUFDN0MsT0FBTztBQUFFLElBQUFDLFNBQVEsY0FBYyxFQUFFLFdBQVcsUUFBUSxHQUFHLElBQUk7QUFBQSxFQUFFO0FBQUEsRUFDN0QsWUFBWSxPQUFvQjtBQUFFLFVBQU0sS0FBWTtBQUFBLEVBQUU7QUFBQSxFQUM1QyxZQUFZLFVBQXVCO0FBQUUsU0FBSyxRQUFRLE9BQU8sUUFBUTtBQUFBLEVBQUU7QUFDakY7QUFJTyxJQUFNLFdBQU4sY0FBdUIsU0FBU0QsT0FBTSxRQUFRLEVBQUU7QUFBQSxFQUNuRCxPQUFPO0FBQUUsSUFBQUMsU0FBUSxjQUFjLEVBQUUsV0FBVyxXQUFXLEdBQUcsSUFBSTtBQUFBLEVBQUU7QUFBQSxFQUNoRSxZQUFZLE9BQXVCO0FBQUUsVUFBTSxLQUFZO0FBQUEsRUFBRTtBQUM3RDtBQU1PLElBQU0sYUFBTixjQUF5QixTQUFTRixLQUFJLFVBQVUsRUFBRTtBQUFBLEVBQ3JELE9BQU87QUFBRSxJQUFBRSxTQUFRLGNBQWMsRUFBRSxXQUFXLGFBQWEsR0FBRyxJQUFJO0FBQUEsRUFBRTtBQUFBLEVBQ2xFLFlBQVksT0FBeUIsT0FBdUI7QUFBRSxVQUFNLEVBQUUsT0FBTyxHQUFHLE1BQU0sQ0FBUTtBQUFBLEVBQUU7QUFDcEc7QUFHQSxPQUFPLGVBQWVELE9BQU0sUUFBUSxXQUFXLFlBQVk7QUFBQSxFQUN2RCxNQUFNO0FBQUUsV0FBTyxLQUFLLGFBQWE7QUFBQSxFQUFFO0FBQUEsRUFDbkMsSUFBSSxHQUFHO0FBQUUsU0FBSyxhQUFhLENBQUM7QUFBQSxFQUFFO0FBQ2xDLENBQUM7QUFHTSxJQUFNLFVBQU4sY0FBc0IsU0FBU0EsT0FBTSxPQUFPLEVBQUU7QUFBQSxFQUNqRCxPQUFPO0FBQUUsSUFBQUMsU0FBUSxjQUFjLEVBQUUsV0FBVyxVQUFVLEdBQUcsSUFBSTtBQUFBLEVBQUU7QUFBQSxFQUMvRCxZQUFZLFVBQXlCLFVBQWdDO0FBQUUsVUFBTSxFQUFFLFVBQVUsR0FBRyxNQUFNLENBQVE7QUFBQSxFQUFFO0FBQUEsRUFDbEcsWUFBWSxVQUF1QjtBQUN6QyxVQUFNLENBQUMsT0FBTyxHQUFHLFFBQVEsSUFBSSxPQUFPLFFBQVE7QUFDNUMsU0FBSyxVQUFVLEtBQUs7QUFDcEIsU0FBSyxhQUFhLFFBQVE7QUFBQSxFQUM5QjtBQUNKO0FBSU8sSUFBTSxXQUFOLGNBQXVCLFNBQVNGLEtBQUksUUFBUSxFQUFFO0FBQUEsRUFDakQsT0FBTztBQUFFLElBQUFFLFNBQVEsY0FBYyxFQUFFLFdBQVcsV0FBVyxHQUFHLElBQUk7QUFBQSxFQUFFO0FBQUEsRUFDaEUsWUFBWSxPQUF1QixPQUF1QjtBQUFFLFVBQU0sRUFBRSxPQUFPLEdBQUcsTUFBTSxDQUFRO0FBQUEsRUFBRTtBQUNsRztBQUlPLElBQU0sYUFBTixjQUF5QixTQUFTRCxPQUFNLFVBQVUsRUFBRTtBQUFBLEVBQ3ZELE9BQU87QUFBRSxJQUFBQyxTQUFRLGNBQWMsRUFBRSxXQUFXLGFBQWEsR0FBRyxJQUFJO0FBQUEsRUFBRTtBQUFBLEVBQ2xFLFlBQVksT0FBeUIsT0FBdUI7QUFBRSxVQUFNLEVBQUUsT0FBTyxHQUFHLE1BQU0sQ0FBUTtBQUFBLEVBQUU7QUFDcEc7QUFNTyxJQUFNLFNBQU4sY0FBcUIsU0FBU0QsT0FBTSxNQUFNLEVBQUU7QUFBQSxFQUMvQyxPQUFPO0FBQUUsSUFBQUMsU0FBUSxjQUFjLEVBQUUsV0FBVyxTQUFTLEdBQUcsSUFBSTtBQUFBLEVBQUU7QUFBQSxFQUM5RCxZQUFZLE9BQXFCO0FBQUUsVUFBTSxLQUFZO0FBQUEsRUFBRTtBQUMzRDtBQUlPLElBQU0sUUFBTixjQUFvQixTQUFTRCxPQUFNLEtBQUssRUFBRTtBQUFBLEVBQzdDLE9BQU87QUFBRSxJQUFBQyxTQUFRLGNBQWMsRUFBRSxXQUFXLFFBQVEsR0FBRyxJQUFJO0FBQUEsRUFBRTtBQUFBLEVBQzdELFlBQVksVUFBdUIsVUFBZ0M7QUFBRSxVQUFNLEVBQUUsVUFBVSxHQUFHLE1BQU0sQ0FBUTtBQUFBLEVBQUU7QUFBQSxFQUNoRyxZQUFZLFVBQXVCO0FBQUUsU0FBSyxhQUFhLE9BQU8sUUFBUSxDQUFDO0FBQUEsRUFBRTtBQUN2RjtBQUlPLElBQU0sU0FBTixjQUFxQixTQUFTRixLQUFJLE1BQU0sRUFBRTtBQUFBLEVBQzdDLE9BQU87QUFBRSxJQUFBRSxTQUFRLGNBQWMsRUFBRSxXQUFXLFNBQVMsR0FBRyxJQUFJO0FBQUEsRUFBRTtBQUFBLEVBQzlELFlBQVksT0FBcUI7QUFBRSxVQUFNLEtBQVk7QUFBQSxFQUFFO0FBQzNEO0FBSU8sSUFBTSxTQUFOLGNBQXFCLFNBQVNELE9BQU0sTUFBTSxFQUFFO0FBQUEsRUFDL0MsT0FBTztBQUFFLElBQUFDLFNBQVEsY0FBYyxFQUFFLFdBQVcsU0FBUyxHQUFHLElBQUk7QUFBQSxFQUFFO0FBQUEsRUFDOUQsWUFBWSxPQUFxQixPQUF1QjtBQUFFLFVBQU0sRUFBRSxPQUFPLEdBQUcsTUFBTSxDQUFRO0FBQUEsRUFBRTtBQUNoRzs7O0FDekxBLE9BQU9DLFlBQVc7QUFDbEIsT0FBTyxTQUFTO0FBSVQsU0FBUyxTQUFTLE1BQXNCO0FBQzNDLFNBQU9DLE9BQU0sVUFBVSxJQUFJLEtBQUs7QUFDcEM7QUFFTyxTQUFTLGNBQWMsTUFBK0I7QUFDekQsU0FBTyxJQUFJLFFBQVEsQ0FBQyxTQUFTLFdBQVc7QUFDcEMsSUFBQUEsT0FBTSxnQkFBZ0IsTUFBTSxDQUFDLEdBQUcsUUFBUTtBQUNwQyxVQUFJO0FBQ0EsZ0JBQVFBLE9BQU0saUJBQWlCLEdBQUcsS0FBSyxFQUFFO0FBQUEsTUFDN0MsU0FBUyxPQUFPO0FBQ1osZUFBTyxLQUFLO0FBQUEsTUFDaEI7QUFBQSxJQUNKLENBQUM7QUFBQSxFQUNMLENBQUM7QUFDTDtBQWtCTyxTQUFTLFlBQ1osTUFDQSxVQUNlO0FBQ2YsU0FBT0MsT0FBTSxhQUFhLE1BQU0sQ0FBQyxNQUFjLFVBQWdDO0FBQzNFLGFBQVMsTUFBTSxLQUFLO0FBQUEsRUFDeEIsQ0FBQztBQUNMOzs7QUMzQ0EsU0FBb0IsV0FBWEMsZ0JBQTBCOzs7QUNEbkMsT0FBT0MsY0FBYTtBQUVwQixTQUFvQixXQUFYQyxnQkFBdUI7QUFHaEMsSUFBTSxPQUFPLE9BQU8sTUFBTTtBQUMxQixJQUFNLE9BQU8sT0FBTyxNQUFNO0FBRTFCLElBQU0sRUFBRSxXQUFXLFdBQVcsSUFBSUM7QUFFbEMsSUFBTUMsWUFBVyxDQUFDLFFBQWdCLElBQzdCLFFBQVEsbUJBQW1CLE9BQU8sRUFDbEMsV0FBVyxLQUFLLEdBQUcsRUFDbkIsWUFBWTtBQTJCVixTQUFTLFNBQVMsVUFBb0IsQ0FBQyxHQUFHO0FBQzdDLFNBQU8sU0FBVSxLQUF5QjtBQUN0QyxVQUFNLElBQUksUUFBUTtBQUNsQixRQUFJLE9BQU8sTUFBTSxZQUFZLENBQUMsRUFBRSxXQUFXLGFBQWEsS0FBSyxDQUFDLEVBQUUsV0FBVyxTQUFTLEdBQUc7QUFFbkYsY0FBUSxXQUFXLElBQUksWUFBWSxFQUFFLE9BQU8sQ0FBQztBQUFBLElBQ2pEO0FBRUEsSUFBQUQsU0FBUSxjQUFjO0FBQUEsTUFDbEIsU0FBUyxFQUFFLEdBQUcsSUFBSSxJQUFJLEdBQUcsUUFBUTtBQUFBLE1BQ2pDLFlBQVksRUFBRSxHQUFHLElBQUksSUFBSSxHQUFHLFdBQVc7QUFBQSxNQUN2QyxHQUFHO0FBQUEsSUFDUCxHQUFHLEdBQUc7QUFFTixXQUFPLElBQUksSUFBSTtBQUFBLEVBQ25CO0FBQ0o7QUFFTyxTQUFTLFNBQVMsY0FBbUMsUUFBUTtBQUNoRSxTQUFPLFNBQVUsUUFBYSxNQUFXLE1BQTJCO0FBQ2hFLFdBQU8sWUFBWSxJQUFJLE1BQU0sQ0FBQztBQUM5QixXQUFPLFlBQVksSUFBSSxFQUFFLGVBQWUsQ0FBQztBQUV6QyxVQUFNLE9BQU9DLFVBQVMsSUFBSTtBQUUxQixRQUFJLENBQUMsTUFBTTtBQUNQLGFBQU8sZUFBZSxRQUFRLE1BQU07QUFBQSxRQUNoQyxNQUFNO0FBQ0YsaUJBQU8sS0FBSyxJQUFJLElBQUksSUFBSSxLQUFLLGFBQWEsV0FBVztBQUFBLFFBQ3pEO0FBQUEsUUFDQSxJQUFJLEdBQVE7QUFDUixjQUFJLE1BQU0sS0FBSyxJQUFJLEdBQUc7QUFDbEIsaUJBQUssSUFBSSxNQUFNLENBQUM7QUFDaEIsaUJBQUssSUFBSSxFQUFFLElBQUksSUFBSTtBQUNuQixpQkFBSyxPQUFPLElBQUk7QUFBQSxVQUNwQjtBQUFBLFFBQ0o7QUFBQSxNQUNKLENBQUM7QUFFRCxhQUFPLGVBQWUsUUFBUSxPQUFPLEtBQUssUUFBUSxLQUFLLEdBQUcsQ0FBQyxJQUFJO0FBQUEsUUFDM0QsTUFBTSxHQUFRO0FBQ1YsZUFBSyxJQUFJLElBQUk7QUFBQSxRQUNqQjtBQUFBLE1BQ0osQ0FBQztBQUVELGFBQU8sZUFBZSxRQUFRLE9BQU8sS0FBSyxRQUFRLEtBQUssR0FBRyxDQUFDLElBQUk7QUFBQSxRQUMzRCxRQUFRO0FBQ0osaUJBQU8sS0FBSyxJQUFJO0FBQUEsUUFDcEI7QUFBQSxNQUNKLENBQUM7QUFFRCxhQUFPLFlBQVksSUFBSSxFQUFFLFdBQVdBLFVBQVMsSUFBSSxDQUFDLElBQUksTUFBTSxNQUFNLFdBQVcsV0FBVyxXQUFXO0FBQUEsSUFDdkcsT0FBTztBQUNILFVBQUksUUFBUTtBQUNaLFVBQUksS0FBSyxJQUFLLFVBQVMsV0FBVztBQUNsQyxVQUFJLEtBQUssSUFBSyxVQUFTLFdBQVc7QUFFbEMsYUFBTyxZQUFZLElBQUksRUFBRSxXQUFXQSxVQUFTLElBQUksQ0FBQyxJQUFJLE1BQU0sTUFBTSxPQUFPLFdBQVc7QUFBQSxJQUN4RjtBQUFBLEVBQ0o7QUFDSjtBQW1EQSxTQUFTLE1BQU0sTUFBYyxPQUFlLGFBQWtDO0FBQzFFLE1BQUksdUJBQXVCO0FBQ3ZCLFdBQU87QUFFWCxVQUFRLGFBQWE7QUFBQSxJQUNqQixLQUFLO0FBQ0QsYUFBTyxVQUFVLE9BQU8sTUFBTSxJQUFJLElBQUksT0FBTyxFQUFFO0FBQUEsSUFDbkQsS0FBSztBQUNELGFBQU8sVUFBVSxPQUFPLE1BQU0sSUFBSSxJQUFJLE9BQU8sQ0FBQyxPQUFPLFdBQVcsT0FBTyxXQUFXLENBQUM7QUFBQSxJQUN2RixLQUFLO0FBQ0QsYUFBTyxVQUFVLFFBQVEsTUFBTSxJQUFJLElBQUksT0FBTyxLQUFLO0FBQUEsSUFDdkQsS0FBSztBQUNELGFBQU8sVUFBVSxTQUFTLE1BQU0sSUFBSSxJQUFJLEtBQUs7QUFBQSxJQUNqRDtBQUVJLGFBQU8sVUFBVSxPQUFPLE1BQU0sSUFBSSxJQUFJLE9BQU8sWUFBWSxNQUFNO0FBQUEsRUFDdkU7QUFDSjtBQUVBLFNBQVMsYUFBYSxhQUFrQztBQUNwRCxNQUFJLHVCQUF1QjtBQUN2QixXQUFPLFlBQVksa0JBQWtCO0FBRXpDLFVBQVEsYUFBYTtBQUFBLElBQ2pCLEtBQUs7QUFDRCxhQUFPO0FBQUEsSUFDWCxLQUFLO0FBQ0QsYUFBTztBQUFBLElBQ1gsS0FBSztBQUNELGFBQU87QUFBQSxJQUNYLEtBQUs7QUFBQSxJQUNMO0FBQ0ksYUFBTztBQUFBLEVBQ2Y7QUFDSjs7O0FDekxBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7OztBQ0FPLElBQUk7QUFBQSxDQUNWLFNBQVVDLE9BQU07QUFDYixFQUFBQSxNQUFLLGNBQWMsQ0FBQyxNQUFNO0FBQUEsRUFBRTtBQUM1QixXQUFTLFNBQVMsTUFBTTtBQUFBLEVBQUU7QUFDMUIsRUFBQUEsTUFBSyxXQUFXO0FBQ2hCLFdBQVMsWUFBWSxJQUFJO0FBQ3JCLFVBQU0sSUFBSSxNQUFNO0FBQUEsRUFDcEI7QUFDQSxFQUFBQSxNQUFLLGNBQWM7QUFDbkIsRUFBQUEsTUFBSyxjQUFjLENBQUMsVUFBVTtBQUMxQixVQUFNLE1BQU0sQ0FBQztBQUNiLGVBQVcsUUFBUSxPQUFPO0FBQ3RCLFVBQUksSUFBSSxJQUFJO0FBQUEsSUFDaEI7QUFDQSxXQUFPO0FBQUEsRUFDWDtBQUNBLEVBQUFBLE1BQUsscUJBQXFCLENBQUMsUUFBUTtBQUMvQixVQUFNLFlBQVlBLE1BQUssV0FBVyxHQUFHLEVBQUUsT0FBTyxDQUFDLE1BQU0sT0FBTyxJQUFJLElBQUksQ0FBQyxDQUFDLE1BQU0sUUFBUTtBQUNwRixVQUFNLFdBQVcsQ0FBQztBQUNsQixlQUFXLEtBQUssV0FBVztBQUN2QixlQUFTLENBQUMsSUFBSSxJQUFJLENBQUM7QUFBQSxJQUN2QjtBQUNBLFdBQU9BLE1BQUssYUFBYSxRQUFRO0FBQUEsRUFDckM7QUFDQSxFQUFBQSxNQUFLLGVBQWUsQ0FBQyxRQUFRO0FBQ3pCLFdBQU9BLE1BQUssV0FBVyxHQUFHLEVBQUUsSUFBSSxTQUFVLEdBQUc7QUFDekMsYUFBTyxJQUFJLENBQUM7QUFBQSxJQUNoQixDQUFDO0FBQUEsRUFDTDtBQUNBLEVBQUFBLE1BQUssYUFBYSxPQUFPLE9BQU8sU0FBUyxhQUNuQyxDQUFDLFFBQVEsT0FBTyxLQUFLLEdBQUcsSUFDeEIsQ0FBQyxXQUFXO0FBQ1YsVUFBTSxPQUFPLENBQUM7QUFDZCxlQUFXLE9BQU8sUUFBUTtBQUN0QixVQUFJLE9BQU8sVUFBVSxlQUFlLEtBQUssUUFBUSxHQUFHLEdBQUc7QUFDbkQsYUFBSyxLQUFLLEdBQUc7QUFBQSxNQUNqQjtBQUFBLElBQ0o7QUFDQSxXQUFPO0FBQUEsRUFDWDtBQUNKLEVBQUFBLE1BQUssT0FBTyxDQUFDLEtBQUssWUFBWTtBQUMxQixlQUFXLFFBQVEsS0FBSztBQUNwQixVQUFJLFFBQVEsSUFBSTtBQUNaLGVBQU87QUFBQSxJQUNmO0FBQ0EsV0FBTztBQUFBLEVBQ1g7QUFDQSxFQUFBQSxNQUFLLFlBQVksT0FBTyxPQUFPLGNBQWMsYUFDdkMsQ0FBQyxRQUFRLE9BQU8sVUFBVSxHQUFHLElBQzdCLENBQUMsUUFBUSxPQUFPLFFBQVEsWUFBWSxPQUFPLFNBQVMsR0FBRyxLQUFLLEtBQUssTUFBTSxHQUFHLE1BQU07QUFDdEYsV0FBUyxXQUFXLE9BQU8sWUFBWSxPQUFPO0FBQzFDLFdBQU8sTUFBTSxJQUFJLENBQUMsUUFBUyxPQUFPLFFBQVEsV0FBVyxJQUFJLEdBQUcsTUFBTSxHQUFJLEVBQUUsS0FBSyxTQUFTO0FBQUEsRUFDMUY7QUFDQSxFQUFBQSxNQUFLLGFBQWE7QUFDbEIsRUFBQUEsTUFBSyx3QkFBd0IsQ0FBQyxHQUFHLFVBQVU7QUFDdkMsUUFBSSxPQUFPLFVBQVUsVUFBVTtBQUMzQixhQUFPLE1BQU0sU0FBUztBQUFBLElBQzFCO0FBQ0EsV0FBTztBQUFBLEVBQ1g7QUFDSixHQUFHLFNBQVMsT0FBTyxDQUFDLEVBQUU7QUFDZixJQUFJO0FBQUEsQ0FDVixTQUFVQyxhQUFZO0FBQ25CLEVBQUFBLFlBQVcsY0FBYyxDQUFDLE9BQU8sV0FBVztBQUN4QyxXQUFPO0FBQUEsTUFDSCxHQUFHO0FBQUEsTUFDSCxHQUFHO0FBQUE7QUFBQSxJQUNQO0FBQUEsRUFDSjtBQUNKLEdBQUcsZUFBZSxhQUFhLENBQUMsRUFBRTtBQUMzQixJQUFNLGdCQUFnQixLQUFLLFlBQVk7QUFBQSxFQUMxQztBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFDSixDQUFDO0FBQ00sSUFBTSxnQkFBZ0IsQ0FBQyxTQUFTO0FBQ25DLFFBQU0sSUFBSSxPQUFPO0FBQ2pCLFVBQVEsR0FBRztBQUFBLElBQ1AsS0FBSztBQUNELGFBQU8sY0FBYztBQUFBLElBQ3pCLEtBQUs7QUFDRCxhQUFPLGNBQWM7QUFBQSxJQUN6QixLQUFLO0FBQ0QsYUFBTyxPQUFPLE1BQU0sSUFBSSxJQUFJLGNBQWMsTUFBTSxjQUFjO0FBQUEsSUFDbEUsS0FBSztBQUNELGFBQU8sY0FBYztBQUFBLElBQ3pCLEtBQUs7QUFDRCxhQUFPLGNBQWM7QUFBQSxJQUN6QixLQUFLO0FBQ0QsYUFBTyxjQUFjO0FBQUEsSUFDekIsS0FBSztBQUNELGFBQU8sY0FBYztBQUFBLElBQ3pCLEtBQUs7QUFDRCxVQUFJLE1BQU0sUUFBUSxJQUFJLEdBQUc7QUFDckIsZUFBTyxjQUFjO0FBQUEsTUFDekI7QUFDQSxVQUFJLFNBQVMsTUFBTTtBQUNmLGVBQU8sY0FBYztBQUFBLE1BQ3pCO0FBQ0EsVUFBSSxLQUFLLFFBQVEsT0FBTyxLQUFLLFNBQVMsY0FBYyxLQUFLLFNBQVMsT0FBTyxLQUFLLFVBQVUsWUFBWTtBQUNoRyxlQUFPLGNBQWM7QUFBQSxNQUN6QjtBQUNBLFVBQUksT0FBTyxRQUFRLGVBQWUsZ0JBQWdCLEtBQUs7QUFDbkQsZUFBTyxjQUFjO0FBQUEsTUFDekI7QUFDQSxVQUFJLE9BQU8sUUFBUSxlQUFlLGdCQUFnQixLQUFLO0FBQ25ELGVBQU8sY0FBYztBQUFBLE1BQ3pCO0FBQ0EsVUFBSSxPQUFPLFNBQVMsZUFBZSxnQkFBZ0IsTUFBTTtBQUNyRCxlQUFPLGNBQWM7QUFBQSxNQUN6QjtBQUNBLGFBQU8sY0FBYztBQUFBLElBQ3pCO0FBQ0ksYUFBTyxjQUFjO0FBQUEsRUFDN0I7QUFDSjs7O0FDbklPLElBQU0sZUFBZSxLQUFLLFlBQVk7QUFBQSxFQUN6QztBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUNKLENBQUM7QUFDTSxJQUFNLGdCQUFnQixDQUFDLFFBQVE7QUFDbEMsUUFBTSxPQUFPLEtBQUssVUFBVSxLQUFLLE1BQU0sQ0FBQztBQUN4QyxTQUFPLEtBQUssUUFBUSxlQUFlLEtBQUs7QUFDNUM7QUFDTyxJQUFNLFdBQU4sTUFBTSxrQkFBaUIsTUFBTTtBQUFBLEVBQ2hDLElBQUksU0FBUztBQUNULFdBQU8sS0FBSztBQUFBLEVBQ2hCO0FBQUEsRUFDQSxZQUFZLFFBQVE7QUFDaEIsVUFBTTtBQUNOLFNBQUssU0FBUyxDQUFDO0FBQ2YsU0FBSyxXQUFXLENBQUMsUUFBUTtBQUNyQixXQUFLLFNBQVMsQ0FBQyxHQUFHLEtBQUssUUFBUSxHQUFHO0FBQUEsSUFDdEM7QUFDQSxTQUFLLFlBQVksQ0FBQyxPQUFPLENBQUMsTUFBTTtBQUM1QixXQUFLLFNBQVMsQ0FBQyxHQUFHLEtBQUssUUFBUSxHQUFHLElBQUk7QUFBQSxJQUMxQztBQUNBLFVBQU0sY0FBYyxXQUFXO0FBQy9CLFFBQUksT0FBTyxnQkFBZ0I7QUFFdkIsYUFBTyxlQUFlLE1BQU0sV0FBVztBQUFBLElBQzNDLE9BQ0s7QUFDRCxXQUFLLFlBQVk7QUFBQSxJQUNyQjtBQUNBLFNBQUssT0FBTztBQUNaLFNBQUssU0FBUztBQUFBLEVBQ2xCO0FBQUEsRUFDQSxPQUFPLFNBQVM7QUFDWixVQUFNLFNBQVMsV0FDWCxTQUFVLE9BQU87QUFDYixhQUFPLE1BQU07QUFBQSxJQUNqQjtBQUNKLFVBQU0sY0FBYyxFQUFFLFNBQVMsQ0FBQyxFQUFFO0FBQ2xDLFVBQU0sZUFBZSxDQUFDLFVBQVU7QUFDNUIsaUJBQVcsU0FBUyxNQUFNLFFBQVE7QUFDOUIsWUFBSSxNQUFNLFNBQVMsaUJBQWlCO0FBQ2hDLGdCQUFNLFlBQVksSUFBSSxZQUFZO0FBQUEsUUFDdEMsV0FDUyxNQUFNLFNBQVMsdUJBQXVCO0FBQzNDLHVCQUFhLE1BQU0sZUFBZTtBQUFBLFFBQ3RDLFdBQ1MsTUFBTSxTQUFTLHFCQUFxQjtBQUN6Qyx1QkFBYSxNQUFNLGNBQWM7QUFBQSxRQUNyQyxXQUNTLE1BQU0sS0FBSyxXQUFXLEdBQUc7QUFDOUIsc0JBQVksUUFBUSxLQUFLLE9BQU8sS0FBSyxDQUFDO0FBQUEsUUFDMUMsT0FDSztBQUNELGNBQUksT0FBTztBQUNYLGNBQUksSUFBSTtBQUNSLGlCQUFPLElBQUksTUFBTSxLQUFLLFFBQVE7QUFDMUIsa0JBQU0sS0FBSyxNQUFNLEtBQUssQ0FBQztBQUN2QixrQkFBTSxXQUFXLE1BQU0sTUFBTSxLQUFLLFNBQVM7QUFDM0MsZ0JBQUksQ0FBQyxVQUFVO0FBQ1gsbUJBQUssRUFBRSxJQUFJLEtBQUssRUFBRSxLQUFLLEVBQUUsU0FBUyxDQUFDLEVBQUU7QUFBQSxZQVF6QyxPQUNLO0FBQ0QsbUJBQUssRUFBRSxJQUFJLEtBQUssRUFBRSxLQUFLLEVBQUUsU0FBUyxDQUFDLEVBQUU7QUFDckMsbUJBQUssRUFBRSxFQUFFLFFBQVEsS0FBSyxPQUFPLEtBQUssQ0FBQztBQUFBLFlBQ3ZDO0FBQ0EsbUJBQU8sS0FBSyxFQUFFO0FBQ2Q7QUFBQSxVQUNKO0FBQUEsUUFDSjtBQUFBLE1BQ0o7QUFBQSxJQUNKO0FBQ0EsaUJBQWEsSUFBSTtBQUNqQixXQUFPO0FBQUEsRUFDWDtBQUFBLEVBQ0EsT0FBTyxPQUFPLE9BQU87QUFDakIsUUFBSSxFQUFFLGlCQUFpQixZQUFXO0FBQzlCLFlBQU0sSUFBSSxNQUFNLG1CQUFtQixLQUFLLEVBQUU7QUFBQSxJQUM5QztBQUFBLEVBQ0o7QUFBQSxFQUNBLFdBQVc7QUFDUCxXQUFPLEtBQUs7QUFBQSxFQUNoQjtBQUFBLEVBQ0EsSUFBSSxVQUFVO0FBQ1YsV0FBTyxLQUFLLFVBQVUsS0FBSyxRQUFRLEtBQUssdUJBQXVCLENBQUM7QUFBQSxFQUNwRTtBQUFBLEVBQ0EsSUFBSSxVQUFVO0FBQ1YsV0FBTyxLQUFLLE9BQU8sV0FBVztBQUFBLEVBQ2xDO0FBQUEsRUFDQSxRQUFRLFNBQVMsQ0FBQyxVQUFVLE1BQU0sU0FBUztBQUN2QyxVQUFNLGNBQWMsQ0FBQztBQUNyQixVQUFNLGFBQWEsQ0FBQztBQUNwQixlQUFXLE9BQU8sS0FBSyxRQUFRO0FBQzNCLFVBQUksSUFBSSxLQUFLLFNBQVMsR0FBRztBQUNyQixjQUFNLFVBQVUsSUFBSSxLQUFLLENBQUM7QUFDMUIsb0JBQVksT0FBTyxJQUFJLFlBQVksT0FBTyxLQUFLLENBQUM7QUFDaEQsb0JBQVksT0FBTyxFQUFFLEtBQUssT0FBTyxHQUFHLENBQUM7QUFBQSxNQUN6QyxPQUNLO0FBQ0QsbUJBQVcsS0FBSyxPQUFPLEdBQUcsQ0FBQztBQUFBLE1BQy9CO0FBQUEsSUFDSjtBQUNBLFdBQU8sRUFBRSxZQUFZLFlBQVk7QUFBQSxFQUNyQztBQUFBLEVBQ0EsSUFBSSxhQUFhO0FBQ2IsV0FBTyxLQUFLLFFBQVE7QUFBQSxFQUN4QjtBQUNKO0FBQ0EsU0FBUyxTQUFTLENBQUMsV0FBVztBQUMxQixRQUFNLFFBQVEsSUFBSSxTQUFTLE1BQU07QUFDakMsU0FBTztBQUNYOzs7QUNsSUEsSUFBTSxXQUFXLENBQUMsT0FBTyxTQUFTO0FBQzlCLE1BQUk7QUFDSixVQUFRLE1BQU0sTUFBTTtBQUFBLElBQ2hCLEtBQUssYUFBYTtBQUNkLFVBQUksTUFBTSxhQUFhLGNBQWMsV0FBVztBQUM1QyxrQkFBVTtBQUFBLE1BQ2QsT0FDSztBQUNELGtCQUFVLFlBQVksTUFBTSxRQUFRLGNBQWMsTUFBTSxRQUFRO0FBQUEsTUFDcEU7QUFDQTtBQUFBLElBQ0osS0FBSyxhQUFhO0FBQ2QsZ0JBQVUsbUNBQW1DLEtBQUssVUFBVSxNQUFNLFVBQVUsS0FBSyxxQkFBcUIsQ0FBQztBQUN2RztBQUFBLElBQ0osS0FBSyxhQUFhO0FBQ2QsZ0JBQVUsa0NBQWtDLEtBQUssV0FBVyxNQUFNLE1BQU0sSUFBSSxDQUFDO0FBQzdFO0FBQUEsSUFDSixLQUFLLGFBQWE7QUFDZCxnQkFBVTtBQUNWO0FBQUEsSUFDSixLQUFLLGFBQWE7QUFDZCxnQkFBVSx5Q0FBeUMsS0FBSyxXQUFXLE1BQU0sT0FBTyxDQUFDO0FBQ2pGO0FBQUEsSUFDSixLQUFLLGFBQWE7QUFDZCxnQkFBVSxnQ0FBZ0MsS0FBSyxXQUFXLE1BQU0sT0FBTyxDQUFDLGVBQWUsTUFBTSxRQUFRO0FBQ3JHO0FBQUEsSUFDSixLQUFLLGFBQWE7QUFDZCxnQkFBVTtBQUNWO0FBQUEsSUFDSixLQUFLLGFBQWE7QUFDZCxnQkFBVTtBQUNWO0FBQUEsSUFDSixLQUFLLGFBQWE7QUFDZCxnQkFBVTtBQUNWO0FBQUEsSUFDSixLQUFLLGFBQWE7QUFDZCxVQUFJLE9BQU8sTUFBTSxlQUFlLFVBQVU7QUFDdEMsWUFBSSxjQUFjLE1BQU0sWUFBWTtBQUNoQyxvQkFBVSxnQ0FBZ0MsTUFBTSxXQUFXLFFBQVE7QUFDbkUsY0FBSSxPQUFPLE1BQU0sV0FBVyxhQUFhLFVBQVU7QUFDL0Msc0JBQVUsR0FBRyxPQUFPLHNEQUFzRCxNQUFNLFdBQVcsUUFBUTtBQUFBLFVBQ3ZHO0FBQUEsUUFDSixXQUNTLGdCQUFnQixNQUFNLFlBQVk7QUFDdkMsb0JBQVUsbUNBQW1DLE1BQU0sV0FBVyxVQUFVO0FBQUEsUUFDNUUsV0FDUyxjQUFjLE1BQU0sWUFBWTtBQUNyQyxvQkFBVSxpQ0FBaUMsTUFBTSxXQUFXLFFBQVE7QUFBQSxRQUN4RSxPQUNLO0FBQ0QsZUFBSyxZQUFZLE1BQU0sVUFBVTtBQUFBLFFBQ3JDO0FBQUEsTUFDSixXQUNTLE1BQU0sZUFBZSxTQUFTO0FBQ25DLGtCQUFVLFdBQVcsTUFBTSxVQUFVO0FBQUEsTUFDekMsT0FDSztBQUNELGtCQUFVO0FBQUEsTUFDZDtBQUNBO0FBQUEsSUFDSixLQUFLLGFBQWE7QUFDZCxVQUFJLE1BQU0sU0FBUztBQUNmLGtCQUFVLHNCQUFzQixNQUFNLFFBQVEsWUFBWSxNQUFNLFlBQVksYUFBYSxXQUFXLElBQUksTUFBTSxPQUFPO0FBQUEsZUFDaEgsTUFBTSxTQUFTO0FBQ3BCLGtCQUFVLHVCQUF1QixNQUFNLFFBQVEsWUFBWSxNQUFNLFlBQVksYUFBYSxNQUFNLElBQUksTUFBTSxPQUFPO0FBQUEsZUFDNUcsTUFBTSxTQUFTO0FBQ3BCLGtCQUFVLGtCQUFrQixNQUFNLFFBQVEsc0JBQXNCLE1BQU0sWUFBWSw4QkFBOEIsZUFBZSxHQUFHLE1BQU0sT0FBTztBQUFBLGVBQzFJLE1BQU0sU0FBUztBQUNwQixrQkFBVSxrQkFBa0IsTUFBTSxRQUFRLHNCQUFzQixNQUFNLFlBQVksOEJBQThCLGVBQWUsR0FBRyxNQUFNLE9BQU87QUFBQSxlQUMxSSxNQUFNLFNBQVM7QUFDcEIsa0JBQVUsZ0JBQWdCLE1BQU0sUUFBUSxzQkFBc0IsTUFBTSxZQUFZLDhCQUE4QixlQUFlLEdBQUcsSUFBSSxLQUFLLE9BQU8sTUFBTSxPQUFPLENBQUMsQ0FBQztBQUFBO0FBRS9KLGtCQUFVO0FBQ2Q7QUFBQSxJQUNKLEtBQUssYUFBYTtBQUNkLFVBQUksTUFBTSxTQUFTO0FBQ2Ysa0JBQVUsc0JBQXNCLE1BQU0sUUFBUSxZQUFZLE1BQU0sWUFBWSxZQUFZLFdBQVcsSUFBSSxNQUFNLE9BQU87QUFBQSxlQUMvRyxNQUFNLFNBQVM7QUFDcEIsa0JBQVUsdUJBQXVCLE1BQU0sUUFBUSxZQUFZLE1BQU0sWUFBWSxZQUFZLE9BQU8sSUFBSSxNQUFNLE9BQU87QUFBQSxlQUM1RyxNQUFNLFNBQVM7QUFDcEIsa0JBQVUsa0JBQWtCLE1BQU0sUUFBUSxZQUFZLE1BQU0sWUFBWSwwQkFBMEIsV0FBVyxJQUFJLE1BQU0sT0FBTztBQUFBLGVBQ3pILE1BQU0sU0FBUztBQUNwQixrQkFBVSxrQkFBa0IsTUFBTSxRQUFRLFlBQVksTUFBTSxZQUFZLDBCQUEwQixXQUFXLElBQUksTUFBTSxPQUFPO0FBQUEsZUFDekgsTUFBTSxTQUFTO0FBQ3BCLGtCQUFVLGdCQUFnQixNQUFNLFFBQVEsWUFBWSxNQUFNLFlBQVksNkJBQTZCLGNBQWMsSUFBSSxJQUFJLEtBQUssT0FBTyxNQUFNLE9BQU8sQ0FBQyxDQUFDO0FBQUE7QUFFcEosa0JBQVU7QUFDZDtBQUFBLElBQ0osS0FBSyxhQUFhO0FBQ2QsZ0JBQVU7QUFDVjtBQUFBLElBQ0osS0FBSyxhQUFhO0FBQ2QsZ0JBQVU7QUFDVjtBQUFBLElBQ0osS0FBSyxhQUFhO0FBQ2QsZ0JBQVUsZ0NBQWdDLE1BQU0sVUFBVTtBQUMxRDtBQUFBLElBQ0osS0FBSyxhQUFhO0FBQ2QsZ0JBQVU7QUFDVjtBQUFBLElBQ0o7QUFDSSxnQkFBVSxLQUFLO0FBQ2YsV0FBSyxZQUFZLEtBQUs7QUFBQSxFQUM5QjtBQUNBLFNBQU8sRUFBRSxRQUFRO0FBQ3JCO0FBQ0EsSUFBTyxhQUFROzs7QUMzR2YsSUFBSSxtQkFBbUI7QUFFaEIsU0FBUyxZQUFZLEtBQUs7QUFDN0IscUJBQW1CO0FBQ3ZCO0FBQ08sU0FBUyxjQUFjO0FBQzFCLFNBQU87QUFDWDs7O0FDTk8sSUFBTSxZQUFZLENBQUMsV0FBVztBQUNqQyxRQUFNLEVBQUUsTUFBTSxNQUFNLFdBQVcsVUFBVSxJQUFJO0FBQzdDLFFBQU0sV0FBVyxDQUFDLEdBQUcsTUFBTSxHQUFJLFVBQVUsUUFBUSxDQUFDLENBQUU7QUFDcEQsUUFBTSxZQUFZO0FBQUEsSUFDZCxHQUFHO0FBQUEsSUFDSCxNQUFNO0FBQUEsRUFDVjtBQUNBLE1BQUksVUFBVSxZQUFZLFFBQVc7QUFDakMsV0FBTztBQUFBLE1BQ0gsR0FBRztBQUFBLE1BQ0gsTUFBTTtBQUFBLE1BQ04sU0FBUyxVQUFVO0FBQUEsSUFDdkI7QUFBQSxFQUNKO0FBQ0EsTUFBSSxlQUFlO0FBQ25CLFFBQU0sT0FBTyxVQUNSLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQ2pCLE1BQU0sRUFDTixRQUFRO0FBQ2IsYUFBVyxPQUFPLE1BQU07QUFDcEIsbUJBQWUsSUFBSSxXQUFXLEVBQUUsTUFBTSxjQUFjLGFBQWEsQ0FBQyxFQUFFO0FBQUEsRUFDeEU7QUFDQSxTQUFPO0FBQUEsSUFDSCxHQUFHO0FBQUEsSUFDSCxNQUFNO0FBQUEsSUFDTixTQUFTO0FBQUEsRUFDYjtBQUNKO0FBQ08sSUFBTSxhQUFhLENBQUM7QUFDcEIsU0FBUyxrQkFBa0IsS0FBSyxXQUFXO0FBQzlDLFFBQU0sY0FBYyxZQUFZO0FBQ2hDLFFBQU0sUUFBUSxVQUFVO0FBQUEsSUFDcEI7QUFBQSxJQUNBLE1BQU0sSUFBSTtBQUFBLElBQ1YsTUFBTSxJQUFJO0FBQUEsSUFDVixXQUFXO0FBQUEsTUFDUCxJQUFJLE9BQU87QUFBQTtBQUFBLE1BQ1gsSUFBSTtBQUFBO0FBQUEsTUFDSjtBQUFBO0FBQUEsTUFDQSxnQkFBZ0IsYUFBa0IsU0FBWTtBQUFBO0FBQUEsSUFDbEQsRUFBRSxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztBQUFBLEVBQ3ZCLENBQUM7QUFDRCxNQUFJLE9BQU8sT0FBTyxLQUFLLEtBQUs7QUFDaEM7QUFDTyxJQUFNLGNBQU4sTUFBTSxhQUFZO0FBQUEsRUFDckIsY0FBYztBQUNWLFNBQUssUUFBUTtBQUFBLEVBQ2pCO0FBQUEsRUFDQSxRQUFRO0FBQ0osUUFBSSxLQUFLLFVBQVU7QUFDZixXQUFLLFFBQVE7QUFBQSxFQUNyQjtBQUFBLEVBQ0EsUUFBUTtBQUNKLFFBQUksS0FBSyxVQUFVO0FBQ2YsV0FBSyxRQUFRO0FBQUEsRUFDckI7QUFBQSxFQUNBLE9BQU8sV0FBVyxRQUFRLFNBQVM7QUFDL0IsVUFBTSxhQUFhLENBQUM7QUFDcEIsZUFBVyxLQUFLLFNBQVM7QUFDckIsVUFBSSxFQUFFLFdBQVc7QUFDYixlQUFPO0FBQ1gsVUFBSSxFQUFFLFdBQVc7QUFDYixlQUFPLE1BQU07QUFDakIsaUJBQVcsS0FBSyxFQUFFLEtBQUs7QUFBQSxJQUMzQjtBQUNBLFdBQU8sRUFBRSxRQUFRLE9BQU8sT0FBTyxPQUFPLFdBQVc7QUFBQSxFQUNyRDtBQUFBLEVBQ0EsYUFBYSxpQkFBaUIsUUFBUSxPQUFPO0FBQ3pDLFVBQU0sWUFBWSxDQUFDO0FBQ25CLGVBQVcsUUFBUSxPQUFPO0FBQ3RCLFlBQU0sTUFBTSxNQUFNLEtBQUs7QUFDdkIsWUFBTSxRQUFRLE1BQU0sS0FBSztBQUN6QixnQkFBVSxLQUFLO0FBQUEsUUFDWDtBQUFBLFFBQ0E7QUFBQSxNQUNKLENBQUM7QUFBQSxJQUNMO0FBQ0EsV0FBTyxhQUFZLGdCQUFnQixRQUFRLFNBQVM7QUFBQSxFQUN4RDtBQUFBLEVBQ0EsT0FBTyxnQkFBZ0IsUUFBUSxPQUFPO0FBQ2xDLFVBQU0sY0FBYyxDQUFDO0FBQ3JCLGVBQVcsUUFBUSxPQUFPO0FBQ3RCLFlBQU0sRUFBRSxLQUFLLE1BQU0sSUFBSTtBQUN2QixVQUFJLElBQUksV0FBVztBQUNmLGVBQU87QUFDWCxVQUFJLE1BQU0sV0FBVztBQUNqQixlQUFPO0FBQ1gsVUFBSSxJQUFJLFdBQVc7QUFDZixlQUFPLE1BQU07QUFDakIsVUFBSSxNQUFNLFdBQVc7QUFDakIsZUFBTyxNQUFNO0FBQ2pCLFVBQUksSUFBSSxVQUFVLGdCQUFnQixPQUFPLE1BQU0sVUFBVSxlQUFlLEtBQUssWUFBWTtBQUNyRixvQkFBWSxJQUFJLEtBQUssSUFBSSxNQUFNO0FBQUEsTUFDbkM7QUFBQSxJQUNKO0FBQ0EsV0FBTyxFQUFFLFFBQVEsT0FBTyxPQUFPLE9BQU8sWUFBWTtBQUFBLEVBQ3REO0FBQ0o7QUFDTyxJQUFNLFVBQVUsT0FBTyxPQUFPO0FBQUEsRUFDakMsUUFBUTtBQUNaLENBQUM7QUFDTSxJQUFNLFFBQVEsQ0FBQyxXQUFXLEVBQUUsUUFBUSxTQUFTLE1BQU07QUFDbkQsSUFBTSxLQUFLLENBQUMsV0FBVyxFQUFFLFFBQVEsU0FBUyxNQUFNO0FBQ2hELElBQU0sWUFBWSxDQUFDLE1BQU0sRUFBRSxXQUFXO0FBQ3RDLElBQU0sVUFBVSxDQUFDLE1BQU0sRUFBRSxXQUFXO0FBQ3BDLElBQU0sVUFBVSxDQUFDLE1BQU0sRUFBRSxXQUFXO0FBQ3BDLElBQU0sVUFBVSxDQUFDLE1BQU0sT0FBTyxZQUFZLGVBQWUsYUFBYTs7O0FDNUd0RSxJQUFJO0FBQUEsQ0FDVixTQUFVQyxZQUFXO0FBQ2xCLEVBQUFBLFdBQVUsV0FBVyxDQUFDLFlBQVksT0FBTyxZQUFZLFdBQVcsRUFBRSxRQUFRLElBQUksV0FBVyxDQUFDO0FBRTFGLEVBQUFBLFdBQVUsV0FBVyxDQUFDLFlBQVksT0FBTyxZQUFZLFdBQVcsVUFBVSxTQUFTO0FBQ3ZGLEdBQUcsY0FBYyxZQUFZLENBQUMsRUFBRTs7O0FDQWhDLElBQU0scUJBQU4sTUFBeUI7QUFBQSxFQUNyQixZQUFZLFFBQVEsT0FBTyxNQUFNLEtBQUs7QUFDbEMsU0FBSyxjQUFjLENBQUM7QUFDcEIsU0FBSyxTQUFTO0FBQ2QsU0FBSyxPQUFPO0FBQ1osU0FBSyxRQUFRO0FBQ2IsU0FBSyxPQUFPO0FBQUEsRUFDaEI7QUFBQSxFQUNBLElBQUksT0FBTztBQUNQLFFBQUksQ0FBQyxLQUFLLFlBQVksUUFBUTtBQUMxQixVQUFJLE1BQU0sUUFBUSxLQUFLLElBQUksR0FBRztBQUMxQixhQUFLLFlBQVksS0FBSyxHQUFHLEtBQUssT0FBTyxHQUFHLEtBQUssSUFBSTtBQUFBLE1BQ3JELE9BQ0s7QUFDRCxhQUFLLFlBQVksS0FBSyxHQUFHLEtBQUssT0FBTyxLQUFLLElBQUk7QUFBQSxNQUNsRDtBQUFBLElBQ0o7QUFDQSxXQUFPLEtBQUs7QUFBQSxFQUNoQjtBQUNKO0FBQ0EsSUFBTSxlQUFlLENBQUMsS0FBSyxXQUFXO0FBQ2xDLE1BQUksUUFBUSxNQUFNLEdBQUc7QUFDakIsV0FBTyxFQUFFLFNBQVMsTUFBTSxNQUFNLE9BQU8sTUFBTTtBQUFBLEVBQy9DLE9BQ0s7QUFDRCxRQUFJLENBQUMsSUFBSSxPQUFPLE9BQU8sUUFBUTtBQUMzQixZQUFNLElBQUksTUFBTSwyQ0FBMkM7QUFBQSxJQUMvRDtBQUNBLFdBQU87QUFBQSxNQUNILFNBQVM7QUFBQSxNQUNULElBQUksUUFBUTtBQUNSLFlBQUksS0FBSztBQUNMLGlCQUFPLEtBQUs7QUFDaEIsY0FBTSxRQUFRLElBQUksU0FBUyxJQUFJLE9BQU8sTUFBTTtBQUM1QyxhQUFLLFNBQVM7QUFDZCxlQUFPLEtBQUs7QUFBQSxNQUNoQjtBQUFBLElBQ0o7QUFBQSxFQUNKO0FBQ0o7QUFDQSxTQUFTLG9CQUFvQixRQUFRO0FBQ2pDLE1BQUksQ0FBQztBQUNELFdBQU8sQ0FBQztBQUNaLFFBQU0sRUFBRSxVQUFBQyxXQUFVLG9CQUFvQixnQkFBZ0IsWUFBWSxJQUFJO0FBQ3RFLE1BQUlBLGNBQWEsc0JBQXNCLGlCQUFpQjtBQUNwRCxVQUFNLElBQUksTUFBTSwwRkFBMEY7QUFBQSxFQUM5RztBQUNBLE1BQUlBO0FBQ0EsV0FBTyxFQUFFLFVBQVVBLFdBQVUsWUFBWTtBQUM3QyxRQUFNLFlBQVksQ0FBQyxLQUFLLFFBQVE7QUFDNUIsVUFBTSxFQUFFLFFBQVEsSUFBSTtBQUNwQixRQUFJLElBQUksU0FBUyxzQkFBc0I7QUFDbkMsYUFBTyxFQUFFLFNBQVMsV0FBVyxJQUFJLGFBQWE7QUFBQSxJQUNsRDtBQUNBLFFBQUksT0FBTyxJQUFJLFNBQVMsYUFBYTtBQUNqQyxhQUFPLEVBQUUsU0FBUyxXQUFXLGtCQUFrQixJQUFJLGFBQWE7QUFBQSxJQUNwRTtBQUNBLFFBQUksSUFBSSxTQUFTO0FBQ2IsYUFBTyxFQUFFLFNBQVMsSUFBSSxhQUFhO0FBQ3ZDLFdBQU8sRUFBRSxTQUFTLFdBQVcsc0JBQXNCLElBQUksYUFBYTtBQUFBLEVBQ3hFO0FBQ0EsU0FBTyxFQUFFLFVBQVUsV0FBVyxZQUFZO0FBQzlDO0FBQ08sSUFBTSxVQUFOLE1BQWM7QUFBQSxFQUNqQixJQUFJLGNBQWM7QUFDZCxXQUFPLEtBQUssS0FBSztBQUFBLEVBQ3JCO0FBQUEsRUFDQSxTQUFTLE9BQU87QUFDWixXQUFPLGNBQWMsTUFBTSxJQUFJO0FBQUEsRUFDbkM7QUFBQSxFQUNBLGdCQUFnQixPQUFPLEtBQUs7QUFDeEIsV0FBUSxPQUFPO0FBQUEsTUFDWCxRQUFRLE1BQU0sT0FBTztBQUFBLE1BQ3JCLE1BQU0sTUFBTTtBQUFBLE1BQ1osWUFBWSxjQUFjLE1BQU0sSUFBSTtBQUFBLE1BQ3BDLGdCQUFnQixLQUFLLEtBQUs7QUFBQSxNQUMxQixNQUFNLE1BQU07QUFBQSxNQUNaLFFBQVEsTUFBTTtBQUFBLElBQ2xCO0FBQUEsRUFDSjtBQUFBLEVBQ0Esb0JBQW9CLE9BQU87QUFDdkIsV0FBTztBQUFBLE1BQ0gsUUFBUSxJQUFJLFlBQVk7QUFBQSxNQUN4QixLQUFLO0FBQUEsUUFDRCxRQUFRLE1BQU0sT0FBTztBQUFBLFFBQ3JCLE1BQU0sTUFBTTtBQUFBLFFBQ1osWUFBWSxjQUFjLE1BQU0sSUFBSTtBQUFBLFFBQ3BDLGdCQUFnQixLQUFLLEtBQUs7QUFBQSxRQUMxQixNQUFNLE1BQU07QUFBQSxRQUNaLFFBQVEsTUFBTTtBQUFBLE1BQ2xCO0FBQUEsSUFDSjtBQUFBLEVBQ0o7QUFBQSxFQUNBLFdBQVcsT0FBTztBQUNkLFVBQU0sU0FBUyxLQUFLLE9BQU8sS0FBSztBQUNoQyxRQUFJLFFBQVEsTUFBTSxHQUFHO0FBQ2pCLFlBQU0sSUFBSSxNQUFNLHdDQUF3QztBQUFBLElBQzVEO0FBQ0EsV0FBTztBQUFBLEVBQ1g7QUFBQSxFQUNBLFlBQVksT0FBTztBQUNmLFVBQU0sU0FBUyxLQUFLLE9BQU8sS0FBSztBQUNoQyxXQUFPLFFBQVEsUUFBUSxNQUFNO0FBQUEsRUFDakM7QUFBQSxFQUNBLE1BQU0sTUFBTSxRQUFRO0FBQ2hCLFVBQU0sU0FBUyxLQUFLLFVBQVUsTUFBTSxNQUFNO0FBQzFDLFFBQUksT0FBTztBQUNQLGFBQU8sT0FBTztBQUNsQixVQUFNLE9BQU87QUFBQSxFQUNqQjtBQUFBLEVBQ0EsVUFBVSxNQUFNLFFBQVE7QUFDcEIsVUFBTSxNQUFNO0FBQUEsTUFDUixRQUFRO0FBQUEsUUFDSixRQUFRLENBQUM7QUFBQSxRQUNULE9BQU8sUUFBUSxTQUFTO0FBQUEsUUFDeEIsb0JBQW9CLFFBQVE7QUFBQSxNQUNoQztBQUFBLE1BQ0EsTUFBTSxRQUFRLFFBQVEsQ0FBQztBQUFBLE1BQ3ZCLGdCQUFnQixLQUFLLEtBQUs7QUFBQSxNQUMxQixRQUFRO0FBQUEsTUFDUjtBQUFBLE1BQ0EsWUFBWSxjQUFjLElBQUk7QUFBQSxJQUNsQztBQUNBLFVBQU0sU0FBUyxLQUFLLFdBQVcsRUFBRSxNQUFNLE1BQU0sSUFBSSxNQUFNLFFBQVEsSUFBSSxDQUFDO0FBQ3BFLFdBQU8sYUFBYSxLQUFLLE1BQU07QUFBQSxFQUNuQztBQUFBLEVBQ0EsWUFBWSxNQUFNO0FBQ2QsVUFBTSxNQUFNO0FBQUEsTUFDUixRQUFRO0FBQUEsUUFDSixRQUFRLENBQUM7QUFBQSxRQUNULE9BQU8sQ0FBQyxDQUFDLEtBQUssV0FBVyxFQUFFO0FBQUEsTUFDL0I7QUFBQSxNQUNBLE1BQU0sQ0FBQztBQUFBLE1BQ1AsZ0JBQWdCLEtBQUssS0FBSztBQUFBLE1BQzFCLFFBQVE7QUFBQSxNQUNSO0FBQUEsTUFDQSxZQUFZLGNBQWMsSUFBSTtBQUFBLElBQ2xDO0FBQ0EsUUFBSSxDQUFDLEtBQUssV0FBVyxFQUFFLE9BQU87QUFDMUIsVUFBSTtBQUNBLGNBQU0sU0FBUyxLQUFLLFdBQVcsRUFBRSxNQUFNLE1BQU0sQ0FBQyxHQUFHLFFBQVEsSUFBSSxDQUFDO0FBQzlELGVBQU8sUUFBUSxNQUFNLElBQ2Y7QUFBQSxVQUNFLE9BQU8sT0FBTztBQUFBLFFBQ2xCLElBQ0U7QUFBQSxVQUNFLFFBQVEsSUFBSSxPQUFPO0FBQUEsUUFDdkI7QUFBQSxNQUNSLFNBQ08sS0FBSztBQUNSLFlBQUksS0FBSyxTQUFTLFlBQVksR0FBRyxTQUFTLGFBQWEsR0FBRztBQUN0RCxlQUFLLFdBQVcsRUFBRSxRQUFRO0FBQUEsUUFDOUI7QUFDQSxZQUFJLFNBQVM7QUFBQSxVQUNULFFBQVEsQ0FBQztBQUFBLFVBQ1QsT0FBTztBQUFBLFFBQ1g7QUFBQSxNQUNKO0FBQUEsSUFDSjtBQUNBLFdBQU8sS0FBSyxZQUFZLEVBQUUsTUFBTSxNQUFNLENBQUMsR0FBRyxRQUFRLElBQUksQ0FBQyxFQUFFLEtBQUssQ0FBQyxXQUFXLFFBQVEsTUFBTSxJQUNsRjtBQUFBLE1BQ0UsT0FBTyxPQUFPO0FBQUEsSUFDbEIsSUFDRTtBQUFBLE1BQ0UsUUFBUSxJQUFJLE9BQU87QUFBQSxJQUN2QixDQUFDO0FBQUEsRUFDVDtBQUFBLEVBQ0EsTUFBTSxXQUFXLE1BQU0sUUFBUTtBQUMzQixVQUFNLFNBQVMsTUFBTSxLQUFLLGVBQWUsTUFBTSxNQUFNO0FBQ3JELFFBQUksT0FBTztBQUNQLGFBQU8sT0FBTztBQUNsQixVQUFNLE9BQU87QUFBQSxFQUNqQjtBQUFBLEVBQ0EsTUFBTSxlQUFlLE1BQU0sUUFBUTtBQUMvQixVQUFNLE1BQU07QUFBQSxNQUNSLFFBQVE7QUFBQSxRQUNKLFFBQVEsQ0FBQztBQUFBLFFBQ1Qsb0JBQW9CLFFBQVE7QUFBQSxRQUM1QixPQUFPO0FBQUEsTUFDWDtBQUFBLE1BQ0EsTUFBTSxRQUFRLFFBQVEsQ0FBQztBQUFBLE1BQ3ZCLGdCQUFnQixLQUFLLEtBQUs7QUFBQSxNQUMxQixRQUFRO0FBQUEsTUFDUjtBQUFBLE1BQ0EsWUFBWSxjQUFjLElBQUk7QUFBQSxJQUNsQztBQUNBLFVBQU0sbUJBQW1CLEtBQUssT0FBTyxFQUFFLE1BQU0sTUFBTSxJQUFJLE1BQU0sUUFBUSxJQUFJLENBQUM7QUFDMUUsVUFBTSxTQUFTLE9BQU8sUUFBUSxnQkFBZ0IsSUFBSSxtQkFBbUIsUUFBUSxRQUFRLGdCQUFnQjtBQUNyRyxXQUFPLGFBQWEsS0FBSyxNQUFNO0FBQUEsRUFDbkM7QUFBQSxFQUNBLE9BQU8sT0FBTyxTQUFTO0FBQ25CLFVBQU0scUJBQXFCLENBQUMsUUFBUTtBQUNoQyxVQUFJLE9BQU8sWUFBWSxZQUFZLE9BQU8sWUFBWSxhQUFhO0FBQy9ELGVBQU8sRUFBRSxRQUFRO0FBQUEsTUFDckIsV0FDUyxPQUFPLFlBQVksWUFBWTtBQUNwQyxlQUFPLFFBQVEsR0FBRztBQUFBLE1BQ3RCLE9BQ0s7QUFDRCxlQUFPO0FBQUEsTUFDWDtBQUFBLElBQ0o7QUFDQSxXQUFPLEtBQUssWUFBWSxDQUFDLEtBQUssUUFBUTtBQUNsQyxZQUFNLFNBQVMsTUFBTSxHQUFHO0FBQ3hCLFlBQU0sV0FBVyxNQUFNLElBQUksU0FBUztBQUFBLFFBQ2hDLE1BQU0sYUFBYTtBQUFBLFFBQ25CLEdBQUcsbUJBQW1CLEdBQUc7QUFBQSxNQUM3QixDQUFDO0FBQ0QsVUFBSSxPQUFPLFlBQVksZUFBZSxrQkFBa0IsU0FBUztBQUM3RCxlQUFPLE9BQU8sS0FBSyxDQUFDLFNBQVM7QUFDekIsY0FBSSxDQUFDLE1BQU07QUFDUCxxQkFBUztBQUNULG1CQUFPO0FBQUEsVUFDWCxPQUNLO0FBQ0QsbUJBQU87QUFBQSxVQUNYO0FBQUEsUUFDSixDQUFDO0FBQUEsTUFDTDtBQUNBLFVBQUksQ0FBQyxRQUFRO0FBQ1QsaUJBQVM7QUFDVCxlQUFPO0FBQUEsTUFDWCxPQUNLO0FBQ0QsZUFBTztBQUFBLE1BQ1g7QUFBQSxJQUNKLENBQUM7QUFBQSxFQUNMO0FBQUEsRUFDQSxXQUFXLE9BQU8sZ0JBQWdCO0FBQzlCLFdBQU8sS0FBSyxZQUFZLENBQUMsS0FBSyxRQUFRO0FBQ2xDLFVBQUksQ0FBQyxNQUFNLEdBQUcsR0FBRztBQUNiLFlBQUksU0FBUyxPQUFPLG1CQUFtQixhQUFhLGVBQWUsS0FBSyxHQUFHLElBQUksY0FBYztBQUM3RixlQUFPO0FBQUEsTUFDWCxPQUNLO0FBQ0QsZUFBTztBQUFBLE1BQ1g7QUFBQSxJQUNKLENBQUM7QUFBQSxFQUNMO0FBQUEsRUFDQSxZQUFZLFlBQVk7QUFDcEIsV0FBTyxJQUFJLFdBQVc7QUFBQSxNQUNsQixRQUFRO0FBQUEsTUFDUixVQUFVLHNCQUFzQjtBQUFBLE1BQ2hDLFFBQVEsRUFBRSxNQUFNLGNBQWMsV0FBVztBQUFBLElBQzdDLENBQUM7QUFBQSxFQUNMO0FBQUEsRUFDQSxZQUFZLFlBQVk7QUFDcEIsV0FBTyxLQUFLLFlBQVksVUFBVTtBQUFBLEVBQ3RDO0FBQUEsRUFDQSxZQUFZLEtBQUs7QUFFYixTQUFLLE1BQU0sS0FBSztBQUNoQixTQUFLLE9BQU87QUFDWixTQUFLLFFBQVEsS0FBSyxNQUFNLEtBQUssSUFBSTtBQUNqQyxTQUFLLFlBQVksS0FBSyxVQUFVLEtBQUssSUFBSTtBQUN6QyxTQUFLLGFBQWEsS0FBSyxXQUFXLEtBQUssSUFBSTtBQUMzQyxTQUFLLGlCQUFpQixLQUFLLGVBQWUsS0FBSyxJQUFJO0FBQ25ELFNBQUssTUFBTSxLQUFLLElBQUksS0FBSyxJQUFJO0FBQzdCLFNBQUssU0FBUyxLQUFLLE9BQU8sS0FBSyxJQUFJO0FBQ25DLFNBQUssYUFBYSxLQUFLLFdBQVcsS0FBSyxJQUFJO0FBQzNDLFNBQUssY0FBYyxLQUFLLFlBQVksS0FBSyxJQUFJO0FBQzdDLFNBQUssV0FBVyxLQUFLLFNBQVMsS0FBSyxJQUFJO0FBQ3ZDLFNBQUssV0FBVyxLQUFLLFNBQVMsS0FBSyxJQUFJO0FBQ3ZDLFNBQUssVUFBVSxLQUFLLFFBQVEsS0FBSyxJQUFJO0FBQ3JDLFNBQUssUUFBUSxLQUFLLE1BQU0sS0FBSyxJQUFJO0FBQ2pDLFNBQUssVUFBVSxLQUFLLFFBQVEsS0FBSyxJQUFJO0FBQ3JDLFNBQUssS0FBSyxLQUFLLEdBQUcsS0FBSyxJQUFJO0FBQzNCLFNBQUssTUFBTSxLQUFLLElBQUksS0FBSyxJQUFJO0FBQzdCLFNBQUssWUFBWSxLQUFLLFVBQVUsS0FBSyxJQUFJO0FBQ3pDLFNBQUssUUFBUSxLQUFLLE1BQU0sS0FBSyxJQUFJO0FBQ2pDLFNBQUssVUFBVSxLQUFLLFFBQVEsS0FBSyxJQUFJO0FBQ3JDLFNBQUssUUFBUSxLQUFLLE1BQU0sS0FBSyxJQUFJO0FBQ2pDLFNBQUssV0FBVyxLQUFLLFNBQVMsS0FBSyxJQUFJO0FBQ3ZDLFNBQUssT0FBTyxLQUFLLEtBQUssS0FBSyxJQUFJO0FBQy9CLFNBQUssV0FBVyxLQUFLLFNBQVMsS0FBSyxJQUFJO0FBQ3ZDLFNBQUssYUFBYSxLQUFLLFdBQVcsS0FBSyxJQUFJO0FBQzNDLFNBQUssYUFBYSxLQUFLLFdBQVcsS0FBSyxJQUFJO0FBQzNDLFNBQUssV0FBVyxJQUFJO0FBQUEsTUFDaEIsU0FBUztBQUFBLE1BQ1QsUUFBUTtBQUFBLE1BQ1IsVUFBVSxDQUFDLFNBQVMsS0FBSyxXQUFXLEVBQUUsSUFBSTtBQUFBLElBQzlDO0FBQUEsRUFDSjtBQUFBLEVBQ0EsV0FBVztBQUNQLFdBQU8sWUFBWSxPQUFPLE1BQU0sS0FBSyxJQUFJO0FBQUEsRUFDN0M7QUFBQSxFQUNBLFdBQVc7QUFDUCxXQUFPLFlBQVksT0FBTyxNQUFNLEtBQUssSUFBSTtBQUFBLEVBQzdDO0FBQUEsRUFDQSxVQUFVO0FBQ04sV0FBTyxLQUFLLFNBQVMsRUFBRSxTQUFTO0FBQUEsRUFDcEM7QUFBQSxFQUNBLFFBQVE7QUFDSixXQUFPLFNBQVMsT0FBTyxJQUFJO0FBQUEsRUFDL0I7QUFBQSxFQUNBLFVBQVU7QUFDTixXQUFPLFdBQVcsT0FBTyxNQUFNLEtBQUssSUFBSTtBQUFBLEVBQzVDO0FBQUEsRUFDQSxHQUFHLFFBQVE7QUFDUCxXQUFPLFNBQVMsT0FBTyxDQUFDLE1BQU0sTUFBTSxHQUFHLEtBQUssSUFBSTtBQUFBLEVBQ3BEO0FBQUEsRUFDQSxJQUFJLFVBQVU7QUFDVixXQUFPLGdCQUFnQixPQUFPLE1BQU0sVUFBVSxLQUFLLElBQUk7QUFBQSxFQUMzRDtBQUFBLEVBQ0EsVUFBVSxXQUFXO0FBQ2pCLFdBQU8sSUFBSSxXQUFXO0FBQUEsTUFDbEIsR0FBRyxvQkFBb0IsS0FBSyxJQUFJO0FBQUEsTUFDaEMsUUFBUTtBQUFBLE1BQ1IsVUFBVSxzQkFBc0I7QUFBQSxNQUNoQyxRQUFRLEVBQUUsTUFBTSxhQUFhLFVBQVU7QUFBQSxJQUMzQyxDQUFDO0FBQUEsRUFDTDtBQUFBLEVBQ0EsUUFBUSxLQUFLO0FBQ1QsVUFBTSxtQkFBbUIsT0FBTyxRQUFRLGFBQWEsTUFBTSxNQUFNO0FBQ2pFLFdBQU8sSUFBSSxXQUFXO0FBQUEsTUFDbEIsR0FBRyxvQkFBb0IsS0FBSyxJQUFJO0FBQUEsTUFDaEMsV0FBVztBQUFBLE1BQ1gsY0FBYztBQUFBLE1BQ2QsVUFBVSxzQkFBc0I7QUFBQSxJQUNwQyxDQUFDO0FBQUEsRUFDTDtBQUFBLEVBQ0EsUUFBUTtBQUNKLFdBQU8sSUFBSSxXQUFXO0FBQUEsTUFDbEIsVUFBVSxzQkFBc0I7QUFBQSxNQUNoQyxNQUFNO0FBQUEsTUFDTixHQUFHLG9CQUFvQixLQUFLLElBQUk7QUFBQSxJQUNwQyxDQUFDO0FBQUEsRUFDTDtBQUFBLEVBQ0EsTUFBTSxLQUFLO0FBQ1AsVUFBTSxpQkFBaUIsT0FBTyxRQUFRLGFBQWEsTUFBTSxNQUFNO0FBQy9ELFdBQU8sSUFBSSxTQUFTO0FBQUEsTUFDaEIsR0FBRyxvQkFBb0IsS0FBSyxJQUFJO0FBQUEsTUFDaEMsV0FBVztBQUFBLE1BQ1gsWUFBWTtBQUFBLE1BQ1osVUFBVSxzQkFBc0I7QUFBQSxJQUNwQyxDQUFDO0FBQUEsRUFDTDtBQUFBLEVBQ0EsU0FBUyxhQUFhO0FBQ2xCLFVBQU0sT0FBTyxLQUFLO0FBQ2xCLFdBQU8sSUFBSSxLQUFLO0FBQUEsTUFDWixHQUFHLEtBQUs7QUFBQSxNQUNSO0FBQUEsSUFDSixDQUFDO0FBQUEsRUFDTDtBQUFBLEVBQ0EsS0FBSyxRQUFRO0FBQ1QsV0FBTyxZQUFZLE9BQU8sTUFBTSxNQUFNO0FBQUEsRUFDMUM7QUFBQSxFQUNBLFdBQVc7QUFDUCxXQUFPLFlBQVksT0FBTyxJQUFJO0FBQUEsRUFDbEM7QUFBQSxFQUNBLGFBQWE7QUFDVCxXQUFPLEtBQUssVUFBVSxNQUFTLEVBQUU7QUFBQSxFQUNyQztBQUFBLEVBQ0EsYUFBYTtBQUNULFdBQU8sS0FBSyxVQUFVLElBQUksRUFBRTtBQUFBLEVBQ2hDO0FBQ0o7QUFDQSxJQUFNLFlBQVk7QUFDbEIsSUFBTSxhQUFhO0FBQ25CLElBQU0sWUFBWTtBQUdsQixJQUFNLFlBQVk7QUFDbEIsSUFBTSxjQUFjO0FBQ3BCLElBQU0sV0FBVztBQUNqQixJQUFNLGdCQUFnQjtBQWF0QixJQUFNLGFBQWE7QUFJbkIsSUFBTSxjQUFjO0FBQ3BCLElBQUk7QUFFSixJQUFNLFlBQVk7QUFDbEIsSUFBTSxnQkFBZ0I7QUFHdEIsSUFBTSxZQUFZO0FBQ2xCLElBQU0sZ0JBQWdCO0FBRXRCLElBQU0sY0FBYztBQUVwQixJQUFNLGlCQUFpQjtBQU12QixJQUFNLGtCQUFrQjtBQUN4QixJQUFNLFlBQVksSUFBSSxPQUFPLElBQUksZUFBZSxHQUFHO0FBQ25ELFNBQVMsZ0JBQWdCLE1BQU07QUFDM0IsTUFBSSxxQkFBcUI7QUFDekIsTUFBSSxLQUFLLFdBQVc7QUFDaEIseUJBQXFCLEdBQUcsa0JBQWtCLFVBQVUsS0FBSyxTQUFTO0FBQUEsRUFDdEUsV0FDUyxLQUFLLGFBQWEsTUFBTTtBQUM3Qix5QkFBcUIsR0FBRyxrQkFBa0I7QUFBQSxFQUM5QztBQUNBLFFBQU0sb0JBQW9CLEtBQUssWUFBWSxNQUFNO0FBQ2pELFNBQU8sOEJBQThCLGtCQUFrQixJQUFJLGlCQUFpQjtBQUNoRjtBQUNBLFNBQVMsVUFBVSxNQUFNO0FBQ3JCLFNBQU8sSUFBSSxPQUFPLElBQUksZ0JBQWdCLElBQUksQ0FBQyxHQUFHO0FBQ2xEO0FBRU8sU0FBUyxjQUFjLE1BQU07QUFDaEMsTUFBSSxRQUFRLEdBQUcsZUFBZSxJQUFJLGdCQUFnQixJQUFJLENBQUM7QUFDdkQsUUFBTSxPQUFPLENBQUM7QUFDZCxPQUFLLEtBQUssS0FBSyxRQUFRLE9BQU8sR0FBRztBQUNqQyxNQUFJLEtBQUs7QUFDTCxTQUFLLEtBQUssc0JBQXNCO0FBQ3BDLFVBQVEsR0FBRyxLQUFLLElBQUksS0FBSyxLQUFLLEdBQUcsQ0FBQztBQUNsQyxTQUFPLElBQUksT0FBTyxJQUFJLEtBQUssR0FBRztBQUNsQztBQUNBLFNBQVMsVUFBVSxJQUFJLFNBQVM7QUFDNUIsT0FBSyxZQUFZLFFBQVEsQ0FBQyxZQUFZLFVBQVUsS0FBSyxFQUFFLEdBQUc7QUFDdEQsV0FBTztBQUFBLEVBQ1g7QUFDQSxPQUFLLFlBQVksUUFBUSxDQUFDLFlBQVksVUFBVSxLQUFLLEVBQUUsR0FBRztBQUN0RCxXQUFPO0FBQUEsRUFDWDtBQUNBLFNBQU87QUFDWDtBQUNBLFNBQVMsV0FBVyxLQUFLLEtBQUs7QUFDMUIsTUFBSSxDQUFDLFNBQVMsS0FBSyxHQUFHO0FBQ2xCLFdBQU87QUFDWCxNQUFJO0FBQ0EsVUFBTSxDQUFDLE1BQU0sSUFBSSxJQUFJLE1BQU0sR0FBRztBQUM5QixRQUFJLENBQUM7QUFDRCxhQUFPO0FBRVgsVUFBTSxTQUFTLE9BQ1YsUUFBUSxNQUFNLEdBQUcsRUFDakIsUUFBUSxNQUFNLEdBQUcsRUFDakIsT0FBTyxPQUFPLFVBQVcsSUFBSyxPQUFPLFNBQVMsS0FBTSxHQUFJLEdBQUc7QUFDaEUsVUFBTSxVQUFVLEtBQUssTUFBTSxLQUFLLE1BQU0sQ0FBQztBQUN2QyxRQUFJLE9BQU8sWUFBWSxZQUFZLFlBQVk7QUFDM0MsYUFBTztBQUNYLFFBQUksU0FBUyxXQUFXLFNBQVMsUUFBUTtBQUNyQyxhQUFPO0FBQ1gsUUFBSSxDQUFDLFFBQVE7QUFDVCxhQUFPO0FBQ1gsUUFBSSxPQUFPLFFBQVEsUUFBUTtBQUN2QixhQUFPO0FBQ1gsV0FBTztBQUFBLEVBQ1gsUUFDTTtBQUNGLFdBQU87QUFBQSxFQUNYO0FBQ0o7QUFDQSxTQUFTLFlBQVksSUFBSSxTQUFTO0FBQzlCLE9BQUssWUFBWSxRQUFRLENBQUMsWUFBWSxjQUFjLEtBQUssRUFBRSxHQUFHO0FBQzFELFdBQU87QUFBQSxFQUNYO0FBQ0EsT0FBSyxZQUFZLFFBQVEsQ0FBQyxZQUFZLGNBQWMsS0FBSyxFQUFFLEdBQUc7QUFDMUQsV0FBTztBQUFBLEVBQ1g7QUFDQSxTQUFPO0FBQ1g7QUFDTyxJQUFNLFlBQU4sTUFBTSxtQkFBa0IsUUFBUTtBQUFBLEVBQ25DLE9BQU8sT0FBTztBQUNWLFFBQUksS0FBSyxLQUFLLFFBQVE7QUFDbEIsWUFBTSxPQUFPLE9BQU8sTUFBTSxJQUFJO0FBQUEsSUFDbEM7QUFDQSxVQUFNLGFBQWEsS0FBSyxTQUFTLEtBQUs7QUFDdEMsUUFBSSxlQUFlLGNBQWMsUUFBUTtBQUNyQyxZQUFNQyxPQUFNLEtBQUssZ0JBQWdCLEtBQUs7QUFDdEMsd0JBQWtCQSxNQUFLO0FBQUEsUUFDbkIsTUFBTSxhQUFhO0FBQUEsUUFDbkIsVUFBVSxjQUFjO0FBQUEsUUFDeEIsVUFBVUEsS0FBSTtBQUFBLE1BQ2xCLENBQUM7QUFDRCxhQUFPO0FBQUEsSUFDWDtBQUNBLFVBQU0sU0FBUyxJQUFJLFlBQVk7QUFDL0IsUUFBSSxNQUFNO0FBQ1YsZUFBVyxTQUFTLEtBQUssS0FBSyxRQUFRO0FBQ2xDLFVBQUksTUFBTSxTQUFTLE9BQU87QUFDdEIsWUFBSSxNQUFNLEtBQUssU0FBUyxNQUFNLE9BQU87QUFDakMsZ0JBQU0sS0FBSyxnQkFBZ0IsT0FBTyxHQUFHO0FBQ3JDLDRCQUFrQixLQUFLO0FBQUEsWUFDbkIsTUFBTSxhQUFhO0FBQUEsWUFDbkIsU0FBUyxNQUFNO0FBQUEsWUFDZixNQUFNO0FBQUEsWUFDTixXQUFXO0FBQUEsWUFDWCxPQUFPO0FBQUEsWUFDUCxTQUFTLE1BQU07QUFBQSxVQUNuQixDQUFDO0FBQ0QsaUJBQU8sTUFBTTtBQUFBLFFBQ2pCO0FBQUEsTUFDSixXQUNTLE1BQU0sU0FBUyxPQUFPO0FBQzNCLFlBQUksTUFBTSxLQUFLLFNBQVMsTUFBTSxPQUFPO0FBQ2pDLGdCQUFNLEtBQUssZ0JBQWdCLE9BQU8sR0FBRztBQUNyQyw0QkFBa0IsS0FBSztBQUFBLFlBQ25CLE1BQU0sYUFBYTtBQUFBLFlBQ25CLFNBQVMsTUFBTTtBQUFBLFlBQ2YsTUFBTTtBQUFBLFlBQ04sV0FBVztBQUFBLFlBQ1gsT0FBTztBQUFBLFlBQ1AsU0FBUyxNQUFNO0FBQUEsVUFDbkIsQ0FBQztBQUNELGlCQUFPLE1BQU07QUFBQSxRQUNqQjtBQUFBLE1BQ0osV0FDUyxNQUFNLFNBQVMsVUFBVTtBQUM5QixjQUFNLFNBQVMsTUFBTSxLQUFLLFNBQVMsTUFBTTtBQUN6QyxjQUFNLFdBQVcsTUFBTSxLQUFLLFNBQVMsTUFBTTtBQUMzQyxZQUFJLFVBQVUsVUFBVTtBQUNwQixnQkFBTSxLQUFLLGdCQUFnQixPQUFPLEdBQUc7QUFDckMsY0FBSSxRQUFRO0FBQ1IsOEJBQWtCLEtBQUs7QUFBQSxjQUNuQixNQUFNLGFBQWE7QUFBQSxjQUNuQixTQUFTLE1BQU07QUFBQSxjQUNmLE1BQU07QUFBQSxjQUNOLFdBQVc7QUFBQSxjQUNYLE9BQU87QUFBQSxjQUNQLFNBQVMsTUFBTTtBQUFBLFlBQ25CLENBQUM7QUFBQSxVQUNMLFdBQ1MsVUFBVTtBQUNmLDhCQUFrQixLQUFLO0FBQUEsY0FDbkIsTUFBTSxhQUFhO0FBQUEsY0FDbkIsU0FBUyxNQUFNO0FBQUEsY0FDZixNQUFNO0FBQUEsY0FDTixXQUFXO0FBQUEsY0FDWCxPQUFPO0FBQUEsY0FDUCxTQUFTLE1BQU07QUFBQSxZQUNuQixDQUFDO0FBQUEsVUFDTDtBQUNBLGlCQUFPLE1BQU07QUFBQSxRQUNqQjtBQUFBLE1BQ0osV0FDUyxNQUFNLFNBQVMsU0FBUztBQUM3QixZQUFJLENBQUMsV0FBVyxLQUFLLE1BQU0sSUFBSSxHQUFHO0FBQzlCLGdCQUFNLEtBQUssZ0JBQWdCLE9BQU8sR0FBRztBQUNyQyw0QkFBa0IsS0FBSztBQUFBLFlBQ25CLFlBQVk7QUFBQSxZQUNaLE1BQU0sYUFBYTtBQUFBLFlBQ25CLFNBQVMsTUFBTTtBQUFBLFVBQ25CLENBQUM7QUFDRCxpQkFBTyxNQUFNO0FBQUEsUUFDakI7QUFBQSxNQUNKLFdBQ1MsTUFBTSxTQUFTLFNBQVM7QUFDN0IsWUFBSSxDQUFDLFlBQVk7QUFDYix1QkFBYSxJQUFJLE9BQU8sYUFBYSxHQUFHO0FBQUEsUUFDNUM7QUFDQSxZQUFJLENBQUMsV0FBVyxLQUFLLE1BQU0sSUFBSSxHQUFHO0FBQzlCLGdCQUFNLEtBQUssZ0JBQWdCLE9BQU8sR0FBRztBQUNyQyw0QkFBa0IsS0FBSztBQUFBLFlBQ25CLFlBQVk7QUFBQSxZQUNaLE1BQU0sYUFBYTtBQUFBLFlBQ25CLFNBQVMsTUFBTTtBQUFBLFVBQ25CLENBQUM7QUFDRCxpQkFBTyxNQUFNO0FBQUEsUUFDakI7QUFBQSxNQUNKLFdBQ1MsTUFBTSxTQUFTLFFBQVE7QUFDNUIsWUFBSSxDQUFDLFVBQVUsS0FBSyxNQUFNLElBQUksR0FBRztBQUM3QixnQkFBTSxLQUFLLGdCQUFnQixPQUFPLEdBQUc7QUFDckMsNEJBQWtCLEtBQUs7QUFBQSxZQUNuQixZQUFZO0FBQUEsWUFDWixNQUFNLGFBQWE7QUFBQSxZQUNuQixTQUFTLE1BQU07QUFBQSxVQUNuQixDQUFDO0FBQ0QsaUJBQU8sTUFBTTtBQUFBLFFBQ2pCO0FBQUEsTUFDSixXQUNTLE1BQU0sU0FBUyxVQUFVO0FBQzlCLFlBQUksQ0FBQyxZQUFZLEtBQUssTUFBTSxJQUFJLEdBQUc7QUFDL0IsZ0JBQU0sS0FBSyxnQkFBZ0IsT0FBTyxHQUFHO0FBQ3JDLDRCQUFrQixLQUFLO0FBQUEsWUFDbkIsWUFBWTtBQUFBLFlBQ1osTUFBTSxhQUFhO0FBQUEsWUFDbkIsU0FBUyxNQUFNO0FBQUEsVUFDbkIsQ0FBQztBQUNELGlCQUFPLE1BQU07QUFBQSxRQUNqQjtBQUFBLE1BQ0osV0FDUyxNQUFNLFNBQVMsUUFBUTtBQUM1QixZQUFJLENBQUMsVUFBVSxLQUFLLE1BQU0sSUFBSSxHQUFHO0FBQzdCLGdCQUFNLEtBQUssZ0JBQWdCLE9BQU8sR0FBRztBQUNyQyw0QkFBa0IsS0FBSztBQUFBLFlBQ25CLFlBQVk7QUFBQSxZQUNaLE1BQU0sYUFBYTtBQUFBLFlBQ25CLFNBQVMsTUFBTTtBQUFBLFVBQ25CLENBQUM7QUFDRCxpQkFBTyxNQUFNO0FBQUEsUUFDakI7QUFBQSxNQUNKLFdBQ1MsTUFBTSxTQUFTLFNBQVM7QUFDN0IsWUFBSSxDQUFDLFdBQVcsS0FBSyxNQUFNLElBQUksR0FBRztBQUM5QixnQkFBTSxLQUFLLGdCQUFnQixPQUFPLEdBQUc7QUFDckMsNEJBQWtCLEtBQUs7QUFBQSxZQUNuQixZQUFZO0FBQUEsWUFDWixNQUFNLGFBQWE7QUFBQSxZQUNuQixTQUFTLE1BQU07QUFBQSxVQUNuQixDQUFDO0FBQ0QsaUJBQU8sTUFBTTtBQUFBLFFBQ2pCO0FBQUEsTUFDSixXQUNTLE1BQU0sU0FBUyxRQUFRO0FBQzVCLFlBQUksQ0FBQyxVQUFVLEtBQUssTUFBTSxJQUFJLEdBQUc7QUFDN0IsZ0JBQU0sS0FBSyxnQkFBZ0IsT0FBTyxHQUFHO0FBQ3JDLDRCQUFrQixLQUFLO0FBQUEsWUFDbkIsWUFBWTtBQUFBLFlBQ1osTUFBTSxhQUFhO0FBQUEsWUFDbkIsU0FBUyxNQUFNO0FBQUEsVUFDbkIsQ0FBQztBQUNELGlCQUFPLE1BQU07QUFBQSxRQUNqQjtBQUFBLE1BQ0osV0FDUyxNQUFNLFNBQVMsT0FBTztBQUMzQixZQUFJO0FBQ0EsY0FBSSxJQUFJLE1BQU0sSUFBSTtBQUFBLFFBQ3RCLFFBQ007QUFDRixnQkFBTSxLQUFLLGdCQUFnQixPQUFPLEdBQUc7QUFDckMsNEJBQWtCLEtBQUs7QUFBQSxZQUNuQixZQUFZO0FBQUEsWUFDWixNQUFNLGFBQWE7QUFBQSxZQUNuQixTQUFTLE1BQU07QUFBQSxVQUNuQixDQUFDO0FBQ0QsaUJBQU8sTUFBTTtBQUFBLFFBQ2pCO0FBQUEsTUFDSixXQUNTLE1BQU0sU0FBUyxTQUFTO0FBQzdCLGNBQU0sTUFBTSxZQUFZO0FBQ3hCLGNBQU0sYUFBYSxNQUFNLE1BQU0sS0FBSyxNQUFNLElBQUk7QUFDOUMsWUFBSSxDQUFDLFlBQVk7QUFDYixnQkFBTSxLQUFLLGdCQUFnQixPQUFPLEdBQUc7QUFDckMsNEJBQWtCLEtBQUs7QUFBQSxZQUNuQixZQUFZO0FBQUEsWUFDWixNQUFNLGFBQWE7QUFBQSxZQUNuQixTQUFTLE1BQU07QUFBQSxVQUNuQixDQUFDO0FBQ0QsaUJBQU8sTUFBTTtBQUFBLFFBQ2pCO0FBQUEsTUFDSixXQUNTLE1BQU0sU0FBUyxRQUFRO0FBQzVCLGNBQU0sT0FBTyxNQUFNLEtBQUssS0FBSztBQUFBLE1BQ2pDLFdBQ1MsTUFBTSxTQUFTLFlBQVk7QUFDaEMsWUFBSSxDQUFDLE1BQU0sS0FBSyxTQUFTLE1BQU0sT0FBTyxNQUFNLFFBQVEsR0FBRztBQUNuRCxnQkFBTSxLQUFLLGdCQUFnQixPQUFPLEdBQUc7QUFDckMsNEJBQWtCLEtBQUs7QUFBQSxZQUNuQixNQUFNLGFBQWE7QUFBQSxZQUNuQixZQUFZLEVBQUUsVUFBVSxNQUFNLE9BQU8sVUFBVSxNQUFNLFNBQVM7QUFBQSxZQUM5RCxTQUFTLE1BQU07QUFBQSxVQUNuQixDQUFDO0FBQ0QsaUJBQU8sTUFBTTtBQUFBLFFBQ2pCO0FBQUEsTUFDSixXQUNTLE1BQU0sU0FBUyxlQUFlO0FBQ25DLGNBQU0sT0FBTyxNQUFNLEtBQUssWUFBWTtBQUFBLE1BQ3hDLFdBQ1MsTUFBTSxTQUFTLGVBQWU7QUFDbkMsY0FBTSxPQUFPLE1BQU0sS0FBSyxZQUFZO0FBQUEsTUFDeEMsV0FDUyxNQUFNLFNBQVMsY0FBYztBQUNsQyxZQUFJLENBQUMsTUFBTSxLQUFLLFdBQVcsTUFBTSxLQUFLLEdBQUc7QUFDckMsZ0JBQU0sS0FBSyxnQkFBZ0IsT0FBTyxHQUFHO0FBQ3JDLDRCQUFrQixLQUFLO0FBQUEsWUFDbkIsTUFBTSxhQUFhO0FBQUEsWUFDbkIsWUFBWSxFQUFFLFlBQVksTUFBTSxNQUFNO0FBQUEsWUFDdEMsU0FBUyxNQUFNO0FBQUEsVUFDbkIsQ0FBQztBQUNELGlCQUFPLE1BQU07QUFBQSxRQUNqQjtBQUFBLE1BQ0osV0FDUyxNQUFNLFNBQVMsWUFBWTtBQUNoQyxZQUFJLENBQUMsTUFBTSxLQUFLLFNBQVMsTUFBTSxLQUFLLEdBQUc7QUFDbkMsZ0JBQU0sS0FBSyxnQkFBZ0IsT0FBTyxHQUFHO0FBQ3JDLDRCQUFrQixLQUFLO0FBQUEsWUFDbkIsTUFBTSxhQUFhO0FBQUEsWUFDbkIsWUFBWSxFQUFFLFVBQVUsTUFBTSxNQUFNO0FBQUEsWUFDcEMsU0FBUyxNQUFNO0FBQUEsVUFDbkIsQ0FBQztBQUNELGlCQUFPLE1BQU07QUFBQSxRQUNqQjtBQUFBLE1BQ0osV0FDUyxNQUFNLFNBQVMsWUFBWTtBQUNoQyxjQUFNLFFBQVEsY0FBYyxLQUFLO0FBQ2pDLFlBQUksQ0FBQyxNQUFNLEtBQUssTUFBTSxJQUFJLEdBQUc7QUFDekIsZ0JBQU0sS0FBSyxnQkFBZ0IsT0FBTyxHQUFHO0FBQ3JDLDRCQUFrQixLQUFLO0FBQUEsWUFDbkIsTUFBTSxhQUFhO0FBQUEsWUFDbkIsWUFBWTtBQUFBLFlBQ1osU0FBUyxNQUFNO0FBQUEsVUFDbkIsQ0FBQztBQUNELGlCQUFPLE1BQU07QUFBQSxRQUNqQjtBQUFBLE1BQ0osV0FDUyxNQUFNLFNBQVMsUUFBUTtBQUM1QixjQUFNLFFBQVE7QUFDZCxZQUFJLENBQUMsTUFBTSxLQUFLLE1BQU0sSUFBSSxHQUFHO0FBQ3pCLGdCQUFNLEtBQUssZ0JBQWdCLE9BQU8sR0FBRztBQUNyQyw0QkFBa0IsS0FBSztBQUFBLFlBQ25CLE1BQU0sYUFBYTtBQUFBLFlBQ25CLFlBQVk7QUFBQSxZQUNaLFNBQVMsTUFBTTtBQUFBLFVBQ25CLENBQUM7QUFDRCxpQkFBTyxNQUFNO0FBQUEsUUFDakI7QUFBQSxNQUNKLFdBQ1MsTUFBTSxTQUFTLFFBQVE7QUFDNUIsY0FBTSxRQUFRLFVBQVUsS0FBSztBQUM3QixZQUFJLENBQUMsTUFBTSxLQUFLLE1BQU0sSUFBSSxHQUFHO0FBQ3pCLGdCQUFNLEtBQUssZ0JBQWdCLE9BQU8sR0FBRztBQUNyQyw0QkFBa0IsS0FBSztBQUFBLFlBQ25CLE1BQU0sYUFBYTtBQUFBLFlBQ25CLFlBQVk7QUFBQSxZQUNaLFNBQVMsTUFBTTtBQUFBLFVBQ25CLENBQUM7QUFDRCxpQkFBTyxNQUFNO0FBQUEsUUFDakI7QUFBQSxNQUNKLFdBQ1MsTUFBTSxTQUFTLFlBQVk7QUFDaEMsWUFBSSxDQUFDLGNBQWMsS0FBSyxNQUFNLElBQUksR0FBRztBQUNqQyxnQkFBTSxLQUFLLGdCQUFnQixPQUFPLEdBQUc7QUFDckMsNEJBQWtCLEtBQUs7QUFBQSxZQUNuQixZQUFZO0FBQUEsWUFDWixNQUFNLGFBQWE7QUFBQSxZQUNuQixTQUFTLE1BQU07QUFBQSxVQUNuQixDQUFDO0FBQ0QsaUJBQU8sTUFBTTtBQUFBLFFBQ2pCO0FBQUEsTUFDSixXQUNTLE1BQU0sU0FBUyxNQUFNO0FBQzFCLFlBQUksQ0FBQyxVQUFVLE1BQU0sTUFBTSxNQUFNLE9BQU8sR0FBRztBQUN2QyxnQkFBTSxLQUFLLGdCQUFnQixPQUFPLEdBQUc7QUFDckMsNEJBQWtCLEtBQUs7QUFBQSxZQUNuQixZQUFZO0FBQUEsWUFDWixNQUFNLGFBQWE7QUFBQSxZQUNuQixTQUFTLE1BQU07QUFBQSxVQUNuQixDQUFDO0FBQ0QsaUJBQU8sTUFBTTtBQUFBLFFBQ2pCO0FBQUEsTUFDSixXQUNTLE1BQU0sU0FBUyxPQUFPO0FBQzNCLFlBQUksQ0FBQyxXQUFXLE1BQU0sTUFBTSxNQUFNLEdBQUcsR0FBRztBQUNwQyxnQkFBTSxLQUFLLGdCQUFnQixPQUFPLEdBQUc7QUFDckMsNEJBQWtCLEtBQUs7QUFBQSxZQUNuQixZQUFZO0FBQUEsWUFDWixNQUFNLGFBQWE7QUFBQSxZQUNuQixTQUFTLE1BQU07QUFBQSxVQUNuQixDQUFDO0FBQ0QsaUJBQU8sTUFBTTtBQUFBLFFBQ2pCO0FBQUEsTUFDSixXQUNTLE1BQU0sU0FBUyxRQUFRO0FBQzVCLFlBQUksQ0FBQyxZQUFZLE1BQU0sTUFBTSxNQUFNLE9BQU8sR0FBRztBQUN6QyxnQkFBTSxLQUFLLGdCQUFnQixPQUFPLEdBQUc7QUFDckMsNEJBQWtCLEtBQUs7QUFBQSxZQUNuQixZQUFZO0FBQUEsWUFDWixNQUFNLGFBQWE7QUFBQSxZQUNuQixTQUFTLE1BQU07QUFBQSxVQUNuQixDQUFDO0FBQ0QsaUJBQU8sTUFBTTtBQUFBLFFBQ2pCO0FBQUEsTUFDSixXQUNTLE1BQU0sU0FBUyxVQUFVO0FBQzlCLFlBQUksQ0FBQyxZQUFZLEtBQUssTUFBTSxJQUFJLEdBQUc7QUFDL0IsZ0JBQU0sS0FBSyxnQkFBZ0IsT0FBTyxHQUFHO0FBQ3JDLDRCQUFrQixLQUFLO0FBQUEsWUFDbkIsWUFBWTtBQUFBLFlBQ1osTUFBTSxhQUFhO0FBQUEsWUFDbkIsU0FBUyxNQUFNO0FBQUEsVUFDbkIsQ0FBQztBQUNELGlCQUFPLE1BQU07QUFBQSxRQUNqQjtBQUFBLE1BQ0osV0FDUyxNQUFNLFNBQVMsYUFBYTtBQUNqQyxZQUFJLENBQUMsZUFBZSxLQUFLLE1BQU0sSUFBSSxHQUFHO0FBQ2xDLGdCQUFNLEtBQUssZ0JBQWdCLE9BQU8sR0FBRztBQUNyQyw0QkFBa0IsS0FBSztBQUFBLFlBQ25CLFlBQVk7QUFBQSxZQUNaLE1BQU0sYUFBYTtBQUFBLFlBQ25CLFNBQVMsTUFBTTtBQUFBLFVBQ25CLENBQUM7QUFDRCxpQkFBTyxNQUFNO0FBQUEsUUFDakI7QUFBQSxNQUNKLE9BQ0s7QUFDRCxhQUFLLFlBQVksS0FBSztBQUFBLE1BQzFCO0FBQUEsSUFDSjtBQUNBLFdBQU8sRUFBRSxRQUFRLE9BQU8sT0FBTyxPQUFPLE1BQU0sS0FBSztBQUFBLEVBQ3JEO0FBQUEsRUFDQSxPQUFPLE9BQU8sWUFBWSxTQUFTO0FBQy9CLFdBQU8sS0FBSyxXQUFXLENBQUMsU0FBUyxNQUFNLEtBQUssSUFBSSxHQUFHO0FBQUEsTUFDL0M7QUFBQSxNQUNBLE1BQU0sYUFBYTtBQUFBLE1BQ25CLEdBQUcsVUFBVSxTQUFTLE9BQU87QUFBQSxJQUNqQyxDQUFDO0FBQUEsRUFDTDtBQUFBLEVBQ0EsVUFBVSxPQUFPO0FBQ2IsV0FBTyxJQUFJLFdBQVU7QUFBQSxNQUNqQixHQUFHLEtBQUs7QUFBQSxNQUNSLFFBQVEsQ0FBQyxHQUFHLEtBQUssS0FBSyxRQUFRLEtBQUs7QUFBQSxJQUN2QyxDQUFDO0FBQUEsRUFDTDtBQUFBLEVBQ0EsTUFBTSxTQUFTO0FBQ1gsV0FBTyxLQUFLLFVBQVUsRUFBRSxNQUFNLFNBQVMsR0FBRyxVQUFVLFNBQVMsT0FBTyxFQUFFLENBQUM7QUFBQSxFQUMzRTtBQUFBLEVBQ0EsSUFBSSxTQUFTO0FBQ1QsV0FBTyxLQUFLLFVBQVUsRUFBRSxNQUFNLE9BQU8sR0FBRyxVQUFVLFNBQVMsT0FBTyxFQUFFLENBQUM7QUFBQSxFQUN6RTtBQUFBLEVBQ0EsTUFBTSxTQUFTO0FBQ1gsV0FBTyxLQUFLLFVBQVUsRUFBRSxNQUFNLFNBQVMsR0FBRyxVQUFVLFNBQVMsT0FBTyxFQUFFLENBQUM7QUFBQSxFQUMzRTtBQUFBLEVBQ0EsS0FBSyxTQUFTO0FBQ1YsV0FBTyxLQUFLLFVBQVUsRUFBRSxNQUFNLFFBQVEsR0FBRyxVQUFVLFNBQVMsT0FBTyxFQUFFLENBQUM7QUFBQSxFQUMxRTtBQUFBLEVBQ0EsT0FBTyxTQUFTO0FBQ1osV0FBTyxLQUFLLFVBQVUsRUFBRSxNQUFNLFVBQVUsR0FBRyxVQUFVLFNBQVMsT0FBTyxFQUFFLENBQUM7QUFBQSxFQUM1RTtBQUFBLEVBQ0EsS0FBSyxTQUFTO0FBQ1YsV0FBTyxLQUFLLFVBQVUsRUFBRSxNQUFNLFFBQVEsR0FBRyxVQUFVLFNBQVMsT0FBTyxFQUFFLENBQUM7QUFBQSxFQUMxRTtBQUFBLEVBQ0EsTUFBTSxTQUFTO0FBQ1gsV0FBTyxLQUFLLFVBQVUsRUFBRSxNQUFNLFNBQVMsR0FBRyxVQUFVLFNBQVMsT0FBTyxFQUFFLENBQUM7QUFBQSxF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QSxJQUN6RCxDQUFDO0FBQUEsRUFDTDtBQUFBLEVBQ0EsY0FBYztBQUNWLFdBQU8sSUFBSSxXQUFVO0FBQUEsTUFDakIsR0FBRyxLQUFLO0FBQUEsTUFDUixRQUFRLENBQUMsR0FBRyxLQUFLLEtBQUssUUFBUSxFQUFFLE1BQU0sY0FBYyxDQUFDO0FBQUEsSUFDekQsQ0FBQztBQUFBLEVBQ0w7QUFBQSxFQUNBLElBQUksYUFBYTtBQUNiLFdBQU8sQ0FBQyxDQUFDLEtBQUssS0FBSyxPQUFPLEtBQUssQ0FBQyxPQUFPLEdBQUcsU0FBUyxVQUFVO0FBQUEsRUFDakU7QUFBQSxFQUNBLElBQUksU0FBUztBQUNULFdBQU8sQ0FBQyxDQUFDLEtBQUssS0FBSyxPQUFPLEtBQUssQ0FBQyxPQUFPLEdBQUcsU0FBUyxNQUFNO0FBQUEsRUFDN0Q7QUFBQSxFQUNBLElBQUksU0FBUztBQUNULFdBQU8sQ0FBQyxDQUFDLEtBQUssS0FBSyxPQUFPLEtBQUssQ0FBQyxPQUFPLEdBQUcsU0FBUyxNQUFNO0FBQUEsRUFDN0Q7QUFBQSxFQUNBLElBQUksYUFBYTtBQUNiLFdBQU8sQ0FBQyxDQUFDLEtBQUssS0FBSyxPQUFPLEtBQUssQ0FBQyxPQUFPLEdBQUcsU0FBUyxVQUFVO0FBQUEsRUFDakU7QUFBQSxFQUNBLElBQUksVUFBVTtBQUNWLFdBQU8sQ0FBQyxDQUFDLEtBQUssS0FBSyxPQUFPLEtBQUssQ0FBQyxPQUFPLEdBQUcsU0FBUyxPQUFPO0FBQUEsRUFDOUQ7QUFBQSxFQUNBLElBQUksUUFBUTtBQUNSLFdBQU8sQ0FBQyxDQUFDLEtBQUssS0FBSyxPQUFPLEtBQUssQ0FBQyxPQUFPLEdBQUcsU0FBUyxLQUFLO0FBQUEsRUFDNUQ7QUFBQSxFQUNBLElBQUksVUFBVTtBQUNWLFdBQU8sQ0FBQyxDQUFDLEtBQUssS0FBSyxPQUFPLEtBQUssQ0FBQyxPQUFPLEdBQUcsU0FBUyxPQUFPO0FBQUEsRUFDOUQ7QUFBQSxFQUNBLElBQUksU0FBUztBQUNULFdBQU8sQ0FBQyxDQUFDLEtBQUssS0FBSyxPQUFPLEtBQUssQ0FBQyxPQUFPLEdBQUcsU0FBUyxNQUFNO0FBQUEsRUFDN0Q7QUFBQSxFQUNBLElBQUksV0FBVztBQUNYLFdBQU8sQ0FBQyxDQUFDLEtBQUssS0FBSyxPQUFPLEtBQUssQ0FBQyxPQUFPLEdBQUcsU0FBUyxRQUFRO0FBQUEsRUFDL0Q7QUFBQSxFQUNBLElBQUksU0FBUztBQUNULFdBQU8sQ0FBQyxDQUFDLEtBQUssS0FBSyxPQUFPLEtBQUssQ0FBQyxPQUFPLEdBQUcsU0FBUyxNQUFNO0FBQUEsRUFDN0Q7QUFBQSxFQUNBLElBQUksVUFBVTtBQUNWLFdBQU8sQ0FBQyxDQUFDLEtBQUssS0FBSyxPQUFPLEtBQUssQ0FBQyxPQUFPLEdBQUcsU0FBUyxPQUFPO0FBQUEsRUFDOUQ7QUFBQSxFQUNBLElBQUksU0FBUztBQUNULFdBQU8sQ0FBQyxDQUFDLEtBQUssS0FBSyxPQUFPLEtBQUssQ0FBQyxPQUFPLEdBQUcsU0FBUyxNQUFNO0FBQUEsRUFDN0Q7QUFBQSxFQUNBLElBQUksT0FBTztBQUNQLFdBQU8sQ0FBQyxDQUFDLEtBQUssS0FBSyxPQUFPLEtBQUssQ0FBQyxPQUFPLEdBQUcsU0FBUyxJQUFJO0FBQUEsRUFDM0Q7QUFBQSxFQUNBLElBQUksU0FBUztBQUNULFdBQU8sQ0FBQyxDQUFDLEtBQUssS0FBSyxPQUFPLEtBQUssQ0FBQyxPQUFPLEdBQUcsU0FBUyxNQUFNO0FBQUEsRUFDN0Q7QUFBQSxFQUNBLElBQUksV0FBVztBQUNYLFdBQU8sQ0FBQyxDQUFDLEtBQUssS0FBSyxPQUFPLEtBQUssQ0FBQyxPQUFPLEdBQUcsU0FBUyxRQUFRO0FBQUEsRUFDL0Q7QUFBQSxFQUNBLElBQUksY0FBYztBQUVkLFdBQU8sQ0FBQyxDQUFDLEtBQUssS0FBSyxPQUFPLEtBQUssQ0FBQyxPQUFPLEdBQUcsU0FBUyxXQUFXO0FBQUEsRUFDbEU7QUFBQSxFQUNBLElBQUksWUFBWTtBQUNaLFFBQUksTUFBTTtBQUNWLGVBQVcsTUFBTSxLQUFLLEtBQUssUUFBUTtBQUMvQixVQUFJLEdBQUcsU0FBUyxPQUFPO0FBQ25CLFlB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IiwgIkFzdGFsIiwgImJpbmQiLCAiaW50ZXJ2YWwiLCAiQXN0YWwiLCAiQXN0YWwiLCAiQXN0YWwiLCAidiIsICJpbnRlcnZhbCIsICJjdG9ycyIsICJBc3RhbCIsICJBc3RhbCIsICJHdGsiLCAiQXN0YWwiLCAic25ha2VpZnkiLCAicGF0Y2giLCAiV29ya3NwYWNlIiwgIk5vdGlmZCIsICJBdWRpbyIsICJHT2JqZWN0IiwgIkd0ayIsICJBc3RhbCIsICJBc3RhbCIsICJHdGsiLCAiR09iamVjdCIsICJHdGsiLCAiQXN0YWwiLCAiR09iamVjdCIsICJBc3RhbCIsICJBc3RhbCIsICJBc3RhbCIsICJkZWZhdWx0IiwgIkdPYmplY3QiLCAiZGVmYXVsdCIsICJHT2JqZWN0IiwgImtlYmFiaWZ5IiwgInV0aWwiLCAib2JqZWN0VXRpbCIsICJlcnJvclV0aWwiLCAiZXJyb3JNYXAiLCAiY3R4IiwgInJlc3VsdCIsICJpc3N1ZXMiLCAiZWxlbWVudHMiLCAicHJvY2Vzc2VkIiwgInJlc3VsdCIsICJyIiwgIlpvZEZpcnN0UGFydHlUeXBlS2luZCIsICJlbmRQdHIiLCAibWV0YSIsICJkZWZhdWx0IiwgImpzeCIsICJqc3giLCAiR3RrIiwgImpzeCIsICJHdGsiLCAiZGVmYXVsdCIsICJqc3giLCAiR3RrIiwgImRlZmF1bHQiLCAianN4IiwgIkd0ayIsICJHT2JqZWN0IiwgImRlZmF1bHQiLCAidCIsICJHdGsiLCAianN4IiwgImRlZmF1bHQiLCAianN4IiwgImRlZmF1bHQiLCAianN4IiwgIkd0ayIsICJfdGVtcGVyYXR1cmUiLCAiR09iamVjdCIsICJHdGsiLCAianN4IiwgIkdpbyIsICJHT2JqZWN0IiwgIkdpbyIsICJuaXJpIiwgImpzeCIsICJHdGsiLCAianN4IiwgIkd0ayIsICJBc3RhbCIsICJqc3giLCAiR3RrIiwgIkdPYmplY3QiLCAiZGVmYXVsdCIsICJTQ1JJUFRfRElSIiwgImRlZmF1bHQiLCAiU0lHTkFMX0ZJTEUiLCAiZGVmYXVsdCIsICJuaXJpIiwgIkd0ayIsICJTSUdOQUxfRklMRSJdCn0K
