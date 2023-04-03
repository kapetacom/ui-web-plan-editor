import { BlockInstanceSpec, BlockKind, PlanKind, Point, ResourceRole, Size } from '@kapeta/ui-web-types';

import { FocusPositioningData, PlannerNodeSize, ZoomAreaMap } from '../../types';
import { BlockInfo, FocusBlockInfo, FocusBlockInfoShallow, ZOOM_STEP_SIZE, ZoomLevels } from '../types';

import { calculateBlockHeight, getBlockInstance } from './planUtils';
import { PlannerConnectionModelWrapper } from '../../wrappers/PlannerConnectionModelWrapper';
import { getConnectionsFor } from './connectionUtils';
import { useContext, useEffect, useMemo } from 'react';
import { PlannerContext } from '../PlannerContext';

export const POSITIONING_DATA = 'preFocusPosition';
export const FOCUSED_ID = 'focusedID';
const OFFSET_FROM_TOP = 20;
const FOCUS_BLOCK_SPACING = 40;

/**
 * Returns the position for the focused block(middle of the screen)
 * @param blockInfo
 * @param block
 * @param positionData
 * @param nodeSize
 */
function getFocusedBlockPosition(blockInfo: BlockInfo, positionData: FocusPositioningData, nodeSize: PlannerNodeSize) {
    if (!blockInfo.instance.dimensions?.width) {
        return { x: 0, y: 0 };
    }

    const x = positionData.plannerWidth / 2 - blockInfo.instance.dimensions?.width / 2;
    const y = positionData.totalUsedHeight / 2 - calculateBlockHeight(blockInfo.block, nodeSize) / 2;
    return { x, y };
}

function getBlockListTotalHeight(blocks: BlockKind[], nodeSize: PlannerNodeSize) {
    let totalHeight = OFFSET_FROM_TOP;
    blocks.forEach((block: BlockKind) => {
        totalHeight += calculateBlockHeight(block, nodeSize) + FOCUS_BLOCK_SPACING;
    });
    return totalHeight;
}

/**
 * Calculate the number of blocks that can fit into the screen horizontally and vertically
 * in the default zoom level
 */

function getBlocksFitToScreen(
    focusInfo: FocusBlockInfo,
    availableSize: Size,
    nodeSize: PlannerNodeSize
): FocusPositioningData {
    // having a x and y as size we can precalculate fitting items before we adjust the zoom level
    let availableHeight = availableSize.height - 100 - OFFSET_FROM_TOP;
    // remove the focused block width first as no blocks may be over or below
    let verticalBlockNumberLeft = 0;
    let verticalBlockNumberRight = 0;
    // since we don't know what the height of the blocks are we calculate for the worst case scenario
    // starting from the tallest block and adding
    for (const blockInfo of focusInfo.providingBlocks) {
        const blockHeight = calculateBlockHeight(blockInfo.block, nodeSize);
        if (availableHeight - blockHeight > 0) {
            verticalBlockNumberLeft++;
            availableHeight -= blockHeight;
        } else {
            break;
        }
    }
    for (const blockInfo of focusInfo.consumingBlocks) {
        const blockHeight = calculateBlockHeight(blockInfo.block, nodeSize);
        if (availableHeight - blockHeight > 0) {
            verticalBlockNumberRight++;
            availableHeight -= blockHeight;
        } else {
            break;
        }
    }

    const totalUsedHeightLeft = getBlockListTotalHeight(
        focusInfo.providingBlocks.map((blockInfo) => blockInfo.block),
        nodeSize
    );

    const totalUsedHeightRight = getBlockListTotalHeight(
        focusInfo.consumingBlocks.map((blockInfo) => blockInfo.block),
        nodeSize
    );

    const focusBlockHeight = OFFSET_FROM_TOP + calculateBlockHeight(focusInfo.focus.block, nodeSize);

    return {
        maxHorizontalBlocks: 3,
        maxVerticalBlocks: Math.max(verticalBlockNumberLeft, verticalBlockNumberRight),
        totalUsedHeightLeft,
        totalUsedHeightRight,
        totalUsedHeight: Math.max(totalUsedHeightLeft, totalUsedHeightRight, focusBlockHeight),
        plannerHeight: availableSize.height,
        plannerWidth: availableSize.width,
    };
}

/**
 * Get the x and y position of a linked block
 * @param blockId
 * @param side  // the side that focusedBlock connects to the in question block
 * @param positionData
 * @param focusBlockInfo
 * @param nodeSize
 */

function getFocusedLinkedBlockPosition(
    blockId: string,
    side: ResourceRole,
    positionData: FocusPositioningData,
    focusBlockInfo: FocusBlockInfo,
    nodeSize: PlannerNodeSize
): Point {
    let blockIndex = focusBlockInfo.all.findIndex((block) => block.instance.id === blockId);
    let y = 0;
    let x = 0;
    const currentBlock = focusBlockInfo.all[blockIndex];
    if (side === ResourceRole.CONSUMES) {
        // get columns for blocks on the left
        blockIndex = focusBlockInfo.providingBlocks.findIndex((b) => currentBlock.instance.id === b.instance.id);
        x = currentBlock.instance.dimensions?.width ?? 0;

        const totalHeight = positionData.totalUsedHeightLeft;
        //We start
        y = (positionData.totalUsedHeight - totalHeight) / 2;
        for (let i = 0; i < blockIndex; i++) {
            y += calculateBlockHeight(focusBlockInfo.providingBlocks[i].block, nodeSize) + FOCUS_BLOCK_SPACING;
        }
        y += OFFSET_FROM_TOP;
        return { x, y };
    }
    // get columns for blocks on the right
    blockIndex = focusBlockInfo.consumingBlocks.findIndex((b) => currentBlock.instance.id === b.instance.id);
    x = positionData.plannerWidth - (currentBlock.instance.dimensions?.width ?? 0) * 2;

    const totalHeight = positionData.totalUsedHeightRight;

    y = (positionData.totalUsedHeight - totalHeight) / 2;
    for (let i = 0; i < blockIndex; i++) {
        y += calculateBlockHeight(focusBlockInfo.consumingBlocks[i].block, nodeSize) + FOCUS_BLOCK_SPACING;
    }
    y += OFFSET_FROM_TOP;

    return { x, y };
}

function getFitBothSides(
    focusInfo: FocusBlockInfo,
    dimensions: FocusPositioningData,
    nodeSize: PlannerNodeSize
): boolean {
    let fitLeft = false;
    let fitRight = false;
    const positioningInfo = getBlocksFitToScreen(
        focusInfo,
        {
            width: dimensions.plannerWidth,
            height: dimensions.plannerHeight,
        },
        nodeSize
    );
    if (positioningInfo.totalUsedHeightLeft < positioningInfo.plannerHeight) {
        fitLeft = true;
    }
    if (positioningInfo.totalUsedHeightRight < positioningInfo.plannerHeight) {
        fitRight = true;
    }
    return fitLeft && fitRight;
}

export function getFocusBlockInfo(plan: PlanKind, focus: BlockInfo): FocusBlockInfoShallow {
    const providerBlocks: BlockInstanceSpec[] = []; // blocks to the left
    const consumerBlocks: BlockInstanceSpec[] = []; // blocks to the right

    focus.block.spec.consumers?.forEach((consumerResource) => {
        getConnectionsFor(plan, focus.instance.id, consumerResource.metadata.name).forEach(
            (connection: PlannerConnectionModelWrapper) => {
                const instance = getBlockInstance(plan, connection.from.blockId);
                if (instance) {
                    providerBlocks.push(instance);
                }
            }
        );
    });

    focus.block.spec.providers?.forEach((providerResource) => {
        getConnectionsFor(plan, focus.instance.id, providerResource.metadata.name).forEach((connection) => {
            const instance = getBlockInstance(plan, connection.to.blockId);
            if (instance) {
                consumerBlocks.push(instance);
            }
        });
    });

    return {
        plan,
        focus,
        consumingBlocks: consumerBlocks,
        providingBlocks: providerBlocks,
        all: [...consumerBlocks, ...providerBlocks],
    };
}

/**
 * get the minimum possible zoom level for the focused block "cluster"
 * @param focusInfo
 * @param zoomLevels
 * @param nodeSize
 */

export function getFocusZoomLevel(
    focusInfo: FocusBlockInfo,
    zoomLevels: ZoomLevels,
    nodeSize: PlannerNodeSize
): number {
    const positioningMap: { [key: string]: FocusPositioningData } = {};

    Object.keys(zoomLevels).forEach((key: string) => {
        positioningMap[key] = getBlocksFitToScreen(focusInfo, zoomLevels[key], nodeSize);
    });

    const fittingZoomLevels = Object.keys(positioningMap)
        .filter((key: string) => {
            return getFitBothSides(focusInfo, positioningMap[+key], nodeSize);
        })
        .map((key) => {
            return parseFloat(key);
        })
        .filter((key) => key > 0.75); // We dont want to further in than 1

    if (fittingZoomLevels.length === 0) {
        return 1;
    }

    return Math.min(...fittingZoomLevels);
}

export function getFocusArea(zoomIn: number, plannerCanvasSize: Size): Size {
    return {
        width: plannerCanvasSize.width * zoomIn,
        height: plannerCanvasSize.height * zoomIn,
    };
}

export function getBlockPositionForFocus(
    blockInfo: BlockInfo,
    focusInfo: FocusBlockInfo,
    nodeSize: PlannerNodeSize,
    availableSize: Size
) {
    let point;

    const positioningData = getBlocksFitToScreen(focusInfo, availableSize, nodeSize);

    const focusedColumn = 2;
    const isBlockConnected = focusInfo.all.some((singleBlock) => singleBlock.instance.id === blockInfo.instance.id);

    if (focusInfo.focus.instance.id === blockInfo.instance.id) {
        point = getFocusedBlockPosition(focusInfo.focus, positioningData, focusedColumn);
    } else if (isBlockConnected) {
        const isConsuming = focusInfo.consumingBlocks.some(
            (consumingBlock) => consumingBlock.instance.id === blockInfo.instance.id
        );

        let side = isConsuming ? ResourceRole.PROVIDES : ResourceRole.CONSUMES;

        point = getFocusedLinkedBlockPosition(blockInfo.instance.id, side, positioningData, focusInfo, nodeSize);
    }

    return point;
}

export function isBlockInFocus(focusInfo: FocusBlockInfo, blockId: string) {
    return focusInfo.focus.instance.id === blockId || focusInfo.all.some((block) => block.instance.id === blockId);
}

/**
 * Gets context information for focus mode
 */
export function useFocusInfo() {
    const planner = useContext(PlannerContext);

    const toBlockInfoList = (instances: BlockInstanceSpec[]): BlockInfo[] => {
        return instances
            .map((instance): BlockInfo | null => {
                const block = planner.getBlockById(instance.id);
                if (!block) {
                    return null;
                }
                return {
                    instance,
                    block,
                };
            })
            .filter((i) => i !== null) as BlockInfo[];
    };

    const zoomLevelAreas: ZoomLevels = useMemo(() => {
        let zoom = 0.5;
        const zoomLevelAreas: ZoomLevels = {};
        do {
            // populate the zoomLevelArea with all possible sizes after mounting
            zoom += ZOOM_STEP_SIZE;
            zoomLevelAreas[zoom] = getFocusArea(zoom, planner.canvasSize);
        } while (zoom < 3);

        return zoomLevelAreas;
    }, [planner.canvasSize.width, planner.canvasSize.height]);

    const focusInfo = useMemo(() => {
        if (!planner.plan || !planner.focusedBlock) {
            return;
        }

        const focusBlockDefinition = planner.getBlockById(planner.focusedBlock.id);
        if (!focusBlockDefinition) {
            return;
        }

        const focusInfoShallow = getFocusBlockInfo(planner.plan, {
            block: focusBlockDefinition,
            instance: planner.focusedBlock,
        });

        return {
            ...focusInfoShallow,
            all: toBlockInfoList(focusInfoShallow.all),
            consumingBlocks: toBlockInfoList(focusInfoShallow.consumingBlocks),
            providingBlocks: toBlockInfoList(focusInfoShallow.providingBlocks),
        };
    }, [planner.plan, planner.focusedBlock]);

    useEffect(() => {
        if (!focusInfo) {
            return;
        }

        const zoomLevel = getFocusZoomLevel(focusInfo, zoomLevelAreas, planner.nodeSize);
        if (planner.zoom !== zoomLevel) {
            planner.setZoomLevel(zoomLevel);
        }
    }, [focusInfo?.focus.instance.id]);

    return focusInfo;
}
