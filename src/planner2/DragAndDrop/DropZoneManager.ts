import { DragEventInfo } from './types';

export interface DropZoneEntity<T = any> {
    element: HTMLElement;
    accept?: (draggable: T) => boolean;
    onDrop?: (draggable: T, info: DragEventInfo) => Promise<void> | void;
    onDragEnter?: (draggable: T) => Promise<void> | void;
    onDragLeave?: (draggable: T) => Promise<void> | void;
    onDragOver?: (draggable: T) => Promise<void> | void;
}

interface DropZoneState<T = any> {
    id: string;
    zone: DropZoneEntity<T>;
    state: 'IDLE' | 'ACTIVE';
}
export class DropZoneManager {
    private zones: DropZoneState[] = [];

    private checkContainment<T>(
        dropZone: DropZoneEntity,
        evt: { x: number; y: number }
    ): boolean {
        const bounds = dropZone.element.getBoundingClientRect();
        const isContained =
            bounds.x <= evt.x &&
            bounds.x + bounds.width >= evt.x &&
            bounds.y < evt.y &&
            bounds.y + bounds.height >= evt.y;
        return isContained;
    }

    addZone(id: string, zone: DropZoneEntity) {
        const entry: DropZoneState = this.zones.find((z) => z.id === id) || {
            id,
            zone,
            state: 'IDLE',
        };
        if (!this.zones.includes(entry)) {
            this.zones.push(entry);
        }
    }

    handleDragEvent(draggable, evt: DragEventInfo) {
        // callbacks based on state change?, or kept "instant"?
        // Loop all elements to check intersection
        for (const dropZone of this.zones.filter((zone) =>
            zone.zone.accept ? zone.zone.accept(draggable) : true
        )) {
            const isContained = this.checkContainment(dropZone.zone, evt.end);

            if (isContained) {
                if (dropZone.state === 'IDLE') {
                    if (dropZone.zone.onDragEnter) {
                        dropZone.zone.onDragEnter(draggable);
                    }
                } else if (dropZone.state === 'ACTIVE') {
                    if (dropZone.zone.onDragOver) {
                        dropZone.zone.onDragOver(draggable);
                    }
                }
                dropZone.state = 'ACTIVE';
            } else {
                if (dropZone.state === 'ACTIVE') {
                    if (dropZone.zone.onDragLeave) {
                        dropZone.zone.onDragLeave(draggable);
                    }
                }
                dropZone.state = 'IDLE';
            }
        }
    }

    handleDropEvent(draggable, evt: DragEventInfo) {
        // Loop all elements to check intersection
        for (const dropZone of this.zones.filter((zone) =>
            zone.zone.accept ? zone.zone.accept(draggable) : true
        )) {
            const isContained = this.checkContainment(dropZone.zone, evt.end);

            if (isContained) {
                if (dropZone.zone.onDrop) {
                    dropZone.zone.onDrop(draggable, evt);
                }
                dropZone.state = 'IDLE';
            }
        }
    }

    removeZoneById(id: string) {
        const ix = this.zones.findIndex((z) => z.id === id);
        if (ix !== -1) {
            this.zones.splice(ix, 1);
        }
    }
}
