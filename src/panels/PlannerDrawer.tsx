/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React from 'react';
import { Paper, Stack } from '@mui/material';

export const PlannerDrawer = (props: React.PropsWithChildren) => {
    return (
        <Paper
            data-kap-id="plan-editor-resource-drawer"
            className="planner-resource-drawer"
            square
            variant="elevation"
            sx={{
                p: 2,
                width: '284px',
                height: '100%',
                boxSizing: 'border-box',
                flexShrink: 0,
                overflowY: 'auto',
            }}
            elevation={2}
        >
            <Stack direction="column">{props.children}</Stack>
        </Paper>
    );
};
