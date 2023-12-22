/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { IBlockTypeProvider } from '@kapeta/ui-web-types';
import { Box, Grid, Stack } from '@mui/material';
import React from 'react';
import { BlockTypeTool } from './BlockTypeTool';

interface Props {
    blockTypes: IBlockTypeProvider[];
}

export const BlockTypeToolList = (props: Props) => {
    return (
        <Box className="planner-block-type-list">
            <Grid container spacing={2}>
                {props.blockTypes.map((blockType, ix) => {
                    return (
                        <Grid item xs={6}>
                            <BlockTypeTool key={`block-type-${ix}`} blockType={blockType} />
                        </Grid>
                    );
                })}
            </Grid>
        </Box>
    );
};
