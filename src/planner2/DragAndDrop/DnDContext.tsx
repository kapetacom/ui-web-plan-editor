import React from 'react';
import { DnDPayload, DragEventInfo } from './types';
import { DropZoneEntity } from './DropZoneManager';
import { DnDZoneInstance } from './DnDDropZone';

export interface DnDCallbacks {
    /**
     * Add a drop zone target
     * Returns a deregistration callback
     */
    registerDropZone(id: string, zone: DropZoneEntity): void;
    unregisterDropZone(id: string): void;

    onDragStart(draggable: DnDPayload, dragEvent: DragEventInfo, fromZone: DnDZoneInstance): void;
    onDrop(draggable: DnDPayload, dragEvent: DragEventInfo, fromZone: DnDZoneInstance): void;
    // While dragging, this fires every n ms
    onDrag(draggable: DnDPayload, dragEvent: DragEventInfo, fromZone: DnDZoneInstance): void;
}

export interface DnDContextType<D extends DnDPayload = DnDPayload> {
    isDragging: boolean;
    /**
     * Reference to the current active draggable if any
     */
    draggable: D | null;

    root?: HTMLElement | null;

    callbacks: DnDCallbacks;
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
