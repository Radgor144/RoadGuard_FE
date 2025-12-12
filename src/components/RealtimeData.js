import React from 'react';
import { RecordingContext } from './SessionRecording/SessionRecording';

// IMPORTANT: keep these thresholds in sync with DriverMonitoring
const EAR_LEVEL_WARN = 0.27; // pomarańcz
const EAR_LEVEL_GOOD = 0.35; // zielony

export default function RealtimeData() {
    const { currentEAR, faceCount } = React.useContext(RecordingContext);

    const earDisplay = (typeof currentEAR === 'number') ? currentEAR.toFixed(3) : '-';

    // face color
    const faceVisible = !!(faceCount && faceCount > 0);
    const faceColor = faceVisible ? '#1B885E' : '#CA1223';

    // EAR color based on thresholds from DriverMonitoring
    const earColor = (typeof currentEAR === 'number')
        ? (currentEAR >= EAR_LEVEL_GOOD ? '#1B885E' : (currentEAR >= EAR_LEVEL_WARN ? '#F59E0B' : '#CA1223'))
        : '#9CA3AF';

    const dotStyle = (color) => ({
        display: 'inline-block',
        width: 12,
        height: 12,
        borderRadius: 12,
        background: color,
        boxShadow: `0 0 8px ${color}66`,
        marginRight: 8,
    });

    return (
        <div className="space-y-4 text-gray-300 text-center">
            <div>
                <div className="text-sm text-gray-400">Face</div>
                <div className="flex items-center justify-center mt-2">
                    <span style={dotStyle(faceColor)} />
                    <span className="font-semibold" style={{ color: faceColor }}>{faceVisible ? 'Face detected' : 'No face detected'}</span>
                </div>
            </div>

            <div>
                <div className="text-sm text-gray-400">EAR</div>
                <div className="flex items-center justify-center mt-2">
                    <span style={dotStyle(earColor)} />
                    <span className="font-semibold" style={{ color: earColor }}>{earDisplay}</span>
                </div>
            </div>
        </div>
    );
}
