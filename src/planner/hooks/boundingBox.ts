import { useCallback, useMemo, useState } from 'react';

/**
 * Track the bounding box size of a ref by using onRef callback
 */
export const useBoundingBox = () => {
    const defaultState = useMemo(
        () => ({
            height: 0,
            width: 0,
            top: 0,
            left: 0,
        }),
        []
    );
    const [value, setBoundingBox] = useState(defaultState);
    const onRef = useCallback(
        (ref: HTMLElement | null) => {
            if (ref === null) {
                setBoundingBox(defaultState);
            } else {
                setBoundingBox(ref.getBoundingClientRect());
            }
        },
        [setBoundingBox, defaultState]
    );

    return {
        onRef,
        value,
    };
};
