import React, { useState, useEffect, useRef, useMemo } from "react";
import '../SessionRecording.css'
import { useAuth } from '../../../features/auth';
import { useWebSocket } from '../../../mediapipe/hooks/useWebSocket';
import { RecordingContext } from '../RecordingContext';
import { useRecordingTimers } from './useRecordingTimers';
import { useAlertsAndEvents } from './useAlertsAndEvents';
import { useRecordingActions } from './useRecordingActions';


export const RecordingProvider = ({ children }) => {
    // monitoring state
    const [focusPercent, setFocusPercent] = useState(100);
    const [currentEAR, setCurrentEAR] = useState(null);
    const [faceCount, setFaceCount] = useState(0);
    const [monitorStatus, setMonitorStatus] = useState('idle');
    const latestEARRef = useRef(null);

    // timer
    const timerData = useRecordingTimers();

    // alerts and events
    const alertData = useAlertsAndEvents(
        timerData.isRecording,
        timerData.isTakingBreak,
        timerData.elapsedTime,
        timerData.timeSinceLastBreak,
        focusPercent
    );

    // authorization and websocket
    const auth = useAuth();
    const [authToken, setAuthToken] = useState(() => localStorage.getItem('rg_token'));

    useEffect(() => {
        const newToken = localStorage.getItem('rg_token');
        setAuthToken(newToken);

        const onAuthChanged = () => setAuthToken(localStorage.getItem('rg_token'));
        const onStorage = (e) => {
            if (e.key === 'rg_token' || e.key === 'rg_current_user') {
                setAuthToken(localStorage.getItem('rg_token'));
            }
        };

        window.addEventListener('rg:auth-changed', onAuthChanged);
        window.addEventListener('storage', onStorage);
        return () => {
            window.removeEventListener('rg:auth-changed', onAuthChanged);
            window.removeEventListener('storage', onStorage);
        };
    }, [auth?.user]);

    let driverId = null;
    try {
        const raw = localStorage.getItem('rg_current_user');
        if (raw) {
            const parsed = JSON.parse(raw);
            driverId = parsed?.email || null;
        }
    } catch (e) {
        driverId = null;
    }

    const wsEnabled = timerData.isRecording && !timerData.isTakingBreak;
    const { isConnected: wsConnected, connect: wsConnect } = useWebSocket(latestEARRef, wsEnabled, authToken, driverId);

    // latestEARRef and currentEAR synchronization
    useEffect(() => {
        latestEARRef.current = currentEAR;
    }, [currentEAR]);

    // actions
    const wsActionsData = { wsConnect, authToken, driverId };
    const actionsData = useRecordingActions(timerData, timerData, alertData, wsActionsData);

    // context value
    const contextValue = useMemo(() => ({
        ...timerData,
        ...alertData,
        ...actionsData,

        focusPercent,
        setFocusPercent,
        currentEAR,
        setCurrentEAR,
        faceCount,
        setFaceCount,
        monitorStatus,
        setMonitorStatus,
        wsConnected,
    }), [
        timerData, alertData, actionsData, focusPercent, currentEAR,
        faceCount, monitorStatus, wsConnected
    ]);

    return (
        <RecordingContext.Provider value={contextValue}>
            {children}
        </RecordingContext.Provider>
    );
};