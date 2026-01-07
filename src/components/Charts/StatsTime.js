import React, { useState } from "react";
import DateRangeSelector from "./DateRangeSelector";
import UserFocusStatsTime from "./UserFocusStatsTime";

export default function StatsTime({ setDateRange }) {
    const [selectedTimeOption, setSelectedTimeOption] = useState('TODAY');

    const handleDateRangeChange = (newRange, optionValue) => {
        setDateRange(newRange);
        if (optionValue) setSelectedTimeOption(optionValue);
    };

    return (
        <>
            <DateRangeSelector
                onRangeChange={handleDateRangeChange}
                selectedOption={selectedTimeOption}
            />
            <UserFocusStatsTime />
        </>
    );
}