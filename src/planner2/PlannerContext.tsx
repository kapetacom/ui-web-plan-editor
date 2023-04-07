import React, { RefAttributes, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Asset,
    BlockConnectionSpec,
    BlockInstanceSpec,
    BlockKind,
    BlockResourceReferenceSpec,
    PlanKind,
    Point,
    ResourceKind,
    ResourceRole,
    SchemaKind,
} from '@kapeta/ui-web-types';
import { parseKapetaUri } from '@kapeta/nodejs-utils';
import { PlannerNodeSize } from '../types';
import { cloneDeep } from 'lodash';
import { PlannerAction, Rectangle } from './types';

import { PlannerMode } from '../wrappers/PlannerModelWrapper';
import { getResourceId } from './utils/planUtils';
import { BlockMode, ResourceMode } from '../wrappers/wrapperHelpers';
import { DnDContainer } from './DragAndDrop/DnDContainer';

type BlockUpdater = (block: BlockInstanceSpec) => BlockInstanceSpec;
type Callback = () => void;
type InstanceAddedCallback = (blockInstance: BlockInstanceSpec) => void;
type ResourceAddedCallback = (ref: string, block: BlockKind, resource: ResourceKind) => void;
type ConnectionAddedCallback = (connection: BlockConnectionSpec) => void;

export interface PlannerActionConfig {
    block?: PlannerAction<any>[];
    connection?: PlannerAction<any>[];
    resource?: PlannerAction<any>[];
}

export interface PlannerContextData {
    plan?: PlanKind;
    blockAssets: Asset<BlockKind>[];
    setBlockAssets(blockAssets: Asset<BlockKind>[]): void;

    focusedBlock?: BlockInstanceSpec;
    setFocusedBlock(block: BlockInstanceSpec | undefined): void;

    canEditBlocks?: boolean;
    canEditConnections?: boolean;

    // view modes
    assetState: {
        getViewModeForResource(
            blockInstance: BlockInstanceSpec,
            resource: ResourceKind,
            role: ResourceRole
        ): ResourceMode | undefined;
        setViewModeForResource(
            blockInstance: BlockInstanceSpec,
            resource: ResourceKind,
            role: ResourceRole,
            mode?: ResourceMode
        ): void;
        getViewModeForBlock(blockInstance: BlockInstanceSpec): BlockMode | undefined;
        setViewModeForBlock(blockInstance: BlockInstanceSpec, mode?: BlockMode): void;
    };

    mode?: PlannerMode;
    zoom: number;
    setZoomLevel: (zoom: number | ((currentZoom: number) => number)) => void;
    nodeSize: PlannerNodeSize;
    getBlockByRef(ref: string): BlockKind | undefined;
    getBlockById(blockId: string): BlockKind | undefined;

    updateBlockDefinition(ref: string, update: BlockKind): void;
    updateBlockInstance(blockId: string, updater: BlockUpdater): void;
    removeBlockInstance(blockId: string): void;
    addBlockInstance(blockInstance: BlockInstanceSpec): void;
    onBlockInstanceAdded(callback: InstanceAddedCallback): Callback;

    // resources
    addResource(blockRef: string, resource: ResourceKind, role: ResourceRole): void;
    removeResource(blockRef: string, resourceName: string, resourceRole: ResourceRole): void;
    onResourceAdded(callback: ResourceAddedCallback): Callback;
    getResourceByBlockIdAndName(
        blockId: string,
        resourceName: string,
        resourceRole: ResourceRole
    ): ResourceKind | undefined;

    // connection stuff
    addConnection(connection: BlockConnectionSpec): void;
    updateConnectionMapping(connection: BlockConnectionSpec): void;
    onConnectionAdded(callback: ConnectionAddedCallback): Callback;
    removeConnection(connection: BlockConnectionSpec): void;
    hasConnections(connectionSpec: BlockResourceReferenceSpec): boolean;
    connectionPoints: {
        addPoint(id: string, point: Point): void;
        getPointById(id: string): Point | null;
        removePoint(pointId: string): void;
    };

    canvasSize: Rectangle;
    setCanvasSize(canvasSize: Rectangle): void;
}

const defaultValue: PlannerContextData = {
    focusedBlock: undefined,
    mode: PlannerMode.VIEW,
    assetState: {
        getViewModeForResource() {
            return undefined;
        },
        setViewModeForResource() {},
        getViewModeForBlock() {
            return undefined;
        },
        setViewModeForBlock() {},
    },
    zoom: 1,
    setZoomLevel() {},

    setFocusedBlock(block: BlockInstanceSpec) {},

    nodeSize: PlannerNodeSize.MEDIUM,
    blockAssets: [],
    setBlockAssets(blockAssets: Asset<BlockKind>[]) {},
    getBlockByRef(_ref: string) {
        return undefined;
    },
    getBlockById(blockId: string): BlockKind | undefined {
        return undefined;
    },

    updateBlockDefinition() {},
    updateBlockInstance(blockId, callback) {
        // noop
    },
    removeBlockInstance(blockId) {},
    addBlockInstance(blockInstance) {},
    onBlockInstanceAdded() {
        return () => {};
    },
    // resources
    addResource(blockId: string) {},
    removeResource(blockId: string, resourceName: string) {},
    onResourceAdded() {
        return () => {};
    },
    getResourceByBlockIdAndName() {
        return undefined;
    },
    // connection stuff
    addConnection(connection: BlockConnectionSpec) {},
    updateConnectionMapping(connection: BlockConnectionSpec) {},
    removeConnection(connection: BlockConnectionSpec) {},
    onConnectionAdded() {
        return () => {};
    },
    hasConnections() {
        return false;
    },
    connectionPoints: {
        addPoint() {},
        getPointById() {
            return null;
        },
        removePoint() {},
    },

    canvasSize: { x: 0, y: 0, width: 0, height: 0 },
    setCanvasSize() {},
};

export const PlannerContext = React.createContext(defaultValue);
export type PlannerContextProps = {
    plan: PlanKind;
    blockAssets: Asset<BlockKind>[];
    mode: PlannerMode;
    onChange?: (plan: PlanKind) => void;
    onAssetChange?: (asset: Asset<SchemaKind>) => void;
};

// Helper to make sure we memoize anything we can for the context
export const usePlannerContext = (props: PlannerContextProps): PlannerContextData => {
    //
    const [points, setPoints] = useState<{ [id: string]: Point }>(() => ({}));
    const addPoint = useCallback(
        function addPoint(id: string, point: Point) {
            setPoints((ps) => ({ ...ps, [id]: point }));
        },
        [setPoints]
    );
    const removePoint = useCallback(
        function removePoint(id: string) {
            setPoints((prev) => {
                const newPoints = { ...prev };
                delete newPoints[id];
                return newPoints;
            });
        },
        [setPoints]
    );
    const connectionPoints = useMemo(
        () => ({
            addPoint,
            removePoint,
            getPointById(id: string) {
                return points[id] || null;
            },
        }),
        [addPoint, removePoint, points]
    );

    // region View state
    const [focusedBlock, setFocusedBlock] = useState<BlockInstanceSpec>();
    const [canvasSize, setCanvasSize] = useState<Rectangle>({ x: 0, y: 0, width: 0, height: 0 });
    const [viewMode, setViewMode] = useState(props.mode);
    const [zoom, setZoomLevel] = useState(1);

    // zoom
    // size
    // endregion

    // Allow internal changes, but load from props in case props change
    const [plan, setPlan] = useState(props.plan);
    function updatePlan(changer: (prev: PlanKind) => PlanKind) {
        setPlan((prev) => {
            const newPlan = changer(prev);
            if (props.onChange &&
                newPlan !== prev) {
                props.onChange(newPlan);
            }
            return newPlan;
        })
    }

    useEffect(() => {
        setPlan(props.plan);
    }, [props.plan]);

    // Allow internal changes, but load from props in case props change
    const [blockAssets, setBlockAssets] = useState(props.blockAssets);

    function updateBlockAssets(changer: (prev: Asset<BlockKind>[]) => Asset<BlockKind>[]) {
        setBlockAssets((prev) => {
            const newAssets = changer(prev);
            if (props.onAssetChange) {
                const onChange = props.onAssetChange;
                newAssets.forEach((newAsset, ix) => {
                    if (prev.indexOf(newAsset) === -1) {
                        onChange(newAsset);
                    }
                });
            }
            return newAssets;
        })
    }

    useEffect(() => {
        setBlockAssets(props.blockAssets);
    }, [props.blockAssets]);


    const toggleFocusBlock = useCallback(
        (block: BlockInstanceSpec | undefined) => {
            setFocusedBlock((prevFocus) => (prevFocus && block && block.id === prevFocus.id ? undefined : block));
        },
        [setFocusedBlock]
    );

    const [viewStates, setViewStates] = useState({});
    const assetState: PlannerContextData['assetState'] = useMemo(
        () => ({
            getViewModeForResource(blockInstance, resource, role) {
                const id = getResourceId(blockInstance.id, resource.metadata.name, role);
                return viewStates[id] as ResourceMode | undefined;
            },
            setViewModeForResource(blockInstance, resource: ResourceKind, role, resourceMode) {
                const id = getResourceId(blockInstance.id, resource.metadata.name, role);
                setViewStates((prev) => ({ ...prev, [id]: resourceMode }));
            },
            getViewModeForBlock(blockInstance) {
                return viewStates[blockInstance.id] as BlockMode | undefined;
            },
            setViewModeForBlock(blockInstance, blockMode) {
                setViewStates((prev) => ({ ...prev, [blockInstance.id]: blockMode }));
            },
        }),
        [viewStates, setViewStates]
    );

    const callbackHandlers = useMemo(() => {
        return {
            onBlockInstanceAdded:[] as InstanceAddedCallback[],
            onResourceAdded:[] as ResourceAddedCallback[],
            onConnectionAdded:[] as ConnectionAddedCallback[],
        };
    }, [])

    return useMemo(() => {
        const canEditBlocks = viewMode === PlannerMode.EDIT;
        const canEditConnections = viewMode === PlannerMode.EDIT;


        const planner = {
            // view state
            focusedBlock,
            setFocusedBlock: toggleFocusBlock,
            assetState,

            zoom,
            setZoomLevel,

            canvasSize,
            setCanvasSize,

            nodeSize: PlannerNodeSize.MEDIUM,
            //
            mode: viewMode,
            // is this the right place for this? Are there more conditions?
            canEditBlocks,
            canEditConnections,
            //
            plan: plan,
            blockAssets,
            setBlockAssets(blockAssets: Asset<BlockKind>[]) {
                setBlockAssets(blockAssets);
            },
            getBlockByRef(ref: string) {
                const blockAsset = blockAssets.find((asset) => parseKapetaUri(asset.ref).equals(parseKapetaUri(ref)));
                return blockAsset?.data;
            },
            getBlockById(blockId: string) {
                const block = plan.spec.blocks?.find((bx) => bx.id === blockId);
                return block && planner.getBlockByRef(block.block.ref);
            },
            updateBlockDefinition(ref: string, update: BlockKind) {
                if (!canEditBlocks) {
                    return;
                }
                updateBlockAssets((state) =>
                    state.map((block) =>
                        parseKapetaUri(block.ref).compare(parseKapetaUri(ref)) === 0
                            ? { ...block, data: update }
                            : block
                    )
                );
            },
            updateBlockInstance(blockId: string, updater) {
                if (!canEditBlocks) {
                    return;
                }
                // Use state callback to reference the previous state (avoid stale ref)
                updatePlan((prevState) => {
                    const newPlan = cloneDeep(prevState);
                    const blockIx = newPlan.spec.blocks?.findIndex((pblock) => pblock.id === blockId) ?? -1;
                    if (blockIx === -1) {
                        throw new Error(`Block #${blockId} not found`);
                    }

                    const blocks = (newPlan.spec.blocks = newPlan.spec.blocks || []);
                    blocks[blockIx] = updater(blocks[blockIx]);
                    return newPlan;
                });
            },
            addBlockInstance(blockInstance: BlockInstanceSpec) {
                if (!canEditBlocks) {
                    return;
                }
                updatePlan((prevState) => {
                    const newPlan = cloneDeep(prevState);
                    if (!newPlan.spec.blocks) {
                        newPlan.spec.blocks = [];
                    }
                    newPlan.spec.blocks.push(blockInstance);
                    return newPlan;
                });
                callbackHandlers.onBlockInstanceAdded.forEach(cb => cb(blockInstance));
            },
            onBlockInstanceAdded(callback:InstanceAddedCallback) {
                callbackHandlers.onBlockInstanceAdded.push(callback);
                return () => {
                    callbackHandlers.onBlockInstanceAdded = callbackHandlers.onBlockInstanceAdded.filter(cb => cb !== callback);
                };
            },
            removeBlockInstance(blockId: string) {
                if (!canEditBlocks) {
                    return;
                }
                updatePlan((prevState) => {
                    const newPlan = cloneDeep(prevState);
                    const blockIx = newPlan.spec.blocks?.findIndex((pblock) => pblock.id === blockId) ?? -1;
                    if (blockIx === -1) {
                        throw new Error(`Block #${blockId} not found`);
                    }
                    newPlan.spec.blocks?.splice(blockIx, 1);

                    // Remove any connections that reference this block
                    newPlan.spec.connections = newPlan.spec.connections?.filter(
                        (conn) => conn.to.blockId !== blockId && conn.from.blockId !== blockId
                    );
                    return newPlan;
                });
            },
            // resources
            addResource(blockRef: string, resource: ResourceKind, role: ResourceRole) {
                if (!canEditBlocks) {
                    return;
                }
                const blockUri = parseKapetaUri(blockRef);
                updateBlockAssets((prevState) => {
                    const newAssets = cloneDeep(prevState);
                    const blockIx =
                        newAssets.findIndex((block) => parseKapetaUri(block.ref).equals(blockUri)) ??
                        -1;

                    if (blockIx === -1) {
                        throw new Error(`Block #${blockRef} not found`);
                    }

                    const block = newAssets[blockIx];
                    if (!block.data.spec.providers) {
                        block.data.spec.providers = [];
                    }

                    if (!block.data.spec.consumers) {
                        block.data.spec.consumers = [];
                    }

                    const list = role === ResourceRole.PROVIDES ?
                        block.data.spec.providers :
                        block.data.spec.consumers;
                    list.push(resource);

                    callbackHandlers.onResourceAdded.forEach(cb => cb(blockRef, block.data, resource));

                    return newAssets;
                });


            },
            onResourceAdded(callback:ResourceAddedCallback) {
                callbackHandlers.onResourceAdded.push(callback);
                return () => {
                    callbackHandlers.onResourceAdded = callbackHandlers.onResourceAdded.filter(cb => cb !== callback);
                };
            },
            removeResource(blockRef: string, resourceName: string, resourceRole: ResourceRole) {
                if (!canEditBlocks) {
                    return;
                }
                // Remove connection point
                updateBlockAssets((prevState) => {
                    const newAssets = [...prevState];
                    const blockIx =
                        newAssets.findIndex((pblock) => parseKapetaUri(pblock.ref).equals(parseKapetaUri(blockRef))) ??
                        -1;

                    if (blockIx === -1) {
                        throw new Error(`Block #${blockRef} not found`);
                    }

                    const block = cloneDeep(newAssets[blockIx]);
                    const list =
                        resourceRole === ResourceRole.PROVIDES ? block.data.spec.providers : block.data.spec.consumers;
                    const resourceIx = list?.findIndex((resource) => resource.metadata.name === resourceName) ?? -1;
                    if (resourceIx === -1) {
                        throw new Error(`Resource ${resourceName} not found in block #${blockRef}`);
                    }
                    list!.splice(resourceIx, 1);

                    newAssets[blockIx] = block;
                    return newAssets;
                });

                // Remove any connections to/from the deleted resource
                updatePlan((prevState) => {
                    const newPlan = cloneDeep(prevState);
                    const blockIds =
                        newPlan.spec.blocks
                            ?.filter((block) => parseKapetaUri(block.block.ref).equals(parseKapetaUri(blockRef)))
                            .map((block) => block.id) ?? [];
                    const connections = newPlan.spec.connections ?? [];
                    let deletions = 0;
                    for (const blockId of blockIds) {
                        const connectionIx = connections.findIndex((conn) =>
                            resourceRole === ResourceRole.PROVIDES
                                ? conn.from.blockId === blockId && conn.from.resourceName === resourceName
                                : conn.to.blockId === blockId && conn.to.resourceName === resourceName
                        );
                        if (connectionIx !== -1) {
                            connections.splice(connectionIx, 1);
                            deletions++;
                        }
                    }
                    return deletions ? newPlan : prevState;
                });
            },
            getResourceByBlockIdAndName(blockId: string, resourceName: string, resourceRole: ResourceRole) {
                const block = plan.spec.blocks?.find((bx) => bx.id === blockId)?.block;
                const blockAsset = block && planner.getBlockByRef(block.ref);
                const list =
                    resourceRole === ResourceRole.PROVIDES ? blockAsset?.spec.providers : blockAsset?.spec.consumers;
                return list?.find((rx) => rx.metadata.name === resourceName);
            },

            // connections
            addConnection(connection: BlockConnectionSpec) {
                if (!canEditConnections) {
                    return;
                }
                updatePlan((prevState) => {
                    const newPlan = cloneDeep(prevState);
                    if (!newPlan.spec.connections) {
                        newPlan.spec.connections = [];
                    }
                    newPlan.spec.connections.push(connection);
                    return newPlan;
                });

                callbackHandlers.onConnectionAdded.forEach(cb => cb(connection));
            },
            onConnectionAdded(callback:ConnectionAddedCallback) {
                callbackHandlers.onConnectionAdded.push(callback);
                return () => {
                    callbackHandlers.onConnectionAdded = callbackHandlers.onConnectionAdded.filter(cb => cb !== callback);
                }
            },
            updateConnectionMapping({ from, to, mapping }: BlockConnectionSpec) {
                if (!canEditConnections) {
                    return;
                }
                updatePlan((prevState) => {
                    const newPlan = cloneDeep(prevState);
                    const ix = newPlan.spec.connections?.findIndex(c => {
                        return c.from.blockId === from.blockId &&
                            c.from.resourceName === from.resourceName &&
                            c.to.blockId === to.blockId &&
                            c.to.resourceName === to.resourceName;
                    }) ?? -1
                    if (ix > -1) {
                        newPlan.spec.connections![ix] = { from, to, mapping: cloneDeep(mapping) };
                    }
                    return newPlan;
                });
            },
            removeConnection(connection: BlockConnectionSpec) {
                if (!canEditConnections) {
                    return;
                }
                updatePlan((prevState) => {
                    const newPlan = cloneDeep(prevState);
                    const connectionIx = newPlan.spec.connections?.findIndex(
                        (conn) =>
                            conn.from.blockId === connection.from.blockId &&
                            conn.from.resourceName === connection.from.resourceName &&
                            conn.to.blockId === connection.to.blockId &&
                            conn.to.resourceName === connection.to.resourceName
                    );
                    if (connectionIx !== undefined) {
                        newPlan.spec.connections?.splice(connectionIx, 1);
                    }
                    return newPlan;
                });
            },
            hasConnections(connectionSpec: BlockResourceReferenceSpec) {
                return !!plan.spec.connections?.find(
                    (connection) =>
                        (connection.from.blockId === connectionSpec.blockId &&
                            connection.from.resourceName === connectionSpec.resourceName) ||
                        (connection.to.blockId === connectionSpec.blockId &&
                            connection.to.resourceName === connectionSpec.resourceName)
                );
            },
            connectionPoints,
        };
        return planner;
    }, [
        blockAssets,
        canvasSize,
        connectionPoints,
        focusedBlock,
        plan,
        setZoomLevel,
        toggleFocusBlock,
        viewMode,
        zoom,
        assetState,
        callbackHandlers
    ]);
};

export function withPlannerContext<T>(Inner: React.ComponentType<T & RefAttributes<HTMLElement>>) {
    return (props: T & JSX.IntrinsicAttributes & PlannerContextProps) => {
        const context = usePlannerContext(props);
        const rootRef = useRef(null);
        return (
            <PlannerContext.Provider value={context}>
                <DnDContainer root={rootRef}>
                    <Inner ref={rootRef} {...props} />
                </DnDContainer>
            </PlannerContext.Provider>
        );
    };
}
