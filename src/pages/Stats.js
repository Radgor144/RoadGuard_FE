import { Container, Stack } from "@mui/material";
import { useState } from "react";
import FocusPerTimeChart from "../components/Charts/FocusPerTimeChart";
import UserFocusStats from "../components/Charts/UserFocusStats";
import DateRangeSelector from "../components/Charts/DateRangeSelector";
import { StatsProvider } from "../components/Charts/StatsContext";

export default function Stats() {
    const [dateRange, setDateRange] = useState(() => {
        const start = new Date(); start.setHours(0, 0, 0, 0);
        const end = new Date(); end.setHours(23, 59, 59, 999);
        return { startTime: start.toISOString(), endTime: end.toISOString() };
    });

    // Stan wybranej sesji - 'ALL' oznacza widok ogólny
    const [selectedSessionId, setSelectedSessionId] = useState('ALL');

    const handleRangeChange = (newRange, sessionId) => {
        console.log('Zmiana zakresu na:', newRange, 'ID:', sessionId);
        // 1. Ustawiamy ID (UI)
        setSelectedSessionId(sessionId);
        // 2. Ustawiamy daty (Dane)
        setDateRange(newRange);
    };

    // Klucz resetujący Provider przy zmianie daty
    const providerKey = `${dateRange.startTime}-${dateRange.endTime}`;

    return (
        <StatsProvider key={providerKey} startTime={dateRange.startTime} endTime={dateRange.endTime}>
            <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
                <Stack spacing={{ xs: 3, md: 5 }}>
                    <DateRangeSelector
                        selectedSessionId={selectedSessionId}
                        onRangeChange={handleRangeChange}
                    />
                    <FocusPerTimeChart />
                    <UserFocusStats />
                </Stack>
            </Container>
        </StatsProvider>
    );
}