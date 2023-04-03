import React from 'react';

export function SVGDropShadow() {
    return (
        <defs>
            <filter id="drop-shadow" x="-100%" y="-100%" width="300%" height="300%">
                <feOffset result="offOut" in="SourceAlpha" dx="2" dy="2" />
                <feGaussianBlur result="blurOut" in="offOut" stdDeviation="3" />
                <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
                <feComponentTransfer>
                    <feFuncA type="linear" slope="0.4" />
                </feComponentTransfer>

                <feMerge>
                    <feMergeNode />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>
    );
}
