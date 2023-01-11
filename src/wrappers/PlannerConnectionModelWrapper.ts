import {action, makeObservable, observable, toJS} from "mobx";
import _ from 'lodash';

import type { Point, BlockConnectionSpec, DataWrapper } from "@blockware/ui-web-types";
import { ResourceRole } from "@blockware/ui-web-types";
import { BasisCurve } from "@blockware/ui-web-utils";
import { ResourceTypeProvider } from '@blockware/ui-web-context';

import PlannerResourceModelWrapper from "./PlannerResourceModelWrapper";
import { PlannerModelWrapper } from "./PlannerModelWrapper";
import { PlannerNodeSize } from "../types";

export default class PlannerConnectionModelWrapper implements DataWrapper<BlockConnectionSpec> {
    @observable
    id: string;

    @observable
    readonly fromResource: PlannerResourceModelWrapper;

    @observable
    readonly toResource: PlannerResourceModelWrapper;

    @observable
    private data: BlockConnectionSpec;

    @observable
    errors: string[] = [];

    @observable
    editing: boolean = false;


    static createFromData(data: BlockConnectionSpec, planner: PlannerModelWrapper) {

        const fromBlock = planner.findBlockById(data.from.blockId);
        if (!fromBlock) {
            throw new Error('Source Block not found: ' + data.from.blockId);
        }

        const toBlock = planner.findBlockById(data.to.blockId);

        if (!toBlock) {
            throw new Error('Target Block not found: ' + data.from.blockId);
        }

        const fromResource = fromBlock.findResourceById(ResourceRole.PROVIDES, data.from.resourceName);

        if (!fromResource) {
            throw new Error('Provider resource not found: ' + data.from.resourceName);
        }

        const toResource = toBlock.findResourceById(ResourceRole.CONSUMES, data.to.resourceName);

        if (!toResource) {
            throw new Error('Consumer resource not found: ' + data.to.resourceName);
        }

        return makeObservable(new PlannerConnectionModelWrapper(data, fromResource, toResource));
    }

    static createFromResources(fromResource: PlannerResourceModelWrapper, toResource: PlannerResourceModelWrapper) {
        return new PlannerConnectionModelWrapper({
            from: {
                blockId: fromResource.block.id,
                resourceName: fromResource.id
            },
            to: {
                blockId: toResource.block.id,
                resourceName: toResource.id
            },
        }, fromResource, toResource);
    }

    constructor(connection: BlockConnectionSpec, fromResource: PlannerResourceModelWrapper, toResource: PlannerResourceModelWrapper) {
        makeObservable(this);
        this.data = connection;
        this.id = [
            connection.from.blockId,
            connection.from.resourceName,
            connection.to.blockId,
            connection.to.resourceName
        ].join('_');

        this.fromResource = fromResource;
        this.toResource = toResource;

        this.recalculateMapping();
    }

    getData(): BlockConnectionSpec {
        return { ...toJS(this.data) };
    }

    @action
    setData(data: BlockConnectionSpec) {
        this.data = data;

        this.validate();
    }

    get from() {
        return this.data.from;
    }

    get to() {
        return this.data.to;
    }

    get mapping() {
        return this.data.mapping;
    }

    @action
    setEditing(editing: boolean) {
        this.editing = editing;
    }

    isValid() {
        return this.errors.length === 0;
    }


    @action
    validate() {
        this.errors = [];
        if (!this.data.from) {
            this.errors.push('Missing source resource definition');
        }

        if (!this.data.to) {
            this.errors.push('Missing target resource definition');
        }

        const converter = this.getConverter();

        if (converter && converter.mappingComponentType && !this.data.mapping) {
            this.errors.push('Missing mapping definition');
        }

        if (_.isObject(this.data.mapping)) {

            if (converter &&
                converter.validateMapping) {
                const mappingErrors = converter.validateMapping(
                    this.data,
                    this.fromResource.getData(),
                    this.toResource.getData(),
                    this.fromResource.block.getEntities(),
                    this.toResource.block.getEntities()
                );

                this.errors.push(...mappingErrors);
            }

        }

        if (this.errors.length > 0) {
            //TODO: Do something about these
            //console.log('connection errors', toJS(this.errors));
        }

    }

    /**
     * This method cleans up and re-organises mapping
     *
     * Call this method after changing to or from resources
     */
    @action
    recalculateMapping() {

        const converter = this.getConverter();

        if (!converter ||
            !converter.updateMapping) {
            return;
        }

        const data = toJS(this.data);

        const newMapping = converter.updateMapping(
            data,
            this.fromResource.getData(),
            this.toResource.getData(),
            this.fromResource.block.getEntities(),
            this.toResource.block.getEntities()
        );

        if (!_.isEqual(data.mapping, newMapping)) {
            this.data.mapping = newMapping;
        }

        this.validate();
    }

    getPoints(size:number){
        if(this.fromResource.dimensions && this.toResource.dimensions){
            let points:Point[] = this.getCurveMainPoints(this.fromResource.getConnectionPoint(size),this.toResource.getConnectionPoint(size));
            return points
        }
        return []
    }

    //the dragging resource is calculating the points in the PlannerTempResourceItem component
    //but utilizes getCurveFromPoints from the current class
    getCurveMainPoints(fromPoint:Point,toPoint:Point){
        const indent = 40;

        let points = [
            {x:fromPoint.x, y:fromPoint.y},
            {x:fromPoint.x + indent, y:fromPoint.y},
            {x:toPoint.x - indent, y:toPoint.y},
            {x:toPoint.x , y:toPoint.y}
        ]
        
        return points; 
    }

    static calculatePathBetweenPoints(fromPoint: Point, toPoint: Point) {
        const indent = 40;
        let points = [
            {x:fromPoint.x, y:fromPoint.y},
            {x:fromPoint.x + indent, y:fromPoint.y},
            {x:toPoint.x - indent, y:toPoint.y},
            {x:toPoint.x , y:toPoint.y}
        ]
        return PlannerConnectionModelWrapper.getCurveFromPoints(points);
    }

    static getCurveFromPoints(points:Point[]){
        const curve = new BasisCurve();
        curve.lineStart();
        points.forEach(function(point) {
            curve.point(point);
        });
        curve.lineEnd();
        return curve.toString();
    }

    calculatePath(size:PlannerNodeSize,points?:Point[]) {
        if(!points){
            points = this.getCurveMainPoints(this.fromResource.getConnectionPoint(size),this.toResource.getConnectionPoint(size))
        }
        return PlannerConnectionModelWrapper.getCurveFromPoints(points);
    }
   


    private getConverter() {
        return ResourceTypeProvider.getConverterFor(this.fromResource.getKind(), this.toResource.getKind());
    }

}