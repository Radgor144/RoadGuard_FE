import { createContext } from "react";

export const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (num) => String(num).padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

export const formatClock = (timestamp) => {
    if (!timestamp) return 'N/A';
    const d = new Date(timestamp);
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

export const toISO = (v) => {
    if (v === null || v === undefined) return undefined;
    const d = new Date(v);
    if (isNaN(d.getTime())) return undefined;
    const offsetMs = d.getTimezoneOffset() * 60000;
    const localDate = new Date(d.getTime() - offsetMs);
    return localDate.toISOString().slice(0, -1);
};

export const RecordingContext = createContext({
    isRecording: false,
    elapsedTime: 0,
    toggleRecording: () => {},
    isTakingBreak: false,
    startTime: 0,
    breakTime: 0,
    toggleBreak: () => {},
    timeSinceLastBreak: 0,
    eventHistory: [],
    addEvent: () => {},
    addAlert: () => {},
    focusPercent: 100,
    setFocusPercent: () => {},
    currentEAR: null,
    setCurrentEAR: () => {},
    faceCount: 0,
    setFaceCount: () => {},
    monitorStatus: 'idle',
    setMonitorStatus: () => {},
    alerts: [],
    displayAlerts: [],
    wsConnected: false,
});