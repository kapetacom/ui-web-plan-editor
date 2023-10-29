/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React, { forwardRef, useRef, useState } from 'react';

import { IBlockTypeProvider, Point } from '@kapeta/ui-web-types';
import { Box, Grow, Portal, Typography } from '@mui/material';
import { Add } from '@mui/icons-material';
import { BlockLayout } from '@kapeta/ui-web-components';
import { BlockNode } from '../../components/BlockNode';
import { parseKapetaUri } from '@kapeta/nodejs-utils';
import { DragAndDrop } from '../../planner/DragAndDrop';
import { Transition } from 'react-transition-group';
import { useDraggedRotation } from '../../planner/utils/dndUtils';
import { PlannerPayloadType } from '../../planner/types';
import { BlockDefinition } from '@kapeta/schemas';
import { BlockShape, getBlockTypeTitle } from '../../components/BlockShape';

interface Props {
    blockType: IBlockTypeProvider;
}

export const BlockTypeTool = (props: Props) => {
    const originalShapeRef = useRef<HTMLDivElement>(null);
    const [dragging, setDragging] = useState(false);
    const [draggingPosition, setDraggingPosition] = useState<Point | null>(null);
    const [draggedDiff, setDraggedDiff] = useState<Point | null>(null);
    const title = getBlockTypeTitle(props.blockType);

    return (
        <>
            <DragAndDrop.Draggable
                disabled={false}
                data={{
                    type: PlannerPayloadType.BLOCK_TYPE,
                    data: props.blockType,
                }}
                onDragStart={(evt) => {
                    setDragging(true);
                }}
                onDragEnd={(evt) => {
                    setDragging(false);
                    setDraggingPosition(null);
                    setDraggedDiff(null);
                }}
                onDrag={(evt) => {
                    setDraggingPosition({
                        x: evt.client.end.x,
                        y: evt.client.end.y,
                    });
                    setDraggedDiff(evt.diff);
                }}
                onDrop={(evt) => {}}
            >
                {(evt) => (
                    <Box
                        {...evt.componentProps}
                        sx={{
                            userSelect: 'none',
                            position: 'relative',
                            cursor: 'grab',
                            transition: 'all 0.2s ease-in-out',
                            width: '114px',
                            height: '145px',
                            boxSizing: 'border-box',
                            pt: 2,
                            pb: 2,
                            pl: 1,
                            pr: 1,
                            textAlign: 'center',
                            borderRadius: '6px',
                            border: '1px dashed rgba(0, 0, 0, 0.23)',
                            bgcolor: 'white.main',
                            '&:hover': {
                                borderStyle: 'solid',
                                borderColor: 'primary.main',
                                bgcolor: '#F5F5F5',
                                boxShadow: '0px 0px 10px 0px rgba(0, 0, 0, 0.20)',
                            },
                        }}
                    >
                        <Box
                            sx={{
                                position: 'absolute',
                                left: '50%',
                                marginLeft: '-17.5px',
                                top: '30px',
                                width: 34,
                                height: 34,
                                zIndex: 5,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: 'rgba(0, 0, 0, 0.30)',
                                borderRadius: '50%',
                            }}
                        >
                            <Add
                                sx={{
                                    width: 24,
                                    height: 24,
                                    alignSelf: 'center',
                                    color: 'white',
                                }}
                            />
                        </Box>
                        <BlockShape ref={originalShapeRef} blockType={props.blockType} dragging={false} />
                        <Typography fontSize={'12px'} fontWeight={700} lineHeight={'160%'}>
                            {title}
                        </Typography>
                    </Box>
                )}
            </DragAndDrop.Draggable>
            {dragging && draggingPosition && (
                <Portal>
                    <BlockShape
                        blockType={props.blockType}
                        startingPoint={originalShapeRef.current?.getBoundingClientRect()}
                        position={draggingPosition}
                        dragged={draggedDiff}
                        dragging={true}
                    />
                </Portal>
            )}
        </>
    );
};
