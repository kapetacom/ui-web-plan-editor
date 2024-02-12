import React, { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { Rectangle } from '../../types';
import { useGetPlanObstacles } from '../hooks';
import { overlapsAny } from '../helpers';
import { curveBundle, line } from 'd3-shape';
import { forceLink, forceManyBody, forceSimulation, forceX, forceY } from 'd3-force';
import { select } from 'd3-selection';

export type ZoomPanPathGridHandle = {
    updateTransform(x: number, y: number, k: number): void;
};

export interface ZoomPanPathGridProps {
    cellSize?: number;
    debug?: boolean;
    contentBBox: Rectangle | undefined;
    className?: string;
}

type BlockNode = {
    type: 'block';
    x: number;
    y: number;
    width: number;
    height: number;
};

type WaypointNode = {
    type: 'waypoint';
    x: number;
    y: number;
    fx?: number;
    fy?: number;
    radius: number;
};

type Link = {
    source: number;
    target: number;
};

const pathPoints = [
    [445, 90],
    [480, 90],
    [480, 240],
    [600, 240],
    [600, 930],
    [660, 930],
    [660, 960],
    [690, 960],
    [690, 1020],
    [750, 1020],
    [750, 1050],
    [780, 1050],
    [780, 1110],
    [810, 1110],
    [810, 1140],
    [840, 1140],
    [840, 1170],
    [900, 1170],
    [900, 1200.74574094223],
    [948.356029938061, 1200.74574094223],
];

export const ZoomPanPathGrid = forwardRef<ZoomPanPathGridHandle, ZoomPanPathGridProps>((props, ref) => {
    const { cellSize = 30, debug = true, contentBBox, className } = props;

    const waypointsRef = useRef<SVGGElement>(null);
    const blocksRef = useRef<SVGGElement>(null);
    const linksRef = useRef<SVGGElement>(null);

    const [transform, setTransform] = React.useState<[number, number, number]>([0, 0, 1]);

    const obstacleRects = useGetPlanObstacles();

    // Expose updateTransform function to parent
    useImperativeHandle(ref, () => ({
        updateTransform(x: number, y: number, k: number) {
            setTransform([x, y, k]);
        },
    }));

    const gridCells = React.useMemo<(Rectangle & { isObstacle?: boolean })[]>(() => {
        if (!contentBBox) {
            return [];
        }
        const { x, y, width, height } = contentBBox;
        const cells = [];
        for (let i = x; i < width; i += cellSize) {
            for (let j = y; j < height; j += cellSize) {
                const rect = { x: i, y: j, width: cellSize, height: cellSize };
                const isObstacle = overlapsAny(rect, obstacleRects);
                cells.push({ ...rect, isObstacle });
            }
        }
        return cells;
    }, [cellSize, contentBBox, obstacleRects]);

    const data = useMemo(() => {
        const blocks: BlockNode[] = [];
        const waypoints: WaypointNode[] = [];
        const links: Link[] = [];

        obstacleRects.forEach((rect) => {
            blocks.push({
                type: 'block' as const,
                ...rect,
            });
        });

        pathPoints.forEach(([x, y], index) => {
            const isFirst = index === 0;
            const isLast = index === pathPoints.length - 1;
            waypoints.push({
                type: 'waypoint' as const,
                fx: isFirst || isLast ? x : undefined,
                fy: isFirst || isLast ? y : undefined,
                x,
                y,
                radius: 5,
            });
        });

        waypoints.forEach((waypoint, index) => {
            if (index === 0) {
                return;
            }
            links.push({
                source: index - 1,
                target: index,
            });
        });

        return {
            blocks,
            waypoints,
            links,
        };
    }, [obstacleRects]);

    const blocks = data.blocks.map((d) => Object.create(d));
    const waypoints = data.waypoints.map((d) => Object.create(d));
    const links = data.links.map((d) => Object.create(d));

    const simulation = forceSimulation(waypoints)
        .force('charge', forceManyBody().strength(-30))
        .force('link', forceLink(links).strength(1).distance(20).iterations(100))
        .force('x', forceX())
        .force('y', forceY())
        .on('tick', () => {
            select(blocksRef.current)
                .selectAll('rect')
                .attr('x', (d) => (d as BlockNode).x)
                .attr('y', (d) => (d as BlockNode).y);

            select(waypointsRef.current)
                .selectAll('circle')
                .attr('cx', (d) => (d as WaypointNode).x)
                .attr('cy', (d) => (d as WaypointNode).y);

            select(linksRef.current)
                .selectAll('line')
                .attr('x1', (d) => d.source.x)
                .attr('y1', (d) => d.source.y)
                .attr('x2', (d) => d.target.x)
                .attr('y2', (d) => d.target.y);
        });

    const block = select(blocksRef.current)
        .selectAll('rect')
        .data(blocks)
        .join('rect')
        .attr('fill', 'none')
        .attr('x', (d) => (d as BlockNode).x)
        .attr('y', (d) => (d as BlockNode).y)
        .attr('width', (d) => (d as BlockNode).width)
        .attr('height', (d) => (d as BlockNode).height)
        .attr('stroke', '#f00');

    const waypoint = select(waypointsRef.current)
        .selectAll('circle')
        .data(waypoints)
        .join('circle')
        .attr('r', 5)
        .attr('fill', 'green');

    const link = select(linksRef.current)
        .selectAll('line')
        .data(links)
        .join('line')
        .attr('stroke', '#000')
        .attr('stroke-width', 2);

    return (
        <svg
            className={className}
            style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                top: 0,
                left: 0,
            }}
        >
            <g
                style={{
                    transform: `translate(${transform[0]}px, ${transform[1]}px) scale(${transform[2]})`,
                    transformOrigin: 'top left',
                }}
            >
                {gridCells.map(({ x, y, width, height, isObstacle }, i) => (
                    <rect
                        key={i}
                        x={x}
                        y={y}
                        width={width}
                        height={height}
                        fill={isObstacle ? '#ff00001b' : 'none'}
                        stroke="#ccc"
                    />
                ))}
            </g>
            <g
                ref={blocksRef}
                style={{
                    transform: `translate(${transform[0]}px, ${transform[1]}px) scale(${transform[2]})`,
                    transformOrigin: 'top left',
                }}
            />

            <g
                ref={waypointsRef}
                style={{
                    transform: `translate(${transform[0]}px, ${transform[1]}px) scale(${transform[2]})`,
                    transformOrigin: 'top left',
                }}
            />

            <g
                ref={linksRef}
                style={{
                    transform: `translate(${transform[0]}px, ${transform[1]}px) scale(${transform[2]})`,
                    transformOrigin: 'top left',
                }}
            />
        </svg>
    );
});
