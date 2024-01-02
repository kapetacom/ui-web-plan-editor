/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React, { forwardRef, useImperativeHandle } from 'react';
import { useMeasureElement } from './hooks';

export type ZoomPanVisualBoundsHandle = {
    updateTransform(x: number, y: number, k: number): void;
};

export interface ZoomPanVisualBoundsProps {
    highlight: boolean;
    className?: string;
}

const BOUNDS_PADDING = [220, 5];

export const ZoomPanVisualBounds = forwardRef<ZoomPanVisualBoundsHandle, ZoomPanVisualBoundsProps>((props, ref) => {
    const { highlight, className } = props;

    const [transform, setTransform] = React.useState([0, 0, 1]);

    // Expose updateTransform function to parent
    useImperativeHandle(ref, () => ({
        updateTransform(x: number, y: number, k: number) {
            setTransform([x, y, k]);
        },
    }));

    // Get SVG bounding box
    const svgRef = React.useRef<SVGSVGElement>(null);
    const svgBBox = useMeasureElement(svgRef);

    // Coordinates of the visual bounds
    const startX = BOUNDS_PADDING[0] * transform[2] + transform[0];
    const startY = BOUNDS_PADDING[1] * transform[2] + transform[1];
    const endX = svgBBox.width;
    const endY = svgBBox.height;

    const pathD = `M ${startX} ${startY} L ${endX} ${startY} M ${startX} ${startY} L ${startX} ${endY}`;

    return (
        <svg
            ref={svgRef}
            className={className}
            style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                top: 0,
                left: 0,
            }}
        >
            <path
                d={pathD}
                stroke="#a96363"
                strokeWidth={2 * transform[2]}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${5 * transform[2]} ${5 * transform[2]}`}
                style={{
                    opacity: highlight ? 1 : 0,
                    transition: 'opacity 500ms ease-in-out 300ms',
                }}
            />
        </svg>
    );
});
