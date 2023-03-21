import React, { useContext, useMemo } from 'react';
import { InstanceStatus } from '@kapeta/ui-web-context';

import { BlockNode } from '../../components/BlockNode';
import { PlannerNodeSize } from '../../types';
import { PlannerContext } from '../PlannerContext';
import { useBlockContext } from '../BlockContext';
import { PlannerBlockResourceList } from './PlannerBlockResourceList';
import { ResourceRole } from '@kapeta/ui-web-types';
import { BlockMode } from '../../wrappers/wrapperHelpers';
import { DragAndDrop } from '../DragAndDrop';
import { LayoutNode } from '../LayoutContext';

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
    } = useBlockContext();

    if (!blockInstance) {
        throw new Error('PlannerBlockNode requires a Block context');
    }

    if (!plan) {
        throw new Error('PlannerBlockNode requires a Plan context');
    }

    const data = useMemo(() => ({ id: blockInstance.id }), [blockInstance.id]);
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
                                typeName={blockDefinition?.metadata.name}
                                version={blockReference.version}
                                valid
                                {...componentProps}
                            />
                        </g>
                    </svg>
                </LayoutNode>
            )}
        </DragAndDrop.Draggable>
    );
};
