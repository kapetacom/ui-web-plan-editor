/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React, { ReactNode, useCallback, useContext, useMemo, useState } from 'react';
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
import { BlockDefinition, BlockInstance, Connection } from '@kapeta/schemas';
import { MissingReference, ReferenceValidationError } from './validation/PlanReferenceValidation';
import { Alert } from '@mui/material';
import './Planner.less';
import { ResourceRole } from '@kapeta/ui-web-types';
import { ResourceMode } from '../utils/enums';

type RenderResult = React.ReactElement<unknown, string | React.FunctionComponent | typeof React.Component> | null;

interface Props {
    // eslint-disable-next-line react/no-unused-prop-types
    systemId: string;
    zoomToFit?: { width: number; height: number };
    // Should we instead augment the
    actions?: PlannerActionConfig;
    configurations?: { [key: string]: any };

    onBlockMouseEnter?: (context: ActionContext) => void;
    onBlockMouseLeave?: (context: ActionContext) => void;
    onResourceMouseEnter?: (context: ActionContext) => void;
    onResourceMouseLeave?: (context: ActionContext) => void;
    onConnectionMouseEnter?: (context: ActionContext) => void;
    onConnectionMouseLeave?: (context: ActionContext) => void;

    onCreateBlock?: (block: BlockDefinition, instance: BlockInstance) => void;
    renderMissingReferences?: (missingReferences: MissingReference[]) => RenderResult;
    renderError?: (error: Error) => RenderResult;
    onError?: (error: Error) => void;
    onErrorResolved?: () => void;
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

export const Planner = (props: Props) => {
    const { isDragging } = useContext(DnDContext);
    const planner = useContext(PlannerContext);
    const nodeSize = planner.nodeSize ?? PlannerNodeSize.MEDIUM;

    const instances = planner.plan?.spec.blocks ?? [];
    const connections = planner.plan?.spec.connections ?? [];

    // Manage connection render order to ensure that connections are rendered on top when hovered
    const [highlightedConnections, setHighlightedConnections] = useState<string[]>([]);
    const [topBlock, setTopBlockState] = useState<string | null>(null);
    const [currentActionContext, setCurrentActionContext] = useState<ActionContext | null>(null);
    // Only allow setting the top block when not dragging - to avoid flickering
    const setTopBlock = useCallback(
        (blockId: string | null) => {
            if (!isDragging) {
                setTopBlockState(blockId);
            }
        },
        [isDragging]
    );

    const setResourcesViewMode = useCallback(
        function (connection: Connection, sourceRole?: ResourceRole, mode?: ResourceMode) {
            if (!sourceRole || !mode || sourceRole === ResourceRole.PROVIDES) {
                // If the source is a provider, we want to set the view mode for the consumer
                planner.assetState.setViewModeForResource(
                    connection.consumer.blockId,
                    connection.consumer.resourceName,
                    ResourceRole.CONSUMES,
                    mode
                );
            }

            if (!sourceRole || !mode || sourceRole === ResourceRole.CONSUMES) {
                planner.assetState.setViewModeForResource(
                    connection.provider.blockId,
                    connection.provider.resourceName,
                    ResourceRole.PROVIDES,
                    mode
                );
            }
        },
        [planner.assetState.setViewModeForResource]
    );

    const setConnectionViewMode = useCallback(
        function (connection: Connection, mode?: ResourceMode) {
            if (mode === ResourceMode.SHOW) {
                setHighlightedConnections([getConnectionId(connection)]);
            } else {
                setHighlightedConnections([]);
            }
        },
        [setHighlightedConnections]
    );

    const setConnectionsViewMode = useCallback(
        function (context: ActionContext, mode?: ResourceMode) {
            if (!context.resourceRole || !context.resource || !context.blockInstance) {
                return;
            }

            const { resourceRole, resource, blockInstance } = context;

            const activeConnections = connections.filter((conn) => {
                if (resourceRole === ResourceRole.PROVIDES) {
                    return (
                        conn.provider.blockId === blockInstance.id &&
                        conn.provider.resourceName === resource.metadata.name
                    );
                }

                return (
                    conn.consumer.blockId === blockInstance.id && conn.consumer.resourceName === resource.metadata.name
                );
            });

            const connectionIds = activeConnections.map((connection) => {
                setResourcesViewMode(connection, resourceRole, mode);
                return getConnectionId(connection);
            });

            if (mode === ResourceMode.SHOW) {
                setHighlightedConnections(connectionIds);
            } else {
                setHighlightedConnections([]);
            }
        },
        [connections, setHighlightedConnections]
    );

    const onEnter = useCallback(
        (cb: any) => (context: ActionContext) => {
            if (context.blockInstance) {
                setTopBlock(context.blockInstance.id);
            }

            setCurrentActionContext(context);
            if (context.connection) {
                setConnectionViewMode(context.connection, ResourceMode.SHOW);
            } else if (context.resource) {
                setConnectionsViewMode(context, ResourceMode.SHOW);
            }

            if (cb) {
                cb(context);
            }
        },
        [setTopBlock, setCurrentActionContext, setConnectionViewMode, setConnectionsViewMode]
    );

    const onLeave = useCallback(
        (cb: any) => (context: ActionContext) => {
            if (context.blockInstance?.id === topBlock) {
                setTopBlock(null);
            }

            if (currentActionContext) {
                if (
                    context.connection &&
                    currentActionContext.connection &&
                    getConnectionId(context.connection) === getConnectionId(currentActionContext.connection)
                ) {
                    setCurrentActionContext(null);
                    setConnectionViewMode(context.connection);
                }

                const sameBlockInstance =
                    context.blockInstance &&
                    currentActionContext.blockInstance &&
                    context.blockInstance.id === currentActionContext.blockInstance.id;

                const sameResource =
                    context.resource &&
                    currentActionContext.resource &&
                    context.resourceRole === currentActionContext.resourceRole &&
                    context.resource.kind === currentActionContext.resource.kind &&
                    context.resource.metadata.name === currentActionContext.resource.metadata.name;

                if (sameBlockInstance && sameResource) {
                    setConnectionsViewMode(context);
                    setCurrentActionContext(null);
                }

                if (sameBlockInstance) {
                    setCurrentActionContext(null);
                }
            }

            if (cb) {
                cb(context);
            }
        },
        [
            topBlock,
            setTopBlock,
            currentActionContext,
            setCurrentActionContext,
            setConnectionsViewMode,
            setConnectionViewMode,
        ]
    );

    const callbacks = useMemo(
        () => ({
            onBlockMouseEnter: onEnter(props.onBlockMouseEnter),
            onBlockMouseLeave: onLeave(props.onBlockMouseLeave),
            onResourceMouseEnter: onEnter(props.onResourceMouseEnter),
            onResourceMouseLeave: onLeave(props.onResourceMouseLeave),
            onConnectionMouseEnter: onEnter(props.onConnectionMouseEnter),
            onConnectionMouseLeave: onLeave(props.onConnectionMouseLeave),
        }),
        [
            onEnter,
            onLeave,
            props.onBlockMouseEnter,
            props.onBlockMouseLeave,
            props.onResourceMouseEnter,
            props.onResourceMouseLeave,
            props.onConnectionMouseEnter,
            props.onConnectionMouseLeave,
        ]
    );

    const focusInfo = useFocusInfo();
    const focusModeEnabled = !!focusInfo;

    const connectionKeys: { [p: string]: boolean } = {};

    return (
        <ErrorBoundary
            onError={props.onError}
            onReset={props.onErrorResolved}
            fallbackRender={({ error, resetErrorBoundary }) => {
                const err = error as ReferenceValidationError;
                if (err?.missingReferences && props.renderMissingReferences) {
                    return props.renderMissingReferences(err.missingReferences);
                }

                if (props.renderError) {
                    return props.renderError(error);
                }

                return (
                    <Alert
                        sx={{
                            m: 2,
                            mt: 6,
                        }}
                        severity="error"
                    >
                        Plan failed with error: "{error?.message ?? 'Unknown'}"
                        <br />
                        Please contact support.
                    </Alert>
                );
            }}
            resetKeys={[props.systemId, planner.plan, planner.blockAssets]}
        >
            <PlannerCanvas onCreateBlock={props.onCreateBlock}>
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
                                style={{ zIndex: instance.id === topBlock ? 100 : index + 1 }}
                                size={nodeSize}
                                actions={props.actions || {}}
                                className={className}
                                onMouseEnter={callbacks.onBlockMouseEnter}
                                onMouseLeave={callbacks.onBlockMouseLeave}
                                onResourceMouseEnter={callbacks.onResourceMouseEnter}
                                onResourceMouseLeave={callbacks.onResourceMouseLeave}
                            />
                        </BlockContextProvider>
                    );
                })}

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

                    const highlighted = highlightedConnections.includes(key);

                    // Hide connections that are not connected to the focused block
                    const className = toClass({
                        'connection-hidden': Boolean(
                            focusInfo?.focus && !isConnectionTo(connection, focusInfo?.focus.instance.id)
                        ),
                        highlight: highlighted,
                    });

                    return (
                        <PlannerConnection
                            style={{ zIndex: highlighted ? -1 : -50 }}
                            size={nodeSize}
                            key={key}
                            className={className}
                            connection={connection}
                            actions={props.actions?.connection || []}
                            onMouseOver={callbacks.onConnectionMouseEnter}
                            onMouseLeave={callbacks.onResourceMouseLeave}
                        />
                    );
                })}

                {/* Render temp connections to dragged resources */}
                <DnDContext.Consumer>{renderTempResources}</DnDContext.Consumer>
            </PlannerCanvas>
        </ErrorBoundary>
    );
};
