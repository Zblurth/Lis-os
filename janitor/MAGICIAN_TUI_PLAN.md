# Magician TUI - Implementation Plan

> **Status:** DEFERRED — Implement after color science v2 refactor

## Overview

Interactive terminal interface for the theme engine, themed by the current palette.

## Main Menu

```
[1] 🎨  Apply Theme      → Select wallpaper + mood + apply
[2] 🔄  Precache         → Batch process all wallpapers  
[3] ⚙️   Settings         → Default mood, paths, toggles
[4] 📊  Compare Moods    → Side-by-side palette preview
[5] 📖  About            → Pipeline explanation
[q] ❌  Quit
```

## Features

### Core
- [ ] Image browser with folder navigation
- [ ] Image preview (Kitty icat / Sixel)
- [ ] Mood selector with descriptions
- [ ] Precache with progress bar + stats
- [ ] Settings persistence

### Polish
- [ ] Theme-colored TUI (reads current palette.json)
- [ ] Fuzzy search for wallpapers
- [ ] Favorites (starred wallpapers)
- [ ] History (recently applied)
- [ ] Quick apply mode (`theme apply` → last wallpaper + default mood)
- [ ] Export theme to JSON/CSS

### ASCII Banner
```
███╗   ███╗ █████╗  ██████╗ ██╗ ██████╗██╗ █████╗ ███╗   ██╗
████╗ ████║██╔══██╗██╔════╝ ██║██╔════╝██║██╔══██╗████╗  ██║
██╔████╔██║███████║██║  ███╗██║██║     ██║███████║██╔██╗ ██║
██║╚██╔╝██║██╔══██║██║   ██║██║██║     ██║██╔══██║██║╚██╗██║
██║ ╚═╝ ██║██║  ██║╚██████╔╝██║╚██████╗██║██║  ██║██║ ╚████║
╚═╝     ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝ ╚═════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝
```

## Tech Stack

- **Library:** Textual (modern Python TUI framework)
- **Image Preview:** Kitty graphics protocol / Sixel fallback
- **Config:** TOML in `~/.config/theme-engine/tui.toml`

## Dependencies to Add

```nix
magicianEnv = pkgs.python3.withPackages (ps: [
  # ... existing
  ps.textual      # TUI framework
  ps.pillow       # Image handling (already have)
]);
```
