{
  inputs,
  pkgs,
  lib,
  ...
}:
{
  home.packages = [
    (pkgs.callPackage ./package.nix {
      astalPkgs = inputs.astal.packages.${pkgs.system};
      ags = inputs.ags.packages.${pkgs.system}.ags;
    })
    # === ASTAL CLI TOOLS ===
    (pkgs.writeShellScriptBin "launcher" ''
      ${pkgs.glib}/bin/gapplication action io.Astal.com.lis.bar toggle-window "'launcher'"
    '')
    (pkgs.writeShellScriptBin "clipboard-manager" ''
      ${pkgs.glib}/bin/gapplication action io.Astal.com.lis.bar toggle-window "'clipboard'"
    '')
  ];
}
