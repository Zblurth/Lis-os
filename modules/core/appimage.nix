{ pkgs, ... }:

{
  # 1. Enable binfmt to run AppImages directly
  boot.binfmt.registrations.appimage = {
    wrapInterpreterInShell = false;
    interpreter = "${pkgs.appimage-run}/bin/appimage-run";
    recognitionType = "magic";
    offset = 0;
    mask = ''\xff\xff\xff\xff\x00\x00\x00\x00\xff\xff\xff'';
    magicOrExtension = ''\x7fELF....AI\x02'';
  };

  # 2. Install appimage-run system-wide (so all users can use it)
  environment.systemPackages = [ pkgs.appimage-run ];

  # 3. Optional: FUSE support (makes AppImages mountable)
  programs.fuse.userAllowOther = true;
}
