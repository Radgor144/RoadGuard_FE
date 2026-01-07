import React, { useState } from "react";
import SessionSelector from "./SessionSelector";
import UserFocusStatsSession from "./UserFocusStatsSession";
import RechartFocusPerTimeChart from "./RechartFocusPerTIme";

export default function StatsSession({ setSessionDateRange }) {
    const [selectedSessionId, setSelectedSessionId] = useState('ALL');

    const handleSessionChange = (newRange, sessionId) => {
        setSelectedSessionId(sessionId);

        if (sessionId === 'ALL') {
            const start = new Date(); start.setHours(0, 0, 0, 0);
            const end = new Date(); end.setHours(23, 59, 59, 999);
            setSessionDateRange({ startTime: start.toISOString(), endTime: end.toISOString() });
        } else {
            setSessionDateRange(newRange);
        }
    };

    return (
        <>
            <SessionSelector
                selectedSessionId={selectedSessionId}
                onRangeChange={handleSessionChange}
            />
            <RechartFocusPerTimeChart />
            <UserFocusStatsSession />
        </>
    );
}