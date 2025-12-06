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

    # --- ADD THIS LINE ---
    ags.url = "github:Aylur/ags/v1";
  };

  outputs =
    { nixpkgs, flake-utils, ... }@inputs:
    let
      system = "x86_64-linux";

      # Helper function to create a host configuration
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
            inherit profile;
            inherit username;
          };
          modules = [
            ./hosts/default.nix
          ];
        };

    in
    {
      nixosConfigurations = {
        # Default template configuration
        # Users will create their own host configurations during installation
        nixos = mkHost {
          hostname = "nixos";
          profile = "amd";
          username = "lune";
        };
      };
    };
}
