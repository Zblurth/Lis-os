{ pkgs, ... }:
{
  services.greetd = {
    enable = true;
    settings = {
      default_session = {
        # Just launch Niri. Niri will handle the environment setup itself.
        command = "${pkgs.tuigreet}/bin/tuigreet --time --remember --cmd niri-session";
        user = "greeter";
      };
    };
  };

  # Keep the keyring unlock
  security.pam.services.greetd.enableGnomeKeyring = true;

  environment.systemPackages = [ pkgs.tuigreet ];
}
