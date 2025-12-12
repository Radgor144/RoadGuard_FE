import { useState, useCallback, useEffect, useRef } from "react";

const FOCUS_ALERT_COOLDOWN = 30; // seconds

export const useAlertsAndEvents = (
    isRecording,
    isTakingBreak,
    elapsedTime,
    timeSinceLastBreak,
    focusPercent
) => {
    const [eventHistory, setEventHistory] = useState([]);
    const [alerts, setAlerts] = useState([]);

    const prevFocusRef = useRef(null);

    // spam control refs
    const lastAlertFocus50 = useRef(0);
    const lastAlertFocus25 = useRef(0);
    const alertedSession4h = useRef(false);
    const alertedNoBreak2h = useRef(false);

    // event logging
    const addEvent = useCallback((message, type = 'info', force = false) => {
        if ((!isRecording || isTakingBreak) && !force) {
            console.log('Ignored event (recording inactive or on break):', message);
            return;
        }

        const e = {
            id: Date.now() + Math.random(),
            timestamp: Date.now(),
            message,
            type
        };
        setEventHistory(prev => [e, ...prev]);
        console.log('Event:', message);
    }, [isRecording, isTakingBreak]);

    // alert adding
    const addAlert = useCallback((message, type = 'warning', force = false) => {
        if ((!isRecording || isTakingBreak) && !force) {
            console.log('Ignored alert (recording inactive or on break):', message);
            return;
        }

        const a = {
            id: Date.now() + Math.random(),
            timestamp: Date.now(),
            message,
            type
        };
        setAlerts(prev => [...prev, a]);
        setEventHistory(prev => [{...a, message: a.message, type: a.type, timestamp: a.timestamp, id: a.id}, ...prev]);
        console.log(`Alert (${type}):`, message);
    }, [isRecording, isTakingBreak]);

    const displayAlerts = alerts.slice(-10).reverse();

    // 1. Monitor focus percentage and generate alerts
    useEffect(() => {
        if (!isRecording || isTakingBreak) {
            prevFocusRef.current = null;
            return;
        }

        const fp = typeof focusPercent === 'number' ? focusPercent : 100;
        const now = Date.now();

        if (prevFocusRef.current === null) prevFocusRef.current = fp;

        if (fp <= 25) {
            const last25 = lastAlertFocus25.current || 0;
            if (now - last25 >= FOCUS_ALERT_COOLDOWN * 1000) {
                addAlert('Critical: Focus dropped below 25%', 'critical');
                lastAlertFocus25.current = now;
                lastAlertFocus50.current = now;
            }
        } else if (fp <= 50) {
            const last50 = lastAlertFocus50.current || 0;
            if (now - last50 >= FOCUS_ALERT_COOLDOWN * 1000) {
                addAlert('Warning: Focus dropped below 50%', 'warning');
                lastAlertFocus50.current = now;
            }
        }

        prevFocusRef.current = fp;
    }, [focusPercent, isRecording, isTakingBreak, addAlert]);

    // 2. Monitor driving session length (4 hours)
    useEffect(() => {
        if (!isRecording) return;
        const FOUR_HOURS = 4 * 3600;
        if (elapsedTime >= FOUR_HOURS && !alertedSession4h.current) {
            addAlert('Attention: Driving session exceeded 4 hours', 'alert');
            alertedSession4h.current = true;
        }
    }, [elapsedTime, isRecording, addAlert]);

    // 3. Monitor time since last break (>2 hours)
    useEffect(() => {
        if (!isRecording) return;
        const TWO_HOURS = 2 * 3600;
        if (timeSinceLastBreak >= TWO_HOURS && !alertedNoBreak2h.current) {
            addAlert('Attention: More than 2 hours since last break', 'alert');
            alertedNoBreak2h.current = true;
        }
    }, [timeSinceLastBreak, isRecording, addAlert]);


    return {
        eventHistory,
        addEvent,
        alerts,
        displayAlerts,
        addAlert,
    };
};