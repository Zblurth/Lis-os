#!/usr/bin/env bash
# modules/home/theme/libs/palette-gen.sh

if [ -z "$1" ]; then echo "Usage: palette-gen <path/to/image> [--json|--preview]"; exit 1; fi
IMG="$1"
MODE="$2"

# 1. Extract Anchor
ANCHOR_RAW=$(magick "$IMG" -scale 1x1! -depth 8 -format "%[hex:u]" info: | cut -c1-6)
if [ -z "$ANCHOR_RAW" ]; then ANCHOR="#2E3440"; else ANCHOR="#$ANCHOR_RAW"; fi

# 2. Color Math

# --- Atmosphere ---
BG=$(pastel color "$ANCHOR" | pastel set hsl-saturation 0.15 | pastel set hsl-lightness 0.08 | pastel format hex)
FG=$(pastel color "$ANCHOR" | pastel set hsl-saturation 0.10 | pastel set hsl-lightness 0.90 | pastel format hex)
FG_DIM=$(pastel color "$FG" | pastel darken 0.3 | pastel format hex)

# --- Thematics (The Vibe) ---
# We calculate these FIRST so we can use them for mixing
SYN_KEY=$(pastel color "$ANCHOR" | pastel set hsl-saturation 0.85 | pastel set hsl-lightness 0.70 | pastel format hex)
SYN_ACC=$(pastel color "$ANCHOR" | pastel rotate 150 | pastel set hsl-saturation 0.80 | pastel set hsl-lightness 0.75 | pastel format hex)
# Function: +30deg
SYN_FUN=$(pastel color "$ANCHOR" | pastel rotate 30 | pastel set hsl-saturation 0.85 | pastel set hsl-lightness 0.70 | pastel format hex)
# String: -30deg
SYN_STR=$(pastel color "$ANCHOR" | pastel rotate -- -30 | pastel set hsl-saturation 0.85 | pastel set hsl-lightness 0.75 | pastel format hex)

# --- Semantics (Harmonious/Blended) ---

# RED: Pure red mixed with Anchor (80% Red, 20% Anchor) -> Fits the theme but stays red
SEM_RED=$(pastel color "#ff5555" | pastel mix --fraction 0.2 "$ANCHOR" | pastel set hsl-lightness 0.65 | pastel format hex)

# GREEN: Pure green mixed with Anchor (70% Green, 30% Anchor) -> Natural, not "Forced"
SEM_GREEN=$(pastel color "#50fa7b" | pastel mix --fraction 0.3 "$ANCHOR" | pastel set hsl-lightness 0.70 | pastel format hex)

# YELLOW: Gold mixed with Anchor -> Warm warning
SEM_YELLOW=$(pastel color "#f1fa8c" | pastel mix --fraction 0.2 "$ANCHOR" | pastel set hsl-lightness 0.75 | pastel format hex)

# BLUE: Cyan mixed with Anchor
SEM_BLUE=$(pastel color "#8be9fd" | pastel mix --fraction 0.2 "$ANCHOR" | pastel set hsl-lightness 0.70 | pastel format hex)

# --- UI (Matugen Style) ---
UI_PRIM=$(pastel color "$ANCHOR" | pastel set hsl-saturation 0.80 | pastel set hsl-lightness 0.60 | pastel format hex)
UI_SEC=$(pastel color "$BG" | pastel lighten 0.1 | pastel format hex)

# 3. Output
if [ "$MODE" == "--preview" ]; then
    p() { printf "\x1b[48;2;$(printf "%d;%d;%d" 0x${1:1:2} 0x${1:3:2} 0x${1:5:2})m    \x1b[0m %s\n" "$2"; }
    echo "--- Base ---"
    p "$BG" "BG"
    p "$FG" "FG"
    echo "--- Semantics (Blended) ---"
    p "$SEM_RED" "Red (Error)"
    p "$SEM_YELLOW" "Yellow (Warn)"
    p "$SEM_GREEN" "Green (Success)"
    echo "--- Syntax ---"
    p "$SYN_KEY" "Key"
    p "$SYN_FUN" "Fun"
    p "$SYN_ACC" "Acc"
else
    cat <<EOF
export ANCHOR="$ANCHOR"
export BG="$BG"
export FG="$FG"
export FG_DIM="$FG_DIM"
export SEM_RED="$SEM_RED"
export SEM_GREEN="$SEM_GREEN"
export SEM_YELLOW="$SEM_YELLOW"
export SEM_BLUE="$SEM_BLUE"
export SYN_KEY="$SYN_KEY"
export SYN_FUN="$SYN_FUN"
export SYN_STR="$SYN_STR"
export SYN_ACC="$SYN_ACC"
export UI_PRIM="$UI_PRIM"
export UI_SEC="$UI_SEC"
EOF
fi
