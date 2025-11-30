{ pkgs, ... }:
let
  red = "\\033[0;31m";
  green = "\\033[0;32m";
  blue = "\\033[0;34m";
  reset = "\\033[0m";
  configDir = "~/Lis-os";
in
{
  home.packages = [
    # --- Fast Rebuild (fr) ---
    (pkgs.writeShellScriptBin "fr" ''
      set -e
      echo -e "${blue}📦 Staging all changes...${reset}"
      cd ${configDir} || exit
      git add .
      echo -e "${blue}🚀 Rebuilding NixOS...${reset}"
      NIX_CONFIG="warn-dirty = false" nh os switch .

      # Optional: Niri validation (can be removed if annoying)
      if command -v niri &> /dev/null; then
        echo -e "${blue}🔍 Validating Niri...${reset}"
        niri validate || echo -e "${red}⚠️ Niri config issues detected${reset}"
      fi
    '')

    # --- Update OS (up-os) ---
    (pkgs.writeShellScriptBin "up-os" ''
      set -e
      echo -e "${blue}📦 Staging all changes...${reset}"
      cd ${configDir} || exit
      git add .  # <--- ADDED THIS

      echo -e "${blue}🔄 Fetching flake updates...${reset}"
      nix flake update
      git add flake.lock

      echo -e "${blue}🚀 Rebuilding System...${reset}"
      NIX_CONFIG="warn-dirty = false" nh os switch .

      echo -e "${green}🎉 System updated successfully!${reset}"
    '')

    # ... clean-os, hist-os, debug-os ...
    (pkgs.writeShellScriptBin "clean-os" ''
      echo "🧹 System Garbage Collection"
      read -p "Keep how many generations? " keep_num
      if [[ ! "$keep_num" =~ ^[0-9]+$ ]]; then
          echo "❌ Invalid number."
          exit 1
      fi
      nh clean all --keep "$keep_num"
    '')

    (pkgs.writeShellScriptBin "hist-os" ''
      nix profile history --profile /nix/var/nix/profiles/system
    '')

    (pkgs.writeShellScriptBin "debug-os" ''
      cd ${configDir} || exit
      git add .
      echo "🧪 Dry Run..."
      nixos-rebuild dry-build --flake . --show-trace --log-format internal-json -v |& ${pkgs.nix-output-monitor}/bin/nom --json
    '')
  ];
}
