import { useState, useMemo, RefObject, useLayoutEffect } from 'react';
import { ZoomTransform } from 'd3-zoom';
import { calculateFitToParent, calculateCenterInParent } from './helpers';
import { Rectangle } from '../types';

export const useMeasureElement = <E extends Element = Element>(externalRef: RefObject<E>): Rectangle => {
    const [rect, setRect] = useState<Rectangle>({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
    });

    const observer = useMemo(
        () =>
            new ResizeObserver((entries) => {
                if (entries[0]) {
                    const { x, y, width, height } = entries[0].contentRect;
                    setRect({ x, y, width, height });
                }
            }),
        []
    );

    useLayoutEffect(() => {
        const element = externalRef.current;
        if (!element) {
            return undefined;
        }
        observer.observe(element);
        return () => {
            observer.disconnect();
        };
    }, [externalRef, observer]);

    return rect;
};

export type UseFitChildInParentResult = {
    transformToFitView: ZoomTransform;
    transformToCenter: ZoomTransform;
};

export const useFitChildInParent = (parentBBox?: Rectangle, childBBox?: Rectangle): UseFitChildInParentResult => {
    const transformToFitView = useMemo(() => {
        if (!parentBBox || !childBBox) {
            return new ZoomTransform(1, 0, 0);
        }
        return calculateFitToParent(parentBBox, childBBox);
    }, [childBBox, parentBBox]);

    const transformToCenter = useMemo(() => {
        if (!parentBBox || !childBBox) {
            return new ZoomTransform(1, 0, 0);
        }
        return calculateCenterInParent(parentBBox, childBBox);
    }, [childBBox, parentBBox]);

    return {
        transformToFitView,
        transformToCenter,
    };
};
