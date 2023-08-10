import React from 'react';
import {Asset, IBlockTypeProvider, IResourceTypeProvider, Size} from '@kapeta/ui-web-types';
import {BlockDefinition, BlockType, BlockTypeOperator} from "@kapeta/schemas";
import {Box} from "@mui/material";
import { ResourceShape } from './ResourceShape';

const RESOURCE_SHAPE_SIZE:Size = {
    width: 114,
    height: 48
}

interface Props {
    width: number;
    height: number;
    resourceType: IResourceTypeProvider
}

export const ResourceTypePreview = (props: Props) => {
    const innerWidth = Math.min(300, props.width);
    const innerHeight = Math.min(150, props.height);
    const widthRatio = innerWidth / RESOURCE_SHAPE_SIZE.width;
    const heightRatio = innerHeight / RESOURCE_SHAPE_SIZE.height;
    const ratio = Math.min(heightRatio, widthRatio);
    const marginH = Math.max(0, (props.width - (RESOURCE_SHAPE_SIZE.width * ratio))) / 2;
    const marginV = Math.max(0, (props.height - (RESOURCE_SHAPE_SIZE.height * ratio))) / 2;

    return <Box sx={{
        width: props.width,
        height: props.height,
        padding: `${marginV}px ${marginH}px`,
    }}>
        <div style={{
            transformOrigin: 'top left',
            pointerEvents: 'none',
            transform: `scale(${ratio})`
        }}>
            <ResourceShape resource={props.resourceType} />
        </div>
    </Box>
}
