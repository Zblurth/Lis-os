# Magician TUI - Implementation Plan
> **Status:** ACTIVE — Design Phase

## Overview
A terminal-based interface for the Color Science V2 engine, built with **Textual**. It allows real-time previewing of Moods and Anchors before applying them to the system.

## Architecture
**Stack:** Python + Textual + Rich + Color Science V2 (Local Modules).

### Layout (Grid)
```
+------------------+-----------------------------+----------------------+
|  File Browser    |       Image Preview         |   Controls & Info    |
|                  |     (Kitty/Sixel/Block)     |                      |
|  > Wallpapers    |                             |   [ Mood: Pastel ]   |
|    - img1.png    |                             |   [ Apply Theme  ]   |
|    - img2.jpg    |      (Ascii Art /           |                      |
|                  |       Sixel Buffer)         |   Palette Preview:   |
|                  |                             |   [##] [##] [##]     |
|                  |                             |   [##] [##] [##]     |
|                  |                             |                      |
|                  |                             |   Anchor Candidates: |
|                  |                             |   (Click to Override)|
|                  |                             |   [##] [##] [##]     |
+------------------+-----------------------------+----------------------+
|  Log / Status Bar (Ready)                                           |
+------------------+-----------------------------+----------------------+
```

## Features for MVP
1.  **Real-time Logic:**
    *   Changing selection triggers `MoodEngine` -> `PerceptualExtractor` -> `PaletteGenerator`.
    *   Runs in a worker thread (`@work` decorator) to prevent UI freeze.
2.  **Anchor Picking:**
    *   Show the Top 5 extracted clusters from `PerceptualExtractor`.
    *   Allow user to click one to override the automatic Saliency choice.
3.  **Mood Preview:**
    *   Instant toggle between `adaptive`, `pastel`, `deep`, `vibrant`.
    *   Visualizes the background color change immediately.
4.  **Application:**
    *   "Apply" button runs `action_set` logic (files, templates, reload, wallpaper).

## Technical Implementation
### 1. Dependencies
Add `textual` and `textual-fspicker` (if available, or custom tree) to `packages.nix`.

### 2. Modules
*   `tui/app.py`: Main App class.
*   `tui/widgets/preview.py`: Image previewer (detects terminal caps).
*   `tui/widgets/palette.py`: Grid of colored blocks.
*   `tui/state.py`: Reactive state holder.

### 3. Image Rendering
*   Use `rich.pixels` (if available) or raw ANSI block characters for fallback.
*   Try native Kitty protocol if possible (using `swww query` or direct escape codes).

## Roadmap
*   [ ] **Phase 1:** Basic File Browser + Palette Calculation + Text List of Colors.
*   [ ] **Phase 2:** Visual Palette Grid + Mood Toggles.
*   [ ] **Phase 3:** Image Preview (Hardest part in TUI).
*   [ ] **Phase 4:** Integration with `theme-engine tui` command.
