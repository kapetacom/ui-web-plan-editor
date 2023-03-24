import {
    BlockInstanceSpec,
    ResourceKind,
    ResourceRole,
} from '@kapeta/ui-web-types';
import { PlannerContextData } from './PlannerContext';
import { PlannerBlockContextData } from './BlockContext';
import { ButtonStyle } from '@kapeta/ui-web-components';

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

export interface PlannerAction<P extends unknown> {
    enabled(
        planner: PlannerContextData,
        block: PlannerBlockContextData
    ): boolean;
    buttonStyle: ButtonStyle;
    icon: string;
    label: string;
    onClick(p: P): void;
}
