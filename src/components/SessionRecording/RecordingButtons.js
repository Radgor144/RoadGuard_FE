import React, { useContext } from 'react';
import { RecordingContext, formatTime } from './RecordingContext';

export const RecordingButton = () => {
    const { isRecording, elapsedTime, toggleRecording, isTakingBreak } = useContext(RecordingContext);

    return (
        <div>
            <div className={`timer-display ${isTakingBreak ? 'onBreak' : (isRecording ? 'active' : 'inactive')}`}>
                {formatTime(elapsedTime)}
            </div>

            <button
                onClick={toggleRecording}
                disabled={isTakingBreak}
                className={`recording-${isRecording ? 'stop' : 'start'}-btn ${isTakingBreak ? 'disabled' : ''}`}
            >
                {isRecording ? "Stop Driving" : "Start Driving"}
            </button>
        </div>
    );
};

export const BreakButton = () => {
    const { isRecording, isTakingBreak, breakTime, toggleBreak } = useContext(RecordingContext);

    return (
        <div className="button-container">
            <div className={`timer-display break-timer-display ${isTakingBreak ? 'break-active' : 'break-inactive'}`}>
                {formatTime(breakTime)}
            </div>

            <button
                onClick={toggleBreak}
                disabled={!isRecording}
                className={`break-${isTakingBreak ? 'end' : 'take'}-btn ${!isRecording ? 'disabled' : ''}`}
            >
                {isTakingBreak ? "End Break" : "Take Break"}
            </button>
        </div>
    );
};