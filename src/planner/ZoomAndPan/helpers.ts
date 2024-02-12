/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { ZoomTransform } from 'd3-zoom';
import { Rectangle } from '../types';

/**
 * Calculate transform to fit child in parent. The child is scaled to fit the parent.
 * @param parentBBox
 * @param childBBox
 * @param maxScale Maximum scale to apply
 */
export const calculateFitToParent = (
    parentBBox: Rectangle,
    childBBox: Rectangle,
    maxScale = Infinity
): ZoomTransform => {
    // Compute scale respecting aspect ratio
    const scaleX = parentBBox.width / childBBox.width;
    const scaleY = parentBBox.height / childBBox.height;
    const scale = Math.min(scaleX, scaleY, maxScale);

    if (scale === 0) {
        // If scale is 0 then the child is not visible and we return the identity transform (no
        // scaling or translation) to avoid errors in other components
        return new ZoomTransform(1, 0, 0);
    }

    // Scale the child's bounding box dimensions
    const scaledWidth = childBBox.width * scale;
    const scaledHeight = childBBox.height * scale;

    // Calculate centers of scaled child and parent
    const parentCenterX = parentBBox.width / 2;
    const parentCenterY = parentBBox.height / 2;

    // Compute translation by considering the scaled position
    const translateX = parentCenterX - (childBBox.x * scale + scaledWidth / 2);
    const translateY = parentCenterY - (childBBox.y * scale + scaledHeight / 2);

    return new ZoomTransform(scale, translateX, translateY);
};

/**
 * Calculate transform to center child in parent. No scaling is applied (scale = 1).
 * @param parentBBox
 * @param childBBox
 */
export const calculateCenterInParent = (parentBBox: Rectangle, childBBox: Rectangle): ZoomTransform => {
    // Calculate centers of child and parent
    const scaledChildCenterX = childBBox.x + childBBox.width / 2;
    const scaledChildCenterY = childBBox.y + childBBox.height / 2;
    const parentCenterX = parentBBox.width / 2;
    const parentCenterY = parentBBox.height / 2;

    // Compute translation
    const translateX = parentCenterX - scaledChildCenterX;
    const translateY = parentCenterY - scaledChildCenterY;

    return new ZoomTransform(1, translateX, translateY);
};

export const hasOverlap = (rect1: Rectangle, rect2: Rectangle): boolean => {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
};

export const overlapsAny = (rect: Rectangle, rects: Rectangle[]): boolean => {
    return rects.some((r) => hasOverlap(rect, r));
};
