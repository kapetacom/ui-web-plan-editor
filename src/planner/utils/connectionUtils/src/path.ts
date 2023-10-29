/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import * as PF from 'pathfinding';

export function simplifyPath(grid: PF.Grid, path: number[][]) {
    const canMoveTo = (sx: number, sy: number, ex: number, ey: number) => {
        // @ts-ignore
        const interpolated = PF.Util.interpolate(sx, sy, ex, ey);
        //
        if (sx === ex || sy === ey) {
            for (const [x, y] of interpolated) {
                if (!grid.isWalkableAt(x, y)) {
                    return false;
                }
            }
        } else {
            throw new Error('Invalid move (not orthogonal)');
        }
        return true;
    };
    let compressedPath = path;
    // Each point is a turn, so we can try to simplify the path by
    // checking if we can replace point 1 and 3 with a single turn (moving point 2)
    // Only touch the middle point if it is part of a zig-zag line

    // Since we have to skip point 3 if we replace it, we need to do this multiple times for very jagged paths
    const numIterations = 3;
    let changed = true;
    for (let iter = 0; iter < numIterations && changed; iter++) {
        compressedPath = PF.Util.compressPath(compressedPath);
        changed = false;
        for (let i = 2; i < compressedPath.length - 1; i++) {
            const [x0, y0] = compressedPath[i - 2];
            const [x1, y1] = compressedPath[i - 1];
            const [x2, y2] = compressedPath[i];
            const [x3, y3] = compressedPath[i + 1];

            if (x1 === x2 && ((x0 < x1 && x2 < x3) || (x3 < x2 && x1 < x0))) {
                // vertical line, that is not part of a double-left or double-right turn
                if (canMoveTo(x1, y1, x3, y1) && canMoveTo(x3, y1, x3, y3)) {
                    compressedPath[i] = [x3, y1];
                    changed = true;
                    // skip trying to fix point 3
                    i++;
                    continue;
                }
            } else if (y1 === y2 && ((y0 < y1 && y2 < y3) || (y3 < y2 && y1 < y0))) {
                // horizontal line, that is not part of a double-left or double-right turn
                if (canMoveTo(x1, y1, x1, y3) && canMoveTo(x1, y3, x3, y3)) {
                    compressedPath[i] = [x1, y3];
                    changed = true;
                    // skip trying to fix point 3
                    i++;
                    continue;
                }
            }
        }
    }

    return PF.Util.compressPath(compressedPath);
}

export function findMatrixPath(
    start: readonly [number, number],
    end: readonly [number, number],
    grid: PF.Grid
): number[][] {
    // const finder = new PF.JumpPointFinder({ diagonalMovement: PF.DiagonalMovement.Never });
    const boundedStart = [
        Math.max(0, Math.min(grid.width - 1, start[0])),
        Math.max(0, Math.min(grid.height - 1, start[1])),
    ];
    const boundedEnd = [Math.max(0, Math.min(grid.width - 1, end[0])), Math.max(0, Math.min(grid.height - 1, end[1]))];
    const finder = new PF.AStarFinder({ diagonalMovement: PF.DiagonalMovement.Never });
    // @ts-ignore
    const path = finder.findPath(...boundedStart, ...boundedEnd, grid);
    // Simplify the path by converting lines to single [start, end] instead of [start, ...intermediate, end]
    // EDIT: Maybe we dont want this, since it animates better with more points
    if (path.length > 2) {
        return simplifyPath(grid, path);
    }
    return PF.Util.compressPath(path);
}

export function convertMatrixPathToPoints(
    path: number[][],
    options: {
        offsetX: number;
        offsetY: number;
        stepX: number;
        stepY: number;
    }
) {
    return path.map(([x, y]) => {
        const xCoord = options.offsetX + x * options.stepX;
        const yCoord = options.offsetY + y * options.stepY;
        return [xCoord, yCoord];
    });
}

// For instrumentation - find the midpoint of a path
// Will return the middle of the line segment that is closest to the middle of the path
export function getPathMidpoint(path: number[][]) {
    const compressedPath = PF.Util.compressPath(path);
    const totalLength = compressedPath.reduce(
        (acc, [x, y]) => {
            const xDiff = acc.x === -1 ? 0 : Math.abs(x - acc.x);
            const yDiff = acc.y === -1 ? 0 : Math.abs(y - acc.y);
            return {
                length: acc.length + yDiff + xDiff,
                x,
                y,
            };
        },
        {
            length: 0,
            x: -1,
            y: -1,
        }
    );
    const midpoint = totalLength.length / 2;
    let length = 0;
    for (let i = 1; i < compressedPath.length; i++) {
        const [x1, y1] = compressedPath[i - 1];
        const [x2, y2] = compressedPath[i];

        length += Math.abs(x2 - x1) + Math.abs(y2 - y1);
        if (length > midpoint) {
            return { x: (x2 + x1) / 2, y: (y2 + y1) / 2 };
        }
    }
    return { x: 0, y: 0 };
}

//
// https://codesandbox.io/s/goofy-monad-6ecf6k?file=/src/index.ts
export function replaceJoinsWithArcs(svgPath: string, radius: number): string {
    const pathSegments = svgPath.split(/\s?[ML]\s?/).filter(Boolean);
    const replacedSegments: string[] = [`M ${pathSegments[0]}`];

    for (let i = 1; i < pathSegments.length - 1; i++) {
        const prevSegment = pathSegments[i - 1];
        const segment = pathSegments[i];
        const nextSegment = pathSegments[i + 1];

        const [prevX, prevY] = prevSegment.split(' ').map(parseFloat);
        const [x, y] = segment.split(' ').map(parseFloat);
        const [nextX, nextY] = nextSegment.split(' ').map(parseFloat);

        if (!isNaN(x) && !isNaN(y) && !isNaN(nextX) && !isNaN(nextY)) {
            const dynamicRadius = Math.min(
                radius,
                Math.max(Math.abs(x - prevX), Math.abs(y - prevY)) / 2,
                Math.max(Math.abs(x - nextX), Math.abs(y - nextY)) / 2
            );
            if (x === nextX && x !== prevX) {
                // current -> next is Vertical line
                // If current segment is down (Y++), and previous was right (X++), then clockwise
                // If current segment is up (Y--), and previous was left (X--), then clockwise
                const isClockwise = (y > nextY && x < prevX) || (y < nextY && x > prevX);
                const line1EndX = x > prevX ? x - dynamicRadius : x + dynamicRadius;
                const line2StartY = y > nextY ? y - dynamicRadius : y + dynamicRadius;

                replacedSegments.push(`L ${line1EndX} ${y}`);
                replacedSegments.push(
                    `A ${dynamicRadius} ${dynamicRadius} 0 0 ${isClockwise ? 1 : 0} ${x} ${line2StartY}`
                );
            } else if (y === nextY && y !== prevY) {
                // current -> next is Horizontal line
                // If current segment is right (X++), and previous was up (Y--), then clockwise
                // If current segment is left (X--), and previous was down (Y++), then clockwise
                const isClockwise = (x < nextX && y < prevY) || (x > nextX && y > prevY);

                const line1EndY = y > prevY ? y - dynamicRadius : y + dynamicRadius;
                const line2StartX = x > nextX ? x - dynamicRadius : x + dynamicRadius;

                replacedSegments.push(`L ${x} ${line1EndY}`);
                replacedSegments.push(
                    `A ${dynamicRadius} ${dynamicRadius} 0 0 ${isClockwise ? 1 : 0} ${line2StartX} ${y}`
                );
            } else {
                replacedSegments.push(`L ${x} ${y}`);
            }
        }
    }

    // Append the last segment of the original path
    const lastSegment = pathSegments[pathSegments.length - 1];
    replacedSegments.push(`L ${lastSegment}`);

    return `${replacedSegments.join(' ')}`;
}
