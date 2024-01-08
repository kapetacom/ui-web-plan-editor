/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React from 'react';
import { Box } from '@mui/material';
import {
    BackgroundVariant,
    ZoomPanBackground,
    ZoomPanBackgroundProps,
} from '../../src/planner/ZoomAndPan/background/ZoomPanBackground';

export default {
    title: 'Zoom and Pan/Background',
    parameters: {
        layout: 'fullscreen',
    },
};

export const BackgroundDemo = () => {
    const items: ZoomPanBackgroundProps[] = [
        { color: 'black', variant: BackgroundVariant.Dots },
        { color: 'black', variant: BackgroundVariant.Lines },
        { color: 'black', variant: BackgroundVariant.Cross },
        { color: '#e4e4e4', variant: BackgroundVariant.Dots },
        { color: '#e4e4e4', variant: BackgroundVariant.Lines },
        { color: '#e4e4e4', variant: BackgroundVariant.Cross },
        { color: '#5aacff', variant: BackgroundVariant.Dots, style: { backgroundColor: '#dae1ff' } },
        { color: '#5aacff', variant: BackgroundVariant.Lines, style: { backgroundColor: '#dae1ff' } },
        { color: '#5aacff', variant: BackgroundVariant.Cross, style: { backgroundColor: '#dae1ff' } },
    ];

    return (
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, min-content)',
                gap: '20px',
            }}
        >
            {items.map((item, index) => {
                return (
                    <Box sx={{ position: 'relative', width: '200px', height: '200px' }} key={index}>
                        <ZoomPanBackground {...item} />
                    </Box>
                );
            })}
        </Box>
    );
};
