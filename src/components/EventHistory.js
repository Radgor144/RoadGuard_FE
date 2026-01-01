import React, { useContext } from "react";
import { RecordingContext, formatClock } from "./SessionRecording/SessionRecording";

const EVENT_COLORS = {
    info: '#60a5fa',
    warning: '#f59e0b',
    critical: '#ef4444'
};

export const EventHistory = () => {
    const { eventHistory = [] } = useContext(RecordingContext);

    return (
        <div className="bg-gray-900 p-5 rounded-xl shadow-lg">
            <h2 className="text-xl font-bold mb-3 text-indigo-400">Event History</h2>

            <div className="max-h-[360px] overflow-y-auto pr-2">
                <ul className="space-y-2 text-sm text-gray-400">
                    {eventHistory.length === 0 ? (
                        <li className="text-gray-500 text-center py-4">No events detected</li>
                    ) : (
                        eventHistory.map(({ id, type, timestamp, message }) => (
                            <li
                                key={id}
                                className="border-l-2 pl-3 flex items-center min-h-[36px]"
                                style={{ borderColor: EVENT_COLORS[type] || EVENT_COLORS.default }}
                            >
                                <span className="font-semibold text-white mr-2">
                                    {formatClock(timestamp)}:
                                </span>
                                {message}
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    );
};

export default EventHistory;