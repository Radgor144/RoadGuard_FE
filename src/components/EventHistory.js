import React, { useContext } from "react";
import { RecordingContext, formatClock } from "./SessionRecording";

export const EventHistory = () => {
    const { eventHistory } = useContext(RecordingContext);

    return (
        <div className="bg-gray-900 p-5 rounded-xl shadow-lg">
            <h2 className="text-xl font-bold mb-3 text-indigo-400">Event History</h2>
            <ul className="space-y-2 text-sm text-gray-400">
                {eventHistory.length === 0 && (
                    <li className="text-gray-500">No events detected</li>
                )}
                {eventHistory.map(ev => (
                    <li key={ev.id} className="border-l-2 pl-3" style={{ borderColor: ev.type === 'info' ? '#60a5fa' : ev.type === 'warning' ? '#f59e0b' : '#ef4444' }}>
                        <span className="font-semibold text-white">{formatClock(ev.timestamp)}:</span> {ev.message}
                    </li>
                ))}
            </ul>
        </div>
    )
}

export default EventHistory;