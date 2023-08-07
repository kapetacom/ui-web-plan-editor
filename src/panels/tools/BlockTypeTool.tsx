import React, {forwardRef, useRef, useState} from "react";

import {
    IBlockTypeProvider,
    Point,
} from "@kapeta/ui-web-types";
import {Box, Grow, Portal, Typography} from "@mui/material";
import {Add} from "@mui/icons-material";
import {BlockLayout} from "@kapeta/ui-web-components";
import {BlockNode} from "../../components/BlockNode";
import {parseKapetaUri} from "@kapeta/nodejs-utils";
import {DragAndDrop} from "../../planner/DragAndDrop";
import {Transition} from 'react-transition-group';
import {useDraggedRotation} from "../../planner/utils/dndUtils";
import {PlannerPayloadType} from "../../planner/types";

const getTitle = (blockType: IBlockTypeProvider) => {
    return blockType.title ??
        blockType.definition.metadata.title ??
        parseKapetaUri(blockType.definition.metadata.name).name;
}

interface ShapeProps {
    blockType: IBlockTypeProvider;
    startingPoint?: Point;
    dragging?: boolean;
    position?: Point|null;
    dragged?: Point|null;
}

const BlockShape = forwardRef((props: ShapeProps, parentRef) => {

    const ref = `${props.blockType.definition.metadata.name}:${props.blockType.version}`;
    const Shape = props.blockType?.shapeComponent || BlockNode;
    const title = getTitle(props.blockType);
    const shapeRef = useRef<HTMLDivElement>(null);

    const shapeWidth = props.blockType.shapeWidth ?? 200;
    const shapeHeight = props.blockType.getShapeHeight ? props.blockType.getShapeHeight(50) : 200;

    const fakeInstance = {
        id: 'temp-block',
        name: title,
        block: {
            ref,
        },
        dimensions: {height: 0, width: 0, top: 0, left: 0},
    };

    const fakeData = {
        kind: ref,
        metadata: {
            name: '',
        },
        spec: {
            target: {
                kind: ''
            },
            providers: [],
            consumers: [],
        }
    };

    const width = 64;
    const height = 64;

    const targetWidth = props.dragging ? shapeWidth : 64;
    const targetHeight = props.dragging ? shapeHeight : 64;

    let left: number | undefined = undefined,
        top: number | undefined = undefined;

    if (props.position) {
        left = props.position.x;
        top = props.position.y;
    }

    const duration = 100;

    const transitionStyles = {
        entering: {
            width: targetWidth,
            height: targetHeight,
            left: 0,
            top: 0,
            opacity: 1,
        },
        entered: {
            width: targetWidth,
            height: targetHeight,
            left: 0,
            top: 0,
            opacity: 1,
        },
        exiting: {
            width: 64,
            height: 64,
            left: 0,
            top: 0,
            opacity: 1,
        },
        exited: {
            width: 64,
            height: 64,
            left: 0,
            top: 0,
            opacity: 1,
        },
    };

    if (props.startingPoint && left && top) {
        const startingLeft = props.startingPoint.x + (width / 2);
        const startingTop = props.startingPoint.y + (height / 2);
        transitionStyles.exited.left = startingLeft - left;
        transitionStyles.exited.top = startingTop - top;
        transitionStyles.exiting.left = startingLeft - left;
        transitionStyles.exiting.top = startingTop - top;
    }

    let rotation = useDraggedRotation(props.dragged?.x);

    return (<Box
        ref={parentRef}
        style={{
            left,
            top,
        }}

        sx={{
            position: props.dragging ? 'fixed' : 'relative',
            transform: props.dragging ? 'translate(-50%, -50%)' : undefined,
            cursor: props.dragging ? 'grabbing' : 'grab',
            zIndex: props.dragging ? 50 : undefined,
            display: 'inline-block',
            '& > .shape-container': {
                transition: `all ${duration}ms ease-in-out`,
                pointerEvents: 'none',
                boxSizing: 'border-box',
                display: 'inline-block',
                textAlign: 'center',
                '& > svg.shape': {
                    transition: `all 100ms ease-in-out`,
                    text: {
                        transition: 'all 0.2s ease-in-out',
                        opacity: props.dragging ? 1 : 0,
                    },
                    path: {
                        transition: 'all 0.2s ease-in-out',
                        stroke: props.dragging ? undefined : 'rgba(0, 0, 0, 0.23)'
                    }
                },
            },
        }}>
        <Transition timeout={props.dragging ? duration : 0}
                    nodeRef={shapeRef}
                    appear={props.dragging}
                    mountOnEnter={props.dragging}
                    in={true}>
            {state => {
                return (
                    <div className={'shape-container'}
                         style={{
                             position: 'relative',
                             top: transitionStyles[state].top,
                             left: transitionStyles[state].left,
                             opacity: transitionStyles[state].opacity,
                         }}
                         ref={shapeRef}>
                        <svg
                            className={'shape'}
                            style={{
                                transform: `rotate(${rotation}deg)`
                            }}
                            width={transitionStyles[state].width}
                            height={transitionStyles[state].height}
                            viewBox={`0 0 ${shapeWidth} ${shapeHeight}`}>
                            <BlockLayout definition={fakeData} instance={fakeInstance}>
                                <Shape
                                    height={shapeHeight}
                                    width={shapeWidth}
                                    block={fakeData}
                                    instance={fakeInstance}/>
                            </BlockLayout>
                        </svg>
                    </div>
                )
            }}
        </Transition>
    </Box>);
})

interface Props {
    blockType: IBlockTypeProvider;
}

export const BlockTypeTool = (props: Props) => {

    const originalShapeRef = useRef<HTMLDivElement>(null);
    const [dragging, setDragging] = useState(false);
    const [draggingPosition, setDraggingPosition] = useState<Point | null>(null);
    const [draggedDiff, setDraggedDiff] = useState<Point | null>(null);
    const title = getTitle(props.blockType);

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
                        x: evt.zone.end.x,
                        y: evt.zone.end.y,
                    });
                    setDraggedDiff(evt.diff);
                }}
                onDrop={(evt) => {

                }}
            >
                {(evt) =>
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
                                boxShadow: '0px 0px 10px 0px rgba(0, 0, 0, 0.20)'
                            }
                        }}
                    >
                        <Box sx={{
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
                            borderRadius: '50%'
                        }}>
                            <Add sx={{
                                width: 24,
                                height: 24,
                                alignSelf: 'center',
                                color: 'white'
                            }}/>
                        </Box>
                        <BlockShape ref={originalShapeRef}
                                    blockType={props.blockType}
                                    dragging={false}/>
                        <Typography fontSize={'12px'}
                                    fontWeight={700}
                                    lineHeight={'160%'}>
                            {title}
                        </Typography>
                    </Box>
                }
            </DragAndDrop.Draggable>
            {dragging && draggingPosition && <Portal>
                <BlockShape blockType={props.blockType}
                            startingPoint={originalShapeRef.current?.getBoundingClientRect()}
                            position={draggingPosition}
                            dragged={draggedDiff}
                            dragging={true}/>
            </Portal>}
        </>
    );
};