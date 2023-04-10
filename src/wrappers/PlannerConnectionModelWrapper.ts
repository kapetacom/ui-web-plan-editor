import { action, computed, makeObservable, observable, runInAction, toJS } from 'mobx';
import _ from 'lodash';

import type { Point } from '@kapeta/ui-web-types';
import { ResourceRole } from '@kapeta/ui-web-types';
import { BasisCurve } from '@kapeta/ui-web-utils';
import { ResourceTypeProvider } from '@kapeta/ui-web-context';

import { PlannerResourceModelWrapper } from './PlannerResourceModelWrapper';
import { PlannerModelWrapper } from './PlannerModelWrapper';
import { PlannerNodeSize } from '../types';
import {DataWrapper} from "./models";
import { Connection } from '@kapeta/schemas';

export class PlannerConnectionModelWrapper implements DataWrapper<Connection> {
    @observable
    readonly fromResource: PlannerResourceModelWrapper;

    @observable
    readonly toResource: PlannerResourceModelWrapper;

    @observable
    private data: Connection;

    @observable
    errors: string[] = [];

    @observable
    editing: boolean = false;

    static createFromData(data: Connection, planner: PlannerModelWrapper) {
        return runInAction(() => {
            const consumerBlock = planner.findBlockById(data.consumer.blockId);
            if (!consumerBlock) {
                throw new Error(`Consumer block not found: ${data.consumer.blockId}`);
            }

            const providerBlock = planner.findBlockById(data.provider.blockId);

            if (!providerBlock) {
                throw new Error(`Provider block not found: ${data.provider.blockId}`);
            }

            const providerResource = providerBlock.findResourceById(ResourceRole.PROVIDES, data.provider.resourceName);

            if (!providerResource) {
                throw new Error(`Provider resource not found: ${data.provider.blockId}.${data.provider.resourceName}`);
            }

            const consumerResource = consumerBlock.findResourceById(ResourceRole.CONSUMES, data.consumer.resourceName);

            if (!consumerResource) {
                throw new Error(`Consumer resource not found: ${data.consumer.blockId}.${data.consumer.resourceName}`);
            }

            return makeObservable(new PlannerConnectionModelWrapper(data, providerResource, consumerResource));
        });
    }

    static createFromResources(fromResource: PlannerResourceModelWrapper, toResource: PlannerResourceModelWrapper) {
        return makeObservable(
            new PlannerConnectionModelWrapper(
                {
                    consumer: {
                        blockId: fromResource.block.id,
                        resourceName: fromResource.id,
                    },
                    provider: {
                        blockId: toResource.block.id,
                        resourceName: toResource.id,
                    },
                },
                fromResource,
                toResource
            )
        );
    }

    constructor(
        connection: Connection,
        fromResource: PlannerResourceModelWrapper,
        toResource: PlannerResourceModelWrapper
    ) {
        this.data = connection;
        this.fromResource = fromResource;
        this.toResource = toResource;
        this.recalculateMapping();
        makeObservable(this);
    }

    @computed
    get id() {
        return [
            this.data.consumer.blockId,
            this.data.consumer.resourceName,
            this.data.provider.blockId,
            this.data.provider.resourceName,
        ].join('_');
    }

    @observable
    getData(): Connection {
        return { ...toJS(this.data) };
    }

    @action
    setData(data: Connection) {
        this.data = data;

        this.validate();
    }

    @computed
    get consumer() {
        return this.data.consumer;
    }

    @computed
    get provider() {
        return this.data.provider;
    }

    @computed
    get mapping() {
        return this.data.mapping;
    }

    @action
    setEditing(editing: boolean) {
        this.editing = editing;
    }

    @observable
    isValid() {
        return this.errors.length === 0;
    }

    @action
    validate() {
        this.errors = [];
        if (!this.data.consumer) {
            this.errors.push('Missing source resource definition');
        }

        if (!this.data.provider) {
            this.errors.push('Missing target resource definition');
        }

        const converter = this.getConverter();

        if (converter && converter.mappingComponentType && !this.data.mapping) {
            this.errors.push('Missing mapping definition');
        }

        if (_.isObject(this.data.mapping)) {
            if (converter && converter.validateMapping) {
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
            // TODO: Do something about these
            // console.log('connection errors', toJS(this.errors));
        }
    }

    /**
     * This method cleans up and re-organises mapping
     *
     * Call this method after changing provider or from resources
     */
    @action
    recalculateMapping() {
        const converter = this.getConverter();
        this.data.consumer.resourceName = this.fromResource.id;
        this.data.provider.resourceName = this.toResource.id;

        if (!converter || !converter.updateMapping) {
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

    @observable
    getPoints(size: number) {
        if (this.fromResource.dimensions && this.toResource.dimensions) {
            const points: Point[] = this.getCurveMainPoints(
                this.fromResource.getConnectionPoint(size),
                this.toResource.getConnectionPoint(size)
            );
            return points;
        }
        return [];
    }

    // the dragging resource is calculating the points in the PlannerTempResourceItem component
    // but utilizes getCurveFromPoints from the current class
    getCurveMainPoints(fromPoint: Point, toPoint: Point) {
        const indent = 40;

        const points = [
            { x: fromPoint.x, y: fromPoint.y },
            { x: fromPoint.x + indent, y: fromPoint.y },
            { x: toPoint.x - indent, y: toPoint.y },
            { x: toPoint.x, y: toPoint.y },
        ];

        return points;
    }

    static calculatePathBetweenPoints(fromPoint: Point, toPoint: Point) {
        const indent = 40;
        const points = [
            { x: fromPoint.x, y: fromPoint.y },
            { x: fromPoint.x + indent, y: fromPoint.y },
            { x: toPoint.x - indent, y: toPoint.y },
            { x: toPoint.x, y: toPoint.y },
        ];
        return PlannerConnectionModelWrapper.getCurveFromPoints(points);
    }

    static getCurveFromPoints(points: Point[]) {
        const curve = new BasisCurve();
        curve.lineStart();
        points.forEach((point) => {
            curve.point(point);
        });
        curve.lineEnd();
        return curve.toString();
    }

    @observable
    calculatePath(size: PlannerNodeSize, points?: Point[]) {
        if (!points) {
            // eslint-disable-next-line no-param-reassign
            points = this.getCurveMainPoints(
                this.fromResource.getConnectionPoint(size),
                this.toResource.getConnectionPoint(size)
            );
        }
        return PlannerConnectionModelWrapper.getCurveFromPoints(points);
    }

    @observable
    private getConverter() {
        return ResourceTypeProvider.getConverterFor(this.fromResource.getKind(), this.toResource.getKind());
    }
}
