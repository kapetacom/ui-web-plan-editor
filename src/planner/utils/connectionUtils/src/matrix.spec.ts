/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { describe, it, expect } from '@jest/globals';
import { fillMatrix } from './matrix';

describe('fillMatrix', () => {
    it('should fill the matrix correctly for a single object', () => {
        const objects = [{ x: 1, y: 1, width: 2, height: 2 }];
        const matrixSize: [number, number] = [4, 4];
        const cellSize: [number, number] = [1, 1];
        const expectedMatrix = [
            [0, 0, 0, 0],
            [0, 1, 1, 0],
            [0, 1, 1, 0],
            [0, 0, 0, 0],
        ];

        const resultMatrix = fillMatrix(objects, matrixSize, cellSize);

        expect(resultMatrix).toEqual(expectedMatrix);
    });

    it('should fill the matrix correctly for multiple objects', () => {
        const objects = [
            { x: 1, y: 1, width: 2, height: 2 },
            { x: 3, y: 3, width: 2, height: 2 },
        ];
        const matrixSize: [number, number] = [6, 6];
        const cellSize: [number, number] = [1, 1];
        const expectedMatrix = [
            [0, 0, 0, 0, 0, 0],
            [0, 1, 1, 0, 0, 0],
            [0, 1, 1, 0, 0, 0],
            [0, 0, 0, 1, 1, 0],
            [0, 0, 0, 1, 1, 0],
            [0, 0, 0, 0, 0, 0],
        ];

        const resultMatrix = fillMatrix(objects, matrixSize, cellSize);

        expect(resultMatrix).toEqual(expectedMatrix);
    });

    it('should handle objects outside the matrix size', () => {
        const objects = [{ x: 10, y: 10, width: 5, height: 5 }];
        const matrixSize: [number, number] = [8, 8];
        const cellSize: [number, number] = [1, 1];
        const expectedMatrix = [
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
        ];

        const resultMatrix = fillMatrix(objects, matrixSize, cellSize);

        expect(resultMatrix).toEqual(expectedMatrix);
    });

    it('should handle objects with a cell size larger than 1 - overflow', () => {
        const objects = [{ x: 1, y: 1, width: 2, height: 2 }];
        const matrixSize: [number, number] = [4, 4];
        const cellSize: [number, number] = [2, 2];
        const expectedMatrix = [
            [1, 1, 0, 0],
            [1, 1, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
        ];
        const resultMatrix = fillMatrix(objects, matrixSize, cellSize);
        expect(resultMatrix).toEqual(expectedMatrix);
    });

    it('should handle objects with a cell size larger than 1 - contained', () => {
        const objects = [{ x: 0, y: 0, width: 2, height: 2 }];
        const matrixSize: [number, number] = [4, 4];
        const cellSize: [number, number] = [2, 2];
        const expectedMatrix = [
            [1, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
        ];
        const resultMatrix = fillMatrix(objects, matrixSize, cellSize);
        expect(resultMatrix).toEqual(expectedMatrix);
    });
});
