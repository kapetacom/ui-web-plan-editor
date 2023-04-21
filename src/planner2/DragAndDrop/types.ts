import { Point } from '@kapeta/ui-web-types';

export interface DnDPayload<T = any> {
    type: string;
    data: T;
}

export interface DragEventInfo<T = any> {
    sourceDraggable: DnDPayload<T>;
    targetZone?: DnDPayload<T>;

    // Client relative coordinates
    client: {
        start: Point;
        end: Point;
        diff: Point;
    };
    zone: {
        start: Point;
        end: Point;
        diff: Point;
    };
}
