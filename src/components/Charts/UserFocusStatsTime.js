import React, { useMemo } from 'react';
import { Box, Typography, Skeleton } from '@mui/material';
import { useStatsData } from './StatsContext';
import { calculateStats, formatMinutesToHMM } from './StatsHelpers';

const CARD_STYLE = {
    bgcolor: '#1f2937',
    color: '#fff',
    p: { xs: 2, md: 3 },
    borderRadius: 2,
    boxShadow: '0 6px 18px rgba(0,0,0,0.5)'
};

export default function UserFocusStatsTime() {
    const { dataset, loading } = useStatsData();

    const stats = useMemo(() => calculateStats(dataset), [dataset]);

    if (loading) {
        return (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} variant="rectangular" height={140} sx={{ borderRadius: 2, bgcolor: 'rgba(255,255,255,0.1)' }} />
                ))}
            </Box>
        );
    }

    if (!stats) {
        return <Typography sx={{ color: '#fff', mt: 2 }}>No statistics available for this period.</Typography>;
    }

    return (
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(4, 1fr)'
                },
                gap: 2
            }}
        >
            <StatCard title="Average focus" value={`${stats.avg.toFixed(1)}%`} />
            <StatCard title="Minimum focus" value={`${stats.min.toFixed(1)}%`} />
            <StatCard title="High focus driving" value={`${stats.highFocusPercentage.toFixed(1)}%`} />
            <StatCard title="Total driving time" value={formatMinutesToHMM(stats.totalMinutes)} variant="h4" />
        </Box>
    );
}

function StatCard({ title, value, variant = "h3" }) {
    return (
        <Box sx={CARD_STYLE}>
            <Typography fontWeight={700}>
                {title}
            </Typography>
            <Typography variant={variant}>
                {value}
            </Typography>
        </Box>
    );
}