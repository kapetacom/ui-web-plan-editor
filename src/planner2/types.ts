import {
    BlockConnectionSpec,
    BlockInstanceSpec,
    BlockKind,
    ResourceKind,
    ResourceRole,
} from '@kapeta/ui-web-types';
import { ButtonStyle } from '@kapeta/ui-web-components';
import { PlannerContextData } from './PlannerContext';

export type BlockPayload = {
    type: 'block';
    data: BlockInstanceSpec;
};
export type ResourcePayload = {
    type: 'resource';
    data: {
        resource: ResourceKind;
        block: BlockInstanceSpec;
        role: ResourceRole;
    };
};

export type PlannerPayload = BlockPayload | ResourcePayload;

export interface ActionContext {
    block?: BlockKind;
    blockInstance?: BlockInstanceSpec;
    resource?: ResourceKind;
    connection?: BlockConnectionSpec;
}
export interface PlannerAction<P extends unknown> {
    enabled(planner: PlannerContextData, info: ActionContext): boolean;
    buttonStyle: ButtonStyle;
    icon: string;
    label: string;
    onClick(planner: PlannerContextData, context: ActionContext): void;
}
