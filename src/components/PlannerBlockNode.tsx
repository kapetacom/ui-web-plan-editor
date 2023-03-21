import React from 'react';
import { observer } from 'mobx-react';

import { toClass } from '@kapeta/ui-web-utils';
import {
    BlockKind,
    DataWrapper,
    Dimensions,
    ItemType,
    ResourceRole,
} from '@kapeta/ui-web-types';
import { InstanceStatus } from '@kapeta/ui-web-context';
import { ButtonStyle, DnDDrag, showDelete } from '@kapeta/ui-web-components';

import { PlannerNodeSize } from '../types';
import { PlannerBlockResourceList } from './PlannerBlockResourceList';
import { PlannerBlockModelWrapper } from '../wrappers/PlannerBlockModelWrapper';
import { PlannerModelWrapper } from '../wrappers/PlannerModelWrapper';
import { BlockMode } from '../wrappers/wrapperHelpers';
import { BlockNode } from './BlockNode';

import './PlannerBlockNode.less';
import { action } from 'mobx';
import { SVGCircleButton } from './SVGCircleButton';

interface PlannerBlockNodeProps {
    block: PlannerBlockModelWrapper;
    size: PlannerNodeSize;
    status: InstanceStatus;
    className?: string;
    zoom: number;
    onDoubleTap?: () => void;
    readOnly?: boolean;
    viewOnly?: boolean;
    onDrop?: () => void;
    setItemToEdit?: (
        res: DataWrapper<BlockKind>,
        type: ItemType,
        block?: PlannerBlockModelWrapper
    ) => void;
    setItemToConfigure?: (
        res: DataWrapper<BlockKind>,
        type: ItemType,
        block?: PlannerBlockModelWrapper
    ) => void;
    setItemToInspect?: (
        res: DataWrapper<BlockKind>,
        type: ItemType,
        block?: PlannerBlockModelWrapper
    ) => void;
    planner?: PlannerModelWrapper;
}

@observer
export class PlannerBlockNode extends React.Component<
    PlannerBlockNodeProps,
    any
> {
    private container: SVGPathElement | null = null;

    componentDidMount() {
        if (!this.container) {
            return;
        }

        this.container.addEventListener('mousedown', this.mouseDownHandler);
    }

    @action
    inspectHandler = () => {
        if (this.props.setItemToInspect) {
            this.props.setItemToInspect(this.props.block, ItemType.BLOCK);
        }
    };

    @action
    editHandler = () => {
        if (this.props.setItemToEdit) {
            this.props.setItemToEdit(this.props.block, ItemType.BLOCK);
        }
    };

    @action
    configHandler = () => {
        if (this.props.setItemToConfigure) {
            this.props.setItemToConfigure(this.props.block, ItemType.BLOCK);
        }
    };

    @action
    deleteHandler = async () => {
        const ok = await showDelete(
            'Delete block instance',
            `Are you sure you want to delete ${this.props.block.name}?`
        );
        if (!ok) {
            return;
        }
        if (BlockMode.HIGHLIGHT === this.props.block.mode) {
            return;
        }

        if (this.props.planner) {
            this.props.planner.removeBlock(this.props.block);
        }
    };

    @action
    mouseDownHandler = () => {
        if (!this.props.readOnly) {
            this.props.block.setMode(BlockMode.SHOW);
            window.addEventListener('mouseup', this.mouseUpHandler);
        }
    };

    @action
    mouseUpHandler = () => {
        if (!this.props.readOnly) {
            this.props.block.setMode(BlockMode.HIDDEN);
            window.removeEventListener('mouseup', this.mouseUpHandler);
            if (this.props.onDrop) {
                this.props.onDrop();
            }
        }
    };

    @action
    dragStartHandler = () => {
        if (!this.props.readOnly) {
            this.props.block.setDragging(true);
        }
    };

    @action
    dragMoveHandler = (dimensions: Dimensions) => {
        if (!this.props.readOnly) {
            this.updatePosition(dimensions);
        }
        return false;
    };

    @action
    dragStopHandler = (dimensions: Dimensions) => {
        if (!this.props.readOnly) {
            this.updatePosition(dimensions);
            this.props.block.setDragging(false);
            return false;
        }
        return true;
    };

    @action
    private updatePosition(dimensions: Dimensions) {
        // Needed to adjust for SVG strangeness

        if (!this.props.readOnly) {
            this.props.block.setPosition(dimensions.left, dimensions.top);
        }
    }

    private isPlanReadOnly() {
        return this.props.block.plan.isReadOnly();
    }

    private isPlanViewOnly() {
        return this.props.block.plan.isViewing();
    }

    private isBlockReadOnly() {
        return this.props.block.readonly;
    }

    renderBlockActions(block: PlannerBlockModelWrapper) {
        if (this.isPlanViewOnly()) {
            return <g className="block-actions" />;
        }

        const offset = 11;

        if (this.isPlanReadOnly() && this.isBlockReadOnly()) {
            // Can't delete or edit
            return (
                <g className="block-actions buttons-2">
                    <SVGCircleButton
                        x={block.width - 97 - offset}
                        y={8}
                        className="inspect"
                        style={ButtonStyle.PRIMARY}
                        icon="fa fa-search"
                        onClick={this.inspectHandler}
                    />

                    <SVGCircleButton
                        x={block.width - 57 - offset}
                        y={8}
                        className="config"
                        style={ButtonStyle.DEFAULT}
                        icon="fa fa-tools"
                        onClick={this.configHandler}
                    />
                </g>
            );
        }

        if (this.isPlanReadOnly()) {
            // Can't delete
            return (
                <g className="block-actions buttons-3">
                    <SVGCircleButton
                        x={block.width - 112 - offset}
                        y={0}
                        className="inspect"
                        style={ButtonStyle.PRIMARY}
                        icon="fa fa-search"
                        onClick={this.inspectHandler}
                    />

                    <SVGCircleButton
                        x={block.width - 77 - offset}
                        y={13}
                        className="edit"
                        style={ButtonStyle.SECONDARY}
                        icon="fa fa-pencil"
                        onClick={this.editHandler}
                    />

                    <SVGCircleButton
                        x={block.width - 42 - offset}
                        y={0}
                        className="config"
                        style={ButtonStyle.DEFAULT}
                        icon="fa fa-tools"
                        onClick={this.configHandler}
                    />
                </g>
            );
        }

        if (this.isBlockReadOnly()) {
            // Can't edit
            return (
                <g className="block-actions buttons-3">
                    <SVGCircleButton
                        x={block.width - 112 - offset}
                        y={0}
                        className="inspect"
                        style={ButtonStyle.PRIMARY}
                        icon="fa fa-search"
                        onClick={this.inspectHandler}
                    />

                    <SVGCircleButton
                        x={block.width - 77 - offset}
                        y={13}
                        className="delete"
                        style={ButtonStyle.DANGER}
                        icon="fa fa-trash"
                        onClick={this.deleteHandler}
                    />

                    <SVGCircleButton
                        x={block.width - 42 - offset}
                        y={0}
                        className="config"
                        style={ButtonStyle.DEFAULT}
                        icon="fa fa-tools"
                        onClick={this.configHandler}
                    />
                </g>
            );
        }

        return (
            <g className="block-actions buttons-4">
                <SVGCircleButton
                    x={block.width - 132 - offset}
                    y={-6}
                    className="inspect"
                    style={ButtonStyle.PRIMARY}
                    icon="fa fa-search"
                    onClick={this.inspectHandler}
                />

                <SVGCircleButton
                    x={block.width - 97 - offset}
                    y={8}
                    className="delete"
                    style={ButtonStyle.DANGER}
                    icon="fa fa-trash"
                    onClick={this.deleteHandler}
                />

                <SVGCircleButton
                    x={block.width - 57 - offset}
                    y={8}
                    className="edit"
                    style={ButtonStyle.SECONDARY}
                    icon="fa fa-pencil"
                    onClick={this.editHandler}
                />

                <SVGCircleButton
                    x={block.width - 22 - offset}
                    y={-6}
                    className="config"
                    style={ButtonStyle.DEFAULT}
                    icon="fa fa-tools"
                    onClick={this.configHandler}
                />
            </g>
        );
    }

    render() {
        const block = this.props.block;
        const nodeSize =
            this.props.size !== undefined
                ? this.props.size
                : PlannerNodeSize.FULL;
        const height = block.calculateHeight(nodeSize);
        const highlight = BlockMode.HIGHLIGHT === this.props.block.mode;
        const hasFocused: boolean = !!(
            this.props.planner && this.props.planner.focusedBlock
        );
        const isFocused = this.props.planner
            ? this.props.planner.focusedBlock === block
            : false;
        const isLinkedFocused = !!(
            !isFocused &&
            this.props.planner &&
            this.props.planner.focusedBlock &&
            this.props.planner.focusedBlock.hasConnectionTo(block)
        );

        const blockClassName = toClass({
            'planner-block-node': true,
            'hover-drop':
                [
                    BlockMode.HOVER_DROP_CONSUMER,
                    BlockMode.HOVER_DROP_PROVIDER,
                ].indexOf(this.props.block.mode) > -1,
            highlight: highlight,
            'focused-link': isLinkedFocused,
            'block-dragging': this.props.block.isDragging(),
            invalid: !block.isValid(),
            'block-read-only': this.isBlockReadOnly(),
            'plan-read-only': this.isPlanReadOnly(),
        });

        const groupContainerClasses = toClass({
            'block-action-container': true,
            focused: isFocused,
        });

        const variant = highlight ? 'highlight' : '';

        return (
            <>
                <DnDDrag
                    type="move"
                    dragCopy={false}
                    disabled={hasFocused} // No moving blocks in focused mode
                    value={this.props.block}
                    zoom={1 / this.props.zoom}
                    container=".planner-area-scroll"
                    onDragStart={this.dragStartHandler}
                    onDragMove={this.dragMoveHandler}
                    onDragEnd={this.dragStopHandler}
                >
                    <svg
                        className={`planner-block-node-container ${this.props.className}`}
                        style={{
                            left: `${block.left}px`,
                            top: `${block.top}px`,
                        }}
                        x={block.left}
                        y={block.top}
                        key={block.id}
                    >
                        <g
                            data-node-id={block.id}
                            data-node-type="block"
                            className={blockClassName}
                            onDoubleClick={this.props.onDoubleTap}
                        >
                            <g className={groupContainerClasses}>
                                <rect
                                    fill="transparent"
                                    x={0}
                                    y={height - 40}
                                    width={block.width}
                                    height={70}
                                />

                                <svg y={height - 10} x={0}>
                                    {this.renderBlockActions(block)}
                                </svg>

                                <PlannerBlockResourceList
                                    setItemToEdit={this.props.setItemToEdit}
                                    blockData={block}
                                    size={this.props.size}
                                    planner={this.props.planner}
                                    role={ResourceRole.CONSUMES}
                                    readOnly={this.isBlockReadOnly()}
                                    viewOnly={this.props.viewOnly}
                                    list={block.consumes}
                                    zoom={this.props.zoom}
                                />

                                <PlannerBlockResourceList
                                    setItemToEdit={this.props.setItemToEdit}
                                    planner={this.props.planner}
                                    size={this.props.size}
                                    blockData={block}
                                    role={ResourceRole.PROVIDES}
                                    readOnly={this.isBlockReadOnly()}
                                    viewOnly={this.props.viewOnly}
                                    list={block.provides}
                                    zoom={this.props.zoom}
                                />

                                <BlockNode
                                    height={height}
                                    width={block.width}
                                    typeName={block.getData().metadata.name}
                                    variant={variant}
                                    valid={block.isValid()}
                                    readOnly={this.props.readOnly}
                                    blockRef={(elm) => {
                                        this.container = elm;
                                    }}
                                    status={this.props.status}
                                    instanceName={block.name}
                                    onInstanceNameChange={(newName) =>
                                        (block.name = newName)
                                    }
                                    name={block.getBlockName()}
                                    version={block.version}
                                />
                            </g>
                        </g>
                    </svg>
                </DnDDrag>
            </>
        );
    }
}
