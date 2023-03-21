import {
    action,
    computed,
    makeObservable,
    observable,
    runInAction,
    toJS,
} from 'mobx';
import _ from 'lodash';

import type {
    Point,
    BlockConnectionSpec,
    DataWrapper,
} from '@kapeta/ui-web-types';
import { ResourceRole } from '@kapeta/ui-web-types';
import { BasisCurve } from '@kapeta/ui-web-utils';
import { ResourceTypeProvider } from '@kapeta/ui-web-context';

import { PlannerResourceModelWrapper } from './PlannerResourceModelWrapper';
import { PlannerModelWrapper } from './PlannerModelWrapper';
import { PlannerNodeSize } from '../types';

export class PlannerConnectionModelWrapper
    implements DataWrapper<BlockConnectionSpec>
{
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

    static createFromData(
        data: BlockConnectionSpec,
        planner: PlannerModelWrapper
    ) {
        return runInAction(() => {
            const fromBlock = planner.findBlockById(data.from.blockId);
            if (!fromBlock) {
                throw new Error(`Source Block not found: ${data.from.blockId}`);
            }

            const toBlock = planner.findBlockById(data.to.blockId);

            if (!toBlock) {
                throw new Error(`Target Block not found: ${data.from.blockId}`);
            }

            const fromResource = fromBlock.findResourceById(
                ResourceRole.PROVIDES,
                data.from.resourceName
            );

            if (!fromResource) {
                throw new Error(
                    `Provider resource not found: ${data.from.resourceName}`
                );
            }

            const toResource = toBlock.findResourceById(
                ResourceRole.CONSUMES,
                data.to.resourceName
            );

            if (!toResource) {
                throw new Error(
                    `Consumer resource not found: ${data.to.resourceName}`
                );
            }

            return makeObservable(
                new PlannerConnectionModelWrapper(
                    data,
                    fromResource,
                    toResource
                )
            );
        });
    }

    static createFromResources(
        fromResource: PlannerResourceModelWrapper,
        toResource: PlannerResourceModelWrapper
    ) {
        return makeObservable(
            new PlannerConnectionModelWrapper(
                {
                    from: {
                        blockId: fromResource.block.id,
                        resourceName: fromResource.id,
                    },
                    to: {
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
        connection: BlockConnectionSpec,
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
            this.data.from.blockId,
            this.data.from.resourceName,
            this.data.to.blockId,
            this.data.to.resourceName,
        ].join('_');
    }

    @observable
    getData(): BlockConnectionSpec {
        return { ...toJS(this.data) };
    }

    @action
    setData(data: BlockConnectionSpec) {
        this.data = data;

        this.validate();
    }

    @computed
    get from() {
        return this.data.from;
    }

    @computed
    get to() {
        return this.data.to;
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
     * Call this method after changing to or from resources
     */
    @action
    recalculateMapping() {
        const converter = this.getConverter();
        this.data.from.resourceName = this.fromResource.id;
        this.data.to.resourceName = this.toResource.id;

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
        return ResourceTypeProvider.getConverterFor(
            this.fromResource.getKind(),
            this.toResource.getKind()
        );
    }
}
