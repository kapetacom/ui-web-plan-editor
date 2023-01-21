import {action, observable} from "mobx";
import {Guid} from "guid-typescript";

import type {
    Asset,
    BlockInstanceSpec,
    BlockKind,
    Dimensions,
    ResourceConfig
} from "@blockware/ui-web-types";

import {
    ItemType,
    BlockType,
    ResourceKind
} from "@blockware/ui-web-types";
import {BlockTypeProvider, ResourceTypeProvider} from "@blockware/ui-web-context";


import {PlannerBlockModelWrapper} from "../../wrappers/PlannerBlockModelWrapper";
import {BlockMode} from "../../wrappers/wrapperHelpers";
import {PlannerResourceModelWrapper} from "../../wrappers/PlannerResourceModelWrapper";
import {Planner} from "../Planner";
import {EditPanelHelper} from "./EditPanelHelper";

/**
 * Helper class for handling drag-n-drop in the Planner UI
 */
export class DnDHelper {

    @observable
    private planner: Planner;

    @observable
    private editPanel: EditPanelHelper;

    constructor(planner: Planner, editPanel: EditPanelHelper) {
        this.planner = planner;
        this.editPanel = editPanel;
    }

    @observable
    private adjustForScrollAndZoom(dimensions:Dimensions):Dimensions {
        let zoom = this.planner.getZoom();
        let scroll = this.planner.getScroll();

        //Adjust for scroll
        dimensions.left += scroll.x;
        dimensions.top += scroll.y;

        //Adjust for zoom
        dimensions.left *= zoom;
        dimensions.top *= zoom;

        return dimensions;
    }

    @action
    public handleItemDragged(type: string, data: any, dimensions: Dimensions) {
        dimensions = this.adjustForScrollAndZoom(dimensions);

        switch (type) {
            case 'tool':
                this.handleToolItemDragged(data, dimensions);
                break;
        }
    }

    @action
    public handleItemDropped(type: string, data: any, dimensions: Dimensions) {
        dimensions = this.adjustForScrollAndZoom(dimensions);

        switch (type) {
            case 'tool':
                this.handleToolItemDropped(data, dimensions);
                break;

            case 'block':
                this.handleBlockItemDropped(data, dimensions);
                break;
        }
    }

    @action
    private handleBlockItemDropped(data: Asset, dimensions: Dimensions) {
        if (BlockTypeProvider.exists(data.kind)) {
            const blockDefinition: BlockKind = data.data;
            const blockInstanceId = Guid.create().toString();
            const initialName = blockDefinition.metadata.title || blockDefinition.metadata.name;
            const blockInstance: BlockInstanceSpec = {
                id: blockInstanceId,
                name: initialName,
                block: {
                    ref: data.ref
                }
            };
            const wrapper = new PlannerBlockModelWrapper(blockInstance, blockDefinition, this.planner.plan);
            wrapper.top = dimensions.top - 60; //Adjustment for SVG
            wrapper.left = dimensions.left;

            this.planner.plan.addBlock(wrapper);
        }
    }

    @action
    private handleToolItemDragged(data: any, dimensions: Dimensions) {
        if (ResourceTypeProvider.exists(data.kind) && !this.planner.plan.focusedBlock) {
            let activeBlock = this.planner.plan.findValidBlockTargetFromDimensions(this.planner.nodeSize, dimensions);
            const resourceConfig: ResourceConfig = data;

            if (activeBlock && activeBlock.isReadOnly()) {
                activeBlock = undefined;
            }

            this.planner.plan.blocks.forEach((block:PlannerBlockModelWrapper) => {
                if (activeBlock === block) {
                    block.setHoverDropModeFromRole(resourceConfig.role);
                } else {
                    block.setMode(BlockMode.HIDDEN);
                }
            });
        }
    }

    @action
    private handleToolItemDropped(asset: any, dimensions: Dimensions) {
        if (BlockTypeProvider.exists(asset.kind)) {
            const blockInstanceId = Guid.create().toString();
            const initialName = 'MyBlock';

            const blockDefinition: BlockKind = {
                kind: asset.kind,
                metadata: {
                    name: initialName
                },
                spec: {
                    target: {
                        kind: ''
                    },
                    type: BlockType.SERVICE
                }
            };

            const blockInstance: BlockInstanceSpec = {
                id: blockInstanceId,
                name: initialName,
                block: {
                    ref: asset.ref
                }
            };


            const wrapper = new PlannerBlockModelWrapper(blockInstance, blockDefinition, this.planner.plan);
            wrapper.top = dimensions.top;
            wrapper.left = dimensions.left;

            this.planner.plan.addBlock(wrapper);

            this.editPanel.edit(wrapper, ItemType.BLOCK, true);
            return;
        }

        if (ResourceTypeProvider.exists(asset.kind)) {

            this.planner.plan.blocks.forEach((block:PlannerBlockModelWrapper) => {
                block.setMode(BlockMode.HIDDEN);
            });

            const block = this.planner.plan.findValidBlockTargetFromDimensions(this.planner.nodeSize, dimensions);
            if (!block || block.isReadOnly()) {
                return;
            }

            const resourceConfig: ResourceConfig = asset;
            const resourceKind: ResourceKind = {
                kind: asset.kind,
                metadata: {
                    name: 'MyResource'
                },
                spec: {}
            };

            const wrapper = new PlannerResourceModelWrapper(resourceConfig.role, resourceKind, block);
            wrapper.id = Guid.create().toString();
            block.addResource(wrapper);

            this.editPanel.edit(wrapper, ItemType.RESOURCE, true);
        }
    }
}