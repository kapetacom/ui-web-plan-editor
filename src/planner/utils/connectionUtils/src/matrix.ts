/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

export interface MatrixObstacle {
    x: number;
    y: number;
    width: number;
    height: number;
    id?: string;
}

export function fillMatrix(
    objects: MatrixObstacle[],
    matrixSize: [number, number],
    [cellSizeX, cellSizeY]: [number, number]
): number[][] {
    const [matrixWidth, matrixHeight] = matrixSize.map((v) => Math.floor(v / cellSizeX));
    const matrix: number[][] = Array.from({ length: matrixHeight }, () => Array(matrixWidth).fill(0));

    applyObstacles(matrix, objects, [cellSizeX, cellSizeY]);

    return matrix;
}

export function applyObstacles(
    matrix: number[][],
    objects: MatrixObstacle[],
    [cellSizeX, cellSizeY]: [number, number]
): number[][] {
    const [matrixWidth, matrixHeight] = [matrix[0].length, matrix.length];
    for (const obj of objects) {
        const { x, y, width, height } = obj;

        const startX = Math.floor(x / cellSizeX);
        const startY = Math.floor(y / cellSizeY);
        const endX = Math.floor((x + width - 1) / cellSizeX);
        const endY = Math.floor((y + height - 1) / cellSizeY);

        for (let iy = startY; iy <= endY; iy++) {
            for (let ix = startX; ix <= endX; ix++) {
                if (iy >= 0 && iy < matrixHeight && ix >= 0 && ix < matrixWidth) {
                    matrix[iy][ix] = 1;
                }
            }
        }
    }

    return matrix;
}
