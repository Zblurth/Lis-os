{ inputs, host, ... }:
{
  imports = [
    ./niri
    ./noctalia
    ./astal
  ];
  config = {
    _module.args = {
      inherit inputs host;
    };
  };
}
