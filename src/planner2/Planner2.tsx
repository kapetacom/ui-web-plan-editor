import React, { ReactNode } from 'react';
import { Asset, BlockKind, PlanKind } from '@kapeta/ui-web-types';
import {
    PlannerActionConfig,
    PlannerContext,
    PlannerMode,
    usePlannerContext,
} from './PlannerContext';
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
    plan: PlanKind;
    blockAssets: Asset<BlockKind>[];
    // eslint-disable-next-line react/no-unused-prop-types
    systemId: string;
    mode?: PlannerMode;
    size?: PlannerNodeSize;

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
    const {
        size = PlannerNodeSize.MEDIUM,
        plan,
        blockAssets,
        mode = PlannerMode.VIEW,
        // Move to common actions obj?
        actions = {},
    } = props;
    const context = usePlannerContext({
        plan,
        blockAssets,
        mode,
        actions,
    });

    return (
        <PlannerContext.Provider value={context}>
            {/* Overflow ?? */}
            <DragAndDrop.ContextProvider>
                {/* Canvas and sidebars should be in the same dnd context */}
                <PlannerCanvas>
                    {context.plan?.spec.blocks?.map((block, index) => (
                        <BlockContextProvider key={block.id} blockId={block.id}>
                            <PlannerBlockNode size={size} actions={actions} />
                        </BlockContextProvider>
                    ))}

                    {context.plan?.spec.connections?.map((connection) => (
                        <PlannerConnection
                            size={size}
                            key={getConnectionId(connection)}
                            connection={connection}
                            actions={actions.connection}
                        />
                    ))}

                    {/* Render temp connections to dragged resources */}
                    <DnDContext.Consumer>
                        {renderTempResources}
                    </DnDContext.Consumer>
                </PlannerCanvas>
            </DragAndDrop.ContextProvider>
        </PlannerContext.Provider>
    );
};
