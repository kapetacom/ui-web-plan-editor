/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { BlockDefinition, BlockInstance, BlockInstanceResource, Connection, Plan } from '@kapeta/schemas';
import { BlockTypeProvider, ResourceTypeProvider } from '@kapeta/ui-web-context';
import { Point, ResourceRole } from '@kapeta/ui-web-types';
import { getResourceId } from './planUtils';
import { fillMatrix, MatrixObstacle } from './connectionUtils/src/matrix';
import { useContext, useMemo } from 'react';
import { calculateBlockSize } from '../BlockContext';
import { BlockMode } from '../../utils/enums';
import { DnDContext } from '../DragAndDrop/DnDContext';
import { PlannerContext } from '../PlannerContext';
import { getBlockEntities, transformEntities } from '../hooks/useBlockEntitiesForResource';
import { AssetInfo } from '../../types';
import { parseKapetaUri } from '@kapeta/nodejs-utils';

export const POINT_PADDING_X = 40;
export const POINT_PADDING_Y = 20;
export const CELL_SIZE = 30;
export const MANY_CONNECTIONS_THRESHOLD = 8;

export interface ResourceCluster {
    id: string;
    role: ResourceRole;
    blockInstanceId: string;
    resources: string[];
}

export type ConnectionExtension = Connection & {
    id?: string;
    consumerClusterId?: string;
    providerClusterId?: string;
    portals?: boolean;
    hidden?: boolean;
};

export function getConnectionId(connection: Connection) {
    return `${getResourceId(
        connection.provider?.blockId,
        connection.provider?.resourceName,
        ResourceRole.PROVIDES
    )}-${getResourceId(connection.consumer?.blockId, connection.consumer?.resourceName, ResourceRole.CONSUMES)}`;
}

export function connectionEquals(a: Connection, b: Connection) {
    return getConnectionId(a) === getConnectionId(b);
}

export function isConnectionTo(connection: Connection, instanceId: string, resourceName?: string) {
    if (!resourceName) {
        return connection.provider.blockId === instanceId || connection.consumer.blockId === instanceId;
    }

    return (
        (connection.provider.blockId === instanceId && connection.provider.resourceName === resourceName) ||
        (connection.consumer.blockId === instanceId && connection.consumer.resourceName === resourceName)
    );
}

export function getConnectionsFor(plan: Plan, blockId: string, resourceName: string) {
    return (
        plan.spec.connections?.filter((connection) => {
            return isConnectionTo(connection, blockId, resourceName);
        }) ?? []
    );
}

export function createConnection(provider: BlockInstanceResource, consumer: BlockInstanceResource) {
    const connection: Connection = {
        provider: {
            resourceName: provider.resource.metadata.name,
            blockId: provider.instance.id,
        },
        consumer: {
            resourceName: consumer.resource.metadata.name,
            blockId: consumer.instance.id,
        },
        port: provider.resource.spec.port,
    };

    const converter = ResourceTypeProvider.getConverterFor(provider.resource.kind, consumer.resource.kind);
    if (converter && converter.createMapping) {
        const fromEntities = getBlockEntities(provider.resource.kind, provider.block);
        const toEntities = getBlockEntities(consumer.resource.kind, consumer.block);
        const mapping = converter.createMapping(
            provider.resource,
            consumer.resource,
            transformEntities(provider.resource.kind, fromEntities),
            transformEntities(consumer.resource.kind, toEntities)
        );
        connection.mapping = mapping;
    }

    return connection;
}

export const useBlockMatrix = () => {
    const { draggable } = useContext(DnDContext);
    const planner = useContext(PlannerContext);
    // Remove the dragged block from the list of blocks, so that the pathfinding algorithm
    // can is not obstructed by the dragged block
    const draggedBlockId = draggable?.data?.id;

    const obstacles: MatrixObstacle[] = useMemo(() => {
        if (!planner.plan?.spec.blocks) {
            return [];
        }

        return planner.plan?.spec.blocks
            .map((block) => {
                const out = {
                    x: block.dimensions.left,
                    y: block.dimensions.top,
                    width: Math.max(block.dimensions.width + 40, 200),
                    height: Math.max(block.dimensions.height + 40, 200),
                    id: block.id,
                };

                const blockDefinition = planner.getBlockById(block.id);
                if (!blockDefinition) {
                    return out;
                }

                const blockType = BlockTypeProvider.get(blockDefinition.kind);
                const { instanceBlockWidth, instanceBlockHeight } = calculateBlockSize({
                    nodeSize: planner.nodeSize,
                    blockType,
                    blockMode: BlockMode.SHOW,
                    blockDefinition,
                });

                out.height = Math.max(out.height, instanceBlockHeight);
                out.width = Math.max(out.width, instanceBlockWidth);
                return out;
            })
            .map((o) => {
                return {
                    width: o.width + POINT_PADDING_X * 2,
                    height: o.height + POINT_PADDING_Y * 2,
                    x: o.x - POINT_PADDING_X,
                    y: o.y - POINT_PADDING_Y,
                    id: o.id,
                };
            });
    }, [planner.plan?.spec.blocks]);

    return useMemo(() => {
        if (!planner.canvasSize.width || !planner.canvasSize.height) {
            return [];
        }
        // TODO: This can be optimized, and should be rewritten when we refactor the canvas
        const matrixSize: [number, number] = [
            planner.canvasSize.width + planner.canvasSize.x + 100,
            planner.canvasSize.height + planner.canvasSize.y + 100,
        ];
        return fillMatrix(
            obstacles.filter((o) => o.id !== draggedBlockId),
            matrixSize,
            [CELL_SIZE, CELL_SIZE]
        );
    }, [
        planner.canvasSize.width,
        planner.canvasSize.height,
        planner.canvasSize.x,
        planner.canvasSize.y,
        obstacles,
        draggedBlockId,
    ]);
};

type ConnectionExtensionResult = {
    connections: ConnectionExtension[];
    resourceClusters: ResourceCluster[];
    portalResourceIds: string[];
};

export function useConnectionExtensions(): ConnectionExtensionResult {
    const planner = useContext(PlannerContext);

    return useMemo(() => {
        if (!planner.plan?.spec.connections) {
            return {
                connections: [],
                resourceClusters: [],
                portalResourceIds: [],
            };
        }

        const portalResources = new Set<string>();
        const out: ConnectionExtension[] = [...planner.plan?.spec.connections].map((connection) => {
            return {
                ...connection,
                id: getConnectionId(connection),
            };
        });

        const connectionMap: { [key: string]: ConnectionExtension } = {};
        const blockConnections: { [key: string]: Set<string> } = {};
        const sameBlocksBuckets: { [key: string]: Set<string> } = {};
        const resourceClusters: ResourceCluster[] = [];

        const providerConnections: { [key: string]: Set<string> } = {};
        const providerWithManyConnections: { [key: string]: Set<string> } = {};

        out.forEach((connection) => {
            const id = connection.id!;
            connectionMap[id] = connection;
            const blockConnection = `${connection.consumer.blockId}|${connection.provider.blockId}`;
            if (!blockConnections[blockConnection]) {
                blockConnections[blockConnection] = new Set<string>();
            }
            blockConnections[blockConnection].add(id);

            const providerResourceId = getResourceId(
                connection.provider.blockId,
                connection.provider.resourceName,
                ResourceRole.PROVIDES
            );
            if (!providerConnections[providerResourceId]) {
                providerConnections[providerResourceId] = new Set<string>();
            }

            providerConnections[providerResourceId].add(id);
        });

        Object.entries(providerConnections).forEach(([providerResourceId, connections]) => {
            if (connections.size > MANY_CONNECTIONS_THRESHOLD) {
                providerWithManyConnections[providerResourceId] = connections;
                portalResources.add(providerResourceId);
                connections.forEach((connectionId) => {
                    connectionMap[connectionId].portals = true;
                    const connection = connectionMap[connectionId];
                    const consumerResourceId = getResourceId(
                        connection.consumer.blockId,
                        connection.consumer.resourceName,
                        ResourceRole.CONSUMES
                    );
                    portalResources.add(consumerResourceId);
                });
            }
        });

        Object.entries(blockConnections).forEach(([blockConnectionId, connections]) => {
            const remainingConnections = Array.from(connections)
                .map((id) => connectionMap[id])
                .filter((c) => !c.portals);
            const connectionIds = new Set<string>(remainingConnections.map((c) => c.id!));
            if (connectionIds.size > 1) {
                remainingConnections.forEach((connection, ix) => {
                    connection.consumerClusterId = connection.consumer.blockId + '-' + ResourceRole.CONSUMES;
                    connection.providerClusterId = connection.provider.blockId + '-' + ResourceRole.PROVIDES;
                });
                sameBlocksBuckets[blockConnectionId] = connectionIds;
            }
        });

        Object.values(sameBlocksBuckets).forEach((connectionIds) => {
            const connections = Array.from(connectionIds).map((id) => connectionMap[id]);
            const providerResourceIds: string[] = [];
            const consumerResourceIds: string[] = [];
            connections.map((connection) => {
                const providerId = getResourceId(
                    connection.provider.blockId,
                    connection.provider.resourceName,
                    ResourceRole.PROVIDES
                );
                const consumerId = getResourceId(
                    connection.consumer.blockId,
                    connection.consumer.resourceName,
                    ResourceRole.CONSUMES
                );
                providerResourceIds.push(providerId);
                consumerResourceIds.push(consumerId);
            });

            providerResourceIds.sort();
            consumerResourceIds.sort();

            const consumerId = consumerResourceIds.join('|');
            const providerId = providerResourceIds.join('|');

            connections.forEach((connection, ix) => {
                connection.consumerClusterId = consumerId;
                connection.providerClusterId = providerId;
            });

            resourceClusters.push({
                id: consumerId,
                resources: consumerResourceIds,
                role: ResourceRole.CONSUMES,
                blockInstanceId: connections[0].consumer.blockId,
            });

            resourceClusters.push({
                id: providerId,
                resources: providerResourceIds,
                role: ResourceRole.PROVIDES,
                blockInstanceId: connections[0].provider.blockId,
            });
        });

        out.sort((a, b) => {
            const consumerBlockId = a.consumer.blockId.localeCompare(b.consumer.blockId);
            if (consumerBlockId !== 0) {
                return consumerBlockId;
            }

            const consumerResourceName = a.consumer.resourceName.localeCompare(b.consumer.resourceName);
            if (consumerResourceName !== 0) {
                return consumerResourceName;
            }

            const providerBlockId = a.provider.blockId.localeCompare(b.provider.blockId);
            if (providerBlockId !== 0) {
                return providerBlockId;
            }

            const providerResourceName = a.provider.resourceName.localeCompare(b.provider.resourceName);
            if (providerResourceName !== 0) {
                return providerResourceName;
            }

            return 0;
        });

        return {
            connections: out,
            resourceClusters,
            portalResourceIds: Array.from(portalResources),
        };
    }, [planner.plan?.spec.connections]);
}

export function createSimplePath(from: Point, to: Point, ending: boolean = false): [number, number][] {
    if (from.y === to.y) {
        return [
            [from.x, from.y],
            [to.x, to.y],
        ];
    }
    return ending
        ? [
              [from.x, from.y],
              [from.x, to.y],
              [to.x, to.y],
          ]
        : [
              [from.x, from.y],
              [to.x, from.y],
              [to.x, to.y],
          ];
}

export function createSimplePathVia(from: Point, fromX: number, to: Point, toX: number): [number, number][] {
    return fromX > toX
        ? [
              [from.x, from.y],
              [fromX, from.y],
              [fromX, from.y + (to.y - from.y) / 2],
              [toX, from.y + (to.y - from.y) / 2],
              [toX, to.y],
              [to.x, to.y],
          ]
        : [
              [from.x, from.y],
              [fromX, from.y],
              [toX, from.y],
              [toX, to.y],
              [to.x, to.y],
          ];
}

/**
 * Removes connections that point to non-existing resources and duplicate connections.
 *
 * Will not remove connections that point to non-existing block definitions as those are assumed
 * to exist but not yet loaded.
 */
export function cleanupConnections(plan: Plan, blockAssets: AssetInfo<BlockDefinition>[]) {
    let anyChanges = false;
    const instanceBlocks: Record<string, AssetInfo<BlockDefinition>> = {};
    const instances: Record<string, BlockInstance> = {};
    plan.spec.blocks?.forEach((instance) => {
        const blockRef = parseKapetaUri(instance.block.ref);
        instances[instance.id] = instance;
        const asset = blockAssets.find((asset) => parseKapetaUri(asset.ref).equals(blockRef));
        if (!asset) {
            return;
        }
        instanceBlocks[instance.id] = asset;
    });

    const connectionSet = new Set<string>();

    const newConnections =
        plan.spec.connections?.filter((connection) => {
            const connectionId = `${connection.consumer.blockId}:${connection.consumer.resourceName}:${connection.provider.blockId}:${connection.provider.resourceName}:${connection.port?.type}`;
            if (connectionSet.has(connectionId)) {
                anyChanges = true;
                return false;
            }
            connectionSet.add(connectionId);

            const consumerInstance = instances[connection.consumer.blockId];
            const providerInstance = instances[connection.provider.blockId];
            if (!consumerInstance || !providerInstance) {
                anyChanges = true;
                return false;
            }

            const consumerBlock = instanceBlocks[connection.consumer.blockId];
            const providerBlock = instanceBlocks[connection.provider.blockId];

            if (!consumerBlock || !providerBlock) {
                // We don't deal with missing block definitions here
                return true;
            }

            const consumerResource = consumerBlock.content?.spec?.consumers?.find((consumer) => {
                return consumer.metadata.name === connection.consumer.resourceName;
            });

            const providerResource = providerBlock.content?.spec?.providers?.find((provider) => {
                return provider.metadata.name === connection.provider.resourceName;
            });

            if (!consumerResource || !providerResource) {
                anyChanges = true;
                return false;
            }

            return true;
        }) ?? [];

    if (!anyChanges) {
        return plan;
    }

    return {
        ...plan,
        spec: {
            ...plan.spec,
            connections: newConnections,
        },
    };
}
