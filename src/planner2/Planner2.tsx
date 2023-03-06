import React from 'react';
import { Asset, BlockKind, PlanKind } from '@blockware/ui-web-types';
import { PlannerContextProvider, PlannerMode } from './PlannerContext';
import { PlannerNodeSize } from '../types';
import { PlannerBlockNode } from './components/PlannerBlockNode';
import { BlockContextProvider } from './BlockContext';
import { DragAndDrop } from './DragAndDrop';
import { Simulate } from 'react-dom/test-utils';
import drag = Simulate.drag;
import { PlannerCanvas } from './PlannerCanvas';

interface Props {
    plan: PlanKind;
    blockAssets: Asset<BlockKind>[];
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
                </PlannerCanvas>
            </DragAndDrop.ContextProvider>
        </PlannerContextProvider>
    );
};
