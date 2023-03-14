import React, { useMemo, useState } from 'react';
import { DropZoneEntity, DropZoneManager } from './DropZoneManager';
import { DnDPayload, PositionDiff } from './types';
import { DnDContext } from './DnDContext';

const defaultState = {
    state: 'IDLE',
    position: { x: 0, y: 0 },
} as const;

export const DnDContainer = <T extends unknown>(props) => {
    const [dragState, setDragState] = useState<{
        state: 'IDLE' | 'DRAGGING';
        draggable?: DnDPayload<T>;
        position: PositionDiff;
    }>(defaultState);

    const isDragging = dragState.state !== 'IDLE';

    const { dzManager, callbacks } = useMemo(() => {
        return {
            dzManager: new DropZoneManager(),
            callbacks: {
                registerDropZone(id: string, zone: DropZoneEntity) {
                    dzManager.addZone(id, zone);
                },
                unregisterDropZone(id: string) {
                    dzManager.removeZoneById(id);
                },

                onDrag(draggable, dragEvent) {
                    setDragState({
                        state: 'DRAGGING',
                        draggable,
                        position: dragEvent.end,
                    });
                    dzManager.handleDragEvent(draggable, dragEvent);
                },
                onDrop(draggable, dragEvent) {
                    // Loop all elements to check intersection
                    dzManager.handleDropEvent(draggable, dragEvent);
                    setDragState(defaultState);
                },
                onDragStart(draggable, dragEvent) {
                    setDragState({
                        state: 'DRAGGING',
                        draggable,
                        position: dragEvent.end,
                    });
                },
            },
        };
    }, []);

    return (
        <DnDContext.Provider
            value={{
                isDragging,
                draggable: dragState.draggable || null,
                // setup methods
                callbacks,
            }}
        >
            {props.children}
        </DnDContext.Provider>
    );
};
