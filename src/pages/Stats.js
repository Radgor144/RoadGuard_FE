import React, { useState } from "react";
import { Container, Stack } from "@mui/material";
import StatsSession from "../components/Charts/StatsSession";
import StatsTime from "../components/Charts/StatsTime";
import { StatsProvider } from "../components/Charts/StatsContext";

export default function Stats() {
    const [sessionDateRange, setSessionDateRange] = useState({
        startTime: null,
        endTime: null
    });

    const [dateRange, setDateRange] = useState(() => {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);
        return { startTime: start.toISOString(), endTime: end.toISOString() };
    });

    return (
        <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
            <Stack spacing={{ xs: 3, md: 5 }}>
                <StatsProvider
                    startTime={sessionDateRange.startTime}
                    endTime={sessionDateRange.endTime}
                    fetchSessions={true}
                >
                    <StatsSession setSessionDateRange={setSessionDateRange} />
                </StatsProvider>

                <StatsProvider
                    startTime={dateRange.startTime}
                    endTime={dateRange.endTime}
                    fetchSessions={false}
                >
                    <StatsTime setDateRange={setDateRange} />
                </StatsProvider>
            </Stack>
        </Container>
    );
}