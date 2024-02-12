import React, { useEffect, useMemo, useRef } from 'react';
import { select } from 'd3-selection';
import { SimulationNodeDatum, forceCollide, forceLink, forceSimulation } from 'd3-force';

export interface Block {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

interface Connection {
    source: Block;
    target: Block;
}

interface ConnectionNode extends SimulationNodeDatum {
    type: 'waypoint' | 'obstacle';
    radius: number;
}

const isWaypoint = (node: ConnectionNode): node is ConnectionNode & { type: 'waypoint' } => {
    return node.type === 'waypoint';
};

const isObstacle = (node: ConnectionNode): node is ConnectionNode & { type: 'obstacle' } => {
    return node.type === 'obstacle';
};

interface Link {
    source: ConnectionNode;
    target: ConnectionNode;
}

function generatePointsOnLine(a: [number, number], b: [number, number], maxDistance: number): [number, number][] {
    // Calculate the distance between a and b
    const distance = Math.sqrt((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2);

    if (maxDistance <= 0) {
        throw new Error('maxDistance must be greater than 0.');
    }

    // Calculate the number of points to be generated
    const numPoints = Math.max(Math.ceil(distance / maxDistance), 1) + 1; // +1 to include the endpoint

    const points: [number, number][] = [];
    for (let i = 0; i < numPoints; i++) {
        const t = i / (numPoints - 1); // Normalized position along the line
        const x = a[0] + t * (b[0] - a[0]);
        const y = a[1] + t * (b[1] - a[1]);
        points.push([x, y]);
    }

    return points;
}

export interface BlockConnectionProps {
    connection: Connection;
    obstacles?: Block[];
    debug?: {
        showBlockObstacles?: boolean;
        showPathDots?: boolean;
        showPathLines?: boolean;
    };
}

const eitherOr = <A, B>(a: A, b: B) => a ?? b;

export const BlockConnection = (props: BlockConnectionProps) => {
    const { connection, obstacles, debug = {} } = props;

    const svgRef = useRef<SVGSVGElement>(null);

    const data = useMemo(() => {
        const nodes: ConnectionNode[] = [];
        const links: { source: number; target: number }[] = [];

        const pathPoints: [number, number][] = [
            [connection.source.x + connection.source.width, connection.source.y + connection.source.height / 2],
            ...generatePointsOnLine(
                [
                    connection.source.x + connection.source.width + 20,
                    connection.source.y + connection.source.height / 2,
                ],
                [connection.target.x - 20, connection.target.y + connection.target.height / 2],
                20
            ),
            [connection.target.x, connection.target.y + connection.target.height / 2],
        ];

        pathPoints.forEach(([x, y], index) => {
            const shouldFix =
                index === 0 || index === 1 || index === pathPoints.length - 2 || index === pathPoints.length - 1;
            nodes.push({
                type: 'waypoint',
                index,
                fx: shouldFix ? x : undefined,
                fy: shouldFix ? y : undefined,
                x,
                y,
                radius: 5,
            });
        });

        nodes.forEach((node, index) => {
            if (index === 0) {
                return;
            }
            links.push({
                source: index - 1,
                target: index,
            });
        });

        obstacles?.forEach((obstacle) => {
            const x = obstacle.x + obstacle.width / 2;
            const y = obstacle.y + obstacle.height / 2;
            const w = obstacle.width;
            const h = obstacle.height;
            const radius = Math.sqrt(w * w + h * h) / 2;
            nodes.push({
                type: 'obstacle',
                index: nodes.length,
                fx: x,
                fy: y,
                x,
                y,
                radius: radius + 10,
            });
        });

        return {
            nodes,
            links,
        };
    }, [connection, obstacles]);

    const nodeData = useMemo(() => data.nodes.map((node) => ({ ...node })), [data.nodes]);
    const linkData = useMemo(() => data.links.map((link) => ({ ...link })), [data.links]);

    const showBlockObstacles = debug.showBlockObstacles ?? false;
    const showPathDots = debug.showPathDots ?? false;
    const showPathLines = debug.showPathLines ?? false;

    useEffect(() => {
        const svg = select(svgRef.current);

        const linkLines = svg
            .selectAll('.link-dot')
            .data(
                showPathLines
                    ? linkData.filter((d) => {
                          if (typeof d.source === 'number' || typeof d.target === 'number') {
                              return isWaypoint(nodeData[d.source]) && isWaypoint(nodeData[d.target]);
                          }
                          return isWaypoint(d.source) && isWaypoint(d.target);
                      })
                    : []
            )
            .join('line')
            .attr('class', 'link-dot')
            .attr('stroke', 'black')
            .attr('fill', 'none')
            .attr('x1', (link) => eitherOr(nodeData[link.source]?.x, null))
            .attr('y1', (link) => eitherOr(nodeData[link.source]?.y, null))
            .attr('x2', (link) => eitherOr(nodeData[link.target]?.x, null))
            .attr('y2', (link) => eitherOr(nodeData[link.target]?.y, null));

        const linkDots = svg
            .selectAll('.node')
            .data(showPathDots ? nodeData.filter((d) => isWaypoint(d)) : [])
            .join('circle')
            .attr('class', 'node')
            .attr('r', 2)
            .attr('cx', (node) => (node.x === undefined ? null : node.x))
            .attr('cy', (node) => (node.y === undefined ? null : node.y));

        const blockCircles = svg
            .selectAll('.block-obstacle')
            .data(showBlockObstacles ? nodeData.filter((d) => isObstacle(d)) : [])
            .join('circle')
            .attr('class', 'block-obstacle')
            .attr('fill', 'rgba(255, 0, 0, 0.03)')
            .attr('stroke', 'red')
            .attr('stroke-dasharray', '2,4')
            .attr('r', (node) => node.radius)
            .attr('cx', (node) => (node.x === undefined ? null : node.x))
            .attr('cy', (node) => (node.y === undefined ? null : node.y));

        const tick = () => {
            svg.selectAll<SVGLineElement, Link>('.link-dot')
                .attr('x1', (link) => eitherOr(link.source.x, null))
                .attr('y1', (link) => eitherOr(link.source.y, null))
                .attr('x2', (link) => eitherOr(link.target.x, null))
                .attr('y2', (link) => eitherOr(link.target.y, null));

            linkDots
                .attr('cx', (node) => (node.x === undefined ? null : node.x))
                .attr('cy', (node) => (node.y === undefined ? null : node.y));
        };

        const simulation = forceSimulation(nodeData)
            .force('link', forceLink(linkData).strength(1).distance(10).iterations(1))
            .force(
                'collide',
                forceCollide((node) => {
                    return 'radius' in node ? (node.radius as number) : 4;
                })
            )
            .on('tick', tick);
    }, [showBlockObstacles, linkData, nodeData, showPathLines, showPathDots]);

    return (
        <svg
            ref={svgRef}
            style={{
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                overflow: 'visible',
            }}
        />
    );
};
