# Astal GTK4 Migration Protocol

**Version:** 1.0  
**Context:** Migration from Cairo-based GTK3 to GPU-accelerated GTK4 (Scene Graph).  
**Target:** NixOS / Astal / Wayland

---

## 1. The "Undefined Object" Pathology

The specific `TypeError: can't convert undefined to object` crash is almost never a simple null pointer. It is a symptom of three structural failures:

### Type I: Introspection Linkage (NixOS Specific)
**Cause:** GJS cannot find the `.typelib` C bindings because `GI_TYPELIB_PATH` is incomplete.  
**Symptom:** `imports.gi.Gtk` is partial or empty.  
**Fix:**
- Use `wrapGAppsHook4` (NOT `wrapGAppsHook`).
- Ensure `gtk4` is in `buildInputs`.

### Type II: Dead API Access
**Cause:** Calling methods that no longer exist on the GObject.  
**Symptom:** undefined is not a function.  
**Removed APIs:**
- `widget.show_all()` → **REMOVED**. Widgets are visible by default.
- `box.add(child)` → **REMOVED**. Use `append`, `prepend`, or `set_child`.
- `pack_start` / `pack_end` → **REMOVED**. Layout is now controlled by the child.

### Type III: Module System Mismatch
**Cause:** Mixing legacy `imports.gi` with ESM `import`.  
**Fix:** Always use:
```typescript
import { App, Gtk, Gdk } from "astal/gtk4";
```

---

## 2. Wayland Layer Shell

GTK4 removed internal GDK backend hacks. You **MUST** use `gtk4-layer-shell`.

### Dictionary Requirements
The `Astal.Window` constructor maps directly to C functions.
- **Namespace:** MANDATORY. Must be a non-empty string. Passing `null` or `undefined` crashes the binding.
- **Anchor:** Bitmask, NOT array.
  - ❌ `['top', 'left']`
  - ✅ `Astal.WindowAnchor.TOP | Astal.WindowAnchor.LEFT`

### NixOS Requirement
`pkgs.gtk4-layer-shell` MUST be in `buildInputs`. Without it, the C symbol lookup fails, and the window becomes a "Zombie Surface" (floating, unmanaged).

---

## 3. Layout & Alignment (The Inversion)

**Paradigm Shift:** You no longer tell the Box how to pack the Child. The Child tells the Box how it wants to align.

| Feature | GTK3 (Legacy) | GTK4 (Modern) |
| :--- | :--- | :--- |
| **Add Child** | `box.add(w)` | `box.append(w)` |
| **Expansion** | `box.pack_start(w, true, ...)` | `w.hexpand = true; w.halign = Gtk.Align.FILL;` |
| **Padding** | `box.pack_start(w, ..., 5)` | `w.margin_start = 5;` or `w.css = "margin: 5px;"` |
| **Centering** | `Box` with spacers | `Gtk.CenterBox` (Use this for bars!) |

---

## 4. Signal Handling

**Rule:** `connect()` causes memory leaks and relies on string-based signal names which have changed.

- **Missing Signals:**
  - `button-press-event` → REMOVED. Use `Gtk.GestureClick`.
  - `key-press-event` → REMOVED. Use `Gtk.EventControllerKey`.

**Best Practice:**
Use Astal's reactive bindings or convenience props.
```tsx
// ❌ GTK3 Style
widget.connect("clicked", callback);

// ✅ Astal GTK4 Style
<button onClicked={callback} />
```

---

## 5. Input Handling (The Event Controller Pattern)

**Paradigm Shift:** Widgets no longer have implicit Event Windows. You cannot just attach `onClick` to a Box.
**Solution:** You must attach an **Event Controller** to the widget's scene graph node.

```tsx
// ❌ BROKEN in GTK4
<box onClick={() => print("Clicked")} />

// ✅ CORRECT (Setup Hook)
<box setup={(self) => {
    const gesture = new Gtk.GestureClick();
    gesture.connect("released", () => print("Clicked"));
    self.add_controller(gesture);
}} />
```

---

## 6. Iconography (The Missing Size)

**The Problem:** `Gtk.Image` in GTK4 has no default size and ignores some CSS sizing properties that worked in GTK3's `<icon>`.
**The Fix:** You **MUST** bind `pixel_size` explicitly if using an icon name.

```typescript
// In setup hook
const icon = new Gtk.Image({ icon_name: "audio-volume-high" });
// Bind to layout service for dynamic scaling
const sub = layout.barHeight.subscribe(h => icon.pixel_size = h * 0.6);
self.connect("destroy", sub);
```

---

## 5. NixOS Configuration Reference

This is the canonical setup to prevent "Undefined Object" crashes effectively.

```nix
# package.nix
{
  nativeBuildInputs = [
    pkgs.wrapGAppsHook4       # CRITICAL: Sets GI_TYPELIB_PATH for GTK4
    pkgs.gobject-introspection
  ];

  buildInputs = [
    pkgs.gjs
    pkgs.gtk4                 # libgtk-4.so
    pkgs.gtk4-layer-shell     # libgtk4-layer-shell.so (Required for Windows)
    
    # Astal Libraries
    astalDeps.allGtk4
  ];
}
```

---

## 6. Diagnostic Checklist

If crashing with `undefined`:
1. **Check Hook:** Is `wrapGAppsHook4` present?
2. **Check Libs:** Is `gtk4-layer-shell` in `buildInputs`?
3. **Check API:** Are you calling `show_all()` or `pack_start()`?
4. **Check Monitors:** Are you accessing `Gdk.Screen`? (Use `Gdk.Display` instead).
