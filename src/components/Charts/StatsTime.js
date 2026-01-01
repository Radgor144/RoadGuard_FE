import React, { useState } from "react";
import { StatsProvider } from "./StatsContext";
import DateRangeSelector from "./DateRangeSelector";
import FocusPerTimeChart from "./FocusPerTimeChart";
import UserFocusStatsTime from "./UserFocusStatsTime";

export default function StatsTime() {
    const [dateRange, setDateRange] = useState(() => {
        const start = new Date(); start.setHours(0, 0, 0, 0);
        const end = new Date(); end.setHours(23, 59, 59, 999);
        return { startTime: start.toISOString(), endTime: end.toISOString() };
    });

    const [selectedTimeOption, setSelectedTimeOption] = useState('TODAY');

    const handleDateRangeChange = (newRange, optionValue) => {
        console.log('Zmiana zakresu dat na:', newRange, 'Typ:', optionValue);
        setDateRange(newRange);
        if (optionValue) setSelectedTimeOption(optionValue);
    };

    const timeProviderKey = `time-${dateRange.startTime}-${dateRange.endTime}`;

    return (
        <StatsProvider key={timeProviderKey} startTime={dateRange.startTime} endTime={dateRange.endTime}>
            <DateRangeSelector
                onRangeChange={handleDateRangeChange}
                selectedOption={selectedTimeOption}
            />
            <FocusPerTimeChart />
            <UserFocusStatsTime />
        </StatsProvider>
    );
}