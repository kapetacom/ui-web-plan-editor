import React from "react";

import {Point, ResourceRole, Size} from "@blockware/ui-web-types";

import {PlannerBlockModelWrapper} from "../../wrappers/PlannerBlockModelWrapper";
import {FocusPositioningData, PlannerNodeSize, ZoomAreaMap, NeighboringBlocks} from "../../types";
import {PlannerModelWrapper} from "../../wrappers/PlannerModelWrapper";
import {
    PlannerConnectionModelWrapper
} from "../../wrappers/PlannerConnectionModelWrapper";
import {PlannerFocusSideBar} from "../PlannerFocusSideBar";

export const POSITIONING_DATA = "preFocusPosition";
export const FOCUSED_ID = "focusedID";
const OFFSET_FROM_TOP = 20;

export class FocusHelper {


    private plan: PlannerModelWrapper;

    constructor(plan: PlannerModelWrapper) {
        this.plan = plan;
    }

    /**
     * Returns the position for the focused block(middle of the screen)
     * @param block
     * @param positionData
     */
    private getFocusedBlockPosition = (block: PlannerBlockModelWrapper, positionData: FocusPositioningData, nodeSize: PlannerNodeSize) => {
        let x = positionData.plannerWidth / 2 - (block.width) / 2;
        const y = positionData.plannerHeight / 2 - (block.calculateHeight(nodeSize) / 2);
        return {x, y};
    }

    public isConnectionLinkedToFocus = (connection: PlannerConnectionModelWrapper) => {
        if (!this.plan.focusedBlock) {
            return false;
        } else {
            if (connection.fromResource.block.id === this.plan.focusedBlock.id || connection.toResource.block.id === this.plan.focusedBlock.id) {
                return true;
            } else {
                return false;
            }
        }
    }

    private getBlockListTotalHeight = (blocks: PlannerBlockModelWrapper[], nodeSize: PlannerNodeSize) => {
        let totalHeight = OFFSET_FROM_TOP;
        blocks.forEach((block: PlannerBlockModelWrapper) => {
            totalHeight += block.calculateHeight(nodeSize) + 40;
        });
        return totalHeight;
    }


    /**
     * Calculate the number of blocks that can fit into the screen horizontally and vertically
     * in the default zoom level
     */
    private getBlocksFitToScreen = (focusedBlock: PlannerBlockModelWrapper, availableSize: Point, nodeSize: PlannerNodeSize): FocusPositioningData => {//having a x and y as size we can precalculate fitting items before we adjust the zoom level
        const connectedToFocusBlocks = focusedBlock.getConnectedBlocks();
        let availableHeight = availableSize.y - 100 - OFFSET_FROM_TOP;
        //remove the focused block width first as no blocks may be over or below
        let verticalBlockNumberLeft = 0;
        let verticalBlockNumberRight = 0;
        //since we don't know what the height of the blocks are we calculate for the worst case scenario 
        //starting from the tallest block and adding 
        for (let block of connectedToFocusBlocks.providingBlocks) {
            const blockHeight = block.calculateHeight(nodeSize);
            if ((availableHeight - blockHeight) > 0) {
                verticalBlockNumberLeft++;
                availableHeight -= blockHeight;
            } else {
                break;
            }
        }
        for (let block of connectedToFocusBlocks.consumingBlocks) {
            const blockHeight = block.calculateHeight(nodeSize);
            if ((availableHeight - blockHeight) > 0) {
                verticalBlockNumberRight++;
                availableHeight -= blockHeight;
            } else {
                break;
            }
        }

        return {
            maxHorizontalBlocks: 3,
            maxVerticalBlocks: Math.max(verticalBlockNumberLeft, verticalBlockNumberRight),
            totalUsedHeightLeft: this.getBlockListTotalHeight(connectedToFocusBlocks.providingBlocks, nodeSize),
            totalUsedHeightRight: this.getBlockListTotalHeight(connectedToFocusBlocks.consumingBlocks, nodeSize),
            plannerHeight: availableSize.y,
            plannerWidth: availableSize.x
        };

    }

    /**
     * get the minimum possible zoom level for the focused block "cluster"
     * @param currentSize
     */
    public getFocusZoomLevel = (zoomLevelAreas: ZoomAreaMap, nodeSize: PlannerNodeSize): number => {
        let positioningMap:{[key:string]:FocusPositioningData} = {};
        let fittingZoomLevels: number[] = [1];

        if (this.plan.focusedBlock) {
            const focusBlock = this.plan.focusedBlock;
            Object.keys(zoomLevelAreas).forEach((key: string) => {
                positioningMap[key] = this.getBlocksFitToScreen(focusBlock, zoomLevelAreas[parseInt(key)], nodeSize)
            });
            fittingZoomLevels = Object.keys(positioningMap).filter((key: string) => {
                return this.getFitBothSides(focusBlock, positioningMap[+key], nodeSize);
            }).map(key => {
                return +key
            }).filter(key => key > 0.75); //We dont want to further in than 1
        }

        return Math.min(...fittingZoomLevels);
    }

    public renderTopBar = (props: { getFocusZoom: (block?: PlannerBlockModelWrapper) => void }) => {
        return (
            <div>
                <div className="focus-toolbox-back" onClick={() => {
                    props.getFocusZoom(this.plan.focusedBlock)
                }}>
                    <svg width="10" height="10" viewBox="0 0 8 13" fill="none">
                        <path d="M6.5351 11.6896L1.31038 6.46523" stroke="#544B49" strokeLinecap="round"/>
                        <path d="M1.31042 6.46518L6.53482 1.34477" stroke="#544B49" strokeLinecap="round"/>
                    </svg>
                </div>
                <div className="focused-block-info">
                    <svg width="9" height="11" viewBox="0 0 9 11" fill="none">
                        <path fillRule="evenodd" clipRule="evenodd"
                              d="M3.66665 0.681077L0.666664 1.80639V5.82046L0.999933 5.94978V6.66488L0.29936 6.39303C0.119151 6.3231 0 6.14663 0 5.94965V1.67556C0 1.47665 0.121461 1.29888 0.304191 1.23034L3.50671 0.0290499C3.60997 -0.00968335 3.72333 -0.0096833 3.82659 0.02905L7.02911 1.23034C7.21184 1.29888 7.3333 1.47665 7.3333 1.67556V2.70903L6.66664 2.46063V1.80639L3.66665 0.681077Z"
                              fill="#544B49"/>
                        <path fillRule="evenodd" clipRule="evenodd"
                              d="M2.31253 4.45849L5.33335 3.32536L8.35417 4.45849V8.50126L5.33335 9.67346L2.31253 8.50126V4.45849ZM8.69581 3.89687C8.87854 3.96542 9 4.14319 9 4.34209V8.61619C9 8.81316 8.88085 8.98963 8.70064 9.05956L5.49812 10.3023C5.39197 10.3435 5.27473 10.3435 5.16858 10.3023L1.96606 9.05956C1.78585 8.98963 1.6667 8.81316 1.6667 8.61619V4.34209C1.6667 4.14319 1.78816 3.96542 1.97089 3.89687L5.17341 2.69558C5.27667 2.65685 5.39003 2.65685 5.49329 2.69558L8.69581 3.89687Z"
                              fill="#544B49"/>
                    </svg>
                    <p>{this.plan.focusedBlock ? this.plan.focusedBlock.name : ""}</p>
                </div>
            </div>
        );
    }

    public getFocusArea(zoomIn: number, plannerCanvasSize: Size) {
        const plannerArea = {x: plannerCanvasSize.width * zoomIn, y: plannerCanvasSize.height * zoomIn}
        return plannerArea
    }

    public getBlockPositionForFocus(block: PlannerBlockModelWrapper, nodeSize: PlannerNodeSize, plannerSize: Point) {
        let point;
        if (this.plan.focusedBlock) {
            let positioningData = this.getBlocksFitToScreen(this.plan.focusedBlock, plannerSize, nodeSize)
            let focusedColumn = 2;
            const {providingBlocks, consumingBlocks, all} = this.plan.focusedBlock.getConnectedBlocks();
            if (this.plan.focusedBlock.id === block.id) {
                point = this.getFocusedBlockPosition(this.plan.focusedBlock,
                    positioningData,
                    focusedColumn
                );

            } else if (all.filter(singleBlock => singleBlock.id === block.id).length > 0) {

                point = this.getFocusedLinkedBlockPosition(
                    block.id,
                    (providingBlocks.filter((providingBlock) => providingBlock.id === block.id).length > 0) ? ResourceRole.CONSUMES :
                        (consumingBlocks.filter((consumingBlock) => consumingBlock.id === block.id).length > 0) ? ResourceRole.PROVIDES : ResourceRole.CONSUMES,
                    positioningData
                    , {providingBlocks, consumingBlocks, all}, nodeSize);
            }

            if (point) {
                block.setPosition(point.x, point.y);
            }
        }
        return point;
    }

    public renderSideBar = (props: {
        onNeighboringBlockHover: (block?: PlannerBlockModelWrapper) => void,
        getFocusZoom: (block?: PlannerBlockModelWrapper) => void,
        sidePanelOpen: boolean
    }) => {
        return (
            <PlannerFocusSideBar block={this.plan.focusedBlock}
                                 onBlockItemHover={(block ?: PlannerBlockModelWrapper) => props.onNeighboringBlockHover(block)}
                                 blurFocus={() => props.getFocusZoom(this.plan.focusedBlock)}
                                 open={props.sidePanelOpen} plan={this.plan}
                                 onClose={() => props.getFocusZoom(this.plan.focusedBlock)}
                                 onFocusChange={(block: PlannerBlockModelWrapper) => props.getFocusZoom(block)}
            />
        )
    }

    /**
     * Get the x and y position of a linked block
     * @param blockId
     * @param side  // the side that focusedBlock connects to the in question block
     * @param positionData
     * @param allBlocks
     */
    private getFocusedLinkedBlockPosition(blockId: string, side: ResourceRole, positionData: FocusPositioningData, allBlocks: NeighboringBlocks, nodeSize: PlannerNodeSize): Point {
        let blockIndex = allBlocks.all.indexOf(allBlocks.all.filter((block: PlannerBlockModelWrapper) => block.id === blockId)[0])
        let y = 0;
        let x = 0;
        let usedHeight = 0;
        const currentBlock = allBlocks.all[blockIndex];
        if (side === ResourceRole.CONSUMES) {//get columns for blocks on the left 
            blockIndex = allBlocks.providingBlocks.indexOf(currentBlock);
            x = currentBlock.width;
            usedHeight = (positionData.plannerHeight - this.getBlockListTotalHeight(allBlocks.providingBlocks, nodeSize)) / 2;
            for (let i = 0; i < blockIndex; i++) {
                usedHeight += allBlocks.providingBlocks[i].calculateHeight(nodeSize);
            }
            y = usedHeight + OFFSET_FROM_TOP;
            return {x, y}
        } else {//get columns for blocks on the right 
            blockIndex = allBlocks.consumingBlocks.indexOf(currentBlock);
            usedHeight = (positionData.plannerHeight - this.getBlockListTotalHeight(allBlocks.consumingBlocks, nodeSize)) / 2;
            for (let i = 0; i < blockIndex; i++) {
                usedHeight += allBlocks.consumingBlocks[i].calculateHeight(nodeSize);
            }
            x = positionData.plannerWidth - currentBlock.width * 2;
            y = usedHeight + OFFSET_FROM_TOP;
            return {x, y}
        }

    }

    private getFitBothSides = (focusedBlock: PlannerBlockModelWrapper, dimensions: FocusPositioningData, nodeSize: PlannerNodeSize): boolean => {
        let fitLeft = false;
        let fitRight = false;
        let positioningInfo = this.getBlocksFitToScreen(focusedBlock, {
            x: dimensions.plannerWidth,
            y: dimensions.plannerHeight
        }, nodeSize);
        if (positioningInfo.totalUsedHeightLeft < positioningInfo.plannerHeight) {
            fitLeft = true;
        }
        if (positioningInfo.totalUsedHeightRight < positioningInfo.plannerHeight) {
            fitRight = true;
        }
        return (fitLeft && fitRight);
    }
}