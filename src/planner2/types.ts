import {
    Asset, 
    ItemType,
    Point,
    IResourceTypeProvider,
    ResourceRole,
    SchemaKind,
    Size,
} from '@kapeta/ui-web-types';

import {BlockDefinition, BlockInstance, Connection, Plan, Resource } from '@kapeta/schemas';
import { ButtonStyle } from '@kapeta/ui-web-components';
import { PlannerContextData } from './PlannerContext';

export type BlockPayload = {
    type: 'block';
    data: BlockInstance;
};

export type BlockTypePayload = {
    type: 'block-type';
    data: Asset<BlockDefinition>;
};

export type ResourcePayload = {
    type: 'resource';
    data: {
        resource: Resource;
        instance: BlockInstance;
        block: BlockDefinition;
        role: ResourceRole;
    };
};

export type ResourceTypePayload = {
    type: 'resource-type';
    data: {
        title: string;
        kind: string;
        config: IResourceTypeProvider;
    };
};

export type PlannerPayload = BlockPayload | ResourcePayload | ResourceTypePayload | BlockTypePayload;

export interface ValidationIssue {
    level: string;
    name?: string;
    issue: string;
}

export interface ActionContext {
    block?: BlockDefinition;
    blockInstance?: BlockInstance;
    resource?: Resource;
    resourceRole?: ResourceRole;
    connection?: Connection;
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
    item: SchemaKind | Connection;
    creating: boolean;
}

export interface BlockInfo {
    block: BlockDefinition;
    instance: BlockInstance;
}

export interface FocusBlockInfo {
    plan: Plan;
    focus: BlockInfo;
    consumingBlocks: BlockInfo[];
    providingBlocks: BlockInfo[];
    all: BlockInfo[];
}

export interface FocusBlockInfoShallow {
    plan: Plan;
    focus: BlockInfo;
    consumingBlocks: BlockInstance[];
    providingBlocks: BlockInstance[];
    all: BlockInstance[];
}

export interface ZoomLevels {
    [key: number]: Size;
}

export type Rectangle = Size & Point;

export const ZOOM_STEP_SIZE = 0.25;
