import React, {useEffect, useState, useContext, createContext} from "react";
import './SessionRecording.css'

const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (num) => String(num).padStart(2, '0');

    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

const RecordingContext = createContext({
    isRecording: false,
    elapsedTime: 0,
    toggleRecording: () => {},
    isTakingBreak: false,
    breakTime: 0,
    toggleBreak: () => {}
});

const RecordingProvider = ({ children }) => {
    // DRIVING STATE
    const [isRecording, setIsRecording] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0); // Driving time in seconds

    // BREAK STATE
    const [isTakingBreak, setIsTakingBreak] = useState(false); // NEW
    const [breakTime, setBreakTime] = useState(0);              // NEW

    // 1. Driving Timer Logic (MODIFIED)
    useEffect(() => {
        let interval = null;
        // Driving timer runs only if recording is active AND NOT on break
        if (isRecording && !isTakingBreak) {
            interval = setInterval(() => {
                setElapsedTime(prevTime => prevTime + 1);
            }, 1000);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isRecording, isTakingBreak]); // DEPENDENCY ADDED

    // 2. Break Timer Logic (NEW)
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

    const toggleRecording = () => {
        if (isRecording) {
            // Stopping recording
            setIsRecording(false);
            // Ensure break stops and resets if recording stops
            if (isTakingBreak) setIsTakingBreak(false);
            setBreakTime(0);
        } else {
            // Starting recording: reset time and start
            setElapsedTime(0);
            setIsRecording(true);
        }
        console.log(isRecording ? "Stopping Recording..." : "Starting Recording...");
    };

    // NEW toggleBreak function
    const toggleBreak = () => {
        if (!isRecording) {
            console.log("Cannot start break: Recording is not active.");
            return;
        }

        if (isTakingBreak) {
            // Ending break
            setIsTakingBreak(false);
            // breakTime is intentionally NOT reset here, so it shows the last break duration
            console.log("Break ended. Resuming recording.");
        } else {
            // Starting break: reset break time for the new break session
            setBreakTime(0);
            setIsTakingBreak(true);
            console.log("Break started. Driving timer paused.");
        }
    };

    const contextValue = {
        isRecording,
        elapsedTime,
        toggleRecording,
        isTakingBreak, // NEW
        breakTime,     // NEW
        toggleBreak,   // NEW
    };

    return (
        <RecordingContext value={contextValue}>
            {children}
        </RecordingContext>
    );
};

const RecordingButton = () => {
    const { isRecording, elapsedTime, toggleRecording, isTakingBreak } = useContext(RecordingContext);

    // Disable if a break is currently active
    const isDisabled = isTakingBreak;

    const buttonClass = isRecording ? "recording-stop-btn" : "recording-start-btn";

    return (
        <div>

            {/* Timer Display */}
            <div className={`
                timer-display 
                ${isTakingBreak ? 'break-active-display' : 'break-inactive-display'}
                ${isDisabled ? 'disabled-display' : ''}
            `}>
                {formatTime(elapsedTime)}
            </div>

            <button
                onClick={toggleRecording}
                disabled={isDisabled}
                className={`${buttonClass} ${isDisabled ? 'disabled' : ''}`}
            >
                {isRecording ? "Stop Driving" : "Start Driving"}
            </button>
            <p className={`status-text ${isTakingBreak ? 'status-break' : 'status-ready'}`}>
                Status: {isTakingBreak ? "Break Active (Driving Paused)" : (isRecording ? "Ready for Break" : "Recording Required")}
            </p>
        </div>
    );
};


const BreakButton = () => {
    // Context is correctly used
    const { isRecording, isTakingBreak, breakTime, toggleBreak } = useContext(RecordingContext);

    // Use descriptive CSS classes
    const buttonClass = isTakingBreak
        ? "break-end-btn" // Custom CSS class for ending break (Yellow)
        : "break-take-btn"; // Custom CSS class for taking break (Blue)

    const isDisabled = !isRecording;

    return (
        // Use a container class for styling the section
        <div className="button-container">

            {/* Break Timer Display */}
            <div className={`
                timer-display 
                break-timer-display
                ${isTakingBreak ? 'break-active' : 'break-inactive'}
                ${isDisabled ? 'disabled-display' : ''}
            `}>
                {formatTime(breakTime)}
            </div>

            <button
                onClick={toggleBreak}
                disabled={isDisabled}
                // Apply descriptive classes
                className={`${buttonClass} ${isDisabled ? 'disabled' : ''}`}
            >
                {isTakingBreak ? "End Break" : "Take Break"}
            </button>

            {/* Status text */}
            <p className={`status-text ${isTakingBreak ? 'status-break' : 'status-ready'}`}>
                Status: {isTakingBreak ? "Break Active (Driving Paused)" : (isRecording ? "Ready for Break" : "Recording Required")}
            </p>
        </div>
    );
};


const RecordingIndicator = () => {
    const { isRecording, isTakingBreak, elapsedTime, breakTime } = useContext(RecordingContext);

    if (!isRecording) {
        // Updated text styling to use a simple CSS class for centering/color
        return <div className="indicator-standby">No active session.</div>;
    }

    // Determine the main indicator background/border class
    const indicatorClass = isTakingBreak ? 'indicator-break-session' : 'indicator-active-session';

    // Determine the pulsing dot color class
    const dotClass = isTakingBreak ? 'dot-break' : 'dot-active';

    return (
        // Use base class plus the status class
        <div className={`indicator-base ${indicatorClass}`}>
            <div className="indicator-header">
                {/* Status Dot */}
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
    RecordingIndicator
};
