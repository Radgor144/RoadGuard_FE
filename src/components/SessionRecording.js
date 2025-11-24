import React, {useEffect, useState, useContext, createContext, useRef} from "react";
import './SessionRecording.css'

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

    // Alerts state (store full history for the session)
    const [alerts, setAlerts] = useState([]);

    // Internal flags to avoid spamming the same alert repeatedly
    // use timestamps to allow cooldown-based re-alerting
    const lastAlertFocus50 = useRef(0); // ms timestamp
    const lastAlertFocus25 = useRef(0); // ms timestamp
    const alertedSession4h = useRef(false);
    const alertedNoBreak2h = useRef(false);

    // Cooldown (seconds) for focus alerts to allow them to reappear periodically
    const FOCUS_ALERT_COOLDOWN = 60; // seconds

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

    // Helper: add event to history (store full history, UI will limit visible portion)
    const addEvent = (message, type = 'info') => {
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
    };

    // Helper: add alert (store full history; UI will slice last 10)
    const addAlert = (message, type = 'warning') => {
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
        console.log('Alert:', message);
    };

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
    }, [focusPercent, isRecording, isTakingBreak]);

    // Monitor driving session length (4 hours)
    useEffect(() => {
        if (!isRecording) return;
        const FOUR_HOURS = 4 * 3600;
        if (elapsedTime >= FOUR_HOURS && !alertedSession4h.current) {
            addAlert('Attention: Driving session exceeded 4 hours', 'alert');
            alertedSession4h.current = true;
        }
    }, [elapsedTime, isRecording]);

    // Monitor time since last break (>2 hours)
    useEffect(() => {
        if (!isRecording) return;
        const TWO_HOURS = 2 * 3600;
        if (timeSinceLastBreak >= TWO_HOURS && !alertedNoBreak2h.current) {
            addAlert('Attention: More than 2 hours since last break', 'alert');
            alertedNoBreak2h.current = true;
        }
    }, [timeSinceLastBreak, isRecording]);

    // Event logging helpers (start/stop/reset) and alert reset management
    const toggleRecording = () => {
        if (isRecording) {
            // Stop recording
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

            addEvent('Driving ended', 'info');
        } else {
            // Start recording
            setElapsedTime(0);
            setIsRecording(true);
            const now = Date.now();
            setStartTime(now);

            // reset alert flags on new session
            lastAlertFocus25.current = 0;
            lastAlertFocus50.current = 0;
            alertedSession4h.current = false;
            alertedNoBreak2h.current = false;

            // reset full alerts history for the new driving session
            setAlerts([]);

            addEvent('Driving started', 'info');
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

            addEvent('Break ended', 'info');
            console.log("Break ended. Resuming recording.");
        } else {
            // Starting break
            setBreakTime(0);
            setIsTakingBreak(true);
            setLastBreakEndTime(0); // clear previous last-break timestamp while on break

            // When starting a break, we don't want the "no-break" alert to remain active
            alertedNoBreak2h.current = false;

            addEvent('Break started', 'info');
            console.log("Break started. Driving timer paused.");
        }
    };

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
    const statusText = isRecording ? "Status: Recording Active" : "Status: Ready to Start";
    const statusClass = isRecording ? "system-status-active" : "system-status-required";

    return (
        <div className={`system-status-container ${statusClass}`}>
            <p className="size font-bold text-center">{statusText}</p>
        </div>
    );
};

const RecordingIndicator = () => {
    const { isRecording, isTakingBreak, elapsedTime, breakTime } = useContext(RecordingContext);

    if (!isRecording) {
        return <div className="indicator-standby">No active session.</div>;
    }

    const indicatorClass = isTakingBreak ? 'indicator-break-session' : 'indicator-active-session';
    const dotClass = isTakingBreak ? 'dot-break' : 'dot-active';

    return (
        <div className={`indicator-base ${indicatorClass}`}>
            <div className="indicator-header">
                <span className={`indicator-dot animate-pulse ${dotClass}`}></span>
                <span className="indicator-title">
                    {isTakingBreak ? "SESSION PAUSED (BREAK)" : "LIVE DRIVING SESSION"}
                </span>
            </div>
            <p className="indicator-details">
                Driving Time: <span className="time-value">{formatTime(elapsedTime)}</span> |
                Break Time: <span className="time-value">{formatTime(breakTime)}</span>
            </p>
        </div>
    );
}

export {
    RecordingContext,
    RecordingProvider,
    RecordingButton,
    BreakButton,
    RecordingIndicator,
    formatTime,
    formatClock,
};