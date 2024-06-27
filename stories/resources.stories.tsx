/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React from 'react';
import { ResourceRole } from '@kapeta/ui-web-types';

import { BlockValidator, PlannerNodeSize, ResourceMode } from '../src';
import { BlockDefinition, BlockInstance, IconType, Resource, Theme } from '@kapeta/schemas';
import { PlannerBlockResourceListItem } from '../src/planner/components/PlannerBlockResourceListItem';
import { BlockContext, PlannerBlockContextData } from '../src/planner/BlockContext';
import { parseKapetaUri } from '@kapeta/nodejs-utils';
import './data/BlockServiceMock';

import './styles.less';

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
    kind: 'kapeta/block-type-service:1.2.3',
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

export const ResourceLongName = () => {
    const resource: Resource = {
        kind: 'kapeta/resource-type-rest-api:1.2.3',
        metadata: {
            name: 'This is a very long name that should be truncated',
        },
        spec: {
            port: {
                type: 'rest',
            },
        },
    };
    return (
        <BlockContext.Provider
            value={
                {
                    blockInstance: ValidInstance,
                    blockReference: parseKapetaUri(ValidInstance.block.ref),
                } as Partial<PlannerBlockContextData> as any
            }
        >
            <div style={{ padding: '20px' }}>
                <PlannerBlockResourceListItem
                    size={PlannerNodeSize.FULL}
                    index={0}
                    mode={ResourceMode.SHOW}
                    resource={resource}
                    role={ResourceRole.PROVIDES}
                />
            </div>
        </BlockContext.Provider>
    );
};

export const ResourceMissingKind = () => {
    const resource = MissingResourceKind;
    const errors = new BlockValidator(ValidDefinition, ValidInstance).validateResource(resource);
    return (
        <BlockContext.Provider
            value={
                {
                    blockInstance: ValidInstance,
                    blockReference: parseKapetaUri(ValidInstance.block.ref),
                } as Partial<PlannerBlockContextData> as any
            }
        >
            <div style={{ padding: '20px' }}>
                <PlannerBlockResourceListItem
                    size={PlannerNodeSize.FULL}
                    index={0}
                    mode={ResourceMode.SHOW}
                    resource={resource}
                    role={ResourceRole.PROVIDES}
                />
                <pre style={{ left: 200, position: 'absolute' }}>{['Errors:', ...(errors || [])].join('\n')}</pre>
            </div>
        </BlockContext.Provider>
    );
};

export const ResourceInvalidKind = () => {
    const resource = InvalidResourceKind;
    const errors = new BlockValidator(ValidDefinition, ValidInstance).validateResource(resource);
    return (
        <BlockContext.Provider
            value={
                {
                    blockInstance: ValidInstance,
                    blockReference: parseKapetaUri(ValidInstance.block.ref),
                } as Partial<PlannerBlockContextData> as any
            }
        >
            <div style={{ padding: '20px' }}>
                <PlannerBlockResourceListItem
                    size={PlannerNodeSize.FULL}
                    index={0}
                    mode={ResourceMode.SHOW}
                    resource={resource}
                    role={ResourceRole.PROVIDES}
                />
                <pre style={{ left: 200, position: 'absolute' }}>{['Errors:', ...(errors || [])].join('\n')}</pre>
            </div>
        </BlockContext.Provider>
    );
};

export const ResourceInvalidResourceSpec = () => {
    const resource = InvalidResourceSpec;
    const errors = new BlockValidator(ValidDefinition, ValidInstance).validateResource(resource);
    return (
        <BlockContext.Provider
            value={
                {
                    blockInstance: ValidInstance,
                    blockReference: parseKapetaUri(ValidInstance.block.ref),
                } as Partial<PlannerBlockContextData> as any
            }
        >
            <div style={{ padding: '20px' }}>
                <PlannerBlockResourceListItem
                    size={PlannerNodeSize.FULL}
                    index={0}
                    mode={ResourceMode.SHOW}
                    resource={resource}
                    role={ResourceRole.PROVIDES}
                />
                <pre style={{ left: 200, position: 'absolute' }}>{['Errors:', ...(errors || [])].join('\n')}</pre>
            </div>
        </BlockContext.Provider>
    );
};

export const ResourceInvalidResourceSpecThrown = () => {
    const resource = InvalidResourceSpecThrown;
    const errors = new BlockValidator(ValidDefinition, ValidInstance).validateResource(resource);
    return (
        <BlockContext.Provider
            value={
                {
                    blockInstance: ValidInstance,
                    blockReference: parseKapetaUri(ValidInstance.block.ref),
                } as Partial<PlannerBlockContextData> as any
            }
        >
            <div style={{ padding: '20px' }}>
                <PlannerBlockResourceListItem
                    size={PlannerNodeSize.FULL}
                    index={0}
                    mode={ResourceMode.SHOW}
                    resource={resource}
                    role={ResourceRole.PROVIDES}
                />
                <pre style={{ left: 200, position: 'absolute' }}>{['Errors:', ...(errors || [])].join('\n')}</pre>
            </div>
        </BlockContext.Provider>
    );
};

export const CustomIcons = () => {
    const resource = {
        ...ValidDefinition,
    };
    resource.spec.icons = [
        { type: IconType.URL, value: 'https://kapeta.com/favicon.ico', theme: Theme.Light },
        { type: IconType.URL, value: 'https://kapeta.com/favicon.ico', theme: Theme.Dark },
    ];
    const errors = new BlockValidator(ValidDefinition, ValidInstance).validateResource(resource);
    return (
        <BlockContext.Provider
            value={
                {
                    blockInstance: ValidInstance,
                    blockReference: parseKapetaUri(ValidInstance.block.ref),
                } as Partial<PlannerBlockContextData> as any
            }
        >
            <div style={{ padding: '20px' }}>
                <PlannerBlockResourceListItem
                    size={PlannerNodeSize.FULL}
                    index={0}
                    mode={ResourceMode.SHOW}
                    resource={resource}
                    role={ResourceRole.PROVIDES}
                />
                <pre style={{ left: 200, position: 'absolute' }}>{['Errors:', ...(errors || [])].join('\n')}</pre>
            </div>
        </BlockContext.Provider>
    );
};
