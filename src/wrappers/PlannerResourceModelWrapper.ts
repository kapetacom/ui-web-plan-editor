import {action, makeObservable, observable, toJS} from "mobx";
import {PlannerNodeSize} from "../types";

import {PlannerBlockModelWrapper} from "./PlannerBlockModelWrapper";


import type {DataWrapper, ResourceKind, Dimensions, Point} from "@blockware/ui-web-types";
import {BlockMode, ResourceMode} from "./wrapperHelpers";
import {ResourceRole} from "@blockware/ui-web-types";
import { ResourceTypeProvider } from "@blockware/ui-web-context";
import {PlannerConnectionModelWrapper} from "./PlannerConnectionModelWrapper";

const DEFAULT_EXTENSION_SIZE = 110;

export class PlannerResourceModelWrapper<T = any> implements DataWrapper<ResourceKind> {

    readonly block:PlannerBlockModelWrapper;

    readonly instanceId:string;

    @observable
    id: string;

    @observable
    role: ResourceRole;

    @observable
    mode: ResourceMode;

    @observable
    dimensions?: Dimensions;

    @observable
    errors: string[] = [];

    @observable
    private data: ResourceKind<T>;

    static GetResourceID(resource: ResourceKind) {
        return resource.metadata.name;
    }

    constructor(role:ResourceRole, resource: ResourceKind, block:PlannerBlockModelWrapper) {
        this.instanceId = crypto.randomUUID();
        this.id = PlannerResourceModelWrapper.GetResourceID(resource);
        this.role = role;
        this.mode = ResourceMode.HIDDEN;
        this.data = resource;
        this.block = block;
        this.validate();
        makeObservable(this);
    }

    openLinkedResource (){
        this.block.plan.getConnectionsFor(this).forEach((connection)=>{
            if(this.id === connection.fromResource.id){
                connection.toResource.setMode(ResourceMode.SHOW)
            }else{
                connection.fromResource.setMode(ResourceMode.SHOW)
            }
        })
    }
    closeLinkedResource (){
        this.block.plan.getConnectionsFor(this).forEach((connection)=>{
            if(this.id === connection.fromResource.id){
                connection.toResource.setMode(ResourceMode.HIDDEN)
            }else{
                connection.fromResource.setMode(ResourceMode.HIDDEN)
            }
        })
    }

    @action
    setData(data:ResourceKind) {
        this.data = toJS(data);

        this.block.plan.getConnectionsFor(this).forEach((connection:PlannerConnectionModelWrapper) => {
            connection.recalculateMapping(); //The connection will try to adjust to the changes made in the resource
        });

        this.validate();
    }

    @observable
    getData():ResourceKind {
        return {...toJS(this.data)};
    }
    
    //X point calculations
    @observable
    calculateXOffsetFromBlock() {
        const block = this.block;

        if (this.role === ResourceRole.CONSUMES) {
            return block.left - 28 - this.getExtensionSize();
        }

        return block.left + 16 + this.getExtensionSize();
    }

    @observable
    calculateXOffset() {
        if (this.role === ResourceRole.CONSUMES) {
            return this.calculateXOffsetFromBlock() + 13.5;
        }

        return this.calculateXOffsetFromBlock() + 148;
    }

    @observable
    getExtensionSize() {
        let extensionSize = DEFAULT_EXTENSION_SIZE;
        const readOnly = this.block?.isReadOnly() || this.block?.plan?.isReadOnly();
        const viewing = this.block?.plan?.isViewing();
        if (readOnly) {
            extensionSize -= 30;
        }
        if (viewing) {
            extensionSize -= 30;
        }

        if (this.mode === ResourceMode.SHOW_OPTIONS) {
            return extensionSize + 55;
        }

        if (this.isExtended()) {
            if (viewing) {
                return extensionSize + 60;
            }
            if (readOnly) {
                return extensionSize + 20;
            }
            return extensionSize - 10;
        }

        return 0;
    }

    //Y calculations
    @observable
    calculateYOffset(size: PlannerNodeSize) {

        const block = this.block;

        const resourceHeight = this.block.getResourceHeight(size);

        const offsetTop = this.block.calculateOffsetTop(size, this.role) - 2;

        const resources = (this.role === ResourceRole.CONSUMES) ?
            block.consumes : block.provides;

        let index = resources.indexOf(this);

        if (index < 0) {
            index = 0;
        }

        return offsetTop + this.calculateYOffsetFromBlock(index, resourceHeight, block) + (resourceHeight / 2);
    }

    @observable
    calculateYOffsetFromBlock(index: number, resourceHeight: number, block: PlannerBlockModelWrapper) {
        return (index * resourceHeight) + block.top;
    }

    //point expansion
    @observable
    isExtended() {
        return (
            this.mode === ResourceMode.SHOW ||
            this.mode === ResourceMode.HIGHLIGHT ||
            this.block.mode === BlockMode.SHOW ||
            this.block.mode === BlockMode.FOCUSED ||
            this.mode === ResourceMode.SHOW_OPTIONS ||
            this.mode === ResourceMode.SHOW_FIXED ||
            this.mode === ResourceMode.COMPATIBLE||
            this.mode === ResourceMode.HOVER_COMPATIBLE
        )
    }

    //resource connection point calculation
    @observable
    getConnectionPoint(size:PlannerNodeSize){
        return {x:this.calculateXOffset(),y:this.calculateYOffset(size)}
    }

    @action
    setName(name: any) {
        this.data.metadata.name = name;

        this.validate();
    }

    @action
    setRole(role: ResourceRole) {
        this.role = role;
    }

    @action
    setMode(mode: ResourceMode) {
        this.mode = mode;
    }

    @action
    setId(val: string) {
        this.id = val;
        this.validate();
    }

    @action
    setDimensions(dimensions: Dimensions) {
        this.dimensions = dimensions;
    }

    @action
    updateDimensionsFromEvent(size:PlannerNodeSize, evt:MouseEvent, zoom: number, scroll?: Point) {
        const height = this.block.getResourceHeight(size) - 4;
        const width = 150;

        let x = evt.pageX;
        let y = evt.pageY;

        //Adjust for scroll
        if (scroll) {
            x += scroll.x;
            y += scroll.y;
        }

        //Adjust for main container - hardcoded for now
        x -= 0;
        y -= 35;

        //Adjust for zoom

        x *= zoom;
        y *= zoom;

        //Center mouse offset on element
        x -= (width-20)/2;
        y -= height/2;

        this.setDimensions({
            left: x,
            top: y,
            width: width,
            height: height
        });
    }

    @action
    remove() {
        this.block.removeResource(this.id, this.role);
    }

    @observable
    getKind() {
        return this.data.kind;
    }

    @observable
    getName() {
        return this.data.metadata.name;
    }

    @observable
    isValid() {
        return this.errors.length === 0;
    }

    @action
    validate() {
        this.errors = [];
        if (!this.getName()) {
            this.errors.push('No name is defined for resource');
        }

        if (!this.getKind()) {
            this.errors.push('No kind is defined for resource');
        }

        const resourceType = this.getResourceType();

        if (resourceType.validate) {
            const typeErrors = resourceType.validate(this.data, this.block.getEntities());

            this.errors.push(...typeErrors);
        }
    }

    @observable
    hasMethod(methodId: string) {
        const resourceType = this.getResourceType();
        if (!resourceType.hasMethod) {
            return false;
        }

        return resourceType.hasMethod(this.data, methodId);
    }

    @observable
    getResourceType() {
        
        return ResourceTypeProvider.get(this.getKind());
    }
}