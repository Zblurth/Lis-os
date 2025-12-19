# QEMU/KVM Virtualization for testing Arch with dcli
{ pkgs, ... }:
let
  username = "lune"; # Your user
in
{
  # Enable libvirtd daemon
  virtualisation.libvirtd = {
    enable = true;
    qemu = {
      package = pkgs.qemu_kvm;
      runAsRoot = true;
      swtpm.enable = true; # TPM emulation (useful for some OSes)
      # OVMF is now included by default on unstable
    };
  };

  # Add your user to libvirt group
  users.users.${username}.extraGroups = [ "libvirtd" ];

  # Virt-manager GUI
  programs.virt-manager.enable = true;

  # Useful packages for VM management
  environment.systemPackages = with pkgs; [
    virt-viewer # Lightweight VM viewer
    spice-gtk # Better clipboard/display for VMs
  ];

  # Enable dconf for virt-manager settings persistence
  programs.dconf.enable = true;
}
