import { BlockConnectionSpec, PlanKind, Point, ResourceRole } from '@kapeta/ui-web-types';
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

export function getConnectionId(connection: BlockConnectionSpec) {
    return `${getResourceId(
        connection.from.blockId,
        connection.from.resourceName,
        ResourceRole.PROVIDES
    )}-${getResourceId(connection.to.blockId, connection.to.resourceName, ResourceRole.CONSUMES)}`;
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

export function isConnectionTo(connection: BlockConnectionSpec, instanceId: string, resourceName?: string) {
    if (!resourceName) {
        return connection.from.blockId === instanceId || connection.to.blockId === instanceId;
    }

    return (
        (connection.from.blockId === instanceId && connection.from.resourceName === resourceName) ||
        (connection.to.blockId === instanceId && connection.to.resourceName === resourceName)
    );
}

export function getConnectionsFor(plan: PlanKind, blockId: string, resourceName: string) {
    return (
        plan.spec.connections?.filter((connection) => {
            return isConnectionTo(connection, blockId, resourceName);
        }) ?? []
    );
}
