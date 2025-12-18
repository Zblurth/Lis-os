# Lis-OS Theme Engine

**Architecture:** Python + Oklab Color Science  
**Dependencies:** Pillow, coloraide, SWWW, blake3

## Overview

The Theme Engine extracts the perceptual "soul" of a wallpaper and generates harmonious UI palettes using **Oklab** color space. It supports multiple design philosophies called **Moods**.

**Performance:** ~0.7s cold path, instant hot path (cached).

## File Structure

```
modules/home/theme/
├── config/
│   └── moods.json          # Mood presets (THE TRUTH)
├── core/                   # Python engine
│   ├── magician.py         # CLI entry (set|compare|test|daemon|precache)
│   ├── generator.py        # MoodGenerator (The Brain)
│   ├── extraction.py       # Pillow histogram + saliency
│   ├── renderer.py         # Template substitution
│   ├── icons.py            # Icon tinting (DISABLED)
│   ├── color.py            # Native coloraide wrappers
│   └── resolve_icons.py    # GTK icon resolution
├── templates/              # App config templates
├── stylix/                 # Stylix integration
├── default.nix             # Home Manager entry
└── packages.nix            # Nix wrappers + Python env
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `theme-engine <image> [--mood NAME]` | Apply wallpaper and generate theme |
| `theme-precache <folder> [--jobs N]` | Pre-generate palettes for all images |
| `theme-compare <image>` | Compare all moods side-by-side |
| `theme-test [--anchor HEX]` | Run stress test (10 anchors × moods) |
| `lis-daemon` | Background watcher (systemd service) |

## Caching

Palettes are cached by Blake3 hash at `~/.cache/theme-engine/palettes/{hash}/{mood}.json`.

- **Cold path:** Extract → Generate → Cache → Apply (~0.7s)
- **Hot path:** Load cached palette → Apply (~0.7s)

Use `theme-precache ~/Pictures/Wallpapers --jobs 4` to pre-warm the cache.

## Moods (`config/moods.json`)

| Mood | Fallback | Description |
|------|----------|-------------|
| `adaptive` | `#7E9CD8` | Context-aware warmth, faithful hue |
| `atmospheric` | `#BD93F9` | High contrast, hue rotation, temp inversion |
| `pastel` | `#FFB8C6` | High lightness, soft colors |

### Mood Config Structure

```json
{
  "description": "...",
  "fallback_anchor": "#HEX",
  "background": { "algo": "adaptive_shadow", "shadow_root": "#HEX", "mix_strength": 0.30, "target_L": 0.26 },
  "text": { "algo": "harmonized", "drift": 0.10, "warmth_bias": true },
  "hero": { "algo": "delta_e_loop", "target_delta": 45, "hue_fence": 25 }
}
```

## Anchor Extraction (Saliency Algorithm)

```
Score = Chroma × log(Frequency)
```

1. Resize image to 100×100 (Pillow)
2. Boost saturation 1.5× (ImageEnhance)
3. Generate histogram, take top 30 by frequency
4. For each color: Score = Chroma × log(Count)
5. Filter out black (L<1) and white (L>98)
6. If monochrome (Chroma < 5): Use `fallback_anchor` from mood

## Color Theory

- **Adaptive Shadow:** Mix with atmospheric roots, never pure gray
- **Temperature Inversion:** Cool BG → warm text, vice versa
- **Delta-E Loop:** Boost chroma until contrast target met
- **Harmonic Poles:** Drift toward Yellow (90°) or Blue (270°) axis

## Outputs

| Path | Content |
|------|---------|
| `~/.cache/theme-engine/palette.json` | Full palette JSON |
| `~/.cache/theme-engine/palettes/` | Pre-cached palettes |
| `~/.cache/wal/ags-colors.css` | GTK CSS variables |
| `~/.config/noctalia/colors.json` | Noctalia shell colors |
