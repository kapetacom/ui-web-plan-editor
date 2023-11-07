/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React, { PropsWithChildren } from 'react';
import { DrawerProps, Drawer, Typography, Divider, Box, Stack, IconButton } from '@mui/material';
import { CloseRounded } from '@mui/icons-material';
import { VerticalResizeHandle, useResize } from './useResize';

interface PlannerSidebarProps extends PropsWithChildren, Omit<DrawerProps, 'children' | 'anchor'> {
    /**
     * The title of the planner sidebar
     */
    title: string;
    /**
     * The size of the planner sidebar. Default is 'medium' (600px).
     */
    size?: 'small' | 'medium' | 'large';
    /**
     * Minimum width of the planner sidebar. Default is 400.
     */
    minWidth?: number;
    /**
     * Maximum width of the planner sidebar
     */
    maxWidth?: number;
}

const sizeToWidth = {
    small: 400,
    medium: 600,
    large: 800,
};

export const PlannerSidebar = (props: PlannerSidebarProps) => {
    const { title, size = 'medium', minWidth = sizeToWidth.small, maxWidth, children, ...drawerProps } = props;

    const { onResize, ...resizeWidths } = useResize({
        direction: 'left',
        initialWidth: sizeToWidth[size],
        minWidth,
        maxWidth,
    });

    return (
        <Drawer
            className="kap-planner-sidebar"
            sx={{
                position: 'relative',
                '& .MuiDrawer-paper': {
                    p: 4,
                    boxSizing: 'border-box',
                    overflow: 'visible',
                    ...resizeWidths,
                },
            }}
            {...drawerProps}
            anchor="right"
        >
            <Stack
                sx={{
                    height: '100%',
                }}
                className={'kap-planner-sidebar-container'}
                direction={'column'}
                mb={2}
            >
                <Box mb={2} flex={0} className={'kap-planner-sidebar-titel'}>
                    <Stack
                        direction={'row'}
                        justifyContent={'space-between'}
                        alignItems={'center'}
                        sx={{
                            fontSize: '22px',
                        }}
                    >
                        <Typography fontSize={'inherit'} variant={'h3'}>
                            {title}
                        </Typography>
                        <IconButton
                            sx={{
                                fontSize: 'inherit',
                            }}
                            onClick={(evt) => {
                                if (drawerProps.onClose) {
                                    drawerProps.onClose(evt, 'escapeKeyDown');
                                }
                            }}
                        >
                            <CloseRounded />
                        </IconButton>
                    </Stack>
                    <Divider />
                </Box>
                <Box
                    flex={1}
                    sx={{
                        overflowY: 'auto',
                    }}
                    className={'kap-planner-sidebar-content'}
                >
                    {children}
                </Box>
            </Stack>

            <VerticalResizeHandle onResize={onResize} placement="left" />
        </Drawer>
    );
};
