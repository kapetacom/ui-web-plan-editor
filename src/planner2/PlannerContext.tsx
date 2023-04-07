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
export interface PlannerActionConfig {
    block?: PlannerAction<any>[];
    connection?: PlannerAction<any>[];
    resource?: PlannerAction<any>[];
}

export interface PlannerContextData {
    plan?: PlanKind;
    blockAssets: Asset<BlockKind>[];
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

    // resources
    addResource(blockRef: string, resource: ResourceKind, role: ResourceRole): void;
    removeResource(blockRef: string, resourceName: string, resourceRole: ResourceRole): void;
    getResourceByBlockIdAndName(
        blockId: string,
        resourceName: string,
        resourceRole: ResourceRole
    ): ResourceKind | undefined;

    // connection stuff
    addConnection(connection: BlockConnectionSpec): void;
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
    // resources
    addResource(blockId: string) {},
    removeResource(blockId: string, resourceName: string) {},
    getResourceByBlockIdAndName() {
        return undefined;
    },
    // connection stuff
    addConnection(connection: BlockConnectionSpec) {},
    removeConnection(connection: BlockConnectionSpec) {},
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
    useEffect(() => {
        setPlan(props.plan);
    }, [props.plan]);

    // Allow internal changes, but load from props in case props change
    const [blockAssets, setBlockAssets] = useState(props.blockAssets);
    useEffect(() => {
        setBlockAssets(props.blockAssets);
    }, [props.blockAssets]);

    // onChange listeners
    useEffect(() => {
        if (plan !== props.plan && props.onChange) {
            props.onChange.call(null, plan);
        }
    }, [props.onChange, plan, props.plan]);

    useEffect(() => {
        if (blockAssets !== props.blockAssets && props.onAssetChange) {
            blockAssets.forEach((asset) => {
                const existing = props.blockAssets.find((a) => parseKapetaUri(a.ref).equals(parseKapetaUri(asset.ref)));
                if (existing && existing.data !== asset.data) {
                    props.onAssetChange!.call(null, asset);
                }
            });
        }
    }, [props.onAssetChange, blockAssets, props.blockAssets]);

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
                setBlockAssets((state) =>
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
                setPlan((prevState) => {
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
                setPlan((prevState) => {
                    const newPlan = cloneDeep(prevState);
                    newPlan.spec.blocks?.push(blockInstance);
                    return newPlan;
                });
            },
            removeBlockInstance(blockId: string) {
                if (!canEditBlocks) {
                    return;
                }
                setPlan((prevState) => {
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
                setBlockAssets((prevState) => {
                    const newAssets = cloneDeep(prevState);
                    const blockIx =
                        newAssets.findIndex((pblock) => parseKapetaUri(pblock.ref).equals(parseKapetaUri(blockRef))) ??
                        -1;

                    if (blockIx === -1) {
                        throw new Error(`Block #${blockRef} not found`);
                    }

                    const block = newAssets[blockIx];
                    const list = role === ResourceRole.PROVIDES ? block.data.spec.providers : block.data.spec.consumers;
                    list?.push(resource);
                    return newAssets;
                });
            },
            removeResource(blockRef: string, resourceName: string, resourceRole: ResourceRole) {
                if (!canEditBlocks) {
                    return;
                }
                // Remove connection point
                setBlockAssets((prevState) => {
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
                setPlan((prevState) => {
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
                const resource = list?.find((rx) => rx.metadata.name === resourceName);
                return resource;
            },

            // connections
            addConnection({ from, to, mapping }: BlockConnectionSpec) {
                if (!canEditConnections) {
                    return;
                }
                setPlan((prevState) => {
                    const newPlan = cloneDeep(prevState);
                    newPlan.spec.connections?.push({ from, to, mapping });
                    return newPlan;
                });
            },
            removeConnection(connection: BlockConnectionSpec) {
                if (!canEditConnections) {
                    return;
                }
                setPlan((prevState) => {
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
