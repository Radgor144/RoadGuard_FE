import React, {useEffect, useState, useContext, createContext} from "react";
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
    const addEvent = (message, type = 'info') => {
        const e = {
            id: Date.now() + Math.random(),
            timestamp: Date.now(),
            message,
            type
        };
        setEventHistory(prev => [e, ...prev].slice(0, 10)); // keep recent 100
        console.log('Event:', message);
    };

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

            addEvent('Driving ended', 'info');
        } else {
            // Start recording
            setElapsedTime(0);
            setIsRecording(true);
            const now = Date.now();
            setStartTime(now);
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
            addEvent('Break ended', 'info');
            console.log("Break ended. Resuming recording.");
        } else {
            // Starting break
            setBreakTime(0);
            setIsTakingBreak(true);
            setLastBreakEndTime(0); // clear previous last-break timestamp while on break
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