{ pkgs, ... }:

pkgs.writers.writePython3Bin "lis-daemon" {
  libraries = [
    pkgs.python3Packages.watchfiles
    # tomllib is included in python 3.11+, 
    # if you are on older python, add pkgs.python3Packages.tomli
  ];
  flakeIgnore = [ "E501" ]; # Ignore line length errors
} (builtins.readFile ./orchestrator.py)
