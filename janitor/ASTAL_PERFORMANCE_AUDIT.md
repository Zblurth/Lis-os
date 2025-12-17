# Astal Performance Audit & Visualizer Architecture

**Date:** 2025-12-17
**Context:** Brutal efficiency audit for `MediaPro` widget and system performance.

## 1. Codebase Audit: The Good, The Bad, & The Improvements

### A. Critical: Memory Leaks in MediaService.ts
**The Flaw:** `MediaService` logic leaks signal handlers. In `updatePlayers()`, the code checks `!this.playerStates.has(id)` before adding listeners, but never disconnects them when a player is removed.
**The Risk:** `AstalMpris` caches generic proxy objects. Closing and reopening music players leaves orphaned closures attached to the underlying GObject, causing duplicate event firings.
**The Fix:** Store signal IDs in `PlayerState` and explicitly `disconnect()` them when removing a player.

### B. Performance Trap: Synchronous I/O in usage.ts
**The Flaw:** `readFile('/proc/stat')` is blocking.
**The Impact:** Although `/proc` is RAM-backed, system calls block the single GJS UI thread. Kernel locks can freeze the entire UI.
**The Fix:** Use `readFileAsync` or `Utils.monitorFile` to ensure the rendering loop never stutters.

### C. GJS Garbage Collection in Cava (Existing Implementation)
**The Flaw:** The current approach uses string parsing for generic polling:
```typescript
const line = new TextDecoder().decode(lineBytes); // Alloc 1
this.#values = line.split(";")                    // Alloc 2
   .map(v => parseInt(v, 10))                    // Alloc 3
```
**The Impact:** 60fps string parsing creates thousands of short-lived objects per second, causing GC pressure and micro-stutters ("jank").

---

## 2. Recommended Visualizer Architecture

**Goal:** "Brutalist Efficiency" (60fps, low CPU, zero-copy).

### The Stack
1.  **Backend:** `cava` (Binary Output via `stdout`)
2.  **Middle:** `AudioVisService.ts` (TypedArray / Zero-Copy)
3.  **Frontend:** `Gtk.DrawingArea` (Cairo / Manual Draw)

### Step 1: Cava Configuration
Configure Cava to output raw 8-bit binary data to stdout, bypassing text processing.
```ini
[output]
method = raw
data_format = binary
bit_format = 8bit
channels = mono
```

### Step 2: Optimized Service (`AudioVisService.ts`)
Read bytes directly into a `Uint8Array`.
- Avoids `TextDecoder`, `split`, `map`, and `parseInt`.
- Uses `read_bytes_async` for non-blocking I/O.
- Maintains a persistent `Uint8Array` buffer to avoid per-frame allocation.

### Step 3: The Renderer (`Visualizer.tsx`)
Use `Gtk.DrawingArea` with Cairo.
- Connect to `notify::data` signal from the service.
- Use `queue_draw()` to trigger updates.
- Draw simple rectangles using the typed array data.
- **Avoid:** CSS transitions or `Gtk.Box` layout changes for the visualizer, as these cause expensive layout recalculations.

### Performance Comparison
| Architecture | CPU Usage | GC Pressure | Smoothness | Verdict |
| :--- | :--- | :--- | :--- | :--- |
| **Python Daemon** | High (Serialization) | Medium | 30fps (Laggy) | ❌ Too heavy |
| **Cava (String)** | Medium | High | 45-60fps (Stutters) | ❌ GC spikes |
| **Cava (Binary)** | **Low** | **Low** | **60fps (Silky)** | ✅ **Winner** |
| **Pipewire (Rust)** | Lowest | Lowest | 60fps+ | ⚠️ Overkill |

---

## 3. Implementation Plan

1.  **Refactor `MediaService.ts`**: Fix memory leaks.
2.  **Refactor `usage.ts`**: usage asynchronous file reading.
3.  **Implement `AudioVisService.ts`**: Create the binary reader service.
4.  **Implement `MediaPro` Visualizer**: Add the Cairo-based rendering to the widget.
