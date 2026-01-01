import React from "react";
import { Container, Stack } from "@mui/material";
import StatsSession from "../components/Charts/StatsSession";
import StatsTime from "../components/Charts/StatsTime";
export default function Stats() {
    return (
        <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
            <Stack spacing={{ xs: 3, md: 5 }}>
                <StatsSession />
                <StatsTime />
            </Stack>
        </Container>
    );
}