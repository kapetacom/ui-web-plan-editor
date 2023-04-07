import {
    Asset,
    BlockConnectionSpec,
    BlockInstanceSpec,
    BlockKind,
    ItemType,
    PlanKind,
    Point,
    ResourceConfig,
    ResourceKind,
    ResourceRole,
    SchemaKind,
    Size,
} from '@kapeta/ui-web-types';
import { ButtonStyle } from '@kapeta/ui-web-components';
import { PlannerContextData } from './PlannerContext';

export type BlockPayload = {
    type: 'block';
    data: BlockInstanceSpec;
};

export type BlockTypePayload = {
    type: 'block-type';
    data: Asset<BlockKind>;
};

export type ResourcePayload = {
    type: 'resource';
    data: {
        resource: ResourceKind;
        block: BlockInstanceSpec;
        role: ResourceRole;
    };
};

export type ResourceTypePayload = {
    type: 'resource-type';
    data: {
        title: string;
        kind: string;
        config: ResourceConfig;
    };
};

export type PlannerPayload = BlockPayload | ResourcePayload | ResourceTypePayload | BlockTypePayload;

export interface ValidationIssue {
    level: string;
    name?: string;
    issue: string;
}

export interface ActionContext {
    block?: BlockKind;
    blockInstance?: BlockInstanceSpec;
    resource?: ResourceKind;
    resourceRole?: ResourceRole;
    connection?: BlockConnectionSpec;
}
export interface PlannerAction<P extends unknown> {
    enabled(planner: PlannerContextData, info: ActionContext): boolean;
    buttonStyle: ButtonStyle;
    icon: string;
    label: string;
    onClick(planner: PlannerContextData, context: ActionContext): void | Promise<void>;
}

export interface EditableItemInterface2 {
    type: ItemType;
    ref?: string;
    item: SchemaKind | BlockConnectionSpec;
    creating: boolean;
}

export interface BlockInfo {
    block: BlockKind;
    instance: BlockInstanceSpec;
}

export interface FocusBlockInfo {
    plan: PlanKind;
    focus: BlockInfo;
    consumingBlocks: BlockInfo[];
    providingBlocks: BlockInfo[];
    all: BlockInfo[];
}

export interface FocusBlockInfoShallow {
    plan: PlanKind;
    focus: BlockInfo;
    consumingBlocks: BlockInstanceSpec[];
    providingBlocks: BlockInstanceSpec[];
    all: BlockInstanceSpec[];
}

export interface ZoomLevels {
    [key: number]: Size;
}

export type Rectangle = Size & Point;

export const ZOOM_STEP_SIZE = 0.25;
