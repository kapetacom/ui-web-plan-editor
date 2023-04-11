import React from 'react';
import { ResourceRole } from '@kapeta/ui-web-types';

import {
    PlannerBlockModelWrapper,
    PlannerBlockResourceListItem,
    PlannerModelWrapper,
    PlannerNodeSize,
    PlannerResourceModelWrapper,
    ResourceMode,
} from '../src';
import { BlockDefinition, BlockInstance, Resource } from '@kapeta/schemas';

const ValidInstance: BlockInstance = {
    id: '1',
    name: 'Some Instance',
    block: {
        ref: 'kapeta/some-ref:1.2.3',
    },
    dimensions: {
        top: 0,
        width: 150,
        left: 0,
        height: -1,
    },
};

const ValidDefinition: BlockDefinition = {
    kind: 'kapeta/block-type-service',
    metadata: {
        name: 'test/demo',
    },
    spec: {
        target: {
            kind: 'kapeta/language-target-test',
        },
        consumers: [],
        providers: [],
    },
};

const MissingResourceKind: Resource = {
    kind: 'kapeta/test',
    metadata: {
        name: 'Name',
    },
    spec: {
        port: {
            type: 'rest',
        },
    },
};

const InvalidResourceKind: Resource = {
    kind: 'not-valid',
    metadata: {
        name: 'Name',
    },
    spec: {
        port: {
            type: 'web',
        },
    },
};

const InvalidResourceSpec: Resource = {
    kind: 'kapeta/resource-type-rest-api:1.2.3',
    metadata: {
        name: 'Name',
    },
    spec: {
        port: {
            type: 'rest',
        },
    },
};

const InvalidResourceSpecThrown: Resource = {
    kind: 'kapeta/resource-type-rest-api:1.2.3',
    metadata: {
        name: 'Name',
    },
    spec: {
        methods: {},
        throw: true,
        port: {
            type: 'http',
        },
    },
};

export default {
    title: 'Resources',
    parameters: {
        layout: 'fullscreen',
    },
};

export const ResourceMissingKind = () => {
    const somePlan: PlannerModelWrapper = new PlannerModelWrapper('test-plan', 'Some Plan');
    const block = new PlannerBlockModelWrapper(ValidInstance, ValidDefinition, somePlan);
    const resource = new PlannerResourceModelWrapper(ResourceRole.PROVIDES, MissingResourceKind, block);
    resource.setMode(ResourceMode.SHOW);

    return (
        <div style={{ position: 'relative' }}>
            <PlannerBlockResourceListItem size={PlannerNodeSize.FULL} zoom={1} resource={resource} index={0} />
            <pre style={{ left: 200, position: 'absolute' }}>{['Errors:', ...resource.errors].join('\n')}</pre>
        </div>
    );
};

export const ResourceInvalidKind = () => {
    const somePlan: PlannerModelWrapper = new PlannerModelWrapper('test-plan', 'Some Plan');
    const block = new PlannerBlockModelWrapper(ValidInstance, ValidDefinition, somePlan);
    const resource = new PlannerResourceModelWrapper(ResourceRole.PROVIDES, InvalidResourceKind, block);
    resource.setMode(ResourceMode.SHOW);

    return (
        <div style={{ position: 'relative' }}>
            <PlannerBlockResourceListItem size={PlannerNodeSize.FULL} zoom={1} resource={resource} index={0} />
            <pre style={{ left: 200, position: 'absolute' }}>{['Errors:', ...resource.errors].join('\n')}</pre>
        </div>
    );
};

export const ResourceInvalidResourceSpec = () => {
    const somePlan: PlannerModelWrapper = new PlannerModelWrapper('test-plan', 'Some Plan');
    const block = new PlannerBlockModelWrapper(ValidInstance, ValidDefinition, somePlan);
    const resource = new PlannerResourceModelWrapper(ResourceRole.PROVIDES, InvalidResourceSpec, block);
    resource.setMode(ResourceMode.SHOW);

    return (
        <div style={{ position: 'relative' }}>
            <PlannerBlockResourceListItem size={PlannerNodeSize.FULL} zoom={1} resource={resource} index={0} />
            <pre style={{ left: 200, position: 'absolute' }}>{['Errors:', ...resource.errors].join('\n')}</pre>
        </div>
    );
};

export const ResourceInvalidResourceSpecThrown = () => {
    const somePlan: PlannerModelWrapper = new PlannerModelWrapper('test-plan', 'Some Plan');
    const block = new PlannerBlockModelWrapper(ValidInstance, ValidDefinition, somePlan);
    const resource = new PlannerResourceModelWrapper(ResourceRole.PROVIDES, InvalidResourceSpecThrown, block);
    resource.setMode(ResourceMode.SHOW);

    return (
        <div style={{ position: 'relative' }}>
            <PlannerBlockResourceListItem size={PlannerNodeSize.FULL} zoom={1} resource={resource} index={0} />
            <pre style={{ left: 200, position: 'absolute' }}>{['Errors:', ...resource.errors].join('\n')}</pre>
        </div>
    );
};
