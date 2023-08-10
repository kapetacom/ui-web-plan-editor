import {IBlockTypeProvider, Point, ResourceRole} from "@kapeta/ui-web-types";
import {parseKapetaUri} from "@kapeta/nodejs-utils";
import {BlockDefinition} from "@kapeta/schemas";
import React, {forwardRef, useRef} from "react";
import {BlockNode} from "./BlockNode";
import {useDraggedRotation} from "../planner/utils/dndUtils";
import {Box} from "@mui/material";
import {Transition} from "react-transition-group";
import {BlockLayout} from "@kapeta/ui-web-components";
import {PlannerBlockResourceList} from "../planner/components/PlannerBlockResourceList";
import {PlannerNodeSize} from "../types";
import {BlockContext, calculateBlockHeights} from "../planner/BlockContext";
import {BlockMode} from "../utils/enums";
import {InstanceStatus} from "@kapeta/ui-web-context";

export const getBlockTypeTitle = (blockType: IBlockTypeProvider) => {
    return (
        blockType.title ??
        blockType.definition.metadata.title ??
        parseKapetaUri(blockType.definition.metadata.name).name
    );
};

interface ShapeProps {
    blockType: IBlockTypeProvider;
    block?: BlockDefinition;
    startingPoint?: Point;
    dragging?: boolean;
    position?: Point | null;
    dragged?: Point | null;
    width?: number;
    height?: number;
    showText?: boolean;
    showResources?: boolean;
}

export const BlockShape = forwardRef((props: ShapeProps, parentRef) => {
    const ref = `${props.blockType.definition.metadata.name}:${props.blockType.version}`;
    const Shape = props.blockType?.shapeComponent || BlockNode;
    let title = getBlockTypeTitle(props.blockType);
    const shapeRef = useRef<HTMLDivElement>(null);
    const shapeWidth = props.blockType.shapeWidth ?? 150;

    const fakeData = props.block ?? {
        kind: ref,
        metadata: {
            name: '',
        },
        spec: {
            target: {
                kind: '',
            },
            providers: [],
            consumers: [],
        },
    };

    if (fakeData.metadata.title) {
        title = fakeData.metadata.title;
    } else if (fakeData.metadata.name) {
        title = parseKapetaUri(fakeData.metadata.name).name
    }

    const fakeInstance = {
        id: 'temp-block',
        name: title,
        block: {
            ref,
        },
        dimensions: { height: 0, width: 0, top: 0, left: 0 },
    };

    const {
        instanceBlockHeight,
        instanceResourceHeight,
    } = calculateBlockHeights({
        nodeSize: PlannerNodeSize.MEDIUM,
        blockType: props.blockType,
        blockDefinition: props.block,
        blockMode: BlockMode.SHOW_RESOURCES,
    });


    const width = props.width ?? 64;
    const height = props.height ?? 64;

    const targetWidth = props.dragging ? shapeWidth : width;
    const targetHeight = props.dragging ? instanceBlockHeight : height;

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
            width: width,
            height: height,
            left: 0,
            top: 0,
            opacity: 1,
        },
        exited: {
            width: width,
            height: height,
            left: 0,
            top: 0,
            opacity: 1,
        },
    };

    if (props.startingPoint && left && top) {
        const startingLeft = props.startingPoint.x + width / 2;
        const startingTop = props.startingPoint.y + height / 2;
        transitionStyles.exited.left = startingLeft - left;
        transitionStyles.exited.top = startingTop - top;
        transitionStyles.exiting.left = startingLeft - left;
        transitionStyles.exiting.top = startingTop - top;
    }

    let rotation = useDraggedRotation(props.dragged?.x);

    let viewBox = `0 0 ${shapeWidth} ${instanceBlockHeight}`;
    if (props.showResources) {
        viewBox = `0 0 ${shapeWidth + 300} ${instanceBlockHeight}`;
    }

    return (
        <Box
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
                            opacity: (props.showText || props.dragging) ? 1 : 0,
                        },
                        path: {
                            transition: 'all 0.2s ease-in-out',
                            stroke: (props.showText || props.dragging) ? undefined : 'rgba(0, 0, 0, 0.23)',
                        },
                        svg: {
                            overflow: 'visible'
                        }
                    },
                },
            }}
        >
            <Transition
                timeout={props.dragging ? duration : 0}
                nodeRef={shapeRef}
                appear={props.dragging}
                mountOnEnter={props.dragging}
                in={true}
            >
                {(state) => {
                    return (
                        <div
                            className={'shape-container'}
                            style={{
                                position: 'relative',
                                top: transitionStyles[state].top,
                                left: transitionStyles[state].left,
                                opacity: transitionStyles[state].opacity,
                            }}
                            ref={shapeRef}
                        >
                            <BlockContext.Provider value={{
                                blockDefinition: fakeData,
                                blockInstance: fakeInstance,
                                blockMode: BlockMode.SHOW,
                                providers: fakeData.spec.providers || [],
                                consumers: fakeData.spec.consumers || [],
                                instanceStatus: InstanceStatus.STOPPED,
                                isBlockDefinitionReadOnly: true,
                                isBlockInstanceReadOnly: true,
                                setBlockMode: () => {},
                                blockReference: parseKapetaUri(ref),
                                instanceBlockWidth: shapeWidth,
                                instanceBlockHeight,
                                instanceResourceHeight,
                            }}>
                                <svg
                                    className={'shape'}
                                    style={{
                                        transform: `rotate(${rotation}deg)`,
                                    }}
                                    width={transitionStyles[state].width}
                                    height={transitionStyles[state].height}
                                    viewBox={viewBox}
                                >
                                    <svg y={0} x={props.showResources ? 150 : 0} overflow={'visible'}>

                                        {props.showResources &&
                                            <PlannerBlockResourceList
                                                nodeSize={PlannerNodeSize.MEDIUM}
                                                role={ResourceRole.PROVIDES}
                                                actions={[]}
                                            />}

                                        {props.showResources &&
                                            <PlannerBlockResourceList
                                                nodeSize={PlannerNodeSize.MEDIUM}
                                                role={ResourceRole.CONSUMES}
                                                actions={[]}
                                            />}

                                        <BlockLayout definition={fakeData} instance={fakeInstance}>
                                            <Shape
                                                height={instanceBlockHeight}
                                                width={shapeWidth}
                                                block={fakeData}
                                                instance={fakeInstance}
                                            />
                                        </BlockLayout>
                                    </svg>
                                </svg>
                            </BlockContext.Provider>
                        </div>
                    );
                }}
            </Transition>
        </Box>
    );
});