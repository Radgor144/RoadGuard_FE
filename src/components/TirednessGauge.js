import {GaugeComponent} from "react-gauge-component";
import React from "react";

export const TirednessGauge = ({focusLevel}) => {
    return (<GaugeComponent
        value={focusLevel}
        type="radial"
        arc={{
            subArcs: [
                {limit: 25, color: '#cb1224'},
                {limit: 50, color: '#f59e0b'},
                {limit: 100, color: '#1b875e'}
            ]
        }}
        pointer={{type: "needle", color: "#ffffff", animationDuration: 1000}}
        labels={{
            valueLabel: {
                formatTextValue: (v) => v + '%',
                style: {fontSize: '40px', fill: '#fff'}
            }
        }}
        min={0}
        max={100}
        className="w-full h-90"
        marginInPercent={{top: 0.02, right: 0.02, bottom: 0.02, left: 0.02}}
    />);
}


