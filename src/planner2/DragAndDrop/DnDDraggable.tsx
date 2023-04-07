import { MouseEventHandler, useCallback, useContext, useEffect, useState } from 'react';
import { DnDPayload, DragEventInfo } from './types';
import { DnDContext } from './DnDContext';
import { DnDZoneContext, DnDZoneInstance } from './DnDDropZone';
import { Point } from '@kapeta/ui-web-types';

interface DnDCallbackProps extends DragEventInfo {
    isDragging: boolean;
    componentProps: {
        onMouseDown;
    };
}

interface DnDDraggableProps<T> {
    // payload for drag events
    data: T;
    disabled?: boolean;
    onDrag?: (dragEvent: DragEventInfo) => void;
    onDragStart?: (dragEvent: DragEventInfo) => void;
    onDrop?: (dragEvent: DragEventInfo) => void;
    children: (props: DnDCallbackProps) => JSX.Element;
}

enum DragStatus {
    IDLE,
    DRAGGING,
    DROPPED,
}

// TODO: change to include different coordinates: pageX/Y, zoneX/Y
const getDragEvent = (windowPosition: Point, initialPosition: Point): DragEventInfo['client'] => ({
    diff: {
        x: windowPosition.x - initialPosition.x,
        y: windowPosition.y - initialPosition.y,
    },
    end: windowPosition,
    start: initialPosition,
});

const getDragEventInfo = (
    root: HTMLElement | null | undefined,
    parentZone: DnDZoneInstance,
    currentPosition: Point,
    initialPosition: Point
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
        client: getDragEvent(currentPosition, initialPosition),
        zone: getDragEvent(currentZonePosition, initialPosition),
    };
};

const zeroPosition = { x: 0, y: 0 };
const zeroDragEvent = {
    client: getDragEvent(zeroPosition, zeroPosition),
    zone: getDragEvent(zeroPosition, zeroPosition),
};

export const DnDDraggable: <T extends DnDPayload>(props: DnDDraggableProps<T>) => JSX.Element = (
    props: DnDDraggableProps<any>
) => {
    // Track state here, use state callbacks to ensure consistency
    const ctx = useContext(DnDContext);
    const parentZone = useContext(DnDZoneContext);

    const [state, setState] = useState<{
        dragEvent: DragEventInfo;
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

            //Initial client position includes scroll
            const initialClientPosition = parentZone.getZoneCoordinates(initialPoint);

            const initialDragEvt = getDragEventInfo(ctx.root, parentZone, initialPoint, initialClientPosition);

            setState({
                status: DragStatus.DRAGGING,
                dragEvent: initialDragEvt,
            });
            ctx.callbacks.onDragStart(props.data, initialDragEvt, parentZone);

            let lastEvt = downEvt;
            // Transform scroll into drag events
            const unsubscribeZone = parentZone.onScrollChange(() => {
                const dragEvt = getDragEventInfo(
                    ctx.root,
                    parentZone,
                    {
                        x: lastEvt.clientX,
                        y: lastEvt.clientY,
                    },
                    initialClientPosition
                );
                setState({
                    status: DragStatus.DRAGGING,
                    dragEvent: dragEvt,
                });
            });
            const onMouseMove = (evt) => {
                lastEvt = evt;

                const dragEvt = getDragEventInfo(
                    ctx.root,
                    parentZone,
                    {
                        x: evt.clientX,
                        y: evt.clientY,
                    },
                    initialClientPosition
                );
                setState({
                    status: DragStatus.DRAGGING,
                    dragEvent: dragEvt,
                });
            };
            const onMouseUp = (evt: MouseEvent) => {
                const dragEvt = getDragEventInfo(
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
        [ctx.callbacks, parentZone, props.data, props.disabled]
    );

    const isDragging = state.status === DragStatus.DRAGGING;
    // Callback when isDragging changes
    useEffect(() => {
        if (isDragging && props.onDragStart) {
            props.onDragStart.call(null);
        }
    }, [isDragging, props.onDragStart]);

    // Callback when position changes
    useEffect(() => {
        if (isDragging) {
            if (props.onDrag) {
                props.onDrag(state.dragEvent);
            }
            ctx.callbacks.onDrag(props.data, state.dragEvent, parentZone);
        }
    });

    // Callback when a drag ends, then reset the state
    const isDropped = state.status === DragStatus.DROPPED;
    useEffect(() => {
        if (isDropped) {
            // Wait with resetting the position state, so the state is consistent when triggering onDrop
            if (props.onDrop) {
                props.onDrop(state.dragEvent);
            }

            ctx.callbacks.onDrop(props.data, state.dragEvent, parentZone);

            // Reset
            setState({
                dragEvent: zeroDragEvent,
                status: DragStatus.IDLE,
            });
        }
    }, [state.dragEvent, ctx.callbacks.onDrop, isDropped, props.onDrop, props.data]);

    // get single child
    return props.children({
        ...state.dragEvent,
        isDragging,
        componentProps: { onMouseDown: mouseDownHandler },
    });
};
