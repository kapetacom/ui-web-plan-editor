import {action, computed, makeObservable, observable, toJS} from "mobx";
import _ from "lodash";
import {Guid} from "guid-typescript";

import type {
    BlockInstanceSpec,
    BlockKind,
    BlockReference,
    DataWrapper,
    Dimensions,
    Point,
    ResourceKind, SchemaEntity,
    Size
} from "@blockware/ui-web-types";
import {isSchemaEntityCompatible, ResourceRole} from "@blockware/ui-web-types";

import {BlockTypeProvider} from '@blockware/ui-web-context';

import {NeighboringBlocks, PlannerNodeSize} from "../types";
import {PlannerResourceModelWrapper} from "./PlannerResourceModelWrapper";
import {PlannerModelWrapper} from "./PlannerModelWrapper";
import {BlockMode, ResourceMode} from "./wrapperHelpers";
import {PlannerConnectionModelWrapper} from "./PlannerConnectionModelWrapper";
import {DSL_LANGUAGE_ID, DSLConverters, DSLWriter} from "@blockware/ui-web-components";

type HeightCache = { [size: number]: number };

export class PlannerBlockModelWrapper implements DataWrapper<BlockKind> {

    readonly plan: PlannerModelWrapper;

    readonly instanceId: string;

    @observable
    id: string;

    @observable
    name: string;

    readonly version: string;

    @observable
    mode: BlockMode = BlockMode.HIDDEN;

    @observable
    focused: boolean = false;

    @observable
    private size: Size = {
        width: 150,
        height: -1
    };

    @observable
    private position: Point = {
        y: 30,
        x: 200
    };

    @observable
    private dragging = false;

    @observable
    private readonly = false;

    @observable
    consumes = [] as PlannerResourceModelWrapper[];

    @observable
    provides = [] as PlannerResourceModelWrapper[];

    @observable
    blockReference: BlockReference;

    @observable
    private data!: BlockKind;

    private heightCache: HeightCache = {};

    @observable
    errors: string[] = [];

    constructor(blockInstance: BlockInstanceSpec, blockDefinition: BlockKind, plan: PlannerModelWrapper) {
        this.instanceId = crypto.randomUUID();

        makeObservable(this);

        this.id = blockInstance.id;
        if (!this.id) {
            this.id = Guid.raw();
        }

        this.plan = plan;

        this.setData(blockDefinition);

        this.name = blockInstance.name || blockDefinition?.metadata?.title || '';

        this.blockReference = blockInstance.block;

        this.version = 'local';
        if (this.blockReference?.ref &&
            this.blockReference.ref.indexOf(':') > -1) {
            this.version = this.blockReference.ref.split(':')[1];
        }

        this.readonly = this.version !== 'local';

        if (blockInstance.dimensions) {
            this.size = {
                width: blockInstance.dimensions.width,
                height: blockInstance.dimensions.height
            };

            this.position = {
                y: blockInstance.dimensions.top,
                x: blockInstance.dimensions.left
            };
        } else {

            this.size = {
                width: 150,
                height: -1
            };

            this.position = {
                y: 250,
                x: 300
            };
        }

        this.validate()

    }

    isReadOnly():boolean {
        return this.readonly;
    }

    getRef(): string {
        return this.blockReference.ref;
    }

    getData(): BlockKind {
        return {
            ...this.data,
            spec: {
                ...this.data.spec,
                providers: this.provides.map(r => r.getData()),
                consumers: this.consumes.map(r => r.getData()),
            }
        };
    }

    getInstance(): BlockInstanceSpec {
        return {
            block: {...this.blockReference},
            name: this.name,
            dimensions: {
                height: -1,
                top: this.top,
                left: this.left,
                width: this.width
            },
            id: this.id
        };
    }

    @action
    setEntities(entities: SchemaEntity[]) {
        if (!this.data.spec.entities) {
            this.data.spec.entities = {
                types: [],
                source: {
                    type: DSL_LANGUAGE_ID,
                    value: ''
                }
            };
        }

        this.data.spec.entities.types = toJS(entities);
        this.data.spec.entities.source.value = DSLWriter.write(entities.map(DSLConverters.fromSchemaEntity));
    }

    getEntities(): SchemaEntity[] {
        if (!this.data.spec.entities?.types) {
            return [];
        }

        return [...this.data.spec.entities.types];
    }

    getEntityNames(): string[] {
        if (!this.data.spec.entities?.types) {
            return [];
        }

        return this.data.spec.entities.types.map(entity => entity.name);
    }

    @action
    setFocus(focus: boolean) {
        this.focused = focus;
    }

    isFocused() {
        return this.focused;
    }

    hasConnectionTo(block: PlannerBlockModelWrapper) {
        return this.getConnectedBlocks().all.indexOf(block) > -1;
    }

    private updateResources(role: ResourceRole, resources: ResourceKind[]): void {
        const wrappers = role === ResourceRole.CONSUMES ? this.consumes : this.provides;

        //Get rid of wrappers for resources that no longer exist
        wrappers.filter(wrapper => {
            return !resources.some(resource => {
                const id = PlannerResourceModelWrapper.GetResourceID(resource);
                return id === wrapper.id;
            })
        }).forEach(wrapper => {
            wrappers.splice(wrappers.indexOf(wrapper), 1);
        })

        //Update or add resources
        resources.forEach(
            (resource, ix) => {
                const id = PlannerResourceModelWrapper.GetResourceID(resource);
                let existingWrapper = wrappers.find(c => c.id === id);
                if (existingWrapper) {
                    existingWrapper.setData(resource);
                    return;
                }

                const newWrapper = this.createResourceWrapper(ix, role, resource);
                wrappers.push(newWrapper);
            }
        );
    }

    @action
    setData(data: BlockKind) {
        this.data = data;
        this.updateResources(ResourceRole.CONSUMES, data.spec.consumers || []);
        this.updateResources(ResourceRole.PROVIDES, data.spec.providers || []);
        this.validate();
    }

    /**
     * Get neighboring blocks
     */
    getConnectedBlocks(): NeighboringBlocks {
        let consumerBlocks: PlannerBlockModelWrapper[] = [];//blocks to the right
        let providerBlocks: PlannerBlockModelWrapper[] = [];//blocks to the left
        this.provides.forEach((resource: PlannerResourceModelWrapper) => {
            this.plan.getConnectionsFor(resource).forEach((connection: PlannerConnectionModelWrapper) => {
                if (!consumerBlocks[resource.id]) {
                    consumerBlocks[resource.id] = [];
                }
                consumerBlocks.push(connection.toResource.block);
            })
        });

        this.consumes.forEach((resource: PlannerResourceModelWrapper) => {
            this.plan.getConnectionsFor(resource).forEach((connection: PlannerConnectionModelWrapper) => {
                if (!providerBlocks[resource.id]) {
                    providerBlocks[resource.id] = [];
                }
                providerBlocks.push(connection.fromResource.block);
            })
        });

        return {
            consumingBlocks: consumerBlocks,
            providingBlocks: providerBlocks,
            all: [...consumerBlocks, ...providerBlocks]
        }
    }

    getConnectedBlocksTotalHeight(type: ResourceRole, size: PlannerNodeSize) {
        const blocksToMeasure: PlannerBlockModelWrapper[] = []
        let totalHeight = 0;
        const connectedBlocks = this.getConnectedBlocks();

        if (type === ResourceRole.CONSUMES) {
            connectedBlocks.consumingBlocks.forEach((block: PlannerBlockModelWrapper) => {
                blocksToMeasure.push(block);
            })
        } else {
            connectedBlocks.providingBlocks.forEach((block: PlannerBlockModelWrapper) => {
                blocksToMeasure.push(block)
            })
        }
        blocksToMeasure.forEach((block: PlannerBlockModelWrapper) => {
            totalHeight += block.calculateHeight(size);
        })
        return totalHeight;
    }

    getMaxConnectedBlocksTotalHeight(size: PlannerNodeSize) {
        let totalProviderHeight = 0;
        let totalConsumerHeight = 0;
        totalConsumerHeight = this.getConnectedBlocksTotalHeight(ResourceRole.CONSUMES, size);
        totalProviderHeight = this.getConnectedBlocksTotalHeight(ResourceRole.PROVIDES, size);
        return Math.max(totalConsumerHeight, totalProviderHeight);
    }


    private createResourceWrapper(offset: number, role: ResourceRole, resource: ResourceKind) {
        return new PlannerResourceModelWrapper(role, resource, this);
    }

    calculateOffsetTop(size: PlannerNodeSize, role: ResourceRole) {
        const height = this.calculateHeight(size);
        const resourceHeight = this.getResourceLength(role) * this.getResourceHeight(size);
        return ((height - resourceHeight) / 2) + 2;
    }


    calculateHeight(size: PlannerNodeSize) {
        if (this.heightCache[size]) {
            return this.heightCache[size];
        }

        let consumesCount = this.getResourceLength(ResourceRole.CONSUMES);
        let providesCount = this.getResourceLength(ResourceRole.PROVIDES);

        const resourceCount = Math.max(consumesCount, providesCount);

        this.heightCache[size] = Math.max(150, 70 + (resourceCount * this.getResourceHeight(size)));

        return this.heightCache[size];
    }

    private clearHeightCache() {
        this.heightCache = {};
    }

    getResourceHeight(size: PlannerNodeSize) {
        switch (size) {
            case PlannerNodeSize.SMALL:
                return 30;
            case PlannerNodeSize.MEDIUM:
                return 40;
            case PlannerNodeSize.FULL:
                return 50;
            default:
                return 30;
        }
    }

    @computed
    get activeResource() {
        let activeResource: PlannerResourceModelWrapper | undefined;
        this.consumes.forEach((resource: PlannerResourceModelWrapper) => {
            if (resource.mode === ResourceMode.HOVER_COMPATIBLE) {
                activeResource = resource;
            }
        });
        return activeResource;
    }

    @computed
    get width() {
        return this.size.width;
    }

    get top() {
        return this.position.y;
    }

    get left() {
        return this.position.x;
    }

    set top(val: number) {
        this.position.y = val;
    }

    set left(val: number) {
        this.position.x = val;
    }

    set width(val: number) {
        this.size.width = val;
    }

    @action
    setPosition(x: number, y: number) {
        this.position = {
            x, y
        };
    }

    @action
    setDragging(dragging: boolean) {
        this.dragging = dragging;
        this.plan.setDragging(dragging);
    }

    isDragging() {
        return this.dragging;
    }

    @action
    setHoverDropModeFromRole(role: ResourceRole) {
        switch (role) {
            case ResourceRole.PROVIDES:
                this.setMode(BlockMode.HOVER_DROP_PROVIDER);
                break;
            case ResourceRole.CONSUMES:
                this.setMode(BlockMode.HOVER_DROP_CONSUMER);
                break;
        }
    }

    @action
    setMode(mode: BlockMode) {
        this.clearHeightCache();
        this.mode = mode;
    }

    @action
    addResource(resource: PlannerResourceModelWrapper) {
        if (!resource) {
            return;
        }

        this.clearHeightCache();

        if (resource.role === ResourceRole.CONSUMES) {
            this.consumes.push(resource);
        } else {
            this.provides.push(resource);
        }

        this.validate();
    }


    @action
    handleMouseOver(over: boolean) {
        if (over) {
            this.mode = BlockMode.SHOW_RESOURCES;
        } else {
            this.mode = BlockMode.SHOW;
        }
    }


    @action
    removeResource(resourceId: string, role: ResourceRole) {
        this.clearHeightCache();

        if (role === ResourceRole.CONSUMES) {
            this.consumes = this.consumes.filter(resource => {
                return resourceId !== resource.id;
            })
        } else {
            this.provides = this.provides.filter(resource => {
                return resourceId !== resource.id;
            });
        }

        this.validate();
    }

    getResources(role: ResourceRole) {
        if (role === ResourceRole.CONSUMES) {
            return this.consumes;
        }

        return this.provides;
    }

    getResourceLength(role: ResourceRole) {
        let length = this.getResources(role).length;
        if (role === ResourceRole.CONSUMES &&
            this.mode === BlockMode.HOVER_DROP_CONSUMER) {
            length++;
        }

        if (role === ResourceRole.PROVIDES &&
            this.mode === BlockMode.HOVER_DROP_PROVIDER) {
            length++;
        }

        return length;
    }

    findResourceById(role: ResourceRole, resourceId: string) {
        const resources = this.getResources(role);
        return _.find(resources, {id: resourceId});
    }

    getDimensions(size: PlannerNodeSize): Dimensions {
        return {
            top: this.top,
            left: this.left,
            width: this.width,
            height: this.calculateHeight(size)
        };
    }

    getBlockName() {
        return this.data.metadata.name;
    }

    getBlockVersion() {
        return this.version;
    }

    getEntityByName(name: string): SchemaEntity | undefined {
        return _.find(this.data.spec.entities?.types, {name});
    }

    getMatchingEntity(entity: SchemaEntity, sourceEntities: SchemaEntity[]): SchemaEntity | undefined {
        const matchedEntity = this.getEntityByName(entity.name);
        if (!matchedEntity) {
            return;
        }

        const entities = this.getEntities();

        if (!isSchemaEntityCompatible(entity, matchedEntity, sourceEntities, entities)) {
            return;
        }

        return matchedEntity;
    }

    public getConflictingEntity(entity: SchemaEntity, sourceEntities: SchemaEntity[]): SchemaEntity | undefined {
        const conflictingEntity = this.getEntityByName(entity.name);
        if (!conflictingEntity) {
            return;
        }

        const entities = this.getEntities();

        if (isSchemaEntityCompatible(entity, conflictingEntity, sourceEntities, entities)) {
            return;
        }

        return conflictingEntity;
    }

    @action
    public addEntity(entity: SchemaEntity) {
        if (!this.data.spec.entities) {
            this.data.spec.entities = {
                types: [],
                source: {
                    type: DSL_LANGUAGE_ID,
                    value: ''
                }
            };
        }

        if (Array.isArray(this.data.spec.entities)) {
            this.data.spec.entities = {
                types: this.data.spec.entities,
                source: {
                    type: DSL_LANGUAGE_ID,
                    value: DSLWriter.write(this.data.spec.entities.map(DSLConverters.fromSchemaEntity))
                }
            };
        }

        if (!this.data.spec.entities.types) {
            this.data.spec.entities.types = [];
        }

        if (!this.data.spec.entities.source) {
            this.data.spec.entities.source = {
                type: DSL_LANGUAGE_ID,
                value: ''
            };
        }

        const code = DSLWriter.write([DSLConverters.fromSchemaEntity(entity)]);
        this.data.spec.entities.source.value += code;
        this.data.spec.entities.types.push(entity);

        this.validate();
    }

    isValid() {

        if (this.errors.length > 0) {
            return false;
        }

        let i;
        for (i = 0; i < this.consumes.length; i++) {
            if (!this.consumes[i].isValid()) {
                return false;
            }
        }

        for (i = 0; i < this.provides.length; i++) {
            if (!this.provides[i].isValid()) {
                return false;
            }
        }

        return true;
    }

    @action
    validate() {
        this.errors = [];
        if (!this.data.metadata.name) {
            this.errors.push('No name is defined for block');
        }

        if (!this.name) {
            this.errors.push('No name is defined for instance');
        }

        if (this.blockReference &&
            !this.blockReference.ref) {
            this.errors.push('No block reference found for instance');
        }

        const blockType = BlockTypeProvider.get(this.data.kind);

        if (blockType.validate) {
            const typeErrors = blockType.validate(this.data);

            this.errors.push(...typeErrors);
        }


        this.consumes.forEach((resource) => {
            resource.validate();
        });

        this.provides.forEach((resource) => {
            resource.validate();
        });

        if (this.errors.length > 0) {
            //TODO: Handle block errors
            //console.log('block errors', toJS(this.errors));
        }
    }

    getIssues(): { level: string, name?: string, issue: string }[] {
        const out = [...this.errors.map(issue => {
            return {
                level: 'block',
                name: this.getBlockName(),
                issue
            }
        })];

        this.consumes.forEach((resource) => {
            out.push(...resource.errors.map(issue => {
                return {
                    level: 'consumer',
                    name: resource.getName(),
                    issue
                }
            }));
        });

        this.provides.forEach((resource) => {
            out.push(...resource.errors.map(issue => {
                return {
                    level: 'provider',
                    name: resource.getName(),
                    issue
                }
            }));
        });

        return out;
    }
}