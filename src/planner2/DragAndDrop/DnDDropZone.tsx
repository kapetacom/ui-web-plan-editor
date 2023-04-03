import React, { useContext, useEffect, useMemo, useState } from 'react';
import { DropZoneEntity } from './DropZoneManager';
import { DnDContext } from './DnDContext';

type ScrollOffset = { top: number; left: number };
export class DnDZoneInstance {
    private _listeners: ((offset: ScrollOffset) => void)[] = [];
    scale = 1;
    scrollOffset: ScrollOffset = { top: 0, left: 0 };

    setOffset(offset: ScrollOffset) {
        this.scrollOffset = offset;
        this._listeners.forEach((listener) => listener(offset));
    }

    onScrollChange(callback: (offset: ScrollOffset) => void) {
        this._listeners.push(callback);
        return () => {
            this._listeners.splice(this._listeners.indexOf(callback), 1);
        };
    }

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
        children: (props: { onRef: (elm: Element | null) => void }) => JSX.Element;
    }
) => JSX.Element = ({ scale = 1, accept, onDrop, onDragOver, onDragLeave, onDragEnter, children }) => {
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
            instance.setOffset({
                top: element?.scrollTop || 0,
                left: element?.scrollLeft || 0,
            });
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
