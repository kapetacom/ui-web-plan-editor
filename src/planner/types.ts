import {
    Asset,
    ItemType,
    Point,
    IResourceTypeProvider,
    ResourceRole,
    Size,
    IBlockTypeProvider,
} from '@kapeta/ui-web-types';

import { BlockDefinition, BlockInstance, Connection, Plan, Resource } from '@kapeta/schemas';
import { ButtonStyle } from '@kapeta/ui-web-components';
import { PlannerContextData } from './PlannerContext';
import { DnDPayload } from './DragAndDrop/types';

export enum PlannerPayloadType {
    BLOCK = 'block',
    RESOURCE = 'resource',
    RESOURCE_TYPE = 'resource-type',
    BLOCK_DEFINITION = 'block-definition',
    BLOCK_TYPE = 'block-type',
    PLAN = 'plan',
}

export interface BlockPayload extends DnDPayload<BlockInstance> {
    type: PlannerPayloadType.BLOCK;
    data: BlockInstance;
}

export interface BlockDefinitionPayload extends DnDPayload<Asset<BlockDefinition>> {
    type: PlannerPayloadType.BLOCK_DEFINITION;
    data: Asset<BlockDefinition>;
}

export interface BlockTypePayload extends DnDPayload<IBlockTypeProvider> {
    type: PlannerPayloadType.BLOCK_TYPE;
    data: IBlockTypeProvider;
}

interface ResourcePayloadData {
    resource: Resource;
    instance: BlockInstance;
    block: BlockDefinition;
    role: ResourceRole;
}

export interface ResourcePayload extends DnDPayload<ResourcePayloadData> {
    type: PlannerPayloadType.RESOURCE;
    data: ResourcePayloadData;
}

interface ResourceTypePayloadData {
    title: string;
    kind: string;
    config: IResourceTypeProvider;
}

export interface ResourceTypePayload extends DnDPayload<ResourceTypePayloadData> {
    type: PlannerPayloadType.RESOURCE_TYPE;
    data: ResourceTypePayloadData;
}

export interface PlanPayload extends DnDPayload<Plan> {
    type: PlannerPayloadType.PLAN;
    data: Plan;
}

export type PlannerPayload =
    | PlanPayload
    | BlockPayload
    | ResourcePayload
    | ResourceTypePayload
    | BlockDefinitionPayload
    | BlockTypePayload;

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
    buttonStyle: ButtonStyle | ((planner: PlannerContextData, info: ActionContext) => ButtonStyle);
    icon: string | ((planner: PlannerContextData, info: ActionContext) => string);
    label: string | ((planner: PlannerContextData, info: ActionContext) => string);
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
