import React, {useState, useEffect, useMemo} from 'react';
import {LineChart} from '@mui/x-charts/LineChart';
import {Box, Typography, useMediaQuery} from "@mui/material";
import {useStatsData} from "./StatsContext";

function downsampleByAveraging(dataset) {
    if (dataset.length <= 2) return dataset;

    const result = [];
    result.push(dataset[0]);

    for (let i = 1; i < dataset.length; i += 2) {
        const p1 = dataset[i];
        const p2 = dataset[i + 1];

        if (p1.focusPercentage === null) {
            result.push(p1);
            if (p2) i--;
            continue;
        }

        if (!p2 || p2.focusPercentage === null) {
            result.push(p1);
        } else {
            const avgTime = new Date((p1.timestamp.getTime() + p2.timestamp.getTime()) / 2);
            result.push({
                timestamp: avgTime,
                focusPercentage: Math.round(
                    (p1.focusPercentage + p2.focusPercentage) / 2
                )
            });
        }
    }
    return result;
}

export default function FocusPerTimeChart() {
    const { dataset, loading, error, startTime, endTime } = useStatsData();
    const [chartWidth, setChartWidth] = useState(450);
    const isCompactChart = useMediaQuery('(max-width:750px)');

    const isMultiDay = useMemo(() => {
        if (!startTime || !endTime) return false;
        const start = new Date(startTime);
        const end = new Date(endTime);
        return (end - start) > (24 * 60 * 60 * 1000);
    }, [startTime, endTime]);

    useEffect(() => {
        const calculateWidth = () => {
            const screenWidth = window.innerWidth;
            if (screenWidth < 600) {
                setChartWidth(450);
            } else if (screenWidth > 1100) {
                setChartWidth(950);
            } else {
                setChartWidth(screenWidth - 150);
            }
        };

        calculateWidth();
        window.addEventListener('resize', calculateWidth);
        return () => window.removeEventListener('resize', calculateWidth);
    }, []);

    if (loading) {
        return <Typography sx={{color: '#fff'}}>Loading data...</Typography>;
    }

    if (!dataset.length && error) {
        return (
            <Typography sx={{color: '#fff'}}>
                {error ? `Error: ${error}` : 'No data'}
            </Typography>
        );
    }

    const dateFormatter = (date) => {
        if (isMultiDay) {
            return date.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' }) +
                ' ' +
                date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const chartDataset = isCompactChart
        ? downsampleByAveraging(dataset)
        : dataset;

    const timeData = chartDataset.map(p => p.timestamp);
    const focusValues = chartDataset.map(p => p.focusPercentage);

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
                height={isCompactChart ? 320 : 420}
                grid={{
                    horizontal: true,
                    stroke: 'rgba(255,255,255,0.15)'
                }}
                sx={{
                    '& .MuiChartsAxis-tickLabel': {fill: '#fff'},
                    '& .MuiChartsAxis-label': {fill: '#fff'},
                    '& .MuiChartsLegend-label': {fill: '#fff'},
                    '& .MuiChartsGrid-line': {
                        stroke: '#fff',
                        strokeOpacity: 0.2
                    }
                }}
                xAxis={[{
                    scaleType: 'time',
                    data: timeData,
                    min: new Date(startTime),
                    max: new Date(endTime),
                    valueFormatter: dateFormatter,
                    tickNumber: isCompactChart ? 6 : 10,
                    tickLabelStyle: {
                        fontSize: isCompactChart ? 10 : 12,
                        angle: isCompactChart ? -45 : 0,
                        fill: '#fff'
                    }
                }]}
                yAxis={[{
                    min: 0,
                    max: 100,
                    label: 'Focus (%)',
                    labelStyle: {
                        fontWeight: 'bold',
                        fill: '#fff'
                    },
                    tickLabelStyle: {
                        fill: '#fff'
                    },
                    colorMap: {
                        type: 'piecewise',
                        thresholds: [25, 50, 100],
                        colors: ['#cb1224', '#FD9200', '#1B885E']
                    }
                }]}
                series={[{
                    data: focusValues,
                    curve: 'linear',
                    showMark: false,
                    connectNulls: false,
                    valueFormatter: v => v == null ? '' : `${v}%`
                }]}
                margin={{
                    left: 60,
                    right: 30,
                    top: 30,
                    bottom: isCompactChart ? 90 : 60
                }}
            />
        </Box>
    );
}