{ inputs, host, ... }:
{
  imports = [
    ./niri
    ./rofi
    ./ags
  ];
  config = {
    _module.args = {
      inherit inputs host;
    };
  };
}
