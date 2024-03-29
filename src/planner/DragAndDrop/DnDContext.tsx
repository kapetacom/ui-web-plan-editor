/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React from 'react';
import { DnDPayload, DragEventInfo } from './types';
import { DropZoneEntity } from './DropZoneManager';
import { DnDZoneInstance } from './DnDDropZone';

export interface DnDCallbacks<T extends DnDPayload> {
    /**
     * Add a drop zone target
     * Returns a deregistration callback
     */
    registerDropZone(id: string, zone: DropZoneEntity, payload?: DnDPayload): void;
    unregisterDropZone(id: string): void;

    onDragStart(dragEvent: DragEventInfo<T>, fromZone: DnDZoneInstance): void;
    onDragEnd(dragEvent: DragEventInfo<T>, fromZone: DnDZoneInstance): void;
    onDrop(
        dragEvent: DragEventInfo<T>,
        fromZone: DnDZoneInstance,
        cb?: (dragEvent: DragEventInfo<DnDPayload<T>>) => void
    ): void;
    // While dragging, this fires every n ms
    onDrag(dragEvent: DragEventInfo<T>, fromZone: DnDZoneInstance): void;
}

export interface DnDContextType<D extends DnDPayload = DnDPayload> {
    isDragging: boolean;
    /**
     * Reference to the current active draggable if any
     */
    draggable: D | null;

    root?: HTMLElement | null;

    callbacks: DnDCallbacks<D>;
}

export const DnDContext = React.createContext<DnDContextType<any>>({
    isDragging: false,
    draggable: null,
    callbacks: {
        registerDropZone(id, zone) {},
        unregisterDropZone(id) {},
        onDragStart(draggable) {},
        onDragEnd(draggable) {},
        onDrop(draggable) {},
        onDrag(draggable) {},
    },
});
