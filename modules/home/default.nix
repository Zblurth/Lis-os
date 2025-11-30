{
  host,
  lib,
  ...
}:
let
  variables = import ../../hosts/${host}/variables.nix;

  # Clean variables (only what is actually used)
  barChoice = variables.barChoice or "noctalia";
  defaultShell = variables.defaultShell or "zsh";
  useNvidia = variables.useNvidia or false;
in
{
  imports = [
    ./scripts
    ./packages.nix
    ./fzf.nix
    ./git.nix
    ./gtk.nix
    ./kitty.nix
    ./lazygit.nix
    ./qt.nix
    ./starship.nix
    ./stylix.nix
    ./zed.nix
    ./zoxide.nix
    ./environment.nix
    ./niri
  ]
  # Changed from ./zsh to ./zsh.nix
  ++ lib.optionals (defaultShell == "zsh") [
    ./zsh.nix
  ]
  ++ lib.optionals (barChoice == "noctalia") [
    ./noctalia-shell
  ];

  # Pass useNvidia to other modules
  _module.args = {
    inherit useNvidia;
  };
}
