/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Box } from '@mui/material';

export type UseResizeProps = {
    /**
     * The direction of the resize. If 'left', the resize will work for the 'left' side of the
     * element. Default is 'left'.
     */
    direction?: 'left' | 'right';
    /**
     * The initial width of the element.
     */
    initialWidth: number;
    /**
     * The minimum width of the element. Default is 200.
     */
    minWidth?: number;
    /**
     * The maximum width of the element.
     */
    maxWidth?: number;
};

export const useResize = (props: UseResizeProps) => {
    const { direction = 'left', initialWidth, minWidth = 400, maxWidth } = props;
    const [isResizing, setIsResizing] = useState(false);
    const [width, setWidth] = useState(initialWidth);
    const [initialPosition, setInitialPosition] = useState(0);

    const onResize = useCallback((event: React.MouseEvent) => {
        setIsResizing(true);
        setInitialPosition(event.clientX); // Store the initial position when resize starts
    }, []);

    const disableResize = useCallback(() => {
        setIsResizing(false);
    }, []);

    const resize = useCallback(
        (e: MouseEvent) => {
            if (isResizing) {
                // Using requestAnimationFrame to handle the resize logic
                window.requestAnimationFrame(() => {
                    const delta = e.clientX - initialPosition;
                    let newWidth = direction === 'left' ? width - delta : width + delta;

                    // Constrain the newWidth to be within minWidth and maxWidth
                    newWidth = Math.max(minWidth, newWidth);
                    if (maxWidth !== undefined) {
                        newWidth = Math.min(maxWidth, newWidth);
                    }

                    // Only update the width and initialPosition if within constraints
                    if (newWidth !== width) {
                        setWidth(newWidth);
                        setInitialPosition(e.clientX);
                    }
                });
            }
        },
        [isResizing, initialPosition, direction, width, minWidth, maxWidth]
    );

    useEffect(() => {
        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', disableResize);

        return () => {
            document.removeEventListener('mousemove', resize);
            document.removeEventListener('mouseup', disableResize);
        };
    }, [resize, disableResize]);

    return {
        onResize,
        isResizing,
        width: `min(${width}px, 100%)`,
        minWidth: `${minWidth}px`,
    };
};

interface VerticalResizeHandleProps {
    onResize: (event: React.MouseEvent) => void;
    placement: 'left' | 'right';
}

/**
 * A vertical resize handle that can be used to resize a component vertically. The handle is placed
 * on the left or right side of the component.
 */
export const VerticalResizeHandle = ({ onResize, placement }: VerticalResizeHandleProps) => {
    return (
        <Box
            sx={{
                position: 'absolute',
                width: 16,
                top: 0,
                bottom: 0,
                ...(placement === 'left' ? { left: -8 } : { right: -8 }),
                cursor: 'col-resize',
                '&:hover': { '>div': { opacity: 1 } },
                userSelect: 'none',
            }}
            onMouseDown={onResize}
        >
            <Box
                sx={{
                    position: 'absolute',
                    left: '8px',
                    height: '100%',
                    width: '3px',
                    backgroundColor: 'black',
                    opacity: 0,
                    transition: 'opacity 500ms ease-in-out 250ms',
                }}
            />
        </Box>
    );
};
