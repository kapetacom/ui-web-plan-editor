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
 */
export const calculateFitToParent = (parentBBox: Rectangle, childBBox: Rectangle): ZoomTransform => {
    // Compute scale respecting aspect ratio
    const scaleX = parentBBox.width / childBBox.width;
    const scaleY = parentBBox.height / childBBox.height;
    const scale = Math.min(scaleX, scaleY);

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
