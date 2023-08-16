import React from 'react';
import { IBlockTypeProvider } from '@kapeta/ui-web-types';
import { BlockDefinition, BlockType, BlockTypeOperator } from '@kapeta/schemas';
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
            <BlockShape blockType={props.blockType} showText={true} width={props.width} height={props.height} />
        </Box>
    );
};

interface BlockProps extends BlockTypeProps {
    block: BlockDefinition;
    resources?: boolean;
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
                showText={true}
                showResources={props.resources}
                width={props.width}
                height={props.height}
            />
        </Box>
    );
};
