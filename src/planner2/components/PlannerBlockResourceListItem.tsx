import React, { useState } from 'react';

import {
    ResourceConfig,
    ResourceKind,
    ResourceRole,
    ResourceType,
} from '@blockware/ui-web-types';
import { toClass } from '@blockware/ui-web-utils';
import { ResourceTypeProvider } from '@blockware/ui-web-context';

import './PlannerBlockResourceListItem.less';
import { PlannerNodeSize } from '../../types';
import { BlockResource } from '../../components/BlockResource';
import { useBlockContext } from '../BlockContext';
import { ResourceMode } from '../../wrappers/wrapperHelpers';
import { resourceHeight } from '../utils/planUtils';
import { SVGCircleButton } from '../../components/SVGCircleButton';
import { ButtonStyle } from '@blockware/ui-web-components';

export const RESOURCE_SPACE = 4; // Vertical distance between resources
const BUTTON_HEIGHT = 24; // Height of edit and delete buttons
const COUNTER_SIZE = 8;

interface PlannerBlockResourceListItemProps {
    resource: ResourceKind;
    role: ResourceRole;
    index: number;
    size?: PlannerNodeSize;
    readOnly?: boolean;
    mode: ResourceMode;
    hoverMode?: ResourceMode;
}

interface PlannerBlockResourceListItemState {
    dragging: boolean;
    index: number;
    editMode: boolean;
    clickDown: boolean;
}

const renderClipPath = (
    height: number,
    role: ResourceRole,
    expanded: boolean
) => {
    const top = 0;
    let width = 250;
    let left = 0;

    if (role === ResourceRole.CONSUMES) {
        width = expanded ? 109.5 : 9.5;
    } else {
        left = expanded ? 12 : 112;
    }

    return (
        <rect
            className="resource-mask"
            width={width}
            height={height}
            x={left}
            y={top}
        />
    );
};

const renderActions = (consumer: boolean) => {
    // Detect viewOnly/readOnly
    const readOnly = false;
    const viewOnly = false;
    const setItemToInspect = () => {};

    // Hmm, view only actions could be separate?
    if ((readOnly && !setItemToInspect) || viewOnly) {
        return <g className="resource-actions" />;
    }

    // @ts-ignore
    if (readOnly && setItemToInspect) {
        return (
            <g className="resource-actions">
                <SVGCircleButton
                    x={0}
                    y={0}
                    className="inspect"
                    style={ButtonStyle.PRIMARY}
                    icon="fa fa-search"
                    // onClick={this.inspectHandler}
                    onClick={() => {}}
                />
            </g>
        );
    }

    return (
        <g className="resource-actions">
            <SVGCircleButton
                x={0}
                y={0}
                className="delete"
                style={ButtonStyle.DANGER}
                icon="fa fa-trash"
                // onClick={this.deleteHandler}
                onClick={() => {}}
            />

            <SVGCircleButton
                x={consumer ? -30 : 30}
                y={0}
                className="edit"
                style={ButtonStyle.SECONDARY}
                icon="fa fa-pencil"
                // onClick={this.editHandler}
                onClick={() => {}}
            />
        </g>
    );
};

export const PlannerBlockResourceListItem: React.FC<
    PlannerBlockResourceListItemProps
> = (props) => {
    const { blockInstance } = useBlockContext();

    const [isHovered, setHoverState] = useState(false);
    const mode = isHovered ? props.hoverMode || props.mode : props.mode;

    // Change to inclusion list if necessary
    const isExpanded = mode !== ResourceMode.HIDDEN;
    const buttonsVisible = mode === ResourceMode.SHOW_OPTIONS;
    const isConsumer = props.role === ResourceRole.CONSUMES;

    const clipPathId = `${blockInstance.id}_${props.role}_${props.index}_clippath`; // `${this.getId()}_clippath`;
    const fixedClipPathId = `${clipPathId}_fixed`;

    // TODO: extended resources?
    const extension = isExpanded ? 100 : 0;
    const getXPosition = () =>
        props.role === ResourceRole.CONSUMES
            ? -10.5 - extension
            : 39 + extension;

    const nodeSize =
        props.size !== undefined ? props.size : PlannerNodeSize.MEDIUM;
    const height = resourceHeight[nodeSize];
    const heightInner = height - RESOURCE_SPACE;
    const yOffset = height * props.index;

    let resourceConfig: ResourceConfig | null = null;
    const errors: string[] = [];
    try {
        resourceConfig = ResourceTypeProvider.get(props.resource.kind);
    } catch (e) {
        errors.push(`Failed to read resource kind: ${e.message}`);
    }

    const type =
        resourceConfig?.type.toString().toLowerCase() ?? ResourceType.SERVICE;
    const title = resourceConfig?.title || resourceConfig?.kind;
    const typeName = title?.toString().toLowerCase() ?? 'unknown';

    const counterValue = resourceConfig?.getCounterValue
        ? resourceConfig.getCounterValue(props.resource)
        : 0;
    const valid = errors.length === 0 && true; // TODO props.resource.isValid();

    // TODO
    const counterPoint = {
        x: 0,
        y: 0,
    }; // this.calculateCounterPosition(heightInner);
    const counterVisible = counterValue > 0 && buttonsVisible;
    const mouseCatcherWidth = blockInstance.dimensions!.width + 60;

    const buttonY = (height - BUTTON_HEIGHT) / 2 - RESOURCE_SPACE / 2;
    let buttonX = isConsumer ? -35 : 130;
    if (!counterVisible) {
        buttonX += isConsumer ? 5 : -5;
    }

    const containerClass = toClass({
        'planner-block-resource-list-item': true,
        'buttons-visible': buttonsVisible,
        'counter-visible': counterVisible,
        consumes: isConsumer,
    });

    const bodyClass = toClass({
        'resource-item-body': true,
        [typeName]: true,
        // highlight: props.resource.mode === ResourceMode.HIGHLIGHT,
        // compatible: props.resource.mode === ResourceMode.COMPATIBLE,
        // 'compatible hover':
        //     props.resource.mode === ResourceMode.HOVER_COMPATIBLE,
        invalid: !valid,
    });

    return (
        <>
            <svg x={0} y={yOffset}>
                {/* Not sure what this one does */}
                <clipPath id={fixedClipPathId}>
                    <rect
                        className="container-mask"
                        width={mouseCatcherWidth}
                        height={height}
                        x={
                            isConsumer
                                ? -mouseCatcherWidth - 1
                                : blockInstance.dimensions!.width + 1
                        }
                        y={0}
                    />
                </clipPath>

                <svg
                    className={containerClass}
                    clipPath={`url(#${fixedClipPathId})`}
                    x={0}
                    y={0}
                    onMouseLeave={() => setHoverState(false)}
                    onMouseMove={() => setHoverState(true)}
                >
                    {/* Clip the hexagon to create a straight edge */}
                    <clipPath id={clipPathId}>
                        {renderClipPath(height, props.role, isExpanded)}
                    </clipPath>

                    <g
                        className={bodyClass}
                        transform={`translate(${getXPosition()},0)`}
                        height={heightInner}
                    >
                        <rect
                            className="mouse-catcher"
                            opacity="0"
                            width={mouseCatcherWidth}
                            height={heightInner}
                            x={isConsumer ? -60 : -30}
                            y={0}
                        />

                        <svg x={buttonX} y={buttonY}>
                            {renderActions(isConsumer)}
                        </svg>

                        <svg
                            clipPath={`url(#${clipPathId})`}
                            style={{ cursor: isConsumer ? '' : 'grab' }}
                            // ref={(elm) => {
                            //     this.dragContainer = elm;
                            // }}
                        >
                            <BlockResource
                                role={props.role}
                                size={nodeSize}
                                name={props.resource.metadata.name}
                                readOnly={props.readOnly}
                                type={type}
                                typeName={typeName}
                                width={blockInstance.dimensions!.width}
                                height={heightInner}
                            />
                        </svg>

                        <svg
                            width={COUNTER_SIZE * 2}
                            height={COUNTER_SIZE * 2}
                            x={counterPoint.x}
                            y={counterPoint.y}
                        >
                            <g className="resource-counter">
                                <circle
                                    cx={COUNTER_SIZE}
                                    cy={COUNTER_SIZE}
                                    r={COUNTER_SIZE}
                                    className="background"
                                />
                                <text
                                    textAnchor="middle"
                                    className="foreground"
                                    y={12}
                                    x={COUNTER_SIZE}
                                >
                                    {counterValue}
                                </text>
                            </g>
                        </svg>
                    </g>
                </svg>
            </svg>
        </>
    );
};
