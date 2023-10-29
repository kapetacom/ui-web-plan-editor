/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React, { ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
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
import { BlockDefinition, BlockInstance } from '@kapeta/schemas';
import { MissingReference, ReferenceValidationError } from './validation/PlanReferenceValidation';
import { Alert } from '@mui/material';
import './Planner.less';

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
    const { nodeSize = PlannerNodeSize.MEDIUM, plan, blockAssets } = useContext(PlannerContext);

    const instances = plan?.spec.blocks ?? [];
    const connections = plan?.spec.connections ?? [];

    // Manage connection render order to ensure that connections are rendered on top when hovered
    const [topConnection, setTopConnection] = useState<number | null>(null);

    const onConnectionMouseOver = useCallback(
        (connectionId: number) => () => {
            setTopConnection(connectionId);
        },
        [setTopConnection]
    );
    const onConnectionMouseLeave = useCallback(
        (context: ActionContext) => {
            setTopConnection(null);
            props.onConnectionMouseEnter?.(context);
        },
        [props.onConnectionMouseEnter]
    );

    const [topBlock, setTopBlockState] = useState<string | null>(null);
    // Only allow setting the top block when not dragging - to avoid flickering
    const setTopBlock = useCallback(
        (blockId: string | null) => {
            if (!isDragging) {
                setTopBlockState(blockId);
            }
        },
        [isDragging]
    );

    const onEnter = useCallback(
        (cb: any) => (context: ActionContext) => {
            if (context.blockInstance) {
                setTopBlock(context.blockInstance.id);
            }
            if (cb) {
                cb(context);
            }
        },
        [setTopBlock]
    );

    const onLeave = useCallback(
        (cb: any) => (context: ActionContext) => {
            if (context.blockInstance?.id === topBlock) {
                setTopBlock(null);
            }
            if (cb) {
                cb(context);
            }
        },
        [topBlock, setTopBlock]
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
            resetKeys={[props.systemId, plan, blockAssets]}
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

                    // Hide connections that are not connected to the focused block
                    const className = toClass({
                        'connection-hidden': !!(
                            focusInfo?.focus && !isConnectionTo(connection, focusInfo?.focus.instance.id)
                        ),
                    });

                    return (
                        <PlannerConnection
                            style={{ zIndex: id === topConnection ? -1 : -50 }}
                            size={nodeSize}
                            key={key}
                            className={className}
                            connection={connection}
                            actions={props.actions?.connection || []}
                            onMouseEnter={props.onConnectionMouseEnter}
                            onMouseOver={onConnectionMouseOver(id)}
                            onMouseLeave={onConnectionMouseLeave}
                        />
                    );
                })}

                {/* Render temp connections to dragged resources */}
                <DnDContext.Consumer>{renderTempResources}</DnDContext.Consumer>
            </PlannerCanvas>
        </ErrorBoundary>
    );
};
