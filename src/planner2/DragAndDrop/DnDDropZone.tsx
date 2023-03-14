import { useContext, useEffect, useMemo, useState } from 'react';
import { DropZoneEntity } from './DropZoneManager';
import { DnDContext } from './DnDContext';

interface DropZoneProps<T> {
    accept?: DropZoneEntity<T>['accept'];
    onDragEnter?: DropZoneEntity<T>['onDragEnter'];
    onDragLeave?: DropZoneEntity<T>['onDragLeave'];
    onDragOver?: DropZoneEntity<T>['onDragOver'];
    onDrop?: DropZoneEntity<T>['onDrop'];
}
export const useDropZone = <T,>({
    accept,
    onDrop,
    onDragOver,
    onDragLeave,
    onDragEnter,
}: DropZoneProps<T>) => {
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

    return {
        onRef,
    };
};

export const DnDDropZone: <T>(
    props: Parameters<typeof useDropZone<T>>[0] & {
        children: (props: ReturnType<typeof useDropZone<T>>) => JSX.Element;
    }
) => JSX.Element = (props) => {
    const zone = useDropZone(props);
    return props.children(zone);
};
