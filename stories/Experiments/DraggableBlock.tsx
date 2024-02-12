import React, { ReactNode, useRef, useMemo, useEffect } from 'react';
import { select } from 'd3-selection';
import { drag, D3DragEvent } from 'd3-drag';

export interface DraggableBlockProps {
    id: string;
    x: number;
    y: number;
    zoom?: number;
    children: ReactNode;
    onDragStart?: (id: string, x: number, y: number) => void;
    onDrag?: (id: string, x: number, y: number) => void;
    onDragEnd?: (id: string, x: number, y: number) => void;
}

export const DraggableBlock = (props: DraggableBlockProps) => {
    const { id, x, y, zoom = 1, children, onDragStart, onDrag, onDragEnd } = props;

    // const [coordinates, setCoordinates] = React.useState({ x: x, y: y });
    const ref = useRef<HTMLDivElement>(null);

    // offset for the difference between block position and mouse position on drag start
    const coordinatesRef = useRef({ x: x, y: y });
    const offsetRef = useRef({ x: 0, y: 0 });

    const dragBehaviour = useMemo(
        () =>
            drag<HTMLDivElement, unknown>()
                .on('start', (event: D3DragEvent<HTMLDivElement, unknown, HTMLDivElement>) => {
                    offsetRef.current = { x: event.sourceEvent.offsetX * zoom, y: event.sourceEvent.offsetY * zoom };
                    onDragStart?.(id, event.x, event.y);
                })
                .on('drag', (event: D3DragEvent<HTMLDivElement, unknown, HTMLDivElement>) => {
                    const nextX = (event.x - offsetRef.current.x) / zoom;
                    const nextY = (event.y - offsetRef.current.y) / zoom;
                    coordinatesRef.current = { x: nextX, y: nextY };
                    ref.current!.style.left = `${nextX}px`;
                    ref.current!.style.top = `${nextY}px`;
                    onDrag?.(id, nextX, nextY);
                })
                .on('end', (event: D3DragEvent<HTMLDivElement, unknown, HTMLDivElement>) => {
                    onDragEnd?.(id, coordinatesRef.current.x, coordinatesRef.current.y);
                }),
        [zoom, onDragStart, id, onDrag, onDragEnd]
    );

    // On mount, initialize the drag behavior
    useEffect(() => {
        const block = ref.current;
        if (block) {
            select(block).call(dragBehaviour);
        }
        return () => {
            select(block).on('.drag', null);
        };
    }, [dragBehaviour]);

    return (
        <div
            ref={ref}
            id={id}
            style={{
                position: 'absolute',
                left: `${coordinatesRef.current.x}px`,
                top: `${coordinatesRef.current.y}px`,
                width: '150px',
                height: '100px',
                padding: '16px',
                background: 'white',
                borderRadius: '4px',
                outline: '1px solid #e4e4e4',
            }}
        >
            {children}
        </div>
    );
};
