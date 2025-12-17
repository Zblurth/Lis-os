{ ... }:
let
  variables = import ../../../hosts/variables.nix;
  defaultShell = variables.defaultShell or "zsh";
in
{
  programs.starship.enable = defaultShell != "fish";

  # Source the template from the separate file
  xdg.configFile."wal/templates/starship.toml".source = ../theme/templates/starship.toml;
}
