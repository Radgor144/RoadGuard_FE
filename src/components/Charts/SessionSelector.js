import React, { useMemo, useEffect, useRef } from 'react';
import { Box, FormControl, InputLabel, MenuItem, Select, Typography } from '@mui/material';
import { useStatsData } from "./StatsContext";

const TIME_OPTIONS = { hour: '2-digit', minute: '2-digit' };
const DATE_FORMATTER = new Intl.DateTimeFormat('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });

const formatSessionLabel = (session) => {
    if (!session.startTime || !session.endTime) return "Invalid Session";
    const start = new Date(session.startTime);
    const end = new Date(session.endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return "Invalid date format";

    const durationMin = Math.round((end.getTime() - start.getTime()) / 60000);

    const dateStr = DATE_FORMATTER.format(start);
    const timeStart = start.toLocaleTimeString('pl-PL', TIME_OPTIONS);
    const timeEnd = end.toLocaleTimeString('pl-PL', TIME_OPTIONS);

    return `${dateStr} | ${timeStart} - ${timeEnd} (${durationMin} min)`;
};

const SELECT_SX = {
    color: '#fff',
    '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.5)' },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#fff' },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#1976d2' },
    '.MuiSvgIcon-root': { color: '#fff' }
};

const MENU_PROPS = {
    PaperProps: {
        sx: {
            bgcolor: '#1f2937', color: '#fff',
            '& .MuiMenuItem-root': {
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                '&.Mui-selected': { bgcolor: 'rgba(25, 118, 210, 0.3)', '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.4)' } }
            }
        }
    }
};

export default function SessionSelector({ onRangeChange, selectedSessionId }) {
    const { sessions = [] } = useStatsData();
    const hasAutoSelected = useRef(false);

    useEffect(() => {
        if (sessions.length > 0 && selectedSessionId === 'ALL' && !hasAutoSelected.current) {

            const sortedSessions = [...sessions].sort((a, b) =>
                new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
            );

            const latestSession = sortedSessions[0];

            if (latestSession) {
                console.log("Auto-selecting latest session:", latestSession.id);
                onRangeChange({
                    startTime: latestSession.startTime,
                    endTime: latestSession.endTime
                }, String(latestSession.id));

                hasAutoSelected.current = true;
            }
        }
    }, [sessions, selectedSessionId, onRangeChange]);


    const handleChange = (event) => {
        const value = event.target.value;
        if (!onRangeChange) return;

        if (value === 'ALL') {
            const start = new Date(); start.setHours(0, 0, 0, 0);
            const end = new Date(); end.setHours(23, 59, 59, 999);
            onRangeChange({ startTime: start.toISOString(), endTime: end.toISOString() }, 'ALL');
        } else {
            const session = sessions.find(s => String(s.id) === String(value));
            if (session) {
                onRangeChange({
                    startTime: session.startTime,
                    endTime: session.endTime
                }, String(session.id));
            }
        }
    };

    const isSelectedValueValid = selectedSessionId === 'ALL' || sessions.some(s => String(s.id) === String(selectedSessionId));
    const safeValue = isSelectedValueValid ? String(selectedSessionId) : (selectedSessionId !== 'ALL' ? String(selectedSessionId) : 'ALL');

    const menuItems = useMemo(() => {
        if (sessions && sessions.length > 0) {
            const sortedDisplay = [...sessions].sort((a, b) =>
                new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
            );

            return sortedDisplay.map((session, index) => (
                <MenuItem key={session.id || index} value={String(session.id)}>
                    {formatSessionLabel(session)} {session.id ? `(ID: ${session.id})` : ''}
                </MenuItem>
            ));
        }

        if (!isSelectedValueValid && selectedSessionId !== 'ALL') {
            return <MenuItem value={String(selectedSessionId)} disabled>Selected Session (Loading...)</MenuItem>;
        }

        return <MenuItem disabled value="">No sessions found</MenuItem>;
    }, [sessions, isSelectedValueValid, selectedSessionId]);

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
                    sx={SELECT_SX}
                    MenuProps={MENU_PROPS}
                >
                    <MenuItem value="ALL">
                        <em>Today (Show All)</em>
                    </MenuItem>

                    {menuItems}
                </Select>
            </FormControl>
            <Typography variant="caption" sx={{ color: '#aaa', ml: 1 }}>
                Found {sessions.length} sessions
            </Typography>
        </Box>
    );
}