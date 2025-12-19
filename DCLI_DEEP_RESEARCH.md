# Deep Research: NixOS → Arch + dcli Migration Strategy

## Context
I am migrating from NixOS to Arch Linux. I want to use **dcli** (a declarative package manager inspired by NixOS) to maintain similar organizational principles without the complexity of the Nix language.

## My Goals
1. **Understand dcli deeply** - How it works, its module system, dotfile management, and limitations
2. **Design an Arch dotfiles structure** that mirrors my NixOS organization philosophy but is simpler
3. **Identify what's portable** from my NixOS config and what needs to be reimplemented
4. **Create a practical migration plan** with folder structure, dcli modules, and a dotfile strategy (GNU Stow vs chezmoi)

## What I DON'T Want
- A 1:1 port of my NixOS config
- Unnecessary complexity
- To lose the "single source of truth" organization I have now

## What I VALUE
- **Modularity**: Separate concerns (desktop, programs, theme, etc.)
- **Git-based config**: Everything in one repo
- **Theme engine**: I have a custom Python-based theme engine that generates configs from wallpapers - this is portable
- **Declarative packages**: dcli should handle this
- **Easy iteration**: I want to test in a VM before committing

---

## ATTACHED: dcli Documentation

Please analyze the dcli repository documentation thoroughly. Key files:
- `README.md` - Full documentation
- `CHEAT-SHEET.md` - Command reference
- `DIRECTORY-MODULES.md` - Module system explanation
- `SERVICES.md` - Service management
- `example-services-config.yaml` - Config format example

---

## ATTACHED: My Current NixOS Config (Lean Dump)

This is my current NixOS configuration, stripped of heavy folders (node_modules, astal shell, etc.) to focus on the structure and logic.

Key files to analyze:
- `flake.nix` - Entry point
- `hosts/default.nix` - System module imports
- `modules/core/*` - System-level config (boot, hardware, packages, etc.)
- `modules/home/*` - User-level config (programs, packages, desktop)
- `modules/home/theme/*` - My custom theme engine (Python, 100% portable)
- `modules/home/programs/*` - Per-program configurations

---

## Questions for Deep Research

### 1. dcli Architecture
- How does dcli's module system compare to NixOS modules?
- Can dcli handle conditional package installation (e.g., different packages for laptop vs desktop)?
- How does dcli manage dotfiles - does it use symlinks like GNU Stow?
- What are dcli's limitations compared to NixOS?

### 2. Folder Structure Design
- What's the optimal folder structure for an Arch dotfiles repo using dcli + Stow?
- How should I organize dcli modules vs stow packages?
- Where should my theme engine live?

### 3. Migration Mapping
For each NixOS component, tell me:
- Is it portable as-is?
- What's the Arch equivalent?
- How would I implement it with dcli?

Components to map:
- `flake.nix` inputs (niri-flake, stylix, chaotic)
- `modules/core/packages.nix` (system packages)
- `modules/home/packages.nix` (user packages)
- `modules/home/programs/*.nix` (per-program config)
- `modules/home/theme/*` (theme engine)
- `modules/home/desktop/niri/*` (window manager config)

### 4. Desktop Environment
- I use Niri (Wayland compositor) on NixOS. It may not work in VMs.
- For testing, I'll use Hyprland or KDE.
- How should I structure configs to support multiple DEs?

### 5. Implementation Plan
Provide a step-by-step plan:
1. Folder structure to create
2. dcli config files to write
3. Stow packages to organize
4. Theme engine integration
5. Testing workflow in VM

---

## Output Format

Please provide:
1. **Executive Summary** - Key insights about dcli and migration strategy
2. **Proposed Folder Structure** - Complete tree with explanations
3. **dcli Module Examples** - Actual YAML files I can use
4. **Migration Checklist** - Step-by-step with estimated effort
5. **Gotchas & Limitations** - What won't work or needs workarounds


---

# DCLI REPOSITORY DOCUMENTATION



## FILE: README.md

# dcli

A declarative package management CLI tool for Arch Linux, inspired by NixOS. **Built with Rust for performance and reliability.**

## Features

- **Interactive TUI Interface**: Beautiful fzf-powered interfaces for package search, module management, snapshots, and hooks
- **Declarative Package Management**: Define your packages in YAML files and sync your system to match
- **System Services Management**: Declaratively manage systemd services alongside packages (NEW!)
- **Flexible Configuration Structure**: Choose between simple single-file or advanced multi-machine setups with imports
- **Config Migration Tool**: Safely migrate from old structure to new clean layout with `dcli migrate`
- **Flatpak Support**: Seamlessly manage flatpak applications alongside pacman packages
- **Module System**: Organize packages into reusable modules (gaming, development, etc.)
- **Host-Specific Configurations**: Maintain different package sets per machine with full config imports
- **Automatic Backups**: Integrates with Timeshift/Snapper for automatic snapshots before changes (skip with `--no-backup`)
- **Conflict Detection**: Prevents enabling conflicting modules
- **Post-Install Hooks**: Run scripts after package installation (skip with `--no-hooks`)
- **Safe Package Merge**: Capture manually installed packages to separate file (explicit packages only, never dependencies)
- **Git Repository Management**: Built-in commands to sync configurations across machines
- **Self-Updating**: Update dcli itself with a single command
- **Package Management Shortcuts**: Quick wrappers around pacman and AUR helpers
- **Zero Runtime Dependencies**: Self-contained Rust binary with no external dependencies required

### ✨ Interactive TUI Features

dcli provides beautiful, intuitive TUI interfaces powered by `fzf` for common operations:

| Command | Description | Features |
|---------|-------------|----------|
| `dcli search` | Search and install packages | Multi-select, live preview, AUR support |
| `dcli module enable` | Enable modules interactively | Multi-select, YAML preview |
| `dcli module disable` | Disable modules interactively | Multi-select, YAML preview |
| `dcli restore` | Select snapshot to restore | Browse snapshots, works with Timeshift/Snapper |
| `dcli hooks run` | Run post-install hooks | Browse hooks, preview script paths |

All TUI interfaces feature:
- 🎨 Consistent blue borders with cyan labels
- ⌨️ TAB for multi-select (where applicable)
- 🔍 Real-time search/filtering
- 📄 Live preview panes
- ⚡ Keyboard-driven workflow

**Optional dependency:** Install `fzf` to enable TUI features: `sudo pacman -S fzf`
## Installation

> **⚠️ ALPHA SOFTWARE DISCLAIMER**
> 
> dcli is currently in alpha stage. While it has been tested extensively, use at your own risk. Always maintain backups of your system before performing major operations. The author is not responsible for any system issues, data loss, or problems that may arise from using this tool. By using dcli, you accept full responsibility for your system's state and any changes made to it.

### Prerequisites

**Required:**
- Arch Linux or Arch-based distribution
- **Rust toolchain (cargo)** - Only needed for building/updating, not for runtime
  - The install script will offer to install Rust automatically if not found
  - Or install manually: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`

**Optional (recommended):**
- `paru` or `yay` - AUR helper for AUR package support (configurable via `aur_helper` setting)
- `timeshift` or `snapper` - For backup/snapshot functionality

**Note:** Unlike the Bash version, the Rust version has **no runtime dependencies**. No need for `go-yq`, `inetutils`, or any other tools - it's a self-contained binary!

### Install

```bash
git clone https://gitlab.com/theblackdon/dcli.git
cd dcli
./install.sh
```

The installer will:
1. Check for Rust and offer to install it automatically if not found
2. Build the Rust binary with `cargo build --release` (if not already built)
3. Copy the binary to `/usr/local/bin/dcli` (requires sudo)
4. Set executable permissions
5. Verify the installation
6. Check for optional dependencies (AUR helper, backup tools)

### Migrating from Bash Version to Rust Version

If you're currently using the bash version of dcli, upgrading to the Rust version is easy! **Your configuration files remain completely unchanged.**

#### Why Upgrade?

- **Zero Runtime Dependencies**: No need for `go-yq` or other external tools
- **Faster Performance**: Rust binary is significantly faster than bash scripts
- **Better Error Handling**: More robust error messages and handling
- **Improved Reliability**: Compiled binary with type safety
- **Same Configuration**: All your YAML configs work exactly the same!

#### Quick Migration (Recommended)

Simply run the automated migration script:

```bash
cd ~/dcli  # or wherever you cloned dcli
git pull origin main
./update-to-rust.sh
```

That's it! The script will:
- Back up your current bash version
- Install Rust toolchain (if needed)
- Build the Rust binary
- Replace the old bash script
- Verify everything works
- Preserve all your configuration files

#### What Changes?

**Nothing in your workflow!** All commands work exactly the same:
- ✅ `dcli sync` - Same behavior
- ✅ `dcli module enable/disable` - Same behavior  
- ✅ `dcli backup` - Same behavior
- ✅ Your YAML configuration files - Unchanged
- ✅ Your modules and hooks - Unchanged

The only difference is improved performance and no external dependencies!

#### Rollback (if needed)

If you need to go back to the bash version:

```bash
sudo cp /usr/local/bin/dcli.bash.backup /usr/local/bin/dcli
```

### Initialize Configuration

After installation, you have two options to initialize your arch-config:

#### Option 1: Create Your Own Configuration (New Structure)

```bash
dcli init
```

This creates `~/.config/arch-config/` with the **new clean structure**:
```
arch-config/
├── config.yaml           # Pointer to active host config
├── hosts/
│   └── {hostname}.yaml   # Full host configuration
├── modules/
│   ├── base.yaml         # Base packages for all machines
│   └── example.yaml      # Example module template
├── scripts/              # Post-install hook scripts
└── state/                # Auto-generated state files (git-ignored)
```

**New Structure Benefits:**
- Cleaner organization (no `packages/` parent directory)
- Host files contain full configuration (not just packages)
- Support for config imports across machines
- Easier multi-machine management

**Backwards Compatible:** Existing configs with `packages/` structure still work!

#### Option 2: Bootstrap from BlackDon's Configuration

Want to start with a pre-configured setup? Use the bootstrap option:

```bash
dcli init -b
# or
dcli init --bd
```

This will:
- Clone BlackDon's arch-config from GitLab
- Copy all packages, modules, and scripts
- Create a fresh `config.yaml` with your hostname
- Create a new host-specific configuration file
- **Disconnect from BlackDon's repository** (you start fresh!)

**Important:** After bootstrapping, the configuration is completely yours. You cannot push changes back to BlackDon's repository. To version control your customizations, run `dcli repo init` and create your own repository.

Perfect for users who want to:
- Get started quickly with a battle-tested configuration
- Use BlackDon's curated package modules
- Have a solid foundation to customize from

## Configuration Structure

dcli supports two directory structures. New installations use the clean structure, while existing installations continue to work.

### New Structure (Recommended)

```
arch-config/
├── config.yaml              # Pointer file (just contains: host: hostname)
├── hosts/
│   ├── laptop.yaml         # Full config for laptop
│   ├── desktop.yaml        # Full config for desktop
│   └── shared/             # Optional: shared configs
│       └── common.yaml
├── modules/
│   ├── base.yaml           # Base packages (auto-loaded)
│   ├── gaming/             # Module directory
│   │   ├── module.yaml
│   │   └── packages.yaml
│   └── dev.yaml            # Simple module file
├── scripts/                # Post-install hooks
├── system-packages.yaml    # Auto-generated by 'dcli merge' (git-ignored)
└── state/                  # Runtime state (git-ignored)
```

### Host Configuration Files

Host files now contain your complete configuration:

```yaml
# hosts/laptop.yaml
host: laptop
description: Work Laptop

# Import shared configurations (optional)
import:
  - hosts/shared/common.yaml

# Enabled modules
enabled_modules:
  - gaming
  - dev-tools

# Host-specific packages
packages:
  - tlp
  - laptop-mode-tools

# Exclude packages from base or modules
exclude:
  - steam  # Don't want gaming on work laptop

# Settings
flatpak_scope: user
auto_prune: false
backup_tool: timeshift

# AUR helper (auto-detects paru or yay if not specified)
aur_helper: paru  # Options: paru, yay, or any compatible AUR helper
```

### Config Import Feature

Share configurations across multiple machines:

```yaml
# hosts/laptop.yaml
import:
  - hosts/shared/laptop-common.yaml

# hosts/desktop.yaml
import:
  - hosts/shared/desktop-common.yaml
  - hosts/shared/gaming-common.yaml
```

This allows you to:
- Create shared configs for similar machines
- Avoid duplication across hosts
- Organize complex configurations
- Import multiple files recursively

### AUR Helper Configuration

dcli supports declarative AUR helper configuration, allowing you to specify which AUR helper to use for package management.

**Supported AUR Helpers:**
- `paru` (recommended)
- `yay`
- Any compatible AUR helper that supports pacman-like syntax

**Configuration:**

Add the `aur_helper` field to your host configuration file:

```yaml
# hosts/laptop.yaml
host: laptop

# Specify which AUR helper to use
aur_helper: paru  # or 'yay'

# ... rest of your configuration
```

**Auto-Detection:**

If you don't specify an `aur_helper`, dcli will automatically detect which AUR helper is installed:
1. First checks for `paru`
2. Falls back to `yay` if paru is not found
3. Returns an error if neither is installed

**Changing Your AUR Helper:**

To switch from one AUR helper to another:

1. Install the new AUR helper (if not already installed):
   ```bash
   # To switch to paru
   sudo pacman -S paru

   # To switch to yay
   sudo pacman -S yay
   ```

2. Update your host configuration:
   ```bash
   dcli edit  # Opens your host config in your editor
   ```

3. Add or modify the `aur_helper` line:
   ```yaml
   aur_helper: paru  # Change to your preferred helper
   ```

4. Save and close the file. The new AUR helper will be used immediately for all package operations.

**Which commands use the AUR helper?**

All package management commands respect the `aur_helper` configuration:
- `dcli sync` - Installs/updates packages
- `dcli install <package>` - Installs packages (including AUR packages)
- `dcli remove <package>` - Removes packages
- `dcli update` - System updates
- `dcli search` - Interactive package search

### Old Structure (Still Supported)

```
arch-config/
├── config.yaml              # Full config with all settings
├── packages/
│   ├── base.yaml
│   ├── hosts/
│   │   └── hostname.yaml
│   └── modules/
│       └── gaming.yaml
└── scripts/
```

**No migration required!** Your existing configuration continues to work.

### Migration Command

Optionally migrate to the new structure:

```bash
dcli migrate --dry-run  # Preview changes
dcli migrate            # Perform migration (creates backup)
```

The migration:
- Moves `packages/modules/` → `modules/`
- Moves `packages/hosts/` → `hosts/`
- Moves `packages/base.yaml` → `modules/base.yaml`
- Converts `config.yaml` to pointer format
- Creates full host configuration file
- Preserves all modules, packages, and settings

## Usage

### Package Management Commands

```bash
dcli search                    # Interactive package search with fzf (TUI)
dcli install <package>         # Install package and add to config
dcli remove <package>          # Remove package
dcli update                    # Update system
dcli update --no-backup        # Update system without backup
dcli find <package>            # Find where a package is defined in your arch-config
```

#### Interactive Package Search

The `dcli search` command provides a beautiful TUI interface powered by fzf:

```bash
dcli search
```

**Features:**
- 🔍 Search through all available packages (official repos + AUR)
- 📦 Live preview showing package details
- ✨ Multi-select with TAB key
- 🎨 Blue border with cyan title
- ⚡ Automatically installs selected packages using `dcli install`

**Example workflow:**
1. Run `dcli search`
2. Type to filter packages (e.g., "firefox", "steam", "neovim")
3. Press TAB to select multiple packages
4. Press ENTER to install all selected packages
5. Each package is added to your host configuration automatically

**Requirements:** `fzf` and an AUR helper (`paru` or `yay`) must be installed

### Finding Packages in Your Config

As your arch-config grows, it can be hard to remember where you defined a package. Use the `find` command to locate it:

```bash
dcli find vim                  # Find where 'vim' is defined
dcli find firefox --json       # JSON output for scripting
```

**Example output:**
```
$ dcli find steam

✓ Found 'steam' in 1 location(s):

  → Module: gaming
    File: /home/user/.config/arch-config/packages/modules/gaming.yaml
```

The find command searches through:
- Base packages (`packages/base.yaml`)
- Host-specific packages (`packages/hosts/{hostname}.yaml`)
- All enabled modules
- Additional packages in `config.yaml`

### Declarative Package Management

#### Define Base Packages

Edit `~/.config/arch-config/packages/base.yaml`:

```yaml
# Base packages for all machines
description: Base packages for all machines

packages:
  - base
  - linux
  - linux-firmware
  - networkmanager
  - vim
  - git
  - go-yq
  - htop
  - tmux
```

#### Define Host-Specific Packages

Edit `~/.config/arch-config/packages/hosts/{hostname}.yaml`:

```yaml
# Packages specific to this machine
description: Packages specific to my-laptop

packages:
  - tlp
  - powertop
  - laptop-mode-tools

exclude: []
```

#### Create Modules

Create `~/.config/arch-config/packages/modules/gaming.yaml`:

```yaml
# Gaming packages and tools
description: Gaming packages and tools

packages:
  - steam
  - lutris
  - wine
  - gamemode

conflicts: []
post_install_hook: ""
```

#### System Services Management

Declaratively manage systemd services alongside your packages.

**Bootstrap from your current system:**
```bash
dcli merge --services           # Add currently enabled services to config
dcli merge --services --dry-run # Preview services that would be added
```

Or manually add a `services` section to your config or host file:

```yaml
# In config.yaml or hosts/{hostname}.yaml
services:
  enabled:
    - bluetooth      # Enable and start Bluetooth
    - sshd           # Enable and start SSH daemon
    - docker         # Enable and start Docker

  disabled:
    - cups           # Disable and stop printing service
    - NetworkManager-wait-online  # Disable wait-online service
```

When you run `dcli sync`, services will be automatically:
- **Enabled** and **started** if in the `enabled` list
- **Stopped** and **disabled** if in the `disabled` list

**Example output:**
```bash
$ dcli sync

Syncing services...
  ✓ Enabled sshd
  ✓ Started sshd
  ✓ Stopped cups
  ✓ Disabled cups

Services enabled: 1
Services disabled: 1
```

Services state is tracked in `~/.config/arch-config/state/services-state.yaml` and is automatically included in configuration backups.

**Note:** The `merge --services` command automatically filters out system-critical services (systemd, dbus, getty, display managers, etc.) to ensure you only manage user-space services.

**See [SERVICES.md](SERVICES.md) for detailed documentation.**

#### Enable/Disable Modules

```bash
dcli module list                # Show all modules and their status
dcli module enable              # Interactive module selection (TUI)
dcli module enable gaming       # Enable specific module
dcli module disable             # Interactive module selection (TUI)
dcli module disable gaming      # Disable specific module
```

**Interactive Module Selection:**

When you run `dcli module enable` or `dcli module disable` without specifying a module name, dcli launches an interactive TUI powered by fzf:

```bash
dcli module enable   # Select modules to enable
dcli module disable  # Select modules to disable
```

**Features:**
- 📋 Browse all available/enabled modules
- 📄 Live preview showing module YAML contents
- ✨ Multi-select with TAB key
- 🎨 Blue border with cyan title
- 🔍 Type to filter modules by name

**Example workflow:**
1. Run `dcli module enable`
2. Browse through available modules
3. Press TAB to select multiple modules (e.g., "gaming", "development")
4. View module details in the preview pane
5. Press ENTER to enable all selected modules

**Requirements:** `fzf` must be installed

#### Sync Packages

```bash
dcli sync                       # Preview and install missing packages
dcli sync --dry-run             # Show what would be installed/removed
dcli sync --prune               # Also remove packages not in config
dcli sync --force               # Skip confirmation prompts
dcli sync --no-backup           # Skip Timeshift backup
dcli sync --no-hooks            # Skip post-install hooks for enabled modules
dcli merge                      # Add unmanaged installed packages to system-packages.yaml
dcli merge --dry-run            # Preview packages that would be added
dcli merge --services           # Add currently enabled services to host config
dcli merge --services --dry-run # Preview services that would be added
```

#### Check Status

```bash
dcli status                     # Show configuration and sync status
```

#### Merge Unmanaged Packages and Services

The `merge` command helps you bootstrap your configuration from your current system:

**Packages:**
```bash
dcli merge                      # Add unmanaged packages to system-packages.yaml
dcli merge --dry-run            # Preview what would be added
```

**Services:**
```bash
dcli merge --services           # Add enabled services to host config
dcli merge --services --dry-run # Preview services that would be added
```

**What it does (packages):**
- Scans for explicitly installed packages (not dependencies)
- Excludes packages already in your config
- Creates/updates `system-packages.yaml` in arch-config root
- File is automatically loaded during `dcli sync`
- Packages are sorted alphabetically

**What it does (services):**
- Scans all enabled services on your system
- Filters out system-critical services (systemd, dbus, getty, display managers)
- Excludes services already in your config
- Adds services to your host configuration file
- Services are sorted alphabetically

**Safety Features:**
- Only captures explicit installs (uses `pacman -Qeq`)
- Filters system-critical services automatically
- Never includes dependencies
- Separate from your declarative config (packages)
- Clear warning about system responsibility
- Git-ignored by default (system-packages.yaml)

**Example:**
```
$ dcli merge --dry-run
=== Unmanaged Packages ===

These are packages you installed manually (not dependencies):

  • firefox
  • vim
  • htop
  • neovim
  • ripgrep
  • fzf
  • lazygit

[DRY RUN - No changes will be made]

These 42 packages would be added to:
  /home/user/.config/arch-config/system-packages.yaml

What is system-packages.yaml?
  • Auto-loaded during 'dcli sync' (like base.yaml)
  • Separate from your declarative config
  • Safe - only contains explicit packages (no dependencies)
  • You can gradually move packages to modules/host files
```

**Workflow:**
1. Install packages manually: `paru -S something`
2. Run `dcli merge` to capture them
3. Packages automatically sync with `dcli sync`
4. Gradually move packages to proper modules/host files
5. Re-run `dcli merge` to keep it updated

**⚠️ Important:** Review the package list carefully. You are responsible for managing your system. The dcli author is not responsible for any system issues.

### Configuration Backup & Restore

dcli provides a powerful backup and restore system specifically for your arch-config configuration. This is separate from system-level backups (Timeshift/Snapper) and focuses on protecting your dcli configuration files.

**Why use config backups?**
- 🛡️ Safety net when experimenting with modules and packages
- 🔄 Easy rollback to previous working configurations
- 💾 Keeps last N backups automatically (configurable)
- ✅ Validation before backup (won't backup broken configs)
- 🔗 Automatic dotfile re-symlinking after restore

**Configuration Backup Commands:**
```bash
dcli save-config                # Create a manual backup of your current config
dcli restore-config             # Interactive restore with fzf (select by date/time)
dcli restore-config <backup>    # Restore specific backup by name
```

**Setup (in your host YAML file):**

Add these settings to `~/.config/arch-config/hosts/{hostname}.yaml`:

```yaml
# Configuration backup settings
config_backups:
  enabled: true      # Auto-backup on dcli sync
  max_backups: 5     # Keep last 5 backups (0 = unlimited)
```

**Note:** New installations created with `dcli init` automatically include these settings with sensible defaults!

**What gets backed up:**
- Your active host configuration file
- All modules (entire `modules/` directory)
- All scripts (entire `scripts/` directory)
- All dotfiles configurations
- State directory (package state, hooks, dotfile mappings)
- `config.yaml` pointer file

**What doesn't get backed up:**
- Other host files (only backs up YOUR host)
- The `config-backups/` directory itself (prevents recursion)

**Backup Storage:**
- Location: `~/.config/arch-config/state/config-backups/`
- Format: Compressed tar.gz archives with separate JSON metadata
- Naming: `{hostname}-{timestamp}.tar.gz`

**Features:**

1. **Full Validation Before Backup**
   - Runs complete `dcli validate` check
   - Won't create backup if config has errors
   - Shows detailed validation output
   - Inspired by NixOS rebuild behavior

2. **Automatic Backup Rotation**
   - Keeps last N backups (configurable)
   - Automatically deletes oldest when limit reached
   - Set `max_backups: 0` for unlimited backups

3. **Auto-Backup on Sync**
   - Creates backup before `dcli sync` (if enabled)
   - Provides safety net before package changes
   - Can be disabled with `--no-backup` flag
   - Falls back to Timeshift/Snapper if config backups disabled

4. **Interactive Restore with fzf**
   - Browse backups by date and time
   - See backup type (manual, auto-sync, pre-restore)
   - View number of modules and packages
   - Beautiful TUI with live preview

5. **Safe Restore Process**
   - Creates pre-restore backup automatically
   - Restores complete configuration state
   - Re-symlinks all dotfiles after restore
   - Prompts to run `dcli sync` to apply changes

**Example Workflow:**

```bash
# Make changes to your config
vim ~/.config/arch-config/hosts/desktop.yaml
dcli module enable gaming

# Create a manual backup
dcli save-config

# Later: Experiment with changes
dcli module enable experimental-stuff
dcli sync

# Oops, something broke! Restore previous config
dcli restore-config
# [Interactive selection appears - choose the backup before experimental-stuff]

# Config is restored, dotfiles re-symlinked
# Now sync to apply the restored package configuration
dcli sync
```

**Backup Metadata Example:**

Each backup includes rich metadata in JSON format:

```json
{
  "timestamp": "2025-12-12T14:30:22Z",
  "timestamp_display": "2025-12-12 14:30",
  "hostname": "desktop",
  "active_host_file": "desktop.yaml",
  "enabled_modules": ["base", "gaming", "development"],
  "backup_type": "manual",
  "dcli_version": "0.1.0",
  "package_count": 342,
  "validation_passed": true
}
```

**Backup Types:**
- `manual` - Created with `dcli save-config`
- `auto-sync` - Created automatically during `dcli sync`
- `pre-restore` - Created before restoring another backup

**Tips:**
- Use `dcli save-config` before major changes
- Set `max_backups` based on your needs (5 is a good default)
- Backups are compressed (~1MB typical size)
- Backups are stored in git-ignored `state/` directory
- You can manually inspect backups: `tar -tzf backup.tar.gz`

### System Backup & Snapshot Commands

dcli also supports system-level backups using Timeshift and Snapper. The tool will auto-detect which one you have installed, or you can configure it in `~/.config/arch-config/"yourhostname".yaml`:

```yaml
# Optional: specify backup tool (auto-detects if not set)
backup_tool: timeshift  # or "snapper"
```

**System Backup Commands:**
```bash
dcli backup                     # Create system snapshot
dcli backup list                # List system snapshots
dcli backup check               # Check backup configuration
dcli backup delete <snapshot>   # Delete a system snapshot
dcli restore                    # Interactive system snapshot selection (TUI)
dcli restore <snapshot>         # Restore specific system snapshot
```

**Interactive Snapshot Selection:**

When you run `dcli restore` without specifying a snapshot, dcli launches an interactive TUI:

```bash
dcli restore
```

**Features:**
- 📸 Browse all available system snapshots
- 📅 See snapshot dates and descriptions
- 🎨 Blue border with cyan title
- ⚡ Works with both Timeshift and Snapper

**Example:**
1. Run `dcli restore`
2. Browse snapshots with arrow keys
3. Press ENTER to select and restore

**Requirements:** `fzf` must be installed

**Timeshift Example:**
```
$ dcli backup
→ Creating timeshift snapshot...
✓ Snapshot created successfully
```

**Snapper Example:**
```
$ dcli backup
→ Creating snapper snapshot...
✓ Snapshot created successfully

$ dcli backup list
→ Snapper config: root
# | Type   | Pre # | Date                     | Description
0 | single |       | 2025-12-02 10:30:00      | dcli backup (manual)
```

### Self-Update

Keep dcli up to date with the latest features and bug fixes:

```bash
dcli self-update
```

This will:
- Auto-detect your dcli git repository location (or prompt you)
- Pull the latest changes from git
- **Build the Rust binary** with `cargo build --release`
- Install the updated binary to `/usr/local/bin/dcli`
- Show you what changed between versions

**Example:**
```
$ dcli self-update
→ Found dcli repository at: /home/user/dcli
Current version: a1b2c3d
→ Pulling latest changes from git...
→ Building Rust binary with cargo...
✓ Build completed successfully
→ Installing updated dcli to /usr/local/bin...
✓ Update Complete!

Changes: a1b2c3d → e4f5g6h

To see what changed, run:
  cd /home/user/dcli && git log --oneline a1b2c3d..e4f5g6h
```

**Note:** The self-update command requires the Rust toolchain (cargo) to rebuild the binary. This is only needed when updating - normal usage requires no dependencies!

## Module System

Modules allow you to organize packages by purpose and enable/disable them as needed.

### Module Structure

```yaml
# Module description
description: Module description

# List of packages
packages:
  - package1
  - package2

# Conflicting modules
conflicts:
  - other-module

# Optional post-install script
post_install_hook: scripts/my-setup.sh
```

### Conflict Detection

If two modules conflict (e.g., different window managers), dcli will:
1. Detect the conflict when enabling
2. Prompt to disable the conflicting module
3. Prevent both from being enabled simultaneously

### Post-Install Hooks

Modules can specify scripts to run after package installation:

```yaml
# Module description
description: Module description

# List of packages
packages:
  - package1
  - package2

# Conflicting modules
conflicts:
  - other-module

# Optional post-install script
post_install_hook: scripts/my-setup.sh
```

The hook script receives sudo privileges and runs from the arch-config directory.

**Hook Execution Tracking**: Post-install hooks are tracked with SHA256 hashes to ensure they run only once. If you modify a hook script, it will automatically re-run on the next sync. This prevents unnecessary re-execution while ensuring updates are applied.

## Hook Management

dcli provides comprehensive control over when and how post-install hooks execute, giving you fine-grained control through both interactive prompts and declarative configuration.

### Interactive Hook Prompts

During `dcli sync`, you'll be prompted before running each post-install hook:

```
Post-install hook for module 'gaming'
  Script: /home/user/.config/arch-config/scripts/setup-gaming.sh

Run this hook? [Y/n/s] (Y=yes, n=no this time, s=skip permanently):
```

**Response options:**
- **Y** or Enter: Run the hook this time (default)
- **n**: Skip this time, but ask again on next sync
- **s**: Skip permanently - mark as "don't run" in state file

This is especially useful when:
- Reconfiguring modules that have already been set up
- Testing changes without running potentially destructive scripts
- You want to manually run a hook later

### Hook Management Commands

```bash
dcli hooks list                 # Show all hooks and their status
dcli hooks skip <module>        # Mark a hook as permanently skipped
dcli hooks reset <module>       # Reset hook to "not run" state
dcli hooks run                  # Interactive hook selection (TUI)
dcli hooks run <module>         # Manually run a specific module's hook
```

**Interactive Hook Selection:**

When you run `dcli hooks run` without specifying a module, dcli launches an interactive TUI:

```bash
dcli hooks run
```

**Features:**
- 🔧 Browse all modules with post-install hooks
- 📄 Live preview showing hook script path
- 🎨 Blue border with cyan title
- ⚡ Automatically runs selected hook with confirmation

**Example:**
1. Run `dcli hooks run`
2. Browse modules with arrow keys
3. Preview shows the hook script location
4. Press ENTER to select and run

**Requirements:** `fzf` must be installed

**Example workflow:**
```bash
# List all hooks and their status
$ dcli hooks list
=== Post-Install Hooks Status ===

✓ Executed gaming
  Script: /home/user/.config/arch-config/scripts/setup-gaming.sh
  Last run: 2025-12-02T10:30:00+00:00

○ Not Run development
  Script: /home/user/.config/arch-config/scripts/install-dev-tools.sh

⊘ Skipped window-managers/hyprland
  Script: /home/user/.config/arch-config/scripts/install-hypr-dotfiles.sh

# Skip a hook permanently
$ dcli hooks skip gaming
✓ Marked hook for module 'gaming' as skipped - will not run during sync

# Reset a hook to run on next sync
$ dcli hooks reset gaming
✓ Reset hook for module 'gaming' - will run on next sync

# Manually run a hook with confirmation
$ dcli hooks run development
Post-install hook for module 'development'
  Script: /home/user/.config/arch-config/scripts/install-dev-tools.sh

Run this hook? [Y/n]:
```

### Declarative Hook Behavior

Control hook execution declaratively in your module YAML files with the `hook_behavior` field:

```yaml
description: Gaming packages and setup

packages:
  - steam
  - lutris
  - gamemode

post_install_hook: scripts/setup-gaming.sh
hook_behavior: ask  # Controls when/how the hook runs
```

**Available behaviors:**

| Behavior | Description | Use Case |
|----------|-------------|----------|
| `ask` | Prompt user before running (default) | Most hooks - gives user control |
| `always` | Always run, no questions asked | Idempotent scripts that should run every sync |
| `once` | Run once without prompting | Initial setup scripts |
| `skip` | Never run this hook | Deprecated or optional hooks |

**Examples:**

```yaml
# Example 1: Always-run hook for keeping dotfiles in sync
description: Hyprland window manager

packages:
  - hyprland
  - waybar

post_install_hook: scripts/sync-hypr-dotfiles.sh
hook_behavior: always  # Run every sync to keep dotfiles updated
```

```yaml
# Example 2: One-time setup hook
description: Development environment

packages:
  - neovim
  - rust
  - nodejs

post_install_hook: scripts/setup-dev-environment.sh
hook_behavior: once  # Only runs once, automatically marks as complete
```

```yaml
# Example 3: Disabled hook (kept for reference)
description: Legacy module

packages:
  - some-package

post_install_hook: scripts/old-setup.sh
hook_behavior: skip  # Hook is disabled, won't run
```

### Hook State Tracking

Hooks are tracked in `~/.config/arch-config/state/hooks-executed.yaml`:

```yaml
hooks:
- module: gaming
  status: executed
  script_hash: '12345678901234567890'
  executed_at: 2025-12-02T10:30:00+00:00
- module: development
  status: not_run
- module: window-managers/hyprland
  status: skipped
```

**Status values:**
- `executed`: Hook has been run successfully
- `not_run`: Hook has never been run
- `skipped`: Hook is permanently skipped

**Automatic re-execution:** If you modify a hook script, dcli detects the change via hash comparison and automatically re-runs it on the next sync.

### Hook Behavior Priority

When determining whether to run a hook, dcli uses this priority order:

1. **YAML `hook_behavior: always`** → Always runs, overrides everything
2. **YAML `hook_behavior: skip`** → Never runs (unless overridden by `always`)
3. **State file `status: skipped`** → Don't run (set by `dcli hooks skip`)
4. **YAML `hook_behavior: once`** → Run once without asking
5. **YAML `hook_behavior: ask`** (default) → Prompt the user
6. **Modified script** → Always prompts, even if previously executed

### Best Practices

**For module authors:**
- Use `hook_behavior: ask` (default) for most hooks - gives users control
- Use `hook_behavior: always` only for truly idempotent scripts
- Use `hook_behavior: once` for initial setup that shouldn't repeat
- Write idempotent hooks when possible (safe to run multiple times)

**For users:**
- Use `dcli hooks list` to see what will run before syncing
- Use `dcli hooks skip` to disable hooks you don't need
- Use `dcli hooks reset` to re-run hooks after manual changes
- Review hook scripts before running with `Y` during prompts

**Example idempotent hook:**
```bash
#!/bin/bash
# scripts/setup-gaming.sh - Safe to run multiple times

# Create directories if they don't exist
mkdir -p ~/.config/steam
mkdir -p ~/.local/share/lutris

# Copy config only if different
if ! diff -q gaming.conf ~/.config/steam/gaming.conf &>/dev/null; then
    cp gaming.conf ~/.config/steam/gaming.conf
    echo "Updated Steam configuration"
fi

# Enable systemd service if not already enabled
if ! systemctl --user is-enabled gamemode &>/dev/null; then
    systemctl --user enable --now gamemode
    echo "Enabled gamemode service"
fi
```

## Flatpak Support

dcli seamlessly integrates flatpak package management alongside traditional pacman/AUR packages.

### Setup

Ensure flatpak is installed and Flathub is configured:

```bash
sudo pacman -S flatpak
flatpak remote-add --if-not-exists --user flathub https://flathub.org/repo/flathub.flatpakrepo
```

### Configuration

Configure the installation scope in `~/.config/arch-config/hosts/"yourhostname".yaml`:

```yaml
# Flatpak installation scope: "user" (default) or "system"
flatpak_scope: user
```

- **`user`**: Flatpaks installed per-user in `~/.local/share/flatpak/` (default, no sudo required)
- **`system`**: Flatpaks installed system-wide in `/var/lib/flatpak/` (requires sudo)

### Package Declaration

Flatpaks can be declared in modules or config.yaml using two formats:

#### Prefix Format (Simple)

```yaml
packages:
  - steam                           # Regular pacman package
  - flatpak:com.spotify.Client     # Flatpak using prefix
  - flatpak:com.obsproject.Studio  # Another flatpak
  - discord                         # Regular pacman package
```

#### Object Format (Explicit)

```yaml
packages:
  - steam                           # Regular pacman package
  - name: com.spotify.Client        # Flatpak using object format
    type: flatpak
  - name: org.videolan.VLC
    type: flatpak
  - discord                         # Regular pacman package
```

Both formats work identically - choose whichever you prefer!

### Example Module with Flatpaks

Create `~/.config/arch-config/packages/modules/media.yaml`:

```yaml
description: Media applications (mix of pacman and flatpak)

packages:
  # Native packages
  - mpv
  - ffmpeg
  
  # Flatpak applications
  - flatpak:com.spotify.Client
  - flatpak:org.videolan.VLC
  - name: org.kde.kdenlive
    type: flatpak
  
  # More native packages
  - audacity

conflicts: []
post_install_hook: ""
```

### Sync Behavior

Flatpaks integrate seamlessly with `dcli sync`:

```bash
dcli sync                  # Install missing flatpaks and pacman packages
dcli sync --dry-run        # Preview flatpak and pacman changes
dcli sync --prune          # Remove unmanaged flatpaks AND pacman packages
```

**Example sync output:**
```
=== Sync Summary ===
Packages to install: 3
Flatpaks to install: 2

Packages to install:
  steam
  discord
  htop

Flatpaks to install:
  com.spotify.Client
  org.videolan.VLC
```

### State Tracking

Flatpaks are tracked in `state/installed.yaml` with their type and version:

```yaml
packages:
  - name: steam
    version: "1.0.0.79-1"
    type: pacman
  - name: com.spotify.Client
    version: "1.2.63.394.g126b0d89"
    type: flatpak
  - name: org.videolan.VLC
    version: "3.0.21"
    type: flatpak
```

### Finding Flatpak Package Names

Visit [Flathub](https://flathub.org/) to browse applications. The package name is the **Application ID** (e.g., `com.spotify.Client`).

Or search from the command line:
```bash
flatpak search spotify
```

### Troubleshooting Flatpaks

**Flatpaks not appearing in application menu:**
- Logout and login again to refresh XDG_DATA_DIRS
- Or restart your desktop environment

**Installation fails with "No remote refs found":**
```bash
flatpak remote-add --if-not-exists --user flathub https://flathub.org/repo/flathub.flatpakrepo
```

**Check installed flatpaks:**
```bash
flatpak list --user        # User-installed flatpaks
flatpak list --system      # System-installed flatpaks
```

## Repository Management

dcli includes built-in git commands to make managing your configuration across multiple computers easy - no git knowledge required!

### First Computer Setup

After running `dcli init`, set up version control:

```bash
dcli repo init
```

This will:
- Walk you through creating a GitHub/GitLab repository
- Configure git with your credentials
- Push your config to the remote repository
- All with helpful prompts and error handling!

**Example flow:**
```
$ dcli repo init
Version control your arch-config? [Y/n] y
Platform? [1] GitHub [2] GitLab: 1
Repository URL: https://github.com/username/my-arch-config.git
Git username: username
Git email: user@example.com

→ Initializing git repository...
→ Configuring git user...
→ Pushing to remote...
✓ Repository set up successfully!
```

### Additional Computer Setup

On your second (or third, fourth...) computer:

```bash
# After installing dcli
dcli repo clone
```

This will:
- Clone your arch-config repository  
- Auto-detect the current hostname
- Create a host-specific configuration file
- Commit and push the new host config

**Example:**
```
$ dcli repo clone
Repository URL: https://github.com/username/my-arch-config.git

→ Cloning repository...
→ Configuring for: laptop
→ Creating host-specific config...
✓ arch-config cloned successfully!

Run 'dcli sync' to install packages
```

### Syncing Changes

**Push your changes:**
```bash
dcli repo push
```

Commits and pushes your local changes to the remote repository.

**Pull updates from other machines:**
```bash
dcli repo pull
```

Pulls changes made on other computers.

**Check status:**
```bash
dcli repo status
```

Shows git status and remote information.

### Multi-Machine Workflow

**Scenario: Add a new module on your desktop, use it on your laptop**

On desktop:
```bash
# Create and enable a new module
vim ~/.config/arch-config/packages/modules/development.yaml
dcli module enable development
dcli sync

# Push changes
dcli repo push
```

On laptop:
```bash
# Pull the changes
dcli repo pull

# Enable the module and install
dcli module enable development
dcli sync
```

### Repository Structure

Your repository will look like this:

```
my-arch-config/
├── .gitignore              # config.yaml is auto-ignored
├── packages/
│   ├── base.yaml          # Shared across all machines
│   ├── modules/           # Shared modules
│   │   ├── gaming.yaml
│   │   ├── development.yaml
│   │   └── ...
│   └── hosts/             # Machine-specific configs
│       ├── desktop.yaml   # Your desktop config
│       └── laptop.yaml    # Your laptop config  
├── scripts/               # Shared scripts
└── udev-rules/           # Shared udev rules
```

Each machine maintains its own `config.yaml` (git-ignored) with the correct hostname and enabled modules.

### Troubleshooting

**Authentication fails during push/pull:**

For HTTPS:
- Use a Personal Access Token instead of password
- GitHub: https://docs.github.com/en/authentication
- GitLab: https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html

For SSH:
- Ensure your SSH key is added to GitHub/GitLab
- Test: `ssh -T git@github.com`

**Merge conflicts:**
```bash
cd ~/.config/arch-config
git status  # See conflicted files
# Edit files to resolve conflicts
git add .
git commit
dcli repo push
```


## Advanced Usage

### Environment Variables

- `ARCH_CONFIG_DIR` - Override the default config location (`~/.config/arch-config`)

```bash
ARCH_CONFIG_DIR=/custom/path dcli sync
```

### Git Integration

Track your configuration with git:

```bash
cd ~/.config/arch-config
git init
git add .
git commit -m "Initial arch-config"
git remote add origin <your-git-repo>
git push -u origin main
```

The `state/installed.yaml` file is auto-generated and already git-ignored.

### Multiple Machines

Use the same arch-config repository across multiple machines:

1. Clone your arch-config repo to `~/.config/arch-config`
2. Update `config.yaml` to set the correct hostname
3. Create a host-specific file in `packages/hosts/{hostname}.yaml`
4. Run `dcli sync`

Or let `dcli init` create fresh configs and manually migrate your modules.

## Example Workflows

### Setting up a new gaming machine (with BlackDon's config)

```bash
# Install dcli
git clone https://gitlab.com/theblackdon/dcli.git
cd dcli
./install.sh

# Bootstrap from BlackDon's pre-configured setup
dcli init -b
# or: dcli init --bd

# Enable gaming modules (already created in BlackDon's config!)
dcli module list                # See all available modules
dcli module enable gaming
dcli module enable controller-support

# Sync system
dcli sync

# Optional: Version control your customizations
dcli repo init
```

### Setting up a media workstation with flatpaks

```bash
# Install dcli
git clone https://gitlab.com/theblackdon/dcli.git
cd dcli
./install.sh

# Initialize and set up flatpak
dcli init
sudo pacman -S flatpak
flatpak remote-add --if-not-exists --user flathub https://flathub.org/repo/flathub.flatpakrepo

# Create a media module with flatpak apps
cat > ~/.config/arch-config/packages/modules/media-production.yaml << 'EOF'
description: Media production tools

packages:
  # Native packages
  - ffmpeg
  - audacity
  - gimp
  
  # Flatpak applications (better sandboxing and updates)
  - flatpak:com.obsproject.Studio          # OBS Studio
  - flatpak:org.kde.kdenlive                # Video editor
  - flatpak:com.spotify.Client              # Music streaming
  - name: org.blender.Blender               # 3D modeling
    type: flatpak

conflicts: []
post_install_hook: ""
EOF

# Enable and sync
dcli module enable media-production
dcli sync
```

### Setting up a new machine (from scratch)

```bash
# Install dcli
git clone https://gitlab.com/theblackdon/dcli.git
cd dcli
./install.sh

# Initialize configuration from scratch
dcli init

# Add custom packages
cd ~/.config/arch-config
# Edit packages/base.yaml to add your preferred packages

# Create and enable modules
dcli module enable <your-module>

# Sync system
dcli sync
```

### Maintaining multiple machines

```bash
# First machine: Create a git repo for your arch-config
cd ~/.config/arch-config
git init
git add .
git commit -m "Initial config"
git remote add origin git@gitlab.com:yourname/arch-config.git
git push -u origin main

# Or use the built-in command:
dcli repo init

# On second machine: Use dcli's built-in clone command
dcli repo clone
# This automatically handles hostname detection and host file creation!

# Or manually:
dcli init  # Create initial structure
cd ~/.config/arch-config
rm -rf *  # Remove generated files
git clone git@gitlab.com:yourname/arch-config.git .
# Update config.yaml with this machine's hostname
# Create packages/hosts/{new-hostname}.yaml
dcli sync
```

## Troubleshooting

### "hostname: command not found" error

If you see this error when running `dcli init` or `dcli repo clone`, you're running the old bash-based version of dcli. To fix:

```bash
cd dcli
git pull
./install.sh
# Answer 'y' when prompted to reinstall
```

The new Rust version doesn't require the `hostname` command and has no runtime dependencies.

### dcli not found after installation

Try:
```bash
hash -r  # Refresh shell's command cache
```

Or restart your terminal.

### "cargo (Rust toolchain) not found" error

The install script will offer to install Rust automatically. If you prefer to install manually:

```bash
# Option 1: Install with rustup (recommended)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
./install.sh

# Option 2: Install from Arch repos
sudo pacman -S rust
./install.sh
```

**Note:** If you just installed Rust, you may need to reload your shell environment:
```bash
source $HOME/.cargo/env
```

### Build fails during installation

If the build fails even with Rust installed, make sure cargo is in your PATH:
```bash
source $HOME/.cargo/env
./install.sh
```

You can also try cleaning the build cache:
```bash
cargo clean
./install.sh
```

### Sync fails with package conflicts

Use pacman to resolve conflicts manually:
```bash
sudo pacman -S <conflicting-package>
```

Then run `dcli sync` again.

### Self-update fails to build

Ensure cargo is in your PATH:
```bash
source $HOME/.cargo/env
dcli self-update
```

### Backup commands fail

Install either timeshift or snapper:
```bash
# For Timeshift
sudo pacman -S timeshift

# For Snapper
sudo pacman -S snapper
```

## Architecture

- **Base packages**: Installed on all machines (`packages/base.yaml`)
- **Host-specific packages**: Unique to each machine (`packages/hosts/{hostname}.yaml`)
- **Modules**: Optional package sets (`packages/modules/*.yaml`)
- **Additional packages**: Ad-hoc packages in `config.yaml`
- **Exclusions**: Host-specific package exclusions

Priority order:
1. Load base packages
2. Load host-specific packages (and exclusions)
3. Load enabled module packages
4. Load additional packages from config.yaml
5. Apply exclusions

## Contributing

Contributions welcome! Please open an issue or submit a pull request.

## License

MIT License - feel free to use and modify as needed.

## See Also

- [Example arch-config repository](https://gitlab.com/theblackdon/arch-config) - Reference configuration with modules for gaming, development, etc.

## Special Recognitions

Thank you for all your assistance:

- Alice Alysia: https://gitlab.com/alicealysia
- Ddubs: https://gitlab.com/dwilliam62
- Tyler Kelly: https://gitlab.com/Zaney

Hope you enjoy!

## FILE: CHEAT-SHEET.md

# DCLI Cheat Sheet

Quick reference guide for all dcli commands and configuration structure.

---

## Core Commands

### `dcli init`
Initialize arch-config directory structure
- `dcli init` - Create new config structure
- `dcli init -b` / `dcli init --bd` - Bootstrap from BlackDon's config

### `dcli sync`
Sync packages to match configuration
- `--dry-run` - Preview changes without applying
- `--prune` - Remove packages not in configuration
- `--force` - Skip confirmation prompts
- `--no-backup` - Skip automatic backup
- `--no-hooks` - Skip post-install hooks
- `--force-dotfiles` - Force re-sync dotfiles

### `dcli install <package>`
Install package with pacman and add to host config

### `dcli remove <package>`
Remove package with pacman (doesn't remove from config)

### `dcli status`
Show current configuration and sync status
- `--json` - Output in JSON format

### `dcli update`
Update system (respects version constraints)
- `--no-backup` - Skip automatic backup

---

## Module Management

### `dcli module list`
List all available modules with status and package counts
- `--json` - Output in JSON format

### `dcli module enable [<module>]`
Enable a module (interactive if no name provided)
- Detects and prompts for conflicts
- Uses fzf for interactive selection
- `--json` - Output in JSON format

### `dcli module disable [<module>]`
Disable a module (interactive if no name provided)
- Uses fzf for interactive selection
- `--json` - Output in JSON format
added a commands cheat sheet. 
### `dcli module run-hook [<module>]`
Run a module's post-install hook
- Interactive selection if no name provided

---

## Hook Management

### `dcli hooks list`
List all hooks and execution status
- `--json` - Output in JSON format

### `dcli hooks reset <module>`
Reset hook to "not run" state (will run on next sync)

### `dcli hooks skip <module>`
Skip a hook permanently

### `dcli hooks run <module>`
Manually run a module's post-install hook

---

## Git Repository

### `dcli repo init`
Initialize git repository for arch-config
- Interactive setup for GitHub, GitLab, or custom

### `dcli repo clone`
Clone existing arch-config repository
- Auto-detects hostname
- Creates host-specific config

### `dcli repo push`
Commit and push changes to remote
- Prompts for commit message

### `dcli repo pull`
Pull updates from remote

### `dcli repo status`
Show repository status and remote URL

---

## Backup/Snapshot

### `dcli backup`
Create a backup snapshot (timeshift or snapper)

### `dcli backup list`
List all backup snapshots

### `dcli backup delete <snapshot>`
Delete a snapshot by ID

### `dcli backup check`
Check backup configuration and status

### `dcli restore [<snapshot>]`
Restore from backup (interactive if no ID provided)

---

## Package Management

### `dcli merge`
Add unmanaged installed packages to system-packages.yaml
- `--dry-run` - Preview without creating file

### `dcli find <package>`
Find where a package is defined in arch-config
- `--json` - Output in JSON format

### `dcli search`
Interactive TUI search for packages (requires fzf and paru)
- Multi-select with TAB
- Shows package info in preview

---

## Validation & Migration

### `dcli validate`
Validate arch-config structure and modules
- `--check-packages` - Verify packages exist in repos (slower)
- `--json` - Output in JSON format

### `dcli migrate`
Migrate from old structure to new structure
- `--dry-run` - Show migration plan without executing
- Creates backup before migration

### `dcli self-update`
Update dcli from git repository
- Auto-detects repository location
- Builds and installs to `/usr/local/bin/dcli`

---

## Global Flags

- `-j, --json` - Output in JSON format (supported by most commands)

---

# Arch-Config Structure

## Directory Layout

```
~/.config/arch-config/              # Main config directory
├── config.yaml                      # Pointer file (contains host name only)
├── hosts/
│   ├── {hostname}.yaml             # Full host configuration
│   └── shared/                      # Optional: shared configs
│       └── common.yaml
├── modules/
│   ├── base.yaml                   # Base packages (all systems)
│   ├── example.yaml                # Example module template
│   └── {category}/                 # Optional: categorized modules
│       └── {module-name}.yaml
├── scripts/                         # Post-install hook scripts
└── state/                           # Auto-generated (git-ignored)
    ├── packages.yaml               # Managed packages state
    ├── hooks.yaml                  # Hook execution status
    └── .gitignore
```

## Configuration Files

### `config.yaml` (Pointer File)
```yaml
# dcli configuration pointer
host: {hostname}
```

### `hosts/{hostname}.yaml` (Full Configuration)
```yaml
host: laptop
description: Work Laptop Configuration

# Import shared configurations
import:
  - hosts/shared/common.yaml

# Enabled modules
enabled_modules:
  - development/python
  - window-managers/hyprland

# Host-specific packages
packages:
  - vim
  - git
  - flatpak:com.spotify.Client

# Exclude packages from base or modules
exclude:
  - nvidia-drivers

# Settings
flatpak_scope: user              # or "system"
auto_prune: false                # or true
backup_tool: timeshift           # or "snapper"
snapper_config: root             # if using snapper
```

### `modules/base.yaml` (Base Packages)
```yaml
description: Base system packages

packages:
  - base
  - base-devel
  - linux
  - linux-firmware
  - git
  - vim
```

### `modules/declared-packages.yaml` (Manually Installed Packages)
Auto-created by `dcli install` and `dcli search` commands.

```yaml
description: Packages installed via dcli install or dcli search commands

packages:
  - neovim
  - htop
  - tmux
```

### Module File Format (Legacy - Single YAML)
```yaml
description: Module description
packages:
  - package1
  - package2
conflicts:
  - conflicting-module
post_install_hook: scripts/hook.sh
hook_behavior: ask|once|always|skip
```

### Module Format (Directory-Based)
```
modules/{module-name}/
├── module.yaml              # Manifest
├── packages.yaml            # Main packages
├── packages-optional.yaml   # Optional packages
└── scripts/
    └── setup.sh             # Post-install hook
```

---

## Key Concepts

### Pointer Model
- `config.yaml` is minimal (just points to host)
- Actual config lives in `hosts/{hostname}.yaml`
- Allows easy host switching and multi-host management

### Module System
- `modules/base.yaml` - Installed on all systems
- Other modules are opt-in via `enabled_modules`
- Modules can conflict with each other
- Post-install hooks run after package installation

### State Directory
- Git-ignored (not version controlled)
- Tracks installed packages and hook execution
- Hooks tracked by SHA256 hash (re-run if script changes)

### Package Sources
- Pacman: `package-name`
- AUR: `package-name` (auto-detected)
- Flatpak: `flatpak:app.id.Name`

### Backup Integration
- Auto-creates snapshots before major operations
- Supports timeshift or snapper
- Configure with `backup_tool` in host config

---

## Common Workflows

### Initial Setup
```bash
dcli init                    # Create new config
# or
dcli init -b                 # Bootstrap from BlackDon's config

dcli module enable hyprland  # Enable modules
dcli sync                    # Install packages
```

### Daily Usage
```bash
dcli install neovim          # Install and track package
dcli sync                    # Sync configuration
dcli update                  # Update system
dcli status                  # Check current state
```

### Multi-Host Management
```bash
dcli repo init               # Initialize git repo
dcli repo push               # Push changes

# On another machine:
dcli repo clone              # Clone config
dcli sync                    # Apply configuration
```

### Migration from Old Structure
```bash
dcli migrate --dry-run       # Preview migration
dcli migrate                 # Perform migration
```

---

## Tips

- Use `--dry-run` to preview changes before applying
- Enable `auto_prune: true` for automatic cleanup
- Use `dcli validate` before syncing to catch errors
- Create shared configs in `hosts/shared/` for common settings
- Use categories in modules for better organization
- Run `dcli self-update` periodically to get latest features

## FILE: DIRECTORY-MODULES.md

# Directory Modules Guide

## Overview

Directory modules are an advanced module format in dcli that provides better organization for complex modules with multiple package files, post-install scripts, and configuration files (dotfiles).

## Directory Structure

A directory module follows this structure:

```
packages/modules/module-name/
├── module.yaml                 # Required: Module manifest
├── packages.yaml               # Optional: Package files (auto-discovered)
├── packages-*.yaml             # Optional: Additional package files
├── scripts/                    # Optional: Post-install scripts
│   ├── setup.sh
│   └── config.sh
└── dotfiles/                   # Optional: Configuration files (not yet implemented)
    └── ...
```

### Nested Modules

Modules can be organized in nested directories (up to 3 levels supported, 2 recommended):

```
packages/modules/
├── hyprland-dots/
│   ├── hyprland/
│   │   ├── module.yaml
│   │   └── packages.yaml
│   └── i3/
│       ├── module.yaml
│       └── packages.yaml
└── development/
    ├── python/
    │   ├── module.yaml
    │   ├── packages-core.yaml
    │   └── packages-optional.yaml
    └── rust/
        ├── module.yaml
        └── packages.yaml
```

## Module Manifest (module.yaml)

The `module.yaml` file defines the module's metadata and configuration.

### Fields

```yaml
description: "Brief description of what this module provides"

# Optional: Modules that conflict with this one
conflicts:
  - conflicting-module-1
  - conflicting-module-2

# Optional: Post-install hook script (relative to module directory)
post_install_hook: scripts/setup.sh

# Optional: Explicit list of package files to load (empty = auto-discover)
package_files:
  - packages-core.yaml
  - packages-optional.yaml
```

### Field Descriptions

- **`description`** (string): Human-readable description of the module
- **`conflicts`** (array): List of module names that cannot be enabled simultaneously
- **`post_install_hook`** (string): Path to a script that runs after package installation (relative to module root)
- **`package_files`** (array): Explicit list of package files to load. If empty or omitted, all `*.yaml` files (except `module.yaml`) are auto-discovered

## Package Files

### Auto-Discovery Mode

If `package_files` is empty or omitted, dcli will automatically discover all `*.yaml` files in the module directory (excluding `module.yaml`).

**Example structure:**
```
gaming/
├── module.yaml           # Manifest (no package_files specified)
├── packages.yaml         # Auto-discovered
├── steam.yaml            # Auto-discovered
└── emulators.yaml        # Auto-discovered
```

### Explicit Mode

Specify exactly which package files to load:

```yaml
# module.yaml
description: Gaming packages
package_files:
  - packages-core.yaml
  - packages-steam.yaml
  # packages-optional.yaml won't be loaded
```

### Package File Format

Package files use the same format as legacy modules:

```yaml
description: Core gaming packages

packages:
  - steam
  - wine
  - lutris
  
  # Advanced: Package with version constraint
  - name: vulkan-radeon
    version: ">=24.0.0"
  
  # Flatpak support
  - flatpak:com.valvesoftware.Steam

exclude: []  # Only used in host files
```

## Post-Install Hooks

Post-install hooks are bash scripts that run after packages are installed during `dcli sync`.

### Features

- **Location**: Must be in the `scripts/` subdirectory
- **Execution**: Runs with `sudo bash <script>`
- **Tracking**: Tracked by SHA256 hash - only re-runs if script content changes
- **State File**: `~/.config/arch-config/state/hooks-executed.yaml`

### Example Hook

**module.yaml:**
```yaml
description: Python development environment
post_install_hook: scripts/setup-python.sh
```

**scripts/setup-python.sh:**
```bash
#!/bin/bash
set -e

echo "Setting up Python development environment..."

# Create virtualenv directory
mkdir -p ~/.virtualenvs

# Install global pip packages
pip install --upgrade pip setuptools wheel

# Configure poetry
poetry config virtualenvs.in-project true

echo "Python setup complete!"
```

### Hook Execution Behavior

- Hooks run **only once** after initial installation
- If you modify the script, it will run again on next `dcli sync`
- Hooks are skipped with `dcli sync --no-hooks`
- Tracked per-module in state file

## Module Conflicts

Prevent incompatible modules from being enabled simultaneously.

### Example: Hyprland-dots

```yaml
# hyprland/module.yaml
description: Hyprland wayland compositor
conflicts:
  - window-managers/i3
  - window-managers/openbox
packages:
  - hyprland
  - waybar
  - rofi-wayland
```

```yaml
# i3/module.yaml
description: i3 tiling window manager
conflicts:
  - window-managers/hyprland
  - window-managers/sway
packages:
  - i3-wm
  - i3status
  - rofi
```

### Conflict Resolution

When enabling a module with conflicts:

```bash
$ dcli module enable window-managers/hyprland
Warning: Module 'window-managers/i3' conflicts with 'window-managers/hyprland'
Do you want to disable 'window-managers/i3'? (y/n)
```

## Dotfiles Support

**Status**: Directory detected but not yet fully implemented

### Planned Features

```
module-name/
├── module.yaml
├── packages.yaml
└── dotfiles/
    ├── .config/
    │   └── app/
    │       └── config.toml
    └── .bashrc
```

Dotfiles will be symlinked or copied to the user's home directory during sync.

## Complete Example: Development Module

### Directory Structure

```
packages/modules/development/python/
├── module.yaml
├── packages-core.yaml
├── packages-data-science.yaml
└── scripts/
    └── setup-python.sh
```

### module.yaml

```yaml
description: Python development tools and environment

package_files:
  - packages-core.yaml
  - packages-data-science.yaml

conflicts:
  - development/ruby

post_install_hook: scripts/setup-python.sh
```

### packages-core.yaml

```yaml
description: Core Python development packages

packages:
  - python
  - python-pip
  - python-setuptools
  - python-virtualenv
  - python-poetry
  - ipython
  - black
  - mypy
  - pytest
```

### packages-data-science.yaml

```yaml
description: Python data science packages

packages:
  - python-numpy
  - python-pandas
  - python-matplotlib
  - jupyter-notebook
```

### scripts/setup-python.sh

```bash
#!/bin/bash
set -e

echo "Configuring Python development environment..."

# Create virtualenv wrapper directory
mkdir -p ~/.virtualenvs

# Configure poetry
poetry config virtualenvs.in-project true

# Configure pip
pip config set global.break-system-packages true

echo "Python development environment configured!"
```

## Usage Commands

### List All Modules

```bash
dcli module list
```

Shows all modules (legacy and directory) with their status.

### Enable a Module

```bash
# Short name (auto-resolves)
dcli module enable python

# Full path
dcli module enable development/python

# Interactive mode
dcli module enable
```

### Disable a Module

```bash
dcli module disable development/python
```

### Validate Modules

```bash
dcli validate
```

Checks all module structures for errors.

### Sync Packages

```bash
# Install packages and run hooks
dcli sync

# Skip hooks
dcli sync --no-hooks

# Preview changes
dcli sync --dry-run
```

## Validation Rules

Directory modules are validated for:

1. **Module Structure**
   - `module.yaml` must exist
   - Module directory must be valid

2. **Description**
   - Warning if empty

3. **Package Files**
   - All files in `package_files` must exist
   - Warning if no package files found
   - Warning if package files are empty
   - Error for duplicate packages within module

4. **Post-Install Hooks**
   - Hook file must exist if specified
   - Hook must be a file (not directory)
   - Warning if `scripts/` exists but no hook configured

5. **Dotfiles**
   - Warning that dotfiles support is not yet implemented

6. **Naming Conflicts**
   - Error if both `module-name.yaml` and `module-name/` exist

## Legacy vs Directory Modules

| Feature | Legacy Module | Directory Module |
|---------|---------------|------------------|
| **Structure** | Single `.yaml` file | Directory with multiple files |
| **Package Files** | One file only | Multiple files (auto-discovered or explicit) |
| **Scripts** | External path only | Native `scripts/` subdirectory |
| **Hooks** | Absolute path required | Relative path from module root |
| **Dotfiles** | Not supported | `dotfiles/` directory (planned) |
| **Organization** | Flat | Hierarchical/nested |
| **Best For** | Simple modules | Complex modules with many packages |

## Best Practices

1. **Use Directory Modules When:**
   - Module has >20 packages (split into logical files)
   - Post-install configuration is needed
   - Future dotfiles support is desired
   - Logical grouping of packages makes sense

2. **Use Legacy Modules When:**
   - Module has <20 packages
   - No post-install scripts needed
   - Simple, straightforward package list

3. **Organization Tips:**
   - Split packages by category (core, optional, extras)
   - Use descriptive names for package files
   - Keep scripts small and focused
   - Document what post-install hooks do

4. **Naming Conventions:**
   - Use kebab-case for module names (`window-managers`, not `window_managers`)
   - Use descriptive categories for nested modules
   - Limit nesting to 2 levels for maintainability

5. **Hook Scripts:**
   - Always use `#!/bin/bash` and `set -e`
   - Print status messages for visibility
   - Make scripts idempotent (safe to run multiple times)
   - Test scripts independently before adding to module

## Migration from Legacy Modules

To convert a legacy module to directory format:

1. **Create directory:**
   ```bash
   mkdir -p packages/modules/module-name
   ```

2. **Move and split the legacy file:**
   ```bash
   # Copy original
   cp packages/modules/module-name.yaml packages/modules/module-name/packages.yaml
   
   # Optionally split into multiple files
   # Edit packages.yaml, create packages-optional.yaml, etc.
   ```

3. **Create module.yaml:**
   ```yaml
   description: "Copy from original description field"
   conflicts: []  # Copy from original if exists
   post_install_hook: ""  # Add if needed
   package_files: []  # Leave empty for auto-discovery
   ```

4. **Remove old fields from package files:**
   - Remove `conflicts` field from `packages.yaml` (now in `module.yaml`)
   - Remove `post_install_hook` field from `packages.yaml` (now in `module.yaml`)

5. **Add scripts if needed:**
   ```bash
   mkdir -p packages/modules/module-name/scripts
   # Create your setup scripts
   ```

6. **Validate:**
   ```bash
   dcli validate
   ```

7. **Test:**
   ```bash
   dcli sync --dry-run
   ```

8. **Remove legacy file:**
   ```bash
   rm packages/modules/module-name.yaml
   ```

## Troubleshooting

### Module Not Found

```
Error: Module 'my-module' not found
```

**Solutions:**
- Verify `module.yaml` exists in the module directory
- Check module path in `config.yaml` matches directory structure
- Run `dcli module list` to see all available modules

### Package File Not Found

```
Error: Package file specified in manifest not found: packages-extra.yaml
```

**Solutions:**
- Verify file exists in module directory
- Check spelling in `package_files` list
- Use auto-discovery by removing `package_files` field

### Hook Script Not Found

```
Error: post_install_hook script not found: scripts/setup.sh
```

**Solutions:**
- Verify script exists at specified path (relative to module root)
- Check file permissions (`chmod +x scripts/setup.sh`)
- Verify path uses forward slashes, not backslashes

### Duplicate Package Error

```
Error: Duplicate package across files: steam
```

**Solutions:**
- Remove duplicate package from one of the package files
- Each package should only appear once within a module

## File Locations

- **Config Root**: `~/.config/arch-config/` (or `$ARCH_CONFIG_DIR`)
- **Modules Directory**: `~/.config/arch-config/packages/modules/`
- **Main Config**: `~/.config/arch-config/config.yaml`
- **Hook State**: `~/.config/arch-config/state/hooks-executed.yaml`

## Advanced Features

### Version Constraints

Pin packages to specific versions or ranges:

```yaml
packages:
  # Exact version
  - name: hyprland
    version: "0.52.1-6"
  
  # Minimum version
  - name: git
    version: ">=2.40.0"
  
  # Maximum version
  - name: python
    version: "<3.12"
```

### Flatpak Packages

Include Flatpak applications:

```yaml
packages:
  # Simple flatpak syntax
  - flatpak:com.spotify.Client
  
  # Object syntax
  - name: com.valvesoftware.Steam
    type: flatpak
```

### Package Exclusions (Host Files Only)

Host files can exclude packages from base/modules:

```yaml
# packages/hosts/laptop.yaml
packages:
  - tlp
  - powertop

exclude:
  - desktop-package
  - nvidia-drivers
```

## Future Enhancements

- Full dotfiles support with symlinking/copying
- Module dependencies (require other modules)
- Module versioning
- Module templates
- Remote module repositories
- Per-module flatpak scope
- AUR package support in modules
- Pre-install hooks
- Module update notifications

## FILE: SERVICES.md

# System Services Management

dcli now supports declarative management of systemd services through the `services` section in your configuration file.

## Overview

The services feature allows you to:
- Enable and start services automatically on boot
- Disable and stop services
- Track service state across system generations
- Rollback service configurations with config backups
- Manage services declaratively alongside packages

## Configuration

Add a `services` section to your `config.yaml` or host file:

```yaml
services:
  enabled:
    - bluetooth
    - sshd
    - docker

  disabled:
    - cups
    - NetworkManager-wait-online
```

### Services to Enable

Services listed under `services.enabled` will be:
1. **Enabled** for automatic start on boot (if not already enabled)
2. **Started** immediately (if not already running)

### Services to Disable

Services listed under `services.disabled` will be:
1. **Stopped** immediately (if currently running)
2. **Disabled** from starting on boot (if currently enabled)

## Usage

### Bootstrap from Current System

The easiest way to get started is to capture your currently enabled services:

```bash
# Preview services that would be added
dcli merge --services --dry-run

# Add currently enabled services to your config
dcli merge --services
```

This command will:
1. Scan all enabled services on your system
2. Filter out system-critical services (like systemd, dbus, getty)
3. Add remaining services to your host configuration file
4. Sort them alphabetically for easy management

**Example output:**
```
→ Loading configuration...
→ Scanning enabled services...
→ Found 87 enabled services on system
→ 35 manageable services (after filtering system-critical)
→ Found 0 services declared in config (0 enabled, 0 disabled)
→ Found 35 unmanaged services

=== Unmanaged Services ===

These services are currently enabled but not in your dcli config:

  • bluetooth
  • cups
  • docker
  • NetworkManager
  • sshd
  ...

✓ Added 35 services to host configuration
```

### Basic Workflow

1. **Edit your configuration** to add services:
   ```yaml
   services:
     enabled:
       - sshd
     disabled:
       - cups
   ```

2. **Sync your system** to apply changes:
   ```bash
   dcli sync
   ```

3. **Verify changes** (optional):
   ```bash
   systemctl status sshd
   systemctl status cups
   ```

### During Sync

When you run `dcli sync`, services are synchronized:

```
Syncing services...
  ✓ Enabled sshd
  ✓ Started sshd
  ✓ Stopped cups
  ✓ Disabled cups

Services enabled: 1
Services disabled: 1
```

## Service State Tracking

dcli tracks service state in `~/.config/arch-config/state/services-state.yaml`:

```yaml
last_updated: "2023-12-16T10:30:00Z"
enabled_services:
  - sshd
  - bluetooth
disabled_services:
  - cups
```

This file is:
- **Automatically created** on first sync with services
- **Updated** after each successful sync
- **Included in config backups** automatically
- **Restored** with config restores

## Backup and Rollback

### Automatic Backup

Services state is automatically backed up with configuration backups:

```bash
# Manual backup
dcli save-config

# Backup is created automatically before sync (if config_backups.enabled: true)
dcli sync
```

### Restore Services

To restore services to a previous state:

```bash
# Restore a config backup (includes services state)
dcli restore-config

# Apply the restored configuration
dcli sync
```

## Service Name Format

Service names can be specified with or without the `.service` suffix:

```yaml
services:
  enabled:
    - sshd              # Simple name
    - sshd.service      # Full name (equivalent)
    - bluetooth
    - docker
    - getty@tty1        # Service templates
```

## Validation and Error Handling

dcli validates service names and handles errors gracefully:

### Service Name Validation

- **Allowed characters**: alphanumeric, dash (`-`), underscore (`_`), dot (`.`), at sign (`@`)
- **Prevents**: command injection and invalid service names
- **Example errors**:
  ```
  ✗ Invalid service name 'service; rm -rf /': service names can only contain...
  ```

### Service Existence Check

Before operating on a service, dcli checks if it exists:

```
Warning: Service custom-service does not exist on system, skipping
```

### Conflict Detection

If a service appears in both `enabled` and `disabled`:

```
Warning: Service sshd is in both enabled and disabled lists, skipping
```

### Permission Errors

Service operations require root privileges:

```bash
# dcli sync will prompt for sudo when needed
sudo dcli sync
```

### Partial Failures

If some service operations fail, dcli continues with others and reports errors:

```
Syncing services...
  ✓ Enabled sshd
  ✓ Started sshd
  ✗ Failed to enable invalid-service: Service does not exist
  ✓ Disabled cups

Warning: 1 service operations failed
```

## Filtered System Services

When using `dcli merge --services`, the following system-critical services are automatically filtered out and will NOT be added to your configuration:

**Core System Services:**
- systemd-* services (journald, logind, udevd, resolved, timesyncd, networkd, etc.)
- dbus, dbus-broker
- kmod-static-nodes

**Security Services:**
- polkit
- rtkit-daemon

**Display Managers:**
- gdm, sddm, lightdm
- getty@tty1-6
- display-manager

**System Targets:**
- multi-user.target, graphical.target, basic.target, sysinit.target

These services are essential for system operation and should not be managed declaratively. The filter list ensures you don't accidentally capture critical services.

## Important Considerations

### Critical Services

Be careful when disabling critical services on remote systems:

**⚠️ WARNING**: Disabling these services on remote systems may cause loss of connectivity:
- `NetworkManager`
- `sshd`
- `systemd-networkd`

### Service Dependencies

dcli does not automatically handle service dependencies. If you disable a service that other services depend on, those services may fail.

### Masked Services

dcli will skip masked services and report them as errors. To unmask a service:

```bash
sudo systemctl unmask <service-name>
```

### User vs System Services

Currently, dcli only manages **system services**. User services (`systemctl --user`) are not supported yet.

## Examples

### Basic Example

Enable SSH and Bluetooth, disable printing:

```yaml
services:
  enabled:
    - sshd
    - bluetooth
  disabled:
    - cups
```

### Server Configuration

Typical server services:

```yaml
services:
  enabled:
    - sshd
    - docker
    - fail2ban
  disabled:
    - bluetooth
    - cups
    - NetworkManager-wait-online
```

### Desktop Configuration

Typical desktop services:

```yaml
services:
  enabled:
    - bluetooth
    - NetworkManager
    - cups
  disabled:
    - sshd  # Disable SSH on desktop
```

### Container Host

Docker/Podman setup:

```yaml
services:
  enabled:
    - docker
    - containerd
  disabled:
    - bluetooth
    - cups
```

## Integration with Modules

Services can also be managed per-module. In a module's `packages.yaml` or directory module, you can specify services:

**Note**: Per-module services support is planned for a future release. Currently, services must be declared in the main config or host files.

## Troubleshooting

### Services not changing

1. Check if you have root privileges:
   ```bash
   sudo dcli sync
   ```

2. Verify service exists:
   ```bash
   systemctl list-unit-files | grep <service-name>
   ```

3. Check service status manually:
   ```bash
   systemctl status <service-name>
   ```

### Service fails to start

If a service is enabled but fails to start, check the logs:

```bash
journalctl -u <service-name> -n 50
```

### State file corruption

If the services state file is corrupted, you can delete it:

```bash
rm ~/.config/arch-config/state/services-state.yaml
```

It will be recreated on the next `dcli sync`.

## Technical Details

### State File Location

`~/.config/arch-config/state/services-state.yaml`

### Sync Order

During `dcli sync`, operations happen in this order:

1. Pre-flight validation
2. Package sync (install/remove)
3. Dotfiles sync
4. **Services sync** ← New
5. Post-install hooks
6. State file update

### Service Operations

For each enabled service:
1. Validate service name
2. Check if service exists
3. Enable if not already enabled (`systemctl enable`)
4. Start if not already active (`systemctl start`)

For each disabled service:
1. Validate service name
2. Check if service exists
3. Stop if currently active (`systemctl stop`)
4. Disable if currently enabled (`systemctl disable`)

## Future Enhancements

Planned features for future releases:

- [ ] Per-module service declarations
- [ ] User service support (`systemctl --user`)
- [ ] Service dependency checking
- [ ] Service timer management
- [ ] Service status in `dcli status` output
- [ ] Dry-run preview for service changes
- [ ] Service change notifications
- [ ] Service rollback without full config restore

## Contributing

Found a bug or have a feature request? Please open an issue on the dcli GitLab repository.

## License

This feature is part of dcli and follows the same license.


---

# MY NIXOS CONFIGURATION (LEAN DUMP)


@META: LEAN NixOS Config | Host: nixos
@PURPOSE: Portable config reference for Arch/dcli migration

@GEMINI_START
# Lis-os - System Context & Gemini Guide

**Last Updated:** 2025-12-18

## 🎭 Role & Persona
**You are Aether.**
*   **Role:** Senior Systems Engineer & NixOS Architect.
*   **Specialty:** Linux Desktop (Wayland/Niri), NixOS Configuration, and Theme Engineering.
*   **Philosophy:** "Brutalist Efficiency." Do not reinvent the wheel. Orchestrate existing tools. Prefer robust, typed, and clean solutions over quick hacks.
*   **Voice:** Professional, direct, slightly opinionated about structure, and extremely safety-conscious.

## 1. System Identity & Architecture
*   **OS:** NixOS Unstable
*   **WM:** Niri (`config.kdl`)
*   **Shell:** Noctalia
*   **Host:** `nixos`

### Architecture Guidelines
*   **Packages:** Centralized in `modules/home/packages.nix`.
*   **Config:** Functional logic in `modules/home/code/` or `programs/`.
*   **Theme:** Visuals/Assets in `modules/home/theme/`.
*   **Desktop:** Shell config in `modules/home/desktop/noctalia/`.

## 2. Global File View (LLM Quick Reference)
Use this map to locate key system components instantly.

| Component | Path | Description |
| :--- | :--- | :--- |
| **System Entry** | `flake.nix` | Root flake definition (Inputs/Outputs). |
| **User Home** | `modules/home/default.nix` | Home Manager entry point. |
| **Packages** | `modules/home/packages.nix` | User-installed packages list. |
| **Theme Engine** | `modules/home/theme/core/magician.py` | CLI entry point for theme generation. |
| **Noctalia** | `modules/home/desktop/noctalia/default.nix` | Shell configuration. |
| **Docs** | `janitor/*.md` | **READ THESE** for design systems and protocols. |

## 3. Workflow & Commands

### System Management
*   **Rebuild & Switch:** `fr` (Fast Rebuild - wrapper for `nh os switch`).
*   **Update Flakes:** `up-os` (Updates flake.lock and rebuilds).
*   **Clean System:** `clean-os` (Garbage collection and store optimization).

### Theme Engine
*   **Set Theme:** `theme-engine <image> [--mood NAME]`
*   **Compare Moods:** `theme-compare <image>`
*   **Precache:** `theme-precache ~/Pictures/Wallpapers --jobs 4`

## 4. Agent Protocol (MANDATORY)

1.  **NO GUESSING:** Never assume a file's content or path. Use `list_directory` and `read_file` first.
2.  **DEBUGGING FIRST:** If an error occurs, do not blindly try to fix it. Read the error log, investigate the cause, and *then* propose a fix. Use `brave-search` or `nixos-db` for obscure errors.
3.  **CONTEXT AWARE:**
    *   **Theme:** If editing Theme -> Read `janitor/THEME_ENGINE.md`.
4.  **SAFETY:** Explain *why* you are running a command that modifies the system.

## 5. WRAP UP PROTOCOL (Session Recap)
**Trigger:** User types "WRAP UP" or session ends.
**Action:** Create a file in `sessions/` (create dir if missing).
**Filename:** `YYYY-MM-DD-Topic.md`
**Content:**
```markdown
# Session Recap: [Title]
## ⚡ Summary
*   [What was done]
## 🔧 Details
*   [Technical changes]
```

## 📂 Documentation Index (in `janitor/`)
*   `GEMINI.md`: **THIS FILE.** System Identity & Master Protocol.
*   `THEME_ENGINE.md`: Explanation of the custom wallpaper-to-theme pipeline.
*   `MAINTENANCE.md`: Snippets for cleaning and debugging the OS.
*   `CLEANUP_TODO.md`: Pending refactoring tasks.
*   `deep-research.md`: Agent workflow for thorough research.@GEMINI_END

@MAP_START
flake.nix
.gitignore
hosts/default.nix
hosts/hardware.nix
hosts/variables.nix
modules/core/appimage.nix
modules/core/boot.nix
modules/core/drivers.nix
modules/core/fonts.nix
modules/core/greetd.nix
modules/core/hardware.nix
modules/core/network.nix
modules/core/nh.nix
modules/core/packages.nix
modules/core/portals.nix
modules/core/security.nix
modules/core/services.nix
modules/core/steam.nix
modules/core/stylix.nix
modules/core/system.nix
modules/core/user.nix
modules/core/virtualization.nix
modules/home/appimage.nix
modules/home/default.nix
modules/home/desktop/default.nix
modules/home/desktop/niri/default.nix
modules/home/desktop/niri/keybinds.nix
modules/home/desktop/niri/layout.nix
modules/home/desktop/niri/niri.nix
modules/home/desktop/niri/startup.nix
modules/home/desktop/niri/windowrules.nix
modules/home/desktop/niri/workspaces.nix
modules/home/desktop/noctalia/default.nix
modules/home/environment.nix
modules/home/packages.nix
modules/home/programs/antigravity.nix
modules/home/programs/fzf.nix
modules/home/programs/git.nix
modules/home/programs/hyfetch.nix
modules/home/programs/kitty.nix
modules/home/programs/lazygit.nix
modules/home/programs/starship.nix
modules/home/programs/thunar.nix
modules/home/programs/vivaldi-flags.nix
modules/home/programs/wezterm.nix
modules/home/programs/zellij.nix
modules/home/programs/zoxide.nix
modules/home/programs/zsh.nix
modules/home/scripts/default.nix
modules/home/scripts/llm-tools.nix
modules/home/scripts/nix-inspect.nix
modules/home/scripts/system-tools.nix
modules/home/theme/core/color.py
modules/home/theme/core/extraction.py
modules/home/theme/core/generator.py
modules/home/theme/core/icons.py
modules/home/theme/core/__init__.py
modules/home/theme/core/magician.py
modules/home/theme/core/mood.py
modules/home/theme/core/presets.py
modules/home/theme/core/renderer.py
modules/home/theme/core/resolve_icons.py
modules/home/theme/core/solver.py
modules/home/theme/core/tui/app.py
modules/home/theme/core/tui/favorites.py
modules/home/theme/core/tui/forge.py
modules/home/theme/core/tui/__init__.py
modules/home/theme/core/tui/lab.py
modules/home/theme/core/tui/main_menu.py
modules/home/theme/core/tui/state.py
modules/home/theme/core/tui/widgets.py
modules/home/theme/daemon/orchestrator.py
modules/home/theme/daemon/package.nix
modules/home/theme/default.nix
modules/home/theme/gtk.nix
modules/home/theme/packages.nix
modules/home/theme/qt.nix
modules/home/theme/stylix/stylix.nix
modules/home/theme/templates/antigravity.template
modules/home/theme/templates/colors.sh
modules/home/theme/templates/kitty.conf
modules/home/theme/templates/niri.kdl
modules/home/theme/templates/rofi.rasi
modules/home/theme/templates/starship.toml
modules/home/theme/templates/vesktop.template
modules/home/theme/templates/wezterm.lua
modules/home/theme/templates/zed.template
modules/home/theme/templates/zellij.kdl
@MAP_END

@DIR .
@FILE flake.nix
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
    niri-flake.url = "github:sodiboo/niri-flake";
    astal = {
      url = "github:aylur/astal";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    ags.url = "github:aylur/ags/v2.3.0";
    chaotic.url = "github:chaotic-cx/nyx/nyxpkgs-unstable";
  };
  outputs =
    {
      self,
      nixpkgs,
      home-manager,
      niri-flake,
      chaotic,
      astal,
      ags,
      ...
    }@inputs:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
      astalLibs = with astal.packages.${system}; [
        astal3
        io
        battery
        network
        tray
        wireplumber
        notifd
        apps
        mpris
        hyprland
        bluetooth
      ];
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
            inherit profile username;
          };
          modules = [
            (
              { ... }:
              {
                nixpkgs.overlays = [
                  niri-flake.overlays.niri
                  chaotic.overlays.default
                ];
              }
            )
            ./hosts/default.nix
          ];
        };
    in
    {
      nixosConfigurations = {
        nixos = mkHost {
          hostname = "nixos";
          profile = "amd";
          username = "lune";
        };
      };
      homeConfigurations."lune" = home-manager.lib.homeManagerConfiguration {
        inherit pkgs;
        modules = [
          ./home/lune.nix
          {
            nixpkgs.overlays = [ niri-flake.overlays.niri ];
          }
        ];
        extraSpecialArgs = { inherit inputs; };
      };
      packages.${system} = {
        lis-bar = pkgs.callPackage ./modules/home/desktop/astal/package.nix {
          astalPkgs = astal.packages.${system};
          ags = ags.packages.${system}.ags;
        };
        default = self.packages.${system}.lis-bar;
      };
      devShells.${system}.default = pkgs.mkShell {
        buildInputs = [
          pkgs.gjs
          pkgs.nodejs
          ags.packages.${system}.ags
          pkgs.wrapGAppsHook3
        ]
        ++ astalLibs
        ++ [
          pkgs.cava
          pkgs.curl
          pkgs.brightnessctl
        ];
        shellHook = ''
          echo "🛠️ Astal Dev Shell"
          echo "Use 'ags bundle app.tsx bundle.js' then 'gjs -m bundle.js'"
        '';
      };
    };
}

@FILE .gitignore
.bash_history
Lis-os-*.txt
modules/home/code/zed.nix
modules/home/desktop/astal/bundle.js
modules/home/desktop/astal/node_modules/
noctalia-shell/
*.qcow2
repomix-output.txt
result
result-*
*.swp
*.xml
.zed/
.zsh_history
__pycache__/

@DIR hosts
@FILE default.nix
{ pkgs, inputs, ... }: # <--- 1. ADD 'inputs' HERE
{
  imports = [
    inputs.stylix.nixosModules.stylix
    inputs.chaotic.nixosModules.default
    ./hardware.nix
    ../modules/core/boot.nix
    ../modules/core/hardware.nix
    ../modules/core/drivers.nix
    ../modules/core/system.nix
    ../modules/core/user.nix
    ../modules/core/security.nix
    ../modules/core/network.nix
    ../modules/core/services.nix
    ../modules/core/packages.nix
    ../modules/core/portals.nix
    ../modules/core/fonts.nix
    ../modules/core/appimage.nix
    ../modules/core/greetd.nix
    ../modules/core/stylix.nix
    ../modules/core/nh.nix
    ../modules/core/steam.nix
    ../modules/core/virtualization.nix
  ];
  programs.niri.package = pkgs.niri;
}

@FILE hardware.nix
{
  config,
  lib,
  modulesPath,
  ...
}:
{
  imports = [
    (modulesPath + "/installer/scan/not-detected.nix")
  ];
  boot.initrd.availableKernelModules = [
    "nvme"
    "xhci_pci"
    "ahci"
    "usbhid"
  ];
  boot.initrd.kernelModules = [ ];
  boot.kernelModules = [ "kvm-amd" ];
  boot.extraModulePackages = [ ];
  fileSystems."/" = {
    device = "/dev/disk/by-uuid/ee1fa0da-4a03-4f83-954c-e48b611d8c9d";
    fsType = "ext4";
  };
  fileSystems."/boot" = {
    device = "/dev/disk/by-uuid/2B64-B786";
    fsType = "vfat";
    options = [
      "fmask=0077"
      "dmask=0077"
    ];
  };
  swapDevices = [
    { device = "/dev/disk/by-uuid/c86b46d7-91a9-410e-bfc4-375bf511f7fa"; }
  ];
  networking.useDHCP = lib.mkDefault true;
  nixpkgs.hostPlatform = lib.mkDefault "x86_64-linux";
  hardware.cpu.amd.updateMicrocode = lib.mkDefault config.hardware.enableRedistributableFirmware;
}

@FILE variables.nix
{
  gitUsername = "lune";
  gitEmail = "lune@nixos";
  timeZone = "Europe/Paris";
  monitorConfig = ''
    output "DP-2" {
        mode "3440x1440@100.000"
        scale 1.0
        position x=0 y=0
    }
  '';
  clock24h = false;
  browser = "vivaldi";
  terminal = "wezterm";
  keyboardLayout = "us";
  consoleKeyMap = "us";
  thunarEnable = true;
  stylixEnable = true;
  barChoice = "noctalia";
  defaultShell = "zsh";
  stylixImage = ../modules/home/theme/stylix/wallpaper.jpg;
  startupApps = [ ];
}

@DIR modules/core
@FILE appimage.nix
{ pkgs, ... }:
{
  boot.binfmt.registrations.appimage = {
    wrapInterpreterInShell = false;
    interpreter = "${pkgs.appimage-run}/bin/appimage-run";
    recognitionType = "magic";
    offset = 0;
    mask = ''\xff\xff\xff\xff\x00\x00\x00\x00\xff\xff\xff'';
    magicOrExtension = ''\x7fELF....AI\x02'';
  };
  environment.systemPackages = [ pkgs.appimage-run ];
  programs.fuse.userAllowOther = true;
}

@FILE boot.nix
{ pkgs, ... }:
{
  boot = {
    kernelPackages = pkgs.linuxPackages_zen;
    kernelParams = [ "usbcore.autosuspend=-1" ];
    loader.systemd-boot.enable = true;
    loader.efi.canTouchEfiVariables = true;
    plymouth.enable = true;
  };
}

@FILE drivers.nix
{ pkgs, config, ... }:
{
  hardware.graphics = {
    enable = true;
    enable32Bit = true;
  };
  services.xserver.videoDrivers = [ "amdgpu" ];
  systemd.tmpfiles.rules = [
    "L+    /opt/rocm/hip   -    -    -     -    ${pkgs.rocmPackages.clr}"
  ];
  boot.kernelModules = [
    "it87"
    "v4l2loopback"
  ];
  boot.extraModulePackages = [
    config.boot.kernelPackages.v4l2loopback
    config.boot.kernelPackages.it87
  ];
  programs.coolercontrol.enable = true;
  hardware.amdgpu.overdrive = {
    enable = true;
    ppfeaturemask = "0xffffffff";
  };
}

@FILE fonts.nix
{ pkgs, ... }: {
  fonts = {
    fontconfig = {
      enable = true;
      defaultFonts = {
        serif = [ "Jost" "Noto Serif" "Noto Serif CJK SC" ];
        sansSerif = [ "Jost" "Noto Sans" "Noto Sans CJK SC" ];
        monospace = [ "JetBrains Mono" "Noto Sans Mono CJK SC" ];
      };
    };
    packages = with pkgs; [
      jost  # Your main font
      jetbrains-mono  # Terminal/code
      noto-fonts
      noto-fonts-cjk-sans
      noto-fonts-cjk-serif
      noto-fonts-color-emoji
      font-awesome
    ];
  };
}

@FILE greetd.nix
{ pkgs, ... }:
{
  services.greetd = {
    enable = true;
    settings = {
      default_session = {
        command = "${pkgs.tuigreet}/bin/tuigreet --time --remember --cmd niri-session";
        user = "greeter";
      };
    };
  };
  security.pam.services.greetd.enableGnomeKeyring = true;
  environment.systemPackages = [ pkgs.tuigreet ];
}

@FILE hardware.nix
{ pkgs, config, ... }:
{
  hardware = {
    sane = {
      enable = true;
      extraBackends = [ pkgs.sane-airscan ];
      disabledDefaultBackends = [ "escl" ];
    };
    graphics.enable = true;
    enableRedistributableFirmware = true;
    bluetooth.enable = true;
    bluetooth.powerOnBoot = true;
    i2c.enable = true;
  };
  boot.extraModulePackages = [ config.boot.kernelPackages.ddcci-driver ];
  boot.kernelModules = [
    "i2c-dev"
    "ddcci_backlight"
  ];
  services.udev.extraRules = ''
    KERNEL=="i2c-[0-9]*", GROUP="i2c", MODE="0660"
    SUBSYSTEM=="i2c", ACTION=="add", ATTR{name}=="AMDGPU DM*", RUN+="${pkgs.bash}/bin/sh -c 'echo ddcci 0x37 > /sys/bus/i2c/devices/%k/new_device'"
    SUBSYSTEM=="hidraw", ATTRS{idVendor}=="373b", ATTRS{idProduct}=="10c9", MODE="0660", GROUP="users", TAG+="uaccess"
    SUBSYSTEM=="usb", ATTR{idVendor}=="373b", ATTR{idProduct}=="10c9", MODE="0660", GROUP="users", TAG+="uaccess"
  '';
}

@FILE network.nix
{
  host,
  options,
  ...
}: {
  networking = {
    hostName = "${host}";
    networkmanager.enable = true;
    timeServers = options.networking.timeServers.default ++ ["pool.ntp.org"];
    firewall = {
      enable = true;
      allowedTCPPorts = [
        22
        80
        443
        59010
        59011
        8080
      ];
      allowedUDPPorts = [
        59010
        59011
      ];
    };
  };
}

@FILE nh.nix
{ pkgs, username, ... }:
{
  programs.nh = {
    enable = true;
    clean = {
      enable = true;
      extraArgs = "--keep-since 7d --keep 5";
    };
    flake = "/home/${username}/Lis-os";
  };
  environment.variables.FLAKE = "/home/${username}/Lis-os";
  environment.systemPackages = with pkgs; [
    nix-output-monitor
    nvd
  ];
}

@FILE packages.nix
{ pkgs, ... }:
{
  nixpkgs.config.allowUnfree = true;
  environment.systemPackages = with pkgs; [
    git # Version control
    wget
    curl # Network fetchers
    unzip
    unrar # Archive handlers
    lm_sensors # Temperature monitoring
    pciutils # lspci
    usbutils # lsusb
    lshw # Hardware lister
    htop # Interactive process viewer
    btop # Modern resource monitor (colorful!)
    iotop # Disk I/O monitoring
    duf # Better df alternative
    ncdu # Disk usage analyzer (TUI)
    smartmontools # SMART disk monitoring
    nmap # Network scanner
    iperf3 # Network performance testing
    ethtool # Ethernet interface config
    wireshark # Packet analyzer (GUI)
    ripgrep # Better grep
    fd # Better find
    eza # Better ls
    bat # Better cat (syntax highlighting)
    fzf # Fuzzy finder
    file # Determine file type
    tree # Directory tree view
    rsync # File synchronization
    ffmpeg # Video/audio processing
    pipewire # Audio server
    wireplumber # Session manager
  ];
}

@FILE portals.nix
{ pkgs, ... }:
{
  xdg.portal = {
    enable = true;
    wlr.enable = false; # Niri uses GNOME portal, not WLR
    xdgOpenUsePortal = true; # Force apps to use the portal for links/files
    extraPortals = [
      pkgs.xdg-desktop-portal-gtk
      pkgs.xdg-desktop-portal-gnome
    ];
    config = {
      niri = {
        default = [ "gtk" ]; # Use GTK for FileChooser/etc (Faster/Reliable)
        "org.freedesktop.impl.portal.ScreenCast" = [ "gnome" ]; # Discord/Vesktop streaming
        "org.freedesktop.impl.portal.Screenshot" = [ "gnome" ];
        "org.freedesktop.impl.portal.Secret" = [ "gnome-keyring" ]; # Passwords
      };
      common = {
        default = [ "gtk" ]; # Use GTK fallback
        "org.freedesktop.impl.portal.ScreenCast" = [ "gnome" ];
        "org.freedesktop.impl.portal.Screenshot" = [ "gnome" ];
        "org.freedesktop.impl.portal.Secret" = [ "gnome-keyring" ];
      };
    };
  };
}

@FILE security.nix
_: {
  security = {
    rtkit.enable = true;
    pam.services.swaylock = {
      text = ''auth include login '';
    };
    polkit = {
      enable = true;
      extraConfig = ''
        /* Allow normal users to reboot/shutdown */
        polkit.addRule(function(action, subject) {
          if ( subject.isInGroup("users") && (
           action.id == "org.freedesktop.login1.reboot" ||
           action.id == "org.freedesktop.login1.reboot-multiple-sessions" ||
           action.id == "org.freedesktop.login1.power-off" ||
           action.id == "org.freedesktop.login1.power-off-multiple-sessions"
          ))
          { return polkit.Result.YES; }
        });
        /* FIX: Allow CoreCtrl to apply settings without password */
        polkit.addRule(function(action, subject) {
            if ((action.id == "org.corectrl.helper.init" ||
                 action.id == "org.corectrl.helper1.init") &&
                subject.isInGroup("wheel")) {
                return polkit.Result.YES;
            }
        });
      '';
    };
  };
}

@FILE services.nix
{ ... }:
{
  services = {
    libinput.enable = true; # Input Handling
    fstrim.enable = true; # SSD Optimizer
    gvfs.enable = true; # For Mounting USB & More
    openssh.enable = true; # Enable SSH
    blueman.enable = true; # Bluetooth Support
    tumbler.enable = true; # Image/video preview
    gnome.gnome-keyring.enable = true;
    upower.enable = true; # Power management (required for DMS battery monitoring)
    smartd = {
      enable = true;
      autodetect = true;
    };
    pipewire = {
      enable = true;
      alsa.enable = true;
      alsa.support32Bit = true;
      pulse.enable = true;
      wireplumber.enable = true; # Enable WirePlumber session manager
      extraConfig.pipewire."92-low-rates" = {
        "context.properties" = {
          "default.clock.allowed-rates" = [
            44100
            48000
            88200
            96000
          ];
        };
      };
    };
  };
}

@FILE steam.nix
{ pkgs, ... }:
{
  programs = {
    steam = {
      enable = true;
      remotePlay.openFirewall = true;
      dedicatedServer.openFirewall = false;
      extraCompatPackages = [ pkgs.proton-ge-bin ];
      package = pkgs.steam.override {
        extraPkgs =
          pkgs: with pkgs; [
            libusb1
            udev
            SDL2
            xorg.libXcursor
            xorg.libXi
            xorg.libXinerama
            xorg.libXScrnSaver
            xorg.libXcomposite
            xorg.libXdamage
            xorg.libXrender
            xorg.libXext
            libkrb5
            keyutils
          ];
      };
    };
  };
  environment.systemPackages = with pkgs; [
    mangohud
  ];
}

@FILE stylix.nix
{
  pkgs,
  lib,
  ...
}: let
  inherit (import ../../hosts/variables.nix) stylixImage stylixEnable;
in
lib.mkIf stylixEnable {
  stylix = {
    enable = true;
    enableReleaseChecks = false;
    image = stylixImage;
    polarity = "dark";
    opacity.terminal = 1.0;
    cursor = {
      package = pkgs.bibata-cursors;
      name = "Bibata-Modern-Ice";
      size = 24;
    };
    fonts = {
      monospace = {
        package = pkgs.nerd-fonts.jetbrains-mono;
        name = "JetBrains Mono";
      };
      sansSerif = {
        package = pkgs.montserrat;
        name = "Montserrat";
      };
      serif = {
        package = pkgs.montserrat;
        name = "Montserrat";
      };
      sizes = {
        applications = 12;
        terminal = 15;
        desktop = 11;
        popups = 12;
      };
    };
  };
}

@FILE system.nix
{ pkgs, ... }:
let
  variables = import ../../hosts/variables.nix;
  inherit (variables) consoleKeyMap timeZone;
in
{
  nix = {
    settings = {
      download-buffer-size = 250000000;
      auto-optimise-store = true;
      experimental-features = [
        "nix-command"
        "flakes"
      ];
      substituters = [
        "https://hyprland.cachix.org"
      ];
      trusted-public-keys = [
        "hyprland.cachix.org-1:a7pgxzMz7+chwVL3/pzj6jIBMioiJM7ypFP8PwtkuGc="
      ];
      warn-dirty = false;
    };
  };
  time.timeZone = "${timeZone}";
  i18n.defaultLocale = "en_US.UTF-8";
  programs.nix-ld.enable = true;
  programs.nix-ld.libraries = with pkgs; [
    stdenv.cc.cc.lib
    zlib
    openssl
    libGL
  ];
  console.keyMap = "${consoleKeyMap}";
  system.stateVersion = "25.05";
}

@FILE user.nix
{
  pkgs,
  inputs,
  username,
  host,
  profile,
  ...
}:
let
  variables = import ../../hosts/variables.nix;
  inherit (variables) gitUsername;
  defaultShell = variables.defaultShell or "zsh";
  shellPackage = if defaultShell == "fish" then pkgs.fish else pkgs.zsh;
in
{
  imports = [ inputs.home-manager.nixosModules.home-manager ];
  programs.fish.enable = true;
  programs.zsh.enable = true;
  users.groups.i2c = {};
  home-manager = {
    useUserPackages = true;
    useGlobalPkgs = true;
    backupFileExtension = "backup";
    extraSpecialArgs = {
      inherit
        inputs
        username
        host
        profile
        ;
    };
    users.${username} = {
      imports = [ ./../home ];
      home = {
        username = "${username}";
        homeDirectory = "/home/${username}";
        stateVersion = "25.05";
      };
    };
  };
  users.mutableUsers = true;
  users.users.${username} = {
    isNormalUser = true;
    description = "${gitUsername}";
    extraGroups = [
      "adbusers"
      "docker"
      "libvirtd" # For VirtManager
      "lp"
      "networkmanager"
      "scanner"
      "wheel" # sudo access
      "vboxusers" # For VirtualBox
      "i2c"
    ];
    shell = shellPackage;
    ignoreShellProgramCheck = true;
  };
  nix.settings.allowed-users = [ "${username}" ];
}

@FILE virtualization.nix
{ pkgs, ... }:
let
  username = "lune"; # Your user
in
{
  virtualisation.libvirtd = {
    enable = true;
    qemu = {
      package = pkgs.qemu_kvm;
      runAsRoot = true;
      swtpm.enable = true; # TPM emulation (useful for some OSes)
    };
  };
  users.users.${username}.extraGroups = [ "libvirtd" ];
  programs.virt-manager.enable = true;
  environment.systemPackages = with pkgs; [
    virt-viewer # Lightweight VM viewer
    spice-gtk # Better clipboard/display for VMs
  ];
  programs.dconf.enable = true;
}

@DIR modules/home
@FILE appimage.nix
{ pkgs, ... }:
{
  home.packages = [
  ];
  xdg.desktopEntries.appimage-runner = {
    name = "AppImage Runner";
    exec = "${pkgs.appimage-run}/bin/appimage-run %f";
    type = "Application";
    mimeType = [ "application/vnd.appimage" ];
    noDisplay = true;
  };
  xdg.mimeApps.defaultApplications = {
    "application/vnd.appimage" = [ "appimage-runner.desktop" ];
  };
}

@FILE default.nix
{ lib, ... }:
let
  variables = import ../../hosts/variables.nix;
  barChoice = variables.barChoice or "noctalia";
  defaultShell = variables.defaultShell or "zsh";
in
{
  imports = [
    ./appimage.nix
    ./desktop
    ./environment.nix
    ./programs/fzf.nix
    ./programs/git.nix
    ./programs/kitty.nix
    ./programs/lazygit.nix
    ./programs/starship.nix
    ./programs/thunar.nix
    ./programs/vivaldi-flags.nix
    ./programs/wezterm.nix
    ./programs/zed.nix
    ./programs/zoxide.nix
    ./programs/antigravity.nix
    ./programs/hyfetch.nix
    ./programs/zellij.nix
    ./theme/default.nix
    ./theme/gtk.nix
    ./theme/qt.nix
    ./theme/stylix/stylix.nix
    ./packages.nix
    ./scripts
  ]
  ++ lib.optionals (defaultShell == "zsh") [ ./programs/zsh.nix ];
}

@DIR modules/home/desktop
@FILE default.nix
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

@DIR modules/home/desktop/niri
@FILE default.nix
{ ... }:
{
  imports = [
    ./niri.nix
  ];
}

@FILE keybinds.nix
{
  terminal,
  browser,
  hostKeybinds ? "",
  ...
}:
''
  binds {
      Mod+Return { spawn "${terminal}"; }
      Mod+Shift+Return { spawn "${terminal}" "start" "--class" "wezterm-float"; }
      Mod+B { spawn "${browser}"; }
      Mod+E { spawn "errands"; }
      Mod+Z { spawn "zeditor"; }
      Mod+Space { spawn "noctalia-shell" "ipc" "call" "launcher" "toggle"; }
      Mod+V { spawn "noctalia-shell" "ipc" "call" "launcher" "clipboard"; }
      Mod+Shift+W { spawn "noctalia-shell" "ipc" "call" "wallpaper" "toggle"; }
      Mod+Shift+1 { spawn "bash" "-c" "niri msg action focus-workspace 1; (cd ~/Lis-os && antigravity &); sleep 1; niri msg action set-column-width '66.667%'; sleep 0.2; wezterm start --always-new-process --cwd ~/Lis-os &"; }
      Mod+T { spawn "thunar"; }
      Mod+Shift+T { spawn "thunar" "--name" "thunar-float"; }
      Mod+S { screenshot; }
      Mod+Shift+Q { spawn "noctalia-shell" "ipc" "call" "sessionMenu" "toggle"; }
      Mod+Ctrl+Shift+S { spawn "noctalia-shell" "ipc" "call" "settings" "toggle"; }
      Mod+Q { close-window; }
      Mod+L { spawn "loginctl" "lock-session"; }
      Mod+Minus { set-column-width "33.333%"; }
      Mod+Equal { set-column-width "50%"; }
      Mod+BracketLeft { set-column-width "66.667%"; }
      Mod+BracketRight { set-column-width "100%"; }
      Mod+R { switch-preset-column-width; }
      Mod+F { maximize-column; }
      Mod+Shift+F { fullscreen-window; }
      Mod+C { center-column; }
      Mod+Left  { focus-column-left; }
      Mod+Right { focus-column-right; }
      Mod+Shift+Left  { move-column-left; }
      Mod+Shift+Right { move-column-right; }
      Mod+Down  { focus-workspace-down; }
      Mod+Up    { focus-workspace-up; }
      Mod+Shift+Down  { move-column-to-workspace-down; }
      Mod+Shift+Up    { move-column-to-workspace-up; }
      Mod+J     { focus-window-down; }
      Mod+K     { focus-window-up; }
      XF86AudioRaiseVolume allow-when-locked=true { spawn "playerctl" "--player=Deezer" "volume" "0.05+"; }
      XF86AudioLowerVolume allow-when-locked=true { spawn "playerctl" "--player=Deezer" "volume" "0.05-"; }
      XF86AudioMute        allow-when-locked=true { spawn "playerctl" "--player=Deezer" "play-pause"; }
      XF86AudioPlay        allow-when-locked=true { spawn "playerctl" "--player=Deezer" "play-pause"; }
      XF86AudioNext        allow-when-locked=true { spawn "playerctl" "--player=Deezer" "next"; }
      XF86AudioPrev        allow-when-locked=true { spawn "playerctl" "--player=Deezer" "previous"; }
      XF86MonBrightnessUp   { spawn "swayosd-client" "--brightness" "raise"; }
      XF86MonBrightnessDown { spawn "swayosd-client" "--brightness" "lower"; }
      Mod+F1 { spawn "swayosd-client" "--brightness" "lower"; }
      Mod+F2 { spawn "swayosd-client" "--brightness" "raise"; }
      ${hostKeybinds}
  }
''

@FILE layout.nix
{ ... }:
''
  config-notification {
      disable-failed
  }
  gestures {
      hot-corners {
          off
      }
  }
  input {
      keyboard {
          xkb {
              layout "us"
              variant ""
          }
          numlock
      }
      touchpad {
          natural-scroll
      }
      mouse {
          accel-profile "adaptive"
          accel-speed 1.0
      }
      trackpoint {
      }
      focus-follows-mouse
      warp-mouse-to-focus
  }
  cursor {
      hide-when-typing
  }
  layout {
      gaps 9
      center-focused-column "never"
      always-center-single-column
      preset-column-widths {
          proportion 0.33333
          proportion 0.5
          proportion 0.66667
          proportion 1.0
      }
      default-column-width { proportion 0.5; }
      border {
          width 2
          active-color "#cba6f7"
          inactive-color "#45475a"
          urgent-color "#f5c2e7"
      }
      focus-ring {
          off
          width 2
          active-color   "#808080"
          inactive-color "#505050"
      }
      shadow {
          softness 30
          spread 5
          offset x=0 y=5
          color "#0007"
      }
      struts {
      }
  }
  /-layer-rule {
      match namespace="^quickshell$"
      place-within-backdrop true
  }
  overview {
      backdrop-color "#1e1e2e"
      workspace-shadow {
          softness 40
          spread 10
          offset x=0 y=10
          color "#00000050"
      }
      zoom 0.5
  }
  animations {
      workspace-switch {
          spring damping-ratio=0.80 stiffness=523 epsilon=0.0001
      }
      window-open {
          duration-ms 150
          curve "ease-out-expo"
      }
      window-close {
          duration-ms 150
          curve "ease-out-quad"
      }
      horizontal-view-movement {
          spring damping-ratio=0.85 stiffness=423 epsilon=0.0001
      }
      window-movement {
          spring damping-ratio=0.75 stiffness=323 epsilon=0.0001
      }
      window-resize {
          spring damping-ratio=0.85 stiffness=423 epsilon=0.0001
      }
      config-notification-open-close {
          spring damping-ratio=0.65 stiffness=923 epsilon=0.001
      }
      screenshot-ui-open {
          duration-ms 200
          curve "ease-out-quad"
      }
      overview-open-close {
          spring damping-ratio=0.85 stiffness=800 epsilon=0.0001
      }
  }
''

@FILE niri.nix
{
  config,
  pkgs,
  lib,
  inputs,
  host,
  astalPkgs,
  ...
}:
let
  variables = import ../../../../hosts/variables.nix;
  inherit (variables)
    browser
    terminal
    stylixImage
    startupApps
    monitorConfig
    ;
  barChoice = variables.barChoice or "waybar";
  niriPkg = pkgs.niri;
  hostKeybindsPath = ./hosts/${host}/keybinds.nix;
  hostKeybinds =
    if builtins.pathExists hostKeybindsPath then import hostKeybindsPath { inherit host; } else "";
  keybindsModule = import ./keybinds.nix {
    inherit
      host
      terminal
      browser
      barChoice
      hostKeybinds
      config
      ;
  };
  windowrulesModule = import ./windowrules.nix { inherit host; };
  layoutModule = import ./layout.nix { inherit config; };
  workspacesModule = import ./workspaces.nix { };
  startupModule = import ./startup.nix {
    inherit
      host
      stylixImage
      startupApps
      barChoice
      pkgs
      ;
  };
  hostOutputsPath = ./hosts/${host}/outputs.nix;
  hostOutputs =
    if builtins.pathExists hostOutputsPath then
      import hostOutputsPath { inherit host; }
    else
      monitorConfig;
  hostWindowRulesPath = ./hosts/${host}/windowrules.nix;
  hostWindowRules =
    if builtins.pathExists hostWindowRulesPath then
      import hostWindowRulesPath { inherit host; }
    else
      "";
  baseConfig = ''
    ${hostOutputs}
    ${workspacesModule}
    ${layoutModule}
    ${keybindsModule}
    ${windowrulesModule}
    ${hostWindowRules}
    ${startupModule}
    environment {
          XDG_CURRENT_DESKTOP "niri"
          MOZ_ENABLE_WAYLAND "1"
          NIXOS_OZONE_WL "1"
          ELECTRON_OZONE_PLATFORM_HINT "wayland"
          QT_QPA_PLATFORM "wayland"
          QT_QPA_PLATFORMTHEME "gtk3"
          QT_QPA_PLATFORMTHEME_QT6 "gtk3"
          TERMINAL "${terminal}"
          XCURSOR_THEME "Bibata-Modern-Ice"
          XCURSOR_SIZE "24"
          __GL_GSYNC_ALLOWED "1"
          __GL_VRR_ALLOWED "1"
          PROTON_ENABLE_NVAPI "1"
          PROTON_HIDE_NVIDIA_GPU "0"
          PROTON_ENABLE_NGX_UPDATER "1"
    }
    hotkey-overlay {
        skip-at-startup
    }
    prefer-no-csd
  '';
in
{
  home.packages = with pkgs; [
    niriPkg
    udiskie
    xwayland-satellite
    swww
    grim
    slurp
    wl-clipboard
    swappy
  ];
  xdg.configFile."niri/config-base.kdl".text = baseConfig;
  systemd.user.services.niri-config-assembler = {
    Unit = {
      Description = "Assemble Niri Config (Base + Colors)";
      Before = [ "graphical-session.target" ];
    };
    Service = {
      Type = "oneshot";
      ExecStart = pkgs.writeShellScript "assemble-niri-config" ''
                BASE="$HOME/.config/niri/config-base.kdl"
                COLORS="$HOME/.config/niri/colors.kdl"
                FINAL="$HOME/.config/niri/config.kdl"
                if [ ! -f "$COLORS" ]; then
                  mkdir -p "$(dirname "$COLORS")"
                  cat <<EOF > "$COLORS"
        window-rule {
            border {
                active-color "#FF0000"
                inactive-color "#00FF00"
                width 2
            }
        }
        EOF
                fi
                cat "$BASE" > "$FINAL"
                echo "" >> "$FINAL"  # <--- CRITICAL SAFETY NEWLINE
                cat "$COLORS" >> "$FINAL"
      '';
    };
    Install.WantedBy = [ "graphical-session.target" ];
  };
  home.activation.setupNiriConfig = lib.hm.dag.entryAfter [ "writeBoundary" ] ''
    $DRY_RUN_CMD ${pkgs.systemd}/bin/systemctl --user start niri-config-assembler.service
  '';
  systemd.user.targets.niri-session = {
    Unit = {
      Description = "Niri compositor session";
      BindsTo = "graphical-session.target";
      Wants = "graphical-session-pre.target";
      After = "graphical-session-pre.target";
    };
  };
  systemd.user.services.waybar-niri = lib.mkIf (barChoice == "waybar") {
    Unit = {
      Description = "Waybar status bar";
      PartOf = "graphical-session.target";
      ConditionEnvironment = "XDG_CURRENT_DESKTOP=niri";
    };
    Service = {
      ExecStart = "${pkgs.waybar}/bin/waybar";
      Restart = "on-failure";
    };
    Install.WantedBy = [ "graphical-session.target" ];
  };
  systemd.user.services.xwayland-satellite = {
    Unit = {
      Description = "Xwayland outside Wayland";
      BindsTo = "graphical-session.target";
      After = "graphical-session.target";
    };
    Service = {
      Type = "notify";
      NotifyAccess = "all";
      ExecStart = "${pkgs.xwayland-satellite}/bin/xwayland-satellite";
      StandardOutput = "journal";
      Restart = "on-failure";
    };
    Install.WantedBy = [ "graphical-session.target" ];
  };
}

@FILE startup.nix
{
  pkgs,
  stylixImage,
  barChoice,
  ...
}:
let
  barStartupCommand =
    if barChoice == "noctalia" then
      ''spawn-at-startup "noctalia-shell"''
    else
      ''// ${barChoice} started via systemd service'';
  polkitAgent = "${pkgs.mate.mate-polkit}/libexec/polkit-mate-authentication-agent-1";
  updateEnv = pkgs.writeShellScript "niri-env-update" ''
    export XDG_CURRENT_DESKTOP=niri
    export XDG_SESSION_DESKTOP=niri
    export XDG_SESSION_TYPE=wayland
    ${pkgs.dbus}/bin/dbus-update-activation-environment --systemd \
      XDG_CURRENT_DESKTOP \
      XDG_SESSION_DESKTOP \
      XDG_SESSION_TYPE \
      WAYLAND_DISPLAY
    ${pkgs.systemd}/bin/systemctl --user import-environment \
      XDG_CURRENT_DESKTOP \
      XDG_SESSION_DESKTOP \
      XDG_SESSION_TYPE \
      WAYLAND_DISPLAY
  '';
in
''
  spawn-at-startup "${updateEnv}"
  spawn-at-startup "${polkitAgent}"
  spawn-at-startup "bash" "-c" "wl-paste --watch cliphist store &"
  spawn-at-startup "bash" "-c" "swww-daemon && sleep 1 && swww img '${stylixImage}'"
  ${barStartupCommand}
  spawn-at-startup "wal" "-R"
  spawn-at-startup "vivaldi"
  spawn-at-startup "bash" "-c" "sleep 3 && ${pkgs.corectrl}/bin/corectrl & disown"
  spawn-at-startup "bash" "-c" "deezer-enhanced --disable-gpu --enable-features=UseOzonePlatform --ozone-platform=wayland > $HOME/.deezer-boot.log 2>&1 & sleep 4; vesktop &"
''

@FILE windowrules.nix
{ ... }:
''
  window-rule {
      geometry-corner-radius 12
      clip-to-geometry true
      draw-border-with-background false
  }
  window-rule {
      match app-id="io.github.mrvladus.List"
      open-floating true
      default-column-width { proportion 0.4; }
      default-window-height { proportion 0.6; }
  }
  window-rule {
      match app-id="thunar" title="thunar-float"
      open-floating true
      default-column-width { proportion 0.6; }
      default-window-height { proportion 0.6; }
  }
  window-rule {
      match at-startup=true app-id=r#"^vivaldi.*$"#
      open-on-workspace "2"
      default-column-width { proportion 0.66667; }
  }
  window-rule {
      match app-id=r#"^dev\.zed\.Zed$"#
      default-column-width { proportion 0.33333; }
  }
  window-rule {
      match app-id="deezer-enhanced"
      open-on-workspace "3"
      default-column-width { proportion 0.33333; }
  }
  window-rule {
      match app-id="vesktop"
      open-on-workspace "3"
      default-column-width { proportion 0.66667; }
  }
  window-rule {
      match app-id="org.wezfurlong.wezterm"
      default-column-width { proportion 0.33333; }
  }
  window-rule {
      match app-id="wezterm-float"
      open-floating true
      default-floating-position x=0.5 y=0.5
      default-column-width { proportion 0.5; }
      default-window-height { proportion 0.5; }
  }
  window-rule {
      match app-id="^steam$" title="^Notification.*$"
      open-floating true
      default-floating-position x=1.0 y=0.0
  }
  window-rule {
      match app-id="^vivaldi.*$" title="^.*(Pop-up|Extension|Bitwarden).*$"
      open-floating true
      default-floating-position x=0.5 y=0.5
  }
''

@FILE workspaces.nix
{ ... }:
''
  workspace "1" {
  }
  workspace "2" {
  }
''

@DIR modules/home/desktop/noctalia
@FILE default.nix
{
  pkgs,
  lib,
  inputs,
  ...
}:
let
  system = pkgs.stdenv.hostPlatform.system;
  basePkg =
    inputs.noctalia.packages.${system}.noctalia-shell or inputs.noctalia.packages.${system}.default;
  patchedNoctalia = basePkg.overrideAttrs (old: {
    buildInputs = lib.lists.remove pkgs.matugen (old.buildInputs or [ ]);
    postPatch = (old.postPatch or "") + ''
      echo "Applying Soft-Fork Patches..."
      substituteInPlace Services/Theming/AppThemeService.qml \
        --replace-fail 'TemplateProcessor.processWallpaperColors(wp, mode);' \
                       'var clean = wp.toString().replace("file://", ""); Quickshell.execDetached(["bash", "-c", "theme-engine " + clean + " > /tmp/theme-hook.log 2>&1"]);'
      substituteInPlace shell.qml \
        --replace-fail 'GitHubService.init();' '// GitHubService.init();' \
        --replace-fail 'UpdateService.init();' '// UpdateService.init();'
      echo "Soft-Fork Patches Applied Successfully."
    '';
  });
in
{
  home.packages = [ patchedNoctalia ];
}

@DIR modules/home
@FILE environment.nix
{ ... }:
{
  home.sessionVariables = {
    BROWSER = "xdg-open";
    EDITOR = "zeditor";
    TERMINAL = "kitty";
    NIXOS_OZONE_WL = "1";
    MOZ_ENABLE_WAYLAND = "1";
    ELECTRON_OZONE_PLATFORM_HINT = "wayland";
    XDG_CURRENT_DESKTOP = "niri";
    XDG_SESSION_DESKTOP = "niri";
    XDG_SESSION_TYPE = "wayland";
    GTK_USE_PORTAL = "1";
    QT_QPA_PLATFORM = "wayland";
    _JAVA_AWT_WM_NONREPARENTING = "1";
    FONTCONFIG_FILE = "/etc/fonts/fonts.conf";
  };
  services.swayosd.enable = true;
}

@FILE packages.nix
{ pkgs, ... }:
{
  home.packages = with pkgs; [
    (symlinkJoin {
      name = "deezer-enhanced-fixed";
      paths = [ deezer-enhanced ];
      buildInputs = [ makeWrapper ];
      postBuild = ''
        wrapProgram $out/bin/deezer-enhanced \
          --prefix XDG_DATA_DIRS : "${gsettings-desktop-schemas}/share/gsettings-schemas/${gsettings-desktop-schemas.name}:${gtk3}/share/gsettings-schemas/${gtk3.name}"
      '';
    })
    appimage-run # AppImage handler
    vesktop # Discord
    vivaldi # Browser
    errands # Todo app
    gemini-cli # Gemini protocol
    eza # Better ls
    bat # Better cat
    fd # Better find
    zoxide # Better cd
    yazi # Better file manager
    github-cli # Manage Github
    gnused # Stream editor (Added)
    hyfetch # Gay flex
    jq # JSON processor
    nvd # Nix diffs
    starship # Custom prompt shell
    libnotify # For notify-send
    ffmpegthumbnailer # Video thumbnails
    file-roller # Archive GUI
    xfce.thunar # File manager
    xfce.thunar-archive-plugin # Right-click extract
    xfce.thunar-media-tags-plugin # Audio tags
    xfce.thunar-volman # Auto-mount USB
    grim # Screenshots
    slurp # Area selection
    swappy # Edit screenshots
    wl-clipboard # Clipboard
    cliphist # Clipboard Manager
    imagemagick # Convert bitmap images
    pastel # Palette generator
    swww # Wallpaper switch
    bc # colors thing
    brightnessctl
    ddcutil # Monitor control
    networkmanagerapplet
    playerctl # Media keys
    ripgrep # Better grep
    swayosd # Volume/brightness OSD
    pkgs.gtk4-layer-shell # Required for Astal GTK4
    nix-output-monitor # Better nix output
    nixd # Nix Language Server
    nixfmt-rfc-style # Formatter
    statix # Linter
    deadnix # Dead code detection
    uv # Python package runner (provides uvx for MCP servers)
  ];
}

@DIR modules/home/programs
@FILE antigravity.nix
{ pkgs, ... }:
{
  home.packages = with pkgs; [
    (symlinkJoin {
      name = "antigravity";
      paths = [ antigravity ];
      buildInputs = [ makeWrapper ];
      postBuild = ''
        wrapProgram $out/bin/antigravity \
          --set ELECTRON_OZONE_PLATFORM_HINT "x11"
      '';
    })
    vscode-extensions.jnoortheen.nix-ide
    vscode-extensions.mkhl.direnv
  ];
  xdg.configFile."Antigravity/User/settings-base.json".text = builtins.toJSON {
    "workbench.colorTheme" = "LisTheme";
    "editor.fontFamily" = "'JetBrains Mono', 'Droid Sans Mono', 'monospace', monospace";
    "editor.fontSize" = 14;
    "terminal.integrated.fontFamily" = "'JetBrains Mono'";
    "editor.minimap.enabled" = false;
    "nix.enableLanguageServer" = true;
    "nix.serverPath" = "nixd";
    "nix.serverSettings" = {
      "nixd" = {
        "formatting" = {
          "command" = [ "nixfmt" ];
        };
        "options" = {
          "nixos" = {
            "expr" = "(builtins.getFlake \"/home/lune/Lis-os\").nixosConfigurations.nixos.options";
          };
          "home-manager" = {
            "expr" = "(builtins.getFlake \"/home/lune/Lis-os\").homeConfigurations.lune.options";
          };
        };
      };
    };
    "[nix]" = {
      "editor.defaultFormatter" = "jnoortheen.nix-ide";
      "editor.formatOnSave" = true;
    };
  };
  xdg.configFile."theme-engine/templates/antigravity.template".source =
    ../theme/templates/antigravity.template;
  home.file.".antigravity/extensions/lis-theme/package.json".text = builtins.toJSON {
    name = "lis-theme";
    displayName = "Lis Theme";
    version = "0.0.1";
    publisher = "Lis";
    engines = {
      vscode = "^1.0.0";
    };
    categories = [ "Themes" ];
    contributes = {
      themes = [
        {
          label = "LisTheme";
          uiTheme = "vs-dark";
          path = "./themes/lis-theme.json";
        }
      ];
    };
  };
  home.file.".antigravity/extensions/lis-theme/themes/.keep".text = "";
}

@FILE fzf.nix
{
  config,
  lib,
  ...
}: let
  accent = "#" + config.lib.stylix.colors.base0D;
  foreground = "#" + config.lib.stylix.colors.base05;
  muted = "#" + config.lib.stylix.colors.base03;
in {
  programs.fzf = {
    enable = true;
    enableZshIntegration = true;
    enableFishIntegration = true;
    colors = lib.mkForce {
      "fg+" = accent;
      "bg+" = "-1";
      "fg" = foreground;
      "bg" = "-1";
      "prompt" = muted;
      "pointer" = accent;
    };
    defaultOptions = [
      "--margin=1"
      "--layout=reverse"
      "--border=none"
      "--info='hidden'"
      "--header=''"
      "--prompt='--> '"
      "-i"
      "--no-bold"
      "--bind='enter:execute(nvim {})'"
      "--preview='bat --style=numbers --color=always --line-range :500 {}'"
      "--preview-window=right:60%:wrap"
    ];
  };
}

@FILE git.nix
{ ... }:
let
  inherit (import ../../../hosts/variables.nix) gitUsername gitEmail;
in
{
  programs.git = {
    enable = true;
    settings = {
      user = {
        name = "${gitUsername}";
        email = "${gitEmail}";
      };
      push.default = "simple"; # Match modern push behavior
      credential.helper = "cache --timeout=7200";
      init.defaultBranch = "main"; # Set default new branches to 'main'
      log.decorate = "full"; # Show branch/tag info in git log
      log.date = "iso"; # ISO 8601 date format
      merge.conflictStyle = "diff3";
      alias = {
        br = "branch --sort=-committerdate";
        co = "checkout";
        df = "diff";
        com = "commit -a";
        gs = "stash";
        gp = "pull";
        lg = "log --graph --pretty=format:'%Cred%h%Creset - %C(yellow)%d%Creset %s %C(green)(%cr)%C(bold blue) <%an>%Creset' --abbrev-commit";
        st = "status";
      };
    };
  };
}

@FILE hyfetch.nix
{ pkgs, ... }:
{
  xdg.configFile."theme-engine/templates/hyfetch.json".text = builtins.toJSON {
    preset = "";
    mode = "rgb";
    light_dark = "dark";
    lightness = 0.5;
    color_align = {
      mode = "horizontal";
      custom_colors = [
        "{ui_prim}"
        "{syn_acc}"
        "{ui_sec}"
        "{fg}"
      ];
      fore_back = null;
    };
    backend = "neofetch";
    args = null;
    distro = null;
    pride_month_shown = [ ];
    pride_month_disable = false;
  };
}

@FILE kitty.nix
{ pkgs, ... }:
let
  variables = import ../../../hosts/variables.nix;
  defaultShell = variables.defaultShell or "zsh";
  shellPackage = if defaultShell == "fish" then pkgs.fish else pkgs.zsh;
in
{
  programs.kitty = {
    enable = true;
    settings = {
      shell = "${shellPackage}/bin/${defaultShell}";
      font_size = 12;
      font_family = "JetBrains Mono";
      window_padding_width = 4;
      cursor_trail = 1;
      allow_remote_control = "yes";
      listen_on = "unix:@mykitty";
      include = "~/.cache/wal/colors-kitty.conf"; # Dynamic colors include
      paste_on_middle_click = "no";
      copy_on_select = "clipboard";
      mouse_hide_wait = "3.0";
      open_url_with = "default";
      url_style = "curly";
      shell_integration = "enabled";
    };
    extraConfig = ''
      mouse_map left click ungrabbed mouse_handle_click selection link prompt
      map shift+up        scroll_line_up
      map shift+down      scroll_line_down
      map ctrl+shift+up   scroll_page_up
      map ctrl+shift+down scroll_page_down
      map ctrl+shift+equal change_font_size all +2.0
      map ctrl+shift+minus change_font_size all -2.0
      map ctrl+mousewheel_up change_font_size all +1.0
      map ctrl+mousewheel_down change_font_size all -1.0
      map ctrl+shift+t new_tab
      map ctrl+shift+w close_tab
      map ctrl+shift+right next_tab
      map ctrl+shift+left previous_tab
    '';
  };
  xdg.configFile."theme-engine/templates/kitty.conf".source = ../theme/templates/kitty.conf;
}

@FILE lazygit.nix
{ config, lib, ... }:
let
  accent = "#${config.lib.stylix.colors.base0D}";
  muted = "#${config.lib.stylix.colors.base03}";
in {
  programs.lazygit = {
    enable = true;
    settings = lib.mkForce {
      disableStartupPopups = true;
      notARepository = "skip";
      promptToReturnFromSubprocess = false;
      update.method = "never";
      git = {
        commit.signOff = true;
        parseEmoji = true;
      };
      gui = {
        theme = {
          activeBorderColor = [ accent "bold" ];
          inactiveBorderColor = [ muted ];
        };
        showListFooter = false;
        showRandomTip = false;
        showCommandLog = false;
        showBottomLine = false;
        nerdFontsVersion = "3";
      };
    };
  };
}

@FILE starship.nix
{ ... }:
let
  variables = import ../../../hosts/variables.nix;
  defaultShell = variables.defaultShell or "zsh";
in
{
  programs.starship.enable = defaultShell != "fish";
  xdg.configFile."wal/templates/starship.toml".source = ../theme/templates/starship.toml;
}

@FILE thunar.nix
{ ... }:
{
  xfconf.enable = true;  # Thunar needs xfconf for settings
  gtk.enable = true;     # Thunar is GTK app
  xdg.configFile."xfce4/xfconf/xfce-perchannel-xml/thunar.xml".text = ''
    <?xml version="1.0" encoding="UTF-8"?>
    <channel name="thunar" version="1.0">
      <property name="last-view" type="string" value="ThunarDetailsView"/>
      <property name="last-icon-view-zoom-level" type="string" value="THUNAR_ZOOM_LEVEL_NORMAL"/>
      <property name="last-details-view-zoom-level" type="string" value="THUNAR_ZOOM_LEVEL_NORMAL"/>
      <property name="last-window-width" type="int" value="1024"/>
      <property name="last-window-height" type="int" value="768"/>
      <property name="misc-single-click" type="bool" value="false"/>
      <property name="misc-new-tab-as-current" type="bool" value="true"/>
    </channel>
  '';
  xdg.configFile."Thunar/uca.xml".text = ''
    <?xml version="1.0" encoding="UTF-8"?>
    <actions>
      <action>
        <icon>utilities-terminal</icon>
        <name>Open Terminal Here</name>
        <command>kitty --working-directory=%f</command>
        <description>Open terminal in this folder</description>
        <patterns>*</patterns>
        <directories/>
      </action>
    </actions>
  '';
}

@FILE vivaldi-flags.nix
{ pkgs, config, ... }:
{
  xdg.configFile."vivaldi/flags.conf".text = ''
    --enable-features=MiddleClickAutoscroll
    --ozone-platform-hint=wayland
    --enable-wayland-ime
  '';
}

@FILE wezterm.nix
{ pkgs, ... }:
{
  programs.wezterm = {
    enable = true;
    extraConfig = ''
      local wezterm = require 'wezterm'
      local config = wezterm.config_builder()
      -- 1. Appearance (Kitty Parity)
      config.font = wezterm.font 'JetBrains Mono'
      config.font_size = 12.0
      config.window_padding = {
        left = 4,
        right = 4,
        top = 4,
        bottom = 4,
      }
      config.window_background_opacity = 0.95
      config.enable_tab_bar = true
      config.use_fancy_tab_bar = false
      config.tab_bar_at_bottom = true
      config.window_close_confirmation = 'NeverPrompt'
      -- 2. Dynamic Theming (Engine Integration)
      local colors_path = wezterm.home_dir .. "/.cache/wal/colors-wezterm.lua"
      wezterm.add_to_config_reload_watch_list(colors_path)
      local f = io.open(colors_path, "r")
      if f then
        f:close()
        -- Load the table returned by the lua file
        local scheme = dofile(colors_path)
        config.colors = scheme
      else
        -- Fallback if engine hasn't run yet
        config.color_scheme = 'Catppuccin Mocha'
      end
      -- 3. Mouse & Interaction
      config.hide_mouse_cursor_when_typing = true
      -- 4. Status Bar Helper (The "Control Helper")
      wezterm.on('update-right-status', function(window, pane)
        window:set_right_status(wezterm.format({
          { Attribute = { Intensity = 'Bold' } },
          { Text = '  CTRL+T: New Tab | CTRL+W: Close | CTRL+TAB: Cycle  ' },
        }))
      end)
      -- 5. Keybinds & Mouse Maps
      config.keys = {
        -- Font Sizing
        { key = 'Equal', mods = 'CTRL|SHIFT', action = wezterm.action.IncreaseFontSize },
        { key = 'Minus', mods = 'CTRL|SHIFT', action = wezterm.action.DecreaseFontSize },
        { key = '0', mods = 'CTRL|SHIFT', action = wezterm.action.ResetFontSize },
        -- Standard Copy/Paste (Modern Style)
        { key = 'c', mods = 'CTRL', action = wezterm.action.CopyTo 'Clipboard' },
        { key = 'v', mods = 'CTRL', action = wezterm.action.PasteFrom 'Clipboard' },
        -- Tabs (Browser Style)
        { key = 't', mods = 'CTRL', action = wezterm.action.SpawnTab 'CurrentPaneDomain' },
        { key = 'w', mods = 'CTRL', action = wezterm.action.CloseCurrentTab { confirm = false } },
        { key = 'Tab', mods = 'CTRL', action = wezterm.action.ActivateTabRelative(1) },
        { key = 'Tab', mods = 'CTRL|SHIFT', action = wezterm.action.ActivateTabRelative(-1) },
        -- Stop Process (Remapped)
        { key = 'C', mods = 'CTRL|SHIFT', action = wezterm.action.SendKey { key = 'c', mods = 'CTRL' } },
      }
      config.mouse_bindings = {
        -- Custom Right Click Menu
        {
          event = { Up = { streak = 1, button = 'Right' } },
          mods = 'NONE',
          action = wezterm.action.InputSelector {
            title = 'Context Menu',
            choices = {
              { label = '📄 Copy', id = 'copy' },
              { label = '📋 Paste', id = 'paste' },
              { label = '➕ New Tab', id = 'new_tab' },
              { label = '✖ Close Tab', id = 'close_tab' },
              { label = '➖ Split Vertical', id = 'vsplit' },
              { label = '◔ Split Horizontal', id = 'hsplit' },
              { label = '🧹 Clear Screen', id = 'clear' },
              { label = '🛑 Stop Process (Ctrl+C)', id = 'stop' },
            },
            action = wezterm.action_callback(function(window, pane, id, label)
              if not id and not label then
                wezterm.log_info 'Menu cancelled'
              else
                if id == 'copy' then window:perform_action(wezterm.action.CopyTo 'Clipboard', pane) end
                if id == 'paste' then window:perform_action(wezterm.action.PasteFrom 'Clipboard', pane) end
                -- Tabs
                if id == 'new_tab' then window:perform_action(wezterm.action.SpawnTab 'CurrentPaneDomain', pane) end
                if id == 'close_tab' then window:perform_action(wezterm.action.CloseCurrentTab { confirm = false }, pane) end
                -- Splits
                if id == 'vsplit' then window:perform_action(wezterm.action.SplitVertical { domain = 'CurrentPaneDomain' }, pane) end
                if id == 'hsplit' then window:perform_action(wezterm.action.SplitHorizontal { domain = 'CurrentPaneDomain' }, pane) end
                if id == 'close' then window:perform_action(wezterm.action.CloseCurrentPane { confirm = false }, pane) end
                -- ZSH / Term control
                if id == 'clear' then pane:send_text('\x0c') end -- Ctrl+L
                if id == 'stop' then pane:send_text('\x03') end  -- Ctrl+C
              end
            end),
          },
        },
        -- Ctrl+Click Open Link
        {
          event = { Up = { streak = 1, button = 'Left' } },
          mods = 'CTRL',
          action = wezterm.action.OpenLinkAtMouseCursor,
        },
      }
      return config
    '';
  };
}

@FILE zellij.nix
{ pkgs, ... }:
{
  programs.zellij = {
    enable = true;
    enableZshIntegration = false;
  };
  xdg.configFile."zellij/config.kdl".text = ''
    theme "default"
    default_layout "default"
    ui {
       pane_frames {
           hide_session_name true
           rounded_corners true
       }
    }
    mouse_mode true
  '';
  xdg.configFile."theme-engine/templates/zellij.kdl".source = ../theme/templates/zellij.kdl;
}

@FILE zoxide.nix
_: {
  programs = {
    zoxide = {
      enable = true;
      enableZshIntegration = true;
      enableBashIntegration = true;
      enableFishIntegration = true;
      options = [
        "--cmd cd"
      ];
    };
  };
}

@FILE zsh.nix
{
  pkgs,
  config,
  lib,
  ...
}:
let
  variables = import ../../../hosts/variables.nix;
in
{
  programs.zsh = {
    enable = true;
    enableCompletion = true;
    autosuggestion.enable = true;
    syntaxHighlighting.enable = true;
    history = {
      ignoreDups = true;
      save = 10000;
      size = 10000;
      path = "${config.xdg.dataHome}/zsh/history";
    };
    plugins = [
      {
        name = "fzf-tab";
        src = pkgs.fetchFromGitHub {
          owner = "Aloxaf";
          repo = "fzf-tab";
          rev = "c2b4aa5ad2532cca91f23908ac7f00efb7ff09c9";
          sha256 = "sha256-gvZp8P3quOtcy1Xtt1LAW1cfZ/zCtnAmnWqcwrKel6w=";
        };
      }
    ];
    initContent = ''
      setopt CORRECT
      export FZF_DEFAULT_OPTS=" \
        --color=bg+:#${config.lib.stylix.colors.base01 or "2e3440"},bg:#${
          config.lib.stylix.colors.base00 or "2e3440"
        },spinner:#${config.lib.stylix.colors.base06 or "8be9fd"},hl:#${
          config.lib.stylix.colors.base08 or "ff5555"
        } \
        --color=fg:#${config.lib.stylix.colors.base05 or "e5e9f0"},header:#${
          config.lib.stylix.colors.base08 or "ff5555"
        },info:#${config.lib.stylix.colors.base0E or "b48ead"},pointer:#${
          config.lib.stylix.colors.base06 or "8be9fd"
        } \
        --color=marker:#${config.lib.stylix.colors.base06 or "8be9fd"},fg+:#${
          config.lib.stylix.colors.base05 or "e5e9f0"
        },prompt:#${config.lib.stylix.colors.base0E or "b48ead"},hl+:#${
          config.lib.stylix.colors.base08 or "ff5555"
        }"
      zstyle ':completion:*' list-colors ''${(s.:.)LS_COLORS}
      zstyle ':fzf-tab:complete:cd:*' fzf-preview 'ls --color $realpath'
      zstyle ':fzf-tab:complete:__zoxide_z:*' fzf-preview 'ls --color $realpath'
      zstyle ':completion:*' matcher-list 'm:{a-z}={A-Za-z}'
      zstyle ':completion:*' list-colors "''${(s.:.)LS_COLORS}"
      zstyle ':completion:*' menu no
      zstyle ':fzf-tab:complete:*:*' fzf-preview 'less ''${(Q)realpath}'
      zstyle ':fzf-tab:complete:*:*' fzf-flags --height=40%
      bindkey -e # Emacs mode (standard)
      bindkey "^[[1;5C" forward-word
      bindkey "^[[1;5D" backward-word
      autoload -U up-line-or-beginning-search
      autoload -U down-line-or-beginning-search
      zle -N up-line-or-beginning-search
      zle -N down-line-or-beginning-search
      bindkey "^[[A" up-line-or-beginning-search
      bindkey "^[[B" down-line-or-beginning-search
      eval "$(zoxide init zsh)"
      eval "$(starship init zsh)"
    '';
    shellAliases = {
      c = "clear";
      man = "batman";
      ls = "eza --icons";
      ll = "eza -l --icons --group-directories-first";
      la = "eza -la --icons --group-directories-first";
      cat = "bat";
      grep = "rg";
      find = "fd";
      ze = "zeditor";
      rebuild = "sudo nixos-rebuild switch --flake ~/Lis-os";
      home = "home-manager switch --flake ~/Lis-os";
      Lis = "cd ~/Lis-os";
      lis = "cd ~/Lis-os";
      ast = "(cd ~/Lis-os/modules/home/desktop/astal && git add . && nix build .#lis-bar && (pkill -f 'lis-bar/main.js' || true) && ~/Lis-os/modules/home/desktop/astal/result/bin/lis-bar &)";
    };
  };
}

@DIR modules/home/scripts
@FILE default.nix
{
  imports = [
    ./llm-tools.nix
    ./nix-inspect.nix
    ./system-tools.nix
  ];
}

@FILE llm-tools.nix
{ pkgs, ... }:
let
  blackListRegex = "\\.git/|node_modules/|flake\\.lock|result|\\.png$|\\.jpg$|\\.jpeg$|\\.webp$|\\.ico$|\\.appimage$|\\.txt$|LICENSE|ags\\.bak/|\\.bak$|\\.DS_Store|zed\\.nix$";
  leanBlackListRegex = "${blackListRegex}|desktop/astal|noctalia-debug|sessions/|\\.md$|\\.tsx$|\\.ts$|\\.js$|\\.css$|\\.scss$|\\.json$|bundle\\.js|package\\.json|tsconfig|astal_legacy";
  cleanerSed = "sed '/^[[:space:]]*#/d; /^[[:space:]]*\\/\\//d; /^[[:space:]]*$/d; s/[[:space:]]*$//'";
  mkRawDump =
    {
      name,
      scopeName,
      filterGreps ? [ ],
    }:
    pkgs.writeShellScriptBin name ''
      set -euo pipefail
      FINAL_OUTPUT="Lis-os-${scopeName}.txt"
      REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo ".")
      cd "$REPO_ROOT" || exit 1
      echo "🤖 Generating ${scopeName} Context (TXT Mode)..."
      FILES=$(git ls-files | grep -vE "${blackListRegex}")
      ${
        if filterGreps != [ ] then
          ''
            FILES=$(echo "$FILES" | grep -E "${builtins.concatStringsSep "|" filterGreps}")
          ''
        else
          ""
      }
      FILES=$(echo "$FILES" | sort)
      {
        echo "@META: ${scopeName} dump | Host: $HOSTNAME"
        echo ""
        if [ -f "CONTEXT.md" ]; then
          echo "@CONTEXT_START"
          cat "CONTEXT.md"
          echo "@CONTEXT_END"
          echo ""
        fi
        echo "@MAP_START"
        echo "$FILES"
        echo "@MAP_END"
        echo ""
      } > "$FINAL_OUTPUT"
      LAST_DIR=""
      echo "$FILES" | while read -r file; do
        [ -f "$file" ] || continue
        CONTENT=$(${cleanerSed} "$file")
        if [[ -n "$CONTENT" ]]; then
            CURRENT_DIR=$(dirname "$file")
            FILENAME=$(basename "$file")
            if [[ "$CURRENT_DIR" != "$LAST_DIR" ]]; then
                echo "@DIR $CURRENT_DIR" >> "$FINAL_OUTPUT"
                LAST_DIR="$CURRENT_DIR"
            fi
            echo "@FILE $FILENAME" >> "$FINAL_OUTPUT"
            echo "$CONTENT" >> "$FINAL_OUTPUT"
            echo "" >> "$FINAL_OUTPUT"
            echo -n "."
        fi
      done
      echo ""
      BYTES=$(wc -c < "$FINAL_OUTPUT")
      TOKENS=$((BYTES / 3))
      echo "✅ ${scopeName} Dump: $REPO_ROOT/$FINAL_OUTPUT"
      echo "📊 Size: $(($BYTES / 1024)) KB (~$TOKENS Tokens)"
    '';
in
{
  home.packages = [
    pkgs.git
    (mkRawDump {
      name = "os-dump";
      scopeName = "full";
      filterGreps = [ ];
    })
    (mkRawDump {
      name = "rice-dump";
      scopeName = "rice";
      filterGreps = [
        "^flake\\.nix$"
        "modules/home/desktop/"
        "modules/home/theme/"
        "\\.css$"
        "\\.scss$"
        "\\.rasi$"
      ];
    })
    (mkRawDump {
      name = "home-dump";
      scopeName = "home";
      filterGreps = [
        "^flake\\.nix$"
        "modules/home/"
      ];
    })
    (mkRawDump {
      name = "core-dump";
      scopeName = "core";
      filterGreps = [
        "^flake\\.nix$"
        "modules/core/"
        "hosts/"
      ];
    })
    (pkgs.writeShellScriptBin "lean-dump" ''
      set -euo pipefail
      FINAL_OUTPUT="Lis-os-lean.txt"
      REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo ".")
      cd "$REPO_ROOT" || exit 1
      echo "🤖 Generating LEAN NixOS Config Dump..."
      LEAN_BLACKLIST="${leanBlackListRegex}"
      FILES=$(git ls-files | grep -vE "$LEAN_BLACKLIST" | sort)
      if [ -z "$FILES" ]; then
        echo "❌ No files found after filtering."
        exit 1
      fi
      FILE_COUNT=$(echo "$FILES" | wc -l)
      echo "📁 Found $FILE_COUNT files (after lean filtering)"
      {
        echo "@META: LEAN NixOS Config | Host: $HOSTNAME"
        echo "@PURPOSE: Portable config reference for Arch/dcli migration"
        echo ""
        if [ -f "janitor/GEMINI.md" ]; then
          echo "@GEMINI_START"
          cat "janitor/GEMINI.md"
          echo "@GEMINI_END"
          echo ""
        fi
        echo "@MAP_START"
        echo "$FILES"
        echo "@MAP_END"
        echo ""
      } > "$FINAL_OUTPUT"
      LAST_DIR=""
      echo "$FILES" | while read -r file; do
        [ -f "$file" ] || continue
        CONTENT=$(${cleanerSed} "$file" 2>/dev/null || echo "")
        if [[ -n "$CONTENT" ]]; then
          CURRENT_DIR=$(dirname "$file")
          FILENAME=$(basename "$file")
          if [[ "$CURRENT_DIR" != "$LAST_DIR" ]]; then
            echo "@DIR $CURRENT_DIR" >> "$FINAL_OUTPUT"
            LAST_DIR="$CURRENT_DIR"
          fi
          echo "@FILE $FILENAME" >> "$FINAL_OUTPUT"
          echo "$CONTENT" >> "$FINAL_OUTPUT"
          echo "" >> "$FINAL_OUTPUT"
          echo -n "."
        fi
      done
      echo ""
      BYTES=$(wc -c < "$FINAL_OUTPUT")
      TOKENS=$((BYTES / 3))
      echo "✅ Lean Dump: $REPO_ROOT/$FINAL_OUTPUT"
      echo "📊 Size: $(($BYTES / 1024)) KB (~$TOKENS Tokens)"
    '')
    (pkgs.writeShellScriptBin "path-dump" ''
            set -euo pipefail
            if [ $# -eq 0 ]; then
              echo "Usage: path-dump <path1> [path2] ..."
              echo "Example: path-dump modules/home/desktop/astal janitor"
              exit 1
            fi
            if git rev-parse --git-dir > /dev/null 2>&1; then
              REPO_ROOT=$(git rev-parse --show-toplevel)
            else
              REPO_ROOT="."
            fi
            cd "$REPO_ROOT" || exit 1
            ALL_FILES=""
            SAFE_NAME_PARTS=""
            for TARGET_PATH in "$@"; do
                TARGET_PATH="''${TARGET_PATH%/}"
                if [ ! -e "$TARGET_PATH" ]; then
                   echo "⚠️ Warning: Path not found: $TARGET_PATH"
                   continue
                fi
                PART_NAME=''${TARGET_PATH//\//-}
                SAFE_NAME_PARTS="''${SAFE_NAME_PARTS}-''${PART_NAME}"
                echo "🔍 Scanning: $TARGET_PATH"
                if [ -f "$TARGET_PATH" ]; then
                   FOUND="$TARGET_PATH"
                else
                   if git rev-parse --git-dir > /dev/null 2>&1; then
                     FOUND=$(git ls-files -- "$TARGET_PATH" 2>/dev/null || git ls-files | grep "^''${TARGET_PATH}/" || echo "")
                   else
                     FOUND=$(find "$TARGET_PATH" -type f 2>/dev/null | sed "s|^$REPO_ROOT/||" || echo "")
                   fi
                fi
                if [ -n "$FOUND" ]; then
                   ALL_FILES="''${ALL_FILES}
      ''${FOUND}"
                fi
            done
            FILES=$(echo "$ALL_FILES" | grep -v "^$" | sort | uniq)
            BLACK_LIST_REGEX="${blackListRegex}"
            FILES=$(echo "$FILES" | grep -vE "$BLACK_LIST_REGEX" || echo "")
            if [ -z "$FILES" ]; then
              echo "❌ No files found in specified paths."
              exit 1
            fi
            FINAL_OUTPUT="Lis-os-dump''${SAFE_NAME_PARTS}.txt"
            echo "🤖 Generating dump..."
            {
              echo "@META: Multi-Path Dump | Host: $HOSTNAME"
              echo "@PATHS: $*"
              echo ""
              if [ -f "janitor/GEMINI.md" ]; then
                 echo "found GEMINI.md, injecting..." >&2
                 echo "@GEMINI_START"
                 cat "janitor/GEMINI.md"
                 echo "@GEMINI_END"
                 echo ""
              fi
              if [ -f "CONTEXT.md" ]; then
                echo "@CONTEXT_START"
                cat "CONTEXT.md"
                echo "@CONTEXT_END"
                echo ""
              fi
              echo "@MAP_START"
              echo "$FILES"
              echo "@MAP_END"
              echo ""
            } > "$FINAL_OUTPUT"
            LAST_DIR=""
            echo "$FILES" | while read -r file; do
              [ -f "$file" ] || continue
              LINES=$(wc -l < "$file")
              CURRENT_DIR=$(dirname "$file")
              FILENAME=$(basename "$file")
              if [[ "$CURRENT_DIR" != "$LAST_DIR" ]]; then
                  echo "@DIR $CURRENT_DIR" >> "$FINAL_OUTPUT"
                  LAST_DIR="$CURRENT_DIR"
              fi
              echo "@FILE $FILENAME" >> "$FINAL_OUTPUT"
              if [ "$LINES" -gt 1000 ]; then
                   echo "[IGNORED: File too large ($LINES lines). Path: $file]" >> "$FINAL_OUTPUT"
                   echo "" >> "$FINAL_OUTPUT"
                   echo -n "S" # Skip indicator
              else
                   CONTENT=$(${cleanerSed} "$file" 2>/dev/null || echo "")
                   if [[ -n "$CONTENT" ]]; then
                     echo "$CONTENT" >> "$FINAL_OUTPUT"
                     echo "" >> "$FINAL_OUTPUT"
                     echo -n "."
                   fi
              fi
            done
            echo ""
            BYTES=$(wc -c < "$FINAL_OUTPUT")
            TOKENS=$((BYTES / 3))
            echo "✅ Dump Created: $REPO_ROOT/$FINAL_OUTPUT"
            echo "📊 Size: $(($BYTES / 1024)) KB (~$TOKENS Tokens)"
    '')
  ];
}

@FILE nix-inspect.nix
{ pkgs, ... }:
{
  home.packages = [
    (pkgs.writeScriptBin "nix-inspect" ''
      import os
      import re
      import sys
      import json
      import subprocess
      import time
      from rich.console import Console
      from rich.tree import Tree
      from rich.panel import Panel
      from rich.table import Table
      from rich.markdown import Markdown
      from rich.syntax import Syntax
      from rich.prompt import Prompt, Confirm
      ROOT_DIR = os.path.expanduser("~/Lis-os")
      CONSOLE = Console()
      class Analyzer:
          def __init__(self, root):
              self.root = root
              self.files = {} # path -> content
              self.nix_files = []
              self.other_files = []
              self.scan_files()
          def scan_files(self):
              for root, _, files in os.walk(self.root):
                  if "result" in root or ".git" in root: continue
                  for f in files:
                      path = os.path.join(root, f)
                      if f.endswith(".nix"):
                          self.nix_files.append(path)
                          with open(path, "r", encoding="utf-8", errors="ignore") as fd:
                              self.files[path] = fd.read()
                      elif f.endswith((".css", ".js", ".ts", ".tsx", ".kdl", ".toml", ".yuck", ".xml")):
                           self.other_files.append(path)
                           with open(path, "r", encoding="utf-8", errors="ignore") as fd:
                              self.files[path] = fd.read()
          def parse_packages(self):
              """Extracts explicitly installed packages vs program configurations."""
              installed = {} # name -> [files_where_defined]
              configured = {} # name -> [files_where_enabled]
              pkg_pattern = re.compile(r'home\.packages\s*=\s*(?:with\s+pkgs;\s*)?\[(.*?)\]', re.DOTALL)
              prog_pattern = re.compile(r'programs\.([a-zA-Z0-9_\-]+)\s*=\s*{')
              svc_pattern = re.compile(r'services\.([a-zA-Z0-9_\-]+)\s*=\s*{')
              valid_package_name_pattern = re.compile(r'^[a-zA-Z0-9\-\._]+$')
              ignore_keywords = {
                  "pkgs", "with", "inherit", "let", "in", "mkIf", "lib", "callPackage",
                  "writeShellScriptBin", "writeScriptBin", "stdenv", "buildInputs", "nativeBuildInputs",
                  "echo", "exit", "if", "then", "else", "fi", "for", "do", "done", "case", "esac",
                  "grep", "sed", "awk", "cat", "mkdir", "rm", "touch", "find", "true", "false",
                  "glib", "gapplication", "action", "toggle-window", "return", "wait"
              }
              for path in self.nix_files:
                  content = self.files[path]
                  rel_path = os.path.relpath(path, self.root)
                  for match in pkg_pattern.findall(content):
                      clean = re.sub(r'#.*', "", match)
                      clean = re.sub(r"'''[\s\S]*?'''", "", clean)
                      clean = re.sub(r'"[^"]*"', "", clean)
                      for t in clean.split():
                          t = t.strip()
                          if len(t) < 2: continue
                          if not valid_package_name_pattern.fullmatch(t): continue
                          if t in ignore_keywords: continue
                          if "/" in t: continue
                          if "(" in t or ")" in t: continue
                          if t not in installed: installed[t] = []
                          installed[t].append(rel_path)
                  for match in prog_pattern.findall(content):
                      if match not in configured: configured[match] = []
                      configured[match].append(rel_path)
                  for match in svc_pattern.findall(content):
                      if match not in configured: configured[match] = []
                      configured[match].append(rel_path)
              return installed, configured
          def analyze_duplication(self):
              installed, configured = self.parse_packages()
              redundant = []
              implicit = []
              ghosts = []
              packages_nix_content = ""
              for p, c in self.files.items():
                  if p.endswith("modules/home/packages.nix"):
                      packages_nix_content = c
                      break
              for prog, config_files in configured.items():
                  if prog in installed:
                      redundant.append({
                          "name": prog,
                          "installed_in": installed[prog],
                          "configured_in": config_files
                      })
                  else:
                      if prog in packages_nix_content:
                          implicit.append({
                             "name": prog,
                             "file": config_files[0]
                          })
                      else:
                          ghosts.append({
                              "name": prog,
                              "file": config_files[0]
                          })
              return redundant, implicit, ghosts, installed, configured
      class Dashboard:
          def __init__(self):
              self.analyzer = Analyzer(ROOT_DIR)
          def clear(self):
              CONSOLE.clear()
              CONSOLE.print(Panel.fit("[bold magenta]Lis-OS Command Center[/]", border_style="magenta"))
          def show_tree(self):
              """Full Nix Dependency Tree"""
              visited = set()
              def add_node(path, node):
                  path = os.path.realpath(path)
                  if path in visited: return
                  visited.add(path)
                  if path not in self.analyzer.files: return
                  if os.path.basename(path) == "nix-inspect.nix": return
                  content = self.analyzer.files[path]
                  imports = re.findall(r'(\./[\w\-\./]+|\.\./[\w\-\./]+)', content)
                  for imp in imports:
                      base_dir = os.path.dirname(path)
                      full_path = os.path.normpath(os.path.join(base_dir, imp))
                      is_dir_import = False
                      if os.path.isdir(full_path):
                          is_dir_import = True
                          full_path = os.path.join(full_path, "default.nix")
                      if os.path.exists(full_path):
                          filename = os.path.basename(full_path)
                          if filename == "default.nix":
                              parent = os.path.basename(os.path.dirname(full_path))
                              label = f"{parent}/default.nix"
                          else:
                              label = filename
                          sub = node.add(f"[green]{label}[/]")
                          add_node(full_path, sub)
                      else:
                          if is_dir_import:
                              org_dir = os.path.dirname(full_path) # strip default.nix
                              node.add(f"[dim yellow]📂 {os.path.basename(org_dir)}/ (Dynamic/No default.nix)[/dim]")
                          else:
                              node.add(f"[red]BROKEN: {imp}[/] [dim]({full_path})[/]")
              root_node = Tree(f"[bold blue]{ROOT_DIR}[/]")
              entry_point = os.path.join(ROOT_DIR, "hosts/default.nix")
              if os.path.exists(entry_point):
                  node = root_node.add(f"[bold cyan]🚀 hosts/default.nix[/]")
                  add_node(entry_point, node)
                  CONSOLE.print(root_node)
              else:
                  CONSOLE.print("[red]Could not find hosts/default.nix[/]")
          def visualize_folder(self):
              """Visualizes folder structure with Import Dependencies"""
              target_name = Prompt.ask("Enter folder name to visualize (e.g. astal)")
              target_path = None
              for root, dirs, _ in os.walk(ROOT_DIR):
                  if target_name in dirs:
                      target_path = os.path.join(root, target_name)
                      break
              if not target_path:
                  CONSOLE.print(f"[red]Folder '{target_name}' not found.[/]")
                  return
              tree = Tree(f"[bold yellow]📂 {target_name}[/] [dim]({target_path})[/]")
              file_nodes = {}
              def add_file_node(fpath, parent_node):
                  if fpath in file_nodes: return file_nodes[fpath]
                  fname = os.path.basename(fpath)
                  if fname.endswith((".tsx", ".ts")): icon = "📘"
                  elif fname.endswith(".js"): icon = "🟨"
                  elif fname.endswith(".css"): icon = "🎨"
                  else: icon = "📄"
                  node = parent_node.add(f"{icon} {fname}")
                  file_nodes[fpath] = node # Store node reference
                  if fpath in self.analyzer.files and fpath.endswith((".js", ".ts", ".tsx", ".css")):
                      content = self.analyzer.files[fpath]
                      imports = re.findall(r'(?:from\s+[\'\"]|import\s+[\'\"])(?P<path>\.?\./[^"\'\s]+)[\'\"]', content)
                      for imp in imports:
                          base = os.path.dirname(fpath)
                          resolved = os.path.normpath(os.path.join(base, imp))
                          found = False
                          if os.path.exists(resolved) and os.path.isfile(resolved):
                              found = True
                          else:
                              for ext in ["", ".ts", ".tsx", ".js", ".css"]: # "" for index.js/ts or direct file
                                  if os.path.exists(resolved + ext) and os.path.isfile(resolved + ext):
                                      resolved += ext
                                      found = True
                                      break
                          if found:
                              add_file_node(resolved, node)
                          elif not re.search(r'\.(png|svg|jpg|jpeg|gif)$', imp): # Ignore common asset imports
                              node.add(f"[dim]↳ {imp} (external)[/dim]")
                  return node
              for root, dirs, files in os.walk(target_path):
                  dirs.sort()
                  files.sort()
                  for f in files:
                      full_file_path = os.path.join(root, f)
                      add_file_node(full_file_path, tree) # Add all files directly under the main tree for now
              CONSOLE.print(tree)
          def audit_packages(self):
              """Consolidated Audit: Redundant, Implicit, and Ghost packages"""
              redundant, implicit, ghosts, _, _ = self.analyzer.analyze_duplication()
              CONSOLE.print(Panel("[bold white]🛡️ Package Audit Report[/]", expand=False))
              if redundant:
                  table = Table(title="⚠️  Redundant Packages (Remove from List)", show_header=True, header_style="bold red", width=100)
                  table.add_column("Program", style="white")
                  table.add_column("Installed via List", style="yellow")
                  table.add_column("Managed via Config", style="cyan")
                  for d in redundant:
                      table.add_row(d["name"], "\n".join(d["installed_in"]), "\n".join(d["configured_in"]))
                  CONSOLE.print(table)
              else:
                  CONSOLE.print("[bold green]✨ No redundant packages found![/]")
              CONSOLE.print("") # Spacing
              if ghosts:
                  table = Table(title="👻 Ghost Packages (Hidden Configs)", show_header=True, header_style="bold white", width=100)
                  table.add_column("Program Name", style="bold green")
                  table.add_column("Configured In", style="dim")
                  table.caption = "These are configured but NOT unknown to your packages.nix mental map."
                  for g in ghosts:
                      table.add_row(g["name"], g["file"])
                  CONSOLE.print(table)
              else:
                  CONSOLE.print("[bold green]✨ No ghost packages found! All configs are mapped.[/]")
              CONSOLE.print("") # Spacing
              if implicit:
                  CONSOLE.print("[bold]✅ Validated Configs (Mentally Mapped):[/bold]")
                  grid = Table.grid(padding=(0, 2))
                  grid.add_column(style="dim")
                  grid.add_column(style="dim")
                  half = (len(implicit) + 1) // 2
                  for i in range(half):
                      item1 = implicit[i]
                      col1 = f"- {item1['name']} ({os.path.basename(item1['file'])})"
                      if i + half < len(implicit):
                          item2 = implicit[i+half]
                          col2 = f"- {item2['name']} ({os.path.basename(item2['file'])})"
                      else:
                          col2 = ""
                      grid.add_row(col1, col2)
                  CONSOLE.print(grid)
          def show_install_map(self):
              """The Mega Map of every installed package + Configured Programs"""
              _, _, _, installed, configured = self.analyzer.analyze_duplication()
              all_pkgs = set(installed.keys()) | set(configured.keys())
              sorted_pkgs = sorted(list(all_pkgs))
              table = Table(title=f"📦 Universal Install Map ({len(sorted_pkgs)} items)", show_header=True, header_style="bold blue")
              table.add_column("Package / Program", style="bold white")
              table.add_column("Source / Definition", style="green")
              for p in sorted_pkgs:
                  sources = []
                  if p in installed:
                      sources.extend([f"List ({os.path.basename(f)})" for f in installed[p]])
                  if p in configured:
                      sources.extend([f"Config (programs.{p} in {os.path.basename(f)})" for f in configured[p]])
                  table.add_row(p, ", ".join(sources))
              CONSOLE.print(table)
          def format_size(self, bytes_val):
              for unit in ['B', 'KiB', 'MiB', 'GiB']:
                  if bytes_val < 1024.0:
                      return f"{bytes_val:.1f} {unit}"
                  bytes_val /= 1024.0
              return f"{bytes_val:.1f} TiB"
          def show_disk_usage(self):
              CONSOLE.print(Panel("[bold cyan]💾 System Disk Usage (Top 20)[/]", expand=False))
              CONSOLE.print("[dim italic]Querying Nix store (this may take a few seconds)...[/]")
              try:
                  cmd = ["nix", "path-info", "-r", "-s", "-S", "--json", "/run/current-system"]
                  result = subprocess.run(cmd, capture_output=True, text=True)
                  if result.returncode != 0:
                      CONSOLE.print(f"[red]Nix command failed:[/red] {result.stderr}")
                      return
                  data = json.loads(result.stdout)
                  packages = []
                  for path, info in data.items():
                      name = os.path.basename(path)
                      if len(name) > 33: name = name[33:]
                      packages.append({
                          "name": name,
                          "self": info["narSize"],
                          "closure": info["closureSize"]
                      })
                  packages.sort(key=lambda x: x["self"], reverse=True)
                  table_self = Table(title="Top 20 'Fat' Packages (Individual Size)", header_style="bold yellow")
                  table_self.add_column("Package", style="white")
                  table_self.add_column("Size", justify="right", style="yellow")
                  for p in packages[:20]:
                      table_self.add_row(p["name"], self.format_size(p["self"]))
                  packages.sort(key=lambda x: x["closure"], reverse=True)
                  table_closure = Table(title="Top 20 Heaviest Families (Total Dependencies)", header_style="bold magenta")
                  table_closure.add_column("Package", style="white")
                  table_closure.add_column("Size", justify="right", style="magenta")
                  unique_closures = set()
                  count = 0
                  for p in packages:
                      if count >= 20: break
                      if p["closure"] in unique_closures: continue
                      unique_closures.add(p["closure"])
                      table_closure.add_row(p["name"], self.format_size(p["closure"]))
                      count += 1
                  from rich.columns import Columns
                  CONSOLE.print(Columns([table_self, table_closure]))
              except Exception as e:
                  CONSOLE.print(f"[red]Error analyzing disk usage:[/red] {e}")
          def show_code_stats(self):
              """Top 20 Files by LOC (with Char Count)"""
              target_name = Prompt.ask("Enter folder name to analyze (default: Lis-os)", default="root")
              target_path = None
              if target_name == "root":
                  target_path = ROOT_DIR
              elif os.path.isabs(target_name) and os.path.exists(target_name):
                  target_path = target_name
              else:
                   for root, dirs, _ in os.walk(ROOT_DIR):
                       if target_name in dirs:
                           target_path = os.path.join(root, target_name)
                           break
              if not target_path or not os.path.exists(target_path):
                  CONSOLE.print(f"[red]Folder '{target_name}' not found.[/]")
                  return
              CONSOLE.print(f"[dim]Scanning {target_path}...[/dim]")
              stats = []
              for root, _, files in os.walk(target_path):
                  if "node_modules" in root or ".git" in root or "result" in root: continue
                  for f in files:
                      path = os.path.join(root, f)
                      try:
                          with open(path, "r", encoding="utf-8", errors="ignore") as fd:
                              content = fd.read()
                              lines = len(content.splitlines())
                              chars = len(content)
                              stats.append({
                                  "name": f,
                                  "rel_path": os.path.relpath(path, target_path),
                                  "lines": lines,
                                  "chars": chars
                              })
                      except Exception:
                          continue
              stats.sort(key=lambda x: x["lines"], reverse=True)
              top_files = stats[:20]
              table = Table(title=f"Top 20 Largest Files ({os.path.basename(target_path)})", header_style="bold blue")
              table.add_column("#", style="dim", justify="right", width=4)
              table.add_column("File", style="white")
              table.add_column("LOC", justify="right", style="cyan")
              table.add_column("Chars", justify="right", style="magenta")
              for idx, item in enumerate(top_files, 1):
                  path_display = item["rel_path"]
                  if len(path_display) > 50: path_display = "..." + path_display[-47:]
                  table.add_row(
                      str(idx),
                      path_display,
                      f"{item['lines']:,}",
                      f"{item['chars']:,}"
                  )
              CONSOLE.print(table)
          def analyze_folder_weights(self):
              """Recursive Folder Weight Analysis"""
              target_name = Prompt.ask("Enter folder name to analyze (default: Lis-os)", default="root")
              target_path = None
              if target_name == "root":
                  target_path = ROOT_DIR
              elif os.path.isabs(target_name) and os.path.exists(target_name):
                  target_path = target_name
              else:
                   for root, dirs, _ in os.walk(ROOT_DIR):
                       if target_name in dirs:
                           target_path = os.path.join(root, target_name)
                           break
              if not target_path or not os.path.exists(target_path):
                  CONSOLE.print(f"[red]Folder '{target_name}' not found.[/]")
                  return
              CONSOLE.print(f"[dim]Calculating folder weights for: {target_path}... (Use Ctrl+C to stop)[/dim]")
              folder_stats = {}
              for root, dirs, files in os.walk(target_path):
                  if ".git" in root or "result" in root: continue
                  current_lines = 0
                  current_chars = 0
                  for f in files:
                      path = os.path.join(root, f)
                      try:
                          with open(path, "r", encoding="utf-8", errors="ignore") as fd:
                              content = fd.read()
                              current_lines += len(content.splitlines())
                              current_chars += len(content)
                      except Exception:
                          continue
                  temp_path = root
                  while True:
                      if temp_path not in folder_stats:
                          folder_stats[temp_path] = {"lines": 0, "chars": 0}
                      folder_stats[temp_path]["lines"] += current_lines
                      folder_stats[temp_path]["chars"] += current_chars
                      if temp_path == target_path:
                          break
                      parent = os.path.dirname(temp_path)
                      if len(parent) < len(target_path): # Should not happen if walking inside target
                          break
                      temp_path = parent
              sorted_folders = []
              for p, s in folder_stats.items():
                  sorted_folders.append({
                      "path": p,
                      "rel_path": os.path.relpath(p, target_path),
                      "lines": s["lines"],
                      "chars": s["chars"]
                  })
              sorted_folders.sort(key=lambda x: x["chars"], reverse=True)
              table = Table(title=f"Top 20 Heaviest Folders ({os.path.basename(target_path)})", header_style="bold red")
              table.add_column("#", style="dim", justify="right", width=4)
              table.add_column("Folder Path", style="white")
              table.add_column("Total LOC", justify="right", style="cyan")
              table.add_column("Total Chars", justify="right", style="magenta")
              for idx, item in enumerate(sorted_folders[:20], 1):
                  path_display = item["rel_path"]
                  if path_display == ".": path_display = "[ROOT]"
                  if len(path_display) > 50: path_display = "..." + path_display[-47:]
                  table.add_row(
                      str(idx),
                      path_display,
                      f"{item['lines']:,}",
                      f"{item['chars']:,}"
                  )
              CONSOLE.print(table)
          def run(self):
              next_choice = None # Stores a choice if user types it at the prompt
              try:
                  while True:
                      self.clear()
                      CONSOLE.print("[bold]Available Commands:[/bold]")
                      CONSOLE.print(" [1] [cyan]Tree View[/]      (Nix Dependencies)")
                      CONSOLE.print(" [2] [yellow]Package Audit[/]  (Redundant & Ghost Checks)")
                      CONSOLE.print(" [3] [blue]Install Map[/]    (Universal Map)")
                      CONSOLE.print(" [4] [red]Disk Usage[/]     (Analyze sizes)")
                      CONSOLE.print(" [5] [magenta]Vis. Folder[/]    (Inspect non-nix folders)")
                      CONSOLE.print(" [6] [green]Code Stats[/]     (LOC & Char counts)")
                      CONSOLE.print(" [7] [red]Folder Weights[/] (Recursive Size)")
                      CONSOLE.print(" [q] Quit")
                      if next_choice:
                          choice = next_choice
                          next_choice = None # Reset after using
                      else:
                          choice = Prompt.ask("\nSelect", choices=["1", "2", "3", "4", "5", "6", "7", "q"], default="1")
                      if choice == "q": break
                      elif choice == "1": self.show_tree()
                      elif choice == "2": self.audit_packages()
                      elif choice == "3": self.show_install_map()
                      elif choice == "4": self.show_disk_usage()
                      elif choice == "5": self.visualize_folder()
                      elif choice == "6": self.show_code_stats()
                      elif choice == "7": self.analyze_folder_weights()
                      res = Prompt.ask("\n[dim]Press Enter to continue or type number...[/dim]")
                      if res in ["1", "2", "3", "4", "5", "6", "7", "q"]:
                          next_choice = res
              except KeyboardInterrupt:
                  CONSOLE.print("\n[bold red]Exiting...[/bold red]")
                  sys.exit(0)
      if __name__ == "__main__":
          Dashboard().run()
    '')
  ];
}

@FILE system-tools.nix
{ pkgs, ... }:
let
  red = "\\033[0;31m";
  green = "\\033[0;32m";
  blue = "\\033[0;34m";
  reset = "\\033[0m";
  configDir = "~/Lis-os";
in
{
  home.packages = [
    (pkgs.writeShellScriptBin "fr" ''
      set -e
      echo -e "${blue}📦 Staging all changes...${reset}"
      cd ${configDir} || exit
      git add .
      echo -e "${blue}🔍 Checking for backup files...${reset}"
      if backups=$(find "$HOME/.config" -name "*.backup" -type f 2>/dev/null); then
          if [ -n "$backups" ]; then
              echo -e "${red}⚠️  Found backup files that might cause conflicts:${reset}"
              echo "$backups"
              echo
              read -p "🗑️  Delete these files? [y/N] " response
              if [[ "$response" =~ ^[yY]$ ]]; then
                  echo "$backups" | xargs rm -v
                  echo -e "${green}✅ Backups deleted.${reset}"
              else
                  echo -e "${blue}ℹ️  Skipping deletion. Rebuild might fail.${reset}"
              fi
          fi
      fi
      echo -e "${blue}🚀 Rebuilding NixOS...${reset}"
      NIX_CONFIG="warn-dirty = false" nh os switch .
      if command -v niri &> /dev/null; then
        echo -e "${blue}🔍 Validating Niri...${reset}"
        niri validate || echo -e "${red}⚠️ Niri config issues detected${reset}"
      fi
    '')
    (pkgs.writeShellScriptBin "up-os" ''
      set -e
      echo -e "${blue}📦 Staging all changes...${reset}"
      cd ${configDir} || exit
      git add .
      echo -e "${blue}🔄 Fetching flake updates...${reset}"
      nix flake update
      git add flake.lock
      echo -e "${blue}🚀 Rebuilding System...${reset}"
      NIX_CONFIG="warn-dirty = false" nh os switch .
      echo -e "${green}🎉 System updated successfully!${reset}"
    '')
    (pkgs.writeShellScriptBin "test-os" ''
      set -e
      echo -e "${blue}🧪 STARTING TEST RUN (Ephemeral)...${reset}"
      cd ${configDir} || exit
      echo -e "${blue}🧹 Cleaning old backups...${reset}"
      find "$HOME/.config" -name "*.backup" -delete
      echo -e "${blue}📦 Staging changes...${reset}"
      git add .
      echo -e "${blue}🔨 Building and Activating Test Environment...${reset}"
      NIX_CONFIG="warn-dirty = false" nh os test .
      echo -e "${green}✅ Test Environment Active!${reset}"
      echo -e "${blue}ℹ️  NOTE: Changes are live but NOT permanent.${reset}"
      echo -e "${blue}ℹ️  Reboot your PC to discard these changes.${reset}"
    '')
    (pkgs.writeShellScriptBin "clean-os" ''
      echo -e "${blue}🧹 System Garbage Collection${reset}"
      read -p "Keep how many recent generations? (Recommended: 3-5): " keep_num
      if [[ ! "$keep_num" =~ ^[0-9]+$ ]]; then
          echo -e "${red}❌ Invalid number.${reset}"
          exit 1
      fi
      echo -e "${blue}🗑️  Deleting old generations...${reset}"
      nh clean all --keep "$keep_num"
      echo -e "${blue}🗜️  Optimizing Store (Deduplicating files)...${reset}"
      echo "This might take a while..."
      nix-store --optimise
      echo -e "${green}✨ System Cleaned & Optimized!${reset}"
    '')
    (pkgs.writeShellScriptBin "hist-os" ''
      nix profile history --profile /nix/var/nix/profiles/system
    '')
    (pkgs.writeShellScriptBin "debug-os" ''
      cd ${configDir} || exit
      git add .
      echo "🧪 Dry Run..."
      nixos-rebuild dry-build --flake . --show-trace --log-format internal-json -v |& ${pkgs.nix-output-monitor}/bin/nom --json
    '')
    (pkgs.writeShellScriptBin "logs-os" ''
      echo -e "${blue}🔍 System Error Logs (Last Boot)...${reset}"
      journalctl -p 3 -xb
    '')
    (pkgs.writeShellScriptBin "repair-os" ''
      echo -e "${red}🔧 REPAIRING NIX STORE...${reset}"
      echo "This requires sudo and may take time."
      sudo nix-store --verify --check-contents --repair
    '')
  ];
}

@DIR modules/home/theme/core
@FILE color.py
"""
Core Color Utilities
Native coloraide implementation (no subprocess to `pastel`).
"""
from typing import Tuple
from coloraide import Color
def get_lch(hex_val: str) -> Tuple[float, float, float]:
    """
    Get L, C, H components using native coloraide.
    Returns Oklch values scaled to match legacy pastel output:
    - L: 0-100 (pastel scale)
    - C: 0-100 (approx, pastel scale)
    - H: 0-360 (degrees)
    """
    try:
        c = Color(hex_val).convert("oklch")
        l = c['lightness'] * 100
        chroma = c['chroma'] * 100  # Scale to roughly match pastel
        h = c['hue'] if c['hue'] is not None else 0.0
        return l, chroma, h
    except Exception:
        return 0.0, 0.0, 0.0

@FILE extraction.py
"""
extraction.py — Color Science v2
Extracts perceptual anchor colors using Spectral Residual Saliency and Weighted K-Means.
Replaces the legacy histogram + frequency method.
"""
from dataclasses import dataclass
from typing import List, Dict, Tuple, Optional
import cv2
import numpy as np
from sklearn.cluster import KMeans
from coloraide import Color
@dataclass
class ExtractionConfig:
    downsample_size: int = 128
    k_clusters: int = 8
    saliency_threshold: float = 0.15
    ignore_extremes: bool = True  # Ignore near-black/white
class SaliencyExtractor:
    """Implements Hou & Zhang's Spectral Residual Saliency detection."""
    def __init__(self, config: ExtractionConfig):
        self.config = config
    def get_saliency_map(self, img: np.ndarray) -> np.ndarray:
        """
        Compute saliency map from image.
        Args:
            img: Float32 RGB image (0-1 range) OR Uint8 RGB
        Returns:
            2D Float32 saliency map (0-1 range)
        """
        if img.dtype != np.uint8:
            src = (img * 255).astype(np.uint8)
        else:
            src = img
        if len(src.shape) == 3:
            gray = cv2.cvtColor(src, cv2.COLOR_RGB2GRAY)
        else:
            gray = src
        gray = cv2.resize(gray, (self.config.downsample_size, self.config.downsample_size))
        f = np.fft.fft2(gray)
        log_amplitude = np.log(np.abs(f) + 1e-9)
        phase = np.angle(f)
        avg_log = cv2.blur(log_amplitude, (3, 3))
        spectral_residual = log_amplitude - avg_log
        saliency = np.abs(np.fft.ifft2(np.exp(spectral_residual + 1j * phase)))
        saliency = saliency ** 2
        saliency = cv2.GaussianBlur(saliency, (9, 9), 2.5)
        min_val, max_val = saliency.min(), saliency.max()
        if max_val != min_val:
            saliency = (saliency - min_val) / (max_val - min_val)
        return saliency
class PerceptualExtractor:
    """Extracts palette using saliency-weighted K-Means in Oklab."""
    def __init__(self, config: ExtractionConfig = ExtractionConfig()):
        self.config = config
        self.saliency = SaliencyExtractor(config)
    def extract(self, image_source) -> Dict:
        """
        Extract anchor and palette from image.
        Args:
            image_source: File path (str) OR Numpy array (RGB or BGR)
        Returns:
            dict containing anchor, palette, weights
        """
        if isinstance(image_source, str):
            img_bgr = cv2.imread(image_source)
            if img_bgr is None:
                return {"anchor": "#000000", "palette": ["#000000"], "weights": [1.0]}
            img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
        else:
            if image_source.dtype == np.float32 or image_source.dtype == np.float64:
                img_rgb = (image_source * 255).astype(np.uint8)
            else:
                img_rgb = image_source
        weights_map = self.saliency.get_saliency_map(img_rgb)
        small_img = cv2.resize(img_rgb, (weights_map.shape[1], weights_map.shape[0]), interpolation=cv2.INTER_AREA)
        pixels_rgb = small_img.astype(np.float32) / 255.0
        pixels_flat = pixels_rgb.reshape(-1, 3)
        weights_flat = weights_map.reshape(-1)
        valid_mask = weights_flat > self.config.saliency_threshold
        if self.config.ignore_extremes:
            luma = 0.299 * pixels_flat[:, 0] + 0.587 * pixels_flat[:, 1] + 0.114 * pixels_flat[:, 2]
            extreme_mask = (luma > 0.05) & (luma < 0.97)
            valid_mask = valid_mask & extreme_mask
        if np.sum(valid_mask) < self.config.k_clusters:
            valid_mask = np.ones_like(weights_flat, dtype=bool)
        pixels_valid = pixels_flat[valid_mask]
        weights_valid = weights_flat[valid_mask]
        pixels_oklab = self._rgb_to_oklab_batch(pixels_valid)
        kmeans = KMeans(
            n_clusters=self.config.k_clusters,
            init='k-means++',
            n_init=3, # Lower n_init for speed, 3 is usually enough
            random_state=42
        )
        kmeans.fit(pixels_oklab, sample_weight=weights_valid)
        centers_oklab = kmeans.cluster_centers_
        labels = kmeans.labels_
        cluster_scores = np.zeros(self.config.k_clusters)
        for i in range(self.config.k_clusters):
            cluster_scores[i] = np.sum(weights_valid[labels == i])
        sorted_indices = np.argsort(cluster_scores)[::-1]
        sorted_centers = centers_oklab[sorted_indices]
        sorted_scores = cluster_scores[sorted_indices]
        palette_hex = [self._oklab_to_hex(c) for c in sorted_centers]
        return {
            "anchor": palette_hex[0],  # Most salient cluster
            "palette": palette_hex,    # All candidates
            "weights": sorted_scores.tolist()
        }
    def _rgb_to_oklab_batch(self, rgb_arr: np.ndarray) -> np.ndarray:
        """Batch convert RGB (0-1) to Oklab using coloraide."""
        oklab_arr = []
        for rgb in rgb_arr:
            c = Color('srgb', rgb)
            oklab = c.convert('oklab')
            oklab_arr.append([oklab['l'], oklab['a'], oklab['b']])
        return np.array(oklab_arr)
    def _oklab_to_hex(self, oklab_list: np.ndarray) -> str:
        """Convert single Oklab [l, a, b] to Hex string."""
        params = [float(x) for x in oklab_list]
        c = Color('oklab', params)
        if not c.in_gamut('srgb'):
            c.fit('srgb', method='lch-chroma')
        return c.convert('srgb').to_string(hex=True)
def extract_anchor(image_path: str, fallback_hex: str = None) -> str:
    """Drop-in replacement for the old function."""
    extractor = PerceptualExtractor()
    try:
        result = extractor.extract(image_path)
        return result["anchor"]
    except Exception as e:
        print(f"Extraction failed: {e}")
        return fallback_hex or "#000000"

@FILE generator.py
"""
generator.py — Color Science v2
Generates a harmonic palette from extracted colors using Matsuda's Harmonic Templates.
Replaces the legacy MoodGenerator and hardcoded poles.
"""
from dataclasses import dataclass, field
from typing import List, Tuple, Dict, Optional
import numpy as np
from coloraide import Color
@dataclass
class HarmonicSector:
    width: float   # Degrees
    offset: float  # Degrees from primary center
@dataclass
class HarmonicTemplate:
    name: str
    description: str
    sectors: List[HarmonicSector]
TEMPLATES = [
    HarmonicTemplate("i", "Identity",     [HarmonicSector(18.0, 0.0)]),
    HarmonicTemplate("V", "V-Shape",      [HarmonicSector(93.6, 0.0)]),
    HarmonicTemplate("L", "L-Shape",      [HarmonicSector(18.0, 0.0), HarmonicSector(79.2, 90.0)]),
    HarmonicTemplate("I", "Complementary",[HarmonicSector(18.0, 0.0), HarmonicSector(18.0, 180.0)]),
    HarmonicTemplate("T", "Triad",        [HarmonicSector(180.0, 0.0)]), # Simply loose half-circle
    HarmonicTemplate("Y", "Split Comp",   [HarmonicSector(93.6, 0.0), HarmonicSector(18.0, 180.0)]),
    HarmonicTemplate("X", "X-Shape",      [HarmonicSector(93.6, 0.0), HarmonicSector(93.6, 180.0)]),
]
@dataclass
class PaletteConfig:
    mood: str = "adaptive"
    dark_mode_l: float = 0.20       # Adjusted to match standard dark themes (VSCode/Dracula)
    light_mode_l: float = 0.96
    bg_chroma: float = 0.025
from core.solver import solve_contrast
class PaletteGenerator:
    """
    Fits harmonic templates to source colors and generates a full UI palette.
    """
    def __init__(self, config: PaletteConfig = PaletteConfig()):
        self.config = config
        self.templates = TEMPLATES
    def generate(self, anchor_hex: str, extracted_palette: List[str], weights: List[float]) -> Dict:
        """
        Main entry point.
        """
        anchor = Color(anchor_hex)
        hues = []
        valid_weights = []
        for hex_val, w in zip(extracted_palette, weights):
            c = Color(hex_val).convert("oklch")
            if c['c'] > 0.02:
                hues.append(c['h'])
                valid_weights.append(w)
        if not hues:
            best_template = self.templates[0]
            best_rotation = anchor.convert("oklch")['h']
        else:
            best_template, best_rotation = self._fit_template(hues, valid_weights)
        anchor_l = anchor.convert("oklch")['l']
        is_light_theme = anchor_l > 0.9
        bg_l = self.config.dark_mode_l
        bg_c = self.config.bg_chroma
        if self.config.mood == 'pastel':
            bg_l = 0.25 if not is_light_theme else 0.98
            bg_c = 0.04
        elif self.config.mood == 'deep':
            bg_l = 0.05
            bg_c = 0.02
        elif self.config.mood == 'vibrant':
            bg_c = 0.06
        if is_light_theme:
            bg_l = self.config.light_mode_l
        bg_color = Color("oklch", [bg_l, bg_c, anchor.convert("oklch")['h']])
        if not bg_color.in_gamut('srgb'):
            bg_color.fit('srgb')
        bg_hex = bg_color.to_string(hex=True)
        def solve(base_color: Color, min_ratio=4.5) -> str:
            c = base_color.convert("oklch")
            return solve_contrast(bg_hex, c['h'], c['c'], min_ratio=min_ratio)
        primary = Color(solve_contrast(bg_hex, anchor.convert("oklch")['h'], 0.14, min_ratio=3.0))
        anc_c = anchor.convert("oklch")['c']
        target_c = max(0.12, anc_c) # boost dull anchors slightly
        primary_hex = solve_contrast(bg_hex, anchor.convert("oklch")['h'], target_c, min_ratio=3.0)
        sec_base = self._derive_color_from_template(anchor, best_template, best_rotation, "secondary")
        sec_hex = solve_contrast(bg_hex, sec_base['h'], target_c, min_ratio=3.0)
        ter_base = self._derive_color_from_template(anchor, best_template, best_rotation, "tertiary")
        ter_hex = solve_contrast(bg_hex, ter_base['h'], target_c, min_ratio=3.0)
        err_base = self._harmonize_semantic("error", 29.0, best_template, best_rotation)
        err_hex = solve_contrast(bg_hex, err_base['h'], 0.15, min_ratio=3.0)
        warn_base = self._harmonize_semantic("warning", 85.0, best_template, best_rotation)
        warn_hex = solve_contrast(bg_hex, warn_base['h'], 0.15, min_ratio=3.0)
        succ_base = self._harmonize_semantic("success", 145.0, best_template, best_rotation)
        succ_hex = solve_contrast(bg_hex, succ_base['h'], 0.15, min_ratio=3.0)
        fg_hex = solve_contrast(bg_hex, anchor.convert("oklch")['h'], 0.02, min_ratio=7.0) # High contrast text
        return {
            "template": best_template.name,
            "rotation": round(best_rotation, 1),
            "colors": {
                "anchor": anchor_hex,
                "primary": primary_hex,
                "secondary": sec_hex,
                "tertiary": ter_hex,
                "error": err_hex,
                "warning": warn_hex,
                "success": succ_hex,
                "bg_base": bg_hex,
                "fg_base": fg_hex
            }
        }
    def _circular_dist(self, a, b):
        d = abs(a - b)
        return min(d, 360 - d)
    def _fit_template(self, hues: List[float], weights: List[float]) -> Tuple[HarmonicTemplate, float]:
        """Finds the template and rotation that minimizes exclusion cost."""
        best_t = self.templates[0]
        best_rot = 0.0
        min_cost = float('inf')
        hues = np.array(hues)
        weights = np.array(weights)
        for t in self.templates:
            for rot in range(0, 360, 5):
                cost = 0.0
                for h, w in zip(hues, weights):
                    dist_to_sector = 360.0
                    for s in t.sectors:
                        center = (rot + s.offset) % 360
                        d_center = self._circular_dist(h, center)
                        d_edge = max(0, d_center - (s.width / 2.0))
                        dist_to_sector = min(dist_to_sector, d_edge)
                    cost += dist_to_sector * w
                if cost < min_cost:
                    min_cost = cost
                    best_t = t
                    best_rot = rot
        return best_t, best_rot
    def _derive_color_from_template(self, origin: Color, tmpl: HarmonicTemplate, rot: float, role: str) -> Color:
        """
        Derives a color that fits the template.
        For Secondary: Picks a hue from a non-primary sector (if exists).
        """
        base = origin.convert("oklch")
        target_hue = base['h']
        if role == "secondary":
            if len(tmpl.sectors) > 1:
                s = tmpl.sectors[1]
                target_hue = (rot + s.offset) % 360
            else:
                target_hue = (base['h'] + 30) % 360
        elif role == "tertiary":
            if len(tmpl.sectors) > 2:
                s = tmpl.sectors[2]
                target_hue = (rot + s.offset) % 360
            elif len(tmpl.sectors) == 2:
                target_hue = (rot + tmpl.sectors[1].offset + 180) % 360
            else:
                target_hue = (base['h'] - 30) % 360
        return Color("oklch", [base['l'], base['c'], target_hue])
    def _harmonize_semantic(self, name: str, core_hue: float, tmpl: HarmonicTemplate, rot: float) -> Color:
        """
        Harmonizes a semantic color (e.g. Red) with the template.
        If the core hue is inside the template, strictly use it.
        If not, check if we can shift it slightly to fit.
        If not, stick to core hue (Safety first!) but maybe desaturate.
        """
        fits = False
        for s in tmpl.sectors:
            center = (rot + s.offset) % 360
            if self._circular_dist(core_hue, center) <= (s.width / 2.0):
                fits = True
                break
        final_hue = core_hue
        if not fits:
            pass
        return Color("oklch", [0.65, 0.15, final_hue])

@FILE icons.py
"""
Icon Tinting Module
Replaces icon-tinter.sh
"""
import os
import json
import shutil
import subprocess
from pathlib import Path
from multiprocessing import Pool, cpu_count
CACHE_DIR = Path(os.environ.get("HOME", "")) / ".cache" / "lis-icons"
MAP_FILE = CACHE_DIR / "index.map"
MANIFEST_FILE = CACHE_DIR / "manifest.json"
COLOR_LOCK = CACHE_DIR / "colors.lock"
def resolve_icons():
    """
    Call resolve-icons script to build the icon map.
    Writes output to MAP_FILE.
    """
    try:
        with open(MAP_FILE, 'w') as f:
            result = subprocess.run(
                ["resolve-icons"],
                stdout=f,
                stderr=subprocess.PIPE,
                text=True
            )
            if result.returncode != 0:
                print(f"Warning: resolve-icons failed: {result.stderr}")
    except FileNotFoundError:
        print("Error: resolve-icons not found in PATH. Icon tinting skipped.")
    except Exception as e:
        print(f"Error running resolve-icons: {e}")
def tint_worker(args):
    """
    Worker for tinting a single icon.
    args: (src_path, dest_prim, dest_acc, prim_hex, acc_hex)
    """
    src, dest_prim, dest_acc, prim, acc = args
    def build_cmd(color_hex, dest_path):
        return [
            "magick", "-density", "384", "-background", "none", src,
            "-resize", "128x128", "-gravity", "center", "-extent", "128x128",
            "-fuzz", "10%", "-fill", "none", "-draw", "alpha 0,0 floodfill",
            "-channel", "alpha", "-morphology", "Erode", "Disk:1", "-blur", "0x0.5",
            "-channel", "RGB", "-colorspace", "gray", "-colorspace", "sRGB",
            "(", "+clone", "-fill", color_hex, "-colorize", "100", ")", "-compose", "Overlay", "-composite",
            "(", "+clone", "-alpha", "extract", ")", "-compose", "DstIn", "-composite",
            str(dest_path)
        ]
    cmd_prim = build_cmd(prim, dest_prim)
    cmd_acc = build_cmd(acc, dest_acc)
    try:
        subprocess.run(cmd_prim, check=True, stderr=subprocess.PIPE, text=True)
        subprocess.run(cmd_acc, check=True, stderr=subprocess.PIPE, text=True)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error tinting {src}: {e.stderr}")
        return False
def tint_icons(prim_hex: str, acc_hex: str, force: bool = False):
    """
    Main entry point for tinting.
    """
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    prim_dir = CACHE_DIR / "primary"
    acc_dir = CACHE_DIR / "accent"
    prim_dir.mkdir(exist_ok=True)
    acc_dir.mkdir(exist_ok=True)
    current_sig = f"{prim_hex}-{acc_hex}"
    should_repaint = force
    if COLOR_LOCK.exists():
        if COLOR_LOCK.read_text().strip() != current_sig:
            should_repaint = True
            shutil.rmtree(prim_dir)
            shutil.rmtree(acc_dir)
            prim_dir.mkdir()
            acc_dir.mkdir()
    else:
        should_repaint = True
    if not should_repaint and not force:
        print(":: Icons up to date.")
        return
    COLOR_LOCK.write_text(current_sig)
    if not MAP_FILE.exists():
        print(":: Indexing icons...")
        resolve_icons()
    if not MAP_FILE.exists():
        print("Error: Icon map creation failed.")
        return
    tasks = []
    with open(MAP_FILE, 'r') as f:
        for line in f:
            parts = line.strip().split('|')
            if len(parts) != 2: continue
            name, src = parts
            dest_prim = prim_dir / f"{name}.png"
            dest_acc = acc_dir / f"{name}.png"
            if dest_prim.exists() and dest_acc.exists():
                continue
            tasks.append((src, dest_prim, dest_acc, prim_hex, acc_hex))
    if not tasks:
        print(":: No new icons to tint.")
    else:
        print(f":: Tinting {len(tasks)} icons...")
        with Pool(processes=cpu_count()) as pool:
            pool.map(tint_worker, tasks)
    print(":: Generating Manifest...")
    manifest = {"primary": {}, "accent": {}}
    for f in prim_dir.glob("*.png"):
        manifest["primary"][f.stem] = str(f)
    for f in acc_dir.glob("*.png"):
        manifest["accent"][f.stem] = str(f)
    with open(MANIFEST_FILE, 'w') as f:
        json.dump(manifest, f)
    print(":: Icons Done.")

@FILE magician.py
"""
MAGICIAN: The Lis-OS Theme Engine CLI
Replaces engine.sh and lis-daemon.
"""
import sys
import os
import argparse
import json
import time
import subprocess
import shutil
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import blake3
from core.mood import MoodEngine, get_mood
from core.extraction import PerceptualExtractor
from core.generator import PaletteGenerator, PaletteConfig
from core.renderer import render_template
from coloraide import Color
def map_colors(raw_colors):
    """Map V2 scientific keys to V1 system keys w/ derivations."""
    colors = {}
    colors['anchor'] = raw_colors.get('anchor', '#000000')
    colors['bg'] = raw_colors.get('bg_base', '#000000')
    colors['fg'] = raw_colors.get('fg_base', '#ffffff')
    colors['ui_prim'] = raw_colors.get('primary', '#888888')
    colors['ui_sec'] = raw_colors.get('secondary', '#666666')
    colors['sem_red'] = raw_colors.get('error', '#ff0000')
    colors['sem_green'] = raw_colors.get('success', '#00ff00')
    colors['sem_yellow'] = raw_colors.get('warning', '#ffff00')
    colors['sem_blue'] = raw_colors.get('tertiary', '#0000ff')
    try:
        c_bg = Color(colors['bg'])
        is_dark = c_bg.luminance() < 0.5
        if is_dark:
            colors['surface'] = c_bg.clone().set('oklch.l', lambda l: l + 0.05).to_string(hex=True)
            colors['surfaceLighter'] = c_bg.clone().set('oklch.l', lambda l: l + 0.10).to_string(hex=True)
            colors['surfaceDarker'] = c_bg.clone().set('oklch.l', lambda l: max(0, l - 0.02)).to_string(hex=True)
        else:
            colors['surface'] = c_bg.clone().set('oklch.l', lambda l: l - 0.05).to_string(hex=True)
            colors['surfaceLighter'] = c_bg.clone().set('oklch.l', lambda l: l - 0.10).to_string(hex=True)
            colors['surfaceDarker'] = c_bg.clone().set('oklch.l', lambda l: min(1, l + 0.02)).to_string(hex=True)
    except: pass
    try:
        c_fg = Color(colors['fg'])
        colors['fg_dim'] = c_fg.clone().set('alpha', 0.7).to_string(hex=True)
        colors['fg_muted'] = c_fg.clone().set('alpha', 0.4).to_string(hex=True)
    except: pass
    colors['syn_key'] = colors['ui_prim']
    colors['syn_str'] = colors['sem_green']
    colors['syn_fun'] = colors['sem_blue']
    colors['syn_acc'] = colors['sem_red']
    colors['text'] = colors['fg']
    colors['textDim'] = colors['fg_dim']
    colors['textMuted'] = colors['fg_muted']
    for k, v in colors.items():
        if isinstance(v, str) and (v.startswith("oklch") or v.startswith("rgb") or "(" in v):
            try:
                c = Color(v)
                colors[k] = c.convert('srgb').to_string(hex=True)
            except: pass
    return colors
XDG_CONFIG_HOME = Path(os.environ.get("XDG_CONFIG_HOME", Path.home() / ".config"))
XDG_CACHE_HOME = Path(os.environ.get("XDG_CACHE_HOME", Path.home() / ".cache"))
CONFIG_DIR = XDG_CONFIG_HOME / "theme-engine"
MOODS_FILE = CONFIG_DIR / "moods.json"
TEMPLATE_DIR = CONFIG_DIR / "templates"
CACHE_DIR = XDG_CACHE_HOME / "theme-engine"
PALETTES_DIR = CACHE_DIR / "palettes"  # Precached palettes by hash/mood
PALETTE_FILE = CACHE_DIR / "palette.json"
SIGNAL_FILE = CACHE_DIR / "signal"
CACHE_DIR.mkdir(parents=True, exist_ok=True)
(XDG_CACHE_HOME / "wal").mkdir(parents=True, exist_ok=True)
(XDG_CONFIG_HOME / "astal").mkdir(parents=True, exist_ok=True)
def atomic_write(path: Path, content: str):
    tmp = path.with_suffix('.tmp')
    tmp.parent.mkdir(parents=True, exist_ok=True)
    with open(tmp, 'w') as f:
        f.write(content)
    shutil.move(tmp, path)
def load_config():
    """Load moods.json configuration."""
    if not MOODS_FILE.exists():
        return {"moods": {}, "active_mood": "adaptive"}
    try:
        with open(MOODS_FILE, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading moods.json: {e}")
        return {"moods": {}, "active_mood": "adaptive"}
def export_gowall_json(colors: dict, path: Path):
    """Export palette to JSON format compatible with Gowall (-t)."""
    color_list = [
        colors.get("bg", "#000000"),
        colors.get("fg", "#ffffff"),
        colors.get("ui_prim", "#ff00ff"),
        colors.get("ui_sec", "#00ffff"),
        colors.get("sem_red", "#ff0000"),
        colors.get("sem_green", "#00ff00"),
        colors.get("sem_yellow", "#ffff00"),
        colors.get("sem_blue", "#0000ff"),
        colors.get("surface", "#111111"),
        colors.get("surfaceLighter", "#222222"),
        colors.get("surfaceDarker", "#000000"),
    ]
    seen = set()
    unique_colors = []
    for c in color_list:
        if c not in seen:
            unique_colors.append(c)
            seen.add(c)
    mapped = {
        "name": "Generated",
        "colors": unique_colors
    }
    with open(path, 'w') as f:
        json.dump(mapped, f, indent=2)
def process_pipeline(img_path: Path, mood_name: str) -> dict:
    """Run full color pipeline: Mood -> Extract -> Generate."""
    try:
        mood_cfg = get_mood(mood_name)
        engine = MoodEngine(mood_cfg)
        img_buffer = engine.process_image(str(img_path))
        extractor = PerceptualExtractor()
        extracted_data = extractor.extract(img_buffer)
        anchor = extracted_data['anchor']
        gen_config = PaletteConfig(mood=mood_name)
        generator = PaletteGenerator(config=gen_config)
        gen_result = generator.generate(anchor, extracted_data['palette'], extracted_data['weights'])
        colors = map_colors(gen_result['colors'])
        return {
            "colors": colors,
            "active_mood": mood_name,
            "harmonic_template": gen_result['template'],
            "harmonic_rotation": gen_result['rotation']
        }
    except Exception as e:
        print(f"Pipeline Error ({mood_name}): {e}")
        return None
def action_set(args):
    """Set theme from image."""
    img_path = Path(args.image)
    if not img_path.exists():
        wall_dir = Path.home() / "Pictures/Wallpapers"
        candidate = wall_dir / img_path.name
        if candidate.exists():
            img_path = candidate
        else:
            print(f"Error: Image not found: {args.image} (checked {wall_dir})")
            sys.exit(1)
    img_path = img_path.resolve()
    config_data = load_config()
    palette = None
    processed_wallpaper = None
    if hasattr(args, 'preset') and args.preset:
        from core.presets import PRESETS
        if args.preset in PRESETS:
            print(f":: Applying Preset: {args.preset}")
            palette = {
                "colors": PRESETS[args.preset],
                "active_mood": "preset",
                "harmonic_template": "preset",
                "harmonic_rotation": 0
            }
            if hasattr(args, 'gowall') and args.gowall:
                print(f":: Tinting with Gowall [{args.preset}]...")
                try:
                    theme_name = args.preset.replace('_', '-')
                    if theme_name == "catppuccin-mocha": theme_name = "catppuccin"
                    dest = XDG_CACHE_HOME / "wal" / "processed_wallpaper.png"
                    subprocess.run(["gowall", "convert", str(img_path), "--output", str(dest), "-t", theme_name], check=True, stdout=subprocess.DEVNULL)
                    processed_wallpaper = dest
                    print(f"   -> {dest}")
                except Exception as e:
                    print(f"   [!] Gowall failed: {e}")
        else:
            print(f"Error: Preset '{args.preset}' not found. Available: {list(PRESETS.keys())}")
            sys.exit(1)
    if not palette:
        if args.mood:
            from core.mood import MOOD_PRESETS
            if args.mood not in MOOD_PRESETS and args.mood not in config_data.get("moods", {}):
                print(f"Warning: Mood '{args.mood}' not found. Using default.")
            else:
                config_data["active_mood"] = args.mood
        active_mood_name = config_data.get("active_mood", "adaptive")
        cached_palette = get_cached_palette(str(img_path), active_mood_name)
        if cached_palette:
            print(f":: Cache HIT for {img_path.name} [{active_mood_name}]")
            palette = cached_palette
        else:
            print(f":: Processing Image {img_path.name} [Mood: {active_mood_name}]...")
            t0 = time.time()
            palette = process_pipeline(img_path, active_mood_name)
            if not palette:
                print("Error: Pipeline failed.")
                sys.exit(1)
            print(f"   Harmonic: {palette['harmonic_template']} ({palette['harmonic_rotation']}°) [{time.time()-t0:.3f}s]")
            save_cached_palette(str(img_path), active_mood_name, palette)
    print(":: Saving State...")
    if hasattr(args, 'gowall') and args.gowall and not processed_wallpaper:
         print(":: Tinting with Gowall (Generated Palette)...")
         try:
             json_path = XDG_CACHE_HOME / "wal" / "gowall-palette.json"
             export_gowall_json(palette['colors'], json_path)
             dest = XDG_CACHE_HOME / "wal" / "processed_wallpaper.png"
             subprocess.run(["gowall", "convert", str(img_path), "--output", str(dest), "-t", str(json_path)], check=True, stdout=subprocess.DEVNULL)
             processed_wallpaper = dest
             print(f"   -> {dest}")
         except Exception as e:
              print(f"   [!] Gowall failed: {e}")
    palette_json = json.dumps(palette, indent=2)
    atomic_write(PALETTE_FILE, palette_json)
    atomic_write(XDG_CONFIG_HOME / "astal" / "appearance.json", palette_json)
    print(":: Rendering Templates...")
    templates = [
        ("ags-colors.css", XDG_CACHE_HOME / "wal" / "ags-colors.css"),
        ("kitty.conf", XDG_CACHE_HOME / "wal" / "colors-kitty.conf"),
        ("rofi.rasi", XDG_CACHE_HOME / "wal" / "colors-rofi.rasi"),
        ("starship.toml", XDG_CONFIG_HOME / "starship.toml"),
        ("niri.kdl", XDG_CONFIG_HOME / "niri" / "colors.kdl"),
        ("zed.json", XDG_CONFIG_HOME / "zed" / "themes" / "LisTheme.json"),
        ("vesktop.css", XDG_CONFIG_HOME / "vesktop" / "themes" / "lis.css"),
        ("wezterm.lua", XDG_CACHE_HOME / "wal" / "colors-wezterm.lua"),
        ("antigravity.template", Path.home() / ".antigravity" / "extensions" / "lis-theme" / "themes" / "lis-theme.json"),
        ("hyfetch.json", XDG_CONFIG_HOME / "hyfetch.json"),
        ("zellij.kdl", XDG_CONFIG_HOME / "zellij" / "themes" / "default.kdl"),
        ("gtk.css", XDG_CONFIG_HOME / "gtk-4.0" / "gtk.css"),
        ("colors.sh", XDG_CACHE_HOME / "wal" / "colors.sh")
    ]
    for tpl_name, dest in templates:
        src = TEMPLATE_DIR / tpl_name
        if src.exists():
            print(f"   -> {dest}")
            render_template(src, dest, palette)
    print(":: Reloading Apps...")
    try:
        subprocess.run(["kitty", "@", "--to=unix:@mykitty", "set-colors", "-a", "-c", str(XDG_CACHE_HOME / "wal" / "colors-kitty.conf")], stderr=subprocess.DEVNULL)
    except: pass
    niri_base = XDG_CONFIG_HOME / "niri" / "config-base.kdl"
    niri_colors = XDG_CONFIG_HOME / "niri" / "colors.kdl"
    niri_final = XDG_CONFIG_HOME / "niri" / "config.kdl"
    if niri_base.exists() and niri_colors.exists():
        with open(niri_final, 'w') as f:
            f.write(niri_base.read_text() + "\n" + niri_colors.read_text())
        subprocess.run(["niri", "msg", "action", "load-config-file"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    gtk3_dest = XDG_CONFIG_HOME / "gtk-3.0" / "gtk.css"
    gtk4_src = XDG_CONFIG_HOME / "gtk-4.0" / "gtk.css"
    if gtk4_src.exists():
        gtk3_dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy(gtk4_src, gtk3_dest)
    settings_base = XDG_CONFIG_HOME / "Antigravity" / "User" / "settings-base.json"
    settings_final = XDG_CONFIG_HOME / "Antigravity" / "User" / "settings.json"
    if settings_base.exists():
        print(":: Merging Antigravity Settings...")
        try:
            with open(settings_base) as f:
                base_data = json.load(f)
            c = palette["colors"]
            workbench_colors = {
                "activityBar.background": c["ui_sec"],
                "activityBar.foreground": c["fg"],
                "editor.background": c["bg"],
                "editor.foreground": c["fg"],
                "statusBar.background": c["ui_sec"],
                "sideBar.background": c["bg"],
                "titleBar.activeBackground": c["bg"],
                "terminal.background": c["bg"]
            }
            customizations = base_data.get("workbench.colorCustomizations", {})
            customizations.update(workbench_colors)
            base_data["workbench.colorCustomizations"] = customizations
            atomic_write(settings_final, json.dumps(base_data, indent=4))
        except Exception as e:
            print(f"Error updating Antigravity settings: {e}")
    print(":: Setting Wallpaper...")
    target_wall = processed_wallpaper if processed_wallpaper else img_path
    wall_link = XDG_CACHE_HOME / "current_wallpaper.jpg"
    try:
        if wall_link.is_symlink() or wall_link.exists():
            wall_link.unlink()
        wall_link.symlink_to(target_wall)
    except: pass
    if subprocess.call(["pgrep", "-x", "swww-daemon"], stdout=subprocess.DEVNULL) != 0:
         subprocess.Popen(["swww-daemon"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
         time.sleep(0.5)
    subprocess.Popen([
        "swww", "img", str(target_wall),
        "--transition-type", "grow",
        "--transition-pos", "0.5,0.5",
        "--transition-fps", "60",
        "--transition-duration", "2"
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    SIGNAL_FILE.touch()
    anchor_display = palette.get("colors", {}).get("anchor", "cached")
    subprocess.run(["notify-send", "-u", "low", "Theme Refreshed", f"Anchor: {anchor_display}"], check=False)
    print(f"\n=== PALETTE PREVIEW [{config_data.get('active_mood')}] ===")
    def format_color_cell(hex_val, width=20):
        if not hex_val or not isinstance(hex_val, str) or not hex_val.startswith("#"):
            return f"{str(hex_val):<{width}}"
        try:
            h = hex_val.lstrip('#')
            r, g, b = tuple(int(h[i:i+2], 16) for i in (0, 2, 4))
            color_block = f"\033[48;2;{r};{g};{b}m      \033[0m"
            return f"{color_block} {hex_val:<{width-7}}"
        except ValueError:
            return f"{hex_val:<{width}}"
    for key, val in sorted(palette["colors"].items()):
        if val.startswith("#"):
            print(f"{key:<15} {format_color_cell(val)}")
    print(":: Generating Noctalia Shims...")
    try:
        c = palette["colors"]
        def on_color(hex_str):
            """Calculate accessible text color (onPrimary, etc)."""
            try:
                base = Color(hex_str)
                if base.contrast("#ffffff") >= 4.5:
                    return "#ffffff"
                return "#000000"
            except:
                return "#ffffff"
        def shift(hex_str, light_delta=0):
            """Shift lightness."""
            try:
                col = Color(hex_str)
                l = col.convert("oklch").coords[0]
                new_l = max(0, min(1, l + light_delta))
                col.convert("oklch").coords[0] = new_l
                return col.to_string(hex=True)
            except:
                return hex_str
        def derive_outline(bg_hex):
            """Derive outline from background."""
            return shift(bg_hex, 0.15)  # Slightly lighter/distinct from BG
        def derive_shadow(bg_hex):
            return shift(bg_hex, -0.05) # Slightly darker
        def with_alpha(hex_str, alpha_float):
            """Add transparency (Qt/QML uses #AARRGGBB)."""
            try:
                clean = hex_str.lstrip('#')
                if len(clean) == 6:
                    val = int(alpha_float * 255)
                    alpha_hex = f"{val:02x}"
                    return f"#{alpha_hex}{clean}"
                return hex_str
            except:
                return hex_str
        noctalia_colors = {
            "mPrimary": c["ui_prim"],
            "mOnPrimary": on_color(c["ui_prim"]),
            "mSecondary": c["ui_sec"],
            "mOnSecondary": on_color(c["ui_sec"]),
            "mTertiary": c["syn_acc"],
            "mOnTertiary": on_color(c["syn_acc"]),
            "mError": c["sem_red"],
            "mOnError": on_color(c["sem_red"]),
            "mSurface": with_alpha(c["bg"], 0.85),
            "mOnSurface": c["fg"],
            "mSurfaceVariant": with_alpha(shift(c["bg"], 0.05), 0.75),
            "mOnSurfaceVariant": shift(c["fg"], -0.1),
            "mOutline": derive_outline(c["bg"]),
            "mShadow": "#000000", # Force black shadow for better contrast
            "mHover": c["syn_acc"],     # Using accent as hover state
            "mOnHover": on_color(c["syn_acc"])
        }
        noc_dir = XDG_CONFIG_HOME / "noctalia"
        noc_dir.mkdir(parents=True, exist_ok=True)
        atomic_write(noc_dir / "colors.json", json.dumps(noctalia_colors, indent=2))
        print(f"   -> {noc_dir / 'colors.json'}")
    except Exception as e:
        print(f"Error generating Noctalia shim: {e}")
def action_compare(args):
    """Compare all moods against an image."""
    img_path = Path(args.image).resolve()
    if not img_path.exists():
        print(f"Error: Image not found: {img_path}")
        sys.exit(1)
    from core.mood import MOOD_PRESETS
    moods = list(MOOD_PRESETS.keys())
    print(f":: Comparing Moods for {img_path.name}...")
    results = {}
    for mood_name in moods:
        try:
            res = process_pipeline(img_path, mood_name)
            if res:
                results[mood_name] = res["colors"]
        except Exception as e:
            print(f"Error processing {mood_name}: {e}")
    def format_color_cell(hex_val, width=20):
        if not hex_val or not isinstance(hex_val, str) or not hex_val.startswith("#"):
            return f"{str(hex_val):<{width}}"
        try:
            h = hex_val.lstrip('#')
            r, g, b = tuple(int(h[i:i+2], 16) for i in (0, 2, 4))
            color_block = f"\033[48;2;{r};{g};{b}m      \033[0m"
            return f"{color_block} {hex_val:<{width-7}}"
        except ValueError:
            return f"{hex_val:<{width}}"
    mood_names = sorted(moods)
    col_width = 22
    header = f"{'COMPONENT':<15}" + "".join([f"{m:<{col_width}}" for m in mood_names])
    print("\n" + header)
    print("-" * len(header))
    all_keys = set()
    for m in results:
        all_keys.update(results[m].keys())
    sorted_keys = sorted(all_keys)
    variable_keys = []
    constant_keys = []
    for key in sorted_keys:
        values = [results[m].get(key) for m in mood_names]
        if all(v == values[0] for v in values):
            constant_keys.append((key, values[0]))
        else:
            variable_keys.append(key)
    for key in variable_keys:
        row = f"{key:<15}"
        for m in mood_names:
            val = results[m].get(key, "N/A")
            row += format_color_cell(val, col_width)
        print(row)
    if constant_keys:
        print(f"\n{'CONSTANTS':<15} {format_color_cell('VALUE', col_width)}")
        print("-" * (15 + col_width))
        for key, val in constant_keys:
            print(f"{key:<15} {format_color_cell(val, col_width)}")
    print("")
def action_daemon(args):
    """Watch for changes and regenerate."""
    print(":: Magician Daemon Started.")
    from watchfiles import watch
    paths = [CONFIG_DIR]
    for changes in watch(*paths):
        print(f":: Detected changes: {changes}")
        if not PALETTE_FILE.exists():
            continue
        try:
            with open(PALETTE_FILE) as f:
                data = json.load(f)
                anchor = data["colors"].get("anchor")
        except:
            continue
        if not anchor:
            continue
        print(f":: Regenerating with anchor {anchor}...")
        try:
            config_data = load_config()
            palette = generate_palette(anchor, config_data)
            palette_json = json.dumps(palette, indent=2)
            atomic_write(PALETTE_FILE, palette_json)
            atomic_write(XDG_CONFIG_HOME / "astal" / "appearance.json", palette_json)
        except Exception as e:
            print(f"Error regenerating: {e}")
def action_test(args):
    """Run stress test: generate palettes for multiple anchors across all moods."""
    ANCHORS = {
        "Deep Purple":   "#220975",   # Dark anime/space
        "Sunset Orange": "#E07848",   # Warm sunset
        "Forest Green":  "#2D5A3D",   # Nature/forest
        "Ocean Blue":    "#1E4D6B",   # Ocean/sky
        "Sakura Pink":   "#D4A5A5",   # Cherry blossom
        "Twilight":      "#4A3B5C",   # Evening purple
        "Desert Sand":   "#C19A6B",   # Warm earth
        "Arctic Blue":   "#6B9DAD",   # Cool/ice
        "Autumn Red":    "#8B3A3A",   # Fall leaves
        "Storm Gray":    "#4A5568",   # Moody clouds
    }
    if args.anchor:
        ANCHORS = {"Custom": args.anchor}
    from core.mood import MOOD_PRESETS
    moods = list(MOOD_PRESETS.keys())
    def format_color_cell(hex_val, width=20):
        if not hex_val or not isinstance(hex_val, str) or not hex_val.startswith("#"):
            return f"{str(hex_val):<{width}}"
        try:
            h = hex_val.lstrip('#')
            r, g, b = tuple(int(h[i:i+2], 16) for i in (0, 2, 4))
            color_block = f"\033[48;2;{r};{g};{b}m      \033[0m"
            return f"{color_block} {hex_val:<{width-7}}"
        except ValueError:
            return f"{hex_val:<{width}}"
    print("=== THEME ENGINE STRESS TEST (Mood Matrix) ===")
    for name, anchor_hex in ANCHORS.items():
        print(f"\n>>> TEST: {name} [{anchor_hex}]")
        results = {}
        for mood in moods:
            try:
                p_conf = PaletteConfig(mood=mood)
                gen = PaletteGenerator(p_conf)
                mock_swatch = [anchor_hex] * 8
                mock_weights = [1.0] * 8
                res = gen.generate(anchor_hex, mock_swatch, mock_weights)
                results[mood] = map_colors(res["colors"])
            except Exception as e:
                results[mood] = {"error": str(e)}
        mood_names = sorted(moods)
        col_width = 22
        header = f"{'COMPONENT':<15}" + "".join([f"{m:<{col_width}}" for m in mood_names])
        print(header)
        print("-" * len(header))
        keys = ["bg", "fg", "ui_prim", "ui_sec", "sem_red"]
        for k in keys:
            row = f"{k:<15}"
            for m in mood_names:
                val = results[m].get(k, "N/A")
                row += format_color_cell(val, col_width)
            print(row)
    print("\n=== TEST COMPLETE ===")
def get_image_hash(image_path: str) -> str:
    """Get Blake3 hash of file contents for cache key."""
    hasher = blake3.blake3()
    with open(image_path, 'rb') as f:
        for chunk in iter(lambda: f.read(65536), b''):
            hasher.update(chunk)
    return hasher.hexdigest()[:16]  # Short hash is sufficient
def get_cached_palette(image_path: str, mood: str) -> dict | None:
    """Try to load a cached palette for this image + mood."""
    try:
        img_hash = get_image_hash(image_path)
        cache_file = PALETTES_DIR / img_hash / f"{mood}.json"
        if cache_file.exists():
            with open(cache_file) as f:
                return json.load(f)
    except Exception:
        pass
    return None
def save_cached_palette(image_path: str, mood: str, palette: dict):
    """Save a palette to the cache."""
    try:
        img_hash = get_image_hash(image_path)
        cache_dir = PALETTES_DIR / img_hash
        cache_dir.mkdir(parents=True, exist_ok=True)
        cache_file = cache_dir / f"{mood}.json"
        atomic_write(cache_file, json.dumps(palette, indent=2))
    except Exception as e:
        print(f"   [!] Cache write failed: {e}")
def action_precache(args):
    """Pre-generate palettes for all images in a folder, for all moods."""
    folder = Path(args.folder).resolve()
    if not folder.is_dir():
        print(f"Error: Not a directory: {folder}")
        sys.exit(1)
    jobs = args.jobs or 4
    config_data = load_config()
    moods = list(config_data.get("moods", {}).keys())
    if not moods:
        print("Error: No moods defined in configuration.")
        sys.exit(1)
    extensions = {'.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif'}
    images = [f for f in folder.iterdir() if f.suffix.lower() in extensions]
    if not images:
        print(f"No images found in {folder}")
        return
    print(f":: Pre-caching {len(images)} images × {len(moods)} moods = {len(images) * len(moods)} palettes")
    print(f":: Using {jobs} parallel workers\n")
    PALETTES_DIR.mkdir(parents=True, exist_ok=True)
    def process_image(img_path: Path):
        """Process one image for all moods."""
        results = []
        try:
            for mood in moods:
                cached = get_cached_palette(str(img_path), mood)
                if cached:
                    results.append((mood, "cached"))
                    continue
                palette = process_pipeline(img_path, mood)
                if palette:
                    save_cached_palette(str(img_path), mood, palette)
                    results.append((mood, "generated"))
                else:
                    results.append((mood, "failed"))
        except Exception as e:
            results.append(("error", str(e)))
        return img_path.name, results
    with ThreadPoolExecutor(max_workers=jobs) as executor:
        futures = {executor.submit(process_image, img): img for img in images}
        for future in as_completed(futures):
            name, results = future.result()
            status = ", ".join(f"{m}:{s}" for m, s in results)
            print(f"   {name}: {status}")
    print(f"\n:: Precache complete. Cache at: {PALETTES_DIR}")
def main():
    if len(sys.argv) == 1:
        try:
            from core.tui import MagicianApp
            app = MagicianApp()
            app.run()
            sys.exit(0)
        except ImportError as e:
            print(f"TUI Error: {e}")
            print("Please ensure 'textual' is installed and PYTHONPATH is correct.")
            sys.exit(1)
        except Exception as e:
            print(f"Failed to launch TUI: {e}")
            sys.exit(1)
    parser = argparse.ArgumentParser(description="Lis-OS Theme Engine")
    subparsers = parser.add_subparsers(dest="command", required=True)
    set_parser = subparsers.add_parser("set", help="Set theme from image")
    set_parser.add_argument("image", help="Path to image")
    set_parser.add_argument("--mood", help="Override active mood", default=None)
    set_parser.add_argument("--preset", help="Override with static preset", default=None)
    set_parser.add_argument("--gowall", action="store_true", help="Tint wallpaper with Gowall")
    set_parser.set_defaults(func=action_set)
    comp_parser = subparsers.add_parser("compare", help="Compare all moods against an image")
    comp_parser.add_argument("image", help="Path to image")
    comp_parser.set_defaults(func=action_compare)
    daemon_parser = subparsers.add_parser("daemon", help="Run background daemon")
    daemon_parser.set_defaults(func=action_daemon)
    test_parser = subparsers.add_parser("test", help="Run stress test (Mood Matrix)")
    test_parser.add_argument("--anchor", help="Test single anchor (e.g. '#ff0000')", default=None)
    test_parser.set_defaults(func=action_test)
    precache_parser = subparsers.add_parser("precache", help="Pre-generate palettes for all images in a folder")
    precache_parser.add_argument("folder", help="Path to wallpaper folder")
    precache_parser.add_argument("--jobs", "-j", type=int, default=4, help="Parallel workers (default: 4)")
    precache_parser.set_defaults(func=action_precache)
    args = parser.parse_args()
    args.func(args)
if __name__ == "__main__":
    main()

@FILE mood.py
"""
mood.py — Color Science v2
Cinema-grade mood manipulation via 3D LUTs and split-toning.
Applies color grading to wallpaper BEFORE extraction.
"""
from dataclasses import dataclass
from typing import Tuple, Optional
import numpy as np
from PIL import Image
@dataclass
class MoodConfig:
    """Configuration for a mood filter."""
    name: str
    shadow_tint: Tuple[float, float, float]      # RGB 0-1
    highlight_tint: Tuple[float, float, float]   # RGB 0-1
    tint_pivot: float = 0.5                      # Luminance value where transition occurs
    contrast: float = 1.0
    saturation: float = 1.0
    brightness: float = 0.0                      # Exposure bias
    lut_size: int = 17
MOOD_PRESETS = {
    "adaptive": MoodConfig(
        name="adaptive",
        shadow_tint=(0.0, 0.0, 0.0),    # No tint
        highlight_tint=(0.0, 0.0, 0.0),
        contrast=1.05,
        saturation=1.1,                 # Slight pop
    ),
    "deep": MoodConfig(
        name="deep",
        shadow_tint=(0.0, 0.02, 0.05),  # Cool shadows
        highlight_tint=(0.0, 0.0, 0.0), # Neutral highlights
        contrast=1.1,
        saturation=0.9,
        brightness=-0.1,                # Darken overall
    ),
    "pastel": MoodConfig(
        name="pastel",
        shadow_tint=(0.05, 0.02, 0.02), # Warm shadows (lifted)
        highlight_tint=(0.0, 0.0, 0.0),
        contrast=0.85,
        saturation=0.7,
        brightness=0.1,                 # Lighten
    ),
    "vibrant": MoodConfig(
        name="vibrant",
        shadow_tint=(0.0, 0.0, 0.02),
        highlight_tint=(0.02, 0.02, 0.0),
        contrast=1.2,
        saturation=1.4,
    ),
    "bw": MoodConfig(
        name="bw",
        shadow_tint=(0.02, 0.01, 0.0),
        highlight_tint=(0.02, 0.02, 0.01),
        contrast=1.1,
        saturation=0.0,
    ),
    "catppuccin_mocha": MoodConfig(
        name="catppuccin_mocha",
        shadow_tint=(0.10, 0.08, 0.15), # Deep Mauve/Base tint
        highlight_tint=(0.02, 0.0, 0.05),
        contrast=0.95,
        saturation=0.9,
        brightness=-0.05
    ),
    "nord": MoodConfig(
        name="nord",
        shadow_tint=(0.15, 0.18, 0.22), # Polar Night tint
        highlight_tint=(0.0, 0.02, 0.05),
        contrast=0.9,
        saturation=0.85,
        brightness=0.0
    ),
}
class MoodEngine:
    """Applies mood-based color grading to images via 3D LUT."""
    def __init__(self, config: MoodConfig):
        self.config = config
        self._lut = self._generate_lut()
    def process_image(self, img_path: str) -> np.ndarray:
        """
        Load image, apply LUT, return as float32 RGB array (0-1).
        Resizes to manageable size for extraction if needed, but here we usually
        process full or reasonably sized image.
        """
        with Image.open(img_path) as pil_img:
            pil_img = pil_img.convert('RGB')
            pil_img.thumbnail((512, 512))
            img = np.array(pil_img, dtype=np.float32) / 255.0
            return self._apply_lut(img)
    def _generate_lut(self) -> np.ndarray:
        """Generates a 3D LUT (size x size x size x 3) based on config."""
        s = self.config.lut_size
        x = np.linspace(0, 1, s)
        lut = np.stack(np.meshgrid(x, x, x, indexing='ij'), axis=-1).astype(np.float32)
        R, G, B = lut[..., 0], lut[..., 1], lut[..., 2]
        L = 0.299*R + 0.587*G + 0.114*B
        sat = self.config.saturation
        R = L + (R - L) * sat
        G = L + (G - L) * sat
        B = L + (B - L) * sat
        cont = self.config.contrast
        for C in [R, G, B]:
            C[:] = (C - 0.5) * cont + 0.5
        R += self.config.brightness
        G += self.config.brightness
        B += self.config.brightness
        pivot = self.config.tint_pivot
        s_mask = np.clip(1.0 - (L / pivot), 0, 1)
        sr, sg, sb = self.config.shadow_tint
        R += s_mask * sr
        G += s_mask * sg
        B += s_mask * sb
        h_mask = np.clip((L - pivot) / (1.0 - pivot), 0, 1)
        hr, hg, hb = self.config.highlight_tint
        R += h_mask * hr
        G += h_mask * hg
        B += h_mask * hb
        lut = np.stack([R, G, B], axis=-1)
        return np.clip(lut, 0, 1)
    def _apply_lut(self, img: np.ndarray) -> np.ndarray:
        """
        Apply 3D LUT to image using trilinear interpolation.
        Note: Python/Numpy interpolation is slow for per-pixel.
        But for 512x512 it's ok (250k pixels).
        Faster: use Pillow's PointTable or standard LUT?
        Pillow only supports 1D LUTs natively easily.
        For 3D, we can use HaldCLUT + Pillow or just vectorized numpy.
        Vectorized Numpy approach:
        Scale input 0-1 to 0-(size-1) indices.
        """
        s = self.config.lut_size
        scaled = img * (s - 1)
        idx = np.floor(scaled).astype(np.int32)
        idx = np.clip(idx, 0, s - 2)
        frac = scaled - idx
        try:
            from PIL import ImageFilter
            size = self.config.lut_size
            channels = 3
            lut_flat = self._lut.flatten().tolist()
            pass
        except ImportError:
            pass
        return self._apply_math_direct(img)
    def _apply_math_direct(self, img: np.ndarray) -> np.ndarray:
        """Apply grading math directly to image buffer (vectorized)."""
        out = img.copy()
        R, G, B = out[..., 0], out[..., 1], out[..., 2]
        L = 0.299*R + 0.587*G + 0.114*B
        sat = self.config.saturation
        R[:] = L + (R - L) * sat
        G[:] = L + (G - L) * sat
        B[:] = L + (B - L) * sat
        cont = self.config.contrast
        out = (out - 0.5) * cont + 0.5
        out += self.config.brightness
        R, G, B = out[..., 0], out[..., 1], out[..., 2]
        pivot = self.config.tint_pivot
        s_mask = np.clip(1.0 - (L / pivot), 0, 1)
        sr, sg, sb = self.config.shadow_tint
        R += s_mask * sr
        G += s_mask * sg
        B += s_mask * sb
        h_mask = np.clip((L - pivot) / (1.0 - pivot), 0, 1)
        hr, hg, hb = self.config.highlight_tint
        R += h_mask * hr
        G += h_mask * hg
        B += h_mask * hb
        return np.clip(out, 0, 1)
def get_mood(name: str) -> MoodConfig:
    """Get a mood config by name."""
    return MOOD_PRESETS.get(name, MOOD_PRESETS["adaptive"])

@FILE presets.py
"""
Static Theme Presets (Catppuccin, Nord, etc.)
Mapped to Lis-OS Schema.
"""
PRESETS = {
    "catppuccin_mocha": {
        "anchor": "#cba6f7",  # Mauve
        "bg": "#1e1e2e",      # Base
        "fg": "#cdd6f4",      # Text
        "fg_dim": "#a6adc8",  # Subtext0
        "fg_muted": "#585b70",# Surface2
        "ui_prim": "#cba6f7", # Mauve
        "ui_sec": "#313244",  # Surface0
        "sem_red": "#f38ba8",
        "sem_green": "#a6e3a1",
        "sem_yellow": "#f9e2af",
        "sem_blue": "#89b4fa",
        "surface": "#181825",       # Mantle
        "surfaceDarker": "#11111b", # Crust
        "surfaceLighter": "#45475a",# Surface1
        "syn_key": "#cba6f7",
        "syn_acc": "#f38ba8",
        "syn_str": "#a6e3a1",
        "syn_fun": "#fab387", # Peach
        "text": "#cdd6f4",
        "textDim": "#a6adc8",
        "textMuted": "#585b70"
    },
    "nord": {
        "anchor": "#88c0d0",  # Frost Blue
        "bg": "#2e3440",      # Polar Night 0
        "fg": "#d8dee9",      # Snow Storm 0
        "fg_dim": "#e5e9f0",  # Snow Storm 1
        "fg_muted": "#4c566a",# Polar Night 3
        "ui_prim": "#88c0d0", # Frost 2
        "ui_sec": "#434c5e",  # Polar Night 2
        "sem_red": "#bf616a",
        "sem_green": "#a3be8c",
        "sem_yellow": "#ebcb8b",
        "sem_blue": "#81a1c1", # Frost 3
        "surface": "#3b4252",       # Polar Night 1
        "surfaceDarker": "#242933", # Darker than Base
        "surfaceLighter": "#434c5e",# Polar Night 2
        "syn_key": "#88c0d0",
        "syn_acc": "#bf616a",
        "syn_str": "#a3be8c",
        "syn_fun": "#b48ead", # Purple
        "text": "#d8dee9",
        "textDim": "#e5e9f0",
        "textMuted": "#4c566a"
    }
}

@FILE renderer.py
"""
Template Renderer
Performs {key} → value substitution for legacy template compatibility.
"""
import shutil
from pathlib import Path
from typing import Dict, Any
def render_template(template_path: Path, output_path: Path, context: Dict[str, Any]):
    """
    Render a template by replacing {key} placeholders with values.
    Uses atomic write to prevent partial file corruption.
    """
    if not template_path.exists():
        print(f"Warning: Template not found: {template_path}")
        return
    with open(template_path, 'r') as f:
        content = f.read()
    data = context.get("colors", context)
    for key, value in data.items():
        placeholder = f"{{{key}}}"
        content = content.replace(placeholder, str(value))
    output_path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = output_path.with_suffix('.tmp')
    with open(tmp_path, 'w') as f:
        f.write(content)
    shutil.move(tmp_path, output_path)

@FILE resolve_icons.py
import configparser
import os
import sys
import gi
try:
    gi.require_version("Gtk", "3.0")
    from gi.repository import GLib, Gtk
except Exception as e:
    print(f"GTK Import Error: {e}", file=sys.stderr)
    sys.exit(1)
ALIASES = {
    "thunar": ["system-file-manager", "file-manager", "folder"],
    "nautilus": ["system-file-manager", "file-manager"],
    "dolphin": ["system-file-manager", "file-manager"],
    "code": ["vscode", "visual-studio-code", "com.visualstudio.code"],
    "spotify": ["spotify-client"],
    "zed": ["dev.zed.Zed"],
}
def get_current_theme():
    try:
        config_path = os.path.expanduser("~/.config/gtk-3.0/settings.ini")
        if os.path.exists(config_path):
            config = configparser.ConfigParser()
            config.read(config_path)
            if "Settings" in config and "gtk-icon-theme-name" in config["Settings"]:
                return config["Settings"]["gtk-icon-theme-name"]
    except:
        pass
    return "Adwaita"
def get_data_dirs():
    dirs = list(GLib.get_system_data_dirs())
    dirs.append(GLib.get_user_data_dir())
    home = os.path.expanduser("~")
    user = os.environ.get("USER", "lune")
    dirs.append(f"/etc/profiles/per-user/{user}/share")
    dirs.append(os.path.join(home, ".nix-profile", "share"))
    dirs.append(os.path.join(home, ".local", "share"))
    return dirs
def manual_search(theme_name, icon_name):
    """Brute force search in specific theme."""
    if not icon_name or not theme_name:
        return None
    for d in get_data_dirs():
        theme_dir = os.path.join(d, "icons", theme_name)
        if not os.path.isdir(theme_dir):
            continue
        subdirs = [
            "scalable/apps",
            "48x48/apps",
            "32x32/apps",
            "128x128/apps",
            "scalable/places",
            "48x48/places",
        ]
        for sub in subdirs:
            target = os.path.join(theme_dir, sub, f"{icon_name}.svg")
            if os.path.exists(target):
                return target
            target_png = os.path.join(theme_dir, sub, f"{icon_name}.png")
            if os.path.exists(target_png):
                return target_png
    return None
def scan_desktop_files():
    apps = {}
    for data_dir in get_data_dirs():
        app_dir = os.path.join(data_dir, "applications")
        if not os.path.isdir(app_dir):
            continue
        try:
            for filename in os.listdir(app_dir):
                if not filename.endswith(".desktop"):
                    continue
                filepath = os.path.join(app_dir, filename)
                icon_name = None
                try:
                    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                        for line in f:
                            if line.strip().startswith("Icon="):
                                icon_name = line.strip().split("=", 1)[1]
                                break
                except:
                    continue
                if icon_name:
                    clean_id = filename.replace(".desktop", "")
                    apps[clean_id] = icon_name
        except OSError:
            continue
    return apps
def lookup_path(theme, icon_name, theme_name_str):
    if not icon_name:
        return None
    if icon_name.startswith("/"):
        return icon_name if os.path.exists(icon_name) else None
    gtk_path = None
    try:
        icon_info = theme.lookup_icon(icon_name, 48, Gtk.IconLookupFlags.USE_BUILTIN)
        if icon_info:
            f = icon_info.get_filename()
            if f and not f.startswith("/org/") and os.path.exists(f):
                gtk_path = f
    except:
        pass
    manual = manual_search(theme_name_str, icon_name)
    if manual:
        return manual
    if not gtk_path:
        manual_fallback = manual_search("hicolor", icon_name)
        if manual_fallback:
            return manual_fallback
    return gtk_path
def resolve_icons():
    theme = Gtk.IconTheme.new()
    user_theme = get_current_theme()
    print(f"DEBUG: Active Theme: {user_theme}", file=sys.stderr)
    theme.set_custom_theme(user_theme)
    for d in get_data_dirs():
        theme.append_search_path(os.path.join(d, "icons"))
        theme.append_search_path(os.path.join(d, "pixmaps"))
    apps = scan_desktop_files()
    for app_id, icon_input in apps.items():
        initial_path = lookup_path(theme, icon_input, user_theme)
        def is_themed(p):
            return p and user_theme in p
        final_path = initial_path
        if not is_themed(initial_path):
            candidates = []
            if app_id in ALIASES:
                candidates.extend(ALIASES[app_id])
            if "." in icon_input:
                candidates.append(icon_input.split(".")[-1])
            if "-" in icon_input:
                candidates.append(icon_input.split("-")[0])
            candidates.append(icon_input.lower())
            for cand in candidates:
                better = lookup_path(theme, cand, user_theme)
                if is_themed(better):
                    final_path = better
                    break
        if final_path:
            print(f"{app_id}|{final_path}")
            if "zed" in app_id or "thunar" in app_id:
                print(f"DEBUG: {app_id} -> {final_path}", file=sys.stderr)
if __name__ == "__main__":
    resolve_icons()

@FILE solver.py
"""
solver.py — Color Science v2
WCAG constraint solver with gamut mapping.
Ensures all fg/bg pairs meet accessibility requirements.
"""
from coloraide import Color
from typing import Tuple, Optional
def solve_contrast(
    bg_hex: str,
    target_hue: float,
    target_chroma: float,
    min_ratio: float = 4.5,
    max_iterations: int = 15
) -> str:
    """
    Find optimal lightness to achieve WCAG contrast ratio.
    Uses binary search to find L that achieves min_ratio.
    Hue and chroma are preserved as much as possible.
    Args:
        bg_hex: Background color as hex string
        target_hue: Desired hue angle (0-360) in Oklch
        target_chroma: Desired chroma (0-1) in Oklch
        min_ratio: Minimum contrast ratio (4.5 for AA)
        max_iterations: Binary search iterations
    Returns:
        Hex string of accessible foreground color
    """
    bg = Color(bg_hex)
    bg_l = bg.convert('oklch')['l']
    search_up = bg_l < 0.6 # slightly biased towards light text
    low = bg_l if search_up else 0.0
    high = 1.0 if search_up else bg_l
    best_color = None
    best_ratio = 0.0
    for _ in range(max_iterations):
        mid_l = (low + high) / 2.0
        cand = Color('oklch', [mid_l, target_chroma, target_hue])
        cand = gamut_map(cand)
        ratio = bg.contrast(cand)
        if ratio >= min_ratio:
            best_color = cand
            best_ratio = ratio
            if search_up:
                high = mid_l # Try lower L (closer to bg) to see if it still passes?
                pass
        if ratio < min_ratio:
            if search_up:
                low = mid_l
            else:
                high = mid_l
        else:
            best_color = cand # Update best
            if search_up:
                high = mid_l # check lower L
            else:
                low = mid_l # check higher L
    if best_color:
        return best_color.to_string(hex=True)
    white = Color('white')
    black = Color('black')
    if bg.contrast(white) >= min_ratio:
        return white.to_string(hex=True)
    elif bg.contrast(black) >= min_ratio:
        return black.to_string(hex=True)
    else:
        return white.to_string(hex=True) if bg.contrast(white) > bg.contrast(black) else black.to_string(hex=True)
def gamut_map(color: Color) -> Color:
    """
    Map out-of-gamut color to sRGB via chroma reduction.
    Preserves hue and lightness, reduces chroma until in-gamut.
    """
    if color.in_gamut('srgb'):
        return color
    return color.fit('srgb', method='lch-chroma')
def calculate_contrast(fg_hex: str, bg_hex: str) -> float:
    """Calculate WCAG contrast ratio between two colors."""
    fg = Color(fg_hex)
    bg = Color(bg_hex)
    return bg.contrast(fg)

@DIR modules/home/theme/core/tui
@FILE app.py
"""
app.py — Main Textual application for Magician TUI
"""
from textual.app import App
from textual.screen import Screen
from .main_menu import MainMenu
from .forge import ForgeScreen
from .favorites import FavoritesScreen
from .lab import LabScreen
class MagicianApp(App):
    """The Magician Theme Engine TUI."""
    TITLE = "Magician"
    SUB_TITLE = "Theme Engine v2.2"
    CSS = """
    Screen {
        background: $background;
    }
    """
    SCREENS = {
        "main": MainMenu,
        "forge": ForgeScreen,
        "favorites": FavoritesScreen,
        "lab": LabScreen,
    }
    def on_mount(self):
        self.push_screen("main")
def run():
    """Entry point for the TUI."""
    app = MagicianApp()
    app.run()
if __name__ == "__main__":
    run()

@FILE favorites.py
"""
favorites.py — FAVORITES screen for Magician TUI
Manage saved theme combinations.
"""
import os
import json
import subprocess
from pathlib import Path
from datetime import datetime
from dataclasses import dataclass, asdict, field
from typing import Optional
from textual.screen import Screen
from textual.app import ComposeResult
from textual.containers import Container, Horizontal, Vertical, ScrollableContainer
from textual.widgets import Static, Label, Footer, Button
from textual.binding import Binding
from textual.reactive import reactive
from textual.message import Message
from rich.text import Text
from .widgets import Header
from .state import XDG_CACHE_HOME
FAVORITES_FILE = XDG_CACHE_HOME / "theme-engine" / "favorites.json"
@dataclass
class Favorite:
    """A saved theme favorite."""
    id: str
    name: str
    wallpaper_path: str
    generation_mode: str  # "mood" or "preset"
    mood_name: Optional[str] = None
    preset_name: Optional[str] = None
    gowall_enabled: bool = False
    colors: dict = field(default_factory=dict)
    created: str = ""
    last_used: str = ""
def load_favorites() -> list[Favorite]:
    """Load favorites from disk."""
    if not FAVORITES_FILE.exists():
        return []
    try:
        with open(FAVORITES_FILE) as f:
            data = json.load(f)
            return [Favorite(**fav) for fav in data.get("favorites", [])]
    except Exception:
        return []
def save_favorites(favorites: list[Favorite]):
    """Save favorites to disk."""
    FAVORITES_FILE.parent.mkdir(parents=True, exist_ok=True)
    try:
        with open(FAVORITES_FILE, "w") as f:
            json.dump({"favorites": [asdict(fav) for fav in favorites]}, f, indent=2)
    except Exception:
        pass
def create_favorite(
    name: str,
    wallpaper_path: str,
    mode: str,
    mood: Optional[str] = None,
    preset: Optional[str] = None,
    gowall: bool = False,
    colors: dict = None
) -> Favorite:
    """Create a new favorite."""
    now = datetime.now().isoformat()
    fav_id = f"{Path(wallpaper_path).stem}-{mode[:4]}-{int(datetime.now().timestamp())}"
    return Favorite(
        id=fav_id,
        name=name,
        wallpaper_path=wallpaper_path,
        generation_mode=mode,
        mood_name=mood,
        preset_name=preset,
        gowall_enabled=gowall,
        colors=colors or {},
        created=now,
        last_used=now
    )
class FavoriteItem(Static):
    """A favorite item in the sidebar list."""
    def __init__(self, favorite: Favorite, is_current: bool = False, **kwargs):
        super().__init__(**kwargs)
        self.favorite = favorite
        self.is_current = is_current
    def on_mount(self):
        self._update_display()
    def _update_display(self):
        text = Text()
        prefix = ">" if self.is_current else " "
        name = self.favorite.name
        if len(name) > 18:
            name = name[:15] + "..."
        text.append(f"{prefix} ", style="bold cyan" if self.is_current else "dim")
        text.append(name, style="white" if self.is_current else "dim")
        text.append("\n")
        mode_short = self.favorite.mood_name or self.favorite.preset_name or "?"
        if len(mode_short) > 6:
            mode_short = mode_short[:6]
        text.append(f"  └─[{mode_short}]", style="magenta" if self.favorite.preset_name else "cyan")
        self.update(text)
    def set_current(self, is_current: bool):
        self.is_current = is_current
        self._update_display()
        if is_current:
            self.add_class("cursor")
        else:
            self.remove_class("cursor")
class FavoriteDetailPanel(Static):
    """Panel showing favorite details and preview."""
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.current_favorite: Optional[Favorite] = None
    def update_favorite(self, favorite: Favorite):
        """Update the detail view for a favorite."""
        self.current_favorite = favorite
        self._refresh_display()
    def _refresh_display(self):
        if not self.current_favorite:
            self.update("[dim]No favorite selected[/dim]")
            return
        fav = self.current_favorite
        lines = []
        lines.append(f"[bold]Detail: {fav.name}[/bold]")
        badges = []
        if fav.gowall_enabled:
            badges.append("[green][Gowall:✓][/green]")
        badges.append(f"[dim][Mode:{fav.generation_mode}][/dim]")
        if fav.last_used:
            try:
                dt = datetime.fromisoformat(fav.last_used)
                diff = datetime.now() - dt
                if diff.days > 0:
                    age = f"{diff.days}d ago"
                elif diff.seconds > 3600:
                    age = f"{diff.seconds // 3600}h ago"
                else:
                    age = f"{diff.seconds // 60}m ago"
                badges.append(f"[dim][Used:{age}][/dim]")
            except:
                pass
        lines.append(" ".join(badges))
        lines.append("")
        wp_path = Path(fav.wallpaper_path)
        lines.append(f"[cyan]Wallpaper:[/cyan] {wp_path.name}")
        lines.append("")
        if fav.colors:
            lines.append("[bold]Palette:[/bold]")
            key_colors = ["bg", "fg", "ui_prim", "ui_sec", "anchor"]
            for key in key_colors:
                if key in fav.colors:
                    hex_val = fav.colors[key]
                    lines.append(f"  ⣿ {hex_val} {key}")
        else:
            lines.append("[dim]No palette data cached[/dim]")
        self.update("\n".join(lines))
class FavoritesScreen(Screen):
    """The Favorites screen for managing saved themes."""
    BINDINGS = [
        Binding("q", "go_back", "Back", show=True),
        Binding("escape", "go_back", "Back", show=False),
        Binding("enter", "apply_favorite", "Apply", show=True),
        Binding("d", "delete_favorite", "Delete", show=True),
        Binding("up", "cursor_up", show=False),
        Binding("down", "cursor_down", show=False),
    ]
    CSS = """
    FavoritesScreen {
        layout: grid;
        grid-size: 1;
        grid-rows: 3 1fr 3;
    }
        height: 3;
        border: round $primary;
        padding: 0 1;
    }
        layout: horizontal;
    }
        width: 28;
        border: round $surface;
        height: 100%;
    }
        width: 1fr;
        border: round $surface;
        padding: 1;
    }
        height: 3;
        border: round $surface;
        padding: 0 1;
    }
    .cursor {
        background: $primary 30%;
    }
    FavoriteItem {
        height: 2;
        padding: 0 1;
    }
    FavoriteItem:hover {
        background: $surface;
    }
    """
    cursor_index = reactive(0)
    def __init__(self):
        super().__init__()
        self.favorites = load_favorites()
    def compose(self) -> ComposeResult:
        with Container(id="header-bar"):
            yield Static(self._build_header())
        with Horizontal(id="content-area"):
            with ScrollableContainer(id="sidebar"):
                for i, fav in enumerate(self.favorites):
                    yield FavoriteItem(fav, is_current=(i == 0))
                if not self.favorites:
                    yield Static("[dim]No favorites yet[/dim]\n\nCreate one from Forge\nby saving a theme.")
            with Vertical(id="main-panel"):
                yield FavoriteDetailPanel(id="detail-panel")
        with Container(id="footer-bar"):
            yield Static(self._build_footer())
        yield Footer()
    def _build_header(self) -> Text:
        text = Text()
        text.append("⭐ ", style="yellow")
        text.append("Favorites", style="bold yellow")
        text.append(f"  [{len(self.favorites)} saved]", style="dim")
        text.append("  [d]elete [a]pply [?][q]", style="dim")
        return text
    def _build_footer(self) -> Text:
        text = Text()
        text.append("[Nav]", style="cyan")
        text.append("↑↓ ", style="white")
        text.append("[Apply]", style="cyan")
        text.append("Enter ", style="white")
        text.append("[Delete]", style="cyan")
        text.append("d ", style="white")
        text.append("[Back]", style="cyan")
        text.append("q", style="white")
        return text
    def on_mount(self):
        if self.favorites:
            detail = self.query_one("#detail-panel", FavoriteDetailPanel)
            detail.update_favorite(self.favorites[0])
    def watch_cursor_index(self, old: int, new: int):
        """Update display when cursor moves."""
        items = list(self.query(FavoriteItem))
        for i, item in enumerate(items):
            item.set_current(i == new)
        if self.favorites and 0 <= new < len(self.favorites):
            detail = self.query_one("#detail-panel", FavoriteDetailPanel)
            detail.update_favorite(self.favorites[new])
    def action_go_back(self):
        self.app.pop_screen()
    def action_cursor_up(self):
        if self.cursor_index > 0:
            self.cursor_index -= 1
    def action_cursor_down(self):
        if self.cursor_index < len(self.favorites) - 1:
            self.cursor_index += 1
    def action_apply_favorite(self):
        """Apply the selected favorite."""
        if not self.favorites:
            self.notify("No favorites to apply", severity="warning")
            return
        fav = self.favorites[self.cursor_index]
        cmd = ["magician", "set", fav.wallpaper_path]
        if fav.generation_mode == "mood" and fav.mood_name:
            cmd.extend(["--mood", fav.mood_name])
        elif fav.generation_mode == "preset" and fav.preset_name:
            cmd.extend(["--preset", fav.preset_name])
            if fav.gowall_enabled:
                cmd.append("--gowall")
        self.notify(f"Applying: {fav.name}...", severity="information")
        try:
            subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            fav.last_used = datetime.now().isoformat()
            save_favorites(self.favorites)
            self.notify("Favorite applied!", severity="information")
        except Exception as e:
            self.notify(f"Error: {e}", severity="error")
    def action_delete_favorite(self):
        """Delete the selected favorite."""
        if not self.favorites:
            self.notify("No favorites to delete", severity="warning")
            return
        fav = self.favorites[self.cursor_index]
        self.favorites.pop(self.cursor_index)
        save_favorites(self.favorites)
        if self.cursor_index >= len(self.favorites) and self.cursor_index > 0:
            self.cursor_index -= 1
        self.notify(f"Deleted: {fav.name}", severity="information")
        self.refresh()

@FILE forge.py
"""
forge.py — FORGE screen for Magician TUI
Complete rewrite following Deep Search recommendations.
Uses Rich Text objects with Style for color rendering.
Uses @work decorator for async image previews.
"""
import os
import subprocess
import shutil
from pathlib import Path
from textual.screen import Screen
from textual.app import ComposeResult
from textual.containers import Container, Horizontal, Vertical, ScrollableContainer
from textual.widgets import Static, Label, Footer, OptionList
from textual.widget import Widget
from textual.binding import Binding
from textual.reactive import reactive
from textual import work
from rich.text import Text
from rich.style import Style
from rich.table import Table
from rich.console import Group
from .state import load_session, save_session, SessionState
XDG_CACHE_HOME = Path(os.environ.get("XDG_CACHE_HOME", Path.home() / ".cache"))
WALLPAPER_DIR = Path.home() / "Pictures" / "Wallpapers"
CHAFA_CACHE = XDG_CACHE_HOME / "theme-engine" / "chafa"
PALETTE_FILE = XDG_CACHE_HOME / "theme-engine" / "palette.json"
MOODS = ["adaptive", "deep", "pastel", "vibrant", "bw"]
PRESETS = ["catppuccin_mocha", "nord"]
def get_wallpapers(directory: Path = WALLPAPER_DIR) -> list[Path]:
    """Get list of wallpaper files."""
    if not directory.exists():
        return []
    exts = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
    return sorted([f for f in directory.iterdir() if f.suffix.lower() in exts and f.is_file()])
def load_palette() -> dict:
    """Load current palette from cache."""
    import json
    if PALETTE_FILE.exists():
        try:
            with open(PALETTE_FILE) as f:
                data = json.load(f)
                return data.get("colors", {})
        except:
            pass
    return {}
def calculate_contrast(hex1: str, hex2: str) -> float:
    """Calculate WCAG contrast ratio between two hex colors."""
    def hex_to_rgb(h: str) -> tuple:
        h = h.lstrip("#")
        if len(h) > 6:
            h = h[:6]
        return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))
    def luminance(rgb: tuple) -> float:
        def adjust(c):
            c = c / 255.0
            return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
        r, g, b = [adjust(c) for c in rgb]
        return 0.2126 * r + 0.7152 * g + 0.0722 * b
    try:
        l1 = luminance(hex_to_rgb(hex1))
        l2 = luminance(hex_to_rgb(hex2))
        lighter = max(l1, l2)
        darker = min(l1, l2)
        return (lighter + 0.05) / (darker + 0.05)
    except:
        return 1.0
class TopBar(Static):
    """Top control bar with mode toggle, selectors, and gowall checkbox."""
    mode = reactive("mood")
    mood_index = reactive(0)
    preset_index = reactive(0)
    gowall = reactive(False)
    def render(self) -> Text:
        """Build styled text for top bar."""
        text = Text()
        if self.mode == "mood":
            text.append("[", style="dim")
            text.append("Mood", style="bold cyan")
            text.append("]", style="dim")
            text.append("Preset ", style="dim")
        else:
            text.append(" Mood", style="dim")
            text.append("[", style="dim")
            text.append("Preset", style="bold magenta")
            text.append("]", style="dim")
        text.append("  ")
        if self.mode == "mood":
            text.append("←", style="cyan")
            text.append(f" {MOODS[self.mood_index]} ", style="bold white")
            text.append("→", style="cyan")
        else:
            text.append("←", style="magenta")
            text.append(f" {PRESETS[self.preset_index]} ", style="bold white")
            text.append("→", style="magenta")
            text.append("  ")
            gw = "✓" if self.gowall else " "
            text.append(f"Gowall:[{gw}]", style="green" if self.gowall else "dim")
        return text
    def next_option(self):
        if self.mode == "mood":
            self.mood_index = (self.mood_index + 1) % len(MOODS)
        else:
            self.preset_index = (self.preset_index + 1) % len(PRESETS)
    def prev_option(self):
        if self.mode == "mood":
            self.mood_index = (self.mood_index - 1) % len(MOODS)
        else:
            self.preset_index = (self.preset_index - 1) % len(PRESETS)
    def toggle_mode(self):
        self.mode = "preset" if self.mode == "mood" else "mood"
    def toggle_gowall(self):
        self.gowall = not self.gowall
    def get_mood(self) -> str:
        return MOODS[self.mood_index]
    def get_preset(self) -> str:
        return PRESETS[self.preset_index]
class PreviewPanel(Static):
    """
    Async Image Preview Panel using @work decorator.
    Fixes: Uses Text.from_ansi() and exclusive=True for cancellation.
    """
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.current_path: Path | None = None
        self.chafa_exe = shutil.which("chafa")
    def show_preview(self, path: Path):
        """Public API: Triggers background preview generation."""
        self.current_path = path
        self.update(Text(f"Loading {path.name}...", style="dim italic"))
        if not self.chafa_exe:
            self.update(Text("Error: 'chafa' not found in PATH", style="bold red"))
            return
        self._generate_preview(path)
    @work(thread=True, exclusive=True)
    def _generate_preview(self, path: Path):
        """
        Background worker using @work decorator.
        exclusive=True cancels previous job when new one starts.
        """
        try:
            width = max(self.content_size.width, 50)
            height = max(self.content_size.height - 2, 12)
            cmd = [
                self.chafa_exe,
                "-f", "symbols",
                "--symbols", "block+border+braille",
                "--colors", "full",
                "--size", f"{width}x{height}",
                str(path)
            ]
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=10
            )
            if result.returncode != 0:
                self.call_from_thread(self._show_error, result.stderr[:100])
            else:
                self.call_from_thread(self._show_result, path, result.stdout)
        except subprocess.TimeoutExpired:
            self.call_from_thread(self._show_error, "Preview timed out")
        except Exception as e:
            self.call_from_thread(self._show_error, str(e))
    def _show_result(self, path: Path, ansi_art: str):
        """Main thread: Parse ANSI and update widget."""
        if self.current_path != path:
            return
        stat = path.stat()
        size_mb = stat.st_size / (1024 * 1024)
        header = Text(f"{path.name} ({size_mb:.1f}MB)\n", style="bold underline #7153a5")
        art_text = Text.from_ansi(ansi_art)
        final = Text.assemble(header, "\n", art_text)
        self.update(final)
    def _show_error(self, msg: str):
        self.update(Text(f"Preview Error: {msg}", style="red"))
class MatrixPanel(Static):
    """
    The Unixporn Matrix showing contrast validation.
    KEY FIX: Uses Text.append() with Style(color=fg, bgcolor=bg) for each cell.
    """
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.palette: dict = {}
    def update_palette(self, palette: dict):
        """Reactive update method."""
        self.palette = palette
        self.refresh()
    def _status_symbol(self, ratio: float) -> tuple[str, str]:
        """Return (symbol, color) based on WCAG ratio."""
        if ratio >= 7.0:
            return "✓", "green"
        elif ratio >= 4.5:
            return "⚠", "yellow"
        else:
            return "✗", "red"
    def _make_cell(self, fg_hex: str, bg_hex: str, ui_bg: str = "#171420") -> Text:
        """
        Create a single matrix cell with colored braille on colored background.
        This is the KEY FIX from the deep search.
        """
        contrast = calculate_contrast(fg_hex, bg_hex)
        symbol, symbol_color = self._status_symbol(contrast)
        cell = Text()
        pattern_style = Style(color=fg_hex, bgcolor=bg_hex)
        cell.append("⣿⣿⣿", style=pattern_style)
        status_style = Style(color=symbol_color, bgcolor=ui_bg, bold=True)
        cell.append(symbol, style=status_style)
        return cell
    def render(self) -> Text:
        """Build the complete matrix using Text objects."""
        if not self.palette:
            return Text("No palette loaded", style="dim")
        bg = self.palette.get("bg", "#171420")
        surface = self.palette.get("surface", "#231f2c")
        light = self.palette.get("surfaceLighter", "#2f2b39")
        anchor = self.palette.get("anchor", "#593a8a")
        fg = self.palette.get("fg", "#a39fac")
        fg_dim = self.palette.get("fg_dim", "#a39fac80")
        ui_prim = self.palette.get("ui_prim", "#7153a5")
        sem_red = self.palette.get("sem_red", "#ad3c31")
        sem_green = self.palette.get("sem_green", "#04731d")
        sem_blue = self.palette.get("sem_blue", "#465ead")
        output = Text()
        output.append("┌──────────── Unixporn Matrix ────────────┐\n", style="#593a8a")
        output.append("│", style="#593a8a")
        output.append("      [bg]   [surf]  [light] [anchor]    ", style="dim")
        output.append("│\n", style="#593a8a")
        output.append("│", style="#593a8a")
        output.append("text  ", style="bold white")
        output.append_text(self._make_cell(fg, bg))
        output.append(" ")
        output.append_text(self._make_cell(fg, surface))
        output.append(" ")
        output.append_text(self._make_cell(fg, light))
        output.append(" ")
        output.append_text(self._make_cell(fg, anchor))
        output.append("   │\n", style="#593a8a")
        output.append("│", style="#593a8a")
        output.append("dim   ", style="dim")
        output.append_text(self._make_cell(fg_dim, bg))
        output.append(" ")
        output.append_text(self._make_cell(fg_dim, surface))
        output.append(" ")
        output.append_text(self._make_cell(fg_dim, light))
        output.append(" ")
        output.append_text(self._make_cell(fg_dim, anchor))
        output.append("   │\n", style="#593a8a")
        output.append("│─────────────────────────────────────────│\n", style="#593a8a")
        output.append("│", style="#593a8a")
        output.append("      prim    red    green   blue        ", style="dim")
        output.append("│\n", style="#593a8a")
        output.append("│", style="#593a8a")
        output.append("      ", style="")
        output.append_text(self._make_cell(ui_prim, bg))
        output.append(" ")
        output.append_text(self._make_cell(sem_red, bg))
        output.append(" ")
        output.append_text(self._make_cell(sem_green, bg))
        output.append(" ")
        output.append_text(self._make_cell(sem_blue, bg))
        output.append("       │\n", style="#593a8a")
        output.append("└─────────────────────────────────────────┘", style="#593a8a")
        return output
class ReadabilityBar(Static):
    """Single line readability summary."""
    def update_from_palette(self, palette: dict):
        if not palette:
            self.update(Text("No palette", style="dim"))
            return
        bg = palette.get("bg", "#000000")
        checks = [
            ("text", palette.get("fg", "#ffffff")),
            ("dim", palette.get("fg_dim", "#aaaaaa")),
            ("prim", palette.get("ui_prim", "#888888")),
            ("red", palette.get("sem_red", "#ff0000")),
            ("green", palette.get("sem_green", "#00ff00")),
            ("blue", palette.get("sem_blue", "#0000ff")),
        ]
        text = Text("Readability: ")
        for name, fg in checks:
            ratio = calculate_contrast(fg, bg)
            if ratio >= 7:
                text.append(f"{name}", style=Style(color=fg))
                text.append("✓", style="green")
            elif ratio >= 4.5:
                text.append(f"{name}", style=Style(color=fg))
                text.append("⚠", style="yellow")
            else:
                text.append(f"{name}", style=Style(color=fg))
                text.append("✗", style="red")
            text.append(" ")
        self.update(text)
class ForgeScreen(Screen):
    """The Forge screen with fixed layout and proper rendering."""
    BINDINGS = [
        Binding("q", "go_back", "Back", show=True),
        Binding("escape", "go_back", "Back", show=False),
        Binding("tab", "toggle_mode", "Mode", show=True),
        Binding("enter", "apply_theme", "Apply", show=True),
        Binding("left", "selector_prev", show=False),
        Binding("right", "selector_next", show=False),
        Binding("g", "toggle_gowall", "Gowall", show=True),
        Binding("r", "random_wallpaper", "Random", show=True),
    ]
    CSS = """
    ForgeScreen {
        layout: grid;
        grid-size: 1;
        grid-rows: 1 2 1fr 1;
    }
        height: 1;
        background: #171420;
        padding: 0 1;
    }
        height: 2;
        background: #171420;
        border-bottom: solid #593a8a;
        padding: 0 1;
    }
        layout: horizontal;
        background: #171420;
    }
    /* R-02: Sidebar exactly 28 chars */
        width: 28;
        background: #171420;
        border-right: solid #593a8a;
        padding: 0;
    }
        background: #171420;
        border: none;
        scrollbar-background: #171420;
        scrollbar-color: #593a8a;
    }
        width: 1fr;
        background: #171420;
        padding: 0 1;
    }
        height: 1fr;
        min-height: 10;
        background: #130f1b;
        padding: 1;
    }
        height: 1;
        padding: 0 1;
    }
        height: auto;
        min-height: 10;
        padding: 0 1;
    }
        height: 1;
        background: #130f1b;
        padding: 0 1;
    }
    """
    selected_index = reactive(0)
    def __init__(self):
        super().__init__()
        self.session = load_session()
        self.wallpapers = get_wallpapers()
        self.palette = load_palette()
    def compose(self) -> ComposeResult:
        yield Static(self._build_header(), id="header-bar")
        yield TopBar(id="top-bar")
        with Horizontal(id="content-area"):
            with Container(id="sidebar"):
                options = OptionList(id="wallpaper-list")
                yield options
            with Vertical(id="main-panel"):
                yield PreviewPanel(id="preview-panel")
                yield ReadabilityBar(id="readability-bar")
                yield MatrixPanel(id="matrix-panel")
        yield Static(self._build_footer(), id="footer-bar")
        yield Footer()
    def _build_header(self) -> Text:
        text = Text()
        text.append("🔮 ", style="bold")
        text.append("Forge", style="bold magenta")
        text.append(f"  [Files:{len(self.wallpapers)}]", style="dim")
        text.append(f"  [Folder:~/Pic/Walls]", style="dim")
        text.append("  [?][q]", style="dim")
        return text
    def _build_footer(self) -> Text:
        text = Text()
        text.append("[Nav]", style="cyan")
        text.append("↑↓ ", style="white")
        text.append("[Mode]", style="cyan")
        text.append("Tab ", style="white")
        text.append("[←→]", style="cyan")
        text.append("Select ", style="white")
        text.append("[Apply]", style="cyan")
        text.append("Enter ", style="white")
        text.append("[Gowall]", style="cyan")
        text.append("g", style="white")
        return text
    def on_mount(self):
        option_list = self.query_one("#wallpaper-list", OptionList)
        for wp in self.wallpapers:
            option_list.add_option(wp.name)
        if self.wallpapers:
            self.query_one("#preview-panel", PreviewPanel).show_preview(self.wallpapers[0])
        if self.palette:
            self.query_one("#matrix-panel", MatrixPanel).update_palette(self.palette)
            self.query_one("#readability-bar", ReadabilityBar).update_from_palette(self.palette)
    def on_option_list_option_highlighted(self, event: OptionList.OptionHighlighted):
        """Handle wallpaper selection change."""
        idx = event.option_index
        if 0 <= idx < len(self.wallpapers):
            self.selected_index = idx
            self.query_one("#preview-panel", PreviewPanel).show_preview(self.wallpapers[idx])
    def action_go_back(self):
        self.app.pop_screen()
    def action_toggle_mode(self):
        topbar = self.query_one("#top-bar", TopBar)
        topbar.toggle_mode()
        self.notify(f"Mode: {topbar.mode.title()}")
    def action_selector_prev(self):
        topbar = self.query_one("#top-bar", TopBar)
        topbar.prev_option()
        if topbar.mode == "mood":
            self.notify(f"Mood: {topbar.get_mood()}")
        else:
            self.notify(f"Preset: {topbar.get_preset()}")
    def action_selector_next(self):
        topbar = self.query_one("#top-bar", TopBar)
        topbar.next_option()
        if topbar.mode == "mood":
            self.notify(f"Mood: {topbar.get_mood()}")
        else:
            self.notify(f"Preset: {topbar.get_preset()}")
    def action_toggle_gowall(self):
        topbar = self.query_one("#top-bar", TopBar)
        if topbar.mode == "preset":
            topbar.toggle_gowall()
            self.notify(f"Gowall: {'On' if topbar.gowall else 'Off'}")
        else:
            self.notify("Gowall only in Preset mode", severity="warning")
    def action_random_wallpaper(self):
        import random
        if self.wallpapers:
            idx = random.randint(0, len(self.wallpapers) - 1)
            option_list = self.query_one("#wallpaper-list", OptionList)
            option_list.highlighted = idx
    def action_apply_theme(self):
        """Apply theme for selected wallpaper."""
        if not self.wallpapers:
            self.notify("No wallpaper selected", severity="warning")
            return
        current = self.wallpapers[self.selected_index]
        topbar = self.query_one("#top-bar", TopBar)
        cmd = ["magician", "set", str(current)]
        if topbar.mode == "mood":
            mood = topbar.get_mood()
            if mood != "adaptive":
                cmd.extend(["--mood", mood])
        else:
            cmd.extend(["--preset", topbar.get_preset()])
            if topbar.gowall:
                cmd.append("--gowall")
        self.notify(f"Applying: {current.name}...")
        try:
            subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            self.session.last_wallpaper = str(current)
            save_session(self.session)
            self.notify("Theme applied!", severity="information")
        except Exception as e:
            self.notify(f"Error: {e}", severity="error")

@FILE __init__.py
from .app import MagicianApp
__all__ = ["MagicianApp"]

@FILE lab.py
"""
lab.py — TEST_LAB screen for Magician TUI
The crucible for testing palettes across anchors and moods.
"""
import os
import json
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from typing import Optional
from textual.screen import Screen
from textual.app import ComposeResult
from textual.containers import Container, Horizontal, Vertical, ScrollableContainer
from textual.widgets import Static, Label, Footer, DataTable
from textual.binding import Binding
from textual.reactive import reactive
from rich.text import Text
from .widgets import Header
from .state import XDG_CACHE_HOME
TEST_ANCHORS = {
    "Deep Purple": "#220975",
    "Sunset Orange": "#E07848",
    "Forest Green": "#2D5A3D",
    "Ocean Blue": "#1E4D6B",
    "Sakura Pink": "#D4A5A5",
    "Twilight": "#4A3B5C",
    "Desert Sand": "#C19A6B",
    "Arctic Blue": "#6B9DAD",
    "Autumn Red": "#8B3A3A",
    "Storm Gray": "#4A5568",
}
TEST_MOODS = ["adaptive", "deep", "pastel", "vibrant", "bw"]
@dataclass
class TestResult:
    """Result of a palette test."""
    anchor_name: str
    anchor_hex: str
    mood: str
    status: str  # "pass", "warn", "fail"
    contrast_ratio: float = 0.0
    palette: dict = None
def calculate_contrast(fg_hex: str, bg_hex: str) -> float:
    """Calculate WCAG contrast ratio between two colors."""
    def get_luminance(hex_color: str) -> float:
        hex_color = hex_color.lstrip("#")
        if len(hex_color) == 8:
            hex_color = hex_color[2:]
        r = int(hex_color[0:2], 16) / 255
        g = int(hex_color[2:4], 16) / 255
        b = int(hex_color[4:6], 16) / 255
        def adjust(c):
            return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
        return 0.2126 * adjust(r) + 0.7152 * adjust(g) + 0.0722 * adjust(b)
    try:
        lum1 = get_luminance(fg_hex)
        lum2 = get_luminance(bg_hex)
        lighter = max(lum1, lum2)
        darker = min(lum1, lum2)
        return (lighter + 0.05) / (darker + 0.05)
    except:
        return 0.0
def get_status_from_ratio(ratio: float) -> str:
    """Get status symbol from contrast ratio."""
    if ratio >= 7.0:
        return "✓"
    elif ratio >= 4.5:
        return "⚠"
    else:
        return "✗"
class GridCell(Static):
    """A single cell in the test grid."""
    def __init__(self, anchor: str, mood: str, status: str = "?", **kwargs):
        super().__init__(**kwargs)
        self.anchor = anchor
        self.mood = mood
        self.status = status
    def on_mount(self):
        self._update_display()
    def _update_display(self):
        mood_codes = {
            "adaptive": "ad",
            "deep": "de",
            "pastel": "pa",
            "vibrant": "vi",
            "bw": "bw"
        }
        code = mood_codes.get(self.mood, self.mood[:2])
        style = "green" if self.status == "✓" else "yellow" if self.status == "⚠" else "red" if self.status == "✗" else "dim"
        self.update(f"{code}{self.status}")
        self.styles.color = style
class InspectorPanel(Static):
    """Panel showing details of selected test result."""
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.current_result: Optional[TestResult] = None
    def update_result(self, result: TestResult):
        """Update the inspector with a test result."""
        self.current_result = result
        self._refresh_display()
    def _refresh_display(self):
        if not self.current_result:
            self.update("[dim]Select a cell to inspect[/dim]")
            return
        r = self.current_result
        lines = []
        lines.append(f"[bold]Inspector: {r.anchor_name} + {r.mood}[/bold]")
        lines.append("┌────────────────────────────────────────┐")
        lines.append(f"│ Anchor: {r.anchor_name} ({r.anchor_hex})")
        lines.append(f"│ Mood: {r.mood}")
        lines.append(f"│ Status: {r.status} (Contrast: {r.contrast_ratio:.1f}:1)")
        lines.append("└────────────────────────────────────────┘")
        if r.palette:
            lines.append("")
            lines.append("[bold]Palette:[/bold]")
            for key in ["bg", "fg", "ui_prim", "sem_red", "sem_green"]:
                if key in r.palette:
                    lines.append(f"  ⣿ {r.palette[key]} {key}")
        self.update("\n".join(lines))
class LabScreen(Screen):
    """The Test Lab screen for batch palette testing."""
    BINDINGS = [
        Binding("q", "go_back", "Back", show=True),
        Binding("escape", "go_back", "Back", show=False),
        Binding("s", "start_tests", "Start", show=True),
        Binding("x", "export_results", "Export", show=True),
        Binding("up", "cursor_up", show=False),
        Binding("down", "cursor_down", show=False),
        Binding("left", "cursor_left", show=False),
        Binding("right", "cursor_right", show=False),
    ]
    CSS = """
    LabScreen {
        layout: grid;
        grid-size: 1;
        grid-rows: 3 1fr 3;
    }
        height: 3;
        border: round $primary;
        padding: 0 1;
    }
        layout: horizontal;
    }
        width: 40;
        border: round $surface;
        padding: 1;
    }
        width: 1fr;
        border: round $surface;
        padding: 1;
    }
        height: 3;
        border: round $surface;
        padding: 0 1;
    }
    DataTable {
        height: 100%;
    }
    DataTable > .datatable--cursor {
        background: $primary 40%;
    }
    """
    def __init__(self):
        super().__init__()
        self.results: dict[tuple[str, str], TestResult] = {}
        self.status = "Ready"
    def compose(self) -> ComposeResult:
        with Container(id="header-bar"):
            yield Static(self._build_header())
        with Horizontal(id="content-area"):
            with Container(id="grid-panel"):
                table = DataTable(id="test-grid")
                table.cursor_type = "cell"
                yield table
            with Vertical(id="inspector-panel"):
                yield InspectorPanel(id="inspector")
        with Container(id="footer-bar"):
            yield Static(self._build_footer())
        yield Footer()
    def _build_header(self) -> Text:
        text = Text()
        text.append("🔬 ", style="blue")
        text.append("Test Lab", style="bold blue")
        text.append(f"  [Anchors:{len(TEST_ANCHORS)}]", style="dim")
        text.append(f"  [Moods:{len(TEST_MOODS)}]", style="dim")
        text.append(f"  [Status:{self.status}]", style="cyan")
        text.append("  [?][q]", style="dim")
        return text
    def _build_footer(self) -> Text:
        text = Text()
        text.append("[Nav]", style="cyan")
        text.append("↑↓←→ ", style="white")
        text.append("[Start]", style="cyan")
        text.append("s ", style="white")
        text.append("[Export]", style="cyan")
        text.append("x ", style="white")
        text.append("[Back]", style="cyan")
        text.append("q", style="white")
        return text
    def on_mount(self):
        table = self.query_one("#test-grid", DataTable)
        table.add_column("Anchor", key="anchor")
        for mood in TEST_MOODS:
            code = mood[:2]
            table.add_column(code, key=mood)
        for anchor_name in TEST_ANCHORS:
            row = [anchor_name[:10]]  # Truncated name
            for mood in TEST_MOODS:
                row.append("?")  # Placeholder
            table.add_row(*row, key=anchor_name)
    def on_data_table_cell_selected(self, event: DataTable.CellSelected):
        """Handle cell selection in the grid."""
        table = self.query_one("#test-grid", DataTable)
        row_key = event.cell_key.row_key
        col_key = event.cell_key.column_key
        if row_key and col_key and col_key.value != "anchor":
            anchor_name = row_key.value
            mood = col_key.value
            result = self.results.get((anchor_name, mood))
            if result:
                inspector = self.query_one("#inspector", InspectorPanel)
                inspector.update_result(result)
    def action_go_back(self):
        self.app.pop_screen()
    def action_start_tests(self):
        """Run tests for all anchors and moods."""
        self.status = "Running..."
        self._update_header()
        self.notify("Starting tests...", severity="information")
        table = self.query_one("#test-grid", DataTable)
        for anchor_name, anchor_hex in TEST_ANCHORS.items():
            for mood in TEST_MOODS:
                fg = "#ffffff" if self._is_dark(anchor_hex) else "#000000"
                ratio = calculate_contrast(fg, anchor_hex)
                status = get_status_from_ratio(ratio)
                result = TestResult(
                    anchor_name=anchor_name,
                    anchor_hex=anchor_hex,
                    mood=mood,
                    status=status,
                    contrast_ratio=ratio,
                    palette={"bg": anchor_hex, "fg": fg}
                )
                self.results[(anchor_name, mood)] = result
                mood_idx = TEST_MOODS.index(mood) + 1  # +1 for anchor column
                table.update_cell(anchor_name, mood, status)
        self.status = "Complete"
        self._update_header()
        self.notify("Tests complete!", severity="information")
    def _is_dark(self, hex_color: str) -> bool:
        """Check if a color is dark."""
        hex_color = hex_color.lstrip("#")
        r = int(hex_color[0:2], 16)
        g = int(hex_color[2:4], 16)
        b = int(hex_color[4:6], 16)
        luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
        return luminance < 0.5
    def _update_header(self):
        header = self.query_one("#header-bar Static", Static)
        header.update(self._build_header())
    def action_cursor_up(self):
        table = self.query_one("#test-grid", DataTable)
        table.action_cursor_up()
    def action_cursor_down(self):
        table = self.query_one("#test-grid", DataTable)
        table.action_cursor_down()
    def action_cursor_left(self):
        table = self.query_one("#test-grid", DataTable)
        table.action_cursor_left()
    def action_cursor_right(self):
        table = self.query_one("#test-grid", DataTable)
        table.action_cursor_right()
    def action_export_results(self):
        """Export test results to markdown."""
        if not self.results:
            self.notify("No results to export. Run tests first.", severity="warning")
            return
        export_path = XDG_CACHE_HOME / "theme-engine" / "lab_results.md"
        lines = ["# Test Lab Results", ""]
        lines.append(f"Generated: {__import__('datetime').datetime.now().isoformat()}")
        lines.append("")
        header = "| Anchor | " + " | ".join(TEST_MOODS) + " |"
        separator = "|--------|" + "|".join(["----"] * len(TEST_MOODS)) + "|"
        lines.append(header)
        lines.append(separator)
        for anchor_name in TEST_ANCHORS:
            row = f"| {anchor_name} |"
            for mood in TEST_MOODS:
                result = self.results.get((anchor_name, mood))
                status = result.status if result else "?"
                row += f" {status} |"
            lines.append(row)
        try:
            export_path.parent.mkdir(parents=True, exist_ok=True)
            export_path.write_text("\n".join(lines))
            self.notify(f"Exported to {export_path}", severity="information")
        except Exception as e:
            self.notify(f"Export failed: {e}", severity="error")

@FILE main_menu.py
"""
main_menu.py — MAIN screen for Magician TUI
The gateway screen with logo, navigation, and recent theme info.
"""
from textual.screen import Screen
from textual.app import ComposeResult
from textual.containers import Container, Horizontal, Vertical, Center
from textual.widgets import Static, Footer
from textual.binding import Binding
from rich.text import Text
from pathlib import Path
from .widgets import Logo, LOGO_LINES
from .state import load_session
class MainMenu(Screen):
    """Main menu screen - the gateway."""
    BINDINGS = [
        Binding("1", "goto_forge", "Forge", show=True),
        Binding("2", "goto_forge", "Gowall", show=True),  # Same as forge, different mode
        Binding("3", "goto_lab", "Lab", show=True),
        Binding("4", "goto_favorites", "Favorites", show=True),
        Binding("5", "goto_settings", "Settings", show=True),
        Binding("q", "quit", "Quit", show=True),
        Binding("?", "help", "Help", show=True),
        Binding("enter", "apply_recent", "Apply Recent", show=False),
    ]
    DEFAULT_CSS = """
    MainMenu {
        align: center middle;
    }
        width: 70;
        height: auto;
        border: round $primary;
        padding: 0;
    }
        width: 100%;
        height: 1;
        background: $surface;
        text-align: center;
    }
        width: 100%;
        height: 1;
        text-align: center;
        margin: 0;
        padding: 0;
    }
        width: 100%;
        height: 1;
        text-align: center;
        color: $text-muted;
        margin: 1 0;
    }
        width: 100%;
        height: auto;
        align: center middle;
        margin: 1 0;
    }
        width: 100%;
        height: 1;
        text-align: center;
        color: $text-muted;
        margin-top: 1;
    }
    .separator {
        width: 100%;
        height: 1;
        background: $surface;
    }
    """
    def __init__(self):
        super().__init__()
        self.session = load_session()
    def compose(self) -> ComposeResult:
        with Container(id="main-container"):
            yield Static(self._build_header(), id="header")
            yield Static("", classes="separator")
            yield Static(self._build_nav(), id="nav-row")
            yield Static(self._build_recent(), id="recent-row")
            yield Static("", classes="separator")
            with Center(id="logo-container"):
                yield Logo(color=self.session.primary_color)
            yield Static("Press 1-5 or ? for help", id="hint")
    def _build_header(self) -> Text:
        text = Text()
        text.append("🔮 ", style="bold")
        text.append("MAGICAL", style="bold magenta")
        text.append("  v2.2  ", style="dim")
        text.append("[nixos@wayland]", style="cyan")
        text.append("  [?]  [q:Quit]", style="dim")
        return text
    def _build_nav(self) -> Text:
        text = Text()
        text.append("[1]", style="cyan")
        text.append("⚡Forge ", style="yellow")
        text.append("[2]", style="cyan")
        text.append("🎨Gowall ", style="green")
        text.append("[3]", style="cyan")
        text.append("🔬Lab ", style="blue")
        text.append("[4]", style="cyan")
        text.append("⭐Fav ", style="yellow")
        text.append("[5]", style="cyan")
        text.append("⚙️ Settings", style="white")
        return text
    def _build_recent(self) -> Text:
        if not self.session.last_wallpaper:
            return Text("No recent theme", style="dim")
        text = Text()
        wallpaper_name = Path(self.session.last_wallpaper).name if self.session.last_wallpaper else "none"
        if len(wallpaper_name) > 20:
            wallpaper_name = wallpaper_name[:8] + "…" + wallpaper_name[-8:]
        text.append("Recent: ", style="dim")
        text.append(wallpaper_name, style="white")
        if self.session.last_preset:
            text.append(" + ", style="dim")
            text.append(self.session.last_preset, style="magenta")
        elif self.session.last_mood:
            text.append(" + ", style="dim")
            text.append(self.session.last_mood, style="cyan")
        if self.session.gowall_enabled:
            text.append(" [Gowall:✓]", style="green")
        text.append(" [Enter:▶]", style="dim")
        return text
    def action_goto_forge(self):
        self.app.push_screen("forge")
    def action_goto_lab(self):
        self.app.push_screen("lab")
    def action_goto_favorites(self):
        self.app.push_screen("favorites")
    def action_goto_settings(self):
        self.notify("Settings not implemented yet", severity="warning")
    def action_help(self):
        self.notify("Help overlay not implemented yet", severity="information")
    def action_apply_recent(self):
        if self.session.last_wallpaper:
            self.notify(f"Would apply: {self.session.last_wallpaper}", severity="information")
        else:
            self.notify("No recent theme to apply", severity="warning")
    def action_quit(self):
        self.app.exit()

@FILE state.py
"""
state.py — Session persistence for Magician TUI
Loads/saves session state to ~/.cache/theme-engine/session.json
"""
import json
import os
from pathlib import Path
from dataclasses import dataclass, field, asdict
from typing import Optional
XDG_CACHE_HOME = Path(os.environ.get("XDG_CACHE_HOME", Path.home() / ".cache"))
SESSION_FILE = XDG_CACHE_HOME / "theme-engine" / "session.json"
PALETTE_FILE = XDG_CACHE_HOME / "theme-engine" / "palette.json"
@dataclass
class SessionState:
    """TUI session state."""
    current_screen: str = "MAIN"
    last_wallpaper: Optional[str] = None
    last_mood: str = "adaptive"
    last_preset: Optional[str] = None
    gowall_enabled: bool = False
    primary_color: str = "#888888"  # For logo coloring
def load_session() -> SessionState:
    """Load session from disk, or return defaults."""
    state = SessionState()
    if SESSION_FILE.exists():
        try:
            with open(SESSION_FILE) as f:
                data = json.load(f)
                state.current_screen = data.get("current_screen", "MAIN")
                state.last_wallpaper = data.get("last_wallpaper")
                state.last_mood = data.get("last_mood", "adaptive")
                state.last_preset = data.get("last_preset")
                state.gowall_enabled = data.get("gowall_enabled", False)
        except Exception:
            pass
    if PALETTE_FILE.exists():
        try:
            with open(PALETTE_FILE) as f:
                palette = json.load(f)
                colors = palette.get("colors", {})
                state.primary_color = colors.get("ui_prim", "#888888")
        except Exception:
            pass
    return state
def save_session(state: SessionState):
    """Save session to disk."""
    SESSION_FILE.parent.mkdir(parents=True, exist_ok=True)
    try:
        with open(SESSION_FILE, "w") as f:
            json.dump(asdict(state), f, indent=2)
    except Exception:
        pass

@FILE widgets.py
"""
widgets.py — Shared TUI components for Magician
"""
from textual.widget import Widget
from textual.app import ComposeResult
from textual.widgets import Static
from rich.text import Text
LOGO_LINES = [
    "███╗   ███╗ █████╗  ██████╗ ██╗ ██████╗██╗ █████╗ ███╗   ██╗",
    "████╗ ████║██╔══██╗██╔════╝ ██║██╔════╝██║██╔══██╗████╗  ██║",
    "██╔████╔██║███████║██║  ███╗██║██║     ██║███████║██╔██╗ ██║",
    "██║╚██╔╝██║██╔══██║██║   ██║██║██║     ██║██╔══██║██║╚██╗██║",
    "██║ ╚═╝ ██║██║  ██║╚██████╔╝██║╚██████╗██║██║  ██║██║ ╚████║",
    "╚═╝     ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝ ╚═════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝",
]
class Logo(Static):
    """The MAGICIAN ASCII logo, colored with the primary theme color."""
    DEFAULT_CSS = """
    Logo {
        width: 100%;
        height: auto;
        content-align: center middle;
        text-align: center;
    }
    """
    def __init__(self, color: str = "#888888", **kwargs):
        super().__init__(**kwargs)
        self.color = color
    def compose(self) -> ComposeResult:
        return []
    def on_mount(self):
        self.update_logo()
    def update_logo(self, color: str = None):
        if color:
            self.color = color
        text = Text()
        for line in LOGO_LINES:
            text.append(line + "\n", style=self.color)
        self.update(text)
class KeyHint(Static):
    """Footer key hint in format [Action]key"""
    DEFAULT_CSS = """
    KeyHint {
        text-align: center;
        color: $text-muted;
    }
    """
class Header(Static):
    """Screen header with title and badges."""
    DEFAULT_CSS = """
    Header {
        dock: top;
        height: 1;
        background: $surface;
        color: $text;
        text-align: center;
        padding: 0 1;
    }
    """

@DIR modules/home/theme/daemon
@FILE orchestrator.py
import sys
import json
import time
import signal
import os
from pathlib import Path
try:
    import tomllib
except ImportError:
    import tomli as tomllib
HOME = Path.home()
CONFIG_DIR = HOME / ".config" / "lis-os" / "config.d"
DEV_SOURCE_DIR = HOME / "Lis-os" / "modules" / "home" / "desktop" / "astal"
CACHE_DIR = HOME / ".cache" / "theme-engine"
PALETTE_FILE = CACHE_DIR / "palette.json"
SIGNAL_FILE = CACHE_DIR / "signal"
ASTAL_CONFIG = HOME / ".run" / "lis-os" / "config.json"
GTK_CSS = HOME / ".cache" / "wal" / "ags-colors.css"
ASTAL_CONFIG.parent.mkdir(parents=True, exist_ok=True)
GTK_CSS.parent.mkdir(parents=True, exist_ok=True)
def load_palette():
    """Load the colors generated by the bash engine."""
    if not PALETTE_FILE.exists():
        return {}
    try:
        with open(PALETTE_FILE, "r") as f:
            data = json.load(f)
            return data.get("colors", {})
    except Exception as e:
        print(f"Error loading palette: {e}", file=sys.stderr, flush=True)
        return {}
def generate_css(palette):
    """Generate valid GTK3 CSS from the palette."""
    css = "/* Generated by lis-daemon */\n"
    for key, hex_val in palette.items():
        css += f"@define-color {key} {hex_val};\n"
    with open(GTK_CSS, "w") as f:
        f.write(css)
def merge_configs():
    """Merge all TOML files in config.d into a single JSON."""
    final_config = {}
    if not CONFIG_DIR.exists():
        print(f"Config dir {CONFIG_DIR} does not exist. Skipping merge.", flush=True)
        with open(ASTAL_CONFIG, "w") as f:
            json.dump({}, f)
        return
    toml_files = sorted(CONFIG_DIR.glob("*.toml"))
    if not toml_files:
        pass
    for path in toml_files:
        try:
            with open(path, "rb") as f:
                data = tomllib.load(f)
                final_config.update(data)
        except Exception as e:
            print(f"Failed to parse {path.name}: {e}", file=sys.stderr, flush=True)
    print(f"Merged Keys: {list(final_config.keys())}", flush=True)
    with open(ASTAL_CONFIG, "w") as f:
        json.dump(final_config, f, indent=2)
    print(f"Generated Config at {ASTAL_CONFIG}", flush=True)
def update_all():
    print(f"[{time.strftime('%H:%M:%S')}] Detected change. Updating...", flush=True)
    palette = load_palette()
    generate_css(palette)
    merge_configs()
    SIGNAL_FILE.touch()
def get_combined_mtime(paths):
    """Get the max mtime of all files in the given paths (recursive)."""
    max_mtime = 0
    for path in paths:
        if not path.exists():
            continue
        if path.is_file():
            max_mtime = max(max_mtime, path.stat().st_mtime)
        elif path.is_dir():
            for root, _, files in os.walk(path):
                for f in files:
                    if f.endswith(".toml"):  # Only watch toml for efficiency
                        full_path = Path(root) / f
                        max_mtime = max(max_mtime, full_path.stat().st_mtime)
    return max_mtime
def main():
    print("Starting Lis-OS Orchestrator (Polling Mode)...", flush=True)
    watch_targets = [CONFIG_DIR]
    dev_config_file = DEV_SOURCE_DIR / "default.toml"
    if dev_config_file.exists():
        watch_targets.append(dev_config_file)
        print(f"Watching Dev Source File: {dev_config_file}", flush=True)
    update_all()
    last_mtime = get_combined_mtime(watch_targets)
    while True:
        try:
            current_mtime = get_combined_mtime(watch_targets)
            if current_mtime > last_mtime:
                last_mtime = current_mtime
                update_all()
            time.sleep(1)
        except KeyboardInterrupt:
            break
        except Exception as e:
            print(f"Polling error: {e}", file=sys.stderr, flush=True)
            time.sleep(5)
if __name__ == "__main__":
    signal.signal(signal.SIGINT, lambda s, f: sys.exit(0))
    main()

@FILE package.nix
{ pkgs, ... }:
pkgs.writers.writePython3Bin "lis-daemon" {
  libraries = [
    pkgs.python3Packages.watchfiles
  ];
  flakeIgnore = [ "E501" ]; # Ignore line length errors
} (builtins.readFile ./orchestrator.py)

@DIR modules/home/theme
@FILE default.nix
{
  pkgs,
  config,
  lib,
  ...
}:
let
  themePkgs = pkgs.callPackage ./packages.nix { inherit config; };
in
{
  home.packages = with themePkgs; [
    engineScript
    compareScript
    testScript
    daemonScript
    magicianScript
    precacheScript
    pkgs.jq
    pkgs.swww
    pkgs.gowall # Make gowall available interactively
  ];
  systemd.user.services.lis-daemon = {
    Unit = {
      Description = "Lis-OS Configuration Orchestrator";
      After = [ "graphical-session-pre.target" ];
      PartOf = [ "graphical-session.target" ];
    };
    Service = {
      ExecStart = "${themePkgs.daemonScript}/bin/lis-daemon";
      Restart = "on-failure";
      RestartSec = "5s";
    };
    Install = {
      WantedBy = [ "graphical-session.target" ];
    };
  };
  imports = [
    ./gtk.nix
    ./qt.nix
    ./stylix/stylix.nix
  ];
  xdg.configFile."theme-engine/moods.json".source = ./config/moods.json;
  xdg.configFile."theme-engine/templates/kitty.conf".source = ./templates/kitty.conf;
  xdg.configFile."theme-engine/templates/starship.toml".source = ./templates/starship.toml;
  xdg.configFile."theme-engine/templates/rofi.rasi".source = ./templates/rofi.rasi;
  xdg.configFile."theme-engine/templates/ags-colors.css".source = ./templates/ags-colors.css;
  xdg.configFile."theme-engine/templates/zed.json".source = ./templates/zed.template;
  xdg.configFile."theme-engine/templates/vesktop.css".source = ./templates/vesktop.template;
  xdg.configFile."theme-engine/templates/niri.kdl".source = ./templates/niri.kdl;
  xdg.configFile."theme-engine/templates/gtk.css".source = ./templates/gtk.css;
  xdg.configFile."theme-engine/templates/wezterm.lua".source = ./templates/wezterm.lua;
  xdg.configFile."theme-engine/templates/antigravity.template".source =
    ./templates/antigravity.template;
  xdg.configFile."theme-engine/templates/zellij.kdl".source = ./templates/zellij.kdl;
  xdg.configFile."theme-engine/templates/colors.sh".source = ./templates/colors.sh;
}

@FILE gtk.nix
{ pkgs, ... }:
{
  gtk = {
    enable = true;
    iconTheme = {
      name = "Tela-purple-dark";
      package = pkgs.tela-icon-theme;
    };
    gtk3.extraConfig = {
      gtk-application-prefer-dark-theme = 1;
    };
    gtk4.extraConfig = {
      gtk-application-prefer-dark-theme = 1;
    };
  };
  dconf.settings = {
    "org/gnome/desktop/interface" = {
      color-scheme = "prefer-dark";
    };
  };
}

@FILE packages.nix
{ pkgs, config, ... }:
let
  pythonEnv = pkgs.python3.withPackages (ps: [
    ps.pygobject3
    ps.pycairo
  ]);
  typelibPath = pkgs.lib.makeSearchPathOutput "lib" "lib/girepository-1.0" [
    pkgs.gtk3
    pkgs.pango
    pkgs.gdk-pixbuf
    pkgs.atk
    pkgs.harfbuzz
    pkgs.gobject-introspection
  ];
  resolveIconsScript = pkgs.writeShellScriptBin "resolve-icons" ''
    export GI_TYPELIB_PATH="${typelibPath}:$GI_TYPELIB_PATH"
    export XDG_DATA_DIRS="$XDG_DATA_DIRS"
    ${pythonEnv}/bin/python3 ${./core/resolve_icons.py}
  '';
  runtimeDeps = [
    pkgs.coreutils
    pkgs.jq
    pkgs.gowall
    pkgs.swww
    pkgs.libnotify
    pkgs.procps
    pkgs.gnused
    pkgs.findutils
    pkgs.gnugrep
    pkgs.gawk
    pkgs.bc
    pkgs.chafa
    resolveIconsScript
    magicianScript
  ];
  engineScript = pkgs.writeShellScriptBin "theme-engine" ''
    export PATH=${pkgs.lib.makeBinPath runtimeDeps}:$PATH
    if [ $# -eq 0 ]; then
      exec magician
    else
      exec magician set "$@"
    fi
  '';
  daemonScript = pkgs.writeShellScriptBin "lis-daemon" ''
    export PATH=${pkgs.lib.makeBinPath runtimeDeps}:$PATH
    exec magician daemon
  '';
  compareScript = pkgs.writeShellScriptBin "theme-compare" ''
    export PATH=${pkgs.lib.makeBinPath runtimeDeps}:$PATH
    exec magician compare "$@"
  '';
  testScript = pkgs.writeShellScriptBin "theme-test" ''
    export PATH=${pkgs.lib.makeBinPath runtimeDeps}:$PATH
    exec magician test "$@"
  '';
  precacheScript = pkgs.writeShellScriptBin "theme-precache" ''
    export PATH=${pkgs.lib.makeBinPath runtimeDeps}:$PATH
    exec magician precache "$@"
  '';
  magicianEnv = pkgs.python3.withPackages (ps: [
    ps.pillow
    ps.jinja2
    ps.watchfiles
    ps.tomli
    ps.pydantic
    ps.coloraide
    ps.blake3 # For wallpaper hash caching
    ps.numpy # Array math
    ps.opencv4 # Saliency detection, FFT
    ps.scikit-learn # K-Means clustering
    ps.scipy # Optimization (optional)
    ps.textual # TUI Framework
  ]);
  magicianScript = pkgs.writeShellScriptBin "magician" ''
    export PYTHONPATH="${./.}:$PYTHONPATH"
    ${magicianEnv}/bin/python3 ${./core/magician.py} "$@"
  '';
in
{
  inherit
    daemonScript
    magicianScript
    engineScript
    compareScript
    testScript
    precacheScript
    ;
}

@FILE qt.nix
_: {
  qt = {
    enable = true;
  };
}

@DIR modules/home/theme/stylix
@FILE stylix.nix
{ pkgs, ... }:
let
  wallpaperPath = ./wallpaper.jpg;
in
{
  stylix = {
    enable = true;
    image = wallpaperPath;
    autoEnable = false;
    targets.gtk.enable = false;
    targets.kitty.enable = false;
    polarity = "dark";
    cursor = {
      package = pkgs.bibata-cursors;
      name = "Bibata-Modern-Ice";
      size = 24;
    };
    fonts = {
      monospace = {
        package = pkgs.nerd-fonts.jetbrains-mono;
        name = "JetBrains Mono";
      };
      sansSerif = {
        package = pkgs.montserrat;
        name = "Montserrat";
      };
      serif = {
        package = pkgs.montserrat;
        name = "Montserrat";
      };
      sizes = {
        applications = 12;
        terminal = 15;
        desktop = 11;
        popups = 12;
      };
    };
  };
}

@DIR modules/home/theme/templates
@FILE antigravity.template
{
  "name": "LisTheme",
  "type": "dark",
  "colors": {
    "activityBar.background": "{ui_sec}",
    "activityBar.foreground": "{fg}",
    "editor.background": "{bg}",
    "editor.foreground": "{fg}",
    "editor.lineHighlightBackground": "{ui_sec}",
    "editorCursor.foreground": "{ui_prim}",
    "editorIndentGuide.background": "{surface}",
    "editorLineNumber.foreground": "{fg_dim}",
    "sideBar.background": "{bg}",
    "sideBar.foreground": "{fg}",
    "statusBar.background": "{ui_sec}",
    "statusBar.foreground": "{fg}",
    "tab.activeBackground": "{ui_sec}",
    "tab.activeForeground": "{fg}",
    "tab.inactiveBackground": "{bg}",
    "tab.inactiveForeground": "{fg_dim}",
    "titleBar.activeBackground": "{bg}",
    "titleBar.activeForeground": "{fg}",
    "terminal.background": "{bg}",
    "terminal.foreground": "{fg}",
    "terminal.ansiBlack": "{bg}",
    "terminal.ansiRed": "{sem_red}",
    "terminal.ansiGreen": "{sem_green}",
    "terminal.ansiYellow": "{sem_yellow}",
    "terminal.ansiBlue": "{sem_blue}",
    "terminal.ansiMagenta": "{syn_acc}",
    "terminal.ansiCyan": "{syn_fun}",
    "terminal.ansiWhite": "{fg}",
    "terminal.ansiBrightBlack": "{fg_dim}",
    "terminal.ansiBrightRed": "{sem_red}",
    "terminal.ansiBrightGreen": "{sem_green}",
    "terminal.ansiBrightYellow": "{sem_yellow}",
    "terminal.ansiBrightBlue": "{sem_blue}",
    "terminal.ansiBrightMagenta": "{syn_acc}",
    "terminal.ansiBrightCyan": "{syn_fun}",
    "terminal.ansiBrightWhite": "{fg}"
  },
  "tokenColors": [
    {
      "scope": "comment",
      "settings": {
        "foreground": "{fg_dim}",
        "fontStyle": "italic"
      }
    },
    {
      "scope": "keyword",
      "settings": {
        "foreground": "{syn_key}",
        "fontStyle": "bold"
      }
    },
    {
      "scope": ["storage", "storage.type"],
      "settings": {
        "foreground": "{syn_key}"
      }
    },
    {
      "scope": ["entity.name.function", "support.function"],
      "settings": {
        "foreground": "{syn_fun}",
        "fontStyle": "bold"
      }
    },
    {
      "scope": "string",
      "settings": {
        "foreground": "{syn_str}"
      }
    },
    {
      "scope": "constant.numeric",
      "settings": {
        "foreground": "{syn_acc}"
      }
    },
    {
      "scope": "variable",
      "settings": {
        "foreground": "{fg}"
      }
    }
  ]
}

@FILE colors.sh
wallpaper="{{ wallpaper }}"
background='{{ colors.bg }}'
foreground='{{ colors.fg }}'
cursor='{{ colors.fg }}'
color0='{{ colors.bg }}'
color1='{{ colors.sem_red }}'
color2='{{ colors.syn_acc }}'
color3='{{ colors.ui_sec }}'
color4='{{ colors.ui_prim }}'
color5='{{ colors.syn_acc }}'
color6='{{ colors.ui_sec }}'
color7='{{ colors.fg }}'
color8='{{ colors.ui_sec }}'
color9='{{ colors.sem_red }}'
color10='{{ colors.syn_acc }}'
color11='{{ colors.ui_sec }}'
color12='{{ colors.ui_prim }}'
color13='{{ colors.syn_acc }}'
color14='{{ colors.ui_sec }}'
color15='{{ colors.fg }}'
export FZF_DEFAULT_OPTS="
    $FZF_DEFAULT_OPTS
    --color fg:{{ colors.fg }},bg:{{ colors.bg }},hl:{{ colors.ui_prim }}
    --color fg+:{{ colors.fg }},bg+:{{ colors.ui_sec }},hl+:{{ colors.ui_prim }}
    --color info:{{ colors.syn_acc }},prompt:{{ colors.ui_prim }},pointer:{{ colors.syn_acc }}
    --color marker:{{ colors.syn_acc }},spinner:{{ colors.syn_acc }},header:{{ colors.ui_prim }}
"

@FILE kitty.conf
foreground {fg}
background {bg}
cursor     {ui_prim}
color0  {bg}
color8  {ui_sec}
color1  {sem_red}
color9  {sem_red}
color2  {sem_green}
color10 {sem_green}
color3  {sem_yellow}
color11 {sem_yellow}
color4  {sem_blue}
color12 {sem_blue}
color5  {syn_acc}
color13 {syn_acc}
color6  {syn_fun}
color14 {syn_fun}
color7  {fg}
color15 {fg}

@FILE niri.kdl
window-rule {
    border {
        active-color "{ui_prim}"
        inactive-color "{ui_sec}"
        width 2
    }
}

@FILE rofi.rasi
* {
    background:     {bg};
    background-alt: {ui_sec};
    foreground:     {fg};
    foreground-muted: {fg_muted}; /* Fixed missing variable */
    selected:       {ui_prim};
    text-selected:  {bg};
    active:         {syn_key};
    urgent:         {sem_red};
}

@FILE starship.toml
add_newline = false
[directory]
style = "bold {syn_key}"
format = "[$path]($style)[$read_only]($read_only_style) "
[character]
success_symbol = "[❯](bold {sem_green})"
error_symbol = "[❯](bold {sem_red})"
vimcmd_symbol = "[❮]({sem_blue})"
[nix_shell]
format = "[$symbol]($style) "
symbol = "🐚"
style = "{ui_prim}"
[git_branch]
symbol = " "
format = "[]({ui_sec})on [$symbol$branch]($style)[]({ui_sec}) "
style = "fg:{syn_fun} bg:{ui_sec}"
[git_status]
style = "{sem_yellow}"
stashed = "≡"
[git_state]
style = "{fg_dim}"
format = "([$state( $progress_current/$progress_total)]($style)) "

@FILE vesktop.template
/** Generated by theme-engine - Nuclear Mode **/
:root {
    /* Define variables for text/accents (These usually work fine) */
    --text-normal: {fg} !important;
    --text-muted: {fg_dim} !important;
    --header-primary: {syn_key} !important;
    --brand-experiment: {ui_prim} !important;
    --interactive-active: {ui_prim} !important;
    --interactive-hover: {fg} !important;
}
/* 1. THE ROOT (Force the main background) */
    background-color: {bg} !important;
    background: {bg} !important;
}
/* 2. THE CHAT AREA (Force transparency so Root shows through) */
div[class*="chat_"],
div[class*="chatContent_"],
div[class*="scroller_"] {
    background: transparent !important;
    background-color: transparent !important;
}
/* 3. THE SIDEBAR (Server list is usually left of this) */
div[class*="sidebar_"] {
    background: {ui_sec} !important;
}
/* 4. THE MEMBER LIST (Right side) */
div[class*="container_"][class*="themed_"] {
    background: {ui_sec} !important;
}
div[class*="members_"] {
    background: transparent !important;
}
/* 5. PANELS (User profile bottom left) */
section[class*="panels_"] {
    background-color: {ui_sec} !important;
}
/* 6. SEARCH BAR & INPUTS */
div[class*="searchBar_"] {
    background-color: {bg} !important;
}
div[class*="channelTextArea_"] {
    background-color: {ui_sec} !important;
}
/* 7. SCROLLBARS */
::-webkit-scrollbar-thumb {
    background-color: {ui_prim} !important;
    border-color: transparent !important;
}
::-webkit-scrollbar-track {
    background-color: {ui_sec} !important;
}

@FILE wezterm.lua
return {
  foreground = "{fg}",
  background = "{bg}",
  cursor_bg = "{ui_prim}",
  cursor_fg = "{bg}",
  cursor_border = "{ui_prim}",
  selection_fg = "{fg}",
  selection_bg = "{ui_sec}",
  scrollbar_thumb = "{surface}",
  split = "{surfaceLighter}",
  ansi = {
    "{surface}",       -- Black
    "{sem_red}",       -- Red
    "{sem_green}",     -- Green
    "{sem_yellow}",    -- Yellow
    "{sem_blue}",      -- Blue
    "{syn_key}",       -- Magenta
    "{syn_str}",       -- Cyan
    "{fg}",            -- White
  },
  brights = {
    "{surfaceLighter}", -- Bright Black
    "{sem_red}",        -- Bright Red
    "{sem_green}",      -- Bright Green
    "{sem_yellow}",     -- Bright Yellow
    "{sem_blue}",       -- Bright Blue
    "{syn_key}",        -- Bright Magenta
    "{syn_str}",        -- Bright Cyan
    "{fg}",             -- Bright White
  },
}

@FILE zed.template
{
  "$schema": "https://zed.dev/schema/themes/v0.1.0.json",
  "name": "LisTheme",
  "author": "Lis",
  "themes": [
    {
      "name": "LisTheme",
      "appearance": "dark",
      "style": {
        "border": "{ui_sec}",
        "border.variant": "{ui_sec}",
        "elevated_surface.background": "{bg}",
        "surface.background": "{bg}",
        "editor.background": "{bg}",
        "editor.foreground": "{fg}",
        "editor.active_line.background": "{ui_sec}",
        "editor.line_number": "{fg_dim}",
        "editor.active_line_number": "{ui_prim}",
        "tab_bar.background": "{bg}",
        "tab.inactive_background": "{bg}",
        "tab.active_background": "{ui_sec}",
        "toolbar.background": "{bg}",
        "status_bar.background": "{ui_sec}",
        "panel.background": "{bg}",
        "terminal.background": "{bg}",
        "terminal.ansi.black": "{bg}",
        "terminal.ansi.red": "{sem_red}",
        "terminal.ansi.green": "{sem_green}",
        "terminal.ansi.yellow": "{sem_yellow}",
        "terminal.ansi.blue": "{sem_blue}",
        "terminal.ansi.magenta": "{syn_acc}",
        "terminal.ansi.cyan": "{syn_fun}",
        "terminal.ansi.white": "{fg}",
        "terminal.ansi.bright_black": "{fg_dim}",
        "terminal.ansi.bright_red": "{sem_red}",
        "terminal.ansi.bright_green": "{sem_green}",
        "terminal.ansi.bright_yellow": "{sem_yellow}",
        "terminal.ansi.bright_blue": "{sem_blue}",
        "terminal.ansi.bright_magenta": "{syn_acc}",
        "terminal.ansi.bright_cyan": "{syn_fun}",
        "terminal.ansi.bright_white": "{fg}",
        "conflict": "{sem_yellow}",
        "created": "{sem_green}",
        "deleted": "{sem_red}",
        "error": "{sem_red}",
        "hidden": "{fg_dim}",
        "hint": "{fg_dim}",
        "ignored": "{fg_dim}",
        "info": "{sem_blue}",
        "modified": "{sem_yellow}",
        "predictive": "{fg_dim}",
        "renamed": "{sem_yellow}",
        "success": "{sem_green}",
        "unreachable": "{fg_dim}",
        "warning": "{sem_yellow}",
        "syntax": {
          "comment": { "color": "{fg_dim}", "font_style": "italic" },
          "doc_comment": { "color": "{fg_dim}", "font_style": "italic" },
          "keyword": { "color": "{syn_key}", "font_weight": 700 },
          "type": { "color": "{syn_fun}", "font_weight": 700 },
          "function": { "color": "{syn_fun}", "font_weight": 700 },
          "method": { "color": "{syn_fun}", "font_weight": 700 },
          "string": { "color": "{syn_str}" },
          "string.escape": { "color": "{syn_acc}" },
          "string.regex": { "color": "{syn_acc}" },
          "property": { "color": "{fg}" },
          "variable": { "color": "{fg}" },
          "variable.special": { "color": "{syn_acc}" },
          "number": { "color": "{syn_acc}" },
          "boolean": { "color": "{syn_acc}" },
          "constant": { "color": "{syn_acc}" },
          "operator": { "color": "{fg_dim}" },
          "punctuation": { "color": "{fg_dim}" },
          "punctuation.bracket": { "color": "{fg_dim}" },
          "punctuation.delimiter": { "color": "{fg_dim}" }
        }
      }
    }
  ]
}

@FILE zellij.kdl
themes {
    default {
        fg "{fg}"
        bg "{bg}"
        black "{surface}"
        red "{sem_red}"
        green "{sem_green}"
        yellow "{sem_yellow}"
        blue "{sem_blue}"
        magenta "{syn_key}"
        cyan "{syn_str}"
        white "{fg_dim}"
        orange "{ui_sec}"
    }
}

