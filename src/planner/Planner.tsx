import React from 'react';
import {observer} from "mobx-react";
import * as _ from 'lodash';
import {action, computed, Lambda, makeObservable, observable, reaction, runInAction} from "mobx";

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
import {PlannerNodeSize} from "../types";
import {PlannerBlockNode} from "../components/PlannerBlockNode";
import {PlannerTempResourceItem} from '../components/PlannerTempResourceItem';
import {PlannerConnection} from "../components/PlannerConnection";
import {PlannerModelWrapper} from "../wrappers/PlannerModelWrapper";
import {PlannerBlockModelWrapper} from "../wrappers/PlannerBlockModelWrapper";
import {PlannerConnectionModelWrapper} from "../wrappers/PlannerConnectionModelWrapper";
import {PlannerTempResourceConnection} from "../components/PlannerTempResourceConnection";

import {PlannerToolbox} from "./components/PlannerToolbox";
import {InspectConnectionPanel} from './components/InspectConnectionPanel';
import {ItemEditorPanel} from "./components/ItemEditorPanel";
import {BlockInspectorPanel} from "./components/BlockInspectorPanel";
import {FOCUSED_ID, FocusHelper, POSITIONING_DATA} from "./helpers/FocusHelper";
import {DnDHelper} from "./helpers/DnDHelper";
import {EditPanelHelper} from "./helpers/EditPanelHelper";
import {InspectBlockPanelHelper} from "./helpers/InspectBlockPanelHelper";
import {SVGDropShadow} from "../utils/SVGDropShadow";
import {ZoomButtons} from '../components/ZoomButtons';
import {EditableItemInterface} from "../wrappers/models";
import "./Planner.less";
import {PlannerResourceModelWrapper} from "../wrappers/PlannerResourceModelWrapper";
import {BlockMode, ResourceMode} from "../wrappers/wrapperHelpers";

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
    blockStore?:React.ComponentType
}


const zoomStep = 0.25;

@observer
export class Planner extends React.Component<PlannerProps> {

    private readonly blockListObserver: Lambda;
    private readonly connectionListObserver: Lambda;
    private instanceServiceUnsubscriber?: () => void;
    private instanceServiceExitedUnsubscribers: (() => void)[] =  [];

    private blockObservers: BlockObserver[] = [];
    private zoomLevelAreas: ZoomAreaMap = {};
    private canvasContainerElement = React.createRef<HTMLDivElement>();

    private blockInspectorPanel: BlockInspectorPanel | null = null;

    @observable
    private readonly focusHelper;

    @observable
    private readonly editPanelHelper: EditPanelHelper;

    @observable
    private readonly dnd: DnDHelper;

    @observable
    private readonly blockInspectorPanelHelper: InspectBlockPanelHelper;

    @observable
    private readonly connectionObservers: ConnectionObserver[] = [];

    @observable
    private cachedPositions: BlockPositionCache = {};

    @observable
    private hoveredBlock?: PlannerBlockModelWrapper = undefined;

    @observable
    private focusSideBarOpen: boolean = false;

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
    private editingItem?: EditableItemInterface = undefined;

    @observable
    private connectionToInspect?: PlannerConnectionModelWrapper = undefined;

    @observable
    private canvasSize = {
        x: 0,
        y: 0,
        width: 0,
        height: 0
    };


    constructor(props: PlannerProps) {
        super(props);

        this.editPanelHelper = new EditPanelHelper(this);
        this.dnd = new DnDHelper(this, this.editPanelHelper);
        this.blockInspectorPanelHelper = new InspectBlockPanelHelper(this);

        this.connectionListObserver = reaction(() => this.plan.connections, this.onConnectionsChange);
        this.blockListObserver = reaction(() => this.plan.blocks, this.onBlocksChange);

        this.focusHelper = new FocusHelper(this.plan);

        makeObservable(this);

        this.init();


    }

    private get nodeSize():PlannerNodeSize {
        return this.props.size || PlannerNodeSize.MEDIUM;
    }

    @action
    private init() {

        this.plan.blocks.forEach(block => {
            this.runningBlocks[block.id] = {status: InstanceStatus.STOPPED};
        });

        this.observerConnections(this.plan.connections);
        this.observerBlocks(Object.values(this.plan.blocks));

        this.plan.validate();


        if (this.props?.enableInstanceListening) {
            this.setupInstanceService()
        }
    }

    @action
    public setEditingItem(item?:EditableItemInterface) {
        if (this.editingItem) {
            //Reset existing item first
            const {item} = this.editingItem;
            if (item instanceof PlannerResourceModelWrapper) {
                item.setMode(ResourceMode.HIDDEN);
            }

            if (item instanceof PlannerBlockModelWrapper) {
                item.setMode(BlockMode.HIDDEN);
            }

            if (item instanceof PlannerConnectionModelWrapper) {
                item.setEditing(false);
                item.toResource.setMode(ResourceMode.HIDDEN);
                item.fromResource.setMode(ResourceMode.HIDDEN);
            }
        }

        this.editingItem = item;
        if (item) {
            this.setConnectionToInspect(undefined);
        }
    }

    @action
    public setConnectionToInspect(item?:PlannerConnectionModelWrapper) {
        this.connectionToInspect = item;
        if (item) {
            this.setEditingItem(undefined);
        }
    }

    @observable
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

    public getBlockInspectorPanel() {
        return this.blockInspectorPanel;
    }

    @action
    private setEditOrCreateItem = (item, type, creating = false) => this.editPanelHelper.edit(item, type, creating);

    @action
    private setEditItem = (item, type) => this.setEditOrCreateItem(item, type, false);

    @action
    private onEditorClosed = () => this.setEditingItem(undefined)

    @action
    private recalculateCanvas() {
        this.recalculateSize();
        this.canvasSize = this.plan.calculateCanvasSize(this.nodeSize, this.plannerCanvasSize);
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
        this.connectionToInspect = undefined;
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

    @action
    private handleInspection = (connection: PlannerConnectionModelWrapper) => {
        this.connectionToInspect = connection;
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
        runInAction(() => {
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

        });
    }

    componentDidMount() {
        runInAction(() => {
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
                        this.setFocusBlock(block);
                    }
                });
            }
            const localCachedPositionData = window.localStorage.getItem(POSITIONING_DATA);
            if (localCachedPositionData) {
                this.cachedPositions = JSON.parse(localCachedPositionData) as BlockPositionCache;
            }
        });
    }

    @observable
    private getNodeStatus = (runningBlock: { status: InstanceStatus }, failedBlock: { status: FailedBlockMessage }) => {
        if (failedBlock) {
            return InstanceStatus.EXITED;
        } else if (runningBlock) {
            return runningBlock.status;
        } else {
            return InstanceStatus.STOPPED
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
    }

    private scrollPlannerTo(x?: number, y?: number) {
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
        this.zoom = 1;
    }

    @action
    private setFocusBlock = (block: PlannerBlockModelWrapper) => {
        //sets the focus block or removes if the block double clicked is the same as the previous one
        this.plan.setFocusedBlock(block);
        if (this.plan.focusedBlock) {
            this.focusSideBarOpen = true;
            window.localStorage.setItem(FOCUSED_ID, this.plan.focusedBlock.id)
        } else {
            this.focusSideBarOpen = false;
            window.localStorage.setItem(FOCUSED_ID, "")
        }

        console.log('focusing block', this.focusSideBarOpen);
        this.reorderForFocus();
    }

    @action
    private reorderForFocus() {
        this.scrollPlannerTo();
        this.zoom = this.focusHelper.getFocusZoomLevel(this.zoomLevelAreas, this.nodeSize);

        if (!this.plan.focusedBlock &&
            window.localStorage.getItem(FOCUSED_ID) !== null) {

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
        }

        if (window.localStorage.getItem(POSITIONING_DATA) === null ||
            window.localStorage.getItem(POSITIONING_DATA) === "") {

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
                this.focusHelper.updateBlockPositionForFocus(block, this.nodeSize, this.getAdjustedSize({
                    x: this.plannerCanvasSize.width,
                    y: this.plannerCanvasSize.height
                }, this.zoom));
            });

            this.focusHelper.updateBlockPositionForFocus(this.plan.focusedBlock, this.nodeSize, this.getAdjustedSize({
                x: this.plannerCanvasSize.width,
                y: this.plannerCanvasSize.height
            }, this.zoom));
        }
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
            'node-size-small': this.nodeSize === PlannerNodeSize.SMALL,
            'node-size-medium': this.nodeSize === PlannerNodeSize.MEDIUM,
            'node-size-full': this.nodeSize === PlannerNodeSize.FULL,
            'dragging': this.plan.isDragging(),
            'read-only': this.plan.isReadOnly(),
            'view-only': this.plan.isViewing()
        });

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


        console.log('render plan');

        return (
            <>
                {this.connectionToInspect &&
                    <InspectConnectionPanel
                        connection={this.connectionToInspect}
                        onClose={this.onInspectorPanelClosed}/>
                }

                <ItemEditorPanel onClosed={this.onEditorClosed}
                                 editableItem={this.editingItem}
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
                                this.focusHelper.renderTopBar({setFocusBlock: this.setFocusBlock})
                            }
                        </div>

                        {!this.props.plan.isReadOnly() &&
                            <PlannerToolbox blockStore={this.props.blockStore} open={true}/>
                        }

                        {this.focusHelper.renderSideBar({
                            onNeighboringBlockHover: this.onNeighboringBlockHover,
                            setFocusZoom: this.setFocusBlock,
                            sidePanelOpen: this.focusSideBarOpen
                        })}

                        <div ref={this.canvasContainerElement}
                             className={'planner-area-position-parent'}>
                            <div className={plannerScrollClassnames}
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
                                                                readOnly={this.plan.isReadOnly()}
                                                                viewOnly={this.plan.isViewing()}
                                                                key={connection.id + "_link_" + index}
                                                                size={this.nodeSize}
                                                                focusBlock={this.plan.focusedBlock}
                                                                handleInspectClick={this.handleInspection}
                                                                setItemToEdit={this.setEditItem}
                                                                onFocus={this.plan.moveConnectionToTop.bind(this.plan, connection)}
                                                                onDelete={this.plan.removeConnection.bind(this.plan, connection)}
                                                                connection={connection}/>

                                                    )
                                                })
                                            }

                                            {this.plan.selectedResource !== undefined &&
                                                <PlannerTempResourceConnection
                                                    size={this.nodeSize}
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
                                                            this.setFocusBlock(block);
                                                        }}
                                                        readOnly={this.plan.isReadOnly() || this.plan.focusedBlock !== undefined}
                                                        viewOnly={this.plan.isViewing()}
                                                        onDrop={() => {
                                                            this.recalculateCanvas()
                                                        }}
                                                        status={this.getNodeStatus(runningBlock, failedToRunBlock)}
                                                        size={(block === this.plan.focusedBlock) ? PlannerNodeSize.MEDIUM : this.nodeSize}
                                                        setItemToEdit={this.setEditItem}
                                                        setItemToInspect={(item, type) => this.blockInspectorPanelHelper.show(item, type, false)}
                                                        planner={this.plan}
                                                    />
                                                )
                                            }
                                        )}
                                        {this.plan.selectedResource !== undefined &&
                                            <PlannerTempResourceItem
                                                planner={this.plan}
                                                size={this.nodeSize}
                                                setItemToEdit={this.setEditOrCreateItem}
                                                selectedResource={this.plan.selectedResource}
                                                zoom={this.zoom}
                                                index={-1}
                                            />
                                        }
                                    </div>
                                </DnDDrop>
                            </div>
                            <ZoomButtons currentZoom={this.zoom}
                                         onZoomIn={() => this.setZoomLevel(true)}
                                         onZoomOut={() => this.setZoomLevel(false)}
                                         onZoomReset={() => this.resetZoomLevel()}
                                        />
                        </div>
                    </div>
                </DnDContainer>
            </>
        )
    }
}

