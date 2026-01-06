import React, { useState, useRef } from "react";
import { StatsProvider } from "./StatsContext";
import DateRangeSelector from "./DateRangeSelector";
import DailyFocusTable from "./DailyFocusTable";
import UserFocusStatsTime from "./UserFocusStatsTime";

export default function StatsTime() {
    const initialRangeRef = useRef(null);

    const [dateRange, setDateRange] = useState(() => {
        const start = new Date(); start.setHours(0, 0, 0, 0);
        const end = new Date(); end.setHours(23, 59, 59, 999);
        const range = { startTime: start.toISOString(), endTime: end.toISOString() };
        initialRangeRef.current = range;
        return range;
    });

    const [selectedTimeOption, setSelectedTimeOption] = useState('TODAY');
    const [selectedDay, setSelectedDay] = useState(null); // dla podświetlenia
    const [selectedDayForStats, setSelectedDayForStats] = useState(null); // dla kafelków

    const handleDateRangeChange = (newRange, optionValue) => {
        setDateRange(newRange);
        initialRangeRef.current = newRange;
        setSelectedDay(null);
        setSelectedDayForStats(null);
        if (optionValue) setSelectedTimeOption(optionValue);
    };

    const handleDaySelect = (dayKey) => {
        if (selectedDay === dayKey) {
            setSelectedDay(null);
            setSelectedDayForStats(null);
        } else {
            setSelectedDay(dayKey);
            setSelectedDayForStats(dayKey);
        }
    };

    const statsProviderKey = `stats-${dateRange.startTime}-${dateRange.endTime}`;

    return (
        <StatsProvider
            key={statsProviderKey}
            startTime={dateRange.startTime}
            endTime={dateRange.endTime}
        >
            <DateRangeSelector
                onRangeChange={handleDateRangeChange}
                selectedOption={selectedTimeOption}
            />

            <DailyFocusTable
                onDaySelect={handleDaySelect}
                selectedDay={selectedDay}
            />

            <UserFocusStatsTime selectedDay={selectedDayForStats} />
        </StatsProvider>
    );
}
