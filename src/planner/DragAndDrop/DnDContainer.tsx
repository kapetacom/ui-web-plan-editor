/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React, { useMemo, useState } from 'react';
import { DropZoneEntity, DropZoneManager } from './DropZoneManager';
import { DnDPayload } from './types';
import { DnDCallbacks, DnDContext } from './DnDContext';
import { Point } from '@kapeta/ui-web-types';
import { DnDZoneInstance } from './DnDDropZone';

const defaultState = {
    state: 'IDLE',
    position: { x: 0, y: 0 },
} as const;

interface Props {
    children: any;
    root: React.RefObject<HTMLElement>;
}

export const DnDContainer = <T extends DnDPayload>(props: Props) => {
    const [dragState, setDragState] = useState<{
        state: 'IDLE' | 'DRAGGING';
        draggable?: T;
        position: Point;
    }>(defaultState);

    const isDragging = dragState.state !== 'IDLE';

    const dzManager = useMemo(() => new DropZoneManager(), []);

    const callbacks = useMemo<DnDCallbacks<T>>(() => {
        return {
            registerDropZone(id: string, zone: DropZoneEntity, payload: DnDPayload<T>) {
                dzManager.addZone(id, zone, payload);
            },
            unregisterDropZone(id: string) {
                dzManager.removeZoneById(id);
            },

            onDrag(dragEvent, fromZone) {
                setDragState({
                    state: 'DRAGGING',
                    draggable: dragEvent.sourceDraggable,
                    position: dragEvent.zone.end,
                });
                dzManager.handleDragEvent(dragEvent, fromZone, props.root.current);
            },
            onDragEnd(dragEvent, fromZone) {
                setDragState(defaultState);
            },
            onDrop(dragEvent, fromZone, callback) {
                // Loop all elements to check intersection
                dzManager.handleDropEvent(dragEvent, fromZone, props.root.current, callback);
                setDragState(defaultState);
            },
            onDragStart(dragEvent, _fromZone) {
                setDragState({
                    state: 'DRAGGING',
                    draggable: dragEvent.sourceDraggable,
                    position: dragEvent.zone.end,
                });
            },
        };
    }, [props.root, dzManager]);

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
