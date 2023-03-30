import React, {useContext, useMemo} from 'react';
import {
    BlockTypeProvider,
    InstanceStatus,
    ResourceTypeProvider,
} from '@kapeta/ui-web-context';
import _ from 'lodash';

import {BlockNode} from '../../components/BlockNode';
import {PlannerNodeSize} from '../../types';
import {PlannerActionConfig, PlannerContext} from '../PlannerContext';
import {useBlockContext} from '../BlockContext';
import {PlannerBlockResourceList} from './PlannerBlockResourceList';
import {Point, ResourceRole} from '@kapeta/ui-web-types';
import {BlockMode} from '../../wrappers/wrapperHelpers';
import {DragAndDrop} from '../utils/dndUtils';
import {LayoutNode} from '../LayoutContext';
import {BlockInfo, PlannerPayload, ResourcePayload} from '../types';
import {ActionButtons} from './ActionButtons';
import {toClass} from "@kapeta/ui-web-utils";
import {getBlockPositionForFocus, isBlockInFocus, useFocusInfo} from "../utils/focusUtils";

interface Props {
    viewOnly?: boolean;
    size: PlannerNodeSize;
    actions: PlannerActionConfig;
    className?: string;
}

export const PlannerBlockNode: React.FC<Props> = (props:Props) => {
    const planner = useContext(PlannerContext);
    const blockContext = useBlockContext();

    if (!blockContext.blockInstance) {
        throw new Error('PlannerBlockNode requires a Block context');
    }

    if (!planner.plan) {
        throw new Error('PlannerBlockNode requires a Plan context');
    }

    const focusInfo = useFocusInfo();

    const data: PlannerPayload = useMemo(
        () => ({type: 'block', data: blockContext.blockInstance}),
        [blockContext.blockInstance]
    );
    let errors = [] as string[];
    try {
        errors =
            BlockTypeProvider.get(blockContext.blockDefinition?.kind)?.validate?.(
                blockContext.blockDefinition
            ) || [];
    } catch (e: any) {
        errors = [e.message];
    }
    const isValid = errors.length === 0;

    let className = 'planner-block-node-container';
    if (props.className) {
        className += ' ' + props.className;
    }

    const canMove = (!props.viewOnly && !focusInfo);
    let canEditName = !props.viewOnly;

    if (focusInfo &&
        focusInfo.focus.instance.id !== blockContext.blockInstance.id &&
        isBlockInFocus(focusInfo, blockContext.blockInstance.id)) {
        canEditName = false;
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
            {({position, componentProps, isDragging}) => {


                let point:Point = {
                    x: blockContext.blockInstance.dimensions!.left + position.x / planner.zoom,
                    y: blockContext.blockInstance.dimensions!.top + position.y / planner.zoom
                };

                if (focusInfo) {
                    const blockInfo:BlockInfo = {
                        instance: blockContext.blockInstance,
                        block: blockContext.blockDefinition
                    };
                    const focusPoint = getBlockPositionForFocus(blockInfo, focusInfo, planner.zoom, planner.canvasSize);
                    if (focusPoint) {
                        point = focusPoint;
                    }
                }
                return (
                    // Effective layout includes drag status
                    <LayoutNode
                        x={point.x}
                        y={point.y}
                        key={blockContext.blockInstance.id}
                    >
                        <DragAndDrop.DropZone
                            accept={(draggable: PlannerPayload) => {
                                return (
                                    draggable.type === 'resource' &&
                                    // don't connect to self
                                    draggable.data.block.id !== blockContext.blockInstance.id &&
                                    // can create new clients if the block is editable
                                    !blockContext.isReadOnly
                                );
                            }}
                            onDrop={(draggable: ResourcePayload) => {
                                blockContext.setBlockMode(BlockMode.HIDDEN);

                                // Figure out what kind of consumer to create, and add a connection to it.
                                const resourceConfigs = ResourceTypeProvider.list();
                                const target = resourceConfigs.find(
                                    (rc) =>
                                        rc.converters?.[0]?.fromKind ===
                                        draggable.data.resource.kind
                                );
                                const targetKind =
                                    target?.kind || draggable.data.resource.kind;
                                if (!resourceConfigs) {
                                    return;
                                }

                                // Create new consumer on block and save definition?
                                const newBlock = _.cloneDeep(blockContext.blockDefinition);
                                newBlock.spec.consumers =
                                    newBlock.spec.consumers || [];
                                newBlock.spec.consumers.push({
                                    kind: targetKind,
                                    metadata: {
                                        name: 'new-resource',
                                    },
                                    spec: {},
                                });

                                planner.updateBlockDefinition(
                                    blockContext.blockInstance.block.ref,
                                    newBlock
                                );

                                // Add connection to new consumer
                                planner.addConnection({
                                    from: {
                                        blockId: draggable.data.block.id,
                                        resourceName:
                                        draggable.data.resource.metadata.name,
                                    },
                                    to: {
                                        blockId: blockContext.blockInstance.id,
                                        resourceName: 'new-resource',
                                    },
                                });
                            }}
                            onDragEnter={(draggable: ResourcePayload) => {
                                if (draggable.data.role === ResourceRole.CONSUMES) {
                                    blockContext.setBlockMode(BlockMode.HOVER_DROP_CONSUMER);
                                } else if (
                                    draggable.data.role === ResourceRole.PROVIDES
                                ) {
                                    blockContext.setBlockMode(BlockMode.HOVER_DROP_PROVIDER);
                                }
                            }}
                            onDragLeave={() => {
                                blockContext.setBlockMode(BlockMode.HIDDEN);
                            }}
                        >
                            {({onRef}) => (
                                <svg
                                    className={`${className} ${isDragging ? 'dragging' : ''}`}
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
                                        className="planner-block-node"
                                    >
                                        <PlannerBlockResourceList
                                            role={ResourceRole.CONSUMES}
                                            actions={props.actions.resource || []}
                                        />
                                        <PlannerBlockResourceList
                                            role={ResourceRole.PROVIDES}
                                            actions={props.actions.resource || []}
                                        />

                                        <BlockNode
                                            name={blockContext.blockInstance.name}
                                            instanceName={blockContext.blockInstance.name}
                                            onInstanceNameChange={(name) =>
                                                planner.updateBlockInstance(
                                                    blockContext.blockInstance.id,
                                                    (bx) => {
                                                        return {
                                                            ...bx,
                                                            name,
                                                        };
                                                    }
                                                )
                                            }
                                            readOnly={!canEditName}
                                            // TODO: Move this to block context
                                            status={InstanceStatus.STOPPED}
                                            height={blockContext.instanceBlockHeight}
                                            width={blockContext.blockInstance.dimensions!.width}
                                            typeName={
                                                blockContext.blockDefinition?.metadata.name
                                            }
                                            version={blockContext.blockReference.version}
                                            valid={isValid}
                                            blockRef={onRef}
                                            {...componentProps}
                                        />
                                    </g>
                                    <g>
                                        {/* TODO: Render block actions w/ the wheel/staggered transitions */}
                                        <ActionButtons
                                            x={75}
                                            y={blockContext.instanceBlockHeight + 10}
                                            show
                                            actions={props.actions.block || []}
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
                )
            }}
        </DragAndDrop.Draggable>
    );
};
