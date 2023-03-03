import React, { Component } from 'react';
import { observer } from 'mobx-react';

import { ItemType, ResourceRole } from '@blockware/ui-web-types';
import { toClass } from '@blockware/ui-web-utils';

import { PlannerNodeSize } from '../types';
import { PlannerBlockResourceListItem } from './PlannerBlockResourceListItem';
import { PlannerResourceModelWrapper } from '../wrappers/PlannerResourceModelWrapper';
import { PlannerBlockModelWrapper } from '../wrappers/PlannerBlockModelWrapper';
import { PlannerModelWrapper } from '../wrappers/PlannerModelWrapper';
import { BlockMode } from '../wrappers/wrapperHelpers';
import { observable } from 'mobx';

export interface PlannerBlockResourceListProps {
    list: PlannerResourceModelWrapper[];
    role: ResourceRole;
    blockData: PlannerBlockModelWrapper;
    size: PlannerNodeSize;
    setItemToEdit?: (
        res:
            | PlannerResourceModelWrapper
            | PlannerBlockModelWrapper
            | any
            | undefined,
        type: ItemType,
        block?: PlannerBlockModelWrapper
    ) => void;
    planner?: PlannerModelWrapper;
    zoom?: number;
    readOnly?: boolean;
    viewOnly?: boolean;
}

@observer
export class PlannerBlockResourceList extends Component<
    PlannerBlockResourceListProps,
    any
> {
    constructor(props: PlannerBlockResourceListProps) {
        super(props);

        this.state = {
            list: this.props.list,
            role: this.props.role,
            width: 0,
            height: 0,
            blockData: this.props.blockData,
        };
    }

    @observable
    getYOffset(size: PlannerNodeSize) {
        const block = this.props.blockData;
        return block.calculateOffsetTop(size, this.props.role);
    }

    @observable
    getPlaceholderYOffset(size: PlannerNodeSize) {
        return this.props.blockData.getResourceHeight(size);
    }

    @observable
    showPlaceholder() {
        if (
            this.props.role === ResourceRole.PROVIDES &&
            this.props.blockData.mode === BlockMode.HOVER_DROP_PROVIDER
        ) {
            return true;
        }

        if (
            this.props.role === ResourceRole.CONSUMES &&
            this.props.blockData.mode === BlockMode.HOVER_DROP_CONSUMER
        ) {
            return true;
        }

        return false;
    }

    render() {
        const nodeSize =
            this.props.size !== undefined
                ? this.props.size
                : PlannerNodeSize.FULL;
        const resourceRight = this.props.blockData.getResourceHeight(nodeSize);
        const offsetX = 1;
        const placeholderWidth = 4;
        const placeholderX =
            this.props.role === ResourceRole.PROVIDES
                ? this.props.blockData.width + offsetX
                : -placeholderWidth;

        const plannerResourceListClass = toClass({
            'planner-resource-list': true,
            show: this.showPlaceholder(),
            [this.props.role.toLowerCase()]: true,
        });
        const yPosition = this.getYOffset(nodeSize);
        return (
            <svg
                className={plannerResourceListClass}
                overflow="visible"
                x={0}
                y={yPosition}
            >
                {this.props.list.map((resource, index: number) => {
                    return (
                        <PlannerBlockResourceListItem
                            readOnly={this.props.readOnly}
                            viewOnly={this.props.viewOnly}
                            setItemToEdit={this.props.setItemToEdit}
                            size={this.props.size}
                            key={`${resource.id}_${index}`}
                            resource={resource}
                            index={index}
                            zoom={this.props.zoom}
                            planner={this.props.planner}
                        />
                    );
                })}

                <svg
                    className="resource-placeholder"
                    x={placeholderX}
                    y={resourceRight * this.props.list.length}
                >
                    <rect
                        height={resourceRight - 4}
                        width={placeholderWidth - offsetX}
                    />
                </svg>
            </svg>
        );
    }
}
