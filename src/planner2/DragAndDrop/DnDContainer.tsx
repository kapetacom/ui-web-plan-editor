import React, { useMemo, useState } from 'react';
import { DropZoneEntity, DropZoneManager } from './DropZoneManager';
import { DnDPayload, PositionDiff } from './types';
import { DnDContext, DnDContextType } from './DnDContext';

export const DnDContainer = <T extends unknown>(props) => {
    const dzManager = useMemo(() => new DropZoneManager(), []);

    const registerDropZone = (id: string, zone: DropZoneEntity) => {
        dzManager.addZone(id, zone);
    };
    const unregisterDropZone = (id: string) => {
        dzManager.removeZoneById(id);
    };

    const defaultState = {
        state: 'IDLE',
        position: { x: 0, y: 0 },
    } as const;
    const [dragState, setDragState] = useState<{
        state: 'IDLE' | 'DRAGGING';
        draggable?: DnDPayload<T>;
        position: PositionDiff;
    }>(defaultState);

    const isDragging = dragState.state === 'IDLE';

    const callbacks: DnDContextType<T>['callbacks'] = {
        registerDropZone,
        unregisterDropZone,

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
    };

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
