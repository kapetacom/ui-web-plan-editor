import React from 'react';
import { DnDPayload, DragEventInfo } from './types';
import { DropZoneEntity } from './DropZoneManager';

export interface DnDContextType<D extends DnDPayload = DnDPayload> {
    isDragging: boolean;
    /**
     * Reference to the current active draggable if any
     */
    draggable: D | null;

    callbacks: {
        /**
         * Add a drop zone target
         * Returns a deregistration callback
         */
        registerDropZone(id: string, zone: DropZoneEntity): void;
        unregisterDropZone(id: string): void;

        onDragStart(draggable: DnDPayload, dragEvent: DragEventInfo): void;
        onDrop(draggable: DnDPayload, dragEvent: DragEventInfo): void;
        // While dragging, this fires every n ms
        onDrag(draggable: DnDPayload, dragEvent: DragEventInfo): void;
    };
}

export const DnDContext = React.createContext<DnDContextType<any>>({
    isDragging: false,
    draggable: null,
    callbacks: {
        registerDropZone(id, zone) {},
        unregisterDropZone(id) {},
        onDragStart(draggable) {},
        onDrop(draggable) {},
        onDrag(draggable) {},
    },
});
