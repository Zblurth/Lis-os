{ lib, ... }:
let
  variables = import ../../hosts/variables.nix;
  barChoice = variables.barChoice or "noctalia";
  defaultShell = variables.defaultShell or "zsh";
in
{
  imports = [
    ./appimage.nix
    ./desktop
    ./environment.nix

    # The New Programs Folder
    ./programs/fzf.nix
    ./programs/git.nix
    ./programs/kitty.nix
    ./programs/lazygit.nix
    ./programs/starship.nix
    ./programs/thunar.nix
    ./programs/vivaldi-flags.nix
    ./programs/wezterm.nix
    ./programs/zed.nix
    ./programs/zoxide.nix
    ./programs/antigravity.nix
    ./programs/hyfetch.nix
    ./programs/zellij.nix

    # Theme Logic
    ./theme/default.nix
    ./theme/gtk.nix
    ./theme/qt.nix
    ./theme/stylix/stylix.nix

    # System
    ./packages.nix
    ./scripts
  ]
  ++ lib.optionals (defaultShell == "zsh") [ ./programs/zsh.nix ];
}
