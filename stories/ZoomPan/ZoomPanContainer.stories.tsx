/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

/* eslint-disable no-console */

import React from 'react';
import { ZoomPanContainer } from '../../src/planner/ZoomAndPan/ZoomPanContainer';
import { Box, useTheme } from '@mui/material';
import { Rectangle } from '../../src/planner/types';

export default {
    title: 'Zoom and Pan/Container',
    parameters: {
        layout: 'fullscreen',
    },
};

const getBlockStyle = (x: number, y: number) => ({
    position: 'absolute',
    top: `${y}px`,
    left: `${x}px`,
    width: '150px',
    height: '100px',
    p: 2,
    background: 'white',
    borderRadius: 1,
    outline: '1px solid #e4e4e4',
});

export const ZoomAndPanDemo = () => {
    const isDarkMode = useTheme().palette.mode === 'dark';
    const blocks: Rectangle[] = [
        {
            x: 50,
            y: 50,
            width: 150,
            height: 100,
        },
        {
            x: 200,
            y: 200,
            width: 150,
            height: 100,
        },
        {
            x: 350,
            y: 20,
            width: 150,
            height: 100,
        },
    ];

    return (
        <ZoomPanContainer
            sx={{
                width: '100%',
                height: '100%',
                background: isDarkMode ? '#1E2020' : '#f5f1ee',
            }}
            childrenBBox={calculateCombinedBoundingBox(blocks)}
            onZoomPanStart={() => console.log('ZoomPanStart')}
            onZoomPanEnd={() => console.log('ZoomPanEnd')}
            onZoomPanTick={(x, y, z) => console.log('ZoomPanTick', x, y, z)}
            onAutoFitEnabled={() => console.log('Auto fit Enabled')}
            onAutoFitDisabled={() => console.log('Auto fit Disabled')}
            showPixelGrid
        >
            <Box sx={getBlockStyle(50, 50)}>Block 1</Box>
            <Box sx={getBlockStyle(200, 200)}>Block 2</Box>
            <Box sx={getBlockStyle(350, 20)}>Block 3</Box>
        </ZoomPanContainer>
    );
};

/**
 * Calculate the bounding box of a set of rectangles. The bounding box is the smallest rectangle
 * that contains all the rectangles.
 */
function calculateCombinedBoundingBox(rectangles: Rectangle[]): Rectangle {
    if (rectangles.length === 0) {
        return { x: 0, y: 0, width: 0, height: 0 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = 0;
    let maxY = 0;

    rectangles.forEach((element) => {
        const { x, y, width, height } = element;

        // Update the min and max x and y values
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + width);
        maxY = Math.max(maxY, y + height);
    });

    // Calculate the overall bounding box
    const combinedBoundingBox = {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
    };

    return combinedBoundingBox;
}
