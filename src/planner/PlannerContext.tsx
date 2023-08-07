import React, { ExoticComponent, RefAttributes, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Asset, Point, ResourceRole, SchemaKind } from '@kapeta/ui-web-types';
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
import { PlannerNodeSize } from '../types';
import { PlannerAction, Rectangle } from './types';

import { PlannerMode, BlockMode, ResourceMode } from '../utils/enums';
import { getResourceId } from './utils/planUtils';
import { DnDContainer } from './DragAndDrop/DnDContainer';
import { connectionEquals } from './utils/connectionUtils';
import { BlockResouceIconProps } from './components/BlockResourceIcon';
import { getLocalRefForBlockDefinition } from './utils/blockUtils';

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

export interface PlannerContextData {
    plan?: Plan;
    asset?: Asset<Plan>;
    uri?: KapetaURI;
    blockAssets: Asset<BlockDefinition>[];
    setBlockAssets(blockAssets: Asset<BlockDefinition>[]): void;

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
    nodeSize: PlannerNodeSize;
    getBlockByRef(ref: string): BlockDefinition | undefined;
    getBlockById(blockId: string): BlockDefinition | undefined;

    updatePlanMetadata(metadata: Metadata, configuration: EntityList): void;

    removeBlockDefinition(update: Asset<BlockDefinition>): void;
    updateBlockDefinition(ref: string, update: BlockDefinition): void;
    addBlockDefinition(asset: Asset<BlockDefinition>): void;
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
        getResourceIcon() {
            return undefined;
        },
        setResourceIcon() {},
    },
    instanceStates: {},
    zoom: 1,
    setZoomLevel() {},

    setFocusedBlock(block: BlockInstance) {},

    nodeSize: PlannerNodeSize.MEDIUM,
    blockAssets: [],
    setBlockAssets(blockAssets: Asset<BlockDefinition>[]) {},
    getBlockByRef(_ref: string) {
        return undefined;
    },
    getBlockById(blockId: string): BlockDefinition | undefined {
        return undefined;
    },

    removeBlockDefinition() {},
    updateBlockDefinition() {},
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
    updatePlanMetadata(metadata: Metadata, configuration: EntityList) {},
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
    plan: Plan;
    asset: Asset<Plan>;
    blockAssets: Asset<BlockDefinition>[];
    mode: PlannerMode;
    onChange?: (plan: Plan) => void;
    onAssetChange?: (asset: Asset<SchemaKind>) => void;
    instanceStates?: { [id: string]: InstanceStatus };
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

    const [focusedBlock, setFocusedBlock] = useState<BlockInstance>();
    const [canvasSize, setCanvasSize] = useState<Rectangle>({ x: 0, y: 0, width: 0, height: 0 });

    const [zoom, setZoomLevel] = useState(1);

    // Allow internal changes, but load from props in case props change
    const [plan, setPlan] = useState(props.plan);

    useEffect(() => {
        setPlan(props.plan);
    }, [props.plan]);

    // Allow internal changes, but load from props in case props change
    const [blockAssets, setBlockAssets] = useState(props.blockAssets);

    useEffect(() => {
        setBlockAssets(props.blockAssets);
    }, [props.blockAssets]);

    const toggleFocusBlock = useCallback(
        (block: BlockInstance | undefined) => {
            setFocusedBlock((prevFocus) => (prevFocus && block && block.id === prevFocus.id ? undefined : block));
        },
        [setFocusedBlock]
    );

    const [viewStates, setViewStates] = useState({});
    const [resourceConfig, setResourceConfig] = useState({});
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

    const updatePlan = useCallback(
        function updatePlan(changer: (prev: Plan) => Plan, preventChangeEvent?:boolean) {
            setPlan((prev) => {
                const newPlan = changer(prev);

                if (!preventChangeEvent && props.onChange && newPlan !== prev) {
                    props.onChange(newPlan);
                }
                return newPlan;
            });
        },
        []
    );

    const updateBlockAssets = useCallback(
        function updateBlockAssets(changer: (prev: Asset<BlockDefinition>[]) => Asset<BlockDefinition>[]) {
            setBlockAssets((prev) => {
                const newAssets = changer(prev);
                if (props.onAssetChange) {
                    newAssets.forEach((newAsset, ix) => {
                        if (props.onAssetChange && prev.indexOf(newAsset) === -1) {
                            props.onAssetChange(newAsset);
                        }
                    });
                }
                return newAssets;
            });
        },
        []
    );

    const viewMode = props.mode;

    function isTempInstanceId(instanceId: string) {
        const blockInstance = plan.spec.blocks.find((block) => block.id === instanceId);
        if (!blockInstance) {
            return false;
        }

        return isTempInstance(blockInstance);
    }

    function isTempInstance(blockInstance:BlockInstance) {
        const block = blockAssets.find((asset) => asset.ref === blockInstance.block.ref);
        if (!block) {
            return true;
        }

        if (!block.exists) {
            return true;
        }

        return false;
    }

    const updateBlockInstance = useCallback(
        (instanceId: string, updater) => {
            const canEditBlocks = viewMode === PlannerMode.EDIT;
            if (!canEditBlocks) {
                return;
            }
            // Use state callback to reference the previous state (avoid stale ref)
            updatePlan((prevState) => {
                const newPlan = cloneDeep(prevState);
                const blockIx = newPlan.spec.blocks?.findIndex((pblock) => pblock.id === instanceId) ?? -1;
                if (blockIx === -1) {
                    throw new Error(`Block instance #${instanceId} not found`);
                }

                const blocks = (newPlan.spec.blocks = newPlan.spec.blocks || []);
                blocks[blockIx] = updater(blocks[blockIx]);
                return newPlan;
            }, isTempInstanceId(instanceId));
        },
        [updatePlan, viewMode]
    );

    return useMemo(() => {
        const canEditBlocks = viewMode === PlannerMode.EDIT;
        const canEditConnections = viewMode === PlannerMode.EDIT;

        const uri = parseKapetaUri(props.asset.ref);

        const planner = {
            // view state
            focusedBlock,
            setFocusedBlock: toggleFocusBlock,
            assetState,
            //

            instanceStates,

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
            asset: props.asset,
            uri: uri,
            blockAssets,
            setBlockAssets(newBlockAssets: Asset<BlockDefinition>[]) {
                setBlockAssets(newBlockAssets);
            },
            getBlockByRef(ref: string) {
                const blockAsset = blockAssets.find((asset) => parseKapetaUri(asset.ref).equals(parseKapetaUri(ref)));
                return blockAsset?.data;
            },
            getBlockById(blockId: string) {
                const block = plan.spec.blocks?.find((bx) => bx.id === blockId);
                return block && planner.getBlockByRef(block.block.ref);
            },
            updateBlockDefinition(ref: string, update: BlockDefinition) {
                if (!canEditBlocks) {
                    return;
                }
                const uri = parseKapetaUri(ref);
                updateBlockAssets((state) =>
                    state.map((block) =>
                        parseKapetaUri(block.ref).equals(uri)
                            ? { ...block, ref: `kapeta://${update.metadata.name}:local`, data: update }
                            : block
                    )
                );
            },
            hasBlockDefinition(ref: string): boolean {
                const newUri = parseKapetaUri(ref);
                return blockAssets.some((asset) => newUri.equals(parseKapetaUri(asset.ref)));
            },
            removeBlockDefinition(asset: Asset<BlockDefinition>) {
                if (!canEditBlocks) {
                    return;
                }

                updateBlockAssets((state) => {
                    return state.filter((block) => block.ref !== asset.ref);
                });
            },
            addBlockDefinition(asset: Asset<BlockDefinition>) {
                if (!canEditBlocks) {
                    return;
                }

                updateBlockAssets((state) => {
                    return [
                        ...state.filter((block) => block.ref !== asset.ref),
                        asset
                    ];
                });
            },
            updateBlockInstance,
            addBlockInstance(blockInstance: BlockInstance) {
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
                }, isTempInstance(blockInstance));
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
                updatePlan((prevState) => {
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
                }, isTempInstanceId(blockId));
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

                    const block = newAssets[blockIx] = cloneDeep(newAssets[blockIx]);
                    if (!block.data.spec.providers) {
                        block.data.spec.providers = [];
                    }

                    if (!block.data.spec.consumers) {
                        block.data.spec.consumers = [];
                    }

                    const list = role === ResourceRole.PROVIDES ? block.data.spec.providers : block.data.spec.consumers;
                    list.push(resource);

                    callbackHandlers.onResourceAdded.forEach((cb) => cb(blockRef, block.data, resource));

                    return newAssets;
                });
            },
            updateResource(blockRef: string, resourceName: string, role: ResourceRole, resource: Resource) {
                if (!canEditBlocks) {
                    return;
                }

                console.log('updateResource', blockRef, resourceName);
                const blockUri = parseKapetaUri(blockRef);

                updateBlockAssets((prevState) => {
                    const newAssets = [...prevState];
                    const blockIx = newAssets.findIndex((block) => parseKapetaUri(block.ref).equals(blockUri)) ?? -1;

                    if (blockIx === -1) {
                        throw new Error(`Block #${blockRef} not found`);
                    }

                    const block = newAssets[blockIx] = cloneDeep(newAssets[blockIx]);

                    const resources: Resource[] =
                        role === ResourceRole.PROVIDES
                            ? block.data.spec.providers ?? []
                            : block.data.spec.consumers ?? [];

                    const existingResourceIx = resources.findIndex((r: Resource) => r.metadata.name === resourceName);
                    if (existingResourceIx === -1) {
                        throw new Error(`Resource ${resourceName} on block #${blockRef} not found`);
                    }

                    const existingResource = resources[existingResourceIx];

                    if (existingResource.metadata.name !== resource.metadata.name) {
                        // We changed the name of the resource.
                        // We need to update all connections that reference this resource
                        updatePlan((prevPlanState) => {
                            const newPlan = cloneDeep(prevPlanState);
                            const affectedInstances = newPlan.spec.blocks.filter((instance) =>
                                parseKapetaUri(instance.block.ref).equals(blockUri)
                            );

                            affectedInstances.forEach((instance) => {
                                newPlan.spec.connections?.filter((conn) => {
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

                            return newPlan;
                        }, !block.exists);
                    }

                    resources[existingResourceIx] = resource;
                    if (role === ResourceRole.PROVIDES) {
                        block.data.spec.providers = resources;
                    } else {
                        block.data.spec.consumers = resources;
                    }

                    return newAssets;
                });
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
                        newAssets.findIndex((pblock) => parseKapetaUri(pblock.ref).equals(parseKapetaUri(blockRef))) ??
                        -1;

                    if (blockIx === -1) {
                        throw new Error(`BlockDefinition #${blockRef} not found`);
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
                const blockAsset = block && planner.getBlockByRef(block.ref);
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
            updatePlanMetadata(metadata: Metadata, configuration: EntityList) {
                updatePlan((prevState) => {
                    const newPlan = cloneDeep(prevState);
                    newPlan.metadata = metadata;
                    newPlan.spec.configuration = configuration;
                    return newPlan;
                });
            },
            onConnectionAdded(callback: ConnectionAddedCallback) {
                callbackHandlers.onConnectionAdded.push(callback);
                return () => {
                    callbackHandlers.onConnectionAdded = callbackHandlers.onConnectionAdded.filter(
                        (cb) => cb !== callback
                    );
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
                    const connectionIx = newPlan.spec.connections?.findIndex((conn) =>
                        connectionEquals(conn, connection)
                    );
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
        };
        return planner;
    }, [
        updateBlockInstance,
        updatePlan,
        updateBlockAssets,
        instanceStates,
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

export function withPlannerContext<T>(Inner: ExoticComponent<T & RefAttributes<HTMLElement>>) {
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
