/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { AssetInfo, PlannerNodeSize } from '../../types';
import { ResourceRole } from '@kapeta/ui-web-types';
import { BlockDefinition, BlockInstance, Plan } from '@kapeta/schemas';
import { parseKapetaUri } from '@kapeta/nodejs-utils';

export const BLOCK_SIZE = 150;

export const RESOURCE_HEIGHTS = {
    [PlannerNodeSize.SMALL]: 30,
    [PlannerNodeSize.MEDIUM]: 52,
    [PlannerNodeSize.FULL]: 65,
};

export const calculateCanvasSize = (
    blocks: BlockInstance[],
    blockAssets: AssetInfo<BlockDefinition>[],
    size: PlannerNodeSize
) => {
    // We want the canvas to always have enough space for the block + connections, even at the edges
    const CANVAS_PADDING = [50, 220]; // top/bottom, left/right

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    if (blocks && blocks.length > 0) {
        blocks.forEach((instance) => {
            const dimensions = instance.dimensions ?? {
                left: 0,
                top: 0,
                height: 0,
                width: 0,
            };

            const blockUri = parseKapetaUri(instance.block.ref);
            const blockDefinition = blockAssets.find((blockAsset) => parseKapetaUri(blockAsset.ref).equals(blockUri));
            if (!blockDefinition) {
                console.warn('Could not find block for instance when calculating canvas size', instance);
                return;
            }
            const blockHeight = getReservedBlockHeight(blockDefinition.content, size);
            const blockWidth = dimensions.width;
            const blockY = dimensions.top;
            const blockX = dimensions.left;

            if (blockX < minX) {
                minX = blockX;
            }

            if (blockY < minY) {
                minY = blockY;
            }

            if (blockX + blockWidth > maxX) {
                maxX = blockX + blockWidth;
            }

            if (blockY + blockHeight > maxY) {
                maxY = blockY + blockHeight;
            }
        });
    }

    const canvasSize = {
        x: minX - CANVAS_PADDING[1],
        y: minY - CANVAS_PADDING[0],
        width: maxX - minX + CANVAS_PADDING[1] * 2,
        height: maxY - minY + CANVAS_PADDING[0] * 2,
    };

    return canvasSize;
};

/**
 * Estimate the block height for high level layout operations such as canvas size calculation
 * Will not be accurate for blocks with custom heights, but should be good enough for most cases
 */
export function getReservedBlockHeight(block: BlockDefinition, size: PlannerNodeSize) {
    // get connections for block?
    const providesCount = block.spec.providers?.length || 0;
    const consumesCount = block.spec.consumers?.length || 0;

    const resourceCount = Math.max(consumesCount, providesCount);
    const blockResourceHeight = RESOURCE_HEIGHTS[size] * resourceCount;

    return getDefaultBlockHeight(blockResourceHeight) + 20;
}

export function getDefaultBlockHeight(blockResourceHeight: number) {
    return Math.max(BLOCK_SIZE, 70 + blockResourceHeight);
}

export function getResourceId(blockId: string, resourceName: string, resourceRole: ResourceRole) {
    return `${blockId}__${resourceName}__${resourceRole}`;
}

export function getBlockInstance(plan: Plan, blockId: string) {
    return plan.spec?.blocks?.find((block) => block.id === blockId);
}
