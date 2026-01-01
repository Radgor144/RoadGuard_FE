import { useState, useEffect, useRef } from "react";

export const useRecordingTimers = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [isTakingBreak, setIsTakingBreak] = useState(false);

    const [elapsedTime, setElapsedTime] = useState(0);      // Czas jazdy
    const [breakTime, setBreakTime] = useState(0);          // Czas obecnej przerwy
    const [timeSinceLastBreak, setTimeSinceLastBreak] = useState(0);

    const [startTime, setStartTime] = useState(0);
    const [lastBreakEndTime, setLastBreakEndTime] = useState(0);
    const [breaksList, setBreaksList] = useState([]);
    const currentBreakStartRef = useRef(null);

    useEffect(() => {
        if (!isRecording) return;

        const interval = setInterval(() => {
            if (isTakingBreak) {
                setBreakTime(prev => prev + 1);
            } else {
                setElapsedTime(prev => prev + 1);
            }

            if (lastBreakEndTime > 0) {
                const secondsSince = Math.floor((Date.now() - lastBreakEndTime) / 1000);
                setTimeSinceLastBreak(secondsSince > 0 ? secondsSince : 0);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isRecording, isTakingBreak, lastBreakEndTime]);

    const resetTimers = () => {
        setIsRecording(false);
        setIsTakingBreak(false);
        setElapsedTime(0);
        setBreakTime(0);
        setBreaksList([]);
        currentBreakStartRef.current = null;
    };

    return {
        isRecording, setIsRecording,
        isTakingBreak, setIsTakingBreak,
        elapsedTime, setElapsedTime,
        breakTime, setBreakTime,
        timeSinceLastBreak, setTimeSinceLastBreak,
        startTime, setStartTime,
        lastBreakEndTime, setLastBreakEndTime,
        breaksList, setBreaksList,
        currentBreakStartRef,
        resetTimers,
    };
};