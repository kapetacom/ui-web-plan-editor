/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React from 'react';
import { IBlockTypeProvider } from '@kapeta/ui-web-types';
import { BlockDefinition } from '@kapeta/schemas';
import { Box } from '@mui/material';
import { BlockShape } from './BlockShape';

interface BlockTypeProps {
    width: number;
    height: number;
    blockType: IBlockTypeProvider;
}

export const BlockTypePreview = (props: BlockTypeProps) => {
    return (
        <Box
            sx={{
                width: props.width,
                height: props.height,
                textAlign: 'center',
                pointerEvents: 'none',
            }}
        >
            <BlockShape blockType={props.blockType} showText width={props.width} height={props.height} />
        </Box>
    );
};

interface BlockProps extends BlockTypeProps {
    block: BlockDefinition;
    showResources?: boolean;
}

export const BlockPreview = (props: BlockProps) => {
    return (
        <Box
            sx={{
                width: props.width,
                height: props.height,
                textAlign: 'center',
                pointerEvents: 'none',
            }}
        >
            <BlockShape
                blockType={props.blockType}
                block={props.block}
                showText
                showResources={props.showResources}
                width={props.width}
                height={props.height}
            />
        </Box>
    );
};
