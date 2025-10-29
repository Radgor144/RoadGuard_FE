import React, {useEffect, useState, useContext} from "react";
import './SessionRecording.css'

const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (num) => String(num).padStart(2, '0');

    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

const RecordingContext = React.createContext({
    isRecording: false,
    elapsedTime: 0,
    toggleRecording: () => {},
    isTakingBreak: false,
    breakTime: 0,
    toggleBreak: () => {},
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
        let interval;
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
        let interval;
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
        <RecordingContext.Provider value={contextValue}>
            {children}
        </RecordingContext.Provider>
    );
};

const RecordingButton = () => {
    const { isRecording, elapsedTime, toggleRecording, isTakingBreak } = useContext(RecordingContext);

    // Disable if a break is currently active
    const isDisabled = isTakingBreak;

    const buttonClass = isRecording ? "recording-stop-btn" : "recording-start-btn";

    return (
        <div className="p-4 flex flex-col items-center justify-center">

            {/* Timer Display */}
            <div className={`
        text-4xl 
        font-mono 
        font-bold 
        mb-4 
        py-2 
        px-4 
        rounded 
        shadow-inner 
        w-full 
        max-w-xs 
        text-center
        ${isRecording ? 'text-red-600 bg-red-50' : 'text-gray-700 bg-gray-200'}
        ${isDisabled ? 'opacity-70' : ''}
      `}>
                {formatTime(elapsedTime)}
            </div>

            <button
                onClick={toggleRecording}
                disabled={isDisabled}
                className={`${buttonClass} ${isDisabled ? 'disabled' : ''}`}
            >
                {isRecording ? "Stop Recording" : "Start Recording"}
            </button>
        </div>
    );
};


const BreakButton = () => {
    const { isRecording, isTakingBreak, breakTime, toggleBreak } = useContext(RecordingContext);

    const buttonClass = isTakingBreak
        ? "bg-yellow-600 hover:bg-yellow-700 active:bg-yellow-800"
        : "bg-blue-500 hover:bg-blue-600 active:bg-blue-700";

    const isDisabled = !isRecording;

    return (
        <div className="p-4 flex flex-col items-center justify-center">

            {/* Break Timer Display */}
            <div className={`
                text-4xl 
                font-mono 
                font-bold 
                mb-4 
                py-2 
                px-4 
                rounded 
                shadow-inner 
                w-full 
                max-w-xs 
                text-center
                ${isTakingBreak ? 'text-yellow-600 bg-yellow-50' : 'text-gray-700 bg-gray-200'}
                ${isDisabled ? 'opacity-70' : ''}
            `}>
                {formatTime(breakTime)}
            </div>

            <button
                onClick={toggleBreak}
                disabled={isDisabled}
                className={`
                    ${buttonClass} 
                    text-white 
                    font-extrabold 
                    text-lg 
                    uppercase 
                    py-3 
                    px-8 
                    rounded-xl 
                    shadow-lg 
                    transition 
                    duration-200 
                    ease-in-out
                    w-full 
                    max-w-xs
                    ring-4
                    ${isTakingBreak ? 'ring-yellow-300' : 'ring-blue-300'}
                    ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
            >
                {isTakingBreak ? "End Break" : "Take Break"}
            </button>
            <p className={`mt-2 text-sm font-medium ${isTakingBreak ? 'text-yellow-600' : 'text-blue-600'}`}>
                Status: {isTakingBreak ? "Break Active (Driving Paused)" : (isRecording ? "Ready for Break" : "Recording Required")}
            </p>
        </div>
    );
};


const RecordingIndicator = () => {
    const { isRecording, isTakingBreak, elapsedTime, breakTime } = useContext(RecordingContext);

    if (!isRecording) {
        return <div className="text-center text-gray-500 mt-4">No active session.</div>;
    }

    return (
        <div className={`text-center mt-4 p-3 rounded-lg border-4 ${isTakingBreak ? 'bg-yellow-100 border-yellow-500' : 'bg-red-100 border-red-500'}`}>
            <div className="flex items-center justify-center space-x-2">
                <span className={`h-3 w-3 rounded-full animate-pulse ${isTakingBreak ? 'bg-yellow-600' : 'bg-red-600'}`}></span>
                <span className="font-semibold text-gray-700">
                    {isTakingBreak ? "SESSION PAUSED (BREAK)" : "LIVE DRIVING SESSION"}
                </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
                Driving Time: <span className="font-mono font-bold">{formatTime(elapsedTime)}</span> |
                Break Time: <span className="font-mono font-bold">{formatTime(breakTime)}</span>
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
