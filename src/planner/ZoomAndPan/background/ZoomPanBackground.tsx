/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

/**
 * This background component was initially copied from
 * [@reactflow/background](https://github.com/xyflow/xyflow/blob/v11/packages/background/src/Background.tsx)
 * and then modified to work with the ZoomPanContainer.
 */

import React, { forwardRef, memo, useId, useImperativeHandle } from 'react';
import { DotPattern, LinePattern } from './ZoomPanBackgroundPatterns';
import { CSSProperties } from 'react';

export enum BackgroundVariant {
    Lines = 'lines',
    Dots = 'dots',
    Cross = 'cross',
}

const variantColor = {
    [BackgroundVariant.Dots]: 'rgba(187, 132, 90, 0.2)',
    [BackgroundVariant.Lines]: 'rgba(187, 132, 90, 0.1)',
    [BackgroundVariant.Cross]: 'rgba(187, 132, 90, 0.15)',
};

const variantSize = {
    [BackgroundVariant.Dots]: 2,
    [BackgroundVariant.Lines]: 1,
    [BackgroundVariant.Cross]: 6,
};

const variantGap = {
    [BackgroundVariant.Dots]: 10,
    [BackgroundVariant.Lines]: 10,
    [BackgroundVariant.Cross]: 20,
};

export type ZoomPanBackgroundHandle = {
    updateTransform(x: number, y: number, k: number): void;
};

export type ZoomPanBackgroundProps = {
    color?: string;
    className?: string;
    gap?: number | [number, number];
    size?: number;
    offset?: number;
    lineWidth?: number;
    variant?: BackgroundVariant;
    style?: CSSProperties;
};

export const ZoomPanBackgroundUnmemoized = forwardRef<ZoomPanBackgroundHandle, ZoomPanBackgroundProps>((props, ref) => {
    const {
        variant = BackgroundVariant.Dots,
        gap = variantGap[variant], // for dots and cross
        size, // for lines and cross
        lineWidth = 1,
        offset = 2,
        color,
        style,
        className,
    } = props;

    const [transform, setTransform] = React.useState([0, 0, 1]);
    const patternColor = color || variantColor[variant];
    const patternSize = size || variantSize[variant];
    const isDots = variant === BackgroundVariant.Dots;
    const isCross = variant === BackgroundVariant.Cross;
    const gapXY: [number, number] = Array.isArray(gap) ? gap : [gap, gap];
    const scaledGap: [number, number] = [gapXY[0] * transform[2] || 1, gapXY[1] * transform[2] || 1];
    const scaledSize = patternSize * transform[2];
    const patternDimensions: [number, number] = isCross ? [scaledSize, scaledSize] : scaledGap;

    const patternOffset = isDots
        ? [scaledSize / offset, scaledSize / offset]
        : [patternDimensions[0] / offset, patternDimensions[1] / offset];

    const patternId = useId();

    // Expose updateTransform function to parent
    useImperativeHandle(ref, () => ({
        updateTransform(x: number, y: number, k: number) {
            setTransform([x, y, k]);
        },
    }));

    return (
        <svg
            className={className}
            style={{
                ...style,
                position: 'absolute',
                width: '100%',
                height: '100%',
                top: 0,
                left: 0,
            }}
        >
            <pattern
                id={patternId}
                x={transform[0] % scaledGap[0]}
                y={transform[1] % scaledGap[1]}
                width={scaledGap[0]}
                height={scaledGap[1]}
                patternUnits="userSpaceOnUse"
                patternTransform={`translate(-${patternOffset[0]},-${patternOffset[1]})`}
            >
                {isDots ? (
                    <DotPattern color={patternColor} radius={scaledSize / offset} />
                ) : (
                    <LinePattern dimensions={patternDimensions} color={patternColor} lineWidth={lineWidth} />
                )}
            </pattern>
            <rect x="0" y="0" width="100%" height="100%" fill={`url(#${patternId})`} />
        </svg>
    );
});

ZoomPanBackgroundUnmemoized.displayName = 'ZoomPanBackground';

export const ZoomPanBackground = memo(ZoomPanBackgroundUnmemoized);
