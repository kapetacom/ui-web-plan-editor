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
import { BlockInfo, PlannerPayload, ResourcePayload, ResourceTypePayload } from '../types';
import { ActionButtons } from './ActionButtons';
import { getBlockPositionForFocus, isBlockInFocus, useFocusInfo } from '../utils/focusUtils';
import { toClass } from '@kapeta/ui-web-utils';
import { BlockValidator } from '../validation/BlockValidator';
import { copyResourceToBlock } from '../utils/blockUtils';
import { createConnection } from '../utils/connectionUtils';

interface Props {
    size: PlannerNodeSize;
    actions?: PlannerActionConfig;
    className?: string;
}

export const PlannerBlockNode: React.FC<Props> = (props: Props) => {
    const planner = useContext(PlannerContext);
    const blockContext = useBlockContext();

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

    const errors = useMemo(() => {
        if (!blockContext.blockDefinition || !blockContext.blockInstance) {
            return [];
        }
        const validator = new BlockValidator(blockContext.blockDefinition, blockContext.blockInstance);
        return validator.validate();
    }, [blockContext.blockDefinition, blockContext.blockInstance]);

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
                return (
                    // Effective layout includes drag status
                    <LayoutNode x={point.x} y={point.y} key={blockContext.blockInstance.id}>
                        <DragAndDrop.DropZone
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
                                    planner.addResource(
                                        blockContext.blockReference?.id,
                                        {
                                            kind: ref,
                                            metadata: {
                                                name: 'new-resource',
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
                                        />
                                        <PlannerBlockResourceList
                                            role={ResourceRole.PROVIDES}
                                            actions={props.actions?.resource || []}
                                        />

                                        <BlockNode
                                            name={blockContext.blockInstance.name}
                                            instanceName={blockContext.blockInstance.name}
                                            onInstanceNameChange={(name) =>
                                                planner.updateBlockInstance(blockContext.blockInstance.id, (bx) => {
                                                    return {
                                                        ...bx,
                                                        name,
                                                    };
                                                })
                                            }
                                            readOnly={!canEditInstance}
                                            status={blockContext.instanceStatus}
                                            height={blockContext.instanceBlockHeight}
                                            width={blockContext.blockInstance.dimensions!.width}
                                            typeName={blockContext.blockDefinition?.metadata.name}
                                            version={blockContext.blockReference.version}
                                            valid={isValid}
                                            blockRef={onRef}
                                            {...evt.componentProps}
                                        />
                                    </g>
                                    <g>
                                        {/* TODO: Render block actions w/ the wheel/staggered transitions */}
                                        <ActionButtons
                                            x={75}
                                            y={blockContext.instanceBlockHeight + 10}
                                            show
                                            actions={props.actions?.block || []}
                                            actionContext={{
                                                block: blockContext.blockDefinition,
                                                blockInstance: blockContext.blockInstance,
                                            }}
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
