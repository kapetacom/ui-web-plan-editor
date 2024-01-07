/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box, BoxProps, Button, ButtonGroup, styled } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { Tooltip } from '@kapeta/ui-web-components';
import { AutoFitIcon } from './controls/AutoFitIcon';

export interface ZoomPanControlsProps extends BoxProps {
    // Zoom in / out
    currentZoom?: number;
    onZoomIn?: () => void;
    onZoomOut?: () => void;

    // Auto fit
    onEnableAutoFit?: () => void;
    onDisableAutoFit?: () => void;

    // Lock
    onLock?: () => void;
    onUnlock?: () => void;
}

const StyledButtonGroup = styled(ButtonGroup)(({ theme }) => ({
    boxShadow: '0 0 2px 1px #00000014',
    '.MuiButtonGroup-grouped': {
        minWidth: '30px',
        borderColor: 'rgb(245 241 238)',
        backgroundColor: '#ffffff',
        '&:hover': {
            backgroundColor: '#f5f5f5',
        },
        '&.selected': {
            backgroundColor: 'rgb(234,218,209)',
            boxShadow: 'inset 0 0 2px 0 rgba(0,0,0,0.1)',
        },
    },
}));

export const ZoomPanControls = (props: ZoomPanControlsProps) => {
    const {
        // Zoom in / out
        currentZoom,
        onZoomIn,
        onZoomOut,

        // Auto fit
        onEnableAutoFit,
        onDisableAutoFit,

        // Lock
        onLock,
        onUnlock,

        // Other
        sx,
        ...boxProps
    } = props;

    // Animate the current zoom
    const currentZoomRef = useRef<HTMLSpanElement>(null);
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (currentZoomRef.current) {
            currentZoomRef.current.style.opacity = '1';
            currentZoomRef.current.style.transform = 'translateX(-50%) translateY(0px)';
            timer = setTimeout(() => {
                if (currentZoomRef.current) {
                    currentZoomRef.current.style.opacity = '0';
                    currentZoomRef.current.style.transform = 'translateX(-50%) translateY(10px)';
                }
            }, 2000);
        }
        return () => {
            clearTimeout(timer);
        };
    }, [currentZoom]);

    // Auto fit
    const [shouldAutoFit, setShouldAutoFit] = useState(false);

    const enableAutoFit = useCallback(() => {
        setShouldAutoFit(true);
        onEnableAutoFit?.();
    }, [onEnableAutoFit]);

    const disableAutoFit = useCallback(() => {
        setShouldAutoFit(false);
        onDisableAutoFit?.();
    }, [onDisableAutoFit]);

    // Lock
    const [isLocked, setIsLocked] = useState(false);

    const enableLock = useCallback(() => {
        setIsLocked(true);
        onLock?.();
    }, [onLock]);

    const disableLock = useCallback(() => {
        setIsLocked(false);
        onUnlock?.();
    }, [onUnlock]);

    return (
        <Box
            sx={{
                position: 'absolute',
                left: (theme) => theme.spacing(2),
                bottom: (theme) => theme.spacing(2),
                display: 'flex',
                flexDirection: 'column',
                flexWrap: 'nowrap',
                gap: 1,
                ...sx,
            }}
            {...boxProps}
        >
            {/* Zoom in / out */}
            <StyledButtonGroup
                orientation="vertical"
                variant="text"
                color="inherit"
                aria-label="zoom buttons"
                sx={{ position: 'relative' }}
            >
                {onZoomIn && (
                    <Tooltip title="Zoom in" placement="right" enterDelay={1000}>
                        <Button onClick={onZoomIn}>
                            <AddIcon fontSize="inherit" />
                        </Button>
                    </Tooltip>
                )}

                {onZoomOut && (
                    <Tooltip title="Zoom out" placement="right" enterDelay={1000}>
                        <Button onClick={onZoomOut}>
                            <RemoveIcon fontSize="inherit" />
                        </Button>
                    </Tooltip>
                )}

                {currentZoom && (onZoomIn || onZoomOut) && (
                    <Box
                        ref={currentZoomRef}
                        component="span"
                        sx={{
                            position: 'absolute',
                            top: '-25px',
                            left: '50%',
                            color: 'rgba(0,0,0,0.5)',
                            fontSize: '0.8rem',
                            // As default the zoom value is hidden
                            opacity: 0,
                            transform: 'translateX(-50%) translateY(10px)',
                            transition: 'opacity 300ms ease-in-out, transform 300ms ease-in-out',
                        }}
                    >
                        {Math.round(currentZoom * 100)}%
                    </Box>
                )}

                <Tooltip title="Auto fit" placement="right" enterDelay={1000}>
                    <Button
                        onClick={shouldAutoFit ? disableAutoFit : enableAutoFit}
                        className={shouldAutoFit ? 'selected' : ''}
                    >
                        <AutoFitIcon autoFit={shouldAutoFit} size={18} />
                    </Button>
                </Tooltip>
            </StyledButtonGroup>

            {/* Lock */}
            {(onLock || onUnlock) && (
                <StyledButtonGroup orientation="vertical" variant="text" color="inherit" aria-label="zoom buttons">
                    <Button onClick={isLocked ? disableLock : enableLock}>
                        {isLocked ? (
                            <LockOutlinedIcon fontSize="inherit" />
                        ) : (
                            <LockOpenOutlinedIcon fontSize="inherit" />
                        )}
                    </Button>
                </StyledButtonGroup>
            )}
        </Box>
    );
};
