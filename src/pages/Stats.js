import { Container, Stack } from "@mui/material";
import { useState } from "react";
import FocusPerTimeChart from "../components/Charts/FocusPerTimeChart";
import UserFocusStats from "../components/Charts/UserFocusStats";
import DateRangeSelector from "../components/Charts/DateRangeSelector";
import { StatsProvider } from "../components/Charts/StatsContext";

export default function Stats() {
    const [dateRange, setDateRange] = useState(() => {
        const start = new Date();
        start.setHours(0, 0, 0, 0);

        const end = new Date();
        end.setHours(23, 59, 59, 999);

        return {
            startTime: start.toISOString(),
            endTime: end.toISOString()
        };
    });

    const handleRangeChange = (newRange) => {
        setDateRange(newRange);
    };

    return (
        <StatsProvider startTime={dateRange.startTime} endTime={dateRange.endTime}>
            <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
                <Stack spacing={{ xs: 3, md: 5 }}>
                    <DateRangeSelector onRangeChange={handleRangeChange} />
                    <FocusPerTimeChart />
                    <UserFocusStats />
                </Stack>
            </Container>
        </StatsProvider>
    );
}