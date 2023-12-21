/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React, { CSSProperties, forwardRef, useId } from 'react';
import { ZoomTransform } from 'd3-zoom';

type DotPatternProps = {
    radius: number;
    color: string;
};

export function DotPattern({ color, radius }: DotPatternProps) {
    return <circle cx={radius} cy={radius} r={radius} fill={color} />;
}

export interface ZoomPanBackgroundProps {
    transform: ZoomTransform;
    style?: CSSProperties;
    patternColor: string;
}

/**
 * TODO: Very much a work in progress.. Not used yet!
 */
export const ZoomPanBackground = forwardRef<SVGPatternElement, ZoomPanBackgroundProps>((props, ref) => {
    const {
        transform: { k, x, y },
        style,
        patternColor,
    } = props;

    const size = 10;
    const scaledSize = size * k;
    const offset = 8;
    const patternOffset = scaledSize / offset;
    const patternId = useId();
    const radius = scaledSize / offset;

    return (
        <svg
            className="zoom-pan-background"
            style={{
                ...style,
                position: 'absolute',
                width: '100%',
                height: '100%',
                top: 0,
                left: 0,
            }}
            data-testid="rf__background"
        >
            <pattern
                ref={ref}
                id={patternId}
                x={x}
                y={y}
                width={scaledSize}
                height={scaledSize}
                patternUnits="userSpaceOnUse"
                patternTransform={`translate(-${patternOffset},-${patternOffset})`}
            >
                <DotPattern color={patternColor} radius={radius} />
            </pattern>
            <rect x="0" y="0" width="100%" height="100%" fill={`url(#${patternId})`} />
        </svg>
    );
});
