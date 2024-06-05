/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React, { useContext, useMemo } from 'react';
import _ from 'lodash';

import { BlockNode } from '../../components/BlockNode';
import { PlannerNodeSize } from '../../types';
import { PlannerActionConfig, PlannerContext } from '../PlannerContext';
import { useBlockContext } from '../BlockContext';
import { PlannerBlockResourceList } from './PlannerBlockResourceList';
import { Point, ResourceRole } from '@kapeta/ui-web-types';
import { BlockMode, PlannerMode } from '../../utils/enums';
import { DragAndDrop } from '../utils/dndUtils';
import { LayoutNode } from '../LayoutContext';
import { ActionContext, BlockInfo, PlannerPayload, PlannerPayloadType } from '../types';
import { ActionButtons } from './ActionButtons';
import { getBlockPositionForFocus, isBlockInFocus, useFocusInfo } from '../utils/focusUtils';
import { toClass } from '@kapeta/ui-web-utils';
import { copyResourceToBlock } from '../utils/blockUtils';
import { createConnection, ResourceCluster } from '../utils/connectionUtils';
import { useBlockValidation } from '../hooks/block-validation';
import { BlockTargetProvider, BlockTypeProvider, ResourceTypeProvider } from '@kapeta/ui-web-context';
import { BlockLayout, useBlock } from '@kapeta/ui-web-components';

import './PlannerBlockNode.less';
import { withErrorBoundary } from 'react-error-boundary';
import { Resource } from '@kapeta/schemas';
import { KapetaURI, parseKapetaUri } from '@kapeta/nodejs-utils';
import { Box } from '@mui/material';
import { useAtomValue } from 'jotai';

export function adjustBlockEdges(point: Point) {
    if (point.x < 220) {
        point.x = 220;
    }

    if (point.y < 5) {
        point.y = 5;
    }

    return point;
}

function canConvertToAny(sourceKind: string, targetKinds: string[]) {
    if (!ResourceTypeProvider.exists(sourceKind)) {
        return false;
    }

    const sourceProvider = ResourceTypeProvider.get(sourceKind);

    if (!sourceProvider || !sourceProvider.consumableKind) {
        return false;
    }

    const consumableUri = parseKapetaUri(sourceProvider.consumableKind);

    return targetKinds.some((targetKind) => {
        return consumableUri.fullName === targetKind;
    });
}

interface Props {
    size: PlannerNodeSize;
    actions?: PlannerActionConfig;
    className?: string;
    style?: React.CSSProperties;
    onMouseEnter?: (context: ActionContext) => void;
    onMouseLeave?: (context: ActionContext) => void;
    onResourceMouseEnter?: (context: ActionContext) => void;
    onResourceMouseLeave?: (context: ActionContext) => void;
    resourceClusters?: ResourceCluster[];
    portalResourceIds?: string[];
}

const PlannerBlockNodeBase: React.FC<Props> = (props: Props) => {
    const planner = useContext(PlannerContext);
    const blockContext = useBlockContext();
    const blockType = blockContext.blockDefinition?.kind
        ? BlockTypeProvider.get(blockContext.blockDefinition?.kind)
        : null;
    const [isHovered, setIsHovered] = React.useState(false);

    if (!blockContext.blockInstance) {
        throw new Error('PlannerBlockNode requires a BlockDefinition context');
    }

    if (!planner.plan) {
        throw new Error('PlannerBlockNode requires a Plan context');
    }

    const focusInfo = useFocusInfo();
    const isPrimaryFocus = focusInfo?.focus.instance.id === blockContext.blockInstance.id;

    const languageTargetProvider = useMemo(() => {
        if (!blockContext.blockDefinition?.spec.target?.kind) {
            return null;
        }

        try {
            return BlockTargetProvider.get(
                blockContext.blockDefinition.spec.target.kind,
                blockContext.blockDefinition.kind
            );
        } catch (err) {
            console.error('Failed to get target provider', err);
            return null;
        }
    }, [blockContext.blockDefinition?.spec.target?.kind]);

    const data: PlannerPayload = useMemo(
        () => ({ type: PlannerPayloadType.BLOCK, data: blockContext.blockInstance }),
        [blockContext.blockInstance]
    );

    const errors = useBlockValidation(
        blockContext,
        planner.mode === PlannerMode.VIEW // Do not validate configuration in view mode
    );

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

    function canDropResource(draggable: PlannerPayload) {
        if (!blockType) {
            return true;
        }

        let resourceKindUri: KapetaURI | undefined = undefined;
        if (draggable.type === PlannerPayloadType.RESOURCE_TYPE) {
            resourceKindUri = parseKapetaUri(draggable.data.kind);
        } else if (draggable.type === PlannerPayloadType.RESOURCE) {
            resourceKindUri = parseKapetaUri(draggable.data.resource.kind);
        }

        if (!resourceKindUri) {
            return false;
        }

        const isResource = draggable.type === PlannerPayloadType.RESOURCE;

        if (
            blockType &&
            blockType.resourceKinds &&
            !blockType.resourceKinds.includes(resourceKindUri.fullName) &&
            !(isResource && canConvertToAny(resourceKindUri.fullName, blockType.resourceKinds))
        ) {
            return false;
        }

        if (
            languageTargetProvider &&
            languageTargetProvider.resourceKinds &&
            !languageTargetProvider.resourceKinds.includes(resourceKindUri.fullName) &&
            !(isResource && canConvertToAny(resourceKindUri.fullName, languageTargetProvider.resourceKinds))
        ) {
            return false;
        }

        return true;
    }

    // Highlight the block if it is hovered in the chat UI
    const { hoveredChatUIAtom } = useContext(PlannerContext);
    const hovered = useAtomValue(hoveredChatUIAtom);
    const block = useBlock();
    let highlight = false;
    if (
        (hovered?.type === 'block' || hovered?.type === 'type') &&
        hovered?.blockRef === block.instance?.block.ref &&
        hovered?.instanceId === block.instance?.id
    ) {
        highlight = true;
    }

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
                let point: Point = adjustBlockEdges({
                    x: blockContext.blockInstance.dimensions!.left + evt.zone.diff.x / planner.zoom,
                    y: blockContext.blockInstance.dimensions!.top + evt.zone.diff.y / planner.zoom,
                });

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

                const NodeComponent = blockType?.shapeComponent || BlockNode;

                const onWarningClick = () => {
                    const warningAction = props.actions?.block?.find((a) => a.warningInspector);

                    if (warningAction && warningAction.enabled(planner, actionContext)) {
                        warningAction.onClick(planner, actionContext);
                    }
                };

                return (
                    // Effective layout includes drag status
                    <LayoutNode x={point.x} y={point.y} key={blockContext.blockInstance.id}>
                        <svg
                            className={`${className} ${evt.isDragging ? 'dragging' : ''}`}
                            // TODO: Disabled for now, focus mode is kind of broken
                            // onDoubleClick={() => planner.setFocusedBlock(blockContext.blockInstance)}
                            onMouseEnter={() => {
                                setIsHovered(true);
                                if (props.onMouseEnter) {
                                    props.onMouseEnter(actionContext);
                                }
                            }}
                            onMouseLeave={() => {
                                setIsHovered(false);
                                if (props.onMouseLeave) {
                                    props.onMouseLeave(actionContext);
                                }
                            }}
                            style={{
                                ...props.style,
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
                                {/* TODO: fix offsets based on block size */}
                                <PlannerBlockResourceList
                                    nodeSize={planner.nodeSize}
                                    role={ResourceRole.CONSUMES}
                                    actions={props.actions?.resource || []}
                                    onResourceMouseEnter={props.onResourceMouseEnter}
                                    onResourceMouseLeave={props.onResourceMouseLeave}
                                    portalResourceIds={props.portalResourceIds}
                                    resourceClusters={props.resourceClusters?.filter(
                                        (c) => c.role === ResourceRole.CONSUMES
                                    )}
                                />
                                <PlannerBlockResourceList
                                    nodeSize={planner.nodeSize}
                                    role={ResourceRole.PROVIDES}
                                    actions={props.actions?.resource || []}
                                    onResourceMouseEnter={props.onResourceMouseEnter}
                                    onResourceMouseLeave={props.onResourceMouseLeave}
                                    portalResourceIds={props.portalResourceIds}
                                    resourceClusters={props.resourceClusters?.filter(
                                        (c) => c.role === ResourceRole.PROVIDES
                                    )}
                                />

                                <DragAndDrop.DropZone
                                    data={{ type: PlannerPayloadType.BLOCK, data: blockContext.blockInstance }}
                                    accept={(draggable: PlannerPayload) => {
                                        if (blockContext.isBlockDefinitionReadOnly) {
                                            return false;
                                        }

                                        if (!canDropResource(draggable)) {
                                            return false;
                                        }

                                        if (draggable.type === 'resource-type') {
                                            // New resource being added
                                            return true;
                                        }

                                        return (
                                            draggable.type === 'resource' &&
                                            // don't connect to self
                                            draggable.data.instance.id !== blockContext.blockInstance.id
                                        );
                                    }}
                                    onDrop={(draggable) => {
                                        if (
                                            blockContext.isBlockDefinitionReadOnly ||
                                            (draggable.type !== PlannerPayloadType.RESOURCE_TYPE &&
                                                draggable.type !== PlannerPayloadType.RESOURCE)
                                        ) {
                                            return;
                                        }

                                        if (!canDropResource(draggable)) {
                                            return;
                                        }

                                        blockContext.setBlockMode(BlockMode.HIDDEN);

                                        if (draggable.type === 'resource-type') {
                                            const config = draggable.data.config;

                                            const port = config.definition.spec.ports[0];

                                            const ref = `${config.kind}:${config.version}`;

                                            const existingResources =
                                                config.role === ResourceRole.CONSUMES
                                                    ? blockContext.consumers
                                                    : blockContext.providers;
                                            // default the name to resource type name w/o special chars, e.g.
                                            // resource-type-mongodb => mongodb
                                            const baseName = config.kind
                                                .split('/')[1]
                                                .toLowerCase()
                                                .replace('resource-type', '')
                                                .replace(/[^a-z]/g, '');

                                            let resourceName = baseName;
                                            let counter = 1;
                                            const filter = (r: Resource) => r.metadata.name === resourceName;
                                            while (existingResources.some(filter)) {
                                                resourceName = `${baseName}_${counter}`;
                                                counter++;
                                            }

                                            planner.addResource(
                                                blockContext.blockReference?.id,
                                                {
                                                    kind: ref,
                                                    metadata: {
                                                        name: resourceName,
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
                                    onDragEnter={(draggable) => {
                                        if (
                                            blockContext.isBlockDefinitionReadOnly ||
                                            (draggable.type !== PlannerPayloadType.RESOURCE_TYPE &&
                                                draggable.type !== PlannerPayloadType.RESOURCE)
                                        ) {
                                            return;
                                        }

                                        if (!canDropResource(draggable)) {
                                            return;
                                        }

                                        const role =
                                            draggable.type === PlannerPayloadType.RESOURCE_TYPE
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
                                        <Box
                                            component="g"
                                            {...evt.componentProps}
                                            ref={onRef}
                                            sx={
                                                highlight
                                                    ? {
                                                          '&& .block-node > .block-border': {
                                                              stroke: '#651FFF',
                                                              strokeWidth: 3,
                                                              strokeOpacity: 1,
                                                          },
                                                      }
                                                    : {}
                                            }
                                        >
                                            {blockContext.blockDefinition ? (
                                                <BlockLayout
                                                    definition={blockContext.blockDefinition}
                                                    instance={blockContext.blockInstance}
                                                    readOnly={!canEditInstance}
                                                    status={blockContext.instanceStatus}
                                                    onInstanceNameChange={(name) => {
                                                        planner.updateBlockInstance(
                                                            blockContext.blockInstance.id,
                                                            (block) => ({
                                                                ...block,
                                                                name,
                                                            })
                                                        );
                                                    }}
                                                >
                                                    <NodeComponent
                                                        block={blockContext.blockDefinition}
                                                        instance={blockContext.blockInstance}
                                                        readOnly={!canEditInstance}
                                                        width={blockContext.instanceBlockWidth}
                                                        height={blockContext.instanceBlockHeight}
                                                        valid={isValid}
                                                        errors={errors}
                                                        onWarningClick={onWarningClick}
                                                    />
                                                </BlockLayout>
                                            ) : (
                                                <foreignObject
                                                    width={blockContext.instanceBlockWidth}
                                                    height={blockContext.instanceBlockHeight}
                                                    style={{ textAlign: 'center' }}
                                                >
                                                    <BlockNode
                                                        height={blockContext.instanceBlockHeight}
                                                        width={blockContext.instanceBlockWidth}
                                                        readOnly={!canEditInstance}
                                                        errors={errors}
                                                        valid={isValid}
                                                        onWarningClick={onWarningClick}
                                                    />
                                                    <p>Failed to load</p>
                                                    <pre>{blockContext.blockInstance.name}</pre>
                                                    <code>{blockContext.blockInstance.block.ref}</code>
                                                </foreignObject>
                                            )}
                                        </Box>
                                    )}
                                </DragAndDrop.DropZone>
                            </g>
                            <g>
                                {/* TODO: Render block actions w/ the wheel/staggered transitions */}
                                <ActionButtons
                                    x={blockContext.instanceBlockWidth / 2}
                                    y={blockContext.instanceBlockHeight + 25}
                                    show={isHovered || isPrimaryFocus}
                                    actions={props.actions?.block || []}
                                    actionContext={actionContext}
                                />
                            </g>
                        </svg>
                    </LayoutNode>
                );
            }}
        </DragAndDrop.Draggable>
    );
};

export const PlannerBlockNode = withErrorBoundary(PlannerBlockNodeBase, {
    fallbackRender: ({ error }) => {
        const body = <div>Error: {error.message}</div>;
        try {
            const blockContext = useBlockContext();
            return (
                <foreignObject
                    x={blockContext.blockInstance.dimensions!.left}
                    y={blockContext.blockInstance.dimensions!.top}
                >
                    {body}
                </foreignObject>
            );
        } catch (err) {
            return body;
        }
    },
    onError(error, info) {
        console.error('Error rendering block', error, info);
    },
});
