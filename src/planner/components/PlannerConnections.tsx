/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { ConnectionExtension, getConnectionId, isConnectionTo, useBlockMatrix } from '../utils/connectionUtils';
import { toClass } from '@kapeta/ui-web-utils';
import { PlannerConnection } from './PlannerConnection';
import { DnDContext, DnDContextType } from '../DragAndDrop/DnDContext';
import React, { ReactNode, useContext, useMemo } from 'react';
import { ActionContext, PlannerPayload } from '../types';
import { PlannerNodeSize } from '../../types';
import { PlannerActionConfig, PlannerContext } from '../PlannerContext';
import { useFocusInfo } from '../utils/focusUtils';
import { getResourceId } from '../utils/planUtils';
import { ResourceRole } from '@kapeta/ui-web-types';

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
    connections: ConnectionExtension[];
    onConnectionMouseEnter?: (context: ActionContext) => void;
    onConnectionMouseLeave?: (context: ActionContext) => void;
}

export const PlannerConnections = (props: Props) => {
    const connectionKeys: { [p: string]: boolean } = {};
    const providerSeen: { [p: string]: boolean } = {};
    const blockMatrix = useBlockMatrix();
    const planner = useContext(PlannerContext);

    const connections = useMemo(() => {
        const out = [...props.connections];
        out.sort((a, b) => {
            const aId = getResourceId(a.provider.blockId, a.provider.resourceName, ResourceRole.PROVIDES);
            const aPoint = planner.connectionPoints.getPointById(aId);

            const bId = getResourceId(b.provider.blockId, b.provider.resourceName, ResourceRole.PROVIDES);
            const bPoint = planner.connectionPoints.getPointById(bId);
            if (!aPoint && !bPoint) {
                return 0;
            }

            if (aPoint && !bPoint) {
                return -1;
            }

            if (!aPoint && bPoint) {
                return 1;
            }

            if (!aPoint || !bPoint) {
                return 0;
            }

            return aPoint.y - bPoint.y;
        });
        return out;
    }, [props.connections, planner.connectionPoints]);

    const connectionClusters: { [key: string]: string[] } = useMemo(() => {
        const out: { [key: string]: string[] } = {};
        const clusters: { [key: string]: string[] } = {};
        connections.forEach((connection) => {
            if (!connection.consumerClusterId || !connection.providerClusterId) {
                return;
            }

            const connectionId = connection.id!;

            const clusterId = `${connection.consumerClusterId}|${connection.providerClusterId}`;

            if (!clusters[clusterId]) {
                clusters[clusterId] = [];
            }
            clusters[clusterId].push(connectionId);
            out[connectionId] = clusters[clusterId];
        });
        return out;
    }, [connections]);

    return (
        <>
            {props.connections.map((connection) => {
                // Handle deleted connections that are still in the ordering list
                if (!connection) {
                    return null;
                }

                const connectionId = getConnectionId(connection);
                if (connectionKeys[connectionId]) {
                    // Prevent rendering duplicate connections
                    return null;
                }
                connectionKeys[connectionId] = true;

                const providerId = getResourceId(
                    connection.provider.blockId,
                    connection.provider.resourceName,
                    ResourceRole.PROVIDES
                );
                let firstForProvider = false;
                if (!providerSeen[providerId]) {
                    providerSeen[providerId] = true;
                    firstForProvider = true;
                }

                const highlighted = props.highlightedConnections.includes(connectionId);

                let clusterIndex = 0;
                let clusterSize = 0;
                if (connectionClusters[connectionId]) {
                    clusterIndex = connectionClusters[connectionId].indexOf(connectionId);
                    clusterSize = connectionClusters[connectionId].length;
                }

                // Hide connections that are not connected to the focused block
                const className = toClass({
                    'connection-hidden': Boolean(
                        props.focusInfo?.focus && !isConnectionTo(connection, props.focusInfo?.focus.instance.id)
                    ),
                    highlight: highlighted,
                });

                return (
                    <PlannerConnection
                        key={connectionId}
                        blockMatrix={blockMatrix}
                        firstForProvider={firstForProvider}
                        clusterIndex={clusterIndex}
                        clusterSize={clusterSize}
                        style={{ zIndex: highlighted ? -1 : firstForProvider ? -40 : -50 }}
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
