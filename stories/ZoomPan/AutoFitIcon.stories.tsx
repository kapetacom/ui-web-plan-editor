/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React from 'react';
import { AutoFitIcon } from '../../src/planner/ZoomAndPan/controls/AutoFitIcon';
import { Box, Stack, Typography } from '@mui/material';
import FitScreenIcon from '@mui/icons-material/FitScreen';

export default {
    title: 'Zoom and Pan/AutoFitIcon',
    component: AutoFitIcon,
};

export const Default = () => {
    const [autoFit1, setAutoFit1] = React.useState(false);
    const [autoFit2, setAutoFit2] = React.useState(false);
    const [autoFit3, setAutoFit3] = React.useState(false);

    return (
        <Stack>
            <Typography variant="body2" sx={{ mb: 4 }}>
                This story demonstrates the AutoFit icon (compared to the FitScreen icon from MUI)
                <br />
                The AutoFit icon is a custom icon that can be in two states: autoFit or not autoFit.
                <br />
                Click on the AutoFit icon to toggle the state.
            </Typography>
            <Box>
                <AutoFitIcon
                    size={20}
                    autoFit={autoFit1}
                    color={autoFit1 ? 'rgba(0,0,0,0.87)' : 'rgba(0,0,0,0.5)'}
                    onClick={() => setAutoFit1((prev) => !prev)}
                />
                <FitScreenIcon fontSize="small" />
            </Box>
            <Box>
                <AutoFitIcon
                    size={24}
                    autoFit={autoFit2}
                    color={autoFit2 ? 'rgba(0,0,0,0.87)' : 'rgba(0,0,0,0.5)'}
                    onClick={() => setAutoFit2((prev) => !prev)}
                />
                <FitScreenIcon fontSize="medium" />
            </Box>
            <Box>
                <AutoFitIcon
                    size={35}
                    autoFit={autoFit3}
                    color={autoFit3 ? 'rgba(0,0,0,0.87)' : 'rgba(0,0,0,0.5)'}
                    onClick={() => setAutoFit3((prev) => !prev)}
                />
                <FitScreenIcon fontSize="large" />
            </Box>
        </Stack>
    );
};
