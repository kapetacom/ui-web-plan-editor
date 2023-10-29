/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { IBlockTypeProvider } from '@kapeta/ui-web-types';
import { Box, Stack } from '@mui/material';
import React from 'react';
import { BlockTypeTool } from './BlockTypeTool';

interface Props {
    blockTypes: IBlockTypeProvider[];
}

export const BlockTypeToolList = (props: Props) => {
    return (
        <Box
            className={'planner-block-type-list'}
            sx={{
                pb: 2,
            }}
        >
            <Stack
                direction={'row'}
                alignItems={'flex-start'}
                flexWrap={'wrap'}
                sx={{
                    mt: 2,
                }}
                gap={2}
            >
                {props.blockTypes.map((blockType, ix) => {
                    return <BlockTypeTool key={`block-type-${ix}`} blockType={blockType} />;
                })}
            </Stack>
        </Box>
    );
};
