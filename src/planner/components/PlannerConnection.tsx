import React, { useContext, useMemo, useState } from 'react';
import { PlannerContext } from '../PlannerContext';
import { PlannerNodeSize } from '../../types';
import { ResourceRole } from '@kapeta/ui-web-types';
import { toClass } from '@kapeta/ui-web-utils';
import { getResourceId } from '../utils/planUtils';
import { ActionContext, PlannerAction } from '../types';
import { ActionButtons } from './ActionButtons';
import { ResourceTypeProvider } from '@kapeta/ui-web-context';
import { Connection } from '@kapeta/schemas';
import * as PF from 'pathfinding';

import { fillMatrix } from '../utils/connectionUtils/src/matrix';
import {
    convertMatrixPathToPoints,
    findMatrixPath,
    getPathMidpoint,
    replaceJoinsWithArcs,
} from '../utils/connectionUtils/src/path';
import { DnDContext } from '../DragAndDrop/DnDContext';

import './PlannerConnection.less';

const empty = [];

export const PlannerConnection: React.FC<{
    connection: Connection;
    // eslint-disable-next-line react/no-unused-prop-types
    size: PlannerNodeSize;
    className?: string;
    // eslint-disable-next-line react/no-unused-prop-types
    viewOnly?: boolean;
    actions?: PlannerAction<any>[];
    onMouseEnter?: (context: ActionContext) => void;
    onMouseLeave?: (context: ActionContext) => void;
}> = (props) => {
    const { draggable } = useContext(DnDContext);
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

    const fromResource = planner.getResourceByBlockIdAndName(
        props.connection.provider.blockId,
        props.connection.provider.resourceName,
        ResourceRole.PROVIDES
    );
    const toResource = planner.getResourceByBlockIdAndName(
        props.connection.consumer.blockId,
        props.connection.consumer.resourceName,
        ResourceRole.CONSUMES
    );
    const fromEntities = planner.getBlockById(props.connection.provider.blockId)?.spec.entities?.types || [];
    const toEntities = planner.getBlockById(props.connection.consumer.blockId)?.spec.entities?.types || [];

    let connectionValid = true;
    if (fromResource && toResource) {
        try {
            const converter = ResourceTypeProvider.getConverterFor(fromResource.kind, toResource.kind);
            if (converter) {
                const errors = converter.validateMapping
                    ? converter.validateMapping(props.connection, fromResource, toResource, fromEntities, toEntities)
                    : [];
                connectionValid = errors.length === 0;
            }
        } catch (e) {
            // Ignore in case the resource types are not loaded or the converter is not found
            // eslint-disable-next-line no-console
            console.error('Connection cannot render.', e);
        }
    }

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

    // More horizontal than vertical
    const cellCount = useMemo(() => [30, 20], []);

    // Remove the dragged block from the list of blocks, so that the pathfinding algorithm
    // can is not obstructed by the dragged block
    const draggedBlockId = draggable?.data?.id;
    const blocks = planner.plan?.spec.blocks.filter((block) => block.id !== draggedBlockId) || empty;

    // Minimum connection indent - straight line
    const indent = 20;

    const points = useMemo(() => {
        if (!from || !to) {
            return [];
        }
        const fromX = from.x + indent;
        const toX = to.x - indent;

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
        if (isTemp) {
            return fallbackPath;
        }

        // Do a dynamic cell size based on the distance, to try to get perfect alignment
        // Catch: set a minimum size to avoid creating too many cells
        const cellSizeX = Math.max(5, Math.abs(toX - fromX) / cellCount[0]);
        const cellSizeY = Math.max(5, Math.abs(to.y - from.y) / cellCount[1]);

        const matrix = fillMatrix(
            blocks
                .map((block) => ({
                    x: block.dimensions.left,
                    y: block.dimensions.top,
                    width: block.dimensions.width + 40 || 190,
                    height: Math.max(block.dimensions.height + 40, 190),
                }))
                // block the path from ending from the right during dragging
                .concat([
                    {
                        x: toX + cellSizeX,
                        y: to.y - 190 / 2,
                        width: 2,
                        height: 190,
                    },
                    {
                        x: fromX - cellSizeX,
                        y: from.y - 190 / 2,
                        width: 2,
                        height: 190,
                    },
                ]),
            [Math.ceil(planner.canvasSize.width / cellSizeX), Math.ceil(planner.canvasSize.height / cellSizeY)],
            [cellSizeX, cellSizeY]
        );

        const grid = new PF.Grid(matrix);
        const matrixPath = findMatrixPath(
            [Math.floor(fromX / cellSizeX), Math.floor(from.y / cellSizeY)],
            [Math.floor(toX / cellSizeX), Math.floor(to.y / cellSizeY)],
            grid
        );
        if (matrixPath.length < 2) {
            // If the path is blocked, just draw a straight line
            return fallbackPath;
        }
        const rawPath = convertMatrixPathToPoints(matrixPath, {
            offsetX: 0,
            offsetY: from.y % cellSizeY,
            stepX: cellSizeX,
            stepY: cellSizeY,
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

        return [
            [from.x, from.y],
            // [Math.min(fromX, rawPath[0][0]), from.y],

            ...rawPath,
            //
            [to.x, to.y],
        ];
    }, [from, to, blocks, cellCount, planner.canvasSize.width, planner.canvasSize.height, isTemp]);

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
        <svg style={{ position: 'absolute', zIndex: -1, top: 0, left: 0 }}>
            <g
                className={className.trim()}
                onMouseEnter={() => {
                    if (props.onMouseEnter) {
                        props.onMouseEnter(actionContext);
                    }
                }}
                onMouseOver={() => setHasFocus(true)}
                onMouseOut={() => {
                    setHasFocus(false);
                    if (props.onMouseLeave) {
                        props.onMouseLeave(actionContext);
                    }
                }}
            >
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
