{
  lib,
  ...
}:
let
  variables = import ../../hosts/variables.nix;

  barChoice = variables.barChoice or "noctalia";
  defaultShell = variables.defaultShell or "zsh";
in
{
  imports = [
    ./appimage.nix
    ./environment.nix
    ./fzf.nix
    ./git.nix
    ./gtk.nix
    ./kitty.nix
    ./lazygit.nix
    ./niri
    ./packages.nix
    ./qt.nix
    ./scripts
    ./starship.nix
    ./stylix.nix
    ./thunar.nix
    ./zed.nix
    ./zoxide.nix
  ]
  ++ lib.optionals (defaultShell == "zsh") [ ./zsh.nix ]
  ++ lib.optionals (barChoice == "noctalia") [ ./noctalia-shell ];
}
