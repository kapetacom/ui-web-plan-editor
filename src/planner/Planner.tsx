import React, { ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { PlannerActionConfig, PlannerContext } from './PlannerContext';
import { PlannerNodeSize } from '../types';
import { PlannerBlockNode } from './components/PlannerBlockNode';
import { BlockContextProvider } from './BlockContext';
import { PlannerCanvas } from './PlannerCanvas';
import { PlannerConnection } from './components/PlannerConnection';
import { getConnectionId, isConnectionTo } from './utils/connectionUtils';
import { DnDContext, DnDContextType } from './DragAndDrop/DnDContext';
import { ActionContext, PlannerPayload } from './types';
import { toClass } from '@kapeta/ui-web-utils';
import { isBlockInFocus, useFocusInfo } from './utils/focusUtils';
import { ErrorBoundary } from 'react-error-boundary';

import './Planner.less';

interface Props {
    // eslint-disable-next-line react/no-unused-prop-types
    systemId: string;

    // Should we instead augment the
    actions?: PlannerActionConfig;
    configurations?: { [key: string]: any };

    onBlockMouseEnter?: (context: ActionContext) => void;
    onBlockMouseLeave?: (context: ActionContext) => void;
    onResourceMouseEnter?: (context: ActionContext) => void;
    onResourceMouseLeave?: (context: ActionContext) => void;
    onConnectionMouseEnter?: (context: ActionContext) => void;
    onConnectionMouseLeave?: (context: ActionContext) => void;
}

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

const emptyList = [];
export const Planner = (props: Props) => {
    const { nodeSize = PlannerNodeSize.MEDIUM, plan } = useContext(PlannerContext);

    const instances = plan?.spec.blocks ?? emptyList;
    const connections = plan?.spec.connections ?? emptyList;

    // Manage connection render order to ensure that connections are rendered on top when hovered
    const [connectionDisplayOrder, setDisplayOrder] = useState(Object.keys(connections));
    useEffect(() => {
        setDisplayOrder(Object.keys(connections));
    }, [connections]);

    const onConnectionMouseEnter = useCallback(
        (connectionId) =>
            (...args) => {
                // Put the hovered connection on top by rendering last
                setDisplayOrder((order) => order.filter((id) => id !== connectionId).concat([connectionId]));
                props.onConnectionMouseEnter?.call(null, ...args);
            },
        [props.onConnectionMouseEnter]
    );

    const focusInfo = useFocusInfo();
    const focusModeEnabled = !!focusInfo;

    const connectionKeys = {};

    return (
        <ErrorBoundary
            onError={(error, info) => {
                // eslint-disable-next-line no-console
                console.error('Error rendering plan', error, info, plan);
            }}
            fallback={<div>Failed to render plan. Please contact support.</div>}
            resetKeys={[props.systemId]}
        >
            <PlannerCanvas>
                {instances.map((instance, index) => {
                    const focusedBlock = focusInfo?.focus?.instance.id === instance.id;
                    const isInFocus = !!(focusInfo && isBlockInFocus(focusInfo, instance.id));
                    // Hide blocks that are not in focus or connected to the focused block
                    const className = toClass({
                        'planner-block': focusModeEnabled && !isInFocus,
                        'linked-block': focusModeEnabled && isInFocus && !focusedBlock,
                        'planner-focused-block': focusedBlock,
                    });

                    return (
                        <BlockContextProvider
                            key={instance.id}
                            blockId={instance.id}
                            configuration={props.configurations?.[instance.id]}
                        >
                            <PlannerBlockNode
                                size={nodeSize}
                                actions={props.actions || {}}
                                className={className}
                                onMouseEnter={props.onBlockMouseEnter}
                                onMouseLeave={props.onBlockMouseLeave}
                                onResourceMouseEnter={props.onResourceMouseEnter}
                                onResourceMouseLeave={props.onResourceMouseLeave}
                            />
                        </BlockContextProvider>
                    );
                })}

                {connectionDisplayOrder
                    .map((id) => [id, connections[id]])
                    .map(([id, connection]) => {
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

                        // Hide connections that are not connected to the focused block
                        const className = toClass({
                            'connection-hidden': !!(
                                focusInfo?.focus && !isConnectionTo(connection, focusInfo?.focus.instance.id)
                            ),
                        });

                        return (
                            <PlannerConnection
                                size={nodeSize}
                                key={key}
                                className={className}
                                connection={connection}
                                actions={props.actions?.connection || []}
                                onMouseEnter={onConnectionMouseEnter(id)}
                                onMouseLeave={props.onConnectionMouseLeave}
                            />
                        );
                    })}

                {/* Render temp connections to dragged resources */}
                <DnDContext.Consumer>{renderTempResources}</DnDContext.Consumer>
            </PlannerCanvas>
        </ErrorBoundary>
    );
};
