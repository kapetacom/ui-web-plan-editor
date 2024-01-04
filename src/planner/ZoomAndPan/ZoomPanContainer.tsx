/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React, { forwardRef, useCallback, useEffect, useMemo } from 'react';
import { Box, BoxProps } from '@mui/material';
import { zoom, zoomIdentity, D3ZoomEvent, ZoomTransform } from 'd3-zoom';
import { select } from 'd3-selection';
import { useFitChildInParent, useMeasureElement } from './hooks';
import { ZoomPanControls } from './ZoomPanControls';
import { Rectangle } from '../types';
import { ZoomPanBackground, ZoomPanBackgroundHandle } from './background/ZoomPanBackground';
import { ZoomPanGrabber } from './ZoomPanGrabber';
import { ZoomPanVisualBounds, ZoomPanVisualBoundsHandle } from './ZoomPanVisualBounds';

export type InitialZoomPanViewOptions = {
    view: 'fit' | 'center';
    transitionDuration?: number;
};

export interface ZoomPanContainerProps extends BoxProps {
    /**
     * A bounding box for of the children. It is e.g. used to calculate how to fit the children in
     * the container.
     */
    childrenBBox?: Rectangle;
    /**
     * Whether to show the pixel grid
     */
    showPixelGrid?: boolean;
    /**
     * Whether a child is being dragged. Used to highlight the visual bounds. Defaults to false.
     */
    isDraggingChild?: boolean;
    /**
     * Whether the container is in view only mode. Defaults to false.
     */
    isViewOnly?: boolean;
    /**
     * The initial view of the container when it is mounted.
     */
    initialZoomPanView?: InitialZoomPanViewOptions;
    /**
     * Whether to show the zoom pan controls. Defaults to true.
     */
    showZoomPanControls?: boolean;
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
        isDraggingChild = false,
        isViewOnly = false,
        initialZoomPanView,
        showZoomPanControls = true,
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
    const visualBoundsRef = React.useRef<ZoomPanVisualBoundsHandle>(null);
    const grabRef = React.useRef<HTMLDivElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Calculate the transforms to position the content nicely in the container
    const containerBBox = useMeasureElement(containerRef);
    const { transformToFitView, transformToCenter, transformToCenterWithScaleDown } = useFitChildInParent(
        containerBBox,
        childrenBBox
    );
    const isReadyToAutoPosition = transformToFitView.k > 0 && transformToCenterWithScaleDown.k > 0;

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

                    // Update the transform of the visual bounds
                    visualBoundsRef.current?.updateTransform(x, y, k);

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

    // On mount, initialize the zoom behavior
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

    const onAutoPosition = useCallback(
        (transform: ZoomTransform, transitionDuration = 750) => {
            if (grabRef?.current) {
                const { x, y, k } = transform || { x: 0, y: 0, k: 1 };
                select(grabRef.current)
                    .transition()
                    .duration(transitionDuration)
                    .call(zoomBehaviour.transform, zoomIdentity.translate(x, y).scale(k));
            }
        },
        [zoomBehaviour.transform]
    );

    const onFitToView = useCallback(() => {
        onAutoPosition(transformToFitView, 750);
    }, [onAutoPosition, transformToFitView]);

    const onCenter = useCallback(() => {
        onAutoPosition(transformToCenter, 750);
    }, [onAutoPosition, transformToCenter]);

    // When initialZoomPanView is set we auto position to that view when the component is mounted.
    const [initialViewDone, setInitialViewDone] = React.useState(false);
    useEffect(() => {
        if (!initialZoomPanView || !isReadyToAutoPosition || initialViewDone) {
            return;
        }
        if (initialZoomPanView.view === 'center') {
            onAutoPosition(transformToCenterWithScaleDown, initialZoomPanView.transitionDuration);
            setInitialViewDone(true);
        } else if (initialZoomPanView.view === 'fit') {
            onAutoPosition(transformToFitView, initialZoomPanView.transitionDuration);
            setInitialViewDone(true);
        }
    }, [
        initialViewDone,
        initialZoomPanView?.view,
        initialZoomPanView?.transitionDuration,
        onAutoPosition,
        transformToCenterWithScaleDown,
        transformToFitView,
        initialZoomPanView,
        isReadyToAutoPosition,
    ]);

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

            <ZoomPanVisualBounds
                ref={visualBoundsRef}
                className="zoom-and-pan-visual-bounds"
                highlight={isDraggingChild}
            />

            <ZoomPanGrabber ref={grabRef} className="zoom-and-pan-grab-area" disabled={isViewOnly} />

            <Box
                ref={containerRef}
                className="zoom-and-pan-container"
                sx={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    transform: 'translate(0px, 0px) scale(1)',
                    transformOrigin: 'left top',
                    ...(initialZoomPanView
                        ? {
                              opacity: isReadyToAutoPosition ? 1 : 0,
                          }
                        : {}),
                    pointerEvents: 'none',
                    '& > *': {
                        // When not in view only mode, allow interaction with child elements
                        pointerEvents: isViewOnly ? undefined : 'auto',
                    },
                }}
            >
                {children}
            </Box>

            {showZoomPanControls && (
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
            )}
        </Box>
    );
});
