import React from 'react';
import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';

const RANGES = {
    TODAY: 'Today',
    LAST_3_DAYS: 'Last 3 days',
    LAST_WEEK: 'Last week',
    LAST_MONTH: 'Last month',
    LAST_3_MONTHS: 'Last 3 months',
    LAST_6_MONTHS: 'Last 6 months',
    LAST_YEAR: 'Last year',
};

const MENU_PROPS = {
    PaperProps: {
        sx: {
            bgcolor: '#1f2937',
            color: '#fff',
            '& .MuiMenuItem-root': {
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                '&.Mui-selected': {
                    bgcolor: 'rgba(25, 118, 210, 0.3)',
                    '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.4)' }
                }
            }
        }
    }
};

export default function DateRangeSelector({ onRangeChange, selectedOption = 'TODAY' }) {

    const handleChange = (event) => {
        const value = event.target.value;

        const end = new Date();
        end.setHours(23, 59, 59, 999);

        let start = new Date();

        switch (value) {
            case 'TODAY':
                start.setHours(0, 0, 0, 0);
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

        if (onRangeChange) {
            onRangeChange({
                startTime: start.toISOString(),
                endTime: end.toISOString()
            }, value);
        }
    };

    return (
        <Box sx={{ minWidth: 200, mb: 2 }}>
            <FormControl fullWidth size="small">
                <InputLabel id="date-range-select-label" sx={{ color: '#fff' }}>Time range</InputLabel>
                <Select
                    labelId="date-range-select-label"
                    value={selectedOption}
                    label="Time range"
                    onChange={handleChange}
                    MenuProps={MENU_PROPS}
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