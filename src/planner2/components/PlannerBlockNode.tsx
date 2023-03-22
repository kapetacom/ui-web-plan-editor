import React, { useContext, useMemo } from 'react';
import { InstanceStatus } from '@kapeta/ui-web-context';

import { BlockNode } from '../../components/BlockNode';
import { PlannerNodeSize } from '../../types';
import { PlannerContext } from '../PlannerContext';
import { useBlockContext } from '../BlockContext';
import { PlannerBlockResourceList } from './PlannerBlockResourceList';
import { ResourceRole } from '@kapeta/ui-web-types';
import { BlockMode } from '../../wrappers/wrapperHelpers';
import { DragAndDrop } from '../utils/dndUtils';
import { LayoutNode } from '../LayoutContext';
import { PlannerPayload, ResourcePayload } from '../types';

interface Props {
    viewOnly?: boolean;
    size: PlannerNodeSize;
}

export const PlannerBlockNode: React.FC<Props> = ({ viewOnly, size }) => {
    const { plan, zoom } = useContext(PlannerContext);
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
                        onDrop={() => {
                            setBlockMode(BlockMode.HIDDEN);
                            // Edit block
                            // Create new consumer on block and save definition?

                            // Add connection to new consumer
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
                                    />
                                    <PlannerBlockResourceList
                                        role={ResourceRole.PROVIDES}
                                    />

                                    <BlockNode
                                        name={blockInstance.name}
                                        instanceName={blockInstance.name}
                                        onInstanceNameChange={(name) =>
                                            // eslint-disable-next-line no-console
                                            console.log(name)
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
                            </svg>
                        )}
                    </DragAndDrop.DropZone>
                </LayoutNode>
            )}
        </DragAndDrop.Draggable>
    );
};
