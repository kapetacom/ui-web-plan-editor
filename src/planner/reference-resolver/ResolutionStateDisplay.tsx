/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { ResolutionState, ResolutionStateType } from '../validation/PlanResolutionTransformer';
import React from 'react';
import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
interface Props {
    resolutionState: ResolutionState;
    onRetry?: () => void;
}

export const ResolutionStateDisplay = (props: Props) => {
    let message = '';
    let icon: any = null;
    let color = '';
    let showRetry = false;
    switch (props.resolutionState.state) {
        case ResolutionStateType.IDLE:
        case ResolutionStateType.ACTIVE:
            message = 'Applying...';
            color = 'info.main';
            icon = <CircularProgress size={20} color="inherit" />;
            break;
        case ResolutionStateType.DONE:
            message = 'Done';
            color = 'success.main';
            icon = <CheckCircleIcon />;
            break;
        case ResolutionStateType.ERROR:
            message = `Failed: ${props.resolutionState.error}`;
            color = 'error.main';
            icon = <ErrorOutlineIcon />;
            showRetry = true;
            break;
        default:
            props.resolutionState.state satisfies never;
            break;
    }

    return (
        <Stack
            className={'resolution-state'}
            sx={{
                color,
            }}
            gap={1}
            direction={'row'}
            alignItems={'center'}
        >
            {icon}
            <Typography color={'inherit'}>{message}</Typography>
            {props.onRetry && showRetry && (
                <Button variant="text" onClick={props.onRetry}>
                    Reset
                </Button>
            )}
        </Stack>
    );
};
