/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React, { ExoticComponent, RefAttributes, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Point, ResourceRole, SchemaKind } from '@kapeta/ui-web-types';
import { KapetaURI, parseKapetaUri } from '@kapeta/nodejs-utils';
import { InstanceStatus } from '@kapeta/ui-web-context';
import {
    BlockDefinition,
    BlockInstance,
    Connection,
    Endpoint,
    EntityList,
    Metadata,
    Plan,
    Resource,
} from '@kapeta/schemas';
import { cloneDeep } from 'lodash';
import { AssetInfo, PlannerNodeSize } from '../types';
import { PlannerAction, Rectangle } from './types';

import { PlannerMode, BlockMode, ResourceMode } from '../utils/enums';
import { getResourceId } from './utils/planUtils';
import { DnDContainer } from './DragAndDrop/DnDContainer';
import { cleanupConnections, connectionEquals } from './utils/connectionUtils';
import { BlockResouceIconProps } from './components/BlockResourceIcon';
import { PrimitiveAtom, atom } from 'jotai';

export type BlockDefinitionReference = {
    ref: string;
    update: BlockDefinition;
};
type BlockUpdater = (block: BlockInstance) => BlockInstance;
type Callback = () => void;
type InstanceAddedCallback = (blockInstance: BlockInstance) => void;
type ResourceAddedCallback = (ref: string, block: BlockDefinition, resource: Resource) => void;
type ConnectionAddedCallback = (connection: Connection) => void;

export interface PlannerActionConfig {
    block?: PlannerAction<any>[];
    connection?: PlannerAction<any>[];
    resource?: PlannerAction<any>[];
}

export interface PlannerContextData<HoveredChatUIAtomValue = any> {
    plan?: Plan;
    asset?: AssetInfo<Plan>;
    uri?: KapetaURI;
    blockAssets: AssetInfo<BlockDefinition>[];

    setBlockAssets(blockAssets: AssetInfo<BlockDefinition>[]): void;

    focusedBlock?: BlockInstance;

    setFocusedBlock(block: BlockInstance | undefined): void;

    canEditBlocks?: boolean;
    canEditConnections?: boolean;

    // view modes
    assetState: {
        getViewModeForResource(
            blockInstanceId: string,
            resourceName: string,
            role: ResourceRole
        ): ResourceMode | undefined;
        setViewModeForResource(
            blockInstanceId: string,
            resourceName: string,
            role: ResourceRole,
            mode?: ResourceMode
        ): void;
        getResourceIcon(
            blockInstanceId: string,
            resourceName: string,
            role: ResourceRole
        ): BlockResouceIconProps['actionIcon'] | undefined;
        setResourceIcon(
            blockInstanceId: string,
            resourceName: string,
            role: ResourceRole,
            icon: BlockResouceIconProps['actionIcon']
        ): void;
        getViewModeForBlock(blockInstanceId: string): BlockMode | undefined;
        setViewModeForBlock(blockInstanceId: string, mode?: BlockMode): void;
    };
    instanceStates: { [id: string]: InstanceStatus };

    mode?: PlannerMode;

    zoom: number;
    setZoomLevel: (zoom: number | ((currentZoom: number) => number)) => void;

    panOffset: Point;
    setPanOffset: (offset: Point | ((currentOffset: Point) => Point)) => void;

    nodeSize: PlannerNodeSize;

    getBlockByRef(ref: string): BlockDefinition | undefined;

    getBlockById(blockId: string): BlockDefinition | undefined;

    updatePlanMetadata(
        metadata: Metadata,
        configuration: EntityList,
        defaultConfiguration?: { [key: string]: any }
    ): void;

    removeBlockDefinition(update: AssetInfo<BlockDefinition>): void;

    updateBlockDefinition(ref: string, update: BlockDefinition): void;

    updateBlockDefinitions(definitionRefs: BlockDefinitionReference[]): void;

    addBlockDefinition(asset: AssetInfo<BlockDefinition>): void;

    hasBlockDefinition(ref: string): boolean;

    updateBlockInstance(blockId: string, updater: BlockUpdater): void;

    removeBlockInstance(blockId: string): void;

    addBlockInstance(blockInstance: BlockInstance): void;

    onBlockInstanceAdded(callback: InstanceAddedCallback): Callback;

    // resources
    addResource(blockRef: string, resource: Resource, role: ResourceRole): void;

    updateResource(blockId: string, resourceName: string, role: ResourceRole, resource: Resource): void;

    removeResource(blockRef: string, resourceName: string, resourceRole: ResourceRole): void;

    onResourceAdded(callback: ResourceAddedCallback): Callback;

    getResourceByBlockIdAndName(
        blockId: string,
        resourceName: string,
        resourceRole: ResourceRole
    ): Resource | undefined;

    // connection stuff
    addConnection(connection: Connection): void;

    updateConnectionMapping(connection: Connection): void;

    onConnectionAdded(callback: ConnectionAddedCallback): Callback;

    removeConnection(connection: Connection): void;

    hasConnections(connectionSpec: Endpoint): boolean;

    connectionPoints: {
        addPoint(id: string, point: Point): void;
        getPointById(id: string): Point | null;
        removePoint(pointId: string): void;
    };

    canvasSize: Rectangle;

    setCanvasSize(canvasSize: Rectangle): void;

    setHoveredChatUIAtom: React.Dispatch<React.SetStateAction<PrimitiveAtom<HoveredChatUIAtomValue | null>>>;
    hoveredChatUIAtom: PrimitiveAtom<HoveredChatUIAtomValue | null>;
}

const defaultValue: PlannerContextData<any> = {
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
        getResourceIcon() {
            return undefined;
        },
        setResourceIcon() {},
    },
    instanceStates: {},

    zoom: 1,
    setZoomLevel() {},

    panOffset: { x: 0, y: 0 },
    setPanOffset() {},

    setFocusedBlock(block: BlockInstance) {},

    nodeSize: PlannerNodeSize.MEDIUM,
    blockAssets: [],
    setBlockAssets(blockAssets: AssetInfo<BlockDefinition>[]) {},
    getBlockByRef(_ref: string) {
        return undefined;
    },
    getBlockById(blockId: string): BlockDefinition | undefined {
        return undefined;
    },

    removeBlockDefinition() {},
    updateBlockDefinition() {},
    updateBlockDefinitions() {},
    addBlockDefinition() {},
    hasBlockDefinition() {
        return false;
    },
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
    updateResource(blockId: string, resourceName: string, role: ResourceRole, resource: Resource) {},
    removeResource(blockId: string, resourceName: string) {},
    onResourceAdded() {
        return () => {};
    },
    getResourceByBlockIdAndName() {
        return undefined;
    },
    // connection stuff
    addConnection(connection: Connection) {},
    updateConnectionMapping(connection: Connection) {},
    removeConnection(connection: Connection) {},
    updatePlanMetadata(metadata: Metadata, configuration: EntityList, defaultConfiguration?: { [key: string]: any }) {},
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

    setHoveredChatUIAtom() {},
    hoveredChatUIAtom: atom(null),
};

export const PlannerContext = React.createContext(defaultValue);
export type PlannerContextProps = {
    plan: Plan;
    asset: AssetInfo<Plan>;
    blockAssets: AssetInfo<BlockDefinition>[];
    mode: PlannerMode;
    onChange?: (plan: Plan) => void;
    onAssetChange?: (asset: AssetInfo<SchemaKind>) => void;
    instanceStates?: { [id: string]: InstanceStatus };
};

// Helper to make sure we memoize anything we can for the context
export const usePlannerContext = <HoveredChatUIAtomValue = any,>(
    props: PlannerContextProps
): PlannerContextData<HoveredChatUIAtomValue> => {
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

    const [focusedBlock, setFocusedBlock] = useState<BlockInstance>();
    const [canvasSize, setCanvasSize] = useState<Rectangle>({ x: 0, y: 0, width: 0, height: 0 });

    const [zoom, setZoomLevel] = useState(1);

    const [panOffset, setPanOffset] = useState<Point>({ x: 0, y: 0 });

    // Allow internal changes, but load from props in case props change
    type ContextData = {
        plan: Plan;
        blockAssets: AssetInfo<BlockDefinition>[];
    };
    const [{ plan, blockAssets }, setAssets] = useState<ContextData>({
        plan: props.plan,
        blockAssets: props.blockAssets,
    });

    const setPlan = useCallback(
        function setPlan(updater: React.SetStateAction<Plan>) {
            setAssets((prev) => {
                const newPlan = typeof updater === 'function' ? updater(prev.plan) : updater;
                if (prev.plan === newPlan) {
                    return prev;
                }
                return {
                    plan: cleanupConnections(newPlan, prev.blockAssets),
                    blockAssets: prev.blockAssets,
                };
            });
        },
        [setAssets]
    );

    const setBlockAssets = useCallback(
        function setBlockAssets(updater: React.SetStateAction<AssetInfo<BlockDefinition>[]>) {
            setAssets((prev) => {
                const newAssets = typeof updater === 'function' ? updater(prev.blockAssets) : updater;
                if (prev.blockAssets === newAssets) {
                    return prev;
                }
                return {
                    plan: prev.plan,
                    blockAssets: newAssets,
                };
            });
        },
        [setAssets]
    );

    // Allow internal changes, but load from props in case props change
    useEffect(() => {
        setPlan(props.plan);
    }, [props.plan, setPlan]);

    useEffect(() => {
        setBlockAssets(props.blockAssets);
    }, [props.blockAssets, setBlockAssets]);

    const toggleFocusBlock = (block: BlockInstance | undefined) => {
        setFocusedBlock((prevFocus) => (prevFocus && block && block.id === prevFocus.id ? undefined : block));
    };

    const [viewStates, setViewStates] = useState<{ [p: string]: any }>({});
    const [resourceConfig, setResourceConfig] = useState<{ [p: string]: any }>({});
    const assetState: PlannerContextData['assetState'] = useMemo(
        () => ({
            getViewModeForResource(blockInstanceId, resourceName, role) {
                const id = getResourceId(blockInstanceId, resourceName, role);
                return viewStates[id] as ResourceMode | undefined;
            },
            setViewModeForResource(blockInstanceId, resourceName, role, resourceMode) {
                const id = getResourceId(blockInstanceId, resourceName, role);
                setViewStates((prev) => ({ ...prev, [id]: resourceMode }));
            },
            getViewModeForBlock(blockInstanceId) {
                return viewStates[blockInstanceId] as BlockMode | undefined;
            },
            setViewModeForBlock(blockInstanceId, blockMode) {
                setViewStates((prev) => ({ ...prev, [blockInstanceId]: blockMode }));
            },
            getResourceIcon(blockInstanceId, resourceName, role) {
                const id = getResourceId(blockInstanceId, resourceName, role);
                return resourceConfig[id];
            },
            setResourceIcon(blockInstanceId, resourceName, role, icon) {
                const id = getResourceId(blockInstanceId, resourceName, role);
                setResourceConfig((cfg) => (cfg[id] !== icon ? { ...cfg, [id]: icon } : cfg));
            },
        }),
        [viewStates, setViewStates, resourceConfig, setResourceConfig]
    );

    const callbackHandlers = useMemo(() => {
        return {
            onBlockInstanceAdded: [] as InstanceAddedCallback[],
            onResourceAdded: [] as ResourceAddedCallback[],
            onConnectionAdded: [] as ConnectionAddedCallback[],
        };
    }, []);

    const instanceStates = useMemo(() => props.instanceStates || {}, [props.instanceStates]);

    const updateAssets = useCallback(
        function updateAssets(
            updater: React.SetStateAction<ContextData>,
            preventChangeEvent?: (state: ContextData) => boolean
        ) {
            setAssets((prev) => {
                const newContext = typeof updater === 'function' ? updater(prev) : updater;

                newContext.plan = cleanupConnections(newContext.plan, newContext.blockAssets);

                if (newContext.plan !== prev.plan) {
                    if (!(preventChangeEvent && preventChangeEvent(newContext))) {
                        props.onChange?.(newContext.plan);
                    }
                }

                if (newContext.blockAssets !== prev.blockAssets && props.onAssetChange) {
                    newContext.blockAssets.forEach((newAsset) => {
                        if (!prev.blockAssets.includes(newAsset)) {
                            props.onAssetChange?.(newAsset);
                        }
                    });
                }

                return newContext;
            });
        },
        [setAssets]
    );

    const updatePlan = (changer: (prev: Plan) => Plan, preventChangeEvent?: (state: ContextData) => boolean) => {
        updateAssets((prev) => {
            const newPlan = changer(prev.plan);
            if (newPlan !== prev.plan) {
                return {
                    plan: newPlan,
                    blockAssets: prev.blockAssets,
                };
            }
            return prev;
        }, preventChangeEvent);
    };

    const updateBlockAssets = (changer: (prev: AssetInfo<BlockDefinition>[]) => AssetInfo<BlockDefinition>[]) => {
        updateAssets((prev) => {
            const newAssets = changer(prev.blockAssets);
            if (newAssets !== prev.blockAssets) {
                return {
                    plan: prev.plan,
                    blockAssets: newAssets,
                };
            }
            return prev;
        });
    };

    const viewMode = props.mode;

    const isTempInstance = (assetState: ContextData, blockInstance: BlockInstance) => {
        const instanceBlockUri = parseKapetaUri(blockInstance.block.ref);
        const block = assetState.blockAssets.find((asset) => parseKapetaUri(asset.ref).equals(instanceBlockUri));
        return isTempBlock(block);
    };

    const isTempBlock = (block: AssetInfo<BlockDefinition> | undefined) => {
        if (!block) {
            return true;
        }
        if (!block.exists) {
            return true;
        }

        return false;
    };

    const isTempInstanceId = (assetState: ContextData, instanceId: string) => {
        const blockInstance = assetState.plan.spec.blocks.find((block) => block.id === instanceId);
        if (!blockInstance) {
            return false;
        }

        return isTempInstance(assetState, blockInstance);
    };

    const updateBlockInstance = (instanceId: string, updater: (block: BlockInstance) => BlockInstance) => {
        const canEditBlocks = viewMode === PlannerMode.EDIT;
        if (!canEditBlocks) {
            return;
        }
        // Use state callback to reference the previous state (avoid stale ref)
        updatePlan(
            (prevState) => {
                const newPlan = cloneDeep(prevState);
                const blockIx = newPlan.spec.blocks?.findIndex((pblock) => pblock.id === instanceId) ?? -1;
                if (blockIx === -1) {
                    throw new Error(`Block instance #${instanceId} not found`);
                }

                const blocks = (newPlan.spec.blocks = newPlan.spec.blocks || []);
                blocks[blockIx] = updater(blocks[blockIx]);
                return newPlan;
            },
            (state) => isTempInstanceId(state, instanceId)
        );
    };
    const canEditBlocks = viewMode === PlannerMode.EDIT;
    const canEditConnections = viewMode === PlannerMode.EDIT;
    const uri = parseKapetaUri(props.asset.ref);

    const getBlockByRef = (ref: string) => {
        const blockAsset = blockAssets.find((asset) => parseKapetaUri(asset.ref).equals(parseKapetaUri(ref)));
        return blockAsset?.content;
    };
    const getBlockById = (blockId: string) => {
        const block = plan.spec.blocks?.find((bx) => bx.id === blockId);
        return block && getBlockByRef(block.block.ref);
    };

    function updateBlockDefinitions(blockDefinitionRefs: BlockDefinitionReference[]) {
        if (!canEditBlocks) {
            return;
        }

        updateAssets((state) => {
            let planCopy = state.plan;
            let blockAssets = state.blockAssets;

            blockDefinitionRefs.forEach(({ ref, update }) => {
                const oldUri = parseKapetaUri(ref);
                const newUri = parseKapetaUri(`kapeta://${update.metadata.name}:local`);

                blockAssets = blockAssets.map((block) =>
                    parseKapetaUri(block.ref).equals(oldUri)
                        ? ({
                              ...block,
                              content: update,
                          } satisfies AssetInfo<BlockDefinition>)
                        : block
                );

                if (oldUri.equals(newUri) || !state.plan.spec.blocks) {
                    return;
                }

                const block = blockAssets.find((block) => parseKapetaUri(block.ref).equals(oldUri));
                if (block) {
                    // We're adding a temp block - this will be replaced as soon as the assets are reloaded
                    // and is just to avoid a missing reference error in the meantime
                    console.log('Adding temp block', newUri.toNormalizedString());
                    blockAssets.push({
                        ...block,
                        ref: newUri.toNormalizedString(),
                        content: update,
                        exists: false,
                    });
                }

                if (planCopy === state.plan) {
                    planCopy = cloneDeep(state.plan);
                }

                planCopy.spec.blocks = planCopy.spec.blocks.map((block) => {
                    if (parseKapetaUri(block.block.ref).equals(oldUri)) {
                        return {
                            ...block,
                            block: {
                                ref: newUri.toNormalizedString(),
                            },
                        };
                    }

                    return block;
                });
            });

            return {
                plan: planCopy,
                blockAssets,
            };
        });
    }

    const [hoveredChatUIAtom, setHoveredChatUIAtom] = useState<PrimitiveAtom<HoveredChatUIAtomValue | any>>(atom(null));

    return {
        // view state
        focusedBlock,
        setFocusedBlock: toggleFocusBlock,
        assetState,
        //

        instanceStates,

        zoom,
        setZoomLevel,

        panOffset,
        setPanOffset,

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
        asset: props.asset,
        uri: uri,
        blockAssets,
        setBlockAssets,
        getBlockByRef,
        getBlockById,
        updateBlockDefinition(ref: string, update: BlockDefinition) {
            updateBlockDefinitions([
                {
                    ref,
                    update,
                },
            ]);
        },
        updateBlockDefinitions,
        hasBlockDefinition(ref: string): boolean {
            const newUri = parseKapetaUri(ref);
            return blockAssets.some((asset) => newUri.equals(parseKapetaUri(asset.ref)));
        },
        removeBlockDefinition(asset: AssetInfo<BlockDefinition>) {
            if (!canEditBlocks) {
                return;
            }

            updateBlockAssets((state) => {
                return state.filter((block) => block.ref !== asset.ref);
            });
        },
        addBlockDefinition(asset: AssetInfo<BlockDefinition>) {
            if (!canEditBlocks) {
                return;
            }

            updateBlockAssets((state) => {
                return [...state.filter((block) => block.ref !== asset.ref), asset];
            });
        },
        updateBlockInstance,
        addBlockInstance(blockInstance: BlockInstance) {
            if (!canEditBlocks) {
                return;
            }
            updatePlan(
                (prevState) => {
                    const newPlan = cloneDeep(prevState);
                    if (!newPlan.spec.blocks) {
                        newPlan.spec.blocks = [];
                    }
                    newPlan.spec.blocks.push(blockInstance);
                    return newPlan;
                },
                (state) => isTempInstance(state, blockInstance)
            );
            callbackHandlers.onBlockInstanceAdded.forEach((cb) => cb(blockInstance));
        },
        onBlockInstanceAdded(callback: InstanceAddedCallback) {
            callbackHandlers.onBlockInstanceAdded.push(callback);
            return () => {
                callbackHandlers.onBlockInstanceAdded = callbackHandlers.onBlockInstanceAdded.filter(
                    (cb) => cb !== callback
                );
            };
        },
        removeBlockInstance(blockId: string) {
            if (!canEditBlocks) {
                return;
            }
            updatePlan(
                (prevState) => {
                    const newPlan = cloneDeep(prevState);
                    const blockIx = newPlan.spec.blocks?.findIndex((pblock) => pblock.id === blockId) ?? -1;
                    if (blockIx === -1) {
                        // Not found - no change
                        return prevState;
                    }

                    newPlan.spec.blocks?.splice(blockIx, 1);

                    // Remove any connections that reference this block
                    newPlan.spec.connections = newPlan.spec.connections?.filter(
                        (conn) => conn.consumer.blockId !== blockId && conn.provider.blockId !== blockId
                    );
                    return newPlan;
                },
                (state) => isTempInstanceId(state, blockId)
            );
        },
        // resources
        addResource(blockRef: string, resource: Resource, role: ResourceRole) {
            if (!canEditBlocks) {
                return;
            }
            const blockUri = parseKapetaUri(blockRef);
            updateBlockAssets((prevState) => {
                const newAssets = [...prevState];
                const blockIx = newAssets.findIndex((block) => parseKapetaUri(block.ref).equals(blockUri)) ?? -1;

                if (blockIx === -1) {
                    throw new Error(`BlockDefinition #${blockRef} not found`);
                }

                const block = (newAssets[blockIx] = cloneDeep(newAssets[blockIx]));
                if (!block.content.spec.providers) {
                    block.content.spec.providers = [];
                }

                if (!block.content.spec.consumers) {
                    block.content.spec.consumers = [];
                }

                const list =
                    role === ResourceRole.PROVIDES ? block.content.spec.providers : block.content.spec.consumers;
                list.push(resource);

                callbackHandlers.onResourceAdded.forEach((cb) => cb(blockRef, block.content, resource));

                return newAssets;
            });
        },
        updateResource(blockRef: string, resourceName: string, role: ResourceRole, resource: Resource) {
            if (!canEditBlocks) {
                return;
            }

            const blockUri = parseKapetaUri(blockRef);

            const blockFinder = (prevState: ContextData) => {
                const blockIx =
                    prevState.blockAssets.findIndex((block) => parseKapetaUri(block.ref).equals(blockUri)) ?? -1;

                if (blockIx === -1) {
                    return null;
                }

                return {
                    index: blockIx,
                    block: prevState.blockAssets[blockIx],
                };
            };

            updateAssets(
                (prevState) => {
                    const newState = {
                        plan: prevState.plan,
                        blockAssets: [...prevState.blockAssets],
                    };
                    const blockAssets = newState.blockAssets;

                    const existingBlockInfo = blockFinder(newState);

                    if (!existingBlockInfo) {
                        throw new Error(`Block #${blockRef} not found`);
                    }

                    const block = (blockAssets[existingBlockInfo.index] = cloneDeep(existingBlockInfo.block));

                    const resources: Resource[] =
                        role === ResourceRole.PROVIDES
                            ? block.content.spec.providers ?? []
                            : block.content.spec.consumers ?? [];

                    const existingResourceIx = resources.findIndex((r: Resource) => r.metadata.name === resourceName);
                    if (existingResourceIx === -1) {
                        throw new Error(`Resource ${resourceName} on block #${blockRef} not found`);
                    }

                    const existingResource = resources[existingResourceIx];

                    if (existingResource.metadata.name !== resource.metadata.name) {
                        // We changed the name of the resource.
                        // We need to update all connections that reference this resource
                        newState.plan = cloneDeep(prevState.plan);
                        const newPlan = newState.plan;
                        const affectedInstances = newPlan.spec.blocks.filter((instance) =>
                            parseKapetaUri(instance.block.ref).equals(blockUri)
                        );
                        affectedInstances.forEach((instance) => {
                            newPlan.spec.connections?.forEach((conn) => {
                                if (
                                    role === ResourceRole.CONSUMES &&
                                    conn.consumer.blockId === instance.id &&
                                    conn.consumer.resourceName === resourceName
                                ) {
                                    conn.consumer.resourceName = resource.metadata.name;
                                }

                                if (
                                    role === ResourceRole.PROVIDES &&
                                    conn.provider.blockId === instance.id &&
                                    conn.provider.resourceName === resourceName
                                ) {
                                    conn.provider.resourceName = resource.metadata.name;
                                }
                            });
                        });
                    }

                    resources[existingResourceIx] = resource;
                    if (role === ResourceRole.PROVIDES) {
                        block.content.spec.providers = resources;
                    } else {
                        block.content.spec.consumers = resources;
                    }

                    return newState;
                },
                (state) => {
                    const blockInfo = blockFinder(state);
                    return isTempBlock(blockInfo?.block);
                }
            );
        },
        onResourceAdded(callback: ResourceAddedCallback) {
            callbackHandlers.onResourceAdded.push(callback);
            return () => {
                callbackHandlers.onResourceAdded = callbackHandlers.onResourceAdded.filter((cb) => cb !== callback);
            };
        },
        removeResource(blockRef: string, resourceName: string, resourceRole: ResourceRole) {
            if (!canEditBlocks) {
                return;
            }
            updateBlockAssets((prevState) => {
                const newAssets = [...prevState];
                const blockIx =
                    newAssets.findIndex((pblock) => parseKapetaUri(pblock.ref).equals(parseKapetaUri(blockRef))) ?? -1;

                if (blockIx === -1) {
                    throw new Error(`BlockDefinition #${blockRef} not found`);
                }

                const block = cloneDeep(newAssets[blockIx]);
                const list =
                    resourceRole === ResourceRole.PROVIDES
                        ? block.content.spec.providers
                        : block.content.spec.consumers;
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
                            ? conn.provider.blockId === blockId && conn.provider.resourceName === resourceName
                            : conn.consumer.blockId === blockId && conn.consumer.resourceName === resourceName
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
            const blockAsset = block && getBlockByRef(block.ref);
            const list =
                resourceRole === ResourceRole.PROVIDES ? blockAsset?.spec.providers : blockAsset?.spec.consumers;
            return list?.find((rx) => rx.metadata.name === resourceName);
        },

        // connections
        addConnection(connection: Connection) {
            if (!canEditConnections) {
                return;
            }
            updatePlan((prevState) => {
                const newPlan = cloneDeep(prevState);
                if (!newPlan.spec.connections) {
                    newPlan.spec.connections = [];
                }
                const existIx = newPlan.spec.connections.findIndex((c) => connectionEquals(c, connection));
                if (existIx > -1) {
                    // Connection already exists - replace it
                    newPlan.spec.connections.splice(existIx, 1, connection);
                } else {
                    newPlan.spec.connections.push(connection);
                }
                return newPlan;
            });

            callbackHandlers.onConnectionAdded.forEach((cb) => cb(connection));
        },
        updatePlanMetadata(
            metadata: Metadata,
            configuration: EntityList,
            defaultConfiguration?: { [key: string]: any }
        ) {
            updatePlan((prevState) => {
                const newPlan = cloneDeep(prevState);
                newPlan.metadata = metadata;
                newPlan.spec.configuration = configuration;
                newPlan.spec.defaultConfiguration = defaultConfiguration;
                return newPlan;
            });
        },
        onConnectionAdded(callback: ConnectionAddedCallback) {
            callbackHandlers.onConnectionAdded.push(callback);
            return () => {
                callbackHandlers.onConnectionAdded = callbackHandlers.onConnectionAdded.filter((cb) => cb !== callback);
            };
        },
        updateConnectionMapping(connection: Connection) {
            if (!canEditConnections) {
                return;
            }
            updatePlan((prevState) => {
                const newPlan = cloneDeep(prevState);
                const ix = newPlan.spec.connections?.findIndex((c) => connectionEquals(c, connection)) ?? -1;
                if (ix > -1) {
                    newPlan.spec.connections![ix] = { ...connection, mapping: cloneDeep(connection.mapping) };
                }
                return newPlan;
            });
        },
        removeConnection(connection: Connection) {
            if (!canEditConnections) {
                return;
            }
            updatePlan((prevState) => {
                const newPlan = cloneDeep(prevState);
                const connectionIx = newPlan.spec.connections?.findIndex((conn) => connectionEquals(conn, connection));
                if (connectionIx !== undefined) {
                    newPlan.spec.connections?.splice(connectionIx, 1);
                }
                return newPlan;
            });
        },
        hasConnections(connectionSpec: Endpoint) {
            return !!plan.spec.connections?.find(
                (connection) =>
                    (connection.provider.blockId === connectionSpec.blockId &&
                        connection.provider.resourceName === connectionSpec.resourceName) ||
                    (connection.consumer.blockId === connectionSpec.blockId &&
                        connection.consumer.resourceName === connectionSpec.resourceName)
            );
        },
        connectionPoints,
        setHoveredChatUIAtom,
        hoveredChatUIAtom,
    };
};

export function withPlannerContext<T, HoveredChatUIAtom = any>(Inner: ExoticComponent<T & RefAttributes<HTMLElement>>) {
    return (props: T & JSX.IntrinsicAttributes & PlannerContextProps) => {
        const context = usePlannerContext<HoveredChatUIAtom>(props);
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
