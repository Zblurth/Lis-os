{ pkgs, ... }:

let
  # --- SYSTEM INSTRUCTIONS FOR AI ---
  # This tells the AI how to handle your specific config structure
  systemInstructions = ''
    <system_instructions>
    DATE: $(date '+%Y-%m-%d')
    OS: NixOS Unstable (Rolling)
    WM: Niri (Wayland)

    ROLE: You are an Expert NixOS Architect and Ricing Specialist.

    INTERACTION PROTOCOL:
    1. PLAN FIRST: Analyze the request.
    2. VERBAL COOPERATION: Discuss the "Why" and "How" before implementation.

    CODING STANDARDS:
    1. FORMATTING: Use vertical, readable formatting.
    2. STRICT FILE STRUCTURE:
        - User Apps (GUI)    -> modules/home/packages.nix
        - System Utils (CLI) -> modules/core/packages.nix
        - System Services    -> modules/core/*.nix
        - User Configs       -> modules/home/*.nix
    3. IMPORTS: Use explicit imports in default.nix files. Avoid "import everything" folders.

    COMMANDS:
    - Rebuild: 'fr' (Fast Rebuild)
    - Update: 'up-os' (Update Flake & Rebuild)

    SAFETY PROTOCOLS:
    1. NO RISKY SED: Do NOT use 'sed' for complex edits.
    2. PREFER OVERWRITE: Use 'cat <<EOF' to generate FULL file content.
    </system_instructions>
  '';

  # --- IGNORE LIST ---
  # Exclude Git, Lockfiles, Images, and large binary files to save tokens
  ignoreList = "**/.git/**,**/flake.lock,**/result,**/*.png,**/*.jpg,**/*.jpeg,**/*.webp,**/*.ico,*.xml,*.md,LICENSE,Lis-os-dump.xml,**/modules/home/scripts/**";
in
{
  home.packages = [
    (pkgs.writeShellScriptBin "llm-dump" ''
      FINAL_OUTPUT="Lis-os-dump.xml"
      TEMP_OUTPUT="temp_repomix.xml"

      # Ensure we are in the repo root
      REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo ".")
      cd "$REPO_ROOT" || exit 1

      echo "🤖 Generating System Context for AI..."

      # Check for repomix
      if ! command -v repomix &> /dev/null; then
          echo "❌ Error: 'repomix' is not installed. Please install it first."
          exit 1
      fi

      # Run Repomix (XML style is best for LLMs)
      repomix --style xml --remove-comments --remove-empty-lines \
        --ignore "${ignoreList}" \
        --output "$TEMP_OUTPUT" > /dev/null 2>&1

      # Add Instructions to the top
      echo "${systemInstructions}" > "$FINAL_OUTPUT"
      echo "<context_note>CONTEXT: Full System Dump. Bloat & Docs removed.</context_note>" >> "$FINAL_OUTPUT"

      # Append the codebase (Removing the summary header to save space)
      if [ -f "$TEMP_OUTPUT" ]; then
        sed '/<file_summary>/,/<\/file_summary>/d' "$TEMP_OUTPUT" >> "$FINAL_OUTPUT"
        rm "$TEMP_OUTPUT"
      else
        echo "❌ Error: Repomix failed."
        exit 1
      fi

      echo "✅ Done. Context generated at: $REPO_ROOT/$FINAL_OUTPUT"
      echo "📊 Token Count (Approx Words): $(wc -w < "$FINAL_OUTPUT")"
    '')
  ];
}
