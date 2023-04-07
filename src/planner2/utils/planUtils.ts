import { PlannerNodeSize } from '../../types';
import { Asset, BlockInstanceSpec, BlockKind, ResourceRole, Size } from '@kapeta/ui-web-types';
import { randomUUID } from '../../utils/cryptoUtils';

export const BLOCK_SIZE = 150;

export const resourceHeight = {
    [PlannerNodeSize.SMALL]: 30,
    [PlannerNodeSize.MEDIUM]: 40,
    [PlannerNodeSize.FULL]: 50,
};

export const calculateCanvasSize = (
    blocks: BlockInstanceSpec[],
    blockAssets: Asset<BlockKind>[],
    size: PlannerNodeSize,
    containerSize: Size
) => {
    let maxWidth = 50;
    let maxHeight = 50;
    let minX = 0;
    let minY = 0;

    if (blocks && blocks.length > 0) {
        blocks.forEach((block) => {
            const dimensions = block.dimensions ?? {
                left: 0,
                top: 0,
                height: 0,
                width: 0,
            };

            // TODO: Normalize refs
            const blockKind = blockAssets.find((blockAsset) => blockAsset.ref === block.block.ref);
            if (!blockKind) {
                return;
            }
            const bottom = dimensions.top + calculateBlockHeight(blockKind.data, size);
            const right = dimensions.left + dimensions.width;
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

export function calculateBlockHeight(block: BlockKind, size: PlannerNodeSize) {
    // get connections for block?
    const providesCount = block.spec.providers?.length || 0;
    const consumesCount = block.spec.consumers?.length || 0;

    const resourceCount = Math.max(consumesCount, providesCount);

    return getBlockHeightByResourceCount(resourceCount, size);
}

export function getBlockHeightByResourceCount(resourceCount: number, size: PlannerNodeSize) {
    return Math.max(BLOCK_SIZE, 70 + resourceCount * resourceHeight[size]);
}

export function getResourceId(blockId: string, resourceName: string, resourceRole: ResourceRole) {
    return `${blockId}__${resourceName}__${resourceRole}`;
}

export function getBlockInstance(plan, blockId) {
    return plan.spec.blocks.find((block) => block.id === blockId);
}

export function createBlockInstanceForBlock(blockAsset: Asset<BlockKind>): BlockInstanceSpec {
    return {
        block: {
            ref: blockAsset.ref,
        },
        dimensions: {
            width: BLOCK_SIZE,
            height: -1,
            top: 0,
            left: 0,
        },
        id: randomUUID(),
        name: blockAsset.data.metadata.title ?? blockAsset.data.metadata.name,
    };
}
