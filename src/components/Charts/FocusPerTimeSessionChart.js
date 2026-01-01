import React, {useState, useEffect, useMemo, useCallback} from 'react';
import {LineChart} from '@mui/x-charts/LineChart';
import {Box, Typography, useMediaQuery} from "@mui/material";
import {useStatsData} from "./StatsContext";

export default function FocusPerTimeSessionChart() {
    const { dataset, loading, error } = useStatsData();
    const [chartWidth, setChartWidth] = useState(window.innerWidth > 1100 ? 950 : window.innerWidth - 40);
    const isCompactChart = useMediaQuery('(max-width:750px)');

    useEffect(() => {
        let timeoutId;
        const handleResize = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                const screenWidth = window.innerWidth;
                if (screenWidth < 600) setChartWidth(screenWidth - 40);
                else if (screenWidth > 1100) setChartWidth(950);
                else setChartWidth(screenWidth - 150);
            }, 100);
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(timeoutId);
        };
    }, []);

    const isMultiDay = useMemo(() => {
        if (!dataset || dataset.length < 2) return false;
        const start = new Date(dataset[0].timestamp);
        const end = new Date(dataset[dataset.length - 1].timestamp);
        return (end - start) > (24 * 60 * 60 * 1000);
    }, [dataset]);

    const chartData = useMemo(() => {
        if (!dataset || dataset.length === 0) return [];
        return dataset;
    }, [dataset]);

    const xAxisFormatter = useCallback((date) => {
        const options = { hour: '2-digit', minute: '2-digit' };
        if (isMultiDay) {
            return date.toLocaleDateString('pl-PL', {day:'2-digit', month:'2-digit'}) + ' ' + date.toLocaleTimeString([], options);
        }
        return date.toLocaleTimeString([], options);
    }, [isMultiDay]);

    if (loading) return <Typography sx={{color: '#fff', p: 2}}>Loading chart data...</Typography>;
    if (error && (!dataset || !dataset.length)) return <Typography sx={{color: '#cb1224', p: 2}}>Error: {error}</Typography>;
    if (!dataset || !dataset.length) return <Typography sx={{color: '#aaa', p: 2}}>No detailed data for this period.</Typography>;

    return (
        <Box
            sx={{
                bgcolor: '#1f2937',
                borderRadius: 2,
                p: {xs: 1, md: 2},
                boxShadow: '0 4px 10px rgba(0,0,0,0.6)',
                display: 'flex',
                justifyContent: 'center'
            }}
        >
            <LineChart
                width={chartWidth}
                height={isCompactChart ? 300 : 400}
                grid={{ horizontal: true, stroke: 'rgba(255,255,255,0.1)' }}
                sx={{
                    '& .MuiChartsAxis-tickLabel': {fill: '#fff'},
                    '& .MuiChartsAxis-label': {fill: '#fff'},
                    '& .MuiChartsGrid-line': { stroke: '#fff', strokeOpacity: 0.1 }
                }}
                xAxis={[{
                    scaleType: 'time',
                    data: chartData.map(d => new Date(d.timestamp)),
                    valueFormatter: xAxisFormatter,
                    tickNumber: isCompactChart ? 4 : 8,
                }]}
                yAxis={[{
                    min: 0, max: 100, label: 'Focus (%)',
                    labelStyle: { fill: '#fff' },
                    colorMap: {
                        type: 'piecewise',
                        thresholds: [25, 50, 100],
                        colors: ['#cb1224', '#FD9200', '#1B885E']
                    }
                }]}
                series={[{
                    data: chartData.map(d => d.focusPercentage),
                    curve: 'linear',
                    showMark: false,
                    connectNulls: false,
                    valueFormatter: v => v == null ? '' : `${v}%`
                }]}
                margin={{ left: 50, right: 20, top: 20, bottom: isCompactChart ? 30 : 30 }}
            />
        </Box>
    );
}