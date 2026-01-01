import { useState, useCallback, useEffect, useRef, useMemo } from "react";

const CONFIG = {
    FOCUS_COOLDOWN_MS: 30 * 1000,
    SESSION_LIMIT_SEC: 4 * 3600, // 4 godziny
    BREAK_LIMIT_SEC: 2 * 3600,   // 2 godziny
};

const createLogEntry = (message, type) => ({
    id: Date.now() + Math.random(),
    timestamp: Date.now(),
    message,
    type
});

export const useAlertsAndEvents = (
    isRecording,
    isTakingBreak,
    elapsedTime,
    timeSinceLastBreak,
    focusPercent
) => {
    const [eventHistory, setEventHistory] = useState([]);
    const [alerts, setAlerts] = useState([]);

    const lastAlertTime = useRef({ focus50: 0, focus25: 0 });
    const hasAlerted = useRef({ sessionLimit: false, breakLimit: false });

    const resetSessionHistory = useCallback(() => {
        setEventHistory([]);
        setAlerts([]);
        lastAlertTime.current = { focus50: 0, focus25: 0 };
        hasAlerted.current = { sessionLimit: false, breakLimit: false };
    }, []);

    const shouldLog = useCallback((force) => {
        return force || (isRecording && !isTakingBreak);
    }, [isRecording, isTakingBreak]);

    const addEvent = useCallback((message, type = 'info', force = false) => {
        if (!shouldLog(force)) return;

        const entry = createLogEntry(message, type);
        setEventHistory(prev => [entry, ...prev]);
        console.log(`[Event:${type}]`, message);
    }, [shouldLog]);

    const addAlert = useCallback((message, type = 'warning', force = false) => {
        if (!shouldLog(force)) return;

        const entry = createLogEntry(message, type);
        setAlerts(prev => [...prev, entry]);
        setEventHistory(prev => [entry, ...prev]);
        console.log(`[Alert:${type}]`, message);
    }, [shouldLog]);

    useEffect(() => {
        if (!isRecording || isTakingBreak) return;

        const now = Date.now();
        const fp = focusPercent ?? 100;
        const { focus25, focus50 } = lastAlertTime.current;

        const canAlert25 = (now - focus25) >= CONFIG.FOCUS_COOLDOWN_MS;
        const canAlert50 = (now - focus50) >= CONFIG.FOCUS_COOLDOWN_MS;

        if (fp <= 25 && canAlert25) {
            addAlert('Critical: Focus dropped below 25%', 'critical');
            lastAlertTime.current.focus25 = now;
            lastAlertTime.current.focus50 = now;
        }
        else if (fp <= 50 && fp > 25 && canAlert50) {
            addAlert('Warning: Focus dropped below 50%', 'warning');
            lastAlertTime.current.focus50 = now;
        }
    }, [focusPercent, isRecording, isTakingBreak, addAlert]);

    useEffect(() => {
        if (!isRecording) return;

        const { sessionLimit, breakLimit } = hasAlerted.current;

        if (elapsedTime >= CONFIG.SESSION_LIMIT_SEC && !sessionLimit) {
            addAlert('Attention: Driving session exceeded 4 hours', 'alert');
            hasAlerted.current.sessionLimit = true;
        }

        if (timeSinceLastBreak >= CONFIG.BREAK_LIMIT_SEC && !breakLimit) {
            addAlert('Attention: More than 2 hours since last break', 'alert');
            hasAlerted.current.breakLimit = true;
        }
    }, [elapsedTime, timeSinceLastBreak, isRecording, addAlert]);

    const displayAlerts = useMemo(() => alerts.slice(-10).reverse(), [alerts]);

    return {
        eventHistory,
        alerts,
        displayAlerts,
        addEvent,
        addAlert,
        resetSessionHistory,
    };
};