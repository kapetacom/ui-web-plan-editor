import { getConnectionId, isConnectionTo, useBlockMatrix } from '../utils/connectionUtils';
import { toClass } from '@kapeta/ui-web-utils';
import { PlannerConnection } from './PlannerConnection';
import { DnDContext, DnDContextType } from '../DragAndDrop/DnDContext';
import React, { ReactNode, useContext } from 'react';
import { ActionContext, PlannerPayload } from '../types';
import { PlannerNodeSize } from '../../types';
import { PlannerActionConfig, PlannerContext } from '../PlannerContext';
import { useFocusInfo } from '../utils/focusUtils';

const renderTempResources: (value: DnDContextType<PlannerPayload>) => ReactNode = ({ draggable }) => {
    return draggable && draggable.type === 'resource' ? (
        <PlannerConnection
            size={PlannerNodeSize.MEDIUM}
            connection={{
                provider: {
                    blockId: draggable.data.instance.id,
                    resourceName: draggable.data.resource.metadata.name,
                },
                consumer: {
                    blockId: 'temp-block',
                    resourceName: 'temp-resource',
                },
                port: draggable.data.resource.spec.port,
            }}
        />
    ) : null;
};

interface Props {
    focusInfo?: ReturnType<typeof useFocusInfo>;
    actions?: PlannerActionConfig;
    nodeSize: PlannerNodeSize;
    highlightedConnections: string[];
    onConnectionMouseEnter?: (context: ActionContext) => void;
    onConnectionMouseLeave?: (context: ActionContext) => void;
}

export const PlannerConnections = (props: Props) => {
    const planner = useContext(PlannerContext);
    const connections = planner.plan?.spec.connections ?? [];
    const connectionKeys: { [p: string]: boolean } = {};
    const blockMatrix = useBlockMatrix();

    return (
        <>
            {connections.map((connection, id) => {
                // Handle deleted connections that are still in the ordering list
                if (!connection) {
                    return null;
                }

                const key = getConnectionId(connection);
                if (connectionKeys[key]) {
                    // Prevent rendering duplicate connections
                    return null;
                }
                connectionKeys[key] = true;

                const highlighted = props.highlightedConnections.includes(key);

                // Hide connections that are not connected to the focused block
                const className = toClass({
                    'connection-hidden': Boolean(
                        props.focusInfo?.focus && !isConnectionTo(connection, props.focusInfo?.focus.instance.id)
                    ),
                    highlight: highlighted,
                });

                return (
                    <PlannerConnection
                        key={key}
                        blockMatrix={blockMatrix}
                        style={{ zIndex: highlighted ? -1 : -50 }}
                        size={props.nodeSize}
                        className={className}
                        connection={connection}
                        actions={props.actions?.connection || []}
                        onMouseOver={props.onConnectionMouseEnter}
                        onMouseLeave={props.onConnectionMouseLeave}
                    />
                );
            })}

            {/* Render temp connections to dragged resources */}
            <DnDContext.Consumer>{renderTempResources}</DnDContext.Consumer>
        </>
    );
};
