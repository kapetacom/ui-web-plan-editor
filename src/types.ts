import { Point } from '@kapeta/ui-web-types';

export enum PlannerNodeSize {
    SMALL = 0,
    MEDIUM,
    FULL,
}

export interface FocusPositioningData {
    maxVerticalBlocks: number;
    maxHorizontalBlocks: number;
    totalUsedHeight: number;
    totalUsedHeightLeft: number;
    totalUsedHeightRight: number;
    plannerHeight: number;
    plannerWidth: number;
}

export interface BlockPositionCache {
    [key: string]: Point;
}

export interface ZoomAreaMap {
    [key: number]: Point;
}
