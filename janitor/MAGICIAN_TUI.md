# **MAGICAL Theme Engine v2.2**
## **Design & Implementation Specification**
### **For Autonomous Agent Deployment**

---

## **1. SYSTEM ARCHITECTURE & CONTEXT**

This specification extends the existing Lis-OS theme engine (`~/Lis-os/modules/home/theme/core/`). The current CLI (`magician.py`) must be enhanced with a unified TUI while preserving all backend logic.

### **1.1 File Structure**
```
~/Lis-os/modules/home/theme/core/
├── magician.py          # Main entry point (enhanced)
├── tui/                 # NEW: TUI module package
│   ├── __init__.py
│   ├── app.py           # Main TUI application
│   ├── forge.py         # FORGE screen implementation
│   ├── lab.py           # TEST_LAB screen
│   ├── favorites.py     # FAVORITES screen
│   ├── main_menu.py     # MAIN screen
│   ├── anchor_editor.py # Reusable color picker
│   └── widgets.py       # Shared components (matrix, badges, etc.)
├── cache/               # Cache directory (NEW)
│   ├── chafa/           # Terminal image previews
│   ├── gowall/          # Tinted wallpaper cache
│   └── session.json     # TUI state persistence
└── config/
    └── favorites.json   # Favorite themes database
```

### **1.2 Dependencies**
- **Existing**: `coloraide`, `numpy`, `PIL`, `rich`, `watchfiles`
- **New**: `textual` (TUI framework), `blake3` (hashing), `numpy` (already present)

---

## **2. DESIGN SYSTEM - THE BRUTALIST MANIFESTO**

These rules are **immutable**. Violation requires explicit user override.

| ID | Rule | Enforcement |
|----|------|-------------|
| **R-01** | **Screen Layout** | Every screen = Header (2 lines) + Content (max 20 lines) + Footer (2 lines) |
| **R-02** | **Sidebar Width** | Left pane = **28 characters** exactly. Includes borders. No exceptions. |
| **R-03** | **Border Style** | Use only `─│┌┐└┘` (single-line Unicode). **No double lines, no fancy corners.** |
| **R-04** | **Badge Syntax** | All toggles/status: `[key:value]` or `[key:✓]` or `[key:✗]`. Space after colon. |
| **R-05** | **Keybind Format** | Footer shows `[Action]key` (e.g., `[Apply]Enter`). Sort by frequency (left = common). |
| **R-06** | **Braille Patterns** | Use only `⣿⠿⣒⣀⣄⣠⣤⣶⣷⣧⣥⣴` for color blocks. **Never use full-block `█` for UI.** |
| **R-07** | **Status Emojis** | `✓` = pass, `⚠` = warning, `✗` = fail. **No text status.** |
| **R-08** | **Color Hover** | Show hex in tooltip (on `?` press). **Never inline hex in matrix.** |
| **R-09** | **Truncation** | File names max 12 chars. Truncate from middle: `cyberpunk.jpg` → `cyber…nk.jpg` |
| **R-10** | **Cache Keys** | Use `blake3(filename)[:16]` for file hashes. Store in `~/.cache/magician/` |
| **R-11** | **ASCII Art** | Main screen logo uses `primary` color from last applied theme. Fall back to `#888888` if none. |
| **R-12** | **Performance** | All preview generation **must** be non-blocking. Use `ThreadPoolExecutor` with `max_workers=4`. |

---

## **3. DATA STRUCTURES**

### **3.1 Cache Schema**
```python
# ~/.cache/magician/session.json
{
  "current_screen": "FORGE",           # MAIN | FORGE | LAB | FAVORITES
  "last_wallpaper": "~/Pictures/Wallpapers/cyberpunk.jpg",
  "batch_selection": ["cyberpunk.jpg", "city.jpg", "forest.png"],
  "active_mode": "MOOD",               # MOOD | PRESET
  "mood_name": "adaptive",
  "preset_name": "catppuccin_mocha",
  "gowall_enabled": false,
  "window_size": [120, 40]            # cols, rows
}

# ~/.cache/magician/favorites.json
{
  "favorites": [
    {
      "id": "cyber-catp-1734604800",
      "name": "cyberpunk + catppuccin",
      "wallpaper_path": "~/Pictures/Wallpapers/cyberpunk.jpg",
      "generation_mode": "PRESET",     # MOOD | PRESET
      "preset_name": "catppuccin_mocha",
      "mood_name": null,
      "gowall_enabled": true,
      "palette": {                     # Full color mapping
        "bg": "#1e1e2e",
        "fg": "#cdd6f4",
        "primary": "#f38ba8",
        "modified": true,              # User edited colors
        "original_preset": "catppuccin_mocha"
      },
      "created": "2025-12-19T14:32:00Z",
      "last_used": "2025-12-19T18:45:00Z"
    }
  ]
}
```

### **3.2 Palette → Matrix Mapping**
```python
# Matrix background columns (order matters)
MATRIX_BG_ORDER = ['bg', 'surface', 'surfaceLighter', 'anchor', 'ui_prim', 'ui_sec']

# Matrix foreground rows (order matters)
MATRIX_FG_ORDER = ['fg', 'fg_dim', 'fg_muted', 'ui_prim', 'ui_sec', 'sem_red', 'sem_green', 'sem_blue', 'tertiary']

def generate_matrix(colors: dict) -> list[str]:
    """
    Returns 9 lines of matrix text.
    Line 1: headers
    Line 2-3: text/dim/muted rows
    Line 4: separator
    Line 5-9: semantic color rows with braille patterns
    """
    # Implementation must follow R-06, R-07, R-08
    pass
```

---

## **4. SCREEN SPECIFICATIONS**

### **4.1 MAIN - The Gateway**

**Layout** (24 rows × 100 cols min):
```
Line 1: ┌─────────────────────────────────────────────────────────────────┐
Line 2: │ 🔮 MAGICAL  v2.1  [nixos@wayland]  [?]  [q:Quit]              │
Line 3: ├─────────────────────────────────────────────────────────────────┤
Line 4: │ [1]⚡Forge [2]🎨Gowall [3]🔬Lab [4]⭐Fav [5]⚙️Settings        │
Line 5: │                                                                 │
Line 6: │ Recent: cyberpunk.jpg + catppuccin-mocha [Gowall:✓] [Enter:▶] │
Line 7: ├─────────────────────────────────────────────────────────────────┤
Line 8-13: ASCII logo (6 lines, centered, colored with primary)
Line 14: │                                                                 │
Line 15-24: Footer padding (blank) + hint: "Press 1-5 or ? for help"
```

**Keybindings**:
- `1`, `2`, `3`, `4`, `5`: Jump to screen
- `Enter`: Apply most recent favorite
- `?`: Overlay help panel (cover 50% screen)
- `q`: Exit to shell

**State Logic**:
- If no favorites, hide "Recent" line (Line 6)
- If no last theme, color logo with `#888888` (neutral)

---

### **4.2 FORGE - The Unified Core**

**Layout** (dynamic, min 80×30):
```
Header (2 lines):
┌──────────────────────────────────────────────────────────────────────────┐
│ 🔮 Forge  [Mode:Mood]  [Batch:42/42]  [Folder:~/Pic/Walls]  [?][q]     │
└──────────────────────────────────────────────────────────────────────────┘

Top Bar (1 line):
┌──────────────────────────────────────────────────────────────────────────┐
│ [Mood]Preset  [←→]  Mood:[adaptive▼]  Gowall:[ ]  [/]Search  [p]Preview │
└──────────────────────────────────────────────────────────────────────────┘

Content Split:
┌──────────────┬───────────────────────────────────────────────────────────┐
│ (28 cols)    │ (remaining width)                                         │
│ Wallpapers   │ Preview: <filename> (<width>×<height>, <size>MB)         │
│              │ ┌──────────────────────────────────────────────────────┐ │
│ [✓]All       │ │ <chafa-rendered-image, 60-80 cols wide>               │ │
│ >cyberpunk   │ └──────────────────────────────────────────────────────┘ │
│  city.jpg    │ Readability: text✓ dim⚠ blue✓ green✓ red✓ yellow✓...   │
│  forest      │                                                          │
│  neon.land   │ ┌──────────── Unixporn Matrix ──────────────┐          │
│  ocean       │ │  [bg]  [surface]  [lighter]  [anchor]     │          │
│  space       │ │text⣿⣿⣿✓ ⣿⣿⣿⚠   ⣿⣿⣿✗   ⣿⣿⣿✓      │          │
│  ... (37)    │ │dim ⠛⠛⠛✓ ⠛⠛⠛⚠   ⠛⠛⠛✗   ⠛⠛⠛⚠      │          │
│              │ │───────────────────────────────────────────│          │
│              │ │  fg   prim   sec   ter   err   warn  succ │          │
│              │ │  ⣿    ⠿    ⠿    ⠿    ⠿     ⠿     ⠿       │          │
│              │ │  ⠿    ⠿    ⠿    ⠿    ⠿     ⠿     ⠿       │          │
│              │ │  ⣀    ⣀    ⣀    ⣀    ⣀     ⣀     ⣀       │          │
│              │ └───────────────────────────────────────────┘          │
├──────────────┴───────────────────────────────────────────────────────────┤
Footer (2 lines):
│ [Nav]↑↓ [Sel]Space [Mode]Tab [Search]/ [Rand]r [Folder]f [Back]q        │
│ [Apply]Enter [Apply+Gowall]Shift+Enter                                   │
└──────────────────────────────────────────────────────────────────────────┘
```

**Component Breakdown**:
- **Sidebar**: `tui/widgets.py::WallpaperList(widget)`
  - Height: Fill available vertical space
  - Scroll: Independent, smooth
  - Selection: `>` marker, `[✓]` checkbox for batch
  - Truncate: Middle ellipsis at 12 chars
- **Preview**: `tui/widgets.py::ImagePreview(widget)`
  - Uses `chafa` subprocess, cached to `~/.cache/magician/chafa/{hash}.txt`
  - Cache hit: display instantly. Miss: generate in thread, show spinner `[+]`
- **Matrix**: `tui/widgets.py::UnixpornMatrix(widget)`
  - Generates 9 lines from `colors` dict (see 3.2)
  - Caches output string per palette hash
- **Readability**: `tui/widgets.py::ReadabilityBar(widget)`
  - Single line: `text✓ dim⚠ blue✓ ...`
  - Calculates WCAG ratios using `core/solver.py::calculate_contrast`

**Keybindings**:
- `↑↓`: Navigate sidebar (scrolls list)
- `Space`: Toggle wallpaper selection (batch)
- `a`: Invert all selections
- `Tab`: Toggle Mode (Mood ↔ Preset)
- `←→`: Switch preset (Preset mode) OR navigate mood dropdown (Mood mode)
- `/`: Open search bar (filters wallpaper list)
- `p`: Fullscreen preview overlay (cover entire screen)
- `r`: Random wallpaper (respects current filter)
- `f`: Change folder (opens file picker)
- `Enter`: Apply (see logic below)
- `Shift+Enter`: Apply with Gowall (Preset mode)
- `Ctrl+G`: Apply with Gowall (fallback, some terminals swallow Shift+Enter)
- `q`: Return to MAIN

**Mode-Specific Logic**:
- **Mood Mode**:
  - Top bar shows `Mood:[adaptive▼]` (dropdown)
  - Gowall checkbox hidden
  - Matrix shows computed palette
  - `Enter` runs: `process_pipeline(wallpaper, mood_name)`

- **Preset Mode**:
  - Top bar shows `Preset:[catppuccin-mocha▼]`
  - Gowall checkbox visible `[ ]`
  - Matrix shows preset colors
  - `Enter` runs: `render_template(preset)` (no gowall)
  - `Shift+Enter` runs: `gowall convert` THEN `render_template`

---

### **4.3 TEST_LAB - The Crucible**

**Layout** (min 90×35):
```
Header (2 lines):
┌──────────────────────────────────────────────────────────────────────────┐
│ 🔬 Test Lab  [Anchors:10]  [Moods:6]  [Grid:8×6]  [Status:Ready]  [?][q]│
└──────────────────────────────────────────────────────────────────────────┘

Content Split:
┌──────────────┬───────────────────────────────────────────────────────────┐
│ (35 cols)    │ (remaining)                                               │
│ Grid View    │ Inspector: ocean.jpg + deep (selected)                    │
│              │ ┌──────────────────────────────────────────────────────┐ │
│ ocean    ad✓ │ │ Anchor: Ocean Blue (#1e4d6b)                         │ │
│ sunset   de✓ │ │ Hue:210° Sat:45% Light:42% Template:V-Shape(93.6°) │ │
│ forest   pa✓ │ │ Score:8.4/10 [⚠contrast]                             │ │
│ cyberpunk vi✓│ └──────────────────────────────────────────────────────┘ │
│ space    bw✓ │                                                           │
│ winter   no✓ │ Palette: ███ #1a1a2e ███ #f0f0f0 ███ #5e81ac ███ #88c0d0│
│ autumn   ad✗ │          ███ #ebcb8b ███ #ff9f43 ███ #bf616a ███ #a3be8c│
│ desert   de⚠ │                                                           │
│ sakura   pa✓ │ Readability: text✓ dim⚠ blue✓ green✓ red✓ yellow⚠ cyan✓│
│ twilight vi✓ │                                                           │
│              │ ┌──────────── Unixporn Matrix ──────────────┐          │
│              │ │  [bg]  [surface]  [lighter]  [anchor]     │          │
│              │ │text⣿⣿⣿✓ ⣿⣿⣿⚠   ⣿⣿⣿✗   ⣿⣿⣿✓      │          │
│              │ │dim ⠛⠛⠛✓ ⠛⠛⠛⚠   ⠛⠛⠛✗   ⠛⠛⠛⚠      │          │
│              │ │───────────────────────────────────────────│          │
│              │ │  fg   prim   sec   ter   err   warn  succ │          │
│              │ │  ⣿    ⠿    ⠿    ⠿    ⠿     ⠿     ⠿       │          │
│              │ │  ⠿    ⠿    ⠿    ⠿    ⠿     ⠿     ⠿       │          │
│              │ │  ⣀    ⣀    ⣀    ⣀    ⣀     ⣀     ⣀       │          │
│              │ └───────────────────────────────────────────┘          │
│              │                                                           │
│ Grayscale    │ [e]Edit-palette  [s]Save-preset  [w]Link  [v]Visual-diff│
│ ocean   ad✓  │                                                           │
│ sunset  de✓  │ Contrast Failures:1(dim/lighter)  Warnings:2(accent)    │
│ forest  pa✓  │                                                           │
│ ...          │ Generation:3.2s  Cache:2hits  Miss:8  [r]Rerun-filtered│
├──────────────┴───────────────────────────────────────────────────────────┤
│ [Nav]↑↓←→ [Inspect]Enter [Start]s [Filter]f [Export]x [Back]q          │
│ [Grid]G [Page-Up/Down] scroll 8 rows                                   │
└──────────────────────────────────────────────────────────────────────────┘
```

**Grid Mechanics**:
- **Left Grid**: Color anchors (10 items)
- **Right Grid**: Grayscale variants (10 items)
- **Cell format**: `<name> <code><status>` (e.g., `ocean ad✓`)
- **Selection**: Highlight cell with reverse video. Show inspector on right.
- **Status Calculation**:
  - `✓` = All WCAG ratios ≥ 4.5:1
  - `⚠` = Any ratio 3.0-4.4:1
  - `✗` = Any ratio < 3.0:1

**Inspector Features**:
- `e`: Open anchor editor (changes apply to this result only)
- `s`: Save current palette as custom preset (prompts for name)
- `w`: Link this palette to wallpaper → creates favorite
- `v`: Show visual diff (side-by-side original vs modified if edited)

**Keybindings**:
- `↑↓←→`: Navigate grid (wraps around edges)
- `Enter`: Open inspector (if not already open)
- `s`: Start generation for all anchors × all moods (shows progress in Status)
- `PageUp/Down`: Jump 8 rows (fast scroll)
- `G`: Toggle between color/grayscale grid views
- `f`: Filter grid (show only failures/warnings/success)
- `x`: Export results to markdown file
- `q`: Back to MAIN

---

### **4.4 FAVORITES - The Codex**

**Layout** (min 90×32):
```
Header (2 lines):
┌──────────────────────────────────────────────────────────────────────────┐
│ ⭐ Favorites  [3 combos]  [c]reate  [d]elete  [e]dit  [a]pply  [?][q]   │
└──────────────────────────────────────────────────────────────────────────┘

Content Split:
┌──────────────┬───────────────────────────────────────────────────────────┐
│ (28 cols)    │ (remaining)                                               │
│ Saved Themes │ Detail: cyberpunk.jpg + catppuccin-mocha                 │
│              │ [Gowall:✓] [Linked:✓] [Modified:2h ago]                  │
│              ├───────────────────────────────────────────────────────────┤
│ >1 cyberpunk │ Wallpaper Preview:                                        │
│   └─[catp]   │ ┌──────────────────────────────────────────────────────┐ │
│  2 sunset    │ │██████████████████████████████████████████████████████│ │
│   └─[deep]   │ │██▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓██│ │
│  3 forest    │ │██▓▓▓▓▓▓▓▓▒▒▒▒░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██│ │
│   └─[adap]   │ │███████████████████████████████████████████████████████│ │
│              │ └──────────────────────────────────────────────────────┘ │
│ + New...     │                                                           │
│              │ ┌──────────── Unixporn Matrix ──────────────┐          │
│              │ │[bg][surf][mantle][crust][rosewater]        │          │
│              │ │text⣿⣿⣿✓⣿⣿⣿✓⣿⣿⣿✓⣿⣿⣿✓⣿⣿⣿⚠│          │
│              │ │dim ⠛⠛⠛✓⠛⠛⠛✓⠛⠛⠛✓⠛⠛⠛✓⠛⠛⠛⚠│          │
│              │ │───────────────────────────────────────────│          │
│              │ │  fg   red   green  blue  yellow pink teal │          │
│              │ │  ⣿    ⠿     ⠿     ⠿     ⠿     ⠿    ⠿      │          │
│              │ │  ⠿    ⠿     ⠿     ⠿     ⠿     ⠿    ⠿      │          │
│              │ └───────────────────────────────────────────┘          │
│              │                                                           │
│              │ ┌────── Editable Palette ──────┐                        │
│              │ │ ███ #1e1e2e bg      [Edit]   │                        │
│              │ │ ███ #f38ba8 primary [Orig]   │                        │
│              │ │ ███ #cdd6f4 fg      [Edit]   │                        │
│              │ │ ███ #f38ba8 red     [Edit]   │                        │
│              │ │ ███ #b4d6a2 green   [✓Mod]   │                        │
│              │ │ ███ #89b4fa blue    [Edit]   │                        │
│              │ └──────────────────────────────┘                        │
├──────────────┴───────────────────────────────────────────────────────────┤
│ [Nav]↑↓ [Open]Enter [Edit]e [Reas]r [Del]d [Back]q                     │
└──────────────────────────────────────────────────────────────────────────┘
```

**Interaction Details**:
- **Left list**: Shows `Name └─[shortcode]`. Hover to see full path in tooltip.
- **Matrix**: Uses favorite's actual palette (modified if edited)
- **Editable Palette**:
  - `[Edit]`: Click or press `e` → opens `anchor_editor.py` for that specific color
  - `[Orig]`: Color matches original preset. Click to restore.
  - `[✓Mod]`: Hover shows original hex in tooltip (e.g., `#a6e3a1 → #b4d6a2`)
- **Reassign**: `r` → opens wallpaper picker. Changes wallpaper, keeps palette.

**Keybindings**:
- `↑↓`: Navigate favorites
- `Enter`: Apply this favorite (run full pipeline)
- `e`: Edit palette (opens matrix editor)
- `r`: Reassign wallpaper
- `d`: Delete favorite (with confirmation)
- `c`: Create new favorite (opens FORGE with pre-filled data)
- `a`: Apply without confirmation
- `q`: Back to MAIN

---

### **4.5 ANCHOR_EDITOR - Reusable Component**

**Popup overlay (centered, 50×15)**:
```
┌──────────────────────────────────────────────────┐
│ 🔧 Color Editor  [Anchor: Ocean Blue]  [?][q]  │
├──────────────────────────────────────────────────┤
│ Visual Picker:                                   │
│ ┌──────────────────────────────────────────────┐ │
│ │ H:210° [←←→→]  S:45% [←→]  L:42% [←→]      │ │
│ │                                              │ │
│ │ ⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿  Current: #1e4d6b  ✓ Gamut     │ │
│ │ ⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿  [Name]____________[Enter] │ │
│ │ ⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀  [d]rag-drop image              │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ Quick: [1]DeepPurple [2]Sunset [3]Forest [4]Ocean│
│        [5]Sakura [6]Twilight [7]Desert [8]Arctic│
│        [9]Autumn [0]Storm                       │
├──────────────────────────────────────────────────┤
│ [←→:Hue] [↑↓:Sat/Light] [d:Drop] [Enter:Confirm]│
└──────────────────────────────────────────────────┘
```

**Props**:
```python
class AnchorEditor(ModalScreen):
    def __init__(self, 
                 current_color: str = "#000000",
                 allow_name_input: bool = True,
                 allow_image_drop: bool = True,
                 quick_presets: list[tuple[str, str]] = None):
        # Returns selected color or None on cancel
        pass
```

**Keybindings**:
- `←→`: Adjust hue by 15° (hold Shift for 1°)
- `↑↓`: Adjust saturation/lightness by 5% (hold Shift for 1%)
- `1-9,0`: Jump to named preset
- `d`: Enter drop mode (terminal must support OSC 52)
- `Enter`: Confirm selection
- `Esc`: Cancel

---

## **5. INTERACTION FLOWS**

### **5.1 Forge → Apply Theme**
```python
# Pseudocode for agent implementation
def on_enter_pressed():
    if mode == MOOD:
        mood_name = dropdown.value
        pipeline = process_pipeline(selected_wallpaper, mood_name)
        if pipeline.failed:
            show_toast(f"Failed: {pipeline.error}")
            return
        apply_theme(pipeline.palette)
    
    elif mode == PRESET:
        preset_name = dropdown.value
        gowall = checkbox.gowall_enabled
        
        if gowall:
            tinted_path = cache_gowall(selected_wallpaper, preset_name)
            if tinted_path.exists():
                set_wallpaper(tinted_path)
            else:
                tinted_path = run_gowall(selected_wallpaper, preset_name)
        
        palette = PRESETS[preset_name]
        apply_theme(palette)
        set_wallpaper(selected_wallpaper)  # or tinted_path if gowall
    
    # Batch mode
    if len(batch_selection) > 1:
        confirm = show_modal(f"Apply to {len(batch)} wallpapers?")
        if not confirm:
            return
    
    save_session()
    show_toast("Theme applied")
```

### **5.2 Test Lab → Grid Generation**
```python
def generate_test_grid():
    anchors = load_test_anchors()  # 10 predefined + custom
    moods = MOOD_PRESETS.keys()    # 6 moods
    
    for anchor in anchors:
        for mood in moods:
            cache_key = f"{anchor}_{mood}"
            if cache_hit(cache_key):
                status = load_cached_status(cache_key)
            else:
                result = process_pipeline(anchor, mood)
                status = compute_status(result)  # ✓⚠✗
                cache_status(cache_key, status)
            
            grid[anchor][mood] = status
    
    render_grid(grid)  # 8×6 cells
```

---

## **6. CACHING SPECIFICATION**

### **6.1 Cache Directory Structure**
```
~/.cache/magician/
├── chafa/
│   └── {blake3_hash[:16]}.txt          # Terminal render output
├── gowall/
│   └── {wallpaper_hash}_{preset}.png   # Tinted wallpaper
├── palettes/
│   └── {wallpaper_hash}_{mood}.json    # Generated palette
└── session.json                        # TUI state
```

### **6.2 Cache Invalidation**
- **Chafa**: TTL = 30 days. Invalidate on file mtime change.
- **Gowall**: TTL = 7 days. Re-tint if source or preset changes.
- **Palettes**: TTL = infinite. Only invalidate if engine version changes (store version in JSON).
- **Session**: Write-through on every action. No TTL.

---

## **7. PERFORMANCE REQUIREMENTS**

| Operation | Target Time | Implementation |
|-----------|-------------|----------------|
| Wallpaper list load | `< 100ms` | Async directory scan |
| Preview render | `< 300ms` | Chafa + cache |
| Palette generation | `< 500ms` | Threaded, cached |
| Gowall tint | `< 2000ms` | Background, async preview |
| Matrix render | `< 50ms` | String cache per palette |
| Grid generation (10×6) | `< 5000ms` | Parallel ThreadPool (4 workers) |

**Non-blocking UI**: Every heavy operation shows spinner `[+]` in header status. UI remains responsive.

---

## **8. ACCESSIBILITY MODE**

Trigger: `Ctrl+A` in any screen.

Changes:
- **High Contrast**: Force `#fff`/`#000` borders, disable color-coded badges
- **Screen Reader**: Add hidden ARIA labels to all widgets
- **Large Text**: Increase sidebar width to 32 cols, reduce matrix to 5×5
- **Voice Announce**: Speak actions: "Applied theme cyberpunk"

---

## **9. IMPLEMENTATION ROADMAP**

### **Phase 1: Foundation** (2 days)
1. Create `tui/` package structure
2. Implement `widgets.py` (sidebar, matrix, badges, status)
3. Build `main_menu.py` with ASCII logo and navigation
4. Cache system for chafa and session

### **Phase 2: Forge Core** (3 days)
1. Implement `forge.py` with split-pane layout
2. Integrate existing `magician.py` backend
3. Mood/Preset mode switching
4. Batch selection logic
5. Gowall toggle and preview

### **Phase 3: Testing & Favorites** (3 days)
1. Build `lab.py` with dense grid
2. Inspector panel with editable palette
3. `favorites.py` with load/save/edit
4. Anchor editor modal

### **Phase 4: Polish** (2 days)
1. State restoration on crash
2. Help overlay (`?`)
3. Performance tuning (cache hit rates > 90%)
4. Braille fallback for narrow terminals

### **Phase 5: Integration** (1 day)
1. Wire into existing `magician.py` CLI
2. Add `--tui` flag to launch TUI
3. Test full pipeline on 20+ wallpapers
4. Documentation in `janitor/TUI.md`

---

## **10. AGENT EXECUTION NOTES**

### **10.1 File Modification Rules**
- **Preserve**: All existing `magician.py` backend logic
- **Enhance**: Add TUI entry point `def launch_tui():`
- **Extend**: Add `cache/` directory creation to `setup.py` or NixOS config
- **Do Not Modify**: `core/solver.py`, `core/extraction.py`, `core/generator.py`

### **10.2 Testing Checklist**
```python
# Agent must verify:
assert screen_layout_height() <= 24  # R-01
assert sidebar_width() == 28          # R-02
assert border_chars() == "─│┌┐└┘"     # R-03
assert keybind_format_matches_footer()  # R-05
assert cache_hits() > 0.9            # Performance
assert tui_state_restores()          # Session persistence
```

### **10.3 Error Handling**
- **Gowall not found**: Show `[!]` badge, log warning, continue
- **Chafa not found**: Fall back to text-based preview (show filename only)
- **Invalid image**: Show `[✗]` in sidebar, skip on apply
- **Palette gen fail**: Use fallback `adaptive` mood, show toast

---

## **11. FINAL DESIGN DECISIONS**

- **No splash screen**: Direct to MAIN on launch
- **No animations**: Static UI only (brutalist efficiency)
- **No mouse dependency**: Fully keyboard operable
- **No config file**: All state in `session.json` and `favorites.json`
- **No plugin system**: Keep single, focused tool
- **No network calls**: Everything local (respects NixOS purity)

---

**Document Version**: 2.2  
**Last Updated**: 2025-12-19  
**Author**: Aether (System Architect)  
**For**: Autonomous Agent Deployment  
**Status**: **READY FOR IMPLEMENTATION**


┌─────────────────────────────────────────────────────────────────┐
│ 🔮 MAGICAL  v2.1  [nixos@wayland]  [?]  [q:Quit]              │
├─────────────────────────────────────────────────────────────────┤
│ [1]⚡Forge [2]🎨Gowall [3]🔬Lab [4]⭐Fav [5]⚙️Settings        │
│                                                                 │
│ Recent: cyberpunk.jpg + catppuccin-mocha [Gowall:✓] [Enter:▶] │
├─────────────────────────────────────────────────────────────────┤
│ ███╗   ███╗ █████╗  ██████╗ ██╗ ██████╗██╗ █████╗ ███╗   ██╗ │
│ ████╗ ████║██╔══██╗██╔════╝ ██║██╔════╝██║██╔══██╗████╗  ██║ │
│ ██╔████╔██║███████║██║  ███╗██║██║     ██║███████║██╔██╗ ██║ │
│ ██║╚██╔╝██║██╔══██║██║   ██║██║██║     ██║██╔══██║██║╚██╗██║ │
│ ██║ ╚═╝ ██║██║  ██║╚██████╔╝██║╚██████╗██║██║  ██║██║ ╚████║ │
│ ╚═╝     ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝ ╚═════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
---

**Agent, execute Phase 1.**