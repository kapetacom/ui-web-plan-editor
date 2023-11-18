/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { Connection, Plan, BlockInstanceResource } from '@kapeta/schemas';
import { BlockTypeProvider, ResourceTypeProvider } from '@kapeta/ui-web-context';
import { Point, ResourceRole } from '@kapeta/ui-web-types';
import { getResourceId } from './planUtils';
import { fillMatrix, MatrixObstacle } from './connectionUtils/src/matrix';
import { useContext, useMemo } from 'react';
import { calculateBlockSize } from '../BlockContext';
import { BlockMode } from '../../utils/enums';
import { DnDContext } from '../DragAndDrop/DnDContext';
import { PlannerContext } from '../PlannerContext';

export const POINT_PADDING_X = 40;
export const POINT_PADDING_Y = 20;
export const CELL_SIZE_X = 30;
export const CELL_SIZE_Y = 30;

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

export function getMiddlePoint(list: Point[]) {
    // don't calculate it if the list is empty, to avoid setting the initial value to 0,0
    if (list.length <= 0) {
        return;
    }
    let sumX = 0;
    let sumY = 0;
    list.forEach((point) => {
        sumX += point.x;
        sumY += point.y;
    });
    // eslint-disable-next-line consistent-return
    return {
        x: sumX / list.length - 15,
        y: sumY / list.length,
    };
}

export function getCurveMainPoints(fromPoint: Point, toPoint: Point) {
    const indent = 40;

    const points = [
        { x: fromPoint.x, y: fromPoint.y },
        { x: fromPoint.x + indent, y: fromPoint.y },
        { x: toPoint.x - indent, y: toPoint.y },
        { x: toPoint.x, y: toPoint.y },
    ];

    return points;
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
        const mapping = converter.createMapping(
            provider.resource,
            consumer.resource,
            provider.block.spec.entities?.types ?? [],
            consumer.block.spec.entities?.types ?? []
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
                    width: Math.max(block.dimensions.width + 40, 150),
                    height: Math.max(block.dimensions.height + 40, 150),
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
        const matrixSize: [number, number] = [planner.canvasSize.width, planner.canvasSize.height];
        return fillMatrix(
            obstacles.filter((o) => o.id !== draggedBlockId),
            matrixSize,
            [CELL_SIZE_X, CELL_SIZE_Y]
        );
    }, [planner.canvasSize.width, planner.canvasSize.height, obstacles, draggedBlockId]);
};
