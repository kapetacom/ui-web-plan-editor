/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React, { useContext, useMemo, useState, useEffect } from 'react';

import { IResourceTypeProvider, ResourceProviderType, ResourceRole, ResourceWithSpec } from '@kapeta/ui-web-types';

import './PlannerBlockResourceListItem.less';
import { PlannerNodeSize } from '../../types';
import { getResourceId, RESOURCE_HEIGHTS } from '../utils/planUtils';
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
import { ActionContext, PlannerAction, PlannerPayload, PlannerPayloadType, ResourcePayload } from '../types';
import { Resource } from '@kapeta/schemas';
import { createConnection } from '../utils/connectionUtils';
import { PlannerMode, ResourceMode } from '../../utils/enums';
import { parseKapetaUri } from '@kapeta/nodejs-utils';
import { AssetKindIcon } from '@kapeta/ui-web-components';
import { useBlockEntities } from '../hooks/useBlockEntitiesForResource';
import { Box } from '@mui/material';

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
    onXPositionChange?: (resourceName: string, xPosition: number) => void;
}

const renderClipPath = (height: number, role: ResourceRole, expanded: boolean) => {
    const top = 0;
    let width = 150;
    let left = 0;

    const iconWidth = 0;
    if (role === ResourceRole.CONSUMES) {
        width = expanded ? 140 : 9.5 + iconWidth;
    } else {
        left = expanded ? 12 + iconWidth : 112;
    }

    return <rect className="resource-mask" width={width} height={height} x={left} y={top} />;
};

const getResourceConnectionPoint = ({ isConsumer = false, isExpanded = false, buttonWidth = 0 }) => {
    const baseOffset = isConsumer ? -45 : 195;
    const expansionSign = isConsumer ? -1 : 1;
    const expansionWidth = isExpanded ? 100 : 0;
    return baseOffset + (expansionWidth + buttonWidth) * expansionSign;
};

interface TempResourceProps {
    resource: ResourceWithSpec<any>;
    nodeSize: PlannerNodeSize;
    x: number;
    y: number;
    actionContext: ActionContext;
    icon?: React.ReactNode;
}

const TempResource = ({ resource, nodeSize, x, y, actionContext, icon }: TempResourceProps) => {
    const height = RESOURCE_HEIGHTS[nodeSize];
    const heightInner = height - RESOURCE_SPACE;
    // const mouseCatcherWidth = 210;

    const clipPathId = 'temp-resource-clip';

    let resourceConfig: IResourceTypeProvider | null = null;
    try {
        resourceConfig = ResourceTypeProvider.get(resource.kind);
    } catch (e) {
        //
    }

    const type = resourceConfig?.type?.toString().toLowerCase() ?? ResourceProviderType.INTERNAL.toLowerCase();
    const title = resourceConfig?.title || resourceConfig?.kind;
    const typeName = title?.toString().toLowerCase() ?? 'unknown';

    return (
        <SVGLayoutNode x={x - 7} y={y}>
            {/* Clip the hexagon to create a straight edge */}
            <clipPath id={clipPathId}>{renderClipPath(height, ResourceRole.CONSUMES, true)}</clipPath>

            <g height={heightInner}>
                <LayoutNode x={140} y={height / 2}>
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
                        role={ResourceRole.CONSUMES}
                        size={nodeSize}
                        name={resource.metadata.name}
                        type={type}
                        typeStatusIcon="arrow"
                        typeStatusColor="success"
                        typeName={typeName}
                        actionContext={actionContext}
                        icon={icon}
                    />
                    <rect x={137} y={0} width={3} height={heightInner} className="indicator" fill="#651fff" />
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
        const entities: any = useBlockEntities(props.resource.kind, blockDefinition);
        if (resourceConfig && resourceConfig.validate) {
            errors.push(...resourceConfig.validate(props.resource, entities));
        }
    } catch (e) {
        errors.push(`Failed to read resource kind: ${e && (e as Error).message}`);
    }

    // Check for name conflicts
    if (props.role === ResourceRole.CONSUMES) {
        const nameCount = blockDefinition?.spec.consumers?.filter((consumer, ix) => {
            return consumer.metadata.name === props.resource.metadata.name;
        }).length;
        if (nameCount && nameCount > 1) {
            errors.push('Name conflicts with another consumer');
        }
    } else if (props.role === ResourceRole.PROVIDES) {
        const nameCount = blockDefinition?.spec.providers?.filter((provider, ix) => {
            return provider.metadata.name === props.resource.metadata.name;
        }).length;
        if (nameCount && nameCount > 1) {
            errors.push('Name conflicts with another provider');
        }
    }

    const type = resourceConfig?.type?.toString().toLowerCase() ?? ResourceProviderType.INTERNAL.toLowerCase();
    const title = resourceConfig?.title || resourceConfig?.kind;
    const typeName = title?.toString().toLowerCase() ?? 'unknown';
    const resourceIcon = resourceConfig ? <AssetKindIcon asset={resourceConfig.definition} size={20} /> : '';

    const counterValue = resourceConfig?.getCounterValue ? resourceConfig!.getCounterValue(props.resource) : 0;
    const valid = errors.length === 0;

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
        if (!isConsumer) {
            // Only allow dropping onto consumers
            return false;
        }

        try {
            switch (planner.mode) {
                case PlannerMode.EDIT:
                    if (draggable?.type !== 'resource') {
                        // Only allow dropping resources
                        return false;
                    }

                    if (draggable.data.block.id === blockInstance.id) {
                        // Only allow dropping if the resource does not belong to this block
                        return false;
                    }

                    const resourceProvider = ResourceTypeProvider.get(props.resource.kind);
                    if (!resourceProvider) {
                        // Only allow dropping if the resource is a known type
                        return false;
                    }

                    const allowMultipleConnections = Boolean(resourceProvider.capabilities?.allowMultipleConnections);

                    if (
                        !allowMultipleConnections &&
                        planner.hasConnections({
                            blockId: blockInstance.id,
                            resourceName: props.resource.metadata.name,
                        })
                    ) {
                        // Only allow dropping if the resource is not connected to anything
                        return false;
                    }

                    const canApply = ResourceTypeProvider.canApplyResourceToKind(
                        draggable.data.resource.kind,
                        props.resource.kind
                    );

                    return canApply;
                case PlannerMode.CONFIGURATION:
                    return (
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
    const buttonsVisible = !draggable && mode === ResourceMode.SHOW_OPTIONS;
    const connectionResourceId = getResourceId(blockInstance.id, props.resource.metadata.name, props.role);

    const extension = isExpanded ? 90 : 0;
    const xPosition = props.role === ResourceRole.CONSUMES ? -35 - extension : 45 + extension;

    const nodeSize = props.size !== undefined ? props.size : PlannerNodeSize.MEDIUM;
    const height = RESOURCE_HEIGHTS[nodeSize];
    const heightInner = height - RESOURCE_SPACE;
    const yOffset = height * props.index;

    const counterVisible = counterValue > 0 && isExpanded;
    const mouseCatcherWidth = blockInstance.dimensions!.width + 60;

    const counterX = isConsumer ? -10 : 145;
    // Different offsets because the counter takes up positive space only
    const counterOffset = isConsumer ? -5 : COUNTER_SIZE * 2 + 5;
    const buttonDistance = isConsumer ? 5 : 10;
    const buttonX = counterX + (counterVisible ? counterOffset : buttonDistance);
    const buttonY = height / 2 - RESOURCE_SPACE / 2;
    const counterY = buttonY - COUNTER_SIZE;

    const [actionButtonsWidth, setActionButtonsWidth] = useState(0);

    const counterPoint = {
        x: counterX,
        y: counterY,
    };

    const connectionPointX = getResourceConnectionPoint({
        isConsumer,
        isExpanded,
        buttonWidth: buttonsVisible ? actionButtonsWidth : 0,
    });

    useEffect(() => {
        const name = props.resource.metadata.name;
        props.onXPositionChange?.(name, connectionPointX);
        return () => {
            props.onXPositionChange?.(name, 0);
        };
    }, [props.resource.metadata.name, connectionPointX, props.onXPositionChange]);

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

    const consumable = useMemo(() => {
        try {
            return ResourceTypeProvider.convertToConsumable(props.resource);
        } catch (e) {
            return props.resource;
        }
    }, [props.resource]);

    return (
        <SVGLayoutNode x={0} y={yOffset}>
            <DragAndDrop.Draggable
                data={{
                    type: PlannerPayloadType.RESOURCE,
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
                {(draggableOpts) => (
                    <>
                        <svg
                            className={containerClass}
                            x={isConsumer ? 0 : -160}
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
                            {...(props.role === ResourceRole.PROVIDES ? draggableOpts.componentProps : {})}
                        >
                            <g className={bodyClass} transform={`translate(${xPosition},0)`} height={heightInner}>
                                <DragAndDrop.DropZone
                                    data={
                                        {
                                            type: PlannerPayloadType.RESOURCE,
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
                                    onDrop={(payload) => {
                                        setDragOver(false);
                                        if (payload.type !== PlannerPayloadType.RESOURCE) {
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
                                        <rect
                                            className="mouse-catcher"
                                            opacity="0"
                                            width={mouseCatcherWidth}
                                            height={heightInner}
                                            x={isConsumer ? -60 : 0}
                                            y={0}
                                            ref={onRef}
                                        />
                                    )}
                                </DragAndDrop.DropZone>

                                <ActionButtons
                                    transition="slide"
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

                                {/* TODO: To avoid shifting, maybe remove this */}
                                <LayoutNode x={connectionPointX} y={buttonY}>
                                    <PlannerConnectionPoint pointId={connectionResourceId} />
                                </LayoutNode>

                                <svg
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
                                        typeStatusIcon={
                                            planner.assetState.getResourceIcon(
                                                blockInstance.id,
                                                props.resource.metadata.name,
                                                props.role
                                            ) || (type === 'internal' ? 'arrow' : 'tick')
                                        }
                                        typeStatusColor={valid ? 'success' : 'error'}
                                        typeName={typeName}
                                        actionContext={actionContext}
                                        icon={resourceIcon}
                                    />
                                </svg>

                                <svg
                                    width={COUNTER_SIZE * 2}
                                    height={COUNTER_SIZE * 2}
                                    x={counterPoint.x}
                                    y={counterPoint.y}
                                >
                                    <Box
                                        component="g"
                                        className="resource-counter"
                                        sx={(theme) => {
                                            const isDarkMode = theme.palette.mode === 'dark';
                                            return {
                                                '&&&': {
                                                    '.background': {
                                                        ...(isDarkMode
                                                            ? {
                                                                  fill: theme.palette.success.light,
                                                                  stroke: '#2D3032',
                                                              }
                                                            : {}),
                                                    },
                                                    '.foreground': {
                                                        ...(isDarkMode
                                                            ? {
                                                                  fill: theme.palette.text.primary,
                                                              }
                                                            : {}),
                                                    },
                                                },
                                            };
                                        }}
                                    >
                                        <circle
                                            cx={COUNTER_SIZE}
                                            cy={COUNTER_SIZE}
                                            r={COUNTER_SIZE}
                                            className="background"
                                        />
                                        <text textAnchor="middle" className="foreground" y={12} x={COUNTER_SIZE}>
                                            {counterValue}
                                        </text>
                                    </Box>
                                </svg>
                            </g>
                        </svg>

                        {/* Temp draggable resource */}
                        {draggableOpts.isDragging ? (
                            <TempResource
                                x={draggableOpts.zone.diff.x / planner.zoom}
                                y={draggableOpts.zone.diff.y / planner.zoom}
                                nodeSize={nodeSize}
                                resource={consumable}
                                actionContext={actionContext}
                                icon={resourceIcon}
                            />
                        ) : null}
                    </>
                )}
            </DragAndDrop.Draggable>
        </SVGLayoutNode>
    );
};
