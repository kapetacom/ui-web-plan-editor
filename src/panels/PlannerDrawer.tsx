import React from 'react';
import { Paper, Stack } from '@mui/material';

export const PlannerDrawer = (props: React.PropsWithChildren) => {
    return (
        <Paper
            className="planner-resource-drawer"
            square
            variant="elevation"
            sx={{
                p: 2,
                width: 284,
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
