import React, { useState } from "react";
import { StatsProvider } from "./StatsContext";
import SessionSelector from "./SessionSelector";
import FocusPerTimeSessionChart from "./FocusPerTimeSessionChart";
import UserFocusStatsSession from "./UserFocusStatsSession";

export default function StatsSession() {
    const [sessionDateRange, setSessionDateRange] = useState(() => {
        const start = new Date(); start.setHours(0, 0, 0, 0);
        const end = new Date(); end.setHours(23, 59, 59, 999);
        return { startTime: start.toISOString(), endTime: end.toISOString() };
    });

    const [selectedSessionId, setSelectedSessionId] = useState('ALL');

    const handleSessionChange = (newRange, sessionId) => {
        console.log('Zmiana sesji na:', newRange, 'ID:', sessionId);
        setSelectedSessionId(sessionId);

        if (sessionId === 'ALL') {
            const start = new Date(); start.setHours(0, 0, 0, 0);
            const end = new Date(); end.setHours(23, 59, 59, 999);
            setSessionDateRange({ startTime: start.toISOString(), endTime: end.toISOString() });
        } else {
            setSessionDateRange(newRange);
        }
    };

    const sessionProviderKey = `session-${sessionDateRange.startTime}-${sessionDateRange.endTime}`;

    return (
        <StatsProvider key={sessionProviderKey} startTime={sessionDateRange.startTime} endTime={sessionDateRange.endTime}>
            <SessionSelector
                selectedSessionId={selectedSessionId}
                onRangeChange={handleSessionChange}
            />
            <FocusPerTimeSessionChart />
            <UserFocusStatsSession />
        </StatsProvider>
    );
}