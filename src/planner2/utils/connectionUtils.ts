import {Connection, Plan, BlockResource, BlockInstanceResource } from '@kapeta/schemas';
import { ResourceTypeProvider } from '@kapeta/ui-web-context';
import { Point, ResourceRole } from '@kapeta/ui-web-types';
import { BasisCurve } from '@kapeta/ui-web-utils';
import { getResourceId } from './planUtils';


export function calculatePathBetweenPoints(fromPoint: Point, toPoint: Point) {
    return getCurveFromPoints(getCurveMainPoints(fromPoint, toPoint));
}

export function getCurveFromPoints(points: Point[]) {
    const curve = new BasisCurve();
    curve.lineStart();
    points.forEach((point) => {
        curve.point(point);
    });
    curve.lineEnd();
    return curve.toString();
}

export function getConnectionId(connection: Connection) {
    return `${getResourceId(
        connection.provider.blockId,
        connection.provider.resourceName,
        ResourceRole.PROVIDES
    )}-${getResourceId(connection.consumer.blockId, connection.consumer.resourceName, ResourceRole.CONSUMES)}`;
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

export function createConnection(provider:BlockInstanceResource, consumer:BlockInstanceResource) {
    const connection:Connection = {
        provider: {
            resourceName: provider.resource.metadata.name,
            blockId: provider.instance.id
        },
        consumer: {
            resourceName: consumer.resource.metadata.name,
            blockId: consumer.instance.id
        }
    }

    const converter = ResourceTypeProvider.getConverterFor(provider.resource.kind, consumer.resource.kind);
    if (converter &&
        converter.createMapping) {
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