import React from 'react';
import { Asset, BlockKind, PlanKind } from '@kapeta/ui-web-types';
import { PlannerContextProvider, PlannerMode } from './PlannerContext';
import { PlannerNodeSize } from '../types';
import { PlannerBlockNode } from './components/PlannerBlockNode';
import { BlockContextProvider } from './BlockContext';
import { DragAndDrop } from './DragAndDrop';
import { Simulate } from 'react-dom/test-utils';
import drag = Simulate.drag;
import { PlannerCanvas } from './PlannerCanvas';
import { PlannerConnection } from './components/PlannerConnection';
import { getConnectionId } from './utils/connectionUtils';

interface Props {
    plan: PlanKind;
    blockAssets: Asset<BlockKind>[];
    // eslint-disable-next-line react/no-unused-prop-types
    systemId: string;
    mode?: PlannerMode;
    size?: PlannerNodeSize;
}

export const Planner: React.FC<Props> = (props) => {
    const { size = PlannerNodeSize.MEDIUM, plan, blockAssets } = props;

    return (
        <PlannerContextProvider
            plan={plan}
            blockAssets={blockAssets}
            mode={props.mode || PlannerMode.VIEW}
        >
            {/* Overflow ?? */}
            <DragAndDrop.ContextProvider>
                {/* Canvas and sidebars should be in the same dnd context */}
                <PlannerCanvas>
                    {props.plan.spec.blocks?.map((block, index) => (
                        <BlockContextProvider key={block.id} blockId={block.id}>
                            <PlannerBlockNode size={size} />
                        </BlockContextProvider>
                    ))}

                    {props.plan.spec.connections?.map((connection) => (
                        <PlannerConnection
                            size={size}
                            key={getConnectionId(connection)}
                            connection={connection}
                        />
                    ))}
                </PlannerCanvas>
            </DragAndDrop.ContextProvider>
        </PlannerContextProvider>
    );
};
