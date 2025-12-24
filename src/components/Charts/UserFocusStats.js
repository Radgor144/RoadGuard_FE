import React, { useMemo } from 'react';
import { Box, Typography, Skeleton } from '@mui/material';
import { useStatsData } from './StatsContext';

function formatMinutesToHMM(minutes) {
    if (!minutes) return '0 min';
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return h === 0 ? `${m} min` : `${h}h ${m} min`;
}

export default function UserFocusStats() {
    const { dataset, loading } = useStatsData();

    const stats = useMemo(() => {
        if (!dataset || dataset.length === 0) return null;

        const validPoints = dataset
            .filter(d => d.focusPercentage != null)
            .map(d => ({ ...d, focusPercentage: Number(d.focusPercentage) }));

        if (validPoints.length === 0) return null;

        const values = validPoints.map(d => d.focusPercentage);

        const sum = values.reduce((a, b) => a + b, 0);
        const avg = sum / values.length;

        const min = Math.min(...values);

        const highFocusCount = values.filter(v => v >= 50).length;
        const highFocusPercentage = (highFocusCount / values.length) * 100;

        let totalMs = 0;
        const GAP_THRESHOLD = 15 * 60 * 1000;

        for (let i = 1; i < dataset.length; i++) {
            const current = dataset[i];
            const prev = dataset[i - 1];

            if (current.focusPercentage == null || prev.focusPercentage == null) continue;

            const diff = current.timestamp - prev.timestamp;
            if (diff < GAP_THRESHOLD) totalMs += diff;
        }

        // Uproszczenie: jeśli są dane (validPoints.length > 0) i totalMs jest 0, ustaw na 1 (aby pokazać "1 min" jako minimum).
        const totalMinutes = Math.round(totalMs / 60000);

        return {
            avg,
            min,
            highFocusPercentage,
            totalMinutes: totalMinutes > 0 ? totalMinutes : (validPoints.length > 0 ? 1 : 0)
        };
    }, [dataset]);

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

    const cardStyle = {
        bgcolor: '#1f2937',
        color: '#fff',
        p: { xs: 2, md: 3 },
        borderRadius: 2,
        boxShadow: '0 6px 18px rgba(0,0,0,0.5)'
    };

    return (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
            <Box sx={cardStyle}>
                <Typography fontWeight={700}>Average focus</Typography>
                <Typography variant="h3">{stats.avg.toFixed(1)}%</Typography>
            </Box>

            <Box sx={cardStyle}>
                <Typography fontWeight={700}>Minimum focus</Typography>
                <Typography variant="h3">{stats.min.toFixed(1)}%</Typography>
            </Box>

            <Box sx={cardStyle}>
                <Typography fontWeight={700}>High focus driving</Typography>
                <Typography variant="h3">{stats.highFocusPercentage.toFixed(1)}%</Typography>
            </Box>

            <Box sx={cardStyle}>
                <Typography fontWeight={700}>Total driving time</Typography>
                <Typography variant="h4">{formatMinutesToHMM(stats.totalMinutes)}</Typography>
            </Box>
        </Box>
    );
}