import React, { useCallback, useMemo } from 'react';
import { ZoomPanContainer } from '../../src/planner/ZoomAndPan/ZoomPanContainer';
import { calculateCombinedBoundingBox } from '../ZoomPan/ZoomPanContainer.stories';
import { ZoomTransform } from 'd3-zoom';
import { Box, FormControlLabel, FormGroup, Switch } from '@mui/material';
import { Block, BlockConnection } from './One';
import { DraggableBlock } from './DraggableBlock';

const initialBlocks = [
    { id: '1', x: 50, y: 50, width: 150, height: 100 },
    { id: '2', x: 241, y: 178, width: 150, height: 100 },
    { id: '3', x: 1038, y: 137, width: 150, height: 100 },
    { id: '4', x: 717, y: 584, width: 150, height: 100 },
    { id: '5', x: 519, y: 480, width: 150, height: 100 },
    { id: '6', x: 83, y: 555, width: 150, height: 100 },
    { id: '7', x: 438, y: 276, width: 150, height: 100 },
    { id: '8', x: 222, y: 976, width: 150, height: 100 },
    { id: '9', x: 80, y: 820, width: 150, height: 100 },
    { id: '10', x: 474, y: 1013, width: 150, height: 100 },
    { id: '11', x: 798, y: 789, width: 150, height: 100 },
    { id: '12', x: 1051, y: 943, width: 150, height: 100 },
];

export const Default = () => {
    const [blocks, setBlocks] = React.useState<Block[]>(initialBlocks);
    const firstBlock = blocks[0];
    const lastBlock = blocks[blocks.length - 1];
    const connection = useMemo(() => ({ source: firstBlock, target: lastBlock }), [firstBlock, lastBlock]);

    const [transform, setTransform] = React.useState<ZoomTransform>(new ZoomTransform(1, 0, 0));
    const zoom = transform.k;

    const onZoomPanTick = useCallback((x: number, y: number, k: number) => {
        setTransform(new ZoomTransform(k, x, y));
    }, []);

    const updateBlockPosition = useCallback((id: string, x: number, y: number) => {
        setBlocks((prev) => {
            return prev.map((block) => {
                if (block.id === id) {
                    return { ...block, x: x, y: y };
                }
                return block;
            });
        });
    }, []);

    const childrenBBox = useMemo(() => calculateCombinedBoundingBox(blocks), [blocks]);

    // Debug toggles
    const [debug, setDebug] = React.useState({
        showBlockObstacles: true,
        showPathDots: true,
        showPathLines: true,
    });

    return (
        <Box
            sx={{
                width: '100vw',
                height: '100vh',
                overflow: 'hidden',
            }}
        >
            <ZoomPanContainer
                sx={{
                    width: '100%',
                    height: '100%',
                    background: '#f5f1ee',
                    overflow: 'hidden',
                }}
                childrenBBox={childrenBBox}
                showPixelGrid
                onZoomPanTick={onZoomPanTick}
            >
                <BlockConnection connection={connection} obstacles={blocks} debug={debug} />

                {blocks.map((block) => (
                    <DraggableBlock
                        //
                        key={block.id}
                        id={block.id}
                        x={block.x}
                        y={block.y}
                        zoom={zoom}
                        onDragEnd={updateBlockPosition}
                    >
                        Block {block.id}
                    </DraggableBlock>
                ))}
            </ZoomPanContainer>
            <FormGroup
                sx={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    zIndex: 100,
                    padding: 1,
                    background: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: 1,
                }}
            >
                <FormControlLabel
                    control={
                        <Switch
                            defaultChecked
                            onChange={(event) =>
                                setDebug((prev) => {
                                    return { ...prev, showBlockObstacles: event.target.checked };
                                })
                            }
                        />
                    }
                    label="Show block obstacles"
                />
                <FormControlLabel
                    control={
                        <Switch
                            defaultChecked
                            onChange={(event) =>
                                setDebug((prev) => {
                                    return { ...prev, showPathDots: event.target.checked };
                                })
                            }
                        />
                    }
                    label="Show path dots"
                />
                <FormControlLabel
                    control={
                        <Switch
                            defaultChecked
                            onChange={(event) =>
                                setDebug((prev) => {
                                    return { ...prev, showPathLines: event.target.checked };
                                })
                            }
                        />
                    }
                    label="Show path lines"
                />
            </FormGroup>
        </Box>
    );
};

export default {
    title: 'Experiments/One',
    component: BlockConnection,
};
