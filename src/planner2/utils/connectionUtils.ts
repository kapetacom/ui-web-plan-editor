import { BlockConnectionSpec, Point } from '@kapeta/ui-web-types';
import { BasisCurve } from '@kapeta/ui-web-utils';
import { getResourceId } from './planUtils';

export function calculatePathBetweenPoints(fromPoint: Point, toPoint: Point) {
    const indent = 40;
    const points = [
        { x: fromPoint.x, y: fromPoint.y },
        { x: fromPoint.x + indent, y: fromPoint.y },
        { x: toPoint.x - indent, y: toPoint.y },
        { x: toPoint.x, y: toPoint.y },
    ];
    return getCurveFromPoints(points);
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
        connection.from.resourceName
    )}-${getResourceId(connection.to.blockId, connection.to.resourceName)}`;
}
