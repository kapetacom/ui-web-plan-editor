/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { PlannerContext, PlannerContextData } from '../PlannerContext';
import { PlannerNodeSize } from '../../types';
import { ResourceRole } from '@kapeta/ui-web-types';
import { toClass } from '@kapeta/ui-web-utils';
import { getResourceId } from '../utils/planUtils';
import { ActionContext, PlannerAction } from '../types';
import { ActionButtonListProps, ActionButtons } from './ActionButtons';
import { ResourceTypeProvider } from '@kapeta/ui-web-context';
import { Connection } from '@kapeta/schemas';
import * as PF from 'pathfinding';
import {
    convertMatrixPathToPoints,
    findMatrixPath,
    getPathMidpoint,
    nearestPointOnPath,
    replaceJoinsWithArcs,
} from '../utils/connectionUtils/src/path';

import './PlannerConnection.less';
import {
    CELL_SIZE,
    ConnectionExtension,
    createSimplePath,
    createSimplePathVia,
    POINT_PADDING_X,
} from '../utils/connectionUtils';
import { applyObstacles } from '../utils/connectionUtils/src/matrix';
import _ from 'lodash';
import { useBlockEntities, useTransformEntities } from '../hooks/useBlockEntitiesForResource';

const CLUSTER_INDEX_OFFSET = 10;
const ENABLE_CLUSTERING = true;
function useConnectionValidation(connection: Connection, planner: PlannerContextData) {
    const fromResource = useMemo(
        () =>
            planner.getResourceByBlockIdAndName(
                connection.provider.blockId,
                connection.provider.resourceName,
                ResourceRole.PROVIDES
            ),
        [connection.provider, planner]
    );

    const toResource = useMemo(
        () =>
            planner.getResourceByBlockIdAndName(
                connection.consumer.blockId,
                connection.consumer.resourceName,
                ResourceRole.CONSUMES
            ),
        [connection.consumer, planner]
    );

    const fromBlock = planner.getBlockById(connection.provider.blockId);
    const toBlock = planner.getBlockById(connection.consumer.blockId);

    const fromEntities = useBlockEntities(fromResource?.kind, fromBlock);
    const toEntities = useBlockEntities(toResource?.kind, toBlock);
    const fromTransformed = useTransformEntities(fromResource?.kind, fromEntities);
    const toTransformed = useTransformEntities(toResource?.kind, toEntities);

    if (fromResource && toResource) {
        try {
            const converter = ResourceTypeProvider.getConverterFor(fromResource.kind, toResource.kind);
            if (converter) {
                // We force to any here because we don't know the type of the entities

                const errors = converter.validateMapping
                    ? converter.validateMapping(connection, fromResource, toResource, fromTransformed, toTransformed)
                    : [];
                return errors.length === 0;
            }
        } catch (e) {
            // Ignore in case the resource types are not loaded or the converter is not found
            // eslint-disable-next-line no-console
            console.error('Connection cannot render.', e);
        }
    }

    return true;
}

type PathInfo = {
    path: string;
    actionsPoint?: { x: number; y: number };
    portalPoint?: { x: number; y: number };
    provider?: boolean;
    pointType?: ActionButtonListProps['pointType'];
};

function pointsToSVG(points: number[][]) {
    return `M ${points.map(([x, y]) => `${x} ${y}`).join(' L ')}`;
}

export const PlannerConnection: React.FC<{
    connection: ConnectionExtension;
    // eslint-disable-next-line react/no-unused-prop-types
    size: PlannerNodeSize;
    className?: string;
    // eslint-disable-next-line react/no-unused-prop-types
    viewOnly?: boolean;
    focused?: boolean;
    showPortal?: boolean;
    blockMatrix?: number[][];
    actions?: PlannerAction<any>[];
    onMouseEnter?: (context: ActionContext) => void;
    onMouseOver?: (context: ActionContext) => void;
    onMouseLeave?: (context: ActionContext) => void;
    style?: React.CSSProperties;
    clusterIndex?: number;
    clusterSize?: number;
}> = (props) => {
    const planner = useContext(PlannerContext);
    const [cursorState, setCursorState] = useState({ focus: true, position: { x: 0, y: 0 } });
    const rootRef = useRef<SVGSVGElement>(null);

    // Add some delay to make the actionButtons less intrusive
    const [showActions, setShowActions] = useState(false);
    useEffect(() => {
        let timeout: NodeJS.Timeout;

        if (cursorState.focus) {
            timeout = setTimeout(() => {
                setShowActions(cursorState.focus);
            }, 300);
        } else {
            setShowActions(false);
        }

        return () => {
            clearTimeout(timeout);
        };
    }, [setShowActions, cursorState.focus]);

    const isTemp =
        props.connection.consumer.blockId === 'temp-block' &&
        props.connection.consumer.resourceName === 'temp-resource';

    const providerId = getResourceId(
        props.connection.provider.blockId,
        props.connection.provider.resourceName,
        ResourceRole.PROVIDES
    );
    const consumerId = getResourceId(
        props.connection.consumer.blockId,
        props.connection.consumer.resourceName,
        ResourceRole.CONSUMES
    );

    const providerPoint = planner.connectionPoints.getPointById(providerId);
    const consumerPoint = planner.connectionPoints.getPointById(consumerId);
    const providerCluster = props.connection.providerClusterId
        ? planner.connectionPoints.getPointById(props.connection.providerClusterId)
        : null;
    const consumerCluster = props.connection.consumerClusterId
        ? planner.connectionPoints.getPointById(props.connection.consumerClusterId)
        : null;

    let connectionValid = useConnectionValidation(props.connection, planner);

    const behaveAsPortal = Boolean(props.connection.portals && props.focused !== true);

    let className = toClass({
        'planner-connection': true,
        invalid: !connectionValid,
        portal: behaveAsPortal,
    });

    if (props.className) {
        className += ` ${props.className}`;
    }

    const points = useMemo(() => {
        if (!providerPoint || !consumerPoint || behaveAsPortal) {
            return [];
        }

        let adjustedProviderCluster = ENABLE_CLUSTERING ? providerCluster : null;
        let adjustedConsumerCluster = ENABLE_CLUSTERING ? consumerCluster : null;

        if (
            adjustedProviderCluster &&
            adjustedConsumerCluster &&
            props.clusterIndex !== undefined &&
            props.clusterSize !== undefined &&
            props.clusterSize > 1
        ) {
            const yAdjust = ((props.clusterSize - 1) / 2) * -CLUSTER_INDEX_OFFSET;
            const clusterOffset = yAdjust + props.clusterIndex * CLUSTER_INDEX_OFFSET;
            adjustedProviderCluster = {
                x: adjustedProviderCluster.x,
                y: adjustedProviderCluster.y + clusterOffset,
            };
            adjustedConsumerCluster = {
                x: adjustedConsumerCluster.x,
                y: adjustedConsumerCluster.y + clusterOffset,
            };
        }

        let from = adjustedProviderCluster ?? providerPoint;
        let to = adjustedConsumerCluster ?? consumerPoint;

        const fromX = Math.round((from.x + POINT_PADDING_X) / CELL_SIZE) * CELL_SIZE;
        const toX = Math.round((to.x - POINT_PADDING_X) / CELL_SIZE) * CELL_SIZE;

        const startingPoints = adjustedProviderCluster
            ? createSimplePath(providerPoint, adjustedProviderCluster)
            : [[from.x, from.y]];
        const endingPoints = adjustedConsumerCluster
            ? createSimplePath(adjustedConsumerCluster, consumerPoint, true)
            : [[to.x, to.y]];

        const fallbackPath = createSimplePathVia(
            providerPoint,
            providerPoint.x + POINT_PADDING_X,
            consumerPoint,
            consumerPoint.x - POINT_PADDING_X
        );

        // Special handling of temp-connections
        if (isTemp || !props.blockMatrix) {
            return fallbackPath;
        }

        if (fromX > toX && Math.abs(from.y - to.y) < 200) {
            // Below the minimum distance, just draw a straight line
            return fallbackPath;
        }

        const matrixStart = [fromX, from.y];
        const matrixEnd = [toX, to.y];

        const start: [number, number] = matrixStart.map((v) => Math.floor(v / CELL_SIZE)) as [number, number];
        const end: [number, number] = matrixEnd.map((v) => Math.floor(v / CELL_SIZE)) as [number, number];

        const matrix = _.cloneDeep(props.blockMatrix);
        applyObstacles(
            matrix,
            [
                {
                    x: toX + CELL_SIZE,
                    y: to.y - 50 / 2,
                    width: 2,
                    height: 190,
                },
                {
                    x: fromX - CELL_SIZE,
                    y: from.y - 50 / 2,
                    width: 2,
                    height: 190,
                },
            ],
            [CELL_SIZE, CELL_SIZE]
        );

        // Note: PF.Grid can't be reused, so we create a new one each time
        const grid = new PF.Grid(props.blockMatrix);
        const matrixPath = findMatrixPath(start, end, grid);

        if (matrixPath.length < 2) {
            // If the path is blocked, just draw a straight line
            return fallbackPath;
        }

        const rawPath = convertMatrixPathToPoints(matrixPath, {
            offsetX: 0,
            offsetY: from.y % CELL_SIZE,
            stepX: CELL_SIZE,
            stepY: CELL_SIZE,
        });

        // We always want to end on a horizontal line
        const prevPoint = rawPath[rawPath.length - 2];
        const lastPoint = rawPath[rawPath.length - 1];
        // vertical line, replace last point
        if (lastPoint[0] === prevPoint[0]) {
            lastPoint[1] = to.y;
        } else if (lastPoint[1] === prevPoint[1]) {
            // horizontal line, add a new point
            rawPath.push([lastPoint[0], to.y]);
        }

        // we want to start on a horizontal line
        const firstPoint = rawPath[0];
        const secondPoint = rawPath[1];
        if (firstPoint[0] === secondPoint[0]) {
            firstPoint[1] = from.y;
        } else if (firstPoint[1] === secondPoint[1]) {
            rawPath.unshift([firstPoint[0], from.y]);
        }

        return [...startingPoints, ...rawPath, ...endingPoints];
    }, [
        providerPoint?.x,
        providerPoint?.y,
        consumerPoint?.x,
        consumerPoint?.y,
        providerCluster?.x,
        providerCluster?.y,
        consumerCluster?.x,
        consumerCluster?.y,
        props.blockMatrix,
        isTemp,
        behaveAsPortal,
    ]);

    if (!providerPoint || !consumerPoint) {
        // Where can we render this error if there is no destination?
        return null;
    }

    const paths: PathInfo[] = [];

    if (behaveAsPortal) {
        const showProviderPortal = props.showPortal !== false;
        const ACTION_POINT_OFFSET = 100;
        const BUTTON_OFFSET = 20;
        const providerPortalPoint = {
            x: providerPoint.x + ACTION_POINT_OFFSET,
            y: providerPoint.y,
        };
        const providerPortal = createSimplePath(providerPoint, providerPortalPoint);
        paths.push({
            path: pointsToSVG(providerPortal),
            actionsPoint: {
                ...providerPortalPoint,
                x: providerPortalPoint.x + BUTTON_OFFSET,
            },
            portalPoint: showProviderPortal ? providerPortalPoint : undefined,
            pointType: 'center',
            provider: true,
        });

        const consumerPortalPoint = {
            x: consumerPoint.x - ACTION_POINT_OFFSET,
            y: consumerPoint.y,
        };
        const consumerPortal = createSimplePath(consumerPoint, consumerPortalPoint);
        paths.push({
            path: pointsToSVG(consumerPortal),
            actionsPoint: {
                ...consumerPortalPoint,
                x: consumerPortalPoint.x - BUTTON_OFFSET,
            },
            portalPoint: consumerPortalPoint,
            pointType: 'center',
            provider: false,
        });
    } else {
        const svgPath = pointsToSVG(points);
        const path = replaceJoinsWithArcs(svgPath, 10);
        const actionsPoint = getPathMidpoint(points);

        paths.push({
            path,
            actionsPoint,
            pointType: 'center',
        });
    }

    const actionContext = {
        connection: props.connection,
    };

    // Transform to relative to root svg ref
    const getPosition = (evtX: number, evtY: number) => {
        if (!rootRef.current) {
            return { x: 0, y: 0 };
        }
        const rootX = rootRef.current.getBoundingClientRect().x;
        const rootY = rootRef.current.getBoundingClientRect().y;
        const x = (evtX - rootX) / (planner.zoom || 1);
        const y = (evtY - rootY) / (planner.zoom || 1);

        const pathP = nearestPointOnPath([x, y], points);

        return { x: pathP[0], y: pathP[1] };
    };

    return (
        <svg style={{ position: 'absolute', zIndex: -1, top: 0, left: 0, ...props.style }} ref={rootRef}>
            <g
                className={className.trim()}
                onMouseEnter={(evt) => {
                    if (props.onMouseEnter) {
                        props.onMouseEnter(actionContext);
                    }
                    setCursorState((state) => ({
                        position: getPosition(evt.clientX, evt.clientY),
                        focus: true,
                    }));
                }}
                onMouseOver={(evt) => {
                    if (props.onMouseOver) {
                        props.onMouseOver(actionContext);
                    }
                    setCursorState((state) => ({
                        ...state,
                        focus: true,
                    }));
                }}
                onMouseOut={() => {
                    setCursorState((state) => ({ ...state, focus: false }));
                    if (props.onMouseLeave) {
                        props.onMouseLeave(actionContext);
                    }
                }}
            >
                {paths.map((pathInfo, ix) => {
                    return (
                        <g key={ix}>
                            <path className="mouse-catcher" d={pathInfo.path} />
                            <path className="background" d={pathInfo.path} />

                            {behaveAsPortal && pathInfo.portalPoint && (
                                <svg
                                    x={-23}
                                    y={pathInfo.portalPoint.y - 25}
                                    width={10}
                                    height={30}
                                    style={{ zIndex: 10, position: 'relative' }}
                                >
                                    <g className={'portal'} transform={`translate(${pathInfo.portalPoint.x},0)`}>
                                        <ellipse cx="25" cy="25" rx="5" ry="5" fill={'inherit'} />
                                    </g>
                                </svg>
                            )}

                            <path className="line" d={pathInfo.path} />

                            {props.actions && (
                                <ActionButtons
                                    show={showActions}
                                    pointType={pathInfo.pointType}
                                    x={cursorState.position.x}
                                    y={cursorState.position.y}
                                    actions={props.actions}
                                    actionContext={actionContext}
                                />
                            )}
                        </g>
                    );
                })}
            </g>
        </svg>
    );
};
