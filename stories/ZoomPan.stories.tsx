/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React from 'react';
import { ZoomPanContainer } from '../src/planner/ZoomAndPan/ZoomPanContainer';
import { Box } from '@mui/material';
import { Rectangle } from '../src/planner/types';
import { calculateCombinedBoundingBox } from '../src/planner/ZoomAndPan/helpers';

export default {
    title: 'Zoom and Pan',
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
                background: '#f5f1ee',
            }}
            onLock={() => console.log('Locked')}
            onUnlock={() => console.log('Unlocked')}
            contentBBox={calculateCombinedBoundingBox(blocks)}
            onZoomChange={(zoom) => console.log('Zoom changed to', zoom)}
            onPanChange={(x, y) => console.log('Pan changed to', x, y)}
        >
            <Box sx={getBlockStyle(50, 50)}>Block 1</Box>
            <Box sx={getBlockStyle(200, 200)}>Block 2</Box>
            <Box sx={getBlockStyle(350, 20)}>Block 3</Box>
        </ZoomPanContainer>
    );
};
