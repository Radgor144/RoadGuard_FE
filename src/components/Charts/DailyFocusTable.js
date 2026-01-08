import React, { useMemo } from 'react';
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Paper } from '@mui/material';
import { useStatsData } from './StatsContext';

const HEADER_CELL = {
    color: '#fff',
    fontWeight: 700,
    borderBottom: '1px solid rgba(255,255,255,0.2)',
    textAlign: 'center',
    backgroundColor: '#1f2937'
};

const BODY_CELL = {
    color: '#e5e7eb',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    textAlign: 'center'
};

export default function DailyFocusTable({ onDaySelect, selectedDay }) {
    const { sessions, loading, startTime, endTime } = useStatsData();

    const rows = useMemo(() => {
        if (!startTime || !endTime) return [];

        const startMs = new Date(startTime).getTime();
        const endMs = new Date(endTime).getTime();
        const daysMap = new Map();

        (sessions || []).forEach(session => {
            const s = new Date(session.startTime).getTime();
            const e = new Date(session.endTime).getTime();
            if (e < startMs || s > endMs) return;

            const dayKey = new Date(session.startTime).toLocaleDateString('sv-SE');

            if (!daysMap.has(dayKey)) {
                daysMap.set(dayKey, {
                    dayKey,
                    sessions: 0
                });
            }

            daysMap.get(dayKey).sessions += 1;
        });

        return [...daysMap.values()]
            .sort((a, b) => new Date(b.dayKey).getTime() - new Date(a.dayKey).getTime())
            .map((d, index) => ({
                index: index + 1,
                dayKey: d.dayKey,
                dayLabel: new Date(d.dayKey).toLocaleDateString('pl-PL'),
                sessions: d.sessions
            }));
    }, [sessions, startTime, endTime]);

    if (loading) {
        return <Typography sx={{ color: '#fff', mt: 2 }}>Loading table data...</Typography>;
    }

    if (!rows.length) {
        return <Typography sx={{ color: '#aaa', mt: 2 }}>No data.</Typography>;
    }

    return (
        <Box sx={{ bgcolor: '#1f2937', borderRadius: 2, mt: 3 }}>
            <TableContainer
                component={Paper}
                sx={{
                    bgcolor: 'transparent',
                    maxHeight: 52 * 4 + 56, // 4 wiersze + nagłówek
                    overflowY: 'auto'
                }}
            >
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ ...HEADER_CELL, width: '10%' }}>#</TableCell>
                            <TableCell sx={{ ...HEADER_CELL, width: '45%' }}>Day</TableCell>
                            <TableCell sx={{ ...HEADER_CELL, width: '45%' }}>
                                Amount of sessions
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.map(row => (
                            <TableRow
                                key={row.index}
                                hover
                                selected={row.dayKey === selectedDay}
                                sx={{
                                    cursor: 'pointer',
                                    '&.Mui-selected': {
                                        backgroundColor: 'rgba(25,118,210,0.25)'
                                    },
                                    '&.Mui-selected:hover': {
                                        backgroundColor: 'rgba(25,118,210,0.35)'
                                    }
                                }}
                                onClick={() => onDaySelect(row.dayKey)}
                            >
                                <TableCell sx={BODY_CELL}>{row.index}</TableCell>
                                <TableCell sx={BODY_CELL}>{row.dayLabel}</TableCell>
                                <TableCell sx={BODY_CELL}>{row.sessions}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}