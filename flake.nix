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

    # THE COMPLETE STACK
    astal = {
      url = "github:aylur/astal";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    ags = {
      url = "github:aylur/ags";
      inputs.nixpkgs.follows = "nixpkgs";
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
      ...
    }@inputs:
    let
      system = "x86_64-linux";

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
            ({ ... }: {
               nixpkgs.overlays = [ niri-flake.overlays.niri ];
            })
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
    };
}
