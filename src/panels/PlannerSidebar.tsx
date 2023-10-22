import React, { PropsWithChildren } from 'react';
import { DrawerProps, Drawer, Typography, Divider, Box, Stack, IconButton } from '@mui/material';
import { CloseRounded } from '@mui/icons-material';

interface Props extends PropsWithChildren, Omit<DrawerProps, 'children'> {
    title: string;
    size?: 'small' | 'medium' | 'large';
}

export const PlannerSidebar = (props: Props) => {
    const propsCopy: any = { ...props };
    delete propsCopy.title;
    let width = '680px';
    switch (props.size) {
        case 'large':
            width = 'calc(100% - 530px)';
            break;
        case 'medium':
            width = 'calc(100% - 730px)';
    }
    return (
        <Drawer
            className={'kap-planner-sidebar'}
            anchor={'right'}
            sx={{
                '& .MuiDrawer-paper': {
                    width: width,
                    p: 4,
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                },
            }}
            {...propsCopy}
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
                            {props.title}
                        </Typography>
                        <IconButton
                            sx={{
                                fontSize: 'inherit',
                            }}
                            onClick={(evt) => {
                                if (props.onClose) {
                                    props.onClose(evt, 'escapeKeyDown');
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
                    {props.children}
                </Box>
            </Stack>
        </Drawer>
    );
};
