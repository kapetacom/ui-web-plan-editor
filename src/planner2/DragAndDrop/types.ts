export type PositionDiff = {
    x: number;
    y: number;
};

export interface DnDPayload {
    type: string;
    data: any;
}

export interface DragEventInfo {
    // Client relative coordinates
    client: {
        start: PositionDiff;
        end: PositionDiff;
        diff: PositionDiff;
    };
    zone: {
        start: PositionDiff;
        end: PositionDiff;
        diff: PositionDiff;
    };
}
