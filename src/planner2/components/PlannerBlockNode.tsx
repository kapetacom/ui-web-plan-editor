import React, { useContext, useMemo } from 'react';
import { InstanceStatus, ResourceTypeProvider } from '@kapeta/ui-web-context';
import _ from 'lodash';

import { BlockNode } from '../../components/BlockNode';
import { PlannerNodeSize } from '../../types';
import { PlannerActionConfig, PlannerContext } from '../PlannerContext';
import { useBlockContext } from '../BlockContext';
import { PlannerBlockResourceList } from './PlannerBlockResourceList';
import { ResourceRole } from '@kapeta/ui-web-types';
import { BlockMode } from '../../wrappers/wrapperHelpers';
import { DragAndDrop } from '../utils/dndUtils';
import { LayoutNode } from '../LayoutContext';
import { PlannerPayload, ResourcePayload } from '../types';
import { ActionButtons } from './ActionButtons';

interface Props {
    viewOnly?: boolean;
    size: PlannerNodeSize;
    actions: PlannerActionConfig;
}

export const PlannerBlockNode: React.FC<Props> = ({
    viewOnly,
    size,
    actions,
}) => {
    const {
        plan,
        zoom,
        updateBlockDefinition,
        addConnection,
        updateBlockInstance,
    } = useContext(PlannerContext);
    const {
        blockInstance,
        instanceBlockHeight,
        blockDefinition,
        blockReference,
        setBlockMode,
        isReadOnly,
    } = useBlockContext();

    if (!blockInstance) {
        throw new Error('PlannerBlockNode requires a Block context');
    }

    if (!plan) {
        throw new Error('PlannerBlockNode requires a Plan context');
    }

    const data: PlannerPayload = useMemo(
        () => ({ type: 'block', data: blockInstance }),
        [blockInstance]
    );

    return (
        // TODO: Readonly/ viewonly
        <DragAndDrop.Draggable
            data={data}
            onDragStart={() => setBlockMode(BlockMode.SHOW)}
            onDrop={(position) => {
                setBlockMode(BlockMode.HIDDEN);
            }}
        >
            {({ position, componentProps }) => (
                // Effective layout includes drag status
                <LayoutNode
                    x={blockInstance.dimensions!.left + position.x / zoom}
                    y={blockInstance.dimensions!.top + position.y / zoom}
                    key={blockInstance.id}
                >
                    <DragAndDrop.DropZone
                        accept={(draggable: PlannerPayload) => {
                            return (
                                draggable.type === 'resource' &&
                                // don't connect to self
                                draggable.data.block.id !== blockInstance.id &&
                                // can create new clients if the block is editable
                                !isReadOnly
                            );
                        }}
                        onDrop={(draggable: ResourcePayload) => {
                            setBlockMode(BlockMode.HIDDEN);

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
                            const newBlock = _.cloneDeep(blockDefinition);
                            newBlock.spec.consumers =
                                newBlock.spec.consumers || [];
                            newBlock.spec.consumers.push({
                                kind: targetKind,
                                metadata: {
                                    name: 'new-resource',
                                },
                                spec: {},
                            });

                            updateBlockDefinition(
                                blockInstance.block.ref,
                                newBlock
                            );

                            // Add connection to new consumer
                            addConnection({
                                from: {
                                    blockId: draggable.data.block.id,
                                    resourceName:
                                        draggable.data.resource.metadata.name,
                                },
                                to: {
                                    blockId: blockInstance.id,
                                    resourceName: 'new-resource',
                                },
                            });
                        }}
                        onDragEnter={(draggable: ResourcePayload) => {
                            if (draggable.data.role === ResourceRole.CONSUMES) {
                                setBlockMode(BlockMode.HOVER_DROP_CONSUMER);
                            } else if (
                                draggable.data.role === ResourceRole.PROVIDES
                            ) {
                                setBlockMode(BlockMode.HOVER_DROP_PROVIDER);
                            }
                        }}
                        onDragLeave={() => {
                            setBlockMode(BlockMode.HIDDEN);
                        }}
                    >
                        {({ onRef }) => (
                            <svg
                                className="planner-block-node-container"
                                style={{
                                    left: `${
                                        blockInstance.dimensions!.left +
                                        position.x / zoom
                                    }px`,
                                    top: `${
                                        blockInstance.dimensions!.top +
                                        position.y / zoom
                                    }px`,
                                }}
                                x={blockInstance.dimensions!.left}
                                y={blockInstance.dimensions!.top}
                            >
                                <g
                                    data-node-id={blockInstance.id}
                                    data-node-type="block"
                                    className="planner-block-node"
                                >
                                    <PlannerBlockResourceList
                                        role={ResourceRole.CONSUMES}
                                        actions={actions.resource || []}
                                    />
                                    <PlannerBlockResourceList
                                        role={ResourceRole.PROVIDES}
                                        actions={actions.resource || []}
                                    />

                                    <BlockNode
                                        name={blockInstance.name}
                                        instanceName={blockInstance.name}
                                        onInstanceNameChange={(name) =>
                                            updateBlockInstance(
                                                blockInstance.id,
                                                (bx) => {
                                                    return {
                                                        ...bx,
                                                        name,
                                                    };
                                                }
                                            )
                                        }
                                        readOnly={viewOnly}
                                        // TODO: Move this to block context
                                        status={InstanceStatus.STOPPED}
                                        height={instanceBlockHeight}
                                        width={blockInstance.dimensions!.width}
                                        typeName={
                                            blockDefinition?.metadata.name
                                        }
                                        version={blockReference.version}
                                        valid
                                        blockRef={onRef}
                                        {...componentProps}
                                    />
                                </g>
                                <g>
                                    {/* TODO: Render block actions w/ the wheel/staggered transitions */}
                                    <ActionButtons
                                        x={75}
                                        y={instanceBlockHeight + 10}
                                        show
                                        actions={actions.block || []}
                                        actionContext={{
                                            block: blockDefinition,
                                            blockInstance: blockInstance,
                                        }}
                                    />
                                </g>
                            </svg>
                        )}
                    </DragAndDrop.DropZone>
                </LayoutNode>
            )}
        </DragAndDrop.Draggable>
    );
};
