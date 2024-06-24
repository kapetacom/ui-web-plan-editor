/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React, { forwardRef, useLayoutEffect, useRef } from 'react';
import { select } from 'd3-selection';
import 'd3-transition';
import { Box, BoxProps } from '@mui/material';

export interface AutoFitIconProps extends BoxProps {
    autoFit: boolean;
    color?: string;
    size?: number;
}

export const AutoFitIcon = forwardRef<HTMLDivElement, AutoFitIconProps>((props, ref) => {
    const { autoFit, color = 'currentColor', size = 24, sx, ...boxProps } = props;

    const scaledSize = 24 * (size / 24);

    const contentRef = useRef<SVGPathElement>(null);

    // Animate the middle rectangle when autoFit changes
    useLayoutEffect(() => {
        if (contentRef.current) {
            select(contentRef.current)
                .transition()
                .duration(300)
                .attr('d', autoFit ? 'M 6 8 H 18 Q 18 8 18 8 V 16 H 6 Z' : 'M 6 8 H 16 Q 18 8 18 10 V 16 H 6 Z');
        }
    }, [autoFit]);

    return (
        <Box
            ref={ref}
            sx={{
                ...sx,
                display: 'inline-block',
                position: 'relative',
                width: `${scaledSize}px`,
                height: `${scaledSize}px`,
            }}
            {...boxProps}
        >
            <svg
                viewBox="0 0 24 24"
                width={scaledSize}
                height={scaledSize}
                xmlns="http://www.w3.org/2000/svg"
                style={{ fill: color, transition: 'fill 300ms ease-in-out' }}
            >
                <g>
                    {/* Rectangle in middle */}
                    <path
                        ref={contentRef}
                        style={{
                            transform: autoFit ? 'translate(0, 0)' : 'translate(4px, -4px)',
                            transition: 'transform 300ms cubic-bezier(.5,-1,.5,2)',
                        }}
                    />

                    {/* Top right corner */}
                    <path
                        style={{
                            transformOrigin: 'calc(100% - 2px) 4px',
                            transform: autoFit ? 'scale(1)' : 'scale(0.2)',
                            opacity: autoFit ? 1 : 0,
                            transition: 'transform 300ms cubic-bezier(.5,-1,.5,2), opacity 300ms ease-in-out',
                        }}
                        d="M 17 4 L 20 4 C 21.1 4 22 4.9 22 6 L 22 8 L 20 8 L 20 6 L 17 6 L 17 4 Z"
                    />

                    {/* Bottom right corner  */}
                    <path d="M 20 16 L 20 18 L 17 18 L 17 20 L 20 20 C 21.1 20 22 19.1 22 18 L 22 16 L 20 16 Z" />

                    {/* Bottom left corner  */}
                    <path d="M 7 18 L 4 18 L 4 16 L 2 16 L 2 18 C 2 19.1 2.9 20 4 20 L 7 20 L 7 18 Z" />

                    {/* Top left corner  */}
                    <path d="M 4 8 L 4 6 L 7 6 L 7 4 L 4 4 C 2.9 4 2 4.9 2 6 L 2 8 L 4 8 Z" />
                </g>
            </svg>
        </Box>
    );
});
