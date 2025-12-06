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
      git add .

      echo -e "${blue}🔄 Fetching flake updates...${reset}"
      nix flake update
      git add flake.lock

      echo -e "${blue}🚀 Rebuilding System...${reset}"
      NIX_CONFIG="warn-dirty = false" nh os switch .

      echo -e "${green}🎉 System updated successfully!${reset}"
    '')

    # --- Test OS (test-os) ---
    (pkgs.writeShellScriptBin "test-os" ''
      set -e
      echo -e "${blue}🧪 STARTING TEST RUN (Ephemeral)...${reset}"
      cd ${configDir} || exit

      echo -e "${blue}🧹 Cleaning old backups...${reset}"
      find "$HOME/.config" -name "*.backup" -delete

      echo -e "${blue}📦 Staging changes...${reset}"
      git add .

      echo -e "${blue}🔨 Building and Activating Test Environment...${reset}"
      NIX_CONFIG="warn-dirty = false" nh os test .

      echo -e "${green}✅ Test Environment Active!${reset}"
      echo -e "${blue}ℹ️  NOTE: Changes are live but NOT permanent.${reset}"
      echo -e "${blue}ℹ️  Reboot your PC to discard these changes.${reset}"
    '')

    # --- CLEAN OS (Updated) ---
    (pkgs.writeShellScriptBin "clean-os" ''
      echo -e "${blue}🧹 System Garbage Collection${reset}"
      read -p "Keep how many recent generations? (Recommended: 3-5): " keep_num
      if [[ ! "$keep_num" =~ ^[0-9]+$ ]]; then
          echo -e "${red}❌ Invalid number.${reset}"
          exit 1
      fi

      echo -e "${blue}🗑️  Deleting old generations...${reset}"
      nh clean all --keep "$keep_num"

      echo -e "${blue}🗜️  Optimizing Store (Deduplicating files)...${reset}"
      echo "This might take a while..."
      nix-store --optimise

      echo -e "${green}✨ System Cleaned & Optimized!${reset}"
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
