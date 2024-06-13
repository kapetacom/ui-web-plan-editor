/**
 * Copyright 2024 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */
import { beforeAll, describe, expect, it } from '@jest/globals';
import { BlockDefinition, Plan } from '@kapeta/schemas';
import { applyAutoLayout } from './auto-layout';
import { AssetInfo } from '../types';
import { BlockTypeProvider } from '@kapeta/ui-web-context';

describe('auto-layout', () => {
    beforeAll(() => {
        BlockTypeProvider.register({
            kind: 'kapeta/block',
            version: '1.0.0',
            definition: {
                kind: 'kapeta/block',
                metadata: {
                    name: 'kapeta/block',
                },
                spec: {
                    schema: {
                        type: 'object',
                    },
                },
            },
            editorComponent: null as any,
        });
    });

    it('should work for 3 blocks', () => {
        const plan: Plan = {
            kind: 'core/plan',
            metadata: {
                name: 'test',
                version: '1.0.0',
            },
            spec: {
                blocks: [
                    {
                        id: 'id-block-be',
                        name: 'Block Backend',
                        block: {
                            ref: 'test/block-be:1.0.0',
                        },
                        dimensions: {
                            height: 200,
                            width: 150,
                            left: 0,
                            top: 0,
                        },
                    },
                    {
                        id: 'id-block-ui',
                        name: 'Block UI',
                        block: {
                            ref: 'test/block-ui:1.0.0',
                        },
                        dimensions: {
                            height: 200,
                            width: 150,
                            left: 0,
                            top: 0,
                        },
                    },
                    {
                        id: 'id-gateway',
                        name: 'Gateway',
                        block: {
                            ref: 'test/gateway:1.0.0',
                        },
                        dimensions: {
                            height: 200,
                            width: 150,
                            top: 0,
                            left: 0,
                        },
                    },
                ],
                connections: [
                    {
                        provider: {
                            blockId: 'id-block-be',
                            resourceName: 'api',
                        },
                        consumer: {
                            blockId: 'id-block-ui',
                            resourceName: 'api',
                        },
                    },
                    {
                        provider: {
                            blockId: 'id-block-be',
                            resourceName: 'api',
                        },
                        consumer: {
                            blockId: 'id-gateway',
                            resourceName: 'api',
                        },
                    },
                    {
                        provider: {
                            blockId: 'id-block-ui',
                            resourceName: 'ui',
                        },
                        consumer: {
                            blockId: 'id-gateway',
                            resourceName: 'ui',
                        },
                    },
                ],
            },
        };
        const blocks: AssetInfo<BlockDefinition>[] = [
            {
                ref: 'test/block-be:1.0.0',
                version: '1.0.0',
                content: {
                    kind: 'kapeta/block',
                    metadata: {
                        name: 'test/block-be',
                    },
                    spec: {
                        providers: [{ kind: 'kapeta/rest-provider', metadata: { name: 'api' }, spec: {} }],
                    },
                },
            },
            {
                ref: 'test/block-ui:1.0.0',
                version: '1.0.0',
                content: {
                    kind: 'kapeta/block',
                    metadata: {
                        name: 'test/block-ui',
                    },
                    spec: {
                        consumers: [{ kind: 'kapeta/rest-provider', metadata: { name: 'api' }, spec: {} }],
                        providers: [{ kind: 'kapeta/web-page', metadata: { name: 'ui' }, spec: {} }],
                    },
                },
            },
            {
                ref: 'test/gateway:1.0.0',
                version: '1.0.0',
                content: {
                    kind: 'kapeta/block',
                    metadata: {
                        name: 'test/gateway',
                    },
                    spec: {
                        consumers: [
                            { kind: 'kapeta/rest-provider', metadata: { name: 'api' }, spec: {} },
                            { kind: 'kapeta/web-page', metadata: { name: 'ui' }, spec: {} },
                        ],
                    },
                },
            },
        ];
        const newPlan = applyAutoLayout(plan, blocks, {});

        const backend = newPlan.spec.blocks.find((b) => b.id === 'id-block-be');
        const ui = newPlan.spec.blocks.find((b) => b.id === 'id-block-ui');
        const gateway = newPlan.spec.blocks.find((b) => b.id === 'id-gateway');
        if (!backend || !ui || !gateway) {
            throw new Error('Blocks not found');
        }

        expect(backend.dimensions.left).toBeLessThan(ui.dimensions.left);
        expect(ui.dimensions.left).toBeLessThan(gateway.dimensions.left);
    });
    it('should handle graph loops', () => {
        const plan: Plan = {
            kind: 'core/plan',
            metadata: {
                name: 'test',
                version: '1.0.0',
            },
            spec: {
                blocks: [
                    {
                        id: 'id-block-be',
                        name: 'Block Backend',
                        block: {
                            ref: 'test/block-be:1.0.0',
                        },
                        dimensions: {
                            height: 200,
                            width: 150,
                            left: 0,
                            top: 0,
                        },
                    },
                    {
                        id: 'id-block-ui',
                        name: 'Block UI',
                        block: {
                            ref: 'test/block-ui:1.0.0',
                        },
                        dimensions: {
                            height: 200,
                            width: 150,
                            left: 0,
                            top: 0,
                        },
                    },
                    {
                        id: 'id-gateway',
                        name: 'Gateway',
                        block: {
                            ref: 'test/gateway:1.0.0',
                        },
                        dimensions: {
                            height: 200,
                            width: 150,
                            top: 0,
                            left: 0,
                        },
                    },
                ],
                connections: [
                    {
                        provider: {
                            blockId: 'id-block-be',
                            resourceName: 'api',
                        },
                        consumer: {
                            blockId: 'id-block-ui',
                            resourceName: 'api',
                        },
                    },
                    {
                        provider: {
                            blockId: 'id-block-be',
                            resourceName: 'api',
                        },
                        consumer: {
                            blockId: 'id-gateway',
                            resourceName: 'api',
                        },
                    },
                    // connection to self should never happen, but just in case
                    {
                        provider: {
                            blockId: 'id-block-be',
                            resourceName: 'jwt-provider',
                        },
                        consumer: {
                            blockId: 'id-block-be',
                            resourceName: 'jwt-consumer',
                        },
                    },
                    {
                        provider: {
                            blockId: 'id-block-ui',
                            resourceName: 'ui',
                        },
                        consumer: {
                            blockId: 'id-gateway',
                            resourceName: 'ui',
                        },
                    },
                ],
            },
        };
        const blocks: AssetInfo<BlockDefinition>[] = [
            {
                ref: 'test/block-be:1.0.0',
                version: '1.0.0',
                content: {
                    kind: 'kapeta/block',
                    metadata: {
                        name: 'test/block-be',
                    },
                    spec: {
                        consumers: [{ kind: 'kapeta/auth-provider', metadata: { name: 'jwt-consumer' }, spec: {} }],
                        providers: [
                            { kind: 'kapeta/rest-provider', metadata: { name: 'api' }, spec: {} },
                            { kind: 'kapeta/auth-provider', metadata: { name: 'jwt-provider' }, spec: {} },
                        ],
                    },
                },
            },
            {
                ref: 'test/block-ui:1.0.0',
                version: '1.0.0',
                content: {
                    kind: 'kapeta/block',
                    metadata: {
                        name: 'test/block-ui',
                    },
                    spec: {
                        consumers: [{ kind: 'kapeta/rest-provider', metadata: { name: 'api' }, spec: {} }],
                        providers: [{ kind: 'kapeta/web-page', metadata: { name: 'ui' }, spec: {} }],
                    },
                },
            },
            {
                ref: 'test/gateway:1.0.0',
                version: '1.0.0',
                content: {
                    kind: 'kapeta/block',
                    metadata: {
                        name: 'test/gateway',
                    },
                    spec: {
                        consumers: [
                            { kind: 'kapeta/rest-provider', metadata: { name: 'api' }, spec: {} },
                            { kind: 'kapeta/web-page', metadata: { name: 'ui' }, spec: {} },
                        ],
                    },
                },
            },
        ];
        const newPlan = applyAutoLayout(plan, blocks, {});

        const backend = newPlan.spec.blocks.find((b) => b.id === 'id-block-be');
        const ui = newPlan.spec.blocks.find((b) => b.id === 'id-block-ui');
        const gateway = newPlan.spec.blocks.find((b) => b.id === 'id-gateway');
        if (!backend || !ui || !gateway) {
            throw new Error('Blocks not found');
        }

        expect(backend.dimensions.left).toBeLessThan(ui.dimensions.left);
        expect(ui.dimensions.left).toBeLessThan(gateway.dimensions.left);
    });
});
