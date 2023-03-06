export type PositionDiff = {
    x: number;
    y: number;
};

export interface DnDPayload<T> {
    type: string;
    data: T;
}

export interface DragEventInfo {
    start: PositionDiff;
    end: PositionDiff;
    diff: PositionDiff;
}
