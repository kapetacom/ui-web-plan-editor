import React, { Component } from 'react';
import { observer } from "mobx-react";

import {ItemType, Point, ResourceRole} from "@blockware/ui-web-types";
import {toClass} from "@blockware/ui-web-utils";
import {ResourceTypeProvider} from '@blockware/ui-web-context';
import {
    DialogControl,
    SVGButtonDelete,
    SVGButtonEdit,
    DialogTypes,
    SVGButtonInspect, ButtonStyle, showDelete
} from '@blockware/ui-web-components';


import { PlannerNodeSize } from '../types';
import {PlannerResourceModelWrapper} from "../wrappers/PlannerResourceModelWrapper";
import {PlannerModelWrapper} from "../wrappers/PlannerModelWrapper";
import {PlannerBlockModelWrapper} from "../wrappers/PlannerBlockModelWrapper";

import { ResourceMode } from "../wrappers/wrapperHelpers";
import { BlockResource} from "./BlockResource";

import './PlannerBlockResourceListItem.less';
import {action, computed, makeObservable, observable, runInAction} from "mobx";
import {SVGCircleButton} from "./SVGCircleButton";


export const RESOURCE_SPACE = 4; //Vertical distance between resources
const BUTTON_HEIGHT = 24; //Height of edit and delete buttons
const COUNTER_SIZE = 8;

interface PlannerBlockResourceListItemProps {
    resource: PlannerResourceModelWrapper
    index: number
    size?: PlannerNodeSize,
    planner?: PlannerModelWrapper
    zoom?: number
    readOnly?: boolean
    viewOnly?: boolean
    setItemToEdit?: (res: PlannerResourceModelWrapper | PlannerBlockModelWrapper | any | undefined, type: ItemType, block?: PlannerBlockModelWrapper) => void
}

interface PlannerBlockResourceListItemState {
    dragging: boolean
    index: number
    editMode: boolean
    editableResource: PlannerResourceModelWrapper | undefined
    clickDown: boolean

}

@observer
export class PlannerBlockResourceListItem extends Component<PlannerBlockResourceListItemProps, PlannerBlockResourceListItemState>{
    private dragContainer: SVGSVGElement | null = null;
    private mouseOverContainer: SVGSVGElement | null = null;

    constructor(props: PlannerBlockResourceListItemProps) {
        super(props);
        makeObservable(this);
        this.state = {
            clickDown: false,
            dragging: false,
            editMode: false,
            editableResource: undefined,
            index: this.props.index,
        };

    }

    componentDidMount() {
        runInAction(() => this.attachListeners());
    }

    componentWillUnmount() {
        runInAction(() => this.detachListeners());
    }

    @action
    editHandler = () => {
        this.setState({ dragging: false, editMode: true });
        if (this.props.setItemToEdit) {
            this.props.setItemToEdit(this.props.resource, ItemType.RESOURCE, this.getBlock());
        }
    };

    @action
    deleteHandler = async () => {

        const ok = await showDelete('Delete resource', `Are you sure  you want to delete ${this.props.resource.getName()}`);
        if (!ok) {
            return;
        }

        this.setState({ dragging: false });
        this.getBlock().removeResource(this.props.resource.id, this.props.resource.role);
        if (this.props.planner) {
            this.props.planner.removeConnectionByResourceId(this.props.resource.id);
        }
    };

    @observable
    private getBlock() {
        return this.props.resource.block;
    }

    @observable
    getXPosition(resource: PlannerResourceModelWrapper) {
        let extension = 0;

        if (resource.isExtended()) {
            extension = 100;
        }

        if (resource.role === ResourceRole.CONSUMES) {
            return -10.5 - extension;
        }

        return 39 + extension;

    };

    @observable
    renderClipPath(height: number) {
        const resource = this.props.resource;
        let top = 0,
            width = 250,
            left = 0;

        const expanded = resource.isExtended();

        if (resource.role === ResourceRole.CONSUMES) {
            width = (expanded) ? 109.5 : 9.5;
        } else {
            left = (expanded) ? 12 : 112;

        }

        return <rect className={'resource-mask'} width={width} height={height} x={left} y={top} />;
    }


    @action
    handleResourceDragging = (evt: MouseEvent) => {
        if (this.props.resource.mode === ResourceMode.HIGHLIGHT) {
            return;
        }

        evt.stopPropagation();
        evt.preventDefault();

        if (this.getBlock()?.plan?.isReadOnly()) {
            return;
        }

        this.setState({ dragging: false, clickDown: true });
        if (this.props.resource) {

            let scroll:Point = {x:0,y:0};
            let offset:Point = {x:0,y:0};
            if (this.dragContainer) {
                const container = this.dragContainer.closest('.planner-area-scroll');
                if (container) {
                    scroll = {
                        x: container.scrollLeft,
                        y: container.scrollTop
                    }

                    const bbox = container.getBoundingClientRect();

                    offset = {
                        y: bbox.y,
                        x: bbox.x
                    }
                }
            }

            const tmpResource = new PlannerResourceModelWrapper(this.props.resource.role, this.props.resource.getData(), this.getBlock());
            tmpResource.updateDimensionsFromEvent(this.props.size || PlannerNodeSize.MEDIUM, evt, this.getZoom(), scroll, offset);
            this.setState({ dragging: true });

            if (this.props.planner) {
                this.props.planner.setSelectedResources(tmpResource, this.props.resource);
            }
        }
    };

    private getZoom() {
        if (this.props.zoom) {
            return this.props.zoom;
        }

        return 1;
    }

    @action
    openResourceDrawerWithOptions = () => {
        if (this.ignoreMouseMovement()) {
            return;
        }

        this.props.resource.setMode(ResourceMode.SHOW_OPTIONS);
    };

    @action
    openResourceDrawer = () => {
        if (this.ignoreMouseMovement()) {
            return;
        }

        this.props.resource.setMode(ResourceMode.SHOW);
        
    };

    @action
    closeResourcesDrawer = () => {
        if (this.ignoreMouseMovement()) {
            return;
        }

        this.props.resource.setMode(ResourceMode.HIDDEN);
    };

    @observable
    private ignoreMouseMovement() {
        return this.props.resource.mode === ResourceMode.HIGHLIGHT ||
                this.props.resource.mode === ResourceMode.SHOW_FIXED;
    }

    @observable
    detachListeners = () => {

        if (this.dragContainer) {

            if (this.props.resource.role === ResourceRole.PROVIDES) {
                this.dragContainer.removeEventListener("mousedown", this.handleResourceDragging);
            }
        }

        if (this.mouseOverContainer) {
            this.mouseOverContainer.removeEventListener("mousemove", this.openResourceDrawer);
            this.mouseOverContainer.removeEventListener("mouseleave", this.closeResourcesDrawer, false);
        }
    };

    @observable
    attachListeners = () => {

        if (this.dragContainer) {
            if (this.props.resource.role === ResourceRole.PROVIDES) {
                this.dragContainer.addEventListener("mousedown", this.handleResourceDragging);
            }


        }

        if (this.mouseOverContainer) {
            this.mouseOverContainer.addEventListener("mousemove", this.openResourceDrawerWithOptions);
            this.mouseOverContainer.addEventListener("mouseleave", this.closeResourcesDrawer, false);
        }
    };

    @observable
    calculateCounterPosition(height: number) {
        const width = this.getBlock().width;

        const y = (height / 2) - COUNTER_SIZE;

        if (this.props.resource.role === ResourceRole.CONSUMES) {
            return {
                y, x: -COUNTER_SIZE
            };
        }

        return {
            y, x: width - 36
        };
    }

    @observable
    getId() {
        return [
            'resource',
            this.props.resource.block.id,
            this.props.resource.role.toString(),
            this.props.resource.id
        ].join('_');
    }

    render() {
        const nodeSize = this.props.size !== undefined ? this.props.size : PlannerNodeSize.MEDIUM;
        const clipPathId = this.getId() + '_clippath';
        const fixedClipPathId = clipPathId + '_fixed';

        const consumer = (this.props.resource.role === ResourceRole.CONSUMES);
        const height = this.getBlock().getResourceHeight(nodeSize);
        const heightInner = height - RESOURCE_SPACE;
        const yOffset = height * this.props.index;
        const buttonsVisible = this.props.resource.mode === ResourceMode.SHOW_OPTIONS;
        const resourceConfig = ResourceTypeProvider.get(this.props.resource.getKind());
        const type = resourceConfig.type.toString().toLowerCase();
        const title = resourceConfig.title || resourceConfig.kind
        const typeName = title.toString().toLowerCase();

        const counterValue = resourceConfig.getCounterValue ?
            resourceConfig.getCounterValue(this.props.resource.getData()) : 0;

        const buttonY = ((height - BUTTON_HEIGHT) / 2) - (RESOURCE_SPACE / 2);

        const counterPoint = this.calculateCounterPosition(heightInner);
        const counterVisible = counterValue > 0 && buttonsVisible;
        const mouseCatcherWidth = this.getBlock().width + 60;

        this.props.resource.setDimensions({
            height: heightInner,
            width: this.getBlock().width,
            top: this.getBlock().top + this.getBlock().getResourceHeight(nodeSize) + yOffset,
            left: this.getBlock().left - this.getBlock().width
        });

        let buttonX = consumer ? -35 : 130;
        if (!counterVisible) {
            buttonX += consumer ? 5 : -5;
        }

        const containerClass = toClass({
            'planner-block-resource-list-item': true,
            'buttons-visible': buttonsVisible,
            'counter-visible': counterVisible,
            'consumes': consumer
        });

        const bodyClass = toClass({
            'resource-item-body': true,
            [typeName]: true,
            'highlight': this.props.resource.mode === ResourceMode.HIGHLIGHT,
            'compatible': this.props.resource.mode === ResourceMode.COMPATIBLE,
            'compatible hover': this.props.resource.mode === ResourceMode.HOVER_COMPATIBLE,
            'invalid': !this.props.resource.isValid()
        });

        return (
            <>
                <svg x={0} y={yOffset}>
                    <clipPath id={fixedClipPathId}>
                        <rect className={'container-mask'}
                            width={mouseCatcherWidth}
                            height={height}
                            x={consumer ? -mouseCatcherWidth - 1 : this.getBlock().width + 1}
                            y={0} />
                    </clipPath>


                        <svg className={containerClass}
                            clipPath={'url(#' + fixedClipPathId + ')'}
                            x={0}
                            y={0}
                            ref={(elm) => { this.mouseOverContainer = elm }}>

                            <clipPath id={clipPathId}>
                                {this.renderClipPath(height)}
                            </clipPath>

                            <g className={bodyClass}
                                transform={"translate(" + this.getXPosition(this.props.resource) + ",0)"}
                                height={heightInner} >

                                <rect
                                    className={'mouse-catcher'}
                                    opacity="0"
                                    width={mouseCatcherWidth}
                                    height={heightInner}
                                    x={consumer ? -60 : -30}
                                    y={0} >
                                </rect>

                                <svg x={buttonX}
                                    y={buttonY}>
                                    {this.renderActions(consumer)}
                                </svg>

                                <svg clipPath={'url(#' + clipPathId + ')'}
                                    style={{ cursor: consumer ? '' : 'grab' }}
                                    ref={(elm) => { this.dragContainer = elm }}>
                                    <BlockResource
                                        role={this.props.resource.role}
                                        size={this.props.size}
                                        name={this.props.resource.getName()}
                                        readOnly={this.props.readOnly}
                                        type={type}
                                        typeName={typeName}
                                        width={this.getBlock().width}
                                        height={heightInner}
                                    />
                                </svg>

                                <svg width={COUNTER_SIZE * 2}
                                    height={COUNTER_SIZE * 2}
                                    x={counterPoint.x}
                                    y={counterPoint.y}>
                                    <g className={'resource-counter'}>
                                        <circle cx={COUNTER_SIZE} cy={COUNTER_SIZE} r={COUNTER_SIZE} className={'background'} />
                                        <text
                                            textAnchor={'middle'}
                                            className={'foreground'}
                                            y={12} x={COUNTER_SIZE} >
                                            {counterValue}
                                        </text>
                                    </g>
                                </svg>
                            </g>
                        </svg>
                </svg>
            </>
        )
    }

    private renderActions(consumer:boolean) {
        if (this.props.viewOnly) {
            return (
                <g className={'resource-actions'}></g>
            )
        }
        if (this.props.readOnly) {
            return (
                <g className={'resource-actions'}>
                    <SVGCircleButton
                        x={0}
                        y={0}
                        className={'inspect'}
                        style={ButtonStyle.PRIMARY}
                        icon={'fa fa-search'}
                        onClick={this.editHandler} />
                </g>
            )
        }
        return (
            <g className={'resource-actions'}>

                <SVGCircleButton
                    x={0}
                    y={0}
                    className={'delete'}
                    style={ButtonStyle.DANGER}
                    icon={'fa fa-trash'}
                    onClick={this.deleteHandler} />

                <SVGCircleButton
                    x={consumer ? -30 : 30}
                    y={0}
                    className={'edit'}
                    style={ButtonStyle.SECONDARY}
                    icon={'fa fa-pencil'}
                    onClick={this.editHandler} />

            </g>
        )
    }
}