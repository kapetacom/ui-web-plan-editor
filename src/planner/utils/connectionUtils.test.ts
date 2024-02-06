/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */
import { describe, test, expect } from '@jest/globals';
import { BlockDefinition, Connection, Dimensions, Plan } from '@kapeta/schemas';
import { AssetInfo } from '../../types';
import { cleanupConnections } from './connectionUtils';

const DIMENSIONS: Dimensions = {
    top: 0,
    height: 100,
    width: 100,
    left: 0,
};
const BLOCKS: AssetInfo<BlockDefinition>[] = [
    {
        ref: 'kapeta://myhandle/provider:1.2.3',
        version: '1.2.3',
        content: {
            kind: 'kapeta/block-type-service',
            metadata: {
                name: 'myhandle/provider',
            },
            spec: {
                consumers: [],
                providers: [
                    {
                        kind: 'kapeta/block-resource-type',
                        metadata: {
                            name: 'some-provider',
                        },
                        spec: {},
                    },
                ],
            },
        },
    },
    {
        ref: 'kapeta://myhandle/consumer:1.2.3',
        version: '1.2.3',
        content: {
            kind: 'kapeta/block-type-service',
            metadata: {
                name: 'myhandle/consumer',
            },
            spec: {
                consumers: [
                    {
                        kind: 'kapeta/block-resource-type',
                        metadata: {
                            name: 'some-consumer',
                        },
                        spec: {},
                    },
                ],
                providers: [],
            },
        },
    },
];

const BASE_PLAN: Plan = {
    kind: 'core/plan',
    metadata: {
        name: 'myhandle/plan',
    },
    spec: {
        blocks: [
            {
                block: {
                    ref: 'kapeta://myhandle/provider:1.2.3',
                },
                dimensions: DIMENSIONS,
                id: 'provider',
                name: 'provider',
            },
            {
                block: {
                    ref: 'kapeta://myhandle/consumer:1.2.3',
                },
                dimensions: DIMENSIONS,
                id: 'consumer',
                name: 'consumer',
            },
        ],
        connections: [],
    },
};

describe('connectionUtils', () => {
    describe('cleanupConnections', () => {
        test('does nothing if nothing is connected', async () => {
            const plan = {
                ...BASE_PLAN,
                spec: {
                    ...BASE_PLAN.spec,
                    connections: [],
                },
            };

            expect(cleanupConnections(plan, BLOCKS)).toBe(plan);
        });

        test('does nothing if everything is correctly connected', async () => {
            const plan = {
                ...BASE_PLAN,
                spec: {
                    ...BASE_PLAN.spec,
                    connections: [
                        {
                            consumer: {
                                resourceName: 'some-consumer',
                                blockId: 'consumer',
                            },
                            provider: {
                                resourceName: 'some-provider',
                                blockId: 'provider',
                            },
                        } satisfies Connection,
                    ],
                },
            };

            expect(cleanupConnections(plan, BLOCKS)).toBe(plan);
        });

        test('removes duplicate connections if they exist', async () => {
            const plan = {
                ...BASE_PLAN,
                spec: {
                    ...BASE_PLAN.spec,
                    connections: [
                        {
                            consumer: {
                                resourceName: 'some-consumer',
                                blockId: 'consumer',
                            },
                            provider: {
                                resourceName: 'some-provider',
                                blockId: 'provider',
                            },
                        },
                        {
                            consumer: {
                                resourceName: 'some-consumer',
                                blockId: 'consumer',
                            },
                            provider: {
                                resourceName: 'some-provider',
                                blockId: 'provider',
                            },
                        },
                    ],
                },
            };

            expect(cleanupConnections(plan, BLOCKS).spec.connections).toEqual([
                {
                    consumer: {
                        resourceName: 'some-consumer',
                        blockId: 'consumer',
                    },
                    provider: {
                        resourceName: 'some-provider',
                        blockId: 'provider',
                    },
                },
            ]);
        });

        test('removes connections for missing resources', async () => {
            const plan = {
                ...BASE_PLAN,
                spec: {
                    ...BASE_PLAN.spec,
                    connections: [
                        {
                            consumer: {
                                resourceName: 'some-consumer',
                                blockId: 'consumer',
                            },
                            provider: {
                                resourceName: 'some-provider',
                                blockId: 'provider',
                            },
                        },
                        {
                            consumer: {
                                resourceName: 'missing-consumer',
                                blockId: 'consumer',
                            },
                            provider: {
                                resourceName: 'some-provider',
                                blockId: 'provider',
                            },
                        },
                    ],
                },
            };

            expect(cleanupConnections(plan, BLOCKS).spec.connections).toEqual([
                {
                    consumer: {
                        resourceName: 'some-consumer',
                        blockId: 'consumer',
                    },
                    provider: {
                        resourceName: 'some-provider',
                        blockId: 'provider',
                    },
                },
            ]);
        });

        test('removes connections for missing instances', async () => {
            const plan = {
                ...BASE_PLAN,
                spec: {
                    ...BASE_PLAN.spec,
                    connections: [
                        {
                            consumer: {
                                resourceName: 'some-consumer',
                                blockId: 'missing-consumer',
                            },
                            provider: {
                                resourceName: 'some-provider',
                                blockId: 'provider',
                            },
                        },
                        {
                            consumer: {
                                resourceName: 'some-consumer',
                                blockId: 'consumer',
                            },
                            provider: {
                                resourceName: 'some-provider',
                                blockId: 'provider',
                            },
                        },
                    ],
                },
            };

            expect(cleanupConnections(plan, BLOCKS).spec.connections).toEqual([
                {
                    consumer: {
                        resourceName: 'some-consumer',
                        blockId: 'consumer',
                    },
                    provider: {
                        resourceName: 'some-provider',
                        blockId: 'provider',
                    },
                },
            ]);
        });

        test('does nothing if block definition is missing', async () => {
            const plan = {
                ...BASE_PLAN,
                spec: {
                    ...BASE_PLAN.spec,
                    connections: [
                        {
                            consumer: {
                                resourceName: 'missing-consumer',
                                blockId: 'consumer',
                            },
                            provider: {
                                resourceName: 'some-provider',
                                blockId: 'provider',
                            },
                        },
                        {
                            consumer: {
                                resourceName: 'some-consumer',
                                blockId: 'consumer',
                            },
                            provider: {
                                resourceName: 'some-provider',
                                blockId: 'provider',
                            },
                        },
                    ],
                },
            };

            expect(cleanupConnections(plan, [])).toEqual(plan);
        });
    });
});
