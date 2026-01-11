import React, { useMemo } from 'react';
import { Box, Typography, Skeleton, Tooltip } from '@mui/material';
import { useStatsData } from './StatsContext';
import { calculateStats, formatMinutesToHMM } from './StatsHelpers';

const CARD_STYLE = {
    bgcolor: '#1f2937',
    color: '#fff',
    p: { xs: 2, md: 3 },
    borderRadius: 2,
    boxShadow: '0 6px 18px rgba(0,0,0,0.5)',
    cursor: 'help'
};

const STAT_DESCRIPTIONS = {
    avg: 'Average driver focus level calculated from all valid measurements.',
    min: 'Lowest detected focus value during the selected session.',
    high: 'Percentage of driving time with focus level above 50%.',
    time: 'Total active driving time excluding long breaks.'
};

export default function UserFocusStatsSession() {
    const { dataset, loading } = useStatsData();
    const stats = useMemo(() => calculateStats(dataset), [dataset]);

    if (loading) {
        return (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
                {[...Array(4)].map((_, i) => (
                    <Skeleton
                        key={i}
                        variant="rectangular"
                        height={140}
                        sx={{ borderRadius: 2, bgcolor: 'rgba(255,255,255,0.1)' }}
                    />
                ))}
            </Box>
        );
    }

    if (!stats) {
        return <Typography sx={{ color: '#fff', mt: 2 }}>No statistics available for this period.</Typography>;
    }

    return (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
            <StatCard
                title="Average focus"
                value={`${stats.avg.toFixed(1)}%`}
                description={STAT_DESCRIPTIONS.avg}
            />
            <StatCard
                title="Minimum focus"
                value={`${stats.min.toFixed(1)}%`}
                description={STAT_DESCRIPTIONS.min}
            />
            <StatCard
                title="High focus driving"
                value={`${stats.highFocusPercentage.toFixed(1)}%`}
                description={STAT_DESCRIPTIONS.high}
            />
            <StatCard
                title="Total driving time"
                value={formatMinutesToHMM(stats.totalMinutes)}
                description={STAT_DESCRIPTIONS.time}
            />
        </Box>
    );
}

function StatCard({ title, value, description, variant = 'h3' }) {
    return (
        <Tooltip
            title={description}
            arrow
            placement="top"
            enterDelay={300}
        >
            <Box sx={CARD_STYLE}>
                <Typography fontWeight={700}>
                    {title}
                </Typography>
                <Typography variant={variant}>
                    {value}
                </Typography>
            </Box>
        </Tooltip>
    );
}
