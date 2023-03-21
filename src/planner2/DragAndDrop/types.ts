export type PositionDiff = {
    x: number;
    y: number;
};

export interface DnDPayload {
    type: string;
    data: any;
}

export interface DragEventInfo {
    start: PositionDiff;
    end: PositionDiff;
    diff: PositionDiff;
}
