{ inputs, host, ... }:
{
  imports = [
    ./niri

    ./astal
  ];
  config = {
    _module.args = {
      inherit inputs host;
    };
  };
}
