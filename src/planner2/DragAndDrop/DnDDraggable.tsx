import React, {
    MouseEventHandler,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react';
import { DragEventInfo, PositionDiff } from './types';
import { DnDContext } from './DnDContext';
import { DnDZoneContext } from './DnDDropZone';

interface DnDCallbackProps {
    isDragging: boolean;
    position: PositionDiff;
    componentProps: {
        onMouseDown;
    };
}
interface DnDDraggableProps {
    // payload for drag events
    data: any;
    onDrag?: (diff: PositionDiff) => void;
    onDragStart?: () => void;
    onDrop?: (position: PositionDiff) => void;
    children: (props: DnDCallbackProps) => JSX.Element;
}
enum DragStatus {
    IDLE,
    DRAGGING,
    DROPPED,
}

// TODO: change to include different coordinates: pageX/Y, zoneX/Y
const getDragEvent = (
    windowPosition: PositionDiff,
    initialPosition: PositionDiff
): DragEventInfo => ({
    diff: {
        x: windowPosition.x - initialPosition.x,
        y: windowPosition.y - initialPosition.y,
    },
    end: windowPosition,
    start: initialPosition,
});

const zeroPosition = { x: 0, y: 0 };
const zeroDragEvent = getDragEvent(zeroPosition, zeroPosition);

export const DnDDraggable: React.FC<DnDDraggableProps> = ({
    onDragStart,
    onDrag,
    onDrop,
    data,
    children,
}) => {
    // Track state here, use state callbacks to ensure consistency
    const ctx = useContext(DnDContext);
    const zoneCtx = useContext(DnDZoneContext);

    const [state, setState] = useState<{
        dragEvent: DragEventInfo;
        status: DragStatus;
    }>({
        dragEvent: zeroDragEvent,
        status: DragStatus.IDLE,
    });

    const mouseDownHandler = useCallback<MouseEventHandler>(
        (downEvt) => {
            const initialPosition = zoneCtx.getZoneCoordinates({
                y: downEvt.clientY,
                x: downEvt.clientX,
            });

            const initialDragEvt = getDragEvent(
                initialPosition,
                initialPosition
            );

            setState({
                status: DragStatus.DRAGGING,
                dragEvent: initialDragEvt,
            });
            ctx.callbacks.onDragStart(data, initialDragEvt);

            const onMouseMove = (evt) => {
                const dragEvt = getDragEvent(
                    zoneCtx.getZoneCoordinates({
                        x: evt.clientX,
                        y: evt.clientY,
                    }),
                    initialPosition
                );
                setState({
                    status: DragStatus.DRAGGING,
                    dragEvent: dragEvt,
                });
            };
            const onMouseUp = (evt: MouseEvent) => {
                const dragEvt = getDragEvent(
                    zoneCtx.getZoneCoordinates({
                        x: evt.clientX,
                        y: evt.clientY,
                    }),
                    initialPosition
                );

                setState({
                    dragEvent: dragEvt,
                    status: DragStatus.DROPPED,
                });
                window.removeEventListener('mousemove', onMouseMove);
            };
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp, {
                once: true,
            });
        },
        [ctx.callbacks, zoneCtx.getZoneCoordinates, data]
    );

    const isDragging = state.status === DragStatus.DRAGGING;
    // Callback when isDragging changes
    useEffect(() => {
        if (isDragging && onDragStart) {
            onDragStart();
        }
    }, [isDragging, onDragStart]);

    // Callback when position changes
    useEffect(() => {
        if (isDragging) {
            if (onDrag) {
                onDrag(state.dragEvent.diff);
            }
            ctx.callbacks.onDrag(data, state.dragEvent);
        }
    });

    // Callback when a drag ends, then reset the state
    const isDropped = state.status === DragStatus.DROPPED;
    useEffect(() => {
        if (isDropped) {
            // Wait with resetting the position state, so the state is consistent when triggering onDrop
            if (onDrop) {
                onDrop(state.dragEvent.diff);
            }
            ctx.callbacks.onDrop(data, state.dragEvent);

            // Reset
            setState({
                dragEvent: zeroDragEvent,
                status: DragStatus.IDLE,
            });
        }
    }, [state.dragEvent, ctx.callbacks, isDropped, onDrop, data]);

    // get single child
    return children({
        isDragging,
        position: state.dragEvent.diff,
        componentProps: { onMouseDown: mouseDownHandler },
    });
};
