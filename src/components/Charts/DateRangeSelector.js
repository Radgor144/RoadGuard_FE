import React from 'react';
import { Box, FormControl, InputLabel, MenuItem, Select, Typography } from '@mui/material';
import { useStatsData } from "./StatsContext";

const formatSessionLabel = (session) => {
    if (!session.startTime || !session.endTime) return "Invalid Session";
    const start = new Date(session.startTime);
    const end = new Date(session.endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return "Invalid date format";
    }

    const durationMin = Math.round((end.getTime() - start.getTime()) / 60000);

    const options = { hour: '2-digit', minute: '2-digit' };
    const dateFormatter = new Intl.DateTimeFormat('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const startDateString = dateFormatter.format(start);
    const startTimeString = start.toLocaleTimeString('pl-PL', options);
    const endTimeString = end.toLocaleTimeString('pl-PL', options);

    return `${startDateString} | ${startTimeString} - ${endTimeString} (${durationMin} min)`;
};

export default function DateRangeSelector({ onRangeChange, selectedSessionId }) {
    const { sessions = [] } = useStatsData();

    const handleChange = (event) => {
        const value = event.target.value;
        console.log("Kliknięto ID:", value);

        if (onRangeChange) {
            if (value === 'ALL') {
                const start = new Date(); start.setHours(0,0,0,0);
                const end = new Date(); end.setHours(23,59,59,999);
                onRangeChange({ startTime: start.toISOString(), endTime: end.toISOString() }, 'ALL');
            } else {
                const session = sessions.find(s => String(s.id) === String(value));
                if (session) {
                    console.log("Wybór sesji (wysyłamy oryginalny czas UTC):", session.startTime);
                    // Wysyłamy do backendu oryginalny czas UTC - to jest poprawne zachowanie!
                    // 17:00Z to ten sam moment w czasie co 19:00 w Polsce.
                    onRangeChange({
                        startTime: session.startTime,
                        endTime: session.endTime
                    }, String(session.id));
                }
            }
        }
    };

    const isSelectedValueValid = selectedSessionId === 'ALL' || sessions.some(s => String(s.id) === String(selectedSessionId));
    const safeValue = isSelectedValueValid ? String(selectedSessionId) : (selectedSessionId !== 'ALL' ? String(selectedSessionId) : 'ALL');

    return (
        <Box sx={{ minWidth: 250, mb: 2 }}>
            <FormControl fullWidth size="small">
                <InputLabel id="session-select-label" sx={{ color: '#fff' }}>
                    Select Session
                </InputLabel>
                <Select
                    labelId="session-select-label"
                    value={safeValue}
                    label="Select Session"
                    onChange={handleChange}
                    sx={{
                        color: '#fff',
                        '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#fff' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#1976d2' },
                        '.MuiSvgIcon-root': { color: '#fff' }
                    }}
                    MenuProps={{
                        PaperProps: {
                            sx: {
                                bgcolor: '#1f2937', color: '#fff',
                                '& .MuiMenuItem-root': {
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                                    '&.Mui-selected': { bgcolor: 'rgba(25, 118, 210, 0.3)', '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.4)' } }
                                }
                            }
                        }
                    }}
                 >
                    <MenuItem value="ALL">
                        <em>Today</em>
                    </MenuItem>

                    {sessions && sessions.length > 0 ? (
                        sessions.map((session, index) => (
                            <MenuItem key={session.id || index} value={String(session.id)}>
                                {formatSessionLabel(session)} {session.id ? `(ID: ${session.id})` : ''}
                            </MenuItem>
                        ))
                    ) : (
                        !isSelectedValueValid && selectedSessionId !== 'ALL' ? (
                            <MenuItem value={String(selectedSessionId)} disabled>Selected Session (Loading...)</MenuItem>
                        ) : (
                            <MenuItem disabled value="">No sessions found</MenuItem>
                        )
                    )}
                </Select>
            </FormControl>
            <Typography variant="caption" sx={{ color: '#aaa', ml: 1 }}>
                Found {sessions.length} sessions
            </Typography>
        </Box>
    );
}