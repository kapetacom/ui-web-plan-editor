import { action, makeAutoObservable, observable } from 'mobx';
import { PlannerNodeSize } from '../types';
import _ from 'lodash';
import type { SelectedResourceItem } from './models';
import { PlannerBlockModelWrapper } from './PlannerBlockModelWrapper';
import { PlannerConnectionModelWrapper } from './PlannerConnectionModelWrapper';
import { PlannerResourceModelWrapper } from './PlannerResourceModelWrapper';
import {
    Dimensions,
    PLAN_KIND,
    PlanKind,
    ResourceRole,
} from '@kapeta/ui-web-types';
import { ResourceTypeProvider } from '@kapeta/ui-web-context';
import { BlockMode, ResourceMode } from './wrapperHelpers';

export interface PlannerModelRef {
    model: PlannerModelWrapper;
    ref: string;
    version: string;
}

export enum PlannerMode {
    VIEW,
    CONFIGURATION,
    EDIT,
}

export class PlannerModelWrapper {
    @observable
    name: string;

    @observable
    focusedBlock?: PlannerBlockModelWrapper;

    @observable
    blocks: PlannerBlockModelWrapper[] = [];

    blockWidth: number = 300;

    @observable
    connections: PlannerConnectionModelWrapper[] = [];

    @observable
    selectedResource?: SelectedResourceItem;

    @observable
    errors: string[] = [];

    @observable
    private dragging: boolean = false;

    @observable
    private readonly _ref: string;

    @observable
    private mode: PlannerMode = PlannerMode.EDIT;

    constructor(ref: string, name: string) {
        this._ref = ref;
        this.name = name;
        makeAutoObservable(this);
    }

    getData(): PlanKind {
        return {
            kind: PLAN_KIND,
            metadata: {
                name: this.name,
            },
            spec: {
                blocks: this.blocks.map((block) => {
                    return block.getInstance();
                }),
                connections: this.connections.map((connection) => {
                    return connection.getData();
                }),
            },
        };
    }

    getRef(): string {
        return this._ref;
    }

    /* State handlers */
    @action
    setDragging(dragging: boolean) {
        if (!this.focusedBlock) {
            this.dragging = dragging;
        }
    }

    @action
    setMode(mode: PlannerMode) {
        this.mode = mode;
    }

    isEditing() {
        return this.mode === PlannerMode.EDIT;
    }

    isViewing() {
        return this.mode === PlannerMode.VIEW;
    }

    isReadOnly() {
        return (
            this.mode === PlannerMode.VIEW ||
            this.mode === PlannerMode.CONFIGURATION
        );
    }

    isConfiguring() {
        return this.mode === PlannerMode.CONFIGURATION;
    }

    isDragging() {
        return this.dragging;
    }

    /**
     * Keep a copy of the focused block in the plan for easy access
     * there can only be a single focused block at a time thus keeping a
     * isFocused flag adds complexity in handling or toggling the boolean values (but also an option)
     * @param block
     */
    @action
    setFocusedBlock(block: PlannerBlockModelWrapper) {
        if (this.focusedBlock === block) {
            this.hideFocusedBlock(block);
            this.focusedBlock = undefined;
        } else {
            if (this.focusedBlock) {
                this.hideFocusedBlock(this.focusedBlock);
            }
            this.showFocusedBlock(block);
            this.focusedBlock = block;
        }
    }

    private hideFocusedBlock(block: PlannerBlockModelWrapper) {
        block.setMode(BlockMode.HIDDEN);
        this.getConnectionsForBlock(block).forEach((connection) => {
            if (connection.toResource.block === block) {
                connection.fromResource.setMode(ResourceMode.HIDDEN);
            } else {
                connection.toResource.setMode(ResourceMode.HIDDEN);
            }
        });
    }

    private showFocusedBlock(block: PlannerBlockModelWrapper) {
        block.setMode(BlockMode.FOCUSED);
        this.getConnectionsForBlock(block).forEach((connection) => {
            if (connection.toResource.block === block) {
                connection.fromResource.setMode(ResourceMode.SHOW_FIXED);
            } else {
                connection.toResource.setMode(ResourceMode.SHOW_FIXED);
            }
        });
    }

    @action
    setSelectedResources(
        resource?: PlannerResourceModelWrapper,
        original?: PlannerResourceModelWrapper
    ) {
        if (original && resource) {
            this.dragging = true;
            this.selectedResource = { original, resource };
        } else {
            this.dragging = false;
            this.selectedResource = undefined;
        }
        return true;
    }

    @action
    unsetSelectedResources() {
        this.selectedResource = undefined;
        this.dragging = false;
    }

    /* Plan manipulation */

    @action
    addConnection(conn: PlannerConnectionModelWrapper) {
        this.connections.push(conn);

        this.validate();
    }

    @action
    removeConnectionByResourceId(resourceId: string) {
        _.remove(this.connections, (connection) => {
            return (
                connection.from.resourceName === resourceId ||
                connection.to.resourceName === resourceId
            );
        });

        this.validate();
    }

    @action
    removeConnectionByBlockId(blockId: string) {
        _.remove(this.connections, (connection) => {
            return (
                connection.from.blockId === blockId ||
                connection.to.blockId === blockId
            );
        });

        this.validate();
    }

    @action
    updateConnection(newConnection: PlannerConnectionModelWrapper) {
        if (this.connections.indexOf(newConnection) > -1) {
            // force connections to update to trigger the plan observer
            this.connections = this.connections.map((existingConnection) => {
                return existingConnection.id === newConnection.id
                    ? newConnection
                    : existingConnection;
            });
        } else {
            this.connections = [...this.connections, newConnection];
        }

        this.validate();
    }

    @action
    removeConnection(connection: PlannerConnectionModelWrapper) {
        const ix = this.connections.indexOf(connection);
        if (ix === -1) {
            return false;
        }
        this.connections.splice(ix, 1);
        this.validate();
        return true;
    }

    @action
    moveConnectionToTop(connection: PlannerConnectionModelWrapper) {
        const ix = this.connections.indexOf(connection);
        if (ix === -1) {
            return;
        }

        this.connections.splice(ix, 1);
        this.connections.push(connection);
    }

    @action
    copyResourceToBlock(
        targetBlockId: string,
        fromResource: PlannerResourceModelWrapper
    ) {
        const toBlock = this.findBlockById(targetBlockId);

        if (!toBlock) {
            return false;
        }

        if (!this.canAddResourceToBlock(toBlock, fromResource)) {
            return false;
        }
        let counter = 1;
        let resourceName = fromResource.getName();

        while (toBlock.findResourceById(ResourceRole.CONSUMES, resourceName)) {
            resourceName = `${fromResource.getName()}_${counter}`;
            counter++;
        }
        const fromBlock = fromResource.block;
        const fromEntities = fromBlock.getEntities();

        // Get entities in use by resource being copied
        const entityNames = ResourceTypeProvider.resolveEntities(
            fromResource.getData()
        );

        // Convert resource to consumable resource
        const data = ResourceTypeProvider.convertToConsumable(
            fromResource.getData()
        );

        entityNames.forEach((entityName) => {
            const entity = fromBlock.getEntityByName(entityName);
            if (!entity) {
                return;
            }

            // See if target block already has an entity that is identical to this one
            const existingEntity = toBlock.getMatchingEntity(
                entity,
                fromEntities
            );
            if (existingEntity) {
                // If already there no need to do anything
                return;
            }

            let conflictingEntity;
            let conflictCount = 1;
            const originalName = entity.name;
            do {
                // Check if an entity exists of the same name - but different properties
                conflictingEntity = toBlock.getConflictingEntity(
                    entity,
                    fromEntities
                );

                if (conflictingEntity) {
                    // We need to rename the new entity and all references to it to be able to add it to the target block.
                    entity.name = `${originalName}_${conflictCount}`;
                    conflictCount++;
                }
            } while (conflictingEntity);

            if (entity.name !== originalName) {
                // We need to change our references
                ResourceTypeProvider.renameEntityReferences(
                    data,
                    originalName,
                    entity.name
                );
            }

            toBlock.addEntity(entity);
        });

        data.metadata.name = resourceName;

        const toResource = new PlannerResourceModelWrapper(
            ResourceRole.CONSUMES,
            data,
            toBlock
        );
        toBlock.addResource(toResource);
        const connection = PlannerConnectionModelWrapper.createFromResources(
            fromResource,
            toResource
        );

        const converter = ResourceTypeProvider.getConverterFor(
            fromResource.getKind(),
            toResource.getKind()
        );
        if (converter && converter.createMapping) {
            const mapping = converter.createMapping(
                fromResource.getData(),
                toResource.getData(),
                fromBlock.getEntities(),
                toBlock.getEntities()
            );
            // Updates mapping
            connection.setData({
                ...connection.getData(),
                mapping,
            });
        }

        this.addConnection(connection);

        return true;
    }

    @action
    updateBlock(block: PlannerBlockModelWrapper) {
        if (this.blocks.indexOf(block) === -1) {
            // Add block if its a new one
            this.addBlock(block);
            return;
        }
    }

    @action
    addBlock(block: PlannerBlockModelWrapper) {
        this.blocks.push(block);

        this.validate();
    }

    @action
    removeBlock(block: PlannerBlockModelWrapper) {
        if (this.focusedBlock) {
            return false;
        }
        const oldSize = this.blocks.length;

        _.remove(this.connections, (connection) => {
            return (
                connection.from.blockId === block.id ||
                connection.to.blockId === block.id
            );
        });

        _.pull(this.blocks, block);

        this.validate();

        if (this.blocks.length < oldSize) {
            return true;
        }

        return false;
    }

    @action
    public validate() {
        this.errors = [];
        if (!this.name) {
            this.errors.push('Missing name for plan');
        }

        this.blocks.forEach((block) => {
            block.validate();
        });

        this.connections.forEach((connection) => {
            connection.validate();
        });
    }

    /* Lookup/Read methods */
    isValid() {
        if (this.errors.length > 0) {
            return false;
        }

        let i;
        for (i = 0; i < this.blocks.length; i++) {
            if (!this.blocks[i].isValid()) {
                return false;
            }
        }

        for (i = 0; i < this.connections.length; i++) {
            if (!this.connections[i].isValid()) {
                return false;
            }
        }

        return true;
    }

    calculateCanvasSize = (
        size: PlannerNodeSize,
        containerSize: { width: number; height: number }
    ) => {
        let maxWidth = 50;
        let maxHeight = 50;
        let minX = 0;
        let minY = 0;

        if (this.blocks && this.blocks.length > 0) {
            this.blocks.forEach((block: any) => {
                const bottom = block.top + block.calculateHeight(size);
                const right = block.left + block.width;
                const y = block.top;
                const x = block.left;
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
            width:
                maxWidth > containerSize.width ? maxWidth : containerSize.width,
            height:
                maxHeight > containerSize.height
                    ? maxHeight
                    : containerSize.height,
        };
    };

    findResourceBlock(res: PlannerResourceModelWrapper) {
        return this.blocks.filter(
            (b) =>
                b.provides.filter(
                    (r: PlannerResourceModelWrapper) => r.id === res.id
                ).length > 0 ||
                b.consumes.filter(
                    (r: PlannerResourceModelWrapper) => r.id === res.id
                ).length > 0
        )[0];
    }

    getAvailableConsumables() {
        const consumables: PlannerResourceModelWrapper[] = [];
        this.blocks.forEach((element) => {
            element.provides.forEach((prov) => {
                consumables.push(prov);
            });
        });
        return consumables;
    }

    findBlockById(blockId: string) {
        return this.blocks.filter((bl) => bl.id === blockId)[0];
    }

    existsInBlock(block: PlannerBlockModelWrapper, resourceId: string) {
        return (
            block.consumes
                .filter((r) => {
                    return r.id === resourceId;
                })
                .concat(
                    block.provides.filter((r) => {
                        return r.id === resourceId;
                    })
                ).length > 0
        );
    }

    filterResourcesFromDimensions(
        resources: PlannerResourceModelWrapper[],
        hoverDimensions: Dimensions
    ) {
        return resources.find(
            (compatibleResource: PlannerResourceModelWrapper) => {
                return !!(
                    compatibleResource.dimensions &&
                    this.dimensionsOverlap(
                        hoverDimensions,
                        compatibleResource.dimensions
                    )
                );
            }
        );
    }

    findValidBlockTargetFromDimensions(
        size: PlannerNodeSize,
        hoverDimensions: Dimensions
    ) {
        return this.blocks.find((block) => {
            return this.dimensionsOverlap(
                hoverDimensions,
                block.getDimensions(size)
            );
        });
    }

    findValidBlockTargetFromDimensionsAndResource(
        size: PlannerNodeSize,
        hoverDimensions: Dimensions,
        resource: PlannerResourceModelWrapper
    ) {
        return this.blocks.find((block) => {
            return (
                this.dimensionsOverlap(
                    hoverDimensions,
                    block.getDimensions(size)
                ) && this.canAddResourceToBlock(block, resource)
            );
        });
    }

    hasIncomingConnection(resource: PlannerResourceModelWrapper) {
        return !!this.connections.find((connection) => {
            return connection.toResource === resource;
        });
    }

    getConnectionsFor(resource: PlannerResourceModelWrapper) {
        return this.connections.filter((connection) => {
            return (
                connection.toResource === resource ||
                connection.fromResource === resource
            );
        });
    }

    getConnectionsForBlock(block: PlannerBlockModelWrapper) {
        return this.connections.filter((connection) => {
            return (
                connection.toResource.block === block ||
                connection.fromResource.block === block
            );
        });
    }

    /* private */

    private dimensionsOverlap(
        dimensionsA: Dimensions,
        dimensionsB: Dimensions
    ) {
        const r1Right = dimensionsA.left + dimensionsA.width;
        const r2Right = dimensionsB.left + dimensionsB.width;
        const r1Bottom = dimensionsA.top + dimensionsA.height;
        const r2Bottom = dimensionsB.top + dimensionsB.height;

        return !(
            dimensionsB.left > r1Right ||
            r2Right < dimensionsA.left ||
            dimensionsB.top > r1Bottom ||
            r2Bottom < dimensionsA.top
        );
    }

    private canAddResourceToBlock(
        toBlock: PlannerBlockModelWrapper,
        fromResource: PlannerResourceModelWrapper
    ) {
        const fromBlock = fromResource.block;
        if (!fromBlock) {
            return false;
        }

        if (fromBlock === toBlock) {
            return false;
        }

        for (const connection of this.connections) {
            if (
                connection.from.blockId === fromBlock.id &&
                connection.from.resourceName === fromResource.id &&
                connection.to.blockId === toBlock.id
            ) {
                return false;
            }
        }

        return true;
    }
}
