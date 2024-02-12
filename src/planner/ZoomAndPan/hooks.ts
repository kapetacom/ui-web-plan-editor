/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { useState, useMemo, RefObject, useLayoutEffect, ReactNode, useContext } from 'react';
import { ZoomTransform } from 'd3-zoom';
import { calculateFitToParent, calculateCenterInParent } from './helpers';
import { Rectangle } from '../types';
import { PlannerContext } from '../PlannerContext';
import { BlockTypeProvider } from '@kapeta/ui-web-context';
import { calculateBlockSize } from '../BlockContext';
import { BlockMode } from '../../utils/enums';
import { has } from 'lodash';

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

export function useMeasureChildren(
    containerRef: RefObject<HTMLElement>,
    children: ReactNode,
    transform: [number, number, number]
): Rectangle[] {
    const [rectangles, setRectangles] = useState<Rectangle[]>([]);

    const [x, y, k] = transform;

    useLayoutEffect(() => {
        if (containerRef.current) {
            const newRectangles: Rectangle[] = [];
            const childrenElements = containerRef.current.children;
            for (let i = 0; i < childrenElements.length; i++) {
                const child = childrenElements[i];
                const rect = child.getBoundingClientRect();
                newRectangles.push({
                    x: rect.left - x,
                    y: rect.top - y,
                    width: rect.width / k,
                    height: rect.height / k,
                });
            }
            setRectangles(newRectangles);
        }
    }, [containerRef, children, x, y, k]); // Re-run if children change

    return rectangles;
}

export const useGetPlanObstacles = (): Rectangle[] => {
    const planner = useContext(PlannerContext);

    if (!planner.plan?.spec.blocks) {
        return [];
    }

    const PADDING = 10;
    const RESOURCE_WIDTH = 35;

    const obstacles = planner.plan.spec.blocks.map((block) => {
        const {
            dimensions: { left, top, width, height },
        } = block;

        const rect: Rectangle = {
            x: left,
            y: top,
            width,
            height,
        };

        const blockDefinition = planner.getBlockById(block.id);
        if (!blockDefinition) {
            return rect;
        }

        const blockType = BlockTypeProvider.get(blockDefinition.kind);
        const { instanceBlockWidth, instanceBlockHeight } = calculateBlockSize({
            nodeSize: planner.nodeSize,
            blockType,
            blockMode: BlockMode.SHOW,
            blockDefinition,
        });

        rect.width = Math.max(rect.width, instanceBlockWidth);
        rect.height = Math.max(rect.height, instanceBlockHeight);

        // Add padding for resources
        const hasConsumers = (blockDefinition.spec.consumers || []).length > 0;
        const hasProviders = (blockDefinition.spec.providers || []).length > 0;
        if (hasConsumers) {
            rect.x -= RESOURCE_WIDTH;
            rect.width += RESOURCE_WIDTH;
        }
        if (hasProviders) {
            rect.width += RESOURCE_WIDTH;
        }

        // Add general padding
        rect.x -= PADDING;
        rect.y -= PADDING;
        rect.width += PADDING * 2;
        rect.height += PADDING * 2;

        return rect;
    });

    return obstacles;
};

// export const useMeasureElements = <E extends Element = Element>(externalRefs: RefObject<E>[]): Rectangle[] => {
//     const [rects, setRects] = useState<Rectangle[]>([]);

//     const observer = useMemo(
//         () =>
//             new ResizeObserver((entries) => {
//                 const newRects = entries.map((entry) => {
//                     const { x, y, width, height } = entry.contentRect;
//                     return { x, y, width, height };
//                 });
//                 setRects(newRects);
//             }),
//         []
//     );

//     useLayoutEffect(() => {
//         const elements = externalRefs.map((ref) => ref.current);
//         if (elements.length === 0) {
//             return undefined;
//         }
//         elements.forEach((element) => {
//             if (element) {
//                 observer.observe(element);
//             }
//         });
//         return () => {
//             observer.disconnect();
//         };
//     }, [externalRefs, observer]);

//     return rects;
// };

export type UseFitChildInParentResult = {
    transformToFitView: ZoomTransform | undefined;
    transformToCenter: ZoomTransform | undefined;
    transformToCenterWithScaleDown: ZoomTransform | undefined;
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
                transformToFitView: undefined,
                transformToCenter: undefined,
                transformToCenterWithScaleDown: undefined,
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
