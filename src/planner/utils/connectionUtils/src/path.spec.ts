/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { describe, it, expect } from '@jest/globals';
import { convertMatrixPathToPoints, getPathMidpoint, replaceJoinsWithArcs } from './path';
import { MatrixObstacle, fillMatrix } from './matrix';
import { findMatrixPath } from './path';
import * as PF from 'pathfinding';

describe('path', () => {
    it('finds a minimal non-diagonal path between two points', () => {
        const start: [number, number] = [0, 0];
        const end: [number, number] = [3, 3];
        const matrixSize: [number, number] = [4, 4];
        const obstacles: MatrixObstacle[] = [];
        const cellSize: [number, number] = [1, 1];

        // Convert X,Y to grid coords
        const startCell = start;
        const endCell = end;
        const myPath = findMatrixPath(startCell, endCell, new PF.Grid(fillMatrix(obstacles, matrixSize, cellSize)));

        // 0,0 -> 3,0 -> 3,3
        expect(
            convertMatrixPathToPoints(myPath, {
                offsetX: 0,
                offsetY: 0,
                stepX: 1,
                stepY: 1,
            })
        ).toEqual([
            [0, 0],
            [3, 0],
            [3, 3],
        ]);

        // Scaling and offset works
        expect(
            convertMatrixPathToPoints(myPath, {
                offsetX: 1,
                offsetY: 0,
                stepX: 2,
                stepY: 2,
            })
        ).toEqual([
            [1, 0],
            [7, 0],
            [7, 6],
        ]);
    });

    it('finds a path around an obstacle', () => {
        const start: [number, number] = [0, 0];
        const end: [number, number] = [3, 0];
        const matrixSize: [number, number] = [4, 4];
        // Put an obstacle in the top row to navigate around
        const obstacles: MatrixObstacle[] = [
            {
                x: 1,
                y: 0,
                width: 2,
                height: 2,
            },
        ];
        const cellSize: [number, number] = [1, 1];

        // Convert X,Y to grid coords
        const startCell = start;
        const endCell = end;
        const matrix = fillMatrix(obstacles, matrixSize, cellSize);
        const myPath = findMatrixPath(startCell, endCell, new PF.Grid(matrix));

        // 0,0 -> 0,2 -> 3,2 -> 3,0
        expect(
            convertMatrixPathToPoints(myPath, {
                offsetX: 0,
                offsetY: 0,
                stepX: 1,
                stepY: 1,
            })
        ).toEqual([
            [0, 0],
            [0, 2],
            [3, 2],
            [3, 0],
        ]);
    });
});

describe('getPathMidpoint', () => {
    it('returns the midpoint of a path', () => {
        const path = [
            [0, 0],
            [0, 1],
            [0, 2],
            [0, 3],
        ];
        // Middle of the second line
        expect(getPathMidpoint(path)).toEqual({
            x: 0,
            y: 1.5,
        });
    });
});

describe('convertSVGPathToRoundedCornerPath', () => {
    it('converts a path with only straight lines to rounded corners', () => {
        // Arc format: A rx ry x-axis-rotation large-arc-flag sweep-flag x y
        // https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths#Arcs
        const convertedPath = replaceJoinsWithArcs('M 0 0 L 0 10 L 10 10', 5);
        expect(convertedPath).toEqual('M 0 0 L 0 5 A 5 5 0 0 0 5 10 L 10 10');
    });

    it('generates clockwise arcs', () => {
        // Check that it gets the clockwise flag right - generate a path that goes around the outside of a square
        const convertedPath2 = replaceJoinsWithArcs('M 0 0 L 10 0 L 10 10 L 0 10 L 0 0', 5);
        expect(convertedPath2).toEqual(
            'M 0 0 L 5 0 A 5 5 0 0 1 10 5 L 10 5 A 5 5 0 0 1 5 10 L 5 10 A 5 5 0 0 1 0 5 L 0 0'
        );
    });
    it('generates counter-clockwise arcs', () => {
        // Check that it gets the clockwise flag right - generate a path that goes around the outside of a square
        const convertedPath2 = replaceJoinsWithArcs('M 0 0 L 0 10 L 10 10 L 10 0 L 0 0', 5);
        expect(convertedPath2).toEqual(
            'M 0 0 L 0 5 A 5 5 0 0 0 5 10 L 5 10 A 5 5 0 0 0 10 5 L 10 5 A 5 5 0 0 0 5 0 L 0 0'
        );
    });
});
