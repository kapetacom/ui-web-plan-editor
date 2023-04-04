import { MouseEventHandler, useCallback, useContext, useEffect, useState } from 'react';
import { DnDPayload, DragEventInfo, PositionDiff } from './types';
import { DnDContext } from './DnDContext';
import { DnDZoneContext, DnDZoneInstance } from './DnDDropZone';

interface DnDCallbackProps {
    isDragging: boolean;
    position: PositionDiff;
    componentProps: {
        onMouseDown;
    };
}

interface DnDDraggableProps<T> {
    // payload for drag events
    data: T;
    disabled?: boolean;
    onDrag?: (dragEvent: DragEventInfo) => void;
    onDragStart?: () => void;
    onDrop?: (dragEvent: DragEventInfo) => void;
    children: (props: DnDCallbackProps) => JSX.Element;
}

enum DragStatus {
    IDLE,
    DRAGGING,
    DROPPED,
}

// TODO: change to include different coordinates: pageX/Y, zoneX/Y
const getDragEvent = (windowPosition: PositionDiff, initialPosition: PositionDiff): DragEventInfo['client'] => ({
    diff: {
        x: windowPosition.x - initialPosition.x,
        y: windowPosition.y - initialPosition.y,
    },
    end: windowPosition,
    start: initialPosition,
});

const getDragEventInfo = (
    parentZone: DnDZoneInstance,
    currentPosition: PositionDiff,
    initialPosition: PositionDiff
) => {
    const currentZonePosition = parentZone.getZoneCoordinates(currentPosition);
    const initialZonePosition = parentZone.getZoneCoordinates(initialPosition);
    return {
        client: getDragEvent(currentPosition, initialPosition),
        zone: getDragEvent(currentZonePosition, initialZonePosition),
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

            const initialClientPosition = {
                y: downEvt.clientY,
                x: downEvt.clientX,
            };

            const initialDragEvt = getDragEventInfo(parentZone, initialClientPosition, initialClientPosition);

            setState({
                status: DragStatus.DRAGGING,
                dragEvent: initialDragEvt,
            });
            ctx.callbacks.onDragStart(props.data, initialDragEvt);

            let lastEvt = downEvt;
            // Transform scroll into drag events
            const unsubscribeZone = parentZone.onScrollChange(() => {
                const dragEvt = getDragEventInfo(
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
            ctx.callbacks.onDrag(props.data, state.dragEvent);
        }
    });

    // Callback when a drag ends, then reset the state
    const isDropped = state.status === DragStatus.DROPPED;
    useEffect(() => {
        if (isDropped) {
            // Wait with resetting the position state, so the state is consistent when triggering onDrop
            if (props.onDrop) {
                props.onDrop.call(null, state.dragEvent);
            }
            ctx.callbacks.onDrop.call(null, props.data, state.dragEvent);

            // Reset
            setState({
                dragEvent: zeroDragEvent,
                status: DragStatus.IDLE,
            });
        }
    }, [state.dragEvent, ctx.callbacks.onDrop, isDropped, props.onDrop, props.data]);

    // get single child
    return props.children({
        isDragging,
        position: state.dragEvent.zone.diff,
        componentProps: { onMouseDown: mouseDownHandler },
    });
};
