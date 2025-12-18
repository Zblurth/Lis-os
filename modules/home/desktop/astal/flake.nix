{
  description = "Astal V6 - Cassowary Citadel";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    astal.url = "github:aylur/astal";
  };

  outputs =
    {
      self,
      nixpkgs,
      astal,
    }:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
    in
    {
      devShells.${system}.default = pkgs.mkShell {
        nativeBuildInputs = [
          pkgs.wrapGAppsHook4
          pkgs.gobject-introspection
          pkgs.typescript
          pkgs.npm
          astal.packages.${system}.default
        ];

        buildInputs = [
          pkgs.gtk4
          pkgs.gtk4-layer-shell
          pkgs.libadwaita
          astal.packages.${system}.io
          astal.packages.${system}.battery
          astal.packages.${system}.wireplumber
          astal.packages.${system}.hyprland # Optional backup
          astal.packages.${system}.network
          astal.packages.${system}.tray
          astal.packages.${system}.mpris
        ];
      };
    };
}
