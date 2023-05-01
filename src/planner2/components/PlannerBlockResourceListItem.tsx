import React, { useContext, useMemo, useState } from 'react';

import { IResourceTypeProvider, ResourceProviderType, ResourceRole } from '@kapeta/ui-web-types';

import './PlannerBlockResourceListItem.less';
import { PlannerNodeSize } from '../../types';
import { ResourceMode } from '../../wrappers/wrapperHelpers';
import { getResourceId, resourceHeight } from '../utils/planUtils';
import { LayoutNode, SVGLayoutNode } from '../LayoutContext';
import { PlannerConnectionPoint } from './PlannerConnectionPoint';
import { BlockResource } from './BlockResource';
import { DragAndDrop } from '../utils/dndUtils';
import { toClass } from '@kapeta/ui-web-utils';
import { ResourceTypeProvider } from '@kapeta/ui-web-context';
import { useBlockContext } from '../BlockContext';
import { DnDContext } from '../DragAndDrop/DnDContext';
import { PlannerContext } from '../PlannerContext';
import { ActionButtons } from './ActionButtons';
import { ActionContext, PlannerAction, PlannerPayload, ResourcePayload } from '../types';
import { Resource } from '@kapeta/schemas';
import { createConnection } from '../utils/connectionUtils';
import { PlannerMode } from '../../wrappers/PlannerModelWrapper';
import { parseKapetaUri } from '@kapeta/nodejs-utils';

export const RESOURCE_SPACE = 4; // Vertical distance between resources
const COUNTER_SIZE = 8;

interface PlannerBlockResourceListItemProps {
    resource: Resource;
    role: ResourceRole;
    index: number;
    size?: PlannerNodeSize;
    readOnly?: boolean;
    mode: ResourceMode;
    hoverMode?: ResourceMode;
    actions?: PlannerAction<any>[];
    onMouseEnter?: (context: ActionContext) => void;
    onMouseLeave?: (context: ActionContext) => void;
}

const renderClipPath = (height: number, role: ResourceRole, expanded: boolean) => {
    const top = 0;
    let width = 250;
    let left = 0;

    if (role === ResourceRole.CONSUMES) {
        width = expanded ? 109.5 : 9.5;
    } else {
        left = expanded ? 12 : 112;
    }

    return <rect className="resource-mask" width={width} height={height} x={left} y={top} />;
};

const getResourceConnectionPoint = ({ isConsumer, isExpanded, buttonWidth = 0 }) => {
    const baseOffset = isConsumer ? -20 : 170;
    const expansionSign = isConsumer ? -1 : 1;
    const expansionWidth = isExpanded ? 100 : 0;
    return baseOffset + (expansionWidth + buttonWidth) * expansionSign;
};

const TempResource = ({ resource, nodeSize, x, y, actionContext }) => {
    const height = resourceHeight[nodeSize];
    const heightInner = height - RESOURCE_SPACE;
    const mouseCatcherWidth = 210;

    const clipPathId = 'temp-resource-clip';

    return (
        <SVGLayoutNode x={x + 150} y={y}>
            {/* Clip the hexagon to create a straight edge */}
            <clipPath id={clipPathId}>{renderClipPath(height, ResourceRole.CONSUMES, true)}</clipPath>

            <g height={heightInner}>
                <LayoutNode x={-10} y={height / 2}>
                    <PlannerConnectionPoint
                        pointId={getResourceId('temp-block', 'temp-resource', ResourceRole.CONSUMES)}
                    />
                </LayoutNode>

                <svg
                    clipPath="url(#temp-resource-clip)"
                    style={{
                        cursor: 'grab',
                    }}
                >
                    <BlockResource
                        role={ResourceRole.PROVIDES}
                        size={nodeSize}
                        name={resource.name}
                        type={resource.type}
                        typeName={resource.typeName}
                        width={mouseCatcherWidth}
                        height={heightInner}
                        actionContext={actionContext}
                    />
                </svg>
            </g>
        </SVGLayoutNode>
    );
};

export const PlannerBlockResourceListItem: React.FC<PlannerBlockResourceListItemProps> = (props) => {
    const planner = useContext(PlannerContext);
    const { blockInstance, blockDefinition } = useBlockContext();
    const { draggable } = useContext(DnDContext);

    let resourceConfig: IResourceTypeProvider | null = null;
    const errors: string[] = [];
    try {
        resourceConfig = ResourceTypeProvider.get(props.resource.kind);
        if (resourceConfig && resourceConfig.validate) {
            errors.push(...resourceConfig.validate(props.resource, blockDefinition?.spec.entities?.types ?? []));
        }
    } catch (e) {
        errors.push(`Failed to read resource kind: ${e.message}`);
    }

    // Check for name conflicts
    if (props.role === ResourceRole.CONSUMES) {
        const hasNameConflict = blockDefinition?.spec.consumers?.some((consumer, ix) => {
            return props.index !== ix && consumer.metadata.name === props.resource.metadata.name;
        });
        if (hasNameConflict) {
            errors.push('Name conflicts with another resource');
        }
    } else if (props.role === ResourceRole.PROVIDES) {
        const hasNameConflict = blockDefinition?.spec.providers?.some((provider, ix) => {
            return props.index !== ix && provider.metadata.name === props.resource.metadata.name;
        });
        if (hasNameConflict) {
            errors.push('Name conflicts with another resource');
        }
    }

    const type = resourceConfig?.type?.toString().toLowerCase() ?? ResourceProviderType.INTERNAL;
    const title = resourceConfig?.title || resourceConfig?.kind;
    const typeName = title?.toString().toLowerCase() ?? 'unknown';

    const counterValue = resourceConfig?.getCounterValue ? resourceConfig!.getCounterValue(props.resource) : 0;
    const valid = errors.length === 0 && true; // TODO props.resource.isValid();

    const [isHovered, setHoverState] = useState(false);
    const overrideMode = planner.assetState.getViewModeForResource(
        blockInstance.id,
        props.resource.metadata.name,
        props.role
    );

    // expand if the resource is connected to a focused block
    const isConnectedToFocusedBlock = planner.plan?.spec.connections?.some((connection) => {
        const isConnectionToResource =
            connection.provider.blockId === planner.focusedBlock?.id &&
            connection.consumer.blockId === blockInstance.id &&
            connection.consumer.resourceName === props.resource.metadata.name &&
            props.role === ResourceRole.CONSUMES;
        const isConnectionFromResource =
            connection.consumer.blockId === planner.focusedBlock?.id &&
            connection.provider.blockId === blockInstance.id &&
            connection.provider.resourceName === props.resource.metadata.name &&
            props.role === ResourceRole.PROVIDES;
        return isConnectionToResource || isConnectionFromResource;
    });

    const focusMode = isConnectedToFocusedBlock ? ResourceMode.SHOW_FIXED : undefined; //
    // props mode is the default, unless overridden by the planner
    const propsMode = isHovered ? props.hoverMode || props.mode : props.mode;
    const mode = overrideMode ?? focusMode ?? propsMode;

    const isConsumer = props.role === ResourceRole.CONSUMES;
    // in view mode, never
    // in edit mode, if the resource is not connected to anything
    // in config mode, if the resource is not connected to anything

    const dragIsCompatible = useMemo(() => {
        try {
            switch (planner.mode) {
                case PlannerMode.EDIT:
                    return (
                        isConsumer &&
                        draggable?.type === 'resource' &&
                        draggable.data.block.id !== blockInstance.id &&
                        ResourceTypeProvider.canApplyResourceToKind(
                            draggable.data.resource.kind,
                            props.resource.kind
                        ) &&
                        !planner.hasConnections({
                            blockId: blockInstance.id,
                            resourceName: props.resource.metadata.name,
                        })
                    );
                case PlannerMode.CONFIGURATION:
                    return (
                        isConsumer &&
                        draggable?.type === 'operator' &&
                        // compare without versions
                        parseKapetaUri(props.resource.kind).fullName ===
                            parseKapetaUri(draggable.data.operator?.ref).fullName
                    );

                case PlannerMode.VIEW:
                default:
                    return false;
            }
        } catch (e) {
            // eslint-disable-next-line no-console
            console.warn('Failed to correctly determine if resource is draggable', e);
            return false;
        }
    }, [draggable, blockInstance, props.resource, planner, isConsumer]);

    // Change to inclusion list if necessary
    const isForceDisabled = overrideMode === ResourceMode.HIDDEN;
    const isExpanded = !isForceDisabled && (mode !== ResourceMode.HIDDEN || dragIsCompatible);
    const buttonsVisible = mode === ResourceMode.SHOW_OPTIONS;

    const resourceId = `${blockInstance.id}_${props.role}_${props.index}`;
    const clipPathId = `${resourceId}_clippath`;

    const connectionResourceId = getResourceId(blockInstance.id, props.resource.metadata.name, props.role);
    const fixedClipPathId = `${clipPathId}_fixed`;

    const extension = isExpanded ? 100 : 0;
    const getXPosition = () => (props.role === ResourceRole.CONSUMES ? -10 - extension : 39 + extension);

    const nodeSize = props.size !== undefined ? props.size : PlannerNodeSize.MEDIUM;
    const height = resourceHeight[nodeSize];
    const heightInner = height - RESOURCE_SPACE;
    const yOffset = height * props.index;

    const counterVisible = counterValue > 0 && buttonsVisible;
    const mouseCatcherWidth = blockInstance.dimensions!.width + 60;

    const counterX = isConsumer ? -10 : 110;
    // Different offsets because the counter takes up positive space only
    const counterOffset = isConsumer ? -5 : COUNTER_SIZE * 2 + 5;
    const buttonX = counterX + (counterVisible ? counterOffset : 0);
    const buttonY = height / 2 - RESOURCE_SPACE / 2;
    const counterY = buttonY - COUNTER_SIZE;

    const [actionButtonsWidth, setActionButtonsWidth] = useState(0);

    const counterPoint = {
        x: counterX,
        y: counterY,
    };

    const containerClass = toClass({
        'planner-block-resource-list-item': true,
        'buttons-visible': buttonsVisible,
        'counter-visible': counterVisible,
        consumes: isConsumer,
    });

    const [dragOver, setDragOver] = useState(false);
    const bodyClass = toClass({
        'resource-item-body': true,
        [typeName]: true,
        // highlight: props.resource.mode === ResourceMode.HIGHLIGHT,
        compatible: !isForceDisabled && dragIsCompatible,
        hover: !isForceDisabled && dragIsCompatible && dragOver,
        invalid: !valid,
    });
    const actionContext = {
        block: blockDefinition,
        blockInstance,
        resource: props.resource,
        resourceRole: props.role,
    };

    return (
        <SVGLayoutNode x={0} y={yOffset}>
            <DragAndDrop.DropZone
                data={
                    {
                        type: 'resource',
                        data: {
                            resource: props.resource,
                            instance: blockInstance,
                            block: blockDefinition,
                            role: ResourceRole.CONSUMES,
                        },
                    } as PlannerPayload
                }
                onDragEnter={() => setDragOver(true)}
                onDragLeave={() => setDragOver(false)}
                onDrop={(payload: ResourcePayload) => {
                    setDragOver(false);
                    if (payload.type !== 'resource') {
                        return;
                    }
                    const connection = createConnection(
                        {
                            instance: payload.data.instance,
                            block: payload.data.block,
                            resource: payload.data.resource,
                        },
                        {
                            instance: blockInstance!,
                            block: blockDefinition!,
                            resource: props.resource,
                        }
                    );
                    planner.addConnection(connection);
                }}
                // TODO: flip this around, pass down to children
                accept={() => !isForceDisabled && dragIsCompatible}
            >
                {({ onRef }) => (
                    <DragAndDrop.Draggable
                        data={{
                            type: 'resource',
                            data: {
                                resource: props.resource,
                                instance: blockInstance,
                                block: blockDefinition!,
                                role: ResourceRole.CONSUMES,
                            },
                        }}
                        // Only allow creating new connections in edit mode
                        disabled={!planner.canEditConnections}
                    >
                        {(evt) => (
                            <>
                                <clipPath id={fixedClipPathId}>
                                    <rect
                                        className="container-mask"
                                        width={mouseCatcherWidth}
                                        height={height}
                                        x={isConsumer ? -mouseCatcherWidth - 1 : blockInstance.dimensions!.width + 1}
                                        y={0}
                                    />
                                </clipPath>

                                <svg
                                    className={containerClass}
                                    clipPath={`url(#${fixedClipPathId})`}
                                    x={0}
                                    y={0}
                                    onMouseEnter={() => {
                                        if (props.onMouseEnter) {
                                            props.onMouseEnter(actionContext);
                                        }
                                    }}
                                    onMouseLeave={() => {
                                        setHoverState(false);
                                        if (props.onMouseLeave) {
                                            props.onMouseLeave(actionContext);
                                        }
                                    }}
                                    onMouseMove={() => setHoverState(true)}
                                    // Only register the drag handler if the resource should be draggable (Providers only atm)
                                    {...(props.role === ResourceRole.PROVIDES ? evt.componentProps : {})}
                                >
                                    {/* Clip the hexagon to create a straight edge */}
                                    <clipPath id={clipPathId}>
                                        {renderClipPath(height, props.role, isExpanded)}
                                    </clipPath>

                                    <g
                                        className={bodyClass}
                                        transform={`translate(${getXPosition()},0)`}
                                        height={heightInner}
                                    >
                                        <rect
                                            className="mouse-catcher"
                                            opacity="0"
                                            width={mouseCatcherWidth}
                                            height={heightInner}
                                            x={isConsumer ? -60 : -30}
                                            y={0}
                                            ref={onRef}
                                        />

                                        <ActionButtons
                                            pointType={isConsumer ? 'right' : 'left'}
                                            x={buttonX}
                                            y={buttonY}
                                            show={buttonsVisible}
                                            actions={props.actions || []}
                                            actionContext={actionContext}
                                            onSizeChange={(width) => {
                                                setActionButtonsWidth(width);
                                            }}
                                        />

                                        <LayoutNode
                                            x={getResourceConnectionPoint({
                                                isConsumer,
                                                isExpanded,
                                                buttonWidth: buttonsVisible ? actionButtonsWidth : 0,
                                            })}
                                            y={buttonY}
                                        >
                                            <PlannerConnectionPoint pointId={connectionResourceId} />
                                        </LayoutNode>

                                        <svg
                                            clipPath={`url(#${clipPathId})`}
                                            style={{
                                                cursor: isConsumer ? '' : 'grab',
                                            }}
                                        >
                                            <BlockResource
                                                role={props.role}
                                                size={nodeSize}
                                                name={props.resource.metadata.name}
                                                readOnly={props.readOnly}
                                                type={type}
                                                typeName={typeName}
                                                width={blockInstance.dimensions!.width}
                                                height={heightInner}
                                                actionContext={actionContext}
                                            />
                                        </svg>

                                        <svg
                                            width={COUNTER_SIZE * 2}
                                            height={COUNTER_SIZE * 2}
                                            x={counterPoint.x}
                                            y={counterPoint.y}
                                        >
                                            <g className="resource-counter">
                                                <circle
                                                    cx={COUNTER_SIZE}
                                                    cy={COUNTER_SIZE}
                                                    r={COUNTER_SIZE}
                                                    className="background"
                                                />
                                                <text
                                                    textAnchor="middle"
                                                    className="foreground"
                                                    y={12}
                                                    x={COUNTER_SIZE}
                                                >
                                                    {counterValue}
                                                </text>
                                            </g>
                                        </svg>
                                    </g>
                                </svg>

                                {/* Temp draggable resource */}
                                {evt.isDragging ? (
                                    <TempResource
                                        x={evt.zone.diff.x / planner.zoom}
                                        y={evt.zone.diff.y / planner.zoom}
                                        nodeSize={nodeSize}
                                        resource={{
                                            typeName,
                                            name: props.resource.metadata.name,
                                        }}
                                        actionContext={actionContext}
                                    />
                                ) : null}
                            </>
                        )}
                    </DragAndDrop.Draggable>
                )}
            </DragAndDrop.DropZone>
        </SVGLayoutNode>
    );
};
