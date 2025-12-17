import AstalMpris from "gi://AstalMpris";

// Higher index = Higher priority
const PRIORITY_LIST = [
    "browser",
    "firefox",
    "chromium",
    "vivaldi",
    "spotify",
    "deezer"
];

function getScore(player: AstalMpris.Player): number {
    const name = player.identity.toLowerCase();
    
    // 1. Base Score from Priority List
    let score = 0;
    const index = PRIORITY_LIST.findIndex(p => name.includes(p));
    if (index !== -1) {
        score = (index + 1) * 100;
    } else {
        score = 10; // Unknown players get low score
    }

    // 2. Playback Status Bonus
    if (player.playbackStatus === AstalMpris.PlaybackStatus.PLAYING) {
        score += 1000;
    }

    return score;
}

export function getPriorityPlayer(players: AstalMpris.Player[]): AstalMpris.Player | null {
    if (players.length === 0) return null;
    
    // Sort descending by score
    return players.sort((a, b) => getScore(b) - getScore(a))[0];
}
