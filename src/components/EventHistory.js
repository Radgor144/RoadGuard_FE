import React, { useContext } from "react";
import { RecordingContext, formatClock } from "./SessionRecording";

export const EventHistory = () => {
    const { eventHistory } = useContext(RecordingContext);

    // Adjust this value if your item styling changes (px per list item)
    const ITEM_HEIGHT = 36; // px per list item (including padding/margins)
    const VISIBLE_COUNT = 10;
    const containerStyle = { maxHeight: `${ITEM_HEIGHT * VISIBLE_COUNT}px`, overflowY: 'auto' };
    const itemStyle = { minHeight: `${ITEM_HEIGHT}px`, display: 'flex', alignItems: 'center' };

    return (
        <div className="bg-gray-900 p-5 rounded-xl shadow-lg">
            <h2 className="text-xl font-bold mb-3 text-indigo-400">Event History</h2>

            <div style={containerStyle}>
                <ul className="space-y-2 text-sm text-gray-400">
                    {(!eventHistory || eventHistory.length === 0) && (
                        <li className="text-gray-500 text-center">No events detected</li>
                    )}
                    {eventHistory && eventHistory.map(ev => {
                        const borderColor = ev.type === 'info' ? '#60a5fa' : (ev.type === 'warning' ? '#f59e0b' : (ev.type === 'critical' ? '#ef4444' : '#f97316'));
                        return (
                            <li key={ev.id} className="border-l-2 pl-3" style={{ ...itemStyle, borderColor }}>
                                <span className="font-semibold text-white">{formatClock(ev.timestamp)}:</span>&nbsp;{ev.message}
                            </li>
                        )
                    })}
                </ul>
            </div>
        </div>
    )
}

export default EventHistory;