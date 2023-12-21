/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React, { useCallback, useState } from 'react';
import { Box, BoxProps, Button, ButtonGroup, styled } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap';
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';

export interface ZoomPanControlsProps extends BoxProps {
    onZoomIn?: () => void;
    onZoomOut?: () => void;
    onFitToView?: () => void;
    onCenter?: () => void;
    onLock?: () => void;
    onUnlock?: () => void;
}

const StyledButtonGroup = styled(ButtonGroup)(({ theme }) => ({
    boxShadow: '0 0 2px 1px #00000014',
    '.MuiButtonGroup-grouped': {
        minWidth: '30px',
        borderColor: 'rgba(0, 0, 0, 0.1)',
        backgroundColor: '#ffffff',
        '&:hover': {
            backgroundColor: '#f5f5f5',
        },
    },
}));

export const ZoomPanControls = (props: ZoomPanControlsProps) => {
    const { onZoomIn, onZoomOut, onFitToView, onCenter, onLock, onUnlock, sx, ...boxProps } = props;

    const [isLocked, setIsLocked] = useState(false);

    const onToggleLock = useCallback(() => {
        if (isLocked) {
            onUnlock?.();
            setIsLocked(false);
        } else {
            onLock?.();
            setIsLocked(true);
        }
    }, [isLocked, onLock, onUnlock]);

    return (
        <Box
            sx={{
                position: 'absolute',
                left: (theme) => theme.spacing(2),
                bottom: (theme) => theme.spacing(2),
                ...sx,
            }}
            {...boxProps}
        >
            <StyledButtonGroup orientation="vertical" variant="text" color="inherit" aria-label="zoom buttons">
                {onZoomIn && (
                    <Button onClick={onZoomIn}>
                        <AddIcon fontSize="inherit" />
                    </Button>
                )}

                {onZoomOut && (
                    <Button onClick={onZoomOut}>
                        <RemoveIcon fontSize="inherit" />
                    </Button>
                )}

                {onFitToView && (
                    <Button onClick={onFitToView}>
                        <ZoomOutMapIcon fontSize="inherit" />
                    </Button>
                )}

                {onCenter && (
                    <Button onClick={onCenter}>
                        <CenterFocusStrongIcon fontSize="inherit" />
                    </Button>
                )}

                {(onLock || onUnlock) && (
                    <Button onClick={onToggleLock}>
                        {isLocked ? (
                            <LockOutlinedIcon fontSize="inherit" />
                        ) : (
                            <LockOpenOutlinedIcon fontSize="inherit" />
                        )}
                    </Button>
                )}
            </StyledButtonGroup>
        </Box>
    );
};
