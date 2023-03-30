import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PlannerBlockModelWrapper } from '../wrappers/PlannerBlockModelWrapper';
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
} from '@kapeta/ui-web-types';
import { parseKapetaUri } from '@kapeta/nodejs-utils';
import { PlannerNodeSize } from '../types';
import { cloneDeep } from 'lodash';
import {PlannerAction, Rectangle} from './types';

export enum PlannerMode {
    VIEW,
    CONFIGURATION,
    EDIT,
}

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
    setFocusedBlock(block:BlockInstanceSpec): void;
    mode?: PlannerMode;
    zoom: number;
    setZoomLevel: (zoom: number | ((currentZoom: number) => number)) => void;
    nodeSize: PlannerNodeSize;
    getBlockByRef(ref: string): BlockKind | undefined;
    getBlockById(blockId: string): BlockKind | undefined;

    updateBlockDefinition(ref: string, update: BlockKind): void;
    updateBlockInstance(blockId: string, updater: BlockUpdater): void;
    removeBlockInstance(blockId: string): void;

    // resources
    addResource(
        blockRef: string,
        resource: ResourceKind,
        role: ResourceRole
    ): void;
    removeResource(
        blockRef: string,
        resourceName: string,
        resourceRole: ResourceRole
    ): void;
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

    canvasSize: Rectangle
    setCanvasSize(canvasSize: Rectangle): void;
}

const defaultValue: PlannerContextData = {
    mode: PlannerMode.VIEW,
    zoom: 1,
    setZoomLevel() {},

    focusedBlock: undefined,
    setFocusedBlock(block: BlockInstanceSpec) {},

    canvasSize: {x: 0, y: 0, width: 0, height: 0},
    setCanvasSize(canvasSize: Rectangle) {},

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
};

export const PlannerContext = React.createContext(defaultValue);
export type PlannerContextProps = {
    plan: PlanKind;
    blockAssets: Asset<BlockKind>[];
    mode: PlannerMode;
};

// Helper to make sure we memoize anything we can for the context
export const usePlannerContext = (props: PlannerContextProps): PlannerContextData => {
    const mode = props.mode === undefined ? PlannerMode.VIEW : props.mode;
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
    const [canvasSize, setCanvasSize] = useState<Rectangle>({x: 0, y: 0, width: 0, height: 0});
    const [viewMode, setViewMode] = useState(mode);
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

    const toggleFocusBlock = (block: BlockInstanceSpec) => {
        setFocusedBlock(focusedBlock && block.id === focusedBlock.id ? undefined : block);
    };

    return useMemo(() => {
        const planner = {
            // view state
            focusedBlock,
            setFocusedBlock: toggleFocusBlock,

            zoom,
            setZoomLevel,

            canvasSize,
            setCanvasSize,

            nodeSize: PlannerNodeSize.MEDIUM,
            //
            mode: viewMode,
            //
            plan: plan,
            blockAssets,
            getBlockByRef(ref: string) {
                const blockAsset = blockAssets.find((asset) =>
                    parseKapetaUri(asset.ref).equals(parseKapetaUri(ref))
                );
                return blockAsset?.data;
            },
            getBlockById(blockId: string) {
                const block = plan.spec.blocks?.find((bx) => bx.id === blockId);
                return block && planner.getBlockByRef(block.block.ref);
            },
            updateBlockDefinition(ref: string, update: BlockKind) {
                setBlockAssets((state) =>
                    state.map((block) =>
                        parseKapetaUri(block.ref).compare(
                            parseKapetaUri(ref)
                        ) === 0
                            ? { ...block, data: update }
                            : block
                    )
                );
            },
            updateBlockInstance(blockId: string, updater) {
                // Use state callback to reference the previous state (avoid stale ref)
                setPlan((prevState) => {
                    const newPlan = cloneDeep(prevState);
                    const blockIx =
                        newPlan.spec.blocks?.findIndex(
                            (pblock) => pblock.id === blockId
                        ) ?? -1;
                    if (blockIx === -1) {
                        throw new Error(`Block #${blockId} not found`);
                    }

                    const blocks = (newPlan.spec.blocks =
                        newPlan.spec.blocks || []);
                    blocks[blockIx] = updater(blocks[blockIx]);
                    return newPlan;
                });

                // TODO: Save to disk / callback
            },
            removeBlockInstance(blockId: string) {
                setPlan((prevState) => {
                    const newPlan = cloneDeep(prevState);
                    const blockIx =
                        newPlan.spec.blocks?.findIndex(
                            (pblock) => pblock.id === blockId
                        ) ?? -1;
                    if (blockIx === -1) {
                        throw new Error(`Block #${blockId} not found`);
                    }
                    newPlan.spec.blocks?.splice(blockIx, 1);

                    // Remove any connections that reference this block
                    newPlan.spec.connections = newPlan.spec.connections?.filter(
                        (conn) =>
                            conn.to.blockId !== blockId &&
                            conn.from.blockId !== blockId
                    );
                    return newPlan;
                });
            },
            // resources
            addResource(
                blockRef: string,
                resource: ResourceKind,
                role: ResourceRole
            ) {
                setBlockAssets((prevState) => {
                    const newAssets = cloneDeep(prevState);
                    const blockIx =
                        newAssets.findIndex((pblock) =>
                            parseKapetaUri(pblock.ref).equals(
                                parseKapetaUri(blockRef)
                            )
                        ) ?? -1;

                    if (blockIx === -1) {
                        throw new Error(`Block #${blockRef} not found`);
                    }

                    const block = newAssets[blockIx];
                    const list =
                        role === ResourceRole.PROVIDES
                            ? block.data.spec.providers
                            : block.data.spec.consumers;
                    list?.push(resource);
                    return newAssets;
                });
            },
            removeResource(
                blockRef: string,
                resourceName: string,
                resourceRole: ResourceRole
            ) {
                // Remove connection point
                setBlockAssets((prevState) => {
                    const newAssets = cloneDeep(prevState);
                    const blockIx =
                        newAssets.findIndex((pblock) =>
                            parseKapetaUri(pblock.ref).equals(
                                parseKapetaUri(blockRef)
                            )
                        ) ?? -1;

                    if (blockIx === -1) {
                        throw new Error(`Block #${blockRef} not found`);
                    }

                    const block = newAssets[blockIx];

                    const list =
                        resourceRole === ResourceRole.PROVIDES
                            ? block.data.spec.providers
                            : block.data.spec.consumers;
                    const resourceIx =
                        list?.findIndex(
                            (resource) =>
                                resource.metadata.name === resourceName
                        ) ?? -1;
                    if (resourceIx === -1) {
                        throw new Error(
                            `Resource ${resourceName} not found in block #${blockRef}`
                        );
                    }
                    list!.splice(resourceIx, 1);
                    return newAssets;
                });

                // Remove any connections to/from the deleted resource
                setPlan((prevState) => {
                    const newPlan = cloneDeep(prevState);
                    const blockIds =
                        newPlan.spec.blocks
                            ?.filter((block) =>
                                parseKapetaUri(block.block.ref).equals(
                                    parseKapetaUri(blockRef)
                                )
                            )
                            .map((block) => block.id) ?? [];
                    const connections = newPlan.spec.connections ?? [];
                    for (const blockId of blockIds) {
                        const connectionIx = connections.findIndex((conn) =>
                            resourceRole === ResourceRole.PROVIDES
                                ? conn.from.blockId === blockId &&
                                  conn.from.resourceName === resourceName
                                : conn.to.blockId === blockId &&
                                  conn.to.resourceName === resourceName
                        );
                        if (connectionIx !== -1) {
                            connections.splice(connectionIx, 1);
                        }
                    }
                    return newPlan;
                });
            },
            getResourceByBlockIdAndName(
                blockId: string,
                resourceName: string,
                resourceRole: ResourceRole
            ) {
                const block = plan.spec.blocks?.find(
                    (bx) => bx.id === blockId
                )?.block;
                const blockAsset = block && planner.getBlockByRef(block.ref);
                const list =
                    resourceRole === ResourceRole.PROVIDES
                        ? blockAsset?.spec.providers
                        : blockAsset?.spec.consumers;
                const resource = list?.find(
                    (rx) => rx.metadata.name === resourceName
                );
                return resource;
            },
            // connections
            addConnection({ from, to, mapping }: BlockConnectionSpec) {
                setPlan((prevState) => {
                    const newPlan = cloneDeep(prevState);
                    newPlan.spec.connections?.push({ from, to, mapping });
                    return newPlan;
                });
            },
            removeConnection(connection: BlockConnectionSpec) {
                setPlan((prevState) => {
                    const newPlan = cloneDeep(prevState);
                    const connectionIx = newPlan.spec.connections?.findIndex(
                        (conn) =>
                            conn.from.blockId === connection.from.blockId &&
                            conn.from.resourceName ===
                                connection.from.resourceName &&
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
                            connection.from.resourceName ===
                                connectionSpec.resourceName) ||
                        (connection.to.blockId === connectionSpec.blockId &&
                            connection.to.resourceName ===
                                connectionSpec.resourceName)
                );
            },
            connectionPoints,
        };
        return planner;
    }, [
        blockAssets,
        plan,
        zoom,
        setZoomLevel,
        connectionPoints,
        focusedBlock,
        setFocusedBlock,
        viewMode,
    ]);
};

export function withPlannerContext<T>(Inner: React.ComponentType<T>) {
    return (props: T & JSX.IntrinsicAttributes & PlannerContextProps) => {
        const context = usePlannerContext(props);
        return (
            <PlannerContext.Provider value={context}>
                <Inner {...props} />
            </PlannerContext.Provider>
        );
    };
}
