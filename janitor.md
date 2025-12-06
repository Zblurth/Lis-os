# Find and delete all files ending in .backup inside your .config folder
find ~/.config -name "*.backup" -type f -delete

# Optimize the store (Hard links identical files to save space)
# This is SLOW (takes 5-10 mins) but can free 1-2GB on a new install
nix-store --optimise

# Clean up the backlog of generations and Optimize the store (Hard links identical files to save space) (1 minutes)
clean-os

# Show who own the files
nix-store --query --referrers /nix/store/*-nameofthething-*
