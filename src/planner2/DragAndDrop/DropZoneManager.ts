import { DragEventInfo } from './types';
import { DnDZoneInstance } from './DnDDropZone';
import { DnDDrag } from '@kapeta/ui-web-components';
import { Point } from '@kapeta/ui-web-types';

export interface DropZoneEntity<T = any> {
    element: HTMLElement;
    instance: DnDZoneInstance;
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

    private checkContainment<T>(dropZone: DropZoneEntity, evt: { x: number; y: number }): boolean {
        const bounds = dropZone.element.getBoundingClientRect();
        const isContained =
            bounds.x <= evt.x &&
            bounds.x + bounds.width >= evt.x &&
            bounds.y < evt.y &&
            bounds.y + bounds.height >= evt.y;
        return isContained;
    }

    private getValidZones(draggable) {
        return this.zones.filter((zone) => (zone.zone.accept ? zone.zone.accept(draggable) : true));
    }

    private translateFromElementToRoot(evt: DragEventInfo, rootBox: DOMRect, zoneBox: DOMRect): DragEventInfo {
        const diff = {
            x: rootBox.x - zoneBox.x,
            y: rootBox.y - zoneBox.y,
        };

        console.log('Transposing elements', diff);

        return this.translateEvent(evt, diff);
    }

    private translateFromZoneToZone(
        evt: DragEventInfo,
        fromZone: DnDZoneInstance,
        toZone: DnDZoneInstance
    ): DragEventInfo {
        const fromOffset = fromZone.getOffset();
        const toOffset = toZone.getOffset();
        const diff = {
            x: toOffset.left - fromOffset.left,
            y: toOffset.top - fromOffset.top,
        };

        console.log('Transposing zones', diff, fromOffset, toOffset);

        return this.translateEvent(evt, diff);
    }

    private translateEvent(evt: DragEventInfo, diff: Point): DragEventInfo {
        return {
            ...evt,
            zone: {
                start: {
                    x: evt.zone.start.x + diff.x,
                    y: evt.zone.start.y + diff.y,
                },
                end: {
                    x: evt.zone.end.x + diff.x,
                    y: evt.zone.end.y + diff.y,
                },
                diff: {
                    x: evt.zone.diff.x + diff.x,
                    y: evt.zone.diff.y + diff.y,
                },
            },
        };
    }

    addZone(id: string, zone: DropZoneEntity) {
        const entry: DropZoneState = this.zones.find((z) => z.id === id) || {
            id,
            zone,
            state: 'IDLE',
        };
        entry.zone = zone;
        if (!this.zones.includes(entry)) {
            this.zones.push(entry);
        }
    }

    handleDragEvent(draggable, evt: DragEventInfo, fromZone: DnDZoneInstance, root: HTMLElement | null) {
        // callbacks based on state change?, or kept "instant"?
        // Loop all elements to check intersection
        let foundZone = false;
        for (const dropZone of this.getValidZones(draggable)) {
            const isContained = this.checkContainment(dropZone.zone, evt.client.end);

            if (isContained && !foundZone) {
                foundZone = true;
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

    handleDropEvent(draggable, evt: DragEventInfo, fromZone: DnDZoneInstance, root: HTMLElement | null) {
        // Loop all elements to check intersection
        for (const dropZone of this.getValidZones(draggable)) {
            const isContained = this.checkContainment(dropZone.zone, evt.client.end);

            if (isContained) {
                if (fromZone !== dropZone.zone.instance) {
                    if (!fromZone.isValid() && root) {
                        //First adjust the event to root to element
                        const rootBox = root.getBoundingClientRect();
                        const zoneBox = dropZone.zone.element.getBoundingClientRect();
                        evt = this.translateFromElementToRoot(evt, rootBox, zoneBox);
                    }

                    evt = this.translateFromZoneToZone(evt, fromZone, dropZone.zone.instance);
                }
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
