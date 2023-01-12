import React from 'react';
import {observer} from "mobx-react";
import * as _ from 'lodash';
import type {Lambda} from "mobx";
import {action, computed, makeObservable, observable, reaction} from "mobx";

import {toClass} from "@blockware/ui-web-utils";
import {DnDContainer, DnDDrop, showToasty, ToastType} from "@blockware/ui-web-components";
import type {DataWrapper, Point, Size} from "@blockware/ui-web-types";
import {
    AssetService,
    FailedBlockMessage,
    InstanceEventType,
    InstanceService,
    InstanceStatus
} from "@blockware/ui-web-context";

import type {BlockPositionCache, ZoomAreaMap} from "../types";
import {PlannerBlockNode} from "../components/PlannerBlockNode";
import {PlannerTempResourceItem} from '../components/PlannerTempResourceItem';
import {PlannerNodeSize} from "../types";
import {PlannerConnection} from "../components/PlannerConnection";
import {PlannerModelWrapper} from "../wrappers/PlannerModelWrapper";
import {PlannerBlockModelWrapper} from "../wrappers/PlannerBlockModelWrapper";
import {PlannerConnectionModelWrapper} from "../wrappers/PlannerConnectionModelWrapper";
import {
    PlannerTempResourceConnection
} from "../components/PlannerTempResourceConnection";

import {PlannerToolbox} from "./components/PlannerToolbox";
import {InspectConnectionPanel} from './components/InspectConnectionPanel';
import {ItemEditorPanel} from "./components/ItemEditorPanel";
import {BlockInspectorPanel} from "./components/BlockInspectorPanel";

import {FOCUSED_ID, FocusHelper, POSITIONING_DATA} from "./helpers/FocusHelper";
import {DnDHelper} from "./helpers/DnDHelper";
import {EditPanelHelper} from "./helpers/EditPanelHelper";
import {InspectBlockPanelHelper} from "./helpers/InspectBlockPanelHelper";

import {SVGDropShadow} from "../utils/SVGDropShadow";


import "./Planner.less";


interface BlockObserver {
    blockObserverDisposer: Lambda
    blockInstanceObserverDisposer: Lambda
    block: PlannerBlockModelWrapper
}

interface ConnectionObserver {
    connectionInstanceObserverDisposer: Lambda
    connection: PlannerConnectionModelWrapper
}

export interface PlannerProps {
    plan: PlannerModelWrapper
    size?: PlannerNodeSize
    routing?: any
    enableInstanceListening?:boolean
    systemId: string
}

export interface PlannerState {
    over: boolean
    clickDown: boolean
    size: PlannerNodeSize
    editableItem: DataWrapper | any | undefined
    error: Error | string | undefined
}

const zoomStep = 0.25;

@observer
export class Planner extends React.Component<PlannerProps, PlannerState> {

    private readonly blockListObserver: Lambda;
    private readonly connectionListObserver: Lambda;
    private instanceServiceUnsubscriber?: () => void;
    private instanceServiceExitedUnsubscribers: (() => void)[] =  [];

    private editPanelHelper: EditPanelHelper = new EditPanelHelper(this);
    private blockInspectorPanelHelper: InspectBlockPanelHelper = new InspectBlockPanelHelper(this);
    private focusHelper = new FocusHelper(this.plan);
    private dnd: DnDHelper = new DnDHelper(this, this.editPanelHelper);
    private blockObservers: BlockObserver[] = [];
    private zoomLevelAreas: ZoomAreaMap = {};
    private canvasContainerElement = React.createRef<HTMLDivElement>();
    private planAnimator = React.createRef<any>(); //Has to be any to be able to invoke the begin function.
    private inspectConnectionPanel: InspectConnectionPanel | null = null;
    private itemEditorPanel: ItemEditorPanel | null = null;
    private blockInspectorPanel: BlockInspectorPanel | null = null;

    @observable
    private connectionObservers: ConnectionObserver[] = [];

    @observable
    private cachedPositions: BlockPositionCache = {};

    @observable
    private hoveredBlock?: PlannerBlockModelWrapper = undefined;

    @observable
    private sidePanelOpen: boolean = false;

    @observable
    private runningBlocks: { [id: string]: { status: InstanceStatus } } = {};

    @observable
    private failedToRunBlocks: { [id: string]: { status: FailedBlockMessage } } = {};

    @observable
    private zoom: number = 1;

    @observable
    private lastZoomLevel: number = 1;

    @observable
    private plannerCanvasSize: Size = {width: 0, height: 0};

    @observable
    private canvasSize = {
        x: 0,
        y: 0,
        width: 0,
        height: 0
    };

    constructor(props: PlannerProps) {
        super(props);
        makeObservable(this);

        this.state = {
            over: false,
            clickDown: false,
            editableItem: undefined,
            error: undefined,
            size: this.props.size || PlannerNodeSize.MEDIUM
        };

        this.plan.blocks.forEach(block => {
            this.runningBlocks[block.id] = {status: InstanceStatus.STOPPED};
        });

        this.connectionListObserver = reaction(() => this.plan.connections, this.onConnectionsChange);
        this.observerConnections(this.plan.connections);
        this.blockListObserver = reaction(() => this.plan.blocks, this.onBlocksChange);
        this.observerBlocks(Object.values(this.plan.blocks));

        this.plan.validate();

        if (props?.enableInstanceListening) {
            this.setupInstanceService()
        }
    }

    private setupInstanceService() {
        InstanceService.getInstanceCurrentStatus()
            .then(instanceStatuses => this.updateRunningBlockStatus(instanceStatuses))
            .catch(() => {});


        this.instanceServiceUnsubscriber = InstanceService.subscribe(this.props.systemId, InstanceEventType.EVENT_INSTANCE_CHANGED, this.onInstanceStatusChanged);
        this.props.plan.blocks.forEach(block => {
            this.instanceServiceExitedUnsubscribers.push(InstanceService.subscribe(block.id, InstanceEventType.EVENT_INSTANCE_EXITED, this.onInstanceStatusExited));
        });
    }


    @computed
    get isFocusMode() {
        return !!this.plan.focusedBlock;
    };

    @action
    private updateRunningBlockStatus(instanceStatuses:any) {
        if (Array.isArray(instanceStatuses)) {
            instanceStatuses.forEach((instanceStatus: any) => {
                if (this.runningBlocks[instanceStatus.instanceId]) {
                    this.runningBlocks[instanceStatus.instanceId] = {status: instanceStatus.status};
                }
            });
        }
    }

    @computed
    get plan(): PlannerModelWrapper {
        return this.props.plan;
    }

    @computed
    get nodeSize(): PlannerNodeSize {
        return this.state.size;
    }

    public getItemEditorPanel() {
        return this.itemEditorPanel;
    }

    public getBlockInspectorPanel() {
        return this.blockInspectorPanel;
    }


    public getInspectConnectionPanel() {
        return this.inspectConnectionPanel;
    }

    @action
    private recalculateCanvas() {
        this.recalculateSize();
        this.canvasSize = this.plan.calculateCanvasSize(this.state.size, this.plannerCanvasSize);
    }

    private recalculateSize() {

        if (!this.canvasContainerElement.current) {
            return;
        }

        const bbox = this.canvasContainerElement.current.getBoundingClientRect();

        this.setPlannerCanvasSize({
            width: bbox.width,
            height: bbox.height
        });
    }

    @action
    private setPlannerCanvasSize(newCanvas: Size) {
        this.plannerCanvasSize = newCanvas;
    }

    private observerConnections(connections: PlannerConnectionModelWrapper[]) {
        connections.forEach((connection) => {
            this.connectionObservers.push({
                connection,
                connectionInstanceObserverDisposer: reaction(() => connection.getData(), () => this.onConnectionInstanceChange(connection), {delay: 500})
            });
        })
    }

    private observerBlocks(blocks: PlannerBlockModelWrapper[]) {
        blocks.forEach((block) => {
            this.blockObservers.push({
                block,
                blockObserverDisposer: reaction(() => block.getData(), () => this.onBlockChange(block), {delay: 500}),
                blockInstanceObserverDisposer: reaction(() => block.getInstance(), () => this.onBlockInstanceChange(), {delay: 500})
            });
        })
    }

    private onInspectorPanelClosed = () => {
        this.setState({editableItem: undefined});
    };

    private onInstanceStatusChanged = (message: any) => {
        this.runningBlocks[message.instanceId] = {
            status: message.status
        }
        this.removeFromFailed(message)
    };
    private removeFromFailed = (message: FailedBlockMessage) => {
        if (this.failedToRunBlocks[message.instanceId]) {
            delete this.failedToRunBlocks[message.instanceId];
        }
    };

    private onInstanceStatusExited = (message: FailedBlockMessage) => {
        const failedBlocks = this.plan.blocks.filter((blockInst) => blockInst.id === message.instanceId);
        if (failedBlocks.length <= 0 || (!message)) {
            return;
        }
        const failedBlockName = failedBlocks[0].name;
        if (!failedBlockName) {
            return;
        }
        showToasty({
            type: ToastType.ALERT,
            title: 'Instance failed',
            message: `${message.error} : ${failedBlockName}`
        });

        this.failedToRunBlocks[message.instanceId] = {status: message};
    };

    /**
     * Handles when number of blocks change
     * @param change
     */
    private onBlocksChange = async (change: any) => {

        if (change.removedCount > 0) {
            const removed = this.blockObservers.filter((observer) => {
                return this.plan.blocks.indexOf(observer.block) === -1;
            });

            while (removed.length > 0) {
                const observer = removed.pop();
                if (observer) {
                    observer.blockObserverDisposer();
                    observer.blockInstanceObserverDisposer();
                    _.pull(this.blockObservers, observer);
                }
            }
        }

        if (change.added &&
            change.added.length > 0) {
            this.observerBlocks(change.added);
        }

        await this.onPlanChange();
    };

    /**
     * Handles when connections change
     */
    private onConnectionsChange = async (change: any) => {
        if (change.removedCount > 0) {
            const removed = this.connectionObservers.filter((observer) => {
                return this.plan.connections.indexOf(observer.connection) === -1;
            });

            while (removed.length > 0) {
                const observer = removed.pop();
                if (observer) {
                    observer.connectionInstanceObserverDisposer();
                    _.pull(this.connectionObservers, observer);
                }
            }
        }

        if (change.added &&
            change.added.length > 0) {
            this.observerConnections(change.added);
        }

        await this.onPlanChange();
    };

    /**
     * Handles when individual blocks change
     * @param block
     */
    private onBlockChange = async (block: PlannerBlockModelWrapper) => {
        await this.saveBlock(block);
    };

    private onBlockInstanceChange = async () => {
        await this.onPlanChange();
    };

    private onPlanChange = async () => {
        await this.savePlan();
    };

    private async saveBlock(block: PlannerBlockModelWrapper) {
        await AssetService.update(block.blockReference.ref, block.getData());
    }

    private async savePlan() {
        await AssetService.update(this.props.systemId, this.props.plan.getData());
    };

    // Handle connection changes (mapping)
    private onConnectionInstanceChange = async (connection: PlannerConnectionModelWrapper) => {
        if (this.plan.connections.indexOf(connection) > -1) {
            this.plan.connections = this.plan.connections.map((con: PlannerConnectionModelWrapper) => {
                return con.id === connection.id ? connection : con;
            })
        }
        await this.onConnectionSaved(connection);
        await this.onPlanChange();
    };

    private handleInspection = (connection: PlannerConnectionModelWrapper) => {
        this.setState({editableItem: connection}, () => {
            this.inspectConnectionPanel && this.inspectConnectionPanel.open();
        });

    };

    private handleWindowResized = () => {
        this.recalculateSize();
    };

    getAdjustedSize(oldSize: Point, nextZoom: number) {
        if (nextZoom > 3 || nextZoom < 0.5) {
            return oldSize;
        }
        return {x: oldSize.x * nextZoom, y: oldSize.y * nextZoom}
    }

    private onBlockSaved = async (block: PlannerBlockModelWrapper) => {
        this.plan.updateBlock(block);
    };

    private onConnectionSaved = async (connection: PlannerConnectionModelWrapper) => {
        this.plan.updateConnection(connection);
    };

    private onBlockRemoved = async (block: PlannerBlockModelWrapper) => {
        this.plan.removeBlock(block);
    };

    private onConnectionRemoved = async (connection: PlannerConnectionModelWrapper) => {
        this.plan.removeConnection(connection);
    };


    componentWillUnmount() {
        this.blockListObserver();//flush the block observers
        while (this.blockObservers.length > 0) {
            const observer = this.blockObservers.pop();
            if (observer) {
                observer.blockObserverDisposer();
                observer.blockInstanceObserverDisposer();
            }
        }

        this.connectionListObserver();//flush the connection observers
        while (this.connectionObservers.length > 0) {
            const observer = this.connectionObservers.pop();
            if (observer) {
                observer.connectionInstanceObserverDisposer();
            }
        }
        if (this.instanceServiceUnsubscriber) {
            this.instanceServiceUnsubscriber();
        }

        if (this.instanceServiceExitedUnsubscribers) {
            this.instanceServiceExitedUnsubscribers.forEach(unsubscriber => {
                unsubscriber();
            });
        }

        window.removeEventListener('resize', this.handleWindowResized);
    }

    componentDidMount() {
        window.addEventListener('resize', this.handleWindowResized);

        //Calculate the init canvas size after canvasContainerElement ref has been retrieved.
        this.recalculateCanvas();

        let zoom = 0.5;
        do {//populate the zoomLevelArea with all possible sizes after mounting
            zoom += zoomStep;
            this.zoomLevelAreas[zoom] = this.focusHelper.getFocusArea(zoom, this.plannerCanvasSize);
        } while (zoom < 3);

        //Fetch the focused block id from local storage anf focus if it exists
        const focusedBlockId = window.localStorage.getItem(FOCUSED_ID);
        if (focusedBlockId) {
            this.props.plan.blocks.forEach(block => {
                if (focusedBlockId === block.id) {
                    this.setFocusZoom(block);
                }
            });
        }
        const localCachedPositionData = window.localStorage.getItem(POSITIONING_DATA);
        if (localCachedPositionData) {
            this.cachedPositions = JSON.parse(localCachedPositionData) as BlockPositionCache;
        }
    }

    private getNodeStatus = (runningBlock: { status: InstanceStatus }, failedBlock: { status: FailedBlockMessage }) => {
        if (failedBlock) {
            return InstanceStatus.EXITED;
        } else if (runningBlock) {
            return runningBlock.status;
        } else {
            return InstanceStatus.STOPPED
        }
    }

    private viewBoxAnimationValues() {
        let newCanvasW = Math.round(this.plannerCanvasSize.width * this.zoom);
        let newCanvasH = Math.round(this.plannerCanvasSize.height * this.zoom);

        let oldCanvasW = Math.round(this.plannerCanvasSize.width * this.lastZoomLevel);
        let oldCanvasH = Math.round(this.plannerCanvasSize.height * this.lastZoomLevel);

        return `0 0 ${oldCanvasW}  ${oldCanvasH}; 0 0 ${newCanvasW}  ${newCanvasH}`;
    }

    private updateAnimation() {
        //There is some async behavior with updating the viewBox 
        //it seems that the invocation of beginElement is also calling the viewBoxAnimationValues
        if (this.planAnimator.current) {
            this.planAnimator.current.beginElement();
        }
    }

    @action
    private setZoomLevel = (increase: boolean) => {
        const resizeStep = 0.25;
        this.lastZoomLevel = this.zoom;
        this.zoom = increase ? +(this.zoom - resizeStep).toFixed(2) : +(this.zoom + resizeStep).toFixed(2);
        if (this.zoom >= 3) {
            this.zoom = 3
        } else if (this.zoom <= 0.4) {
            this.zoom = 0.4
        }
        console.log('this.zoom', this.zoom, this.lastZoomLevel);

        this.updateAnimation();
    }

    scrollPlannerTo(x?: number, y?: number) {
        if (this.canvasContainerElement.current) {
            this.canvasContainerElement.current.scrollTo({top: x ? x : 0, left: y ? y : 0})
        }
    }

    @action
    private resetZoomLevel = () => {
        this.lastZoomLevel = this.zoom;
        if (this.plan.focusedBlock) {
            this.plan.focusedBlock = undefined;
        }
        console.log('Reset zoom')
        this.zoom = 1;
        this.updateAnimation();
    }

    @action
    private setFocusZoom = (block?: PlannerBlockModelWrapper) => {
        //sets the focus block or removes if the block double clicked is the same as the previous one
        if (block) {
            this.plan.setFocusedBlock(block);
            if (this.plan.focusedBlock) {
                window.localStorage.setItem(FOCUSED_ID, this.plan.focusedBlock.id)
            } else {
                window.localStorage.setItem(FOCUSED_ID, "")
            }
        }

        this.scrollPlannerTo();
        console.trace('Set focus zoom');
        this.zoom = this.focusHelper.getFocusZoomLevel(this.zoomLevelAreas, this.nodeSize);
        if (!this.props.plan.focusedBlock && window.localStorage.getItem(FOCUSED_ID) !== null) {
            Object.keys(this.cachedPositions).forEach((key: string) => {
                if (this.plan.findBlockById(key)) {
                    this.plan.findBlockById(key).setPosition(this.cachedPositions[key].x, this.cachedPositions[key].y);
                }
            });
            this.cachedPositions = {};
            window.localStorage.setItem(FOCUSED_ID, "")
            window.localStorage.setItem(POSITIONING_DATA, "")

            this.resetZoomLevel();
            return;
        } else if (window.localStorage.getItem(POSITIONING_DATA) === null || window.localStorage.getItem(POSITIONING_DATA) === "") {

            this.plan.blocks.forEach((block: PlannerBlockModelWrapper) => {
                this.cachedPositions[block.id] = {
                    x: block.getDimensions(this.nodeSize).left,
                    y: block.getDimensions(this.nodeSize).top
                }
            });
            window.localStorage.setItem(POSITIONING_DATA, JSON.stringify(this.cachedPositions))
            if (this.plan.focusedBlock && (window.localStorage.getItem(FOCUSED_ID) === "" || window.localStorage.getItem(FOCUSED_ID) === null)) {
                window.localStorage.setItem(FOCUSED_ID, this.plan.focusedBlock.id)
            }
        }

        if (this.plan.focusedBlock) {
            this.plan.focusedBlock.getConnectedBlocks().all.forEach((block: PlannerBlockModelWrapper) => {
                this.focusHelper.getBlockPositionForFocus(block, this.nodeSize, this.getAdjustedSize({
                    x: this.plannerCanvasSize.width,
                    y: this.plannerCanvasSize.height
                }, this.zoom));
            })
            this.focusHelper.getBlockPositionForFocus(this.plan.focusedBlock, this.nodeSize, this.getAdjustedSize({
                x: this.plannerCanvasSize.width,
                y: this.plannerCanvasSize.height
            }, this.zoom))

        }

        this.updateAnimation();
    }

    private getZoomDivDimensions = () => {
        return {
            height: ((this.zoom < 1) ? (1 / this.zoom) : this.zoom) * this.canvasSize.height,
            width: ((this.zoom < 1) ? (1 / this.zoom) : this.zoom) * this.canvasSize.width
        }
    }


    @action
    private onNeighboringBlockHover = (block?: PlannerBlockModelWrapper) => {
        this.hoveredBlock = block;
    }

    public getZoom() {
        return this.zoom;
    }

    public getScroll():Point {
        if (this.canvasContainerElement.current) {
            return {
                x: this.canvasContainerElement.current.scrollLeft,
                y: this.canvasContainerElement.current.scrollTop
            }
        }

        return {x:0,y:0};
    }

    render() {
        const containerClass = toClass({
            'planner-area-container': true,
            'dragging-resource': !!this.plan.selectedResource,
            'node-size-small': this.state.size === PlannerNodeSize.SMALL,
            'node-size-medium': this.state.size === PlannerNodeSize.MEDIUM,
            'node-size-full': this.state.size === PlannerNodeSize.FULL,
            'dragging': this.plan.isDragging(),
            'read-only': this.plan.isReadOnly()
        });
        const zoomResetClassName = toClass({
            "zoom-reset-hidden": this.zoom === 1,
        })

        const plannerScrollClassnames = toClass({
            'planner-area-scroll': true,
            'focused-planner': !!this.plan.focusedBlock,

        })
        const focusToolbar = toClass({
            'client-block-focus': !!this.plan.focusedBlock,
            "focus-toolbar": true,
            "focus-toolbar-hidden": !this.plan.focusedBlock
        });

        const canvasSize = this.getZoomDivDimensions();

        console.log('render zoom', this.zoom);

        return (
            <>
                {this.state.editableItem &&
                    <InspectConnectionPanel
                        ref={(ref) => this.inspectConnectionPanel = ref}
                        connection={this.state.editableItem}
                        onClose={this.onInspectorPanelClosed}/>
                }

                <ItemEditorPanel ref={(ref) => this.itemEditorPanel = ref}
                                 onClosed={this.editPanelHelper.onClosed}
                                 editableItem={this.editPanelHelper.current}
                                 onBlockSaved={this.onBlockSaved}
                                 onBlockRemoved={this.onBlockRemoved}
                                 onConnectionSaved={this.onConnectionSaved}
                                 onConnectionRemoved={this.onConnectionRemoved}/>

                <BlockInspectorPanel
                    title={this.blockInspectorPanelHelper?.current ? `Inspect ${this.blockInspectorPanelHelper?.current.getBlockName()}` : 'Inspect'}
                    ref={(ref) => this.blockInspectorPanel = ref}
                    planRef={this.plan.getRef()}
                    block={this.blockInspectorPanelHelper?.current?.id ? this.blockInspectorPanelHelper.current : undefined}
                    onClosed={this.blockInspectorPanelHelper.onClosed}
                />

                <DnDContainer
                    overflowX={true}
                    overflowY={true}
                >
                    <div className={containerClass}>

                        <div className={focusToolbar}>
                            {
                                !!this.plan.focusedBlock &&
                                this.focusHelper.renderTopBar({getFocusZoom: this.setFocusZoom})
                            }
                        </div>

                        {!this.props.plan.isReadOnly() &&
                            <PlannerToolbox open={true}/>
                        }

                        {this.focusHelper.renderSideBar({
                            onNeighboringBlockHover: this.onNeighboringBlockHover,
                            getFocusZoom: this.setFocusZoom,
                            sidePanelOpen: this.sidePanelOpen
                        })}

                        <div ref={this.canvasContainerElement}
                             className={plannerScrollClassnames}
                        >
                            <DnDDrop
                                type={['tool', 'block']}
                                onDrop={(type, value, dimensions) => {
                                    if (!this.plan.focusedBlock) {
                                        this.dnd.handleItemDropped(type, value, dimensions)
                                    }
                                }}
                                onDrag={(type, value, dimensions) => {
                                    if (!this.plan.focusedBlock) {
                                        this.dnd.handleItemDragged(type, value, dimensions)
                                    }
                                }}
                            >
                                <div className={'planner-area-canvas'}
                                     style={{...canvasSize, transform:`scale(${1/this.zoom})`}}>
                                    <svg x={0} y={0}
                                         width={canvasSize.width} height={canvasSize.height}
                                         className={'planner-connections'} >
                                        <SVGDropShadow />

                                        {
                                            this.plan.connections.map((connection, index) => {
                                                const connectionClass = toClass({
                                                    "connection-hidden": (this.plan.focusedBlock !== undefined && !this.focusHelper.isConnectionLinkedToFocus(connection))
                                                })
                                                return (

                                                        <PlannerConnection
                                                            className={connectionClass}
                                                            readOnly={this.props.plan.isReadOnly()}
                                                            key={connection.id + "_link_" + index}
                                                            size={this.state.size}
                                                            focusBlock={this.plan.focusedBlock}
                                                            handleInspectClick={this.handleInspection}
                                                            setItemToEdit={(item, type) => this.editPanelHelper.edit(item, type, false)}
                                                            onFocus={() => this.plan.moveConnectionToTop(connection)}
                                                            onDelete={() => this.plan.removeConnection(connection)}
                                                            connection={connection}/>

                                                )
                                            })
                                        }

                                        {this.plan.selectedResource !== undefined &&
                                            <PlannerTempResourceConnection
                                                size={this.state.size}
                                                selectedResource={this.plan.selectedResource}
                                            />
                                        }
                                    </svg>

                                    {this.plan.blocks.map((block, index) => {
                                            const runningBlock = this.runningBlocks[block.id];
                                            const failedToRunBlock = this.failedToRunBlocks[block.id];
                                            let blockIsVisible = false;
                                            let focusClassNames = "";
                                            if (this.plan.focusedBlock) {
                                                blockIsVisible = (this.plan.focusedBlock.hasConnectionTo(block) || block.id === this.plan.focusedBlock.id);

                                                focusClassNames = toClass({
                                                    "planner-block": !blockIsVisible,
                                                    "planner-focused-block": block.id === this.plan.focusedBlock.id,
                                                    "linked-block": (block.id !== this.plan.focusedBlock.id && blockIsVisible),
                                                    "hovered-block": (this.hoveredBlock ? block.id === this.hoveredBlock.id : false),
                                                });
                                            }

                                            return (// if block is focused render only it and it's connected blocks
                                                <PlannerBlockNode
                                                    className={focusClassNames}
                                                    key={block.id + block.name + index}
                                                    block={block}
                                                    zoom={this.zoom}
                                                    onDoubleTap={() => {
                                                        this.setFocusZoom(block);
                                                    }}
                                                    readOnly={this.props.plan.isReadOnly() || this.plan.focusedBlock !== undefined}
                                                    onDrop={() => {
                                                        this.recalculateCanvas()
                                                    }}
                                                    status={this.getNodeStatus(runningBlock, failedToRunBlock)}
                                                    size={(block === this.plan.focusedBlock) ? PlannerNodeSize.MEDIUM : this.state.size}
                                                    setItemToEdit={(item, type) => this.editPanelHelper.edit(item, type, false)}
                                                    setItemToInspect={(item, type) => this.blockInspectorPanelHelper.show(item, type, false)}
                                                    planner={this.plan}
                                                />
                                            )
                                        }
                                    )}
                                    {this.plan.selectedResource !== undefined &&
                                        <PlannerTempResourceItem
                                            planner={this.plan}
                                            size={this.state.size}
                                            setItemToEdit={(item, type, creating) => this.editPanelHelper.edit(item, type, creating)}
                                            selectedResource={this.plan.selectedResource}
                                            zoom={this.zoom}
                                            index={-1}
                                        />
                                    }
                                </div>
                            </DnDDrop>
                            <svg className="zoom-buttons" x="50" y="50" overflow="visible" height="20" width="40">
                                <svg width="45" height="45" viewBox="0 0 45 45" fill="none" onClick={() => {
                                    this.setZoomLevel(true);
                                }}>
                                    <path
                                        d="M1.83863 21.2671C0.724626 19.5906 0.724624 17.4095 1.83863 15.7329L10.8088 2.23289C11.7355 0.838211 13.2988 7.04809e-06 14.9733 6.97489e-06L30.0267 6.31688e-06C31.7012 6.24369e-06 33.2645 0.83821 34.1912 2.23288L43.1614 15.7329C44.2754 17.4094 44.2754 19.5906 43.1614 21.2671L34.1912 34.7671C33.2645 36.1618 31.7012 37 30.0267 37L14.9733 37C13.2988 37 11.7355 36.1618 10.8088 34.7671L1.83863 21.2671Z"
                                        fill="#EE766A"/>
                                    <circle cx="22" cy="18" r="8" stroke="#F9DFDD"/>
                                    <path
                                        d="M22.5 14C22.5 13.7239 22.2761 13.5 22 13.5C21.7239 13.5 21.5 13.7239 21.5 14H22.5ZM21.5 22C21.5 22.2761 21.7239 22.5 22 22.5C22.2761 22.5 22.5 22.2761 22.5 22H21.5ZM21.5 14V22H22.5V14H21.5Z"
                                        fill="#F9DFDD"/>
                                    <path
                                        d="M28.3536 23.6464C28.1583 23.4512 27.8417 23.4512 27.6464 23.6464C27.4512 23.8417 27.4512 24.1583 27.6464 24.3536L28.3536 23.6464ZM31.6464 28.3536C31.8417 28.5488 32.1583 28.5488 32.3536 28.3536C32.5488 28.1583 32.5488 27.8417 32.3536 27.6464L31.6464 28.3536ZM27.6464 24.3536L31.6464 28.3536L32.3536 27.6464L28.3536 23.6464L27.6464 24.3536Z"
                                        fill="#F9DFDD"/>
                                    <path
                                        d="M18 17.5C17.7239 17.5 17.5 17.7239 17.5 18C17.5 18.2761 17.7239 18.5 18 18.5L18 17.5ZM26 18.5C26.2761 18.5 26.5 18.2761 26.5 18C26.5 17.7239 26.2761 17.5 26 17.5L26 18.5ZM18 18.5L26 18.5L26 17.5L18 17.5L18 18.5Z"
                                        fill="#F9DFDD"/>
                                </svg>
                                <svg width="45" height="45" viewBox="0 0 45 45" x="36" y="20" fill="none"
                                     onClick={() => {
                                         this.setZoomLevel(false);
                                     }}>
                                    <path
                                        d="M1.83863 21.2671C0.724626 19.5906 0.724624 17.4095 1.83863 15.7329L10.8088 2.23289C11.7355 0.838211 13.2988 7.04809e-06 14.9733 6.97489e-06L30.0267 6.31688e-06C31.7012 6.24369e-06 33.2645 0.83821 34.1912 2.23288L43.1614 15.7329C44.2754 17.4094 44.2754 19.5906 43.1614 21.2671L34.1912 34.7671C33.2645 36.1618 31.7012 37 30.0267 37L14.9733 37C13.2988 37 11.7355 36.1618 10.8088 34.7671L1.83863 21.2671Z"
                                        fill="#EE766A"/>
                                    <circle cx="22" cy="18" r="8" stroke="#F9DFDD"/>
                                    <path
                                        d="M28.3536 23.6464C28.1583 23.4512 27.8417 23.4512 27.6464 23.6464C27.4512 23.8417 27.4512 24.1583 27.6464 24.3536L28.3536 23.6464ZM31.6464 28.3536C31.8417 28.5488 32.1583 28.5488 32.3536 28.3536C32.5488 28.1583 32.5488 27.8417 32.3536 27.6464L31.6464 28.3536ZM27.6464 24.3536L31.6464 28.3536L32.3536 27.6464L28.3536 23.6464L27.6464 24.3536Z"
                                        fill="#F9DFDD"/>
                                    <path
                                        d="M18 17.5C17.7239 17.5 17.5 17.7239 17.5 18C17.5 18.2761 17.7239 18.5 18 18.5L18 17.5ZM26 18.5C26.2761 18.5 26.5 18.2761 26.5 18C26.5 17.7239 26.2761 17.5 26 17.5L26 18.5ZM18 18.5L26 18.5L26 17.5L18 17.5L18 18.5Z"
                                        fill="#F9DFDD"/>
                                </svg>

                                <svg width="45" height="45" viewBox="0 0 45 45" x="35" y="-20" fill="none"
                                     onClick={() => {
                                         this.resetZoomLevel(); //Reset zoom level

                                     }}>
                                    <g className={zoomResetClassName}>
                                        <path
                                            d="M1.83863 21.2671C0.724626 19.5906 0.724624 17.4095 1.83863 15.7329L10.8088 2.23289C11.7355 0.838211 13.2988 7.04809e-06 14.9733 6.97489e-06L30.0267 6.31688e-06C31.7012 6.24369e-06 33.2645 0.83821 34.1912 2.23288L43.1614 15.7329C44.2754 17.4094 44.2754 19.5906 43.1614 21.2671L34.1912 34.7671C33.2645 36.1618 31.7012 37 30.0267 37L14.9733 37C13.2988 37 11.7355 36.1618 10.8088 34.7671L1.83863 21.2671Z"
                                            fill="#EE766A"/>
                                        <circle cx="22" cy="18" r="8" stroke="#F9DFDD"/>
                                        <path
                                            d="M28.3536 23.6464C28.1583 23.4512 27.8417 23.4512 27.6464 23.6464C27.4512 23.8417 27.4512 24.1583 27.6464 24.3536L28.3536 23.6464ZM31.6464 28.3536C31.8417 28.5488 32.1583 28.5488 32.3536 28.3536C32.5488 28.1583 32.5488 27.8417 32.3536 27.6464L31.6464 28.3536ZM27.6464 24.3536L31.6464 28.3536L32.3536 27.6464L28.3536 23.6464L27.6464 24.3536Z"
                                            fill="#F9DFDD"/>
                                        <path
                                            d="M18 17.5C17.7239 17.5 17.5 17.7239 17.5 18C17.5 18.2761 17.7239 18.5 18 18.5L18 17.5ZM26 18.5C26.2761 18.5 26.5 18.2761 26.5 18C26.5 17.7239 26.2761 17.5 26 17.5L26 18.5ZM18 18.5L26 18.5L26 17.5L18 17.5L18 18.5Z"
                                            fill="#F9DFDD"/>
                                    </g>
                                </svg>
                            </svg>
                        </div>
                    </div>
                </DnDContainer>
            </>
        )
    }
}

