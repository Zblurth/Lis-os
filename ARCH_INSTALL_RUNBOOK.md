# Arch Linux Installation Runbook

> **Target**: Btrfs + Snapper + GRUB + CachyOS Kernel + Niri
> **Hardware**: AMD 7800X3D + RX 9070 XT + 2TB NVMe + MediaTek WiFi

---

## LLM Assistant Prompt

<details>
<summary>Copy this to any LLM to get expert help</summary>

```
You are Apex, a senior Linux systems engineer specializing in Arch Linux, Btrfs filesystems, and modern desktop environments.

EXPERTISE:
- Arch Linux installation, configuration, and troubleshooting
- Btrfs: subvolumes, snapshots, rollback, nodatacow, compression
- Snapper/snap-pac/grub-btrfs ecosystem
- CachyOS optimizations for AMD Ryzen and RDNA GPUs
- Wayland compositors (Niri, Sway)
- Declarative package management (dcli)

PHILOSOPHY:
- Explain the "why" behind every command
- Think through edge cases before answering
- Never assume the user made a mistake - investigate first
- Trust your own expertise but verify against current Arch Wiki when uncertain
- This runbook is a guide, not gospel - adapt to actual system state

BEHAVIOR:
- When given an error, ask for full output before diagnosing
- Suggest checking logs: journalctl, dmesg, pacman.log
- For Btrfs issues, always check: btrfs subvolume list, /etc/fstab, mount output
- Prefer safe, reversible solutions (snapshots before changes)

CURRENT SETUP CONTEXT:
- Btrfs with subvolumes: @, @home, @log, @cache, @snapshots (archinstall creates these)
- GRUB bootloader with grub-btrfs for snapshot booting
- Snapper with snap-pac for automatic pre/post package snapshots
- CachyOS kernel (BORE scheduler) for AMD 7800X3D + RDNA 4
- Niri compositor with Noctalia shell

When helping, consider: Is this a config issue? A package conflict? A Btrfs subvolume mount problem? A kernel/driver issue?
```

</details>

---

## Using This Runbook in a VM

**Download command file:**
```bash
curl -O https://raw.githubusercontent.com/Zblurth/Lis-os/main/ARCH_COMMANDS.txt
less ARCH_COMMANDS.txt
```

**tmux split view:**
```bash
tmux              # Start
Ctrl+b then %     # Split vertical
```

**tmux copy-mode (to copy commands):**

| Step | Action |
|:---|:---|
| `Ctrl+b` then `[` | Enter copy-mode |
| Arrow keys | Navigate to start of text |
| `Space` | Start selection |
| Arrow keys | Select lines |
| `Enter` | Copy to buffer |
| `Ctrl+b` then `o` | Switch to other pane |
| `Ctrl+b` then `]` | Paste |

- `Ctrl+b Space` = layout swap (Vertical <-> Horizontal)
- `Ctrl+b arrow` = switch pane
- `Ctrl+b z` = zoom pane
- `Ctrl+b x` = close pane
- `Ctrl+d` = exit tmux

---

## Phase 1: Live USB

Boot from Ventoy or USB with Arch ISO.

### WiFi (iwctl)
```bash
iwctl
```
Inside iwctl:
```
device list                          # Find your device (wlan0)
station wlan0 scan
station wlan0 get-networks           # See available networks
station wlan0 connect "YourSSID"     # Connect (prompts for password)
exit
```

### Verify
```bash
ping -c3 archlinux.org
timedatectl set-ntp true
```

---

## Phase 2: CachyOS Repos (BEFORE Install)

Add CachyOS repos in live USB so base packages are optimized:

```bash
pacman-key --recv-keys F3B607488DB35A47 --keyserver keyserver.ubuntu.com
pacman-key --lsign-key F3B607488DB35A47
pacman -Sy
curl https://mirror.cachyos.org/cachyos-repo.tar.xz -o cachyos-repo.tar.xz
tar xvf cachyos-repo.tar.xz && cd cachyos-repo
./cachyos-repo.sh
cd ..
```

---

## Phase 3: Manual Partitioning (Flat Layout)

> **Cheatsheet**: See `ARCH_COMMANDS.txt` for copy-paste ready commands

### 3.1 Partition Disk
```bash
fdisk /dev/nvme0n1
# g (new GPT table)
# n, 1, default, +1G (EFI partition)
# t, 1 (change type to EFI System)
# n, 2, default, default (rest for Btrfs)
# w (write)
```

### 3.2 Format
```bash
mkfs.fat -F32 /dev/nvme0n1p1
mkfs.btrfs /dev/nvme0n1p2
```

### 3.3 Create FLAT Subvolumes
```bash
mount /dev/nvme0n1p2 /mnt
btrfs subvolume create /mnt/@
btrfs subvolume create /mnt/@home
btrfs subvolume create /mnt/@snapshots
btrfs subvolume create /mnt/@var_log
btrfs subvolume create /mnt/@var_pkg
umount /mnt
```

### 3.4 Mount Everything
```bash
mount -o noatime,compress=zstd,subvol=@ /dev/nvme0n1p2 /mnt
mkdir -p /mnt/{home,.snapshots,var/log,var/cache/pacman/pkg,efi}
mount -o noatime,compress=zstd,subvol=@home /dev/nvme0n1p2 /mnt/home
mount -o noatime,compress=zstd,subvol=@snapshots /dev/nvme0n1p2 /mnt/.snapshots
mount -o noatime,compress=zstd,subvol=@var_log /dev/nvme0n1p2 /mnt/var/log
mount -o noatime,compress=zstd,subvol=@var_pkg /dev/nvme0n1p2 /mnt/var/cache/pacman/pkg
mount /dev/nvme0n1p1 /mnt/efi
```

---

## Phase 4: Base Install

```bash
pacstrap -K /mnt base linux-cachyos linux-cachyos-headers linux-lts linux-firmware btrfs-progs amd-ucode zram-generator vim nano
pacstrap /mnt mesa-git vulkan-radeon networkmanager grub efibootmgr git base-devel niri alacritty firefox
genfstab -U /mnt >> /mnt/etc/fstab
```

> **Note**: `linux-lts` = fallback kernel, `zram-generator` = modern swap (no disk needed)

---

## Phase 5: System Config (chroot)

```bash
arch-chroot /mnt
```

### Timezone & Locale
```bash
ln -sf /usr/share/zoneinfo/Europe/Paris /etc/localtime
hwclock --systohc
echo "en_GB.UTF-8 UTF-8" >> /etc/locale.gen
locale-gen
echo "LANG=en_GB.UTF-8" > /etc/locale.conf
echo "KEYMAP=us" > /etc/vconsole.conf
echo "archbox" > /etc/hostname
```

### Users
```bash
passwd                           # Root password
useradd -m -G wheel -s /bin/bash lune
passwd lune
EDITOR=vim visudo                # Uncomment: %wheel ALL=(ALL:ALL) ALL
```

### Bootloader
```bash
grub-install --target=x86_64-efi --efi-directory=/efi --bootloader-id=GRUB
grub-mkconfig -o /boot/grub/grub.cfg
systemctl enable NetworkManager
```

### zram (Modern Swap)
```bash
cat > /etc/systemd/zram-generator.conf << 'EOF'
[zram0]
zram-size = ram / 2
compression-algorithm = zstd
EOF
```

### Exit & Reboot
```bash
exit
umount -R /mnt
reboot
```

---

## Phase 6: First Boot

### Connect WiFi
```bash
nmtui
```

### Start Niri
```bash
niri
```

Now you have alacritty + firefox. Open this runbook, copy-paste the rest!

---

## Phase 7: AUR Helper

```bash
git clone https://aur.archlinux.org/paru.git
cd paru && makepkg -si
cd .. && rm -rf paru
```

---

## Phase 8: Verify CachyOS

Since CachyOS was configured before install, just verify:

```bash
uname -r              # Should show "cachyos"
pacman -Q mesa-git    # Should be installed
```

If not installed during archinstall, run:
```bash
sudo pacman -S linux-cachyos linux-cachyos-headers mesa-git
sudo grub-mkconfig -o /boot/grub/grub.cfg
sudo reboot
```

---

## Phase 9: Snapshot System

### 6.1 Install Packages
```bash
sudo pacman -S snapper snap-pac grub-btrfs btrfs-progs
```

### 6.2 Verify Snapper
```bash
sudo snapper list
```

If you see snapshots, archinstall configured it. **Skip to 6.3**.

If empty, create config:
```bash
sudo snapper -c root create-config /
```

### 6.3 Set Retention
```bash
sudo sed -i 's/TIMELINE_LIMIT_HOURLY=.*/TIMELINE_LIMIT_HOURLY="5"/' /etc/snapper/configs/root
sudo sed -i 's/TIMELINE_LIMIT_DAILY=.*/TIMELINE_LIMIT_DAILY="7"/' /etc/snapper/configs/root
sudo sed -i 's/TIMELINE_LIMIT_WEEKLY=.*/TIMELINE_LIMIT_WEEKLY="2"/' /etc/snapper/configs/root
sudo sed -i 's/TIMELINE_LIMIT_MONTHLY=.*/TIMELINE_LIMIT_MONTHLY="1"/' /etc/snapper/configs/root
sudo sed -i 's/TIMELINE_LIMIT_YEARLY=.*/TIMELINE_LIMIT_YEARLY="0"/' /etc/snapper/configs/root
```

### 6.4 Enable Services
```bash
sudo systemctl enable --now snapper-timeline.timer
sudo systemctl enable --now snapper-cleanup.timer
sudo systemctl enable --now grub-btrfsd
```

### 6.5 Regenerate GRUB
```bash
sudo grub-mkconfig -o /boot/grub/grub.cfg
```

---

## Phase 10: nodatacow Subvolumes (Optional)

> **Note**: Check your current subvolume layout first:
> ```bash
> sudo btrfs subvolume list /
> ```

For games and swap with disabled copy-on-write:

```bash
sudo mount /dev/nvme0n1p2 /mnt -o subvolid=5
sudo btrfs subvolume create /mnt/@swap
sudo btrfs subvolume create /mnt/@games
sudo chattr +C /mnt/@swap /mnt/@games
sudo umount /mnt
```

Add to `/etc/fstab`:
```
# Get your UUID with: blkid /dev/nvme0n1p2
UUID=YOUR-UUID  /swap            btrfs  subvol=@swap,noatime,nodatacow  0  0
UUID=YOUR-UUID  /home/lune/Games btrfs  subvol=@games,noatime,nodatacow 0  0
```

Then:
```bash
sudo mkdir -p /swap /home/lune/Games
sudo mount -a
sudo chown lune:lune /home/lune/Games
```

---

## Phase 11: Declarative Setup with dcli

### 8.1 Install dcli
```bash
paru -S dcli
```

### 8.2 Initialize Config
```bash
dcli init
```

Creates `~/.config/arch-config/`:
```
├── config.yaml      # Host pointer
├── hosts/           # Machine configs
├── modules/         # Package bundles
├── scripts/         # Post-install hooks
└── state/           # Tracked state (git ignored)
```

### 8.3 Create Modules

**modules/base.yaml**:
```yaml
description: Core CLI tools
packages:
  - eza
  - bat
  - fd
  - zoxide
  - ripgrep
  - yazi
  - fzf
  - starship
  - jq
  - unzip
  - p7zip
  - zsh
  - zsh-syntax-highlighting
  - zsh-autosuggestions
```

**modules/desktop.yaml**:
```yaml
description: Niri + Wayland
packages:
  - niri
  - alacritty
  - firefox
  - vivaldi
  - pipewire
  - wireplumber
  - xdg-desktop-portal-gtk
  - playerctl
  - ddcutil
  - vesktop-bin
  - swayosd
```

**modules/gaming.yaml**:
```yaml
description: Steam and gaming
packages:
  - steam
  - gamescope
  - mangohud
  - gamemode
  - lib32-mesa
  - lib32-vulkan-radeon
```

**modules/theme.yaml**:
```yaml
description: Magician deps
packages:
  - python-pillow
  - python-jinja
  - python-pydantic
  - python-numpy
  - opencv
  - imagemagick
  - swww
  - libnotify
  - gowall
```

### 8.4 Host Config

**hosts/archbox.yaml**:
```yaml
host: archbox
enabled_modules:
  - base
  - desktop
  - gaming
  - theme
backup_tool: snapper
snapper_config: root
services:
  enabled:
    - NetworkManager
    - grub-btrfsd
```

### 8.5 Sync
```bash
dcli validate          # Check syntax
dcli sync --dry-run    # Preview
dcli sync              # Apply (auto Snapper backup!)
```

### 8.6 Workflow
```bash
dcli add <pkg>         # Add + install
dcli rm <pkg>          # Remove + uninstall
dcli sync              # Reconcile
dcli repo push         # Git commit + push
```

### 8.7 Version Control
```bash
dcli repo init
dcli repo push
```

> **Note**: Your `~/.config/arch-config/` mirrors your NixOS `Lis-os/` structure!

---

## Rollback Procedures

### Simple Rollback (like NixOS)
1. Reboot → GRUB menu
2. Select **"Arch Linux Snapshots"**
3. Choose snapshot → Enter
4. Once booted, make permanent:
   ```bash
   sudo snapper rollback
   ```

### Disaster Recovery (won't boot)
```bash
# From live USB
mount -o subvolid=5 /dev/nvme0n1p2 /mnt
mv /mnt/@ /mnt/@_broken
btrfs subvolume snapshot /mnt/@snapshots/123/snapshot /mnt/@
reboot
```

### Snapshot Commands
| Task | Command |
|:---|:---|
| List snapshots | `sudo snapper list` |
| Create snapshot | `sudo snapper create -d "before ricing"` |
| Delete snapshot | `sudo snapper delete <number>` |
| Compare snapshots | `sudo snapper diff <num1>..<num2>` |
| GUI management | `btrfs-assistant` |

---

## Quick Reference

| Task | Command |
|:---|:---|
| WiFi (terminal GUI) | `nmtui` |
| Update system | `sudo pacman -Syu` |
| Install AUR | `paru -S package` |
| Regenerate GRUB | `sudo grub-mkconfig -o /boot/grub/grub.cfg` |
| Snapper config | `/etc/snapper/configs/root` |
| Check kernel | `uname -r` |
| Check mesa | `glxinfo \| grep "OpenGL version"` |

---

## ⚠️ Troubleshooting

### paru: libalpm.so error
```bash
cd ~ && rm -rf paru
git clone https://aur.archlinux.org/paru.git
cd paru && makepkg -si
```

### Snapper collision (archinstall)
If `snapper create-config` fails after archinstall:
```bash
sudo umount /.snapshots
sudo rm -r /.snapshots
sudo snapper -c root create-config /
sudo btrfs subvolume delete /.snapshots
sudo mkdir /.snapshots
sudo mount -a
```

### CachyOS kernel not booting
```bash
sudo grub-mkconfig -o /boot/grub/grub.cfg
```

---

## 📚 Nice to Know

### Arch vs NixOS Mental Model
| Concept | NixOS | Arch + dcli |
|:---|:---|:---|
| Config location | `/etc/nixos/` | `~/.config/arch-config/` |
| Package list | `flake.nix` | `modules/*.yaml` |
| Apply changes | `sudo nixos-rebuild switch` | `dcli sync` |
| Rollback | Boot menu (generations) | Boot menu (snapshots) |
| Atomic | Yes (generations) | Yes (Btrfs snapshots) |

### Useful Paths
| Path | Purpose |
|:---|:---|
| `/etc/snapper/configs/root` | Snapper retention settings |
| `/etc/pacman.conf` | Repos (CachyOS at top = priority) |
| `~/.config/arch-config/` | dcli config root |
| `/var/log/pacman.log` | Package history |
| `/.snapshots/` | All system snapshots |

### Performance Tips
- **CachyOS kernel** = BORE scheduler = lower latency gaming
- **mesa-git** (from CachyOS) = RDNA 4 ray tracing support
- **zram** = faster than swap partition on NVMe
- **noatime** mount option = reduced SSD writes

### dcli Pro Tips
- `dcli sync --dry-run` = preview changes
- `dcli sync --prune` = remove unlisted packages
- `dcli merge --services` = import running services to config
- `dcli backup check` = verify Snapper integration

### Btrfs Commands
```bash
btrfs subvolume list /          # List all subvolumes
btrfs filesystem usage /        # Disk usage
btrfs scrub start /             # Check for corruption
btrfs balance start /           # Rebalance (slow)
sudo compsize /                 # Compression stats (install compsize)
```

### When Things Break
1. **Boot fails** → Select snapshot in GRUB
2. **GUI crashes** → `Ctrl+Alt+F2` → TTY login
3. **Pacman locked** → `sudo rm /var/lib/pacman/db.lck`
4. **Network gone** → `nmtui` or `nmcli device wifi connect SSID`
5. **Black screen** → Add `nomodeset` to kernel params in GRUB

