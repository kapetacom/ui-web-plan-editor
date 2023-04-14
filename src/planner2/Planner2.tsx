import React, { ReactNode, useContext } from 'react';
import { PlannerActionConfig, PlannerContext } from './PlannerContext';
import { PlannerNodeSize } from '../types';
import { PlannerBlockNode } from './components/PlannerBlockNode';
import { BlockContextProvider } from './BlockContext';
import { PlannerCanvas } from './PlannerCanvas';
import { PlannerConnection } from './components/PlannerConnection';
import { getConnectionId, isConnectionTo } from './utils/connectionUtils';
import { DnDContext, DnDContextType } from './DragAndDrop/DnDContext';
import { PlannerPayload } from './types';
import { toClass } from '@kapeta/ui-web-utils';
import { isBlockInFocus, useFocusInfo } from './utils/focusUtils';
import { ErrorBoundary } from 'react-error-boundary';

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

export const Planner2: React.FC<Props> = (props) => {
    const { nodeSize = PlannerNodeSize.MEDIUM, plan } = useContext(PlannerContext);

    const instances = plan?.spec.blocks ?? [];
    const connections = plan?.spec.connections ?? [];

    const focusInfo = useFocusInfo();
    const focusModeEnabled = !!focusInfo;

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
                        <BlockContextProvider key={instance.id} blockId={instance.id}>
                            <PlannerBlockNode size={nodeSize} actions={props.actions || {}} className={className} />
                        </BlockContextProvider>
                    );
                })}

                {connections.map((connection) => {
                    // Hide connections that are not connected to the focused block
                    const className = toClass({
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
        </ErrorBoundary>
    );
};
