import React, { useContext } from 'react';
import { RecordingContext } from './RecordingContext';

export const SystemStatus = () => {
    const { isRecording, wsConnected } = useContext(RecordingContext);
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