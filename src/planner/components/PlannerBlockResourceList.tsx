/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React, { useContext, useEffect, useMemo } from 'react';

import { Point, ResourceProviderType, ResourceRole } from '@kapeta/ui-web-types';
import { toClass } from '@kapeta/ui-web-utils';

import { PlannerBlockResourceListItem } from './PlannerBlockResourceListItem';
import { PlannerContext, PlannerContextData } from '../PlannerContext';
import { useBlockContext } from '../BlockContext';
import { BlockMode, ResourceMode } from '../../utils/enums';
import { getResourceId, RESOURCE_HEIGHTS } from '../utils/planUtils';
import { SVGLayoutNode } from '../LayoutContext';
import { DnDContext } from '../DragAndDrop/DnDContext';
import { ActionContext, PlannerAction, PlannerPayload } from '../types';
import { PlannerNodeSize } from '../../types';
import { Connection, Endpoint, Resource } from '@kapeta/schemas';
import { ResourceTypeProvider } from '@kapeta/ui-web-context';
import { parseKapetaUri } from '@kapeta/nodejs-utils';

function canHaveConnections(kind: string) {
    if (!ResourceTypeProvider.exists(kind)) {
        return false;
    }
    const provider = ResourceTypeProvider.get(kind);
    return provider.type === ResourceProviderType.INTERNAL || provider.type === ResourceProviderType.EXTENSION;
}

function getPointForInstance(planner: PlannerContextData, blockInstanceId: string) {
    const blockInstance = planner.plan?.spec.blocks.find((block) => block.id === blockInstanceId);
    if (!blockInstance) {
        return null;
    }

    return {
        x: blockInstance.dimensions.left,
        y: blockInstance.dimensions.top,
    };
}

function getConnectedResources(connections: Connection[], role: ResourceRole, resource: Resource): Endpoint[] {
    return connections
        .filter((connection) => {
            if (role === ResourceRole.CONSUMES) {
                return connection.consumer.resourceName === resource.metadata.name;
            }
            return connection.provider.resourceName === resource.metadata.name;
        })
        .map((connection) => {
            if (role === ResourceRole.CONSUMES) {
                return connection.provider;
            }
            return connection.consumer;
        });
}

function getGreatestVerticalDifference(
    planner: PlannerContextData,
    role: ResourceRole,
    sourcePoint: Point,
    endpoints: Endpoint[]
) {
    if (endpoints.length < 1) {
        return 0;
    }

    const points = endpoints
        .map((endpoint) => {
            return getPointForInstance(planner, endpoint.blockId);
        })
        .filter((v) => Boolean(v)) as Point[];

    let biggestDiff = 0;

    points.forEach((point) => {
        const diff = point.y - sourcePoint.y;

        if (Math.abs(diff) > Math.abs(biggestDiff)) {
            biggestDiff = diff;
        }
    });

    return biggestDiff;
}

export interface PlannerBlockResourceListProps {
    role: ResourceRole;
    actions: PlannerAction<any>[];
    nodeSize: PlannerNodeSize;
    onResourceMouseEnter?: (context: ActionContext) => void;
    onResourceMouseLeave?: (context: ActionContext) => void;
}

export const PlannerBlockResourceList: React.FC<PlannerBlockResourceListProps> = (props) => {
    const blockCtx = useBlockContext();
    const planner = useContext(PlannerContext);
    const { draggable } = useContext(DnDContext);

    // Can we move layout stuff to its own helpers?
    const listOffset = props.role === ResourceRole.PROVIDES ? blockCtx.instanceBlockWidth : 0;
    const placeholderWidth = 3;
    const placeholderOffset = props.role === ResourceRole.PROVIDES ? listOffset : -placeholderWidth;

    // Enable SHOW mode if the whole block is in SHOW mode
    const mode =
        blockCtx.blockMode === BlockMode.SHOW || blockCtx.blockMode === BlockMode.FOCUSED
            ? ResourceMode.SHOW
            : ResourceMode.HIDDEN;

    const showPlaceholder = () => {
        const payload = draggable as PlannerPayload | null;
        if (!payload) {
            return false;
        }
        const rightTypeAndRole =
            (payload.type === 'resource' && payload.data.role === props.role) ||
            (payload.type === 'resource-type' && payload.data.config.role === props.role);
        return (
            rightTypeAndRole &&
            (blockCtx.blockMode === BlockMode.HOVER_DROP_CONSUMER ||
                blockCtx.blockMode === BlockMode.HOVER_DROP_PROVIDER)
        );
    };

    const plannerResourceListClass = toClass({
        'planner-resource-list': true,
        show: showPlaceholder(),
        [props.role.toLowerCase()]: true,
    });

    // Offset for the top of the hexagon, plus centering if there is only 1
    const placeholderCount = showPlaceholder() ? 1 : 0;

    const connections = useMemo(() => {
        return (
            planner.plan?.spec.connections.filter((connection) => {
                if (props.role === ResourceRole.CONSUMES) {
                    return connection.consumer.blockId === blockCtx.blockInstance.id;
                }
                return connection.provider.blockId === blockCtx.blockInstance.id;
            }) ?? []
        );
    }, [blockCtx.blockInstance.id, planner.plan?.spec.connections, props.role]);

    const sourcePoint: Point = useMemo(
        () => ({
            y: blockCtx.blockInstance.dimensions.top + blockCtx.instanceBlockHeight / 2,
            x: blockCtx.blockInstance.dimensions.left + blockCtx.instanceBlockWidth / 2,
        }),
        [
            blockCtx.blockInstance.dimensions.left,
            blockCtx.blockInstance.dimensions.top,
            blockCtx.instanceBlockHeight,
            blockCtx.instanceBlockWidth,
        ]
    );

    const list = useMemo(() => {
        const reverseRole = props.role === ResourceRole.CONSUMES ? ResourceRole.PROVIDES : ResourceRole.CONSUMES;
        const result = props.role === ResourceRole.CONSUMES ? [...blockCtx.consumers] : [...blockCtx.providers];

        // Sort the list by the greatest vertical difference between the blocks it's connected to
        // This will make the resources avoid overlapping connections as much as possible
        result.sort((a: Resource, b: Resource) => {
            const aConnects = canHaveConnections(a.kind) ? 1 : 0;
            const bConnects = canHaveConnections(b.kind) ? 1 : 0;
            const connectDiff = aConnects - bConnects;
            if (connectDiff !== 0) {
                return connectDiff;
            }

            const aUri = parseKapetaUri(a.kind);
            const bUri = parseKapetaUri(b.kind);
            const nameCompare = aUri.fullName.localeCompare(bUri.fullName);
            if (nameCompare !== 0) {
                return nameCompare;
            }

            const aConnections = getConnectedResources(connections, props.role, a);
            const bConnections = getConnectedResources(connections, props.role, b);

            const connectionDiff = (aConnections.length > 0 ? 1 : 0) - (bConnections.length > 0 ? 1 : 0);
            if (connectionDiff !== 0) {
                return connectionDiff;
            }

            const aVertical = getGreatestVerticalDifference(planner, reverseRole, sourcePoint, aConnections);
            const bVertical = getGreatestVerticalDifference(planner, reverseRole, sourcePoint, bConnections);

            return aVertical - bVertical;
        });

        return result;
    }, [connections, props.role, blockCtx.consumers, blockCtx.providers]);

    const listHeight = list.length * RESOURCE_HEIGHTS[props.nodeSize];
    const yPosition =
        (blockCtx.instanceBlockHeight - listHeight - placeholderCount * RESOURCE_HEIGHTS[props.nodeSize]) / 2;

    return (
        <SVGLayoutNode className={plannerResourceListClass} overflow="visible" x={0} y={yPosition}>
            <svg x={listOffset}>
                {list.map((resource, index: number) => {
                    return (
                        <PlannerBlockResourceListItem
                            size={props.nodeSize}
                            key={`${blockCtx.blockInstance.id}_${resource.metadata.name}`}
                            index={index}
                            resource={resource}
                            // Should we render a consumer or provider?
                            role={props.role}
                            // Default to hidden unless the block has focus or the planner has a drag in progress
                            mode={mode}
                            // If hovering should trigger a different state, put it here
                            // show_options unless viewOnly or we're dragging
                            hoverMode={ResourceMode.SHOW_OPTIONS}
                            actions={props.actions}
                            onMouseEnter={props.onResourceMouseEnter}
                            onMouseLeave={props.onResourceMouseLeave}
                        />
                    );
                })}
            </svg>

            {/* "ghost" target when we're about to create a new resource in the list */}
            <svg x={placeholderOffset} y={listHeight}>
                <rect
                    className="resource-placeholder"
                    height={RESOURCE_HEIGHTS[props.nodeSize] - 4}
                    width={placeholderWidth}
                />
            </svg>
        </SVGLayoutNode>
    );
};
