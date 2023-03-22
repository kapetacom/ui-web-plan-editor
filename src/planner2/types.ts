import {
    BlockInstanceSpec,
    ResourceKind,
    ResourceRole,
} from '@kapeta/ui-web-types';

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
