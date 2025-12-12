import React, { useContext } from 'react';
import { RecordingContext, formatTime } from './RecordingContext';

export const RecordingButton = () => {
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


export const BreakButton = () => {
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