import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import mockEarData from '../../data/mockEarData';

function formatMinutesToHMM(minutes) {
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return h === 0 ? `${m} min` : `${h}h ${m} min`;
}

export default function UserFocusStats({ useMockData = true }) {
    const [dataset, setDataset] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (useMockData) {
            setDataset(mockEarData);
            setLoading(false);
        }
    }, [useMockData]);

    if (loading) {
        return <Typography sx={{ color: '#fff' }}>Loading statistics...</Typography>;
    }

    const values = dataset.map(d => d.focusPercentage ?? 0);

    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);

    const highFocusCount = values.filter(v => v >= 50).length;
    const highFocusPercentage = (highFocusCount / values.length) * 100;

    const first = new Date(dataset[0]?.timestamp);
    const last = new Date(dataset.at(-1)?.timestamp);
    const totalMinutes = Math.max(0, Math.round((last - first) / 60000));

    const cardStyle = {
        bgcolor: '#1f2937',
        color: '#fff',
        p: { xs: 2, md: 3 },
        borderRadius: 2,
        boxShadow: '0 6px 18px rgba(0,0,0,0.5)'
    };

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
            <Box sx={cardStyle}>
                <Typography fontWeight={700}>
                    Average focus
                </Typography>
                <Typography variant="h3">
                    {avg.toFixed(1)}%
                </Typography>
            </Box>

            <Box sx={cardStyle}>
                <Typography fontWeight={700}>
                    Minimum focus
                </Typography>
                <Typography variant="h3">
                    {min.toFixed(1)}%
                </Typography>
            </Box>

            <Box sx={cardStyle}>
                <Typography fontWeight={700}>
                    High focus driving
                </Typography>
                <Typography variant="h3">
                    {highFocusPercentage.toFixed(1)}%
                </Typography>
            </Box>

            <Box sx={cardStyle}>
                <Typography fontWeight={700}>
                    Total driving time
                </Typography>
                <Typography variant="h4">
                    {formatMinutesToHMM(totalMinutes)}
                </Typography>
            </Box>
        </Box>
    );
}
