import React, { useMemo, useState } from 'react';
import { DropZoneEntity, DropZoneManager } from './DropZoneManager';
import { DnDPayload } from './types';
import { DnDCallbacks, DnDContext } from './DnDContext';
import { Point } from '@kapeta/ui-web-types';

const defaultState = {
    state: 'IDLE',
    position: { x: 0, y: 0 },
} as const;

interface Props {
    children: any;
    root: React.RefObject<HTMLElement>;
}

export const DnDContainer = <T extends unknown>(props: Props) => {
    const [dragState, setDragState] = useState<{
        state: 'IDLE' | 'DRAGGING';
        draggable?: DnDPayload;
        position: Point;
    }>(defaultState);

    const isDragging = dragState.state !== 'IDLE';

    const dzManager = useMemo(() => new DropZoneManager(), []);

    const callbacks = useMemo<DnDCallbacks>(() => {
        const callbacks: DnDCallbacks = {
            registerDropZone(id: string, zone: DropZoneEntity) {
                dzManager.addZone(id, zone);
            },
            unregisterDropZone(id: string) {
                dzManager.removeZoneById(id);
            },

            onDrag(draggable, dragEvent, fromZone) {
                setDragState({
                    state: 'DRAGGING',
                    draggable,
                    position: dragEvent.zone.end,
                });
                dzManager.handleDragEvent(draggable, dragEvent, fromZone, props.root.current);
            },
            onDrop(draggable, dragEvent, fromZone) {
                console.log('props.root.current', props.root.current);
                // Loop all elements to check intersection
                dzManager.handleDropEvent(draggable, dragEvent, fromZone, props.root.current);
                setDragState(defaultState);
            },
            onDragStart(draggable, dragEvent, fromZone) {
                setDragState({
                    state: 'DRAGGING',
                    draggable,
                    position: dragEvent.zone.end,
                });
            },
        };
        return callbacks;
    }, [props.root.current]);

    return (
        <DnDContext.Provider
            value={{
                isDragging,
                draggable: dragState.draggable || null,
                root: props.root.current,
                // setup methods
                callbacks,
            }}
        >
            {props.children}
        </DnDContext.Provider>
    );
};
