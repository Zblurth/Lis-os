{ inputs, host, ... }:
{
  imports = [
    ./niri
    #./rofi
    ./astal
  ];
  config = {
    _module.args = {
      inherit inputs host;
    };
  };
}
