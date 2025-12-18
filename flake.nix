{
  description = "Lis-os";
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    home-manager = {
      url = "github:nix-community/home-manager";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    stylix.url = "github:danth/stylix";
    noctalia.url = "github:noctalia-dev/noctalia-shell";
    niri-flake.url = "github:sodiboo/niri-flake";
    astal = {
      url = "github:aylur/astal";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    ags.url = "github:aylur/ags/v2.3.0";
    chaotic.url = "github:chaotic-cx/nyx/nyxpkgs-unstable";
  };
  outputs =
    {
      self,
      nixpkgs,
      home-manager,
      niri-flake,
      chaotic,
      astal,
      ags,
      ...
    }@inputs:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
      astalLibs = with astal.packages.${system}; [
        astal3
        io
        battery
        network
        tray
        wireplumber
        notifd
        apps
        mpris
        hyprland
        bluetooth
      ];
      mkHost =
        {
          hostname,
          profile,
          username,
        }:
        nixpkgs.lib.nixosSystem {
          inherit system;
          specialArgs = {
            inherit inputs;
            host = hostname;
            inherit profile username;
          };
          modules = [
            (
              { ... }:
              {
                nixpkgs.overlays = [
                  niri-flake.overlays.niri
                  chaotic.overlays.default
                ];
              }
            )
            ./hosts/default.nix
          ];
        };
    in
    {
      nixosConfigurations = {
        nixos = mkHost {
          hostname = "nixos";
          profile = "amd";
          username = "lune";
        };
      };
      homeConfigurations."lune" = home-manager.lib.homeManagerConfiguration {
        inherit pkgs;
        modules = [
          ./home/lune.nix
          {
            nixpkgs.overlays = [ niri-flake.overlays.niri ];
          }
        ];
        extraSpecialArgs = { inherit inputs; };
      };
      packages.${system} = {
        lis-bar = pkgs.callPackage ./modules/home/desktop/astal/package.nix {
          astalPkgs = astal.packages.${system};
          ags = ags.packages.${system}.ags;
        };
        default = self.packages.${system}.lis-bar;
      };
      devShells.${system}.default = pkgs.mkShell {
        buildInputs = [
          pkgs.gjs
          pkgs.nodejs
          ags.packages.${system}.ags
          pkgs.wrapGAppsHook3
        ]
        ++ astalLibs
        ++ [
          pkgs.cava
          pkgs.curl
          pkgs.brightnessctl
        ];
        shellHook = ''
          echo "🛠️ Astal Dev Shell"
          echo "Use 'ags bundle app.tsx bundle.js' then 'gjs -m bundle.js'"
        '';
      };
    };
}
