# Find and delete all files ending in .backup inside your .config folder
find ~/.config -name "*.backup" -type f -delete

# 2. Optimize the store (Hard links identical files to save space)
# This is SLOW (takes 5-10 mins) but can free 1-2GB on a new install
nix-store --optimise

#show who own the files
nix-store --query --referrers /nix/store/*-nameofthething-*
