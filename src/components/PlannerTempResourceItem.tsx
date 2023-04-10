/* eslint-disable react/sort-comp */
import React, { Component } from 'react';
import { ItemType, ResourceRole,  Point } from '@kapeta/ui-web-types';

import { ResourceTypeProvider } from '@kapeta/ui-web-context';

import './PlannerBlockResourceListItem.less';

import { PlannerNodeSize } from '../types';
import { PlannerResourceModelWrapper } from '../wrappers/PlannerResourceModelWrapper';
import { PlannerBlockModelWrapper } from '../wrappers/PlannerBlockModelWrapper';
import { PlannerModelWrapper } from '../wrappers/PlannerModelWrapper';

import { RESOURCE_SPACE } from './PlannerBlockResourceListItem';

import { BlockResource } from './BlockResource';
import { BlockMode, ResourceMode } from '../wrappers/wrapperHelpers';

import { PlannerConnectionModelWrapper } from '../wrappers/PlannerConnectionModelWrapper';
import {DataWrapper, SelectedResourceItem } from '../wrappers/models';
import { asHTMLElement, DOMElement } from '@kapeta/ui-web-utils';
import { observer } from 'mobx-react';
import { action, computed, makeObservable, observable } from 'mobx';
import { Connection, Dimensions } from '@kapeta/schemas';

export interface PlannerTempResourceItemProps {
    selectedResource: SelectedResourceItem;
    size: PlannerNodeSize;
    setItemToEdit?: (res: DataWrapper<Connection>, type: ItemType, creating?: boolean) => void;
    planner: PlannerModelWrapper;
    zoom?: number;
}

@observer
export class PlannerTempResourceItem extends Component<PlannerTempResourceItemProps> {
    @observable
    private readonly compatibleResources: PlannerResourceModelWrapper[] = [];

    private elm: DOMElement | null = null;

    constructor(props: PlannerTempResourceItemProps) {
        super(props);
        makeObservable(this);
    }

    @computed
    private get resource() {
        return this.props.selectedResource.resource;
    }

    @computed
    private get original() {
        return this.props.selectedResource.original;
    }

    @computed
    private get block() {
        return this.props.selectedResource.original.block;
    }

    @action
    private updateDimensionsFromEvent(evt: MouseEvent) {
        let scroll: Point = { x: 0, y: 0 };
        let offset: Point = { x: 0, y: 0 };
        if (this.elm) {
            const container = this.elm.closest('.planner-area-scroll');
            if (container) {
                scroll = {
                    x: container.scrollLeft,
                    y: container.scrollTop,
                };
                const bbox = container.getBoundingClientRect();
                offset = {
                    y: bbox.y,
                    x: bbox.x,
                };
            }
        }

        this.resource.updateDimensionsFromEvent(
            this.props.size,
            evt,
            this.props.zoom ? this.props.zoom : 1,
            scroll,
            offset
        );
    }

    @observable
    private findValidResourceFromDimensions(hoverDimensions: Dimensions) {
        return this.props.planner.filterResourcesFromDimensions(this.compatibleResources, hoverDimensions);
    }

    @observable
    private findValidBlockFromDimensions(hoverDimensions: Dimensions) {
        return this.props.planner.findValidBlockTargetFromDimensionsAndResource(
            this.props.size,
            hoverDimensions,
            this.resource
        );
    }

    @computed
    private get xPosition() {
        if (this.resource.dimensions) {
            return this.resource.dimensions.left;
        }

        return 150;
    }

    @observable
    private getResourceHeight() {
        return this.block.getResourceHeight(this.props.size);
    }

    @computed
    private get yPosition() {
        if (this.resource.dimensions) {
            return this.resource.dimensions.top;
        }

        return 200;
    }

    @action
    private moveHandler = (evt: MouseEvent) => {
        this.updateDimensionsFromEvent(evt);

        if (!this.resource.dimensions) {
            // TypeScript needs this
            return;
        }

        const hoverDimensions = this.resource.dimensions;

        let activeBlock: PlannerBlockModelWrapper | undefined;

        const activeResource = this.findValidResourceFromDimensions(hoverDimensions);
        if (!activeResource) {
            activeBlock = this.findValidBlockFromDimensions(hoverDimensions);
            if (activeBlock && activeBlock.readonly) {
                activeBlock = undefined;
            }
        }

        this.props.planner.blocks.forEach((block) => {
            if (activeBlock === block) {
                const role =
                    this.resource.role === ResourceRole.CONSUMES ? ResourceRole.PROVIDES : ResourceRole.CONSUMES;
                block.setHoverDropModeFromRole(role);
            } else {
                block.setMode(BlockMode.HIDDEN);
            }
        });

        this.compatibleResources.forEach((compatibleResource: PlannerResourceModelWrapper) => {
            if (activeResource === compatibleResource) {
                compatibleResource.setMode(ResourceMode.HOVER_COMPATIBLE);
            } else {
                compatibleResource.setMode(ResourceMode.COMPATIBLE);
            }
        });
    };

    @action
    private mouseUpHandler = (evt: MouseEvent) => {
        this.updateDimensionsFromEvent(evt);

        if (!this.resource.dimensions) {
            // TypeScript needs this
            return;
        }

        const hoverDimensions = this.resource.dimensions;

        let activeBlock: PlannerBlockModelWrapper | undefined;

        const activeResource = this.findValidResourceFromDimensions(hoverDimensions);
        if (!activeResource) {
            activeBlock = this.findValidBlockFromDimensions(hoverDimensions);
        }

        if (activeResource) {
            const connection = PlannerConnectionModelWrapper.createFromResources(this.original, activeResource);
            this.props.planner.addConnection(connection);

            const converter = ResourceTypeProvider.getConverterFor(
                connection.fromResource.getKind(),
                connection.toResource.getKind()
            );
            if (converter && converter.mappingComponentType && this.props.setItemToEdit) {
                this.props.setItemToEdit(connection, ItemType.CONNECTION, true);
            }
        } else if (activeBlock && !activeBlock.readonly) {
            activeBlock.setMode(BlockMode.HIDDEN);
            this.props.planner.copyResourceToBlock(activeBlock.id, this.original);
        }

        this.dragEnd();
        this.props.planner.unsetSelectedResources();
    };

    @action
    private dragstart = () => {
        this.props.planner.blocks
            .filter((block) => {
                // remove the current block from the pool to find compatible landing resources
                return this.block.id !== block.id;
            })
            .forEach((block) => {
                block.consumes.forEach((resource) => {
                    if (ResourceTypeProvider.canApplyResourceToKind(this.resource.getKind(), resource.getKind())) {
                        if (!this.props.planner.hasIncomingConnection(resource)) {
                            this.compatibleResources.push(resource);
                            resource.setMode(ResourceMode.COMPATIBLE);
                        }
                    }
                });
            });
    };

    @action
    private dragEnd = () => {
        this.props.planner.blocks.forEach((block) => {
            block.consumes.forEach((resource) => {
                if (resource.mode !== ResourceMode.HIGHLIGHT) {
                    resource.setMode(ResourceMode.HIDDEN);
                }
            });
        });
    };

    componentDidMount() {
        window.addEventListener('mousemove', this.moveHandler);
        window.addEventListener('mouseup', this.mouseUpHandler);
        this.dragstart();
    }

    componentWillUnmount() {
        window.removeEventListener('mousemove', this.moveHandler);
        window.removeEventListener('mouseup', this.mouseUpHandler);
    }

    render() {
        const heightInner = this.getResourceHeight() - RESOURCE_SPACE;
        const resourceConfig = ResourceTypeProvider.get(this.resource.getKind());

        const position = {
            x: this.xPosition,
            y: this.yPosition,
        };

        return (
            <>
                {this.resource.dimensions && (
                    <svg
                        className="planner-temp-resource-item"
                        style={{ left: position.x, top: position.y }}
                        ref={(ref: SVGSVGElement) => {
                            this.elm = asHTMLElement(ref);
                        }}
                    >
                        <BlockResource
                            type={resourceConfig.type.toLowerCase()}
                            name={this.resource.getName()}
                            height={heightInner}
                            width={this.resource.dimensions.width}
                        />
                    </svg>
                )}
            </>
        );
    }
}
