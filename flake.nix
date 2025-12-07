{
  description = "Lis-os";

  nixConfig = {
    extra-substituters = [ "https://nyx.chaotic.cx" ];
    extra-trusted-public-keys = [ "nyx.chaotic.cx-1:HfnXSw4pjGN/t5FvAFXxI4uE8r2wkTy85vRpne3w8Fs=" ];
  };

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";

    home-manager = {
      url = "github:nix-community/home-manager";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    stylix.url = "github:danth/stylix";
    noctalia.url = "github:noctalia-dev/noctalia-shell";
    niri-flake.url = "github:sodiboo/niri-flake";

    # Backend
    astal = {
      url = "github:aylur/astal";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    # Frontend Source
    ags = {
      url = "github:aylur/ags/v2"; # Add /v2 here
      inputs.nixpkgs.follows = "nixpkgs";
    };

    # The Missing Dependency (Raw Source)
    gnim = {
      url = "github:aylur/gnim";
      flake = false;
    };
  };

  outputs =
    {
      self,
      nixpkgs,
      home-manager,
      niri-flake,
      astal,
      ags,
      gnim,
      ...
    }@inputs:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};

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
                nixpkgs.overlays = [ niri-flake.overlays.niri ];
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

      # KEEP existing homeConfigurations
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

      # ADD THIS RIGHT HERE - New packages section
      packages.${system} = {
        lis-bar = pkgs.callPackage ./modules/home/desktop/ags/lis-bar.nix {
          astal = astal.packages.${system};
          ags-src = ags;
          gnim-src = gnim;
        };
        default = self.packages.${system}.lis-bar;
      };
    };
}
