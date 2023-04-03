import React, { ReactNode, useContext, useMemo } from 'react';
import { PlannerActionConfig, PlannerContext } from './PlannerContext';
import { PlannerNodeSize } from '../types';
import { PlannerBlockNode } from './components/PlannerBlockNode';
import { BlockContextProvider } from './BlockContext';
import { DragAndDrop } from './utils/dndUtils';
import { PlannerCanvas } from './PlannerCanvas';
import { PlannerConnection } from './components/PlannerConnection';
import { getConnectionId, isConnectionTo } from './utils/connectionUtils';
import { DnDContext, DnDContextType } from './DragAndDrop/DnDContext';
import { BlockInfo, FocusBlockInfo, PlannerPayload } from './types';
import { toClass } from '@kapeta/ui-web-utils';
import { getFocusBlockInfo, isBlockInFocus, useFocusInfo } from './utils/focusUtils';
import { BlockInstanceSpec } from '@kapeta/ui-web-types';

interface Props {
    // eslint-disable-next-line react/no-unused-prop-types
    systemId: string;

    // Should we instead augment the
    actions?: PlannerActionConfig;
}

const renderTempResources: (value: DnDContextType<PlannerPayload>) => ReactNode = ({ draggable }) => {
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
    const { nodeSize = PlannerNodeSize.MEDIUM, plan } = useContext(PlannerContext);

    let instances = plan?.spec.blocks ?? [];
    let connections = plan?.spec.connections ?? [];

    const focusInfo = useFocusInfo();
    const focusModeEnabled = !!focusInfo;

    return (
        <DragAndDrop.ContextProvider>
            {/* Canvas and sidebars should be in the same dnd context */}
            <PlannerCanvas>
                {instances.map((instance, index) => {
                    const focusedBlock = focusInfo?.focus?.instance.id === instance.id;
                    const isInFocus = !!(focusInfo && isBlockInFocus(focusInfo, instance.id));
                    //Hide blocks that are not in focus or connected to the focused block
                    let className = toClass({
                        'planner-block': focusModeEnabled && !isInFocus,
                        'linked-block': focusModeEnabled && isInFocus && !focusedBlock,
                        'planner-focused-block': focusedBlock,
                    });

                    return (
                        <BlockContextProvider key={instance.id} blockId={instance.id}>
                            <PlannerBlockNode size={nodeSize} actions={props.actions || {}} className={className} />
                        </BlockContextProvider>
                    );
                })}

                {connections.map((connection) => {
                    //Hide connections that are not connected to the focused block
                    let className = toClass({
                        'connection-hidden': !!(
                            focusInfo?.focus && !isConnectionTo(connection, focusInfo?.focus.instance.id)
                        ),
                    });

                    return (
                        <PlannerConnection
                            size={nodeSize}
                            key={getConnectionId(connection)}
                            className={className}
                            connection={connection}
                            actions={props.actions?.connection || []}
                        />
                    );
                })}

                {/* Render temp connections to dragged resources */}
                <DnDContext.Consumer>{renderTempResources}</DnDContext.Consumer>
            </PlannerCanvas>
        </DragAndDrop.ContextProvider>
    );
};
