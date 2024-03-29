/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { MouseEventHandler, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { DnDPayload, DragEventInfo } from './types';
import { DnDContext } from './DnDContext';
import { DnDZoneContext, DnDZoneInstance } from './DnDDropZone';
import { Point } from '@kapeta/ui-web-types';

interface DnDCallbackProps<T extends DnDPayload> extends DragEventInfo<T> {
    isDragging: boolean;
    componentProps: {
        onMouseDown: MouseEventHandler;
    };
}

interface DnDDraggableProps<T extends DnDPayload> {
    // payload for drag events
    data: T;
    disabled?: boolean;
    onDrag?: (dragEvent: DragEventInfo<T>) => void;
    onDragStart?: (dragEvent: DragEventInfo<T>) => void;
    onDragEnd?: (dragEvent: DragEventInfo<T>) => void;
    onDrop?: (dragEvent: DragEventInfo<T>) => void;
    children: (props: DnDCallbackProps<T>) => JSX.Element;
}

enum DragStatus {
    IDLE,
    DRAGGING,
    DROPPED,
}

// TODO: change to include different coordinates: pageX/Y, zoneX/Y
const getDragEvent = (windowPosition: Point, initialPosition: Point): DragEventInfo<any>['client'] => ({
    diff: {
        x: windowPosition.x - initialPosition.x,
        y: windowPosition.y - initialPosition.y,
    },
    end: windowPosition,
    start: initialPosition,
});

const getDragEventInfo = (
    data: DnDPayload,
    root: HTMLElement | null | undefined,
    parentZone: DnDZoneInstance,
    currentPosition: Point,
    initialPosition: Point,
    diff?: Point
) => {
    let currentZonePosition: Point;

    if (parentZone.isValid()) {
        currentZonePosition = parentZone.getZoneCoordinates(currentPosition);
    } else if (root) {
        const bbox = root.getBoundingClientRect();
        currentZonePosition = {
            x: currentPosition.x - bbox.x,
            y: currentPosition.y - bbox.y,
        };
    } else {
        currentZonePosition = currentPosition;
    }

    return {
        sourceDraggable: data,
        client: getDragEvent(currentPosition, initialPosition),
        zone: getDragEvent(currentZonePosition, initialPosition),
        diff: diff || { x: 0, y: 0 },
    };
};

const zeroPosition = { x: 0, y: 0 };
const zeroDragEvent = {
    sourceDraggable: { type: '', data: {} },
    client: getDragEvent(zeroPosition, zeroPosition),
    zone: getDragEvent(zeroPosition, zeroPosition),
    diff: zeroPosition,
};

export const DnDDraggable: <T extends DnDPayload>(props: DnDDraggableProps<T>) => JSX.Element = (
    props: DnDDraggableProps<any>
) => {
    // Track state here, use state callbacks to ensure consistency
    const ctx = useContext(DnDContext);
    const parentZone = useContext(DnDZoneContext);

    const [state, setState] = useState<{
        dragEvent: DragEventInfo<any>;
        status: DragStatus;
    }>({
        dragEvent: zeroDragEvent,
        status: DragStatus.IDLE,
    });

    const mouseDownHandler = useCallback<MouseEventHandler>(
        (downEvt) => {
            if (props.disabled) {
                return;
            }

            const initialPoint = {
                y: downEvt.clientY,
                x: downEvt.clientX,
            };

            let mouseActionTimeout: NodeJS.Timeout | undefined;
            const cancelActionTimeout = () => mouseActionTimeout && clearTimeout(mouseActionTimeout);

            // Consider a mouseDown as a drag if the mouse moves more than 2px or if the mouse is down for more than 200ms
            // This is to avoid triggering a drag when the user clicks on a draggable element
            const dragMinTime = 200;
            const startTime = Date.now();

            // Initial client position includes scroll
            const initialClientPosition = parentZone.getZoneCoordinates(initialPoint);
            const initialDragEvt = getDragEventInfo(
                props.data,
                ctx.root,
                parentZone,
                initialPoint,
                initialClientPosition
            );

            let dragTimeout: NodeJS.Timeout | undefined;
            const setStatusFromEvent = (evt: typeof initialDragEvt) => {
                clearTimeout(dragTimeout);
                dragTimeout = undefined;

                setState((prevState) => {
                    if (prevState.status === DragStatus.DRAGGING) {
                        return {
                            status: DragStatus.DRAGGING,
                            dragEvent: evt,
                        };
                    }

                    if (
                        Math.abs(evt.zone.diff.x) + Math.abs(evt.zone.diff.y) > 2 ||
                        Date.now() - startTime > dragMinTime
                    ) {
                        return {
                            status: DragStatus.DRAGGING,
                            dragEvent: evt,
                        };
                    }
                    return {
                        status: prevState.status,
                        dragEvent: evt,
                    };
                });
            };
            dragTimeout = setTimeout(() => {
                setStatusFromEvent(initialDragEvt);
            }, dragMinTime);

            setState({
                status: DragStatus.IDLE,
                dragEvent: initialDragEvt,
            });

            let lastEvt = downEvt.nativeEvent;
            // Transform scroll into drag events
            const unsubscribeZone = parentZone.onScrollChange(() => {
                const dragEvt = getDragEventInfo(
                    props.data,
                    ctx.root,
                    parentZone,
                    {
                        x: lastEvt.clientX,
                        y: lastEvt.clientY,
                    },
                    initialClientPosition
                );
                setStatusFromEvent(dragEvt);
            });
            const onMouseMove = (evt: MouseEvent) => {
                cancelActionTimeout();

                const dragEvt = getDragEventInfo(
                    props.data,
                    ctx.root,
                    parentZone,
                    {
                        x: evt.clientX,
                        y: evt.clientY,
                    },
                    initialClientPosition,
                    {
                        x: lastEvt.clientX ? evt.clientX - lastEvt.clientX : 0,
                        y: lastEvt.clientY ? evt.clientY - lastEvt.clientY : 0,
                    }
                );
                lastEvt = evt;
                setStatusFromEvent(dragEvt);

                mouseActionTimeout = setTimeout(() => {
                    // Ensure we send a "standing still" event after 100ms
                    const dragEvt = getDragEventInfo(
                        props.data,
                        ctx.root,
                        parentZone,
                        {
                            x: evt.clientX,
                            y: evt.clientY,
                        },
                        initialClientPosition
                    );
                    setStatusFromEvent(dragEvt);
                }, 100);
            };
            const onMouseUp = (evt: MouseEvent) => {
                // Remember cleanup in case the drag is cancelled (mouseup)
                clearTimeout(dragTimeout);
                cancelActionTimeout();

                const dragEvt = getDragEventInfo(
                    props.data,
                    ctx.root,
                    parentZone,
                    {
                        x: evt.clientX,
                        y: evt.clientY,
                    },
                    initialClientPosition
                );

                setState({
                    dragEvent: dragEvt,
                    status: DragStatus.DROPPED,
                });
                window.removeEventListener('mousemove', onMouseMove);
                unsubscribeZone();
            };
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp, {
                once: true,
            });
        },
        [parentZone, props.data, props.disabled, ctx.root]
    );

    const isDragging = state.status === DragStatus.DRAGGING;
    const prevDragging = useRef(isDragging);
    // Callback when isDragging changes
    useEffect(() => {
        if (isDragging && !prevDragging.current) {
            if (props.onDragStart) {
                props.onDragStart(state.dragEvent);
            }
            ctx.callbacks.onDragStart(state.dragEvent, parentZone);
        }

        if (!isDragging && prevDragging.current) {
            if (props.onDragEnd) {
                props.onDragEnd(state.dragEvent);
            }
            ctx.callbacks.onDragEnd(state.dragEvent, parentZone);
        }
        prevDragging.current = isDragging;
    }, [ctx.callbacks.onDragStart, isDragging, parentZone, state.dragEvent]);

    // Callback when position changes
    useEffect(() => {
        if (isDragging) {
            if (props.onDrag) {
                props.onDrag(state.dragEvent);
            }
            ctx.callbacks.onDrag(state.dragEvent, parentZone);
        }
    }, [isDragging, state.dragEvent, ctx.callbacks, parentZone]);

    // Callback when a drag ends, then reset the state
    const isDropped = state.status === DragStatus.DROPPED;
    const { onDrop, data } = props;
    useEffect(() => {
        if (isDropped) {
            // Wait with resetting the position state, so the state is consistent when triggering onDrop
            if (props.onDrop) {
                props.onDrop(state.dragEvent);
            }
            ctx.callbacks.onDrop(state.dragEvent, parentZone, onDrop);

            // Reset
            setState({
                dragEvent: zeroDragEvent,
                status: DragStatus.IDLE,
            });
        }
    }, [state.dragEvent, ctx.callbacks.onDrop, isDropped, onDrop, data, ctx.callbacks, parentZone]);

    // get single child
    return props.children({
        ...state.dragEvent,
        isDragging,
        componentProps: { onMouseDown: mouseDownHandler },
    });
};
