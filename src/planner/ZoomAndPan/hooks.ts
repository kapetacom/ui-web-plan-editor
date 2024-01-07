/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

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
    transformToCenterWithScaleDown: ZoomTransform;
};

export const useFitChildInParent = (parentBBox?: Rectangle, childBBox?: Rectangle): UseFitChildInParentResult => {
    // The reason we split the parent and child bounding boxes and then put them back together in
    // the useMemo hook is because we want to make sure that the useMemo hook is only called when
    // the the values inside the bounding boxes change.

    const px = parentBBox?.x ?? 0;
    const py = parentBBox?.y ?? 0;
    const pw = parentBBox?.width ?? 0;
    const ph = parentBBox?.height ?? 0;

    const cx = childBBox?.x ?? 0;
    const cy = childBBox?.y ?? 0;
    const cw = childBBox?.width ?? 0;
    const ch = childBBox?.height ?? 0;

    const transforms = useMemo(() => {
        if (px + py + pw + ph === 0 || cx + cy + cw + ch === 0) {
            return {
                transformToFitView: new ZoomTransform(1, 0, 0),
                transformToCenter: new ZoomTransform(1, 0, 0),
                transformToCenterWithScaleDown: new ZoomTransform(1, 0, 0),
            };
        }

        const pBBox = { x: px, y: py, width: pw, height: ph };
        const cBBox = { x: cx, y: cy, width: cw, height: ch };

        return {
            transformToFitView: calculateFitToParent(pBBox, cBBox),
            transformToCenter: calculateCenterInParent(pBBox, cBBox),
            transformToCenterWithScaleDown: calculateFitToParent(
                pBBox,
                cBBox,
                1 // Setting maxScale to 1 to make sure the child is not scaled up
            ),
        };
    }, [px, py, pw, ph, cx, cy, cw, ch]);

    return transforms;
};
