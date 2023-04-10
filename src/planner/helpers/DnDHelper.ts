import { action, observable } from 'mobx';
import { Guid } from 'guid-typescript';

import type { Asset, IResourceTypeProvider } from '@kapeta/ui-web-types';

import { ItemType } from '@kapeta/ui-web-types';
import { BlockTypeProvider, ResourceTypeProvider } from '@kapeta/ui-web-context';

import { PlannerBlockModelWrapper } from '../../wrappers/PlannerBlockModelWrapper';
import { BlockMode } from '../../wrappers/wrapperHelpers';
import { PlannerResourceModelWrapper } from '../../wrappers/PlannerResourceModelWrapper';
import { Planner } from '../Planner';
import { EditPanelHelper } from './EditPanelHelper';
import {BlockDefinition, BlockInstance, Dimensions, Resource, ResourceType } from '@kapeta/schemas';

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
    private adjustForScrollAndZoom(dimensions: Dimensions): Dimensions {
        const zoom = this.planner.getZoom();
        const scroll = this.planner.getScroll();

        // Adjust for scroll
        dimensions.left += scroll.x;
        dimensions.top += scroll.y;

        // Adjust for zoom
        dimensions.left *= zoom;
        dimensions.top *= zoom;

        return dimensions;
    }

    @action
    public handleItemDragged(type: string, data: any, dimensions: Dimensions) {
        const adjustedDimensions = this.adjustForScrollAndZoom(dimensions);

        switch (type) {
            case 'tool':
                this.handleToolItemDragged(data, adjustedDimensions);
                break;
            default:
                break;
        }
    }

    @action
    public handleItemDropped(type: string, data: any, dimensions: Dimensions) {
        const adjustedDimensions = this.adjustForScrollAndZoom(dimensions);

        switch (type) {
            case 'tool':
                this.handleToolItemDropped(data, adjustedDimensions);
                break;

            case 'block':
                this.handleBlockItemDropped(data, adjustedDimensions);
                break;

            default:
                break;
        }
    }

    @action
    private handleBlockItemDropped(data: Asset, dimensions: Dimensions) {
        if (BlockTypeProvider.exists(data.kind)) {
            const blockDefinition: BlockDefinition = data.data;
            const blockInstanceId = Guid.create().toString();
            const initialName = blockDefinition.metadata.title || blockDefinition.metadata.name;
            const blockInstance: BlockInstance = {
                id: blockInstanceId,
                name: initialName,
                block: {
                    ref: data.ref,
                },
                dimensions
            };
            const wrapper = new PlannerBlockModelWrapper(blockInstance, blockDefinition, this.planner.plan);
            wrapper.top = dimensions.top - 60; // Adjustment for SVG
            wrapper.left = dimensions.left;

            this.planner.plan.addBlock(wrapper);
        }
    }

    @action
    private handleToolItemDragged(data: any, dimensions: Dimensions) {
        if (ResourceTypeProvider.exists(data.kind) && !this.planner.plan.focusedBlock) {
            let activeBlock = this.planner.plan.findValidBlockTargetFromDimensions(this.planner.nodeSize, dimensions);
            const resourceConfig: IResourceTypeProvider = data;

            if (activeBlock && activeBlock.readonly) {
                activeBlock = undefined;
            }

            this.planner.plan.blocks.forEach((block: PlannerBlockModelWrapper) => {
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

            const blockDefinition: BlockDefinition = {
                kind: asset.kind,
                metadata: {
                    name: initialName,
                },
                spec: {
                    target: {
                        kind: '',
                    },
                },
            };

            const blockInstance: BlockInstance = {
                id: blockInstanceId,
                name: initialName,
                block: {
                    ref: asset.ref,
                },
                dimensions
            };

            const wrapper = new PlannerBlockModelWrapper(blockInstance, blockDefinition, this.planner.plan);
            wrapper.top = dimensions.top;
            wrapper.left = dimensions.left;

            this.planner.plan.addBlock(wrapper);

            this.editPanel.edit(wrapper, ItemType.BLOCK, true);
            return;
        }

        if (ResourceTypeProvider.exists(asset.kind)) {
            const resourceType = asset as IResourceTypeProvider;

            this.planner.plan.blocks.forEach((block: PlannerBlockModelWrapper) => {
                block.setMode(BlockMode.HIDDEN);
            });

            const block = this.planner.plan.findValidBlockTargetFromDimensions(this.planner.nodeSize, dimensions);
            if (!block || block.readonly) {
                return;
            }

            const resourceConfig: IResourceTypeProvider = asset;

            //We get first port from resource type for now
            const port = resourceType.definition.spec.ports[0];

            const resourceKind: Resource = {
                kind: `${resourceConfig.kind}:${resourceConfig.version}`,
                metadata: {
                    name: 'MyResource',
                },
                spec: {
                    port
                },
            };

            const wrapper = new PlannerResourceModelWrapper(resourceConfig.role, resourceKind, block);
            block.addResource(wrapper);

            this.editPanel.edit(wrapper, ItemType.RESOURCE, true);
        }
    }
}
