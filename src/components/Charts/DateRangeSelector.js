import React, { useState } from 'react';
import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';

// Opcje wyboru
const RANGES = {
    TODAY: 'Today',
    LAST_3_DAYS: 'Last 3 days',
    LAST_WEEK: 'Last week',
    LAST_MONTH: 'Last month',
    LAST_3_MONTHS: 'Last 3 months',
    LAST_6_MONTHS: 'Last 6 months',
    LAST_YEAR: 'Last year',
};

export default function DateRangeSelector({ onRangeChange }) {
    const [selectedRange, setSelectedRange] = useState('TODAY');

    const handleChange = (event) => {
        const value = event.target.value;
        setSelectedRange(value);

        const end = new Date();
        end.setHours(23, 59, 59, 999);

        let start = new Date();

        // Logika obliczania dat
        switch (value) {
            case 'TODAY':
                start.setHours(0, 0, 0, 0); // Od początku dzisiejszego dnia
                break;
            case 'LAST_3_DAYS':
                start.setDate(end.getDate() - 3);
                start.setHours(0, 0, 0, 0);
                break;
            case 'LAST_WEEK':
                start.setDate(end.getDate() - 7);
                start.setHours(0, 0, 0, 0);
                break;
            case 'LAST_MONTH':
                start.setMonth(end.getMonth() - 1);
                start.setHours(0, 0, 0, 0);
                break;
            case 'LAST_3_MONTHS':
                start.setMonth(end.getMonth() - 3);
                start.setHours(0, 0, 0, 0);
                break;
            case 'LAST_6_MONTHS':
                start.setMonth(end.getMonth() - 6);
                start.setHours(0, 0, 0, 0);
                break;
            case 'LAST_YEAR':
                start.setFullYear(end.getFullYear() - 1);
                start.setHours(0, 0, 0, 0);
                break;
            default:
                start.setHours(0, 0, 0, 0);
        }

        // Przekazanie dat w formacie ISO do rodzica
        if (onRangeChange) {
            onRangeChange({
                startTime: start.toISOString(),
                endTime: end.toISOString()
            });
        }
    };

    return (
        <Box sx={{ minWidth: 200, mb: 2 }}>
            <FormControl fullWidth size="small">
                <InputLabel id="date-range-select-label" sx={{ color: '#fff' }}>Time range</InputLabel>
                <Select
                    labelId="date-range-select-label"
                    value={selectedRange}
                    label="Time range"
                    onChange={handleChange}
                    sx={{
                        color: '#fff',
                        '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#fff' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#1976d2' },
                        '.MuiSvgIcon-root': { color: '#fff' }
                    }}
                 variant="outlined">
                    {Object.entries(RANGES).map(([key, label]) => (
                        <MenuItem key={key} value={key}>
                            {label}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </Box>
    );
}