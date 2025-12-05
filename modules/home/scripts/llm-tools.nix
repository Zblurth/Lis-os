{ pkgs, ... }:

let
  # --- 1. FULL CONTEXT (For the big dump) ---
  fullContext = builtins.toJSON {
    _meta = {
      note = "Format: JSONL. Full System Dump.";
      os = "NixOS-Unstable";
      wm = "Niri";
    };
    rules = {
      structure = {
        gui = "modules/home/packages.nix";
        cli = "modules/core/packages.nix";
        sys = "modules/core/*";
        user = "modules/home/*";
      };
      safety = "NO sed. Use cat <<EOF to OVERWRITE files.";
      imports = "Explicit defaults only.";
    };
  };

  # --- 2. RICE CONTEXT (Focused on Theming/Desktop) ---
  riceContext = builtins.toJSON {
    _meta = {
      note = "Format: JSONL. RICE/THEME Context Only.";
      os = "NixOS-Unstable";
      wm = "Niri";
      focus = "Visuals, Theming, Desktop Environment, Rofi, Waybar/AGS";
    };
    rules = {
      scope = "Only edit files related to visuals/desktop.";
      safety = "NO sed. Use cat <<EOF to OVERWRITE files.";
    };
  };

in
{
  home.packages = with pkgs; [
    jq
    git

    # ==========================================
    # 1. LLM-DUMP (Full System)
    # ==========================================
    (writeShellScriptBin "llm-dump" ''
      set -euo pipefail
      FINAL_OUTPUT="Lis-os-dump.txt"

      REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo ".")
      cd "$REPO_ROOT" || exit 1

      echo "🤖 Generating Full Context (txt)..."

      # Inject Context
      echo '${fullContext}' > "$FINAL_OUTPUT"

      # Dump Files - Exclude .txt files, .git, lock files, images, and previous dump
      git ls-files | \
      grep -vE "\.git/|flake\.lock|result|\.png$|\.jpg$|\.jpeg$|\.webp$|\.ico$|\.xml$|\.md$|\.txt$|LICENSE|modules/home/scripts/" | \
      while read -r file; do
        [ -f "$file" ] || continue

        # Minify: Remove comments (# at start of line), empty lines, trailing spaces
        content=$(sed '/^[[:space:]]*#/d; /^[[:space:]]*$/d; s/[[:space:]]*$//' "$file")

        if [[ -n "$content" ]]; then
            jq -n -c --arg p "$file" --arg c "$content" '{"p":$p,"c":$c}' >> "$FINAL_OUTPUT"
        fi
        echo -n "."
      done
      echo ""
      echo "✅ Full Dump: $REPO_ROOT/$FINAL_OUTPUT"
    '')

    # ==========================================
    # 2. RICE-DUMP (Theming & Desktop Only)
    # ==========================================
    (writeShellScriptBin "rice-dump" ''
      set -euo pipefail
      FINAL_OUTPUT="Lis-os-rice.txt"

      REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo ".")
      cd "$REPO_ROOT" || exit 1

      echo "🎨 Generating Rice/Theme Context..."

      # Inject Context
      echo '${riceContext}' > "$FINAL_OUTPUT"

      # FILTER LOGIC:
      # 1. desktop/ folder (Niri, Rofi, AGS)
      # 2. theme/ folder (Matugen, Templates)
      # 3. Specific styling files: stylix, gtk, qt, kitty, starship
      # 4. Exclude images, lockfiles, and .txt files
      git ls-files | \
      grep -E "modules/home/desktop/|modules/home/theme/|stylix\.nix|gtk\.nix|qt\.nix|kitty\.nix|starship\.nix" | \
      grep -vE "\.png$|\.jpg$|\.jpeg$|\.webp$|\.ico$|\.txt$|flake\.lock" | \
      while read -r file; do
        [ -f "$file" ] || continue

        # Minify (Same logic)
        content=$(sed '/^[[:space:]]*#/d; /^[[:space:]]*$/d; s/[[:space:]]*$//' "$file")

        if [[ -n "$content" ]]; then
            jq -n -c --arg p "$file" --arg c "$content" '{"p":$p,"c":$c}' >> "$FINAL_OUTPUT"
        fi
        echo -n "."
      done

      echo ""
      echo "✅ Rice Dump: $REPO_ROOT/$FINAL_OUTPUT"

      # Stats
      BYTES=$(wc -c < "$FINAL_OUTPUT")
      echo "📊 Size: $(($BYTES / 1024)) KB"
    '')
  ];
}
