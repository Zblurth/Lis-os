{
  inputs,
  pkgs,
  config,
  lib,
  ...
}:
let
  system = pkgs.system;
  astal = inputs.astal.packages.${system};

  # Build lis-bar package
  lis-bar = pkgs.callPackage ./lis-bar.nix {
    inherit astal;
    ags-pkg = inputs.ags.packages.${system}.default; # Or whatever the attribute is
  };
in
{
  home.packages = [ lis-bar ];

  # Optional: Keep symlink for easy editing
  xdg.configFile."ags".source =
    config.lib.file.mkOutOfStoreSymlink "${config.home.homeDirectory}/Lis-os/modules/home/desktop/ags/config";
}
