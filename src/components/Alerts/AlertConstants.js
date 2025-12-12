export const AUTO_DISMISS_MS = 5000;
export const TRANSITION_MS = 300;

export const getColorForType = (type) => {
    switch (type) {
        case 'info':
            return '#60a5fa';
        case 'warning':
            return '#f59e0b';
        case 'critical':
            return '#ef4444';
        case 'alert':
            return '#f97316';
        default:
            return '#94a3b8';
    }
}

export const AUDIO_FILES = {
    warning: '/sounds/alertSound.mp3',
    critical: '/sounds/alertSound.mp3'
};