/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React from 'react';

import { BlockTree } from './BlockTree';

import './PlannerFocusSideBar.less';
import { BlockInstance } from '@kapeta/schemas';
import { Drawer, Icon, Stack, Typography } from '@mui/material';
import { ChevronLeft } from '@mui/icons-material';

interface Props {
    block?: BlockInstance;
    blurFocus: () => void;
    onClose: () => void;
    onFocusChange: (block: BlockInstance) => void;
}

export const PlannerFocusSideBar = (props: Props) => {
    return (
        <Drawer
            anchor={'right'}
            className="focus-side-panel-2"
            sx={{
                pointerEvents: 'none',
                '& .MuiDrawer-paper': {
                    pointerEvents: 'all',
                    bgcolor: '#1E1E1E',
                    width: '160px',
                    p: 4,
                    color: '#F5F1EE',
                },
            }}
            hideBackdrop={true}
            variant={'temporary'}
            open={!!props.block}
            onClose={props.onClose}
        >
            <Stack direction={'row'}>
                <Icon
                    sx={{
                        fontSize: '22px',
                        cursor: 'pointer',
                    }}
                    onClick={props.blurFocus}
                >
                    <ChevronLeft />
                </Icon>
                <Typography fontSize={'22px'} variant={'h3'}>
                    Blocks in use
                </Typography>
            </Stack>
            {props.block && (
                <BlockTree
                    onBlockClicked={(block) => {
                        props.onFocusChange(block);
                    }}
                    block={props.block}
                />
            )}
        </Drawer>
    );
};
