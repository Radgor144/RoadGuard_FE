import React, {useEffect, useState, useContext, createContext, useRef, useCallback} from "react";
import './SessionRecording.css'
import { useWebSocket } from '../mediapipe/hooks/useWebSocket';
import { useAuth } from '../features/auth/context/AuthContext';

const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (num) => String(num).padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

const formatClock = (timestamp) => {
    if (!timestamp) return 'N/A';
    const d = new Date(timestamp);
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const RecordingContext = createContext({
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
    addAlert: () => {}, // added safe default to avoid "addAlert is not a function" when consumer renders outside provider
    focusPercent: 100,
    setFocusPercent: () => {},
});

const RecordingProvider = ({ children }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0); // Driving time in seconds

    const [isTakingBreak, setIsTakingBreak] = useState(false);
    const [startTime, setStartTime] = useState(0);
    const [breakTime, setBreakTime] = useState(0);

    const [lastBreakEndTime, setLastBreakEndTime] = useState(0);
    const [timeSinceLastBreak, setTimeSinceLastBreak] = useState(0);

    const [eventHistory, setEventHistory] = useState([]);
    const [focusPercent, setFocusPercent] = useState(100);

    // Expose current EAR and face count to the global context so the right panel can read them
    const [currentEAR, setCurrentEAR] = useState(null);
    const [faceCount, setFaceCount] = useState(0);
    const [monitorStatus, setMonitorStatus] = useState('idle');
    // latest EAR ref used for sending to WS
    const latestEARRef = useRef(null);

    // Alerts state (store full history for the session)
    const [alerts, setAlerts] = useState([]);

    // Internal flags to avoid spamming the same alert repeatedly
    // use timestamps to allow cooldown-based re-alerting
    const lastAlertFocus50 = useRef(0); // ms timestamp
    const lastAlertFocus25 = useRef(0); // ms timestamp
    const alertedSession4h = useRef(false);
    const alertedNoBreak2h = useRef(false);

    // Cooldown (seconds) for focus alerts to allow them to reappear periodically
    const FOCUS_ALERT_COOLDOWN = 30; // seconds

    // Keep last focus for comparison (optional)
    const prevFocusRef = useRef(null);

    // Driving timer
    useEffect(() => {
        let interval = null;
        if (isRecording && !isTakingBreak) {
            interval = setInterval(() => {
                setElapsedTime(prevTime => prevTime + 1);
            }, 1000);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isRecording, isTakingBreak]);

    // Break timer
    useEffect(() => {
        let interval = null;
        if (isTakingBreak) {
            interval = setInterval(() => {
                setBreakTime(prevTime => prevTime + 1);
            }, 1000);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isTakingBreak]);

    // Time since last break timer
    useEffect(() => {
        let interval = null;
        if (lastBreakEndTime > 0) {
            const update = () => {
                setTimeSinceLastBreak(Math.floor((Date.now() - lastBreakEndTime) / 1000));
            };
            update();
            interval = setInterval(update, 1000);
        } else {
            setTimeSinceLastBreak(0);
        }
        return () => clearInterval(interval);
    }, [lastBreakEndTime]);

    // Event logging
    const addEvent = useCallback((message, type = 'info', force = false) => {
        // Only record events when a driving session is active and not on break,
        // unless force==true (used for logging start/stop actions)
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
        // keep full history (do not slice) so user can scroll to see older events;
        // UI limits visible area to ~10 items via max-height
        setEventHistory(prev => [e, ...prev]);
        console.log('Event:', message);
    }, [isRecording, isTakingBreak]);

    // Helper: add alert (store full history; UI will slice last 10)
    const addAlert = useCallback((message, type = 'warning', force = false) => {
        // Only create alerts when a driving session is active and not on break
        // unless force===true (used for developer/test triggers)
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
        // append to full alerts history for the session
        setAlerts(prev => [...prev, a]);
        // also mirror into event history so user sees recent alerts in EventHistory (keep recent 10 there)
        // mirror entire alert into eventHistory without slicing so full history is preserved
        setEventHistory(prev => [{...a, message: a.message, type: a.type, timestamp: a.timestamp, id: a.id}, ...prev]);
        console.log(`Alert (${type}):`, message);
    }, [isRecording, isTakingBreak]);

    // Derived: alerts to display (last 10, newest first)
    const displayAlerts = alerts.slice(-10).reverse();

    // Monitor focus percentage and generate alerts when crossing thresholds
    useEffect(() => {
        // Only monitor when recording and not on break
        if (!isRecording || isTakingBreak) {
            prevFocusRef.current = null;
            return;
        }

        const fp = typeof focusPercent === 'number' ? focusPercent : 100;
        const now = Date.now();

        // if user requested reset behavior when session starts, prevFocusRef will be null at start
        if (prevFocusRef.current === null) prevFocusRef.current = fp;

        // Trigger critical first (<=25) with cooldown
        if (fp <= 25) {
            const last25 = lastAlertFocus25.current || 0;
            if (now - last25 >= FOCUS_ALERT_COOLDOWN * 1000) {
                addAlert('Critical: Focus dropped below 25%', 'critical');
                lastAlertFocus25.current = now;
                // also mark 50s timestamp so warning doesn't fire immediately after
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

    // Monitor driving session length (4 hours)
    useEffect(() => {
        if (!isRecording) return;
        const FOUR_HOURS = 4 * 3600;
        if (elapsedTime >= FOUR_HOURS && !alertedSession4h.current) {
            addAlert('Attention: Driving session exceeded 4 hours', 'alert');
            alertedSession4h.current = true;
        }
    }, [elapsedTime, isRecording, addAlert]);

    // Monitor time since last break (>2 hours)
    useEffect(() => {
        if (!isRecording) return;
        const TWO_HOURS = 2 * 3600;
        if (timeSinceLastBreak >= TWO_HOURS && !alertedNoBreak2h.current) {
            addAlert('Attention: More than 2 hours since last break', 'alert');
            alertedNoBreak2h.current = true;
        }
    }, [timeSinceLastBreak, isRecording, addAlert]);

    // Event logging helpers (start/stop/reset) and alert reset management
    const toggleRecording = async () => {
        if (isRecording) {
            // Stop recording
            // Send POST to backend to signal end of trip
            try {
                const token = authToken || localStorage.getItem('rg_token');
                console.log('toggleRecording: token present=', !!token);

                const payload = {
                    driverId,
                    timestamp: new Date().toISOString(),
                    elapsedTime,
                    ear: latestEARRef.current ?? currentEAR
                };

                const res = await fetch('http://localhost:8082/api/endTrip', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {})
                    },
                    body: JSON.stringify(payload)
                });

                if (!res.ok) {
                    const text = await res.text().catch(() => '');
                    console.warn('endTrip POST failed', res.status, text);
                } else {
                    console.log('endTrip POST successful');
                }
            } catch (e) {
                console.warn('Failed to POST endTrip', e);
            }

            // attempt to send END_DRIVING via WS if connected
            try {
                if (typeof sendEndDriving === 'function') {
                    const sent = sendEndDriving({elapsedTime, ear: latestEARRef.current ?? currentEAR});
                    console.log('sendEndDriving via WS sent=', sent);
                }
            } catch (e) {
                console.warn('sendEndDriving failed', e);
            }

            // disconnect websocket when session ends
            try {
                if (typeof wsDisconnect === 'function') await wsDisconnect();
            } catch (e) {
                console.warn('WS disconnect failed', e);
            }

            setIsRecording(false);
            if (isTakingBreak) setIsTakingBreak(false);
            setBreakTime(0);
            setStartTime(0);

            // Reset last break info when driving session ends
            setLastBreakEndTime(0);
            setTimeSinceLastBreak(0);

            // reset alert flags for next session
            lastAlertFocus25.current = 0;
            lastAlertFocus50.current = 0;
            alertedSession4h.current = false;
            alertedNoBreak2h.current = false;

            addAlert('Driving ended', 'info', true);
        } else {
            // Start recording
            // try to establish WS connection before marking recording active
            const connected = await (wsConnect ? wsConnect(5000) : Promise.resolve(false));
            console.log('toggleRecording: wsConnect result=', connected);
            if (!connected) {
                // If websocket cannot connect, block starting the driving session and inform user
                addAlert('Cannot start driving: real-time monitor unavailable (WebSocket connect failed)', 'warning', true);
                console.warn('WebSocket connect failed; aborting start of recording');
                return;
            }

            setElapsedTime(0);
            setIsRecording(true);
            const now = Date.now();
            setStartTime(now);

            // reset alert flags on new session
            lastAlertFocus25.current = 0;
            lastAlertFocus50.current = 0;
            alertedSession4h.current = false;
            alertedNoBreak2h.current = false;

            // reset full alerts history for the new driving session and immediately add the driving-started info alert
            const a = {
                id: Date.now() + Math.random(),
                timestamp: Date.now(),
                message: 'Driving started',
                type: 'info'
            };
            // set alerts to only contain the new start alert (avoid race with setAlerts([]) + addAlert)
            setAlerts([a]);
            // also add to event history
            setEventHistory(prev => [{...a, id: a.id}, ...prev]);
            // attempt to unlock audio (some browsers require a gesture) by firing a custom event listeners may catch
            try { window.dispatchEvent(new Event('rg:attemptAudioUnlock')); } catch (e) { /* ignore */ }
            // keep lastBreakEndTime/timeSinceLastBreak as-is
        }
        console.log(isRecording ? "Stopping Recording..." : "Starting Recording...");
    };

    const toggleBreak = () => {
        if (!isRecording) {
            console.log("Cannot start break: Recording is not active.");
            return;
        }

        if (isTakingBreak) {
            // Ending break
            setIsTakingBreak(false);
            setLastBreakEndTime(Date.now());

            // reset flag so user can be alerted again after new break interval
            alertedNoBreak2h.current = false;

            // reset focus alert cooldowns so alerts can appear again after break
            lastAlertFocus25.current = 0;
            lastAlertFocus50.current = 0;

            // show user a corner/info alert for break ended
            addAlert('Break ended', 'info', true);
            console.log("Break ended. Resuming recording.");
        } else {
            // Starting break
            setBreakTime(0);
            setIsTakingBreak(true);
            setLastBreakEndTime(0); // clear previous last-break timestamp while on break

            // When starting a break, we don't want the "no-break" alert to remain active
            alertedNoBreak2h.current = false;

            // show user a corner/info alert for break started
            addAlert('Break started', 'info', true);
            console.log("Break started. Driving timer paused.");
        }
    };

    // keep latestEARRef in sync with currentEAR for websocket publishing
    useEffect(() => {
        latestEARRef.current = currentEAR;
    }, [currentEAR]);

    // Enable websocket only when recording and not on break
    const wsEnabled = isRecording && !isTakingBreak;
    // read token/driverId from localStorage (no dependency on auth context required)
    const auth = useAuth();
    const [authToken, setAuthToken] = useState(() => localStorage.getItem('rg_token'));
    useEffect(() => {
        // update token when auth.user changes (login/logout)
        const newToken = localStorage.getItem('rg_token');
        setAuthToken(newToken);
        console.log('SessionRecording: authToken updated ->', !!newToken, newToken ? newToken.slice(0,8) + '...' : null);

        const onAuthChanged = () => {
            const nt = localStorage.getItem('rg_token');
            setAuthToken(nt);
            console.log('SessionRecording: rg:auth-changed fired, authToken ->', !!nt);
        };
        const onStorage = (e) => {
            if (e.key === 'rg_token' || e.key === 'rg_current_user') {
                const nt = localStorage.getItem('rg_token');
                setAuthToken(nt);
                console.log('SessionRecording: storage event, authToken ->', !!nt);
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

    console.log('SessionRecording: calling useWebSocket with enabled=', wsEnabled, 'token present=', !!authToken, 'driverId=', driverId);
    const { isConnected: wsConnected, connect: wsConnect, disconnect: wsDisconnect, sendEndDriving } = useWebSocket(latestEARRef, wsEnabled, authToken, driverId);

    const contextValue = {
        isRecording,
        elapsedTime,
        toggleRecording,
        isTakingBreak,
        breakTime,
        timeSinceLastBreak,
        toggleBreak,
        startTime,
        lastBreakEndTime,
        eventHistory,
        addEvent,
        focusPercent,
        setFocusPercent,
        // expose EAR/face data
        currentEAR,
        setCurrentEAR,
        faceCount,
        setFaceCount,
        monitorStatus,
        setMonitorStatus,
        // alerts
        alerts,        // full history for the session
        displayAlerts, // last 10 for UI
        addAlert,
        // websocket status
        wsConnected,
    };

    return (
        <RecordingContext.Provider value={contextValue}>
            {children}
        </RecordingContext.Provider>
    );
};

const RecordingButton = () => {
    const { isRecording, elapsedTime, toggleRecording, isTakingBreak } = useContext(RecordingContext);
    const isDisabled = isTakingBreak;
    const buttonClass = isRecording ? "recording-stop-btn" : "recording-start-btn";

    return (
        <div>
            <div className={`timer-display ${isTakingBreak ? 'onBreak' : (isRecording ? 'active' : 'inactive')}`}>
                {formatTime(elapsedTime)}
            </div>

            <button
                onClick={toggleRecording}
                disabled={isDisabled}
                className={`${buttonClass} ${isDisabled ? 'disabled' : ''}`}
            >
                {isRecording ? "Stop Driving" : "Start Driving"}
            </button>
        </div>
    );
};


const BreakButton = () => {
    const { isRecording, isTakingBreak, breakTime, toggleBreak } = useContext(RecordingContext);
    const buttonClass = isTakingBreak ? "break-end-btn" : "break-take-btn";
    const isDisabled = !isRecording;

    return (
        <div className="button-container">
            <div className={`
                timer-display 
                break-timer-display
                ${isTakingBreak ? 'break-active' : 'break-inactive'}
            `}>
                {formatTime(breakTime)}
            </div>

            <button
                onClick={toggleBreak}
                disabled={isDisabled}
                className={`${buttonClass} ${isDisabled ? 'disabled' : ''}`}
            >
                {isTakingBreak ? "End Break" : "Take Break"}
            </button>
        </div>
    );
};

export const SystemStatus = () => {
    const { isRecording } = useContext(RecordingContext);
    const { wsConnected } = useContext(RecordingContext);
    const statusText = isRecording ? "Status: Recording Active" : "Status: Ready to Start";
    const statusClass = isRecording ? "system-status-active" : "system-status-required";

    return (
        <div className={`system-status-container ${statusClass}`}>
            <p className="size font-bold text-center">{statusText}</p>
            <div style={{marginTop: 6, textAlign: 'center'}}>
                <span style={{fontSize: 12, color: wsConnected ? '#34d399' : '#f97316'}}>{wsConnected ? 'WS: connected' : 'WS: disconnected'}</span>
            </div>
        </div>
    );
};

// RecordingIndicator removed (was unused) to avoid linter warning. If you need it, re-add and import where used.

export {
    RecordingContext,
    RecordingProvider,
    RecordingButton,
    BreakButton,
    formatTime,
    formatClock,
};