import { useState, useEffect, useRef } from "react";

export const useRecordingTimers = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0); // Driving time in seconds

    const [isTakingBreak, setIsTakingBreak] = useState(false);
    const [startTime, setStartTime] = useState(0);
    const [breakTime, setBreakTime] = useState(0);

    const [lastBreakEndTime, setLastBreakEndTime] = useState(0);
    const [timeSinceLastBreak, setTimeSinceLastBreak] = useState(0);

    const currentBreakStartRef = useRef(null);
    const [breaksList, setBreaksList] = useState([]);

    // 1. Driving timer (elapsedTime)
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

    // 2. Break timer (breakTime)
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

    // 3. Time since last break timer (timeSinceLastBreak)
    useEffect(() => {
        let interval = null;
        // Update only while recording; this freezes the "Last Break" display after stop
        if (lastBreakEndTime > 0 && isRecording) {
            const update = () => {
                setTimeSinceLastBreak(Math.floor((Date.now() - lastBreakEndTime) / 1000));
            };
            update();
            interval = setInterval(update, 1000);
        } else {
            setTimeSinceLastBreak(prev => prev || 0);
        }
        return () => clearInterval(interval);
    }, [lastBreakEndTime, isRecording]);

    // reset all timers/lists related to the current driving session
    const resetTimers = () => {
        setIsRecording(false);
        setIsTakingBreak(false);
        setElapsedTime(0);
        setBreakTime(0);
        currentBreakStartRef.current = null;
        setBreaksList([]);
        // do not reset startTime or lastBreakEndTime to allow "Current Status" to remain frozen
        setTimeSinceLastBreak(prev => prev || 0);
    };

    return {
        isRecording, setIsRecording,
        elapsedTime, setElapsedTime,
        isTakingBreak, setIsTakingBreak,
        startTime, setStartTime,
        breakTime, setBreakTime,
        lastBreakEndTime, setLastBreakEndTime,
        timeSinceLastBreak, setTimeSinceLastBreak,
        currentBreakStartRef,
        breaksList, setBreaksList,
        resetTimers,
    };
};