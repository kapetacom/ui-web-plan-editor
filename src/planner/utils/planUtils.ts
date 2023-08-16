import { AssetInfo, PlannerNodeSize } from '../../types';
import { ResourceRole, Size } from '@kapeta/ui-web-types';
import { BlockDefinition, BlockInstance } from '@kapeta/schemas';
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
    size: PlannerNodeSize,
    containerSize: Size
) => {
    // We want the canvas to always have enough space for the block + connections, even at the edges
    const canvasPadding = 150;
    let maxWidth = 50;
    let maxHeight = 50;
    let minX = 0;
    let minY = 0;

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
            const bottom = dimensions.top + getReservedBlockHeight(blockDefinition.content, size);
            const right = dimensions.left + dimensions.width + canvasPadding;
            const y = dimensions.top;
            const x = dimensions.left;
            if (maxHeight < bottom) {
                maxHeight = bottom;
            }
            if (maxWidth < right) {
                maxWidth = right;
            }
            if (y < minY) {
                minY = y;
            }
            if (x < minX) {
                minX = x;
            }
        });
    }

    return {
        x: minX,
        y: minY,
        width: Math.max(maxWidth, containerSize.width),
        height: Math.max(maxHeight, containerSize.height),
    };
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

export function getBlockInstance(plan, blockId) {
    return plan.spec.blocks.find((block) => block.id === blockId);
}
