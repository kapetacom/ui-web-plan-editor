import { Point } from '@kapeta/ui-web-types';

export interface DnDPayload {
    type: string;
    data: any;
}

export interface DragEventInfo {
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
