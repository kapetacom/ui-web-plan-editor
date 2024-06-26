/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React from 'react';
import { Paper, PaperProps, Stack } from '@mui/material';

export interface PlannerDrawerProps extends PaperProps {}

export const PlannerDrawer = (props: PlannerDrawerProps) => {
    const { sx, children, ...paperProps } = props;

    return (
        <Paper
            data-kap-id="plan-editor-resource-drawer"
            className="planner-resource-drawer"
            square
            variant="elevation"
            sx={{
                width: '284px',
                height: '100%',
                boxSizing: 'border-box',
                flexShrink: 0,
                ...sx,
            }}
            elevation={2}
            {...paperProps}
        >
            <Stack direction="column" sx={{ height: '100%' }}>
                {children}
            </Stack>
        </Paper>
    );
};
