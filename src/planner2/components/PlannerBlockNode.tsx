import React, { useContext, useMemo } from 'react';
import _ from 'lodash';

import { BlockNode } from '../../components/BlockNode';
import { PlannerNodeSize } from '../../types';
import { PlannerActionConfig, PlannerContext } from '../PlannerContext';
import { useBlockContext } from '../BlockContext';
import { PlannerBlockResourceList } from './PlannerBlockResourceList';
import { Point, ResourceRole } from '@kapeta/ui-web-types';
import { BlockMode } from '../../wrappers/wrapperHelpers';
import { DragAndDrop } from '../utils/dndUtils';
import { LayoutNode } from '../LayoutContext';
import { ActionContext, BlockInfo, PlannerPayload, ResourcePayload, ResourceTypePayload } from '../types';
import { ActionButtons } from './ActionButtons';
import { getBlockPositionForFocus, isBlockInFocus, useFocusInfo } from '../utils/focusUtils';
import { toClass } from '@kapeta/ui-web-utils';
import { copyResourceToBlock } from '../utils/blockUtils';
import { createConnection } from '../utils/connectionUtils';
import { useBlockValidation } from '../hooks/block-validation';
import { BlockTypeProvider } from '@kapeta/ui-web-context';
import { BlockOutlet, blockRenderer } from '../renderers/blockRenderer';
import { SVGAutoSizeText } from '@kapeta/ui-web-components';
import { parseKapetaUri } from '@kapeta/nodejs-utils';

import './PlannerBlockNode.less';

interface Props {
    size: PlannerNodeSize;
    actions?: PlannerActionConfig;
    className?: string;
    onMouseEnter?: (context: ActionContext) => void;
    onMouseLeave?: (context: ActionContext) => void;
    onResourceMouseEnter?: (context: ActionContext) => void;
    onResourceMouseLeave?: (context: ActionContext) => void;
}

export const BlockOutletProvider = (props) => {
    const planner = useContext(PlannerContext);

    const outlets = useMemo(() => {
        return {
            [BlockOutlet.BlockStatus]: (ctx) =>
                ctx.status ? <circle className={`instance_${ctx.status}`} r={4} cx={10} cy={40} /> : <></>,
            [BlockOutlet.BlockInstanceName]: (ctx) => (
                <SVGAutoSizeText
                    className="block-body-text instance-name"
                    y={0}
                    x={0}
                    lineHeight={24}
                    maxHeight={36}
                    maxWidth={150}
                    maxChars={15}
                    maxLines={2}
                    onChange={
                        ctx.readOnly
                            ? undefined
                            : (name) =>
                                  planner.updateBlockInstance.call(null, ctx.instance.id, (bx) => {
                                      return {
                                          ...bx,
                                          name,
                                      };
                                  })
                    }
                    value={ctx.instance.name}
                />
            ),
            [BlockOutlet.BlockName]: (ctx) => {
                const kindUri = parseKapetaUri(ctx.block.kind);
                return (
                    <SVGAutoSizeText
                        className="block-body-text block-name"
                        y={0}
                        x={0}
                        lineHeight={12}
                        maxHeight={20}
                        maxChars={25}
                        maxLines={1}
                        maxWidth={150}
                        value={kindUri.name}
                    />
                );
            },
            [BlockOutlet.BlockHandle]: (ctx) => {
                const kindUri = parseKapetaUri(ctx.block.kind);
                return (
                    <SVGAutoSizeText
                        className="block-body-text block-handle"
                        y={0}
                        x={0}
                        lineHeight={12}
                        maxHeight={20}
                        maxChars={25}
                        maxLines={1}
                        maxWidth={150}
                        value={kindUri.handle}
                    />
                );
            },
            [BlockOutlet.BlockVersion]: (ctx) => {
                const kindUri = parseKapetaUri(ctx.instance.block.ref);
                return (
                    <SVGAutoSizeText
                        className="block-body-text block-version"
                        y={0}
                        x={0}
                        lineHeight={12}
                        maxHeight={20}
                        maxChars={25}
                        maxLines={1}
                        maxWidth={150}
                        value={kindUri.version}
                    />
                );
            },
        };
    }, [planner.updateBlockInstance]);

    return <blockRenderer.Provider outlets={outlets}>{props.children}</blockRenderer.Provider>;
};

export const PlannerBlockNode: React.FC<Props> = (props: Props) => {
    const planner = useContext(PlannerContext);
    const blockContext = useBlockContext();
    const blockType = BlockTypeProvider.get(blockContext.blockDefinition!.kind);

    if (!blockContext.blockInstance) {
        throw new Error('PlannerBlockNode requires a BlockDefinition context');
    }

    if (!planner.plan) {
        throw new Error('PlannerBlockNode requires a Plan context');
    }

    const focusInfo = useFocusInfo();

    const data: PlannerPayload = useMemo(
        () => ({ type: 'block', data: blockContext.blockInstance }),
        [blockContext.blockInstance]
    );

    const errors = useBlockValidation(blockContext);

    const isValid = errors.length === 0;

    let className = toClass({
        'planner-block-node-container': true,
        'hovered-block': blockContext.blockMode === BlockMode.HIGHLIGHT,
    });
    if (props.className) {
        className += ` ${props.className}`;
    }

    const canMove = !blockContext.isBlockInstanceReadOnly && !focusInfo;
    let canEditInstance = !blockContext.isBlockInstanceReadOnly;

    if (
        focusInfo &&
        focusInfo.focus.instance.id !== blockContext.blockInstance.id &&
        isBlockInFocus(focusInfo, blockContext.blockInstance.id)
    ) {
        canEditInstance = false;
    }

    const blockClassNames = toClass({
        'planner-block-node': true,
        highlight: blockContext.blockMode === BlockMode.HIGHLIGHT,
    });
    const actionContext = {
        block: blockContext.blockDefinition,
        blockInstance: blockContext.blockInstance,
    };

    return (
        // TODO: Readonly/ viewonly
        <DragAndDrop.Draggable
            disabled={!canMove}
            data={data}
            onDragStart={() => blockContext.setBlockMode(BlockMode.SHOW)}
            onDrop={(position) => {
                blockContext.setBlockMode(BlockMode.HIDDEN);
            }}
        >
            {(evt) => {
                let point: Point = {
                    x: blockContext.blockInstance.dimensions!.left + evt.zone.diff.x / planner.zoom,
                    y: blockContext.blockInstance.dimensions!.top + evt.zone.diff.y / planner.zoom,
                };

                if (focusInfo) {
                    const blockInfo: BlockInfo = {
                        instance: blockContext.blockInstance,
                        block: blockContext.blockDefinition!,
                    };
                    const focusPoint = getBlockPositionForFocus(blockInfo, focusInfo, planner.zoom, planner.canvasSize);
                    if (focusPoint) {
                        point = focusPoint;
                    }
                }

                const NodeComponent = blockType.shapeComponent || BlockNode;

                return (
                    // Effective layout includes drag status
                    <LayoutNode x={point.x} y={point.y} key={blockContext.blockInstance.id}>
                        <DragAndDrop.DropZone
                            data={{ type: 'block', data: blockContext.blockInstance }}
                            accept={(draggable: PlannerPayload) => {
                                if (blockContext.isBlockDefinitionReadOnly) {
                                    return false;
                                }

                                if (draggable.type === 'resource-type') {
                                    // New resource being added
                                    return true;
                                }

                                return (
                                    draggable.type === 'resource' &&
                                    // don't connect to self
                                    draggable.data.block.id !== blockContext.blockInstance.id
                                );
                            }}
                            onDrop={(draggable: ResourcePayload | ResourceTypePayload) => {
                                if (blockContext.isBlockDefinitionReadOnly) {
                                    return;
                                }

                                blockContext.setBlockMode(BlockMode.HIDDEN);

                                if (draggable.type === 'resource-type') {
                                    const config = draggable.data.config;

                                    const port = config.definition.spec.ports[0];

                                    const ref = `${config.kind}:${config.version}`;
                                    // default the name to resource type name w/o special chars, e.g.
                                    // resource-type-mongodb => mongodb
                                    const name = config.kind
                                        .split('/')[1]
                                        .toLowerCase()
                                        .replace('resource-type', '')
                                        .replace(/[^a-z]/g, '');
                                    planner.addResource(
                                        blockContext.blockReference?.id,
                                        {
                                            kind: ref,
                                            metadata: {
                                                name,
                                            },
                                            spec: {
                                                port,
                                            },
                                        },
                                        config.role
                                    );
                                    return;
                                }

                                const newResource = copyResourceToBlock(blockContext.blockDefinition!, {
                                    block: draggable.data.block,
                                    resource: draggable.data.resource,
                                });

                                if (!newResource) {
                                    return;
                                }

                                // Create new consumer on block and save definition
                                const newBlock = _.cloneDeep(blockContext.blockDefinition!);
                                newBlock.spec.consumers = newBlock.spec.consumers || [];
                                newBlock.spec.consumers.push(newResource);

                                planner.updateBlockDefinition(blockContext.blockInstance.block.ref, newBlock);

                                const newConnection = createConnection(draggable.data, {
                                    block: newBlock,
                                    instance: blockContext.blockInstance,
                                    resource: newResource,
                                });

                                // Add connection to new consumer
                                planner.addConnection(newConnection);
                            }}
                            onDragEnter={(draggable: ResourcePayload | ResourceTypePayload) => {
                                if (blockContext.isBlockDefinitionReadOnly) {
                                    return;
                                }
                                const role =
                                    draggable.type === 'resource-type'
                                        ? draggable.data.config.role
                                        : draggable.data.role;
                                if (role === ResourceRole.CONSUMES) {
                                    blockContext.setBlockMode(BlockMode.HOVER_DROP_CONSUMER);
                                } else {
                                    blockContext.setBlockMode(BlockMode.HOVER_DROP_PROVIDER);
                                }
                            }}
                            onDragLeave={() => {
                                if (blockContext.isBlockDefinitionReadOnly) {
                                    return;
                                }
                                blockContext.setBlockMode(BlockMode.HIDDEN);
                            }}
                        >
                            {({ onRef }) => (
                                <svg
                                    className={`${className} ${evt.isDragging ? 'dragging' : ''}`}
                                    onDoubleClick={() => planner.setFocusedBlock(blockContext.blockInstance)}
                                    onMouseEnter={() => {
                                        if (props.onMouseEnter) {
                                            props.onMouseEnter(actionContext);
                                        }
                                    }}
                                    onMouseLeave={() => {
                                        if (props.onMouseLeave) {
                                            props.onMouseLeave(actionContext);
                                        }
                                    }}
                                    style={{
                                        left: `${point.x}px`,
                                        top: `${point.y}px`,
                                    }}
                                    x={blockContext.blockInstance.dimensions!.left}
                                    y={blockContext.blockInstance.dimensions!.top}
                                >
                                    <g
                                        data-node-id={blockContext.blockInstance.id}
                                        data-node-type="block"
                                        className={blockClassNames}
                                    >
                                        <PlannerBlockResourceList
                                            role={ResourceRole.CONSUMES}
                                            actions={props.actions?.resource || []}
                                            onResourceMouseEnter={props.onResourceMouseEnter}
                                            onResourceMouseLeave={props.onResourceMouseLeave}
                                        />
                                        <PlannerBlockResourceList
                                            role={ResourceRole.PROVIDES}
                                            actions={props.actions?.resource || []}
                                            onResourceMouseEnter={props.onResourceMouseEnter}
                                            onResourceMouseLeave={props.onResourceMouseLeave}
                                        />

                                        <g {...evt.componentProps} ref={onRef}>
                                            {/* Something something dimensions? */}
                                            <BlockOutletProvider>
                                                <NodeComponent
                                                    block={blockContext.blockDefinition!}
                                                    instance={blockContext.blockInstance}
                                                    readOnly={!canEditInstance}
                                                    status={blockContext.instanceStatus}
                                                    width={blockContext.blockInstance.dimensions!.width}
                                                    height={blockContext.instanceBlockHeight}
                                                    valid={isValid}
                                                />
                                            </BlockOutletProvider>
                                            {/* name={blockContext.blockInstance.name}
                                                instanceName={blockContext.blockInstance.name}
                                                onInstanceNameChange={
                                                readOnly={!canEditInstance}
                                                height={blockContext.instanceBlockHeight}
                                                width={blockContext.blockInstance.dimensions!.width}
                                                typeName={blockContext.blockDefinition?.metadata.name}
                                                version={blockContext.blockReference.version}
                                                valid={isValid}
                                            /> */}
                                        </g>
                                    </g>
                                    <g>
                                        {/* TODO: Render block actions w/ the wheel/staggered transitions */}
                                        <ActionButtons
                                            x={75}
                                            y={blockContext.instanceBlockHeight + 25}
                                            show
                                            actions={props.actions?.block || []}
                                            actionContext={actionContext}
                                        />
                                    </g>
                                </svg>
                            )}
                        </DragAndDrop.DropZone>
                    </LayoutNode>
                );
            }}
        </DragAndDrop.Draggable>
    );
};
