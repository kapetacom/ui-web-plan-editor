import React, { useContext, useEffect, useMemo, useState } from 'react';
import { DropZoneEntity } from './DropZoneManager';
import { DnDContext } from './DnDContext';

class DnDZoneInstance {
    scale = 1;
    scrollOffset = { top: 0, left: 0 };

    getZoneCoordinates(coords: { y: number; x: number }) {
        return {
            x: coords.x + this.scrollOffset.left,
            y: coords.y + this.scrollOffset.top,
        };
    }
}
export const DnDZoneContext = React.createContext(new DnDZoneInstance());

interface DropZoneProps<T> {
    scale?: number;
    accept?: DropZoneEntity<T>['accept'];
    onDragEnter?: DropZoneEntity<T>['onDragEnter'];
    onDragLeave?: DropZoneEntity<T>['onDragLeave'];
    onDragOver?: DropZoneEntity<T>['onDragOver'];
    onDrop?: DropZoneEntity<T>['onDrop'];
}

export const DnDDropZone: <T>(
    props: DropZoneProps<T> & {
        children: (props: {
            onRef: (elm: HTMLElement | null) => void;
        }) => JSX.Element;
    }
) => JSX.Element = ({
    scale = 1,
    accept,
    onDrop,
    onDragOver,
    onDragLeave,
    onDragEnter,
    children,
}) => {
    const id = useMemo(() => crypto.randomUUID(), []);
    const { callbacks } = useContext(DnDContext);
    const [element, setElement] = useState<HTMLElement | null>(null);

    const onRef = (ref) => {
        setElement(ref);
    };

    useEffect(() => {
        if (!element) return;

        callbacks.registerDropZone(id, {
            element,
            accept,
            onDragEnter,
            onDragOver,
            onDragLeave,
            onDrop,
        });
    });

    useEffect(
        () => () => {
            //     Cleanup only
            callbacks.unregisterDropZone(id);
        },
        [callbacks, id]
    );

    const instance = useMemo(() => new DnDZoneInstance(), []);
    useEffect(() => {
        const cb = () => {
            instance.scrollOffset.top = element?.scrollTop || 0;
            instance.scrollOffset.left = element?.scrollLeft || 0;
        };
        element?.addEventListener('scroll', cb);
        return () => element?.removeEventListener('scroll', cb);
    }, [element, instance]);

    return (
        <DnDZoneContext.Provider value={instance}>
            {children({
                onRef,
            })}
        </DnDZoneContext.Provider>
    );
};
