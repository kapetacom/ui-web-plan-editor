import React from 'react';
import {observer} from "mobx-react";

import {toClass} from "@blockware/ui-web-utils";
import {ItemType, ResourceRole, BlockKind, DataWrapper, Dimensions} from "@blockware/ui-web-types";
import {BlockTypeProvider, InstanceStatus} from "@blockware/ui-web-context";
import {
    DialogControl,
    SVGButtonEdit,
    SVGButtonDelete,
    DnDDrag,
    DialogTypes,
    SVGButtonInspect
} from '@blockware/ui-web-components';


import {PlannerNodeSize} from '../types';
import PlannerBlockResourceList from './PlannerBlockResourceList';
import PlannerBlockModelWrapper from "../wrappers/PlannerBlockModelWrapper";
import {PlannerModelWrapper} from "../wrappers/PlannerModelWrapper";
import {BlockMode} from "../wrappers/wrapperHelpers";
import BlockNode from "./BlockNode";

import './PlannerBlockNode.less';

interface PlannerBlockNodeProps {
    block: PlannerBlockModelWrapper
    size: PlannerNodeSize
    status: InstanceStatus
    className?: string
    zoom: number
    onDoubleTap?: () => void
    readOnly?: boolean
    onDrop?: () => void
    setItemToEdit?: (res: DataWrapper<BlockKind>, type: ItemType, block?: PlannerBlockModelWrapper) => void
    setItemToInspect?: (res: DataWrapper<BlockKind>, type: ItemType, block?: PlannerBlockModelWrapper) => void
    planner?: PlannerModelWrapper
}

@observer
export default class PlannerBlockNode extends React.Component<PlannerBlockNodeProps, any> {

    private container: SVGPathElement | null = null;

    constructor(props: PlannerBlockNodeProps) {
        super(props);
    }

    inspectHandler = () => {
        this.props.setItemToInspect &&
        this.props.setItemToInspect(this.props.block, ItemType.BLOCK);
    };

    editHandler = () => {
        this.props.setItemToEdit &&
        this.props.setItemToEdit(this.props.block, ItemType.BLOCK);
    };

    deleteHandler = () => {
        DialogControl.show("Delete block?", this.props.block.name, () => {
            if (BlockMode.HIGHLIGHT === this.props.block.mode) {
                return;
            }

            if (this.props.planner) {
                this.props.planner.removeBlock(this.props.block);
            }
        }, DialogTypes.DELETE);
    };

    mouseDownHandler = () => {
        if (!this.props.readOnly) {
            this.props.block.setMode(BlockMode.SHOW);
            window.addEventListener('mouseup', this.mouseUpHandler);
        }
    };

    mouseUpHandler = () => {
        if (!this.props.readOnly) {
            this.props.block.setMode(BlockMode.HIDDEN);
            window.removeEventListener('mouseup', this.mouseUpHandler);
            if (this.props.onDrop) {
                this.props.onDrop();
            }
        }
    };

    dragStartHandler = () => {
        if (!this.props.readOnly) {
            this.props.block.setDragging(true);
        }
    };

    dragMoveHandler = (dimensions: Dimensions) => {
        if (!this.props.readOnly) {
            this.updatePosition(dimensions);
        }
        return false;
    };

    dragStopHandler = (dimensions: Dimensions) => {
        if (!this.props.readOnly) {
            this.updatePosition(dimensions);
            this.props.block.setDragging(false);
            return false;
        }
        return true;
    };

    private updatePosition(dimensions: Dimensions) {
        //Needed to adjust for SVG strangeness

        if (!this.props.readOnly) {
            this.props.block.setPosition(
                dimensions.left,
                dimensions.top
            );
        }
    }

    componentDidMount() {
        if (!this.container) {
            return;
        }

        this.container.addEventListener('mousedown', this.mouseDownHandler);
    }

    renderBlockActions(block) {
        if (this.props.readOnly) {
            return (
                <g className={'block-actions'}>

                    <SVGButtonInspect
                        x={block.width - 92 - 11}
                        y={8}
                        onClick={this.inspectHandler}
                    />


                    <SVGButtonEdit
                        onClick={this.editHandler}
                        x={block.width - 62 - 11}
                        y={8}/>
                </g>
            )
        }

        return (
            <g className={'block-actions'}>

                <SVGButtonInspect
                    x={block.width - 112 - 11}
                    y={0}
                    onClick={this.inspectHandler}
                />

                <SVGButtonDelete
                    onClick={this.deleteHandler}
                    x={block.width - 77 - 11}
                    y={13}/>

                <SVGButtonEdit
                    onClick={this.editHandler}
                    x={block.width - 42 - 11}
                    y={0}/>
            </g>
        )
    }

    render() {
        const block = this.props.block;
        const blockType = BlockTypeProvider.get(block.getData().kind);
        const nodeSize = this.props.size !== undefined ? this.props.size : PlannerNodeSize.FULL;
        const height = block.calculateHeight(nodeSize);
        const highlight = BlockMode.HIGHLIGHT === this.props.block.mode;
        const hasFocused: boolean = !!(this.props.planner && this.props.planner.focusedBlock);
        const isFocused = this.props.planner ? this.props.planner.focusedBlock === block : false;
        const isLinkedFocused = !!(!isFocused &&
            this.props.planner &&
            this.props.planner.focusedBlock && this.props.planner.focusedBlock.hasConnectionTo(block));

        const blockClassName = toClass({
            'planner-block-node': true,
            'hover-drop': [BlockMode.HOVER_DROP_CONSUMER, BlockMode.HOVER_DROP_PROVIDER].indexOf(this.props.block.mode) > -1,
            'highlight': highlight,
            'focused-link': isLinkedFocused,
            'block-dragging': this.props.block.isDragging(),
            'invalid': !block.isValid()
        });


        const groupContainerClasses = toClass({
            "block-action-container": true,
            'focused': isFocused
        })

        const variant = highlight ? 'highlight' : '';


        return (
            <>
                <DnDDrag type={'move'}
                         dragCopy={false}
                         disabled={hasFocused} //No moving blocks in focused mode
                         value={this.props.block}
                         zoom={1 / this.props.zoom}
                         container={'.planner-area-scroll'}
                         onDragStart={this.dragStartHandler}
                         onDragMove={this.dragMoveHandler}
                         onDragEnd={this.dragStopHandler}>

                    <svg className={`planner-block-node-container ${this.props.className}`}
                         style={{left: `${block.left}px`, top: `${block.top}px`}}
                         x={block.left}
                         y={block.top}
                         key={block.id}>
                        <g
                            data-node-id={block.id}
                            data-node-type={'block'}
                            className={blockClassName}
                            onDoubleClick={this.props.onDoubleTap}
                        >

                            <g className={groupContainerClasses}>

                                <rect fill={"transparent"}
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
                                    readOnly={this.props.readOnly}
                                    list={block.consumes}
                                    zoom={this.props.zoom}
                                />

                                <PlannerBlockResourceList
                                    setItemToEdit={this.props.setItemToEdit}
                                    planner={this.props.planner}
                                    size={this.props.size}
                                    blockData={block}
                                    role={ResourceRole.PROVIDES}
                                    readOnly={this.props.readOnly}
                                    list={block.provides}
                                    zoom={this.props.zoom}/>

                                <BlockNode
                                    height={height}
                                    width={block.width}
                                    typeName={block.getData().metadata.name}
                                    variant={variant}
                                    valid={block.isValid()}
                                    readOnly={this.props.readOnly}
                                    blockRef={(elm) => {
                                        this.container = elm
                                    }}
                                    status={this.props.status}
                                    instanceName={block.name}
                                    onInstanceNameChange={(newName) => block.name = newName}
                                    name={block.getBlockName()}
                                    version={block.getBlockVersion()}

                                />
                            </g>

                        </g>
                    </svg>
                </DnDDrag>
            </>
        )
    }

}

