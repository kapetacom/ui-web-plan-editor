import React, {
    MouseEventHandler,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react';
import { DragEventInfo, PositionDiff } from './types';
import { DnDContext } from './DnDContext';

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

export const DnDDraggable: React.FC<DnDDraggableProps> = ({
    onDragStart,
    onDrag,
    onDrop,
    data,
    children,
}) => {
    // Track state here, use state callbacks to ensure consistency
    const ctx = useContext(DnDContext);
    const [state, setState] = useState<{
        position: PositionDiff;
        status: DragStatus;
    }>({
        position: { x: 0, y: 0 },
        status: DragStatus.IDLE,
    });

    const mouseDownHandler = useCallback<MouseEventHandler>(
        (downEvt) => {
            const initialPosition = {
                x: downEvt.clientX,
                y: downEvt.clientY,
            };

            const initialDragEvt = getDragEvent(
                initialPosition,
                initialPosition
            );
            setState({
                status: DragStatus.DRAGGING,
                position: initialDragEvt.diff,
            });
            ctx.callbacks.onDragStart(data, initialDragEvt);

            const onMouseMove = (evt) => {
                const dragEvt = getDragEvent(
                    { x: evt.clientX, y: evt.clientY },
                    initialPosition
                );
                setState({
                    status: DragStatus.DRAGGING,
                    position: dragEvt.diff,
                });

                ctx.callbacks.onDrag(data, dragEvt);
            };
            const onMouseUp = (evt: MouseEvent) => {
                const dragEvt = getDragEvent(
                    { x: evt.clientX, y: evt.clientY },
                    initialPosition
                );

                setState({
                    position: dragEvt.diff,
                    status: DragStatus.DROPPED,
                });

                window.removeEventListener('mousemove', onMouseMove);
                ctx.callbacks.onDrop(data, dragEvt);
            };
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp, {
                once: true,
            });
        },
        [ctx.callbacks, data]
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
        if (isDragging && onDrag) {
            onDrag(state.position);
        }
    }, [state.position, isDragging, onDrag]);

    // Callback when a drag ends, then reset the state
    const isDropped = state.status === DragStatus.DROPPED;
    useEffect(() => {
        if (isDropped) {
            // Wait with resetting the position state, so the state is consistent when triggering onDrop
            if (onDrop) {
                onDrop(state.position);
            }
            setState({
                position: { x: 0, y: 0 },
                status: DragStatus.IDLE,
            });
        }
    }, [state.position, isDropped, onDrop]);

    // get single child
    return children({
        isDragging,
        position: state.position,
        componentProps: { onMouseDown: mouseDownHandler },
    });
};
