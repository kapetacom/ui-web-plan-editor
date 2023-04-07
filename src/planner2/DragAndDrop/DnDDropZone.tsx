import React, { useContext, useEffect, useMemo, useState } from 'react';
import { DropZoneEntity } from './DropZoneManager';
import { DnDContext } from './DnDContext';
import { randomUUID } from '../../utils/cryptoUtils';
import { Point } from '@kapeta/ui-web-types';

type Offset = { top: number; left: number };
type ScrollListener = (offset: Offset) => void;

export class DnDZoneInstance {
    private _listeners: ScrollListener[] = [];
    private offset: Offset = { top: 0, left: 0 };
    private readonly valid: boolean;
    constructor(valid: boolean = false) {
        this.valid = valid;
    }

    public isValid() {
        return this.valid;
    }

    setOffset(offset: Offset) {
        this.offset = offset;
        this._listeners.forEach((listener) => {
            listener(offset);
        });
    }

    getOffset() {
        return this.offset;
    }

    onScrollChange(callback: ScrollListener) {
        this._listeners.push(callback);
        return () => {
            this._listeners.splice(this._listeners.indexOf(callback), 1);
        };
    }

    getZoneCoordinates(coords: Point) {
        return {
            x: coords.x + this.offset.left,
            y: coords.y + this.offset.top,
        };
    }
}
export const DnDZoneContext = React.createContext(new DnDZoneInstance(false));

interface DropZoneProps<T> {
    scale?: number;
    accept?: DropZoneEntity<T>['accept'];
    onDragEnter?: DropZoneEntity<T>['onDragEnter'];
    onDragLeave?: DropZoneEntity<T>['onDragLeave'];
    onDragOver?: DropZoneEntity<T>['onDragOver'];
    onDrop?: DropZoneEntity<T>['onDrop'];
}

type DropZoneChildrenProps = {
    children: (props: { onRef: (elm: Element | null) => void }) => JSX.Element;
};

export const DnDDropZone: <T>(props: DropZoneProps<T> & DropZoneChildrenProps) => JSX.Element = (props) => {
    const id = useMemo(() => randomUUID(), []);
    const { callbacks } = useContext(DnDContext);
    const [element, setElement] = useState<HTMLElement | null>(null);

    const instance = useMemo(() => new DnDZoneInstance(true), []);

    const onRef = (ref) => {
        setElement(ref);
    };

    useEffect(() => {
        if (!element) return;

        callbacks.registerDropZone(id, {
            ...props,
            element,
            instance,
        });
    });

    useEffect(
        () => () => {
            //     Cleanup only
            callbacks.unregisterDropZone(id);
        },
        [callbacks, id]
    );

    useEffect(() => {
        if (!element) {
            return () => {};
        }

        const cb = () => {
            const top = element.scrollTop;
            const left = element.scrollLeft;

            instance.setOffset({
                top,
                left,
            });
        };

        cb();

        element.addEventListener('scroll', cb);
        return (): void => {
            element.removeEventListener('scroll', cb);
        };
    }, [element, instance]);

    return (
        <DnDZoneContext.Provider value={instance}>
            {props.children({
                onRef,
            })}
        </DnDZoneContext.Provider>
    );
};
