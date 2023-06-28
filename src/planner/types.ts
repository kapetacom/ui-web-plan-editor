import { Asset, ItemType, Point, IResourceTypeProvider, ResourceRole, SchemaKind, Size } from '@kapeta/ui-web-types';

import { BlockDefinition, BlockInstance, Connection, Plan, Resource } from '@kapeta/schemas';
import { ButtonStyle } from '@kapeta/ui-web-components';
import { PlannerContextData } from './PlannerContext';
import { DnDPayload } from './DragAndDrop/types';

export interface BlockPayload extends DnDPayload<BlockInstance> {
    type: 'block';
    data: BlockInstance;
}

export interface BlockTypePayload extends DnDPayload<Asset<BlockDefinition>> {
    type: 'block-type';
    data: Asset<BlockDefinition>;
}

interface ResourcePayloadData {
    resource: Resource;
    instance: BlockInstance;
    block: BlockDefinition;
    role: ResourceRole;
}

export interface ResourcePayload extends DnDPayload<ResourcePayloadData> {
    type: 'resource';
    data: ResourcePayloadData;
}

interface ResourceTypePayloadData {
    title: string;
    kind: string;
    config: IResourceTypeProvider;
}

export interface ResourceTypePayload extends DnDPayload<ResourceTypePayloadData> {
    type: 'resource-type';
    data: ResourceTypePayloadData;
}

export interface PlanPayload extends DnDPayload<Plan> {
    type: 'plan';
    data: Plan;
}

export type PlannerPayload = PlanPayload | BlockPayload | ResourcePayload | ResourceTypePayload | BlockTypePayload;

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

export interface BlockInfo {
    instance: BlockInstance;
    block: BlockDefinition;
}

export interface EditBlockInfo {
    type: ItemType.BLOCK;
    item: BlockInfo;
    creating: boolean;
}

export interface EditResourceInfo {
    type: ItemType.RESOURCE;
    item: {
        ref: string;
        resource: Resource;
        block: BlockDefinition;
    };
    creating: boolean;
}
export interface EditConnectionInfo {
    type: ItemType.CONNECTION;
    item: Connection;
    creating: boolean;
}

export type EditItemInfo = EditBlockInfo | EditResourceInfo | EditConnectionInfo;

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
