# Lis-OS Theme Engine V2

**Architecture:** Perceptual Color Pipeline (Oklch + Computer Vision)
**Dependencies:** Pillow, numpy, opencv, scikit-learn, coloraide, blake3

## Overview

The V2 Theme Engine replaces heuristics with sophisticated color science. It uses a **Perceptual Color Pipeline** to extract the "soul" of a wallpaper and generate mathematically harmonious, accessible themes.

**Performance:** ~0.25s cold path (Intel i7), instant hot path.

## Architecture

The pipeline consists of 4 distinct stages:

### 1. Mood Grading (`mood.py`)
Pre-processes the wallpaper using **3D LUTs** and **Split-Toning** to shift the aesthetic *before* analysis. This allows a single wallpaper to yield multiple distinct theme variations (e.g., "Deep" forces dark shadows/cool tints, "Pastel" lifts shadows/desaturates).

### 2. Perceptual Extraction (`extraction.py`)
Instead of simple histograms, V2 uses **Spectral Residual Saliency** (a computer vision technique) to identify visual regions of interest. It then uses **Weighted K-Means** clustering on the saliency-masked pixels to finding the true dominant subject color (Anchor), ignoring large background areas if they are not visually important.

### 3. Harmonic Generation (`generator.py`)
Fits the extracted palette to **Matsuda's Harmonic Templates** (i, I, L, T, V, X, Y) to discover the image's inherent harmonic key. It then generates a full hue-harmonized palette by deriving colors from the template's geometric sectors.

### 4. WCAG Constraint Solver (`solver.py`)
Uses a binary search solver to calculate the precise Lightness (L) required to meet strict contrast ratios against the background, while preserving Hue and Chroma as much as possible.
- **Text:** 7:1 (Preferred) or 4.5:1 (Minimum)
- **UI Components:** 3:1 (Minimum)
- Includes **Gamut Mapping** (Oklch Chroma reduction) to ensure valid sRGB output.

## File Structure

```
modules/home/theme/core/
├── magician.py         # Orchestra (CLI) - Maps outputs to Legacy Schema
├── mood.py             # Grading Engine (Vectorized Numpy)
├── extraction.py       # Saliency + K-Means
├── generator.py        # Matsuda Templates
├── solver.py           # WCAG Binary Search
└── renderer.py         # Template Engine (Jinja2)
```

## CLI Commands

The entry point is `theme-engine` (wrapper for `magician.py`).

| Command | Description |
|---------|-------------|
| `theme-engine set <image> [--mood NAME]` | Generate and apply theme. |
| `theme-engine precache <folder> [--jobs N]` | Pre-generate all moods for all images (Parallel). |

**Moods:** `adaptive` (default), `deep`, `pastel`, `vibrant`, `bw`.

## Caching & Outputs

Palettes are cached by **Image Hash + Mood**.
*   **Cache:** `~/.cache/theme-engine/palettes/{hash}/{mood}.json`
*   **Active State:** `~/.cache/theme-engine/palette.json`
*   **Template Outputs:** `~/.cache/wal/*.conf`, `~/.config/noctalia/colors.json`, etc.

## Developer Notes

*   **Sanitization:** The raw engine works in Oklch space, but `magician.py` enforces a sanitization layer to convert all outputs to standard **Hex** strings for compatibility with GTK/CSS/Legacy templates.
*   **Testing:** Use `test_mood.py`, `test_extraction.py`, and `test_generator.py` to verify individual components.
