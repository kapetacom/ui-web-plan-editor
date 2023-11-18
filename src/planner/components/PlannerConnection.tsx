/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React, { useContext, useMemo, useState } from 'react';
import { PlannerContext, PlannerContextData } from '../PlannerContext';
import { PlannerNodeSize } from '../../types';
import { ResourceRole } from '@kapeta/ui-web-types';
import { toClass } from '@kapeta/ui-web-utils';
import { getResourceId } from '../utils/planUtils';
import { ActionContext, PlannerAction } from '../types';
import { ActionButtons } from './ActionButtons';
import { ResourceTypeProvider } from '@kapeta/ui-web-context';
import { Connection } from '@kapeta/schemas';
import * as PF from 'pathfinding';
import {
    convertMatrixPathToPoints,
    findMatrixPath,
    getPathMidpoint,
    replaceJoinsWithArcs,
} from '../utils/connectionUtils/src/path';

import './PlannerConnection.less';
import { CELL_SIZE_X, CELL_SIZE_Y, POINT_PADDING_X } from '../utils/connectionUtils';
import { applyObstacles } from '../utils/connectionUtils/src/matrix';
import _ from 'lodash';

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

    if (fromResource && toResource) {
        const fromEntities = planner.getBlockById(connection.provider.blockId)?.spec.entities?.types || [];
        const toEntities = planner.getBlockById(connection.consumer.blockId)?.spec.entities?.types || [];

        try {
            const converter = ResourceTypeProvider.getConverterFor(fromResource.kind, toResource.kind);
            if (converter) {
                const errors = converter.validateMapping
                    ? converter.validateMapping(connection, fromResource, toResource, fromEntities, toEntities)
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

export const PlannerConnection: React.FC<{
    connection: Connection;
    // eslint-disable-next-line react/no-unused-prop-types
    size: PlannerNodeSize;
    className?: string;
    // eslint-disable-next-line react/no-unused-prop-types
    viewOnly?: boolean;
    blockMatrix?: number[][];
    actions?: PlannerAction<any>[];
    onMouseEnter?: (context: ActionContext) => void;
    onMouseOver?: (context: ActionContext) => void;
    onMouseLeave?: (context: ActionContext) => void;
    style?: React.CSSProperties;
}> = (props) => {
    const planner = useContext(PlannerContext);
    const [hasFocus, setHasFocus] = useState(false);

    const isTemp =
        props.connection.consumer.blockId === 'temp-block' &&
        props.connection.consumer.resourceName === 'temp-resource';

    const fromId = getResourceId(
        props.connection.provider.blockId,
        props.connection.provider.resourceName,
        ResourceRole.PROVIDES
    );
    const toId = getResourceId(
        props.connection.consumer.blockId,
        props.connection.consumer.resourceName,
        ResourceRole.CONSUMES
    );

    const from = planner.connectionPoints.getPointById(fromId);
    const to = planner.connectionPoints.getPointById(toId);

    let connectionValid = useConnectionValidation(props.connection, planner);

    let className = toClass({
        'planner-connection': true,
        // highlight: this.props.connection
        //     ? this.props.connection.editing
        //     : false,
        invalid: !connectionValid,
    });

    if (props.className) {
        className += ` ${props.className}`;
    }

    const points = useMemo(() => {
        if (!from || !to) {
            return [];
        }
        const fromX = from.x + POINT_PADDING_X;
        const toX = to.x - POINT_PADDING_X;

        const fallbackPath =
            fromX > toX
                ? [
                      [from.x, from.y],
                      [fromX, from.y],
                      [fromX, from.y + (to.y - from.y) / 2],
                      [toX, from.y + (to.y - from.y) / 2],
                      [toX, to.y],
                      [to.x, to.y],
                  ]
                : [
                      [from.x, from.y],
                      [fromX, from.y],
                      [toX, from.y],
                      [toX, to.y],
                      [to.x, to.y],
                  ];

        // Special handling of temp-connections
        if (isTemp || !props.blockMatrix) {
            return fallbackPath;
        }

        if (fromX > toX && Math.abs(from.y - to.y) < 200) {
            // Below the minimum distance, just draw a straight line
            return fallbackPath;
        }

        const start: [number, number] = [Math.floor(fromX / CELL_SIZE_X), Math.floor(from.y / CELL_SIZE_Y)];
        const end: [number, number] = [Math.floor(toX / CELL_SIZE_X), Math.floor(to.y / CELL_SIZE_Y)];

        const matrix = _.cloneDeep(props.blockMatrix);
        applyObstacles(
            matrix,
            [
                {
                    x: toX + CELL_SIZE_X,
                    y: to.y - 50 / 2,
                    width: 2,
                    height: 190,
                },
                {
                    x: fromX - CELL_SIZE_X,
                    y: from.y - 50 / 2,
                    width: 2,
                    height: 190,
                },
            ],
            [CELL_SIZE_X, CELL_SIZE_Y]
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
            offsetY: from.y % CELL_SIZE_Y,
            stepX: CELL_SIZE_X,
            stepY: CELL_SIZE_Y,
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

        return [[from.x, from.y], ...rawPath, [to.x, to.y]];
    }, [from?.x, from?.y, to?.x, to?.y, props.blockMatrix, isTemp]);

    if (!from || !to) {
        // Where can we render this error if there is no destination?
        return null;
    }

    const path = replaceJoinsWithArcs(`M ${points.map(([x, y]) => `${x} ${y}`).join(' L ')}`, 10);

    const middlePoint = getPathMidpoint(points);

    const actionContext = {
        connection: props.connection,
    };

    return (
        <svg style={{ position: 'absolute', zIndex: -1, top: 0, left: 0, ...props.style }}>
            <g
                className={className.trim()}
                onMouseEnter={() => {
                    if (props.onMouseEnter) {
                        props.onMouseEnter(actionContext);
                    }
                }}
                onMouseOver={() => {
                    if (props.onMouseOver) {
                        props.onMouseOver(actionContext);
                    }
                    setHasFocus(true);
                }}
                onMouseOut={() => {
                    setHasFocus(false);
                    if (props.onMouseLeave) {
                        props.onMouseLeave(actionContext);
                    }
                }}
            >
                <path className="mouse-catcher" d={path} />
                <path className="background" d={path} />
                <path className="line" d={path} />

                {props.connection && middlePoint && props.actions && (
                    <ActionButtons
                        show={hasFocus}
                        x={middlePoint.x}
                        // TODO: how can we avoid the magic number?
                        y={middlePoint.y - 5}
                        actions={props.actions}
                        actionContext={actionContext}
                    />
                )}
            </g>
        </svg>
    );
};
