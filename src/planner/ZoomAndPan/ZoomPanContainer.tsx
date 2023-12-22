import React, { forwardRef, useCallback, useEffect, useMemo } from 'react';
import { Box, BoxProps } from '@mui/material';
import { zoom, zoomIdentity, D3ZoomEvent } from 'd3-zoom';
import { select } from 'd3-selection';
import { useFitChildInParent, useMeasureElement } from './hooks';
import { ZoomPanControls } from './ZoomPanControls';
import { Rectangle } from '../types';
import { ZoomPanBackground, ZoomPanBackgroundHandle } from './background/ZoomPanBackground';
import { ZoomPanGrabber } from './ZoomPanGrabber';

export interface ZoomPanContainerProps extends BoxProps {
    /**
     * A bounding for of the children. It is e.g. used to calculate how to fit the children in the
     * container.
     */
    childrenBBox?: Rectangle;
    /**
     * Whether to show the pixel grid
     */
    showPixelGrid?: boolean;
    /**
     * Called when the zoom pan starts
     */
    onZoomPanStart?: () => void;
    /**
     * Called for every discrete step of the zoom pan
     * @param x The x coordinate of the top left corner of the container
     * @param y The y coordinate of the top left corner of the container
     * @param k The zoom level
     */
    onZoomPanTick?: (x: number, y: number, k: number) => void;
    /**
     * Called when the zoom pan ends
     * @param x The x coordinate of the top left corner of the container
     * @param y The y coordinate of the top left corner of the container
     * @param k The zoom level
     */
    onZoomPanEnd?: (x: number, y: number, k: number) => void;
    /**
     * Called when the lock button is clicked
     */
    onLock?: () => void;
    /**
     * Called when the unlock button is clicked
     */
    onUnlock?: () => void;
}

export const ZoomPanContainer = forwardRef<HTMLDivElement, ZoomPanContainerProps>((props, ref) => {
    const {
        children,
        childrenBBox,
        showPixelGrid,
        onZoomPanStart,
        onZoomPanTick,
        onZoomPanEnd,
        onLock,
        onUnlock,
        sx,
        ...boxProps
    } = props;

    // Refs
    const backgroundRef = React.useRef<ZoomPanBackgroundHandle>(null);
    const grabRef = React.useRef<HTMLDivElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Calculate the transforms to position the content nicely in the container
    const containerBBox = useMeasureElement(containerRef);
    const { transformToFitView, transformToCenter } = useFitChildInParent(containerBBox, childrenBBox);

    // Create a zoom behavior function
    const zoomBehaviour = useMemo(
        () =>
            zoom<HTMLDivElement, unknown>()
                // Allow zooom from 25% to 200%
                .scaleExtent([0.25, 2])
                .on('zoom', function handleZoom(event: D3ZoomEvent<HTMLDivElement, unknown>) {
                    const { x, y, k } = event.transform;
                    // Update the transform of the container
                    select(containerRef.current).style('transform', () => {
                        return `translate(${x}px, ${y}px) scale(${k})`;
                    });

                    // Update the transform of the background
                    backgroundRef.current?.updateTransform(x, y, k);

                    // Let the parent know about the zoom tick
                    onZoomPanTick?.(x, y, k);
                })
                .on('start', function handleZoomStart(event: D3ZoomEvent<HTMLDivElement, unknown>) {
                    onZoomPanStart?.();
                })
                .on('end', function handleZoomEnd(event: D3ZoomEvent<HTMLDivElement, unknown>) {
                    const { x, y, k } = event.transform;
                    onZoomPanEnd?.(x, y, k);
                }),
        [onZoomPanEnd, onZoomPanStart, onZoomPanTick]
    );

    // On mount, initialize zoom behavior
    useEffect(() => {
        if (grabRef?.current) {
            select(grabRef.current).call(zoomBehaviour);
        }
    }, [zoomBehaviour]);

    const zoomBy = useCallback(
        (k: number) => {
            if (grabRef?.current) {
                select(grabRef.current).transition().duration(300).call(zoomBehaviour.scaleBy, k);
            }
        },
        [zoomBehaviour.scaleBy]
    );

    const onZoomIn = useCallback(() => zoomBy(1.2), [zoomBy]);

    const onZoomOut = useCallback(() => zoomBy(0.8), [zoomBy]);

    const onFitToView = useCallback(() => {
        if (grabRef?.current) {
            const { x, y, k } = transformToFitView || { x: 0, y: 0, k: 1 };
            select(grabRef.current)
                .transition()
                .duration(750)
                .call(zoomBehaviour.transform, zoomIdentity.translate(x, y).scale(k));
        }
    }, [transformToFitView, zoomBehaviour.transform]);

    const onCenter = useCallback(() => {
        if (grabRef?.current) {
            const { x, y, k } = transformToCenter || { x: 0, y: 0, k: 1 };
            select(grabRef.current)
                .transition()
                .duration(750)
                .call(zoomBehaviour.transform, zoomIdentity.translate(x, y).scale(k));
        }
    }, [transformToCenter, zoomBehaviour.transform]);

    return (
        <Box
            ref={ref}
            sx={{
                ...sx,
                position: 'relative',
            }}
            {...boxProps}
        >
            {showPixelGrid && <ZoomPanBackground ref={backgroundRef} className="zoom-and-pan-background" />}

            <ZoomPanGrabber ref={grabRef} className="zoom-and-pan-grab-area" />

            <Box
                ref={containerRef}
                className="zoom-and-pan-container"
                sx={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    transform: 'translate(0px, 0px) scale(1)',
                    transformOrigin: 'left top',
                    pointerEvents: 'none',
                    '& > *': {
                        pointerEvents: 'initial',
                    },
                }}
            >
                {children}
            </Box>

            <ZoomPanControls
                className="zoom-and-pan-controls"
                data-kap-id="zoom-and-pan-controls"
                onZoomIn={onZoomIn}
                onZoomOut={onZoomOut}
                onFitToView={onFitToView}
                onCenter={onCenter}
                onLock={onLock}
                onUnlock={onUnlock}
            />
        </Box>
    );
});