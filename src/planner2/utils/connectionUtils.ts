import { BlockConnectionSpec, Point } from '@kapeta/ui-web-types';
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
        connection.from.resourceName
    )}-${getResourceId(connection.to.blockId, connection.to.resourceName)}`;
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