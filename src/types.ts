import {PlannerBlockModelWrapper} from "./wrappers/PlannerBlockModelWrapper";
import { Point } from "@blockware/ui-web-types";

export enum PlannerNodeSize {
    SMALL = 0,
    MEDIUM,
    FULL
}

export interface FocusPositioningData{
    maxVerticalBlocks:number
    maxHorizontalBlocks:number
    totalUsedHeightLeft:number
    totalUsedHeightRight:number
    plannerHeight: number
    plannerWidth: number
}

export interface ResourceLinkedBlocks{
    [resource:string]:PlannerBlockModelWrapper[]
}

export interface BlockPositionCache{
    [key:string]:Point 
}

export interface ZoomAreaMap{
    [key:number]:Point
}
export interface NeighboringBlocks{
    consumingBlocks : PlannerBlockModelWrapper[]
    providingBlocks : PlannerBlockModelWrapper[]
    all : PlannerBlockModelWrapper[]
}