{ pkgs, ... }:

let
  # --- 1. SAFE JSON GENERATION ---
  # We write these to files in the Nix Store to avoid Bash escaping hell.

  fullContextJson = pkgs.writeText "context-full.json" (
    builtins.toJSON {
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
    }
  );

  riceContextJson = pkgs.writeText "context-rice.json" (
    builtins.toJSON {
      _meta = {
        note = "Format: JSONL. RICE/THEME Context Only.";
        os = "NixOS-Unstable";
        wm = "Niri";
        focus = "Visuals, Theming, Desktop Environment, Rofi, AGS";
      };
      rules = {
        scope = "Only edit files related to visuals/desktop.";
        safety = "NO sed. Use cat <<EOF to OVERWRITE files.";
      };
    }
  );

in
{
  home.packages = with pkgs; [
    jq
    git

    # --- 1. FULL DUMP ---
    (writeShellScriptBin "llm-dump" ''
      set -euo pipefail
      FINAL_OUTPUT="Lis-os-dump.txt"
      REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo ".")
      cd "$REPO_ROOT" || exit 1

      echo "🤖 Generating Full Context..."

      # 1. Header (Safe Cat)
      cat ${fullContextJson} > "$FINAL_OUTPUT"

      # 2. Files
      # Removed exclusion of scripts/ and .xml to give more context
      git ls-files | \
      grep -vE "\.git/|flake\.lock|result|\.png$|\.jpg$|\.jpeg$|\.webp$|\.ico$|\.md$|LICENSE" | \
      while read -r file; do
        [ -f "$file" ] || continue
        # cleanup whitespace/comments
        content=$(sed '/^[[:space:]]*#/d; /^[[:space:]]*$/d; s/[[:space:]]*$//' "$file")
        if [[ -n "$content" ]]; then
            jq -n -c --arg p "$file" --arg c "$content" '{"p":$p,"c":$c}' >> "$FINAL_OUTPUT"
        fi
        echo -n "."
      done

      echo ""
      BYTES=$(wc -c < "$FINAL_OUTPUT")
      TOKENS=$((BYTES / 4))
      echo "✅ Full Dump: $REPO_ROOT/$FINAL_OUTPUT"
      echo "📊 Size: $(($BYTES / 1024)) KB (~$TOKENS Tokens)"
    '')

    # --- 2. RICE DUMP ---
    (writeShellScriptBin "rice-dump" ''
      set -euo pipefail
      FINAL_OUTPUT="Lis-os-rice.txt"
      REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo ".")
      cd "$REPO_ROOT" || exit 1

      echo "🎨 Generating Rice Context..."

      # 1. Header (Safe Cat)
      cat ${riceContextJson} > "$FINAL_OUTPUT"

      # 2. Files (Targeted)
      git ls-files | \
      grep -E "modules/home/desktop/|modules/home/theme/|stylix\.nix|gtk\.nix|qt\.nix|kitty\.nix|starship\.nix|ag" | \
      grep -vE "\.png$|\.jpg$|\.jpeg$|\.webp$|\.ico$|flake\.lock" | \
      while read -r file; do
        [ -f "$file" ] || continue
        content=$(sed '/^[[:space:]]*#/d; /^[[:space:]]*$/d; s/[[:space:]]*$//' "$file")
        if [[ -n "$content" ]]; then
            jq -n -c --arg p "$file" --arg c "$content" '{"p":$p,"c":$c}' >> "$FINAL_OUTPUT"
        fi
        echo -n "."
      done

      echo ""
      BYTES=$(wc -c < "$FINAL_OUTPUT")
      TOKENS=$((BYTES / 4))
      echo "✅ Rice Dump: $REPO_ROOT/$FINAL_OUTPUT"
      echo "📊 Size: $(($BYTES / 1024)) KB (~$TOKENS Tokens)"
    '')
  ];
}
