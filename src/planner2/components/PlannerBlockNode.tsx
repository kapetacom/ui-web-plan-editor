import React, { useContext, useMemo } from 'react';
import { InstanceStatus } from '@blockware/ui-web-context';

import { BlockNode } from '../../components/BlockNode';
import { PlannerNodeSize } from '../../types';
import { PlannerContext } from '../PlannerContext';
import { useBlockContext } from '../BlockContext';
import { PlannerBlockResourceList } from './PlannerBlockResourceList';
import { ResourceRole } from '@blockware/ui-web-types';
import { BlockMode } from '../../wrappers/wrapperHelpers';
import { DragAndDrop } from '../DragAndDrop';

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
                <svg
                    className="planner-block-node-container"
                    style={{
                        left: `${
                            blockInstance.dimensions!.left + position.x / zoom
                        }px`,
                        top: `${
                            blockInstance.dimensions!.top + position.y / zoom
                        }px`,
                    }}
                    x={blockInstance.dimensions!.left}
                    y={blockInstance.dimensions!.top}
                    key={blockInstance.id}
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
                            // eslint-disable-next-line no-console
                            onInstanceNameChange={(name) => console.log(name)}
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
            )}
        </DragAndDrop.Draggable>
    );
};
