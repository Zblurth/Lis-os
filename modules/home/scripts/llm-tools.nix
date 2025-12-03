{ pkgs, ... }:

let
  # --- COMPRESSED CONTEXT ---
  minifiedContext = builtins.toJSON {
    _meta = {
      # Updated note: Explicitly tell AI this is JSONL structure
      note = "Format: JSONL (Lines of JSON). p=path, c=content";
      os = "NixOS-Unstable";
      wm = "Niri";
      date = "DATE_PLACEHOLDER";
    };
    protocol = [
      "1. ANALYZE REQUEST"
      "2. DISCUSS STRATEGY (WHY/HOW)"
      "3. IMPLEMENT"
    ];
    rules = {
      structure = {
        gui = "modules/home/packages.nix";
        cli = "modules/core/packages.nix";
        sys = "modules/core/*";
        user = "modules/home/*";
      };
      safety = "NO sed. Use cat <<EOF to OVERWRITE files.";
      imports = "Explicit defaults only.";
      cmds = { rebuild = "fr"; update = "up-os"; };
    };
  };

in
{
  home.packages = with pkgs; [
    jq
    git

    (writeShellScriptBin "llm-dump" ''
      set -euo pipefail

      # CHANGE: Use .txt extension so Web UIs accept the upload
      FINAL_OUTPUT="Lis-os-dump.txt"

      # Ensure Root
      REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo ".")
      cd "$REPO_ROOT" || exit 1

      echo "🤖 Generating Dense Context (txt)..."

      # 1. Inject Context
      echo '${minifiedContext}' | sed "s/DATE_PLACEHOLDER/$(date '+%Y-%m-%d')/" > "$FINAL_OUTPUT"

      # 2. Dump Files
      # Ignoring: git, lockfiles, images, compiled results, and the dump itself
      git ls-files | \
      grep -vE "\.git/|flake\.lock|result|\.png$|\.jpg$|\.jpeg$|\.webp$|\.ico$|\.xml$|\.md$|LICENSE|$FINAL_OUTPUT|modules/home/scripts/" | \
      while read -r file; do

        [ -f "$file" ] || continue

        # MINIFICATION:
        # 1. Delete lines that start with # (comments)
        # 2. Delete empty lines
        # 3. Trim trailing whitespace
        content=$(sed '/^[[:space:]]*#/d; /^[[:space:]]*$/d; s/[[:space:]]*$//' "$file")

        if [[ -n "$content" ]]; then
            jq -n -c \
            --arg p "$file" \
            --arg c "$content" \
            '{"p":$p,"c":$c}' >> "$FINAL_OUTPUT"
        fi

        echo -n "."
      done

      echo ""
      echo "✅ Done: $REPO_ROOT/$FINAL_OUTPUT"

      # Stats
      BYTES=$(wc -c < "$FINAL_OUTPUT")
      echo "📊 Size: $(($BYTES / 1024)) KB | ~$(($BYTES / 3 / 4)) Tokens"
    '')
  ];
}
