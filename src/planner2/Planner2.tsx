import React, { ReactNode, useContext } from 'react';
import { PlannerActionConfig, PlannerContext } from './PlannerContext';
import { PlannerNodeSize } from '../types';
import { PlannerBlockNode } from './components/PlannerBlockNode';
import { BlockContextProvider } from './BlockContext';
import { DragAndDrop } from './utils/dndUtils';
import { PlannerCanvas } from './PlannerCanvas';
import { PlannerConnection } from './components/PlannerConnection';
import { getConnectionId } from './utils/connectionUtils';
import { DnDContext, DnDContextType } from './DragAndDrop/DnDContext';
import { PlannerPayload } from './types';

interface Props {
    // eslint-disable-next-line react/no-unused-prop-types
    systemId: string;

    // Should we instead augment the
    actions?: PlannerActionConfig;
}

const renderTempResources: (
    value: DnDContextType<PlannerPayload>
) => ReactNode = ({ draggable }) => {
    return draggable && draggable.type === 'resource' ? (
        <PlannerConnection
            size={PlannerNodeSize.MEDIUM}
            connection={{
                from: {
                    blockId: draggable.data.block.id,
                    resourceName: draggable.data.resource.metadata.name,
                },
                to: {
                    blockId: 'temp-block',
                    resourceName: 'temp-resource',
                },
            }}
        />
    ) : null;
};

export const Planner: React.FC<Props> = (props) => {
    const { size = PlannerNodeSize.MEDIUM, plan } = useContext(PlannerContext);

    return (
        <DragAndDrop.ContextProvider>
            {/* Canvas and sidebars should be in the same dnd context */}
            <PlannerCanvas>
                {plan?.spec.blocks?.map((block, index) => (
                    <BlockContextProvider key={block.id} blockId={block.id}>
                        <PlannerBlockNode
                            size={size}
                            actions={props.actions || {}}
                        />
                    </BlockContextProvider>
                ))}

                {plan?.spec.connections?.map((connection) => (
                    <PlannerConnection
                        size={size}
                        key={getConnectionId(connection)}
                        connection={connection}
                        actions={props.actions?.connection || []}
                    />
                ))}

                {/* Render temp connections to dragged resources */}
                <DnDContext.Consumer>{renderTempResources}</DnDContext.Consumer>
            </PlannerCanvas>
        </DragAndDrop.ContextProvider>
    );
};
