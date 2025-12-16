import { Container, Stack } from "@mui/material";
import FocusPerTimeChart from "../components/Charts/FocusPerTimeChart";
import UserFocusStats from "../components/Charts/UserFocusStats";

export default function Stats() {
    return (
        <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
            <Stack spacing={{ xs: 3, md: 5 }}>
                <FocusPerTimeChart />
                <UserFocusStats />
            </Stack>
        </Container>
    );
}
