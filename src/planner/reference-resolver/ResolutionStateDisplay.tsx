import { ResolutionState, ResolutionStateType } from '../validation/PlanResolutionTransformer';
import React from 'react';
import { Box, CircularProgress, Stack, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
interface Props {
    resolutionState: ResolutionState;
}

export const ResolutionStateDisplay = (props: Props) => {
    let message = '';
    let icon = null;
    let color = '';
    switch (props.resolutionState.state) {
        case ResolutionStateType.IDLE:
        case ResolutionStateType.ACTIVE:
            message = 'Applying...';
            color = 'info.main';
            icon = <CircularProgress color="inherit" />;
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
            break;
    }

    return (
        <Stack
            sx={{
                color,
            }}
            gap={1}
            direction={'row'}
            alignItems={'center'}
        >
            {icon}
            <Typography color={'inherit'}>{message}</Typography>
        </Stack>
    );
};
