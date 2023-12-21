import React, { useCallback, useEffect, useMemo } from 'react';
import { Box, BoxProps } from '@mui/material';
import { zoom, zoomIdentity, D3ZoomEvent } from 'd3-zoom';
import { select } from 'd3-selection';
import { useFitChildInParent, useMeasureElement } from './hooks';
import { ZoomPanControls } from './ZoomPanControls';
import { Rectangle } from '../types';
import { ZoomPanBackground, ZoomPanBackgroundHandle } from './background/ZoomPanBackground';

export interface ZoomPanContainerProps extends BoxProps {
    onZoomChange?: (zoom: number) => void;
    onPanChange?: (x: number, y: number) => void;
    onLock?: () => void;
    onUnlock?: () => void;
    contentBBox?: Rectangle;
    disableZoomPan?: boolean;
}

export const ZoomPanContainer = (props: ZoomPanContainerProps) => {
    const {
        onZoomChange,
        onPanChange,
        onLock,
        onUnlock,
        contentBBox,
        disableZoomPan = false,
        children,
        sx,
        ...boxProps
    } = props;

    const backgroundRef = React.useRef<ZoomPanBackgroundHandle>(null);
    const parentRef = React.useRef<HTMLDivElement>(null);
    const childRef = React.useRef<HTMLDivElement>(null);

    const parentBBox = useMeasureElement(parentRef);
    const { transformToFitView, transformToCenter } = useFitChildInParent(parentBBox, contentBBox);

    // Create a zoom behavior function
    const zoomBehaviour = useMemo(
        () =>
            zoom<HTMLDivElement, unknown>()
                .scaleExtent([0.5, 2])
                .on('zoom', function handleZoom(event: D3ZoomEvent<HTMLDivElement, unknown>) {
                    const { x, y, k } = event.transform;
                    select(childRef.current).style('transform', () => {
                        return `translate(${x}px, ${y}px) scale(${k})`;
                    });
                    backgroundRef.current?.updateTransform(x, y, k);
                })
                .on('end', function handleZoomEnd(event: D3ZoomEvent<HTMLDivElement, unknown>) {
                    const { x, y, k } = event.transform;
                    onZoomChange?.(k);
                    onPanChange?.(x, y);
                }),
        [onPanChange, onZoomChange]
    );

    // Initialize zoom behavior
    const initZoom = useCallback(() => {
        if (parentRef?.current) {
            select(parentRef.current).call(zoomBehaviour);
        }
    }, [zoomBehaviour]);

    const removeZoom = useCallback(() => {
        if (parentRef?.current) {
            select(parentRef.current).on('.zoom', null);
        }
    }, []);

    // Initialize or remove zoom behavior based on disableZoomPan prop
    useEffect(() => {
        if (disableZoomPan) {
            removeZoom();
        } else {
            initZoom();
        }
    }, [disableZoomPan, initZoom, removeZoom]);

    const zoomBy = useCallback(
        (k: number) => {
            if (parentRef?.current) {
                select(parentRef.current).transition().duration(300).call(zoomBehaviour.scaleBy, k);
                onZoomChange?.(k);
            }
        },
        [onZoomChange, zoomBehaviour.scaleBy]
    );
    const onZoomIn = useCallback(() => zoomBy(1.2), [zoomBy]);
    const onZoomOut = useCallback(() => zoomBy(0.8), [zoomBy]);

    const onFitToView = useCallback(async () => {
        if (parentRef?.current) {
            const { x, y, k } = transformToFitView || { x: 0, y: 0, k: 1 };
            await select(parentRef.current)
                .transition()
                .duration(750)
                .call(zoomBehaviour.transform, zoomIdentity.translate(x, y).scale(k))
                .end();
            onZoomChange?.(k);
            onPanChange?.(x, y);
        }
    }, [onPanChange, onZoomChange, transformToFitView, zoomBehaviour.transform]);

    const onCenter = useCallback(async () => {
        if (parentRef?.current) {
            const { x, y, k } = transformToCenter || { x: 0, y: 0, k: 1 };
            await select(parentRef.current)
                .transition()
                .duration(750)
                .call(zoomBehaviour.transform, zoomIdentity.translate(x, y).scale(k))
                .end();
            onZoomChange?.(k);
            onPanChange?.(x, y);
        }
    }, [onPanChange, onZoomChange, transformToCenter, zoomBehaviour.transform]);

    return (
        <Box
            sx={{
                ...sx,
                position: 'relative',
            }}
            {...boxProps}
        >
            <ZoomPanBackground ref={backgroundRef} className="zoom-and-pan-background" />
            <Box
                ref={parentRef}
                className="zoom-and-pan-container"
                sx={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    overflow: 'hidden',
                }}
            >
                <Box
                    ref={childRef}
                    className="zoom-and-pan-child"
                    sx={{
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        transform: 'translate(0px, 0px) scale(1)',
                        transformOrigin: 'left top',

                        // Background dots (TODO: Refactor to use SVG pattern)
                        // '&::before': {
                        //     content: '""',

                        //     position: 'absolute',
                        //     width: '100%',
                        //     height: '100%',
                        //     top: 0,
                        //     left: 0,

                        //     backgroundImage: 'radial-gradient(#bb845a 1px, transparent 0)',
                        //     backgroundSize: '7px 7px',
                        //     backgroundPosition: '-8.5px -8.5px',

                        //     WebkitMaskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,0.15), transparent 100%)',
                        // },
                    }}
                >
                    {children}
                </Box>
                Z
            </Box>

            <ZoomPanControls
                onZoomIn={onZoomIn}
                onZoomOut={onZoomOut}
                onFitToView={onFitToView}
                onCenter={onCenter}
                onLock={onLock}
                onUnlock={onUnlock}
            />
        </Box>
    );
};
