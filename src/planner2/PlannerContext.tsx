import React, { useEffect, useMemo, useState } from 'react';
import { PlannerBlockModelWrapper } from '../wrappers/PlannerBlockModelWrapper';
import {
    Asset,
    BlockConnectionSpec,
    BlockInstanceSpec,
    BlockKind,
    BlockResourceReferenceSpec,
    PlanKind,
    Point,
    ResourceRole,
} from '@kapeta/ui-web-types';
import { parseKapetaUri } from '@kapeta/nodejs-utils';
import { PlannerNodeSize } from '../types';
import { cloneDeep } from 'lodash';
import { PlannerAction } from './types';

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
    focusedBlock?: PlannerBlockModelWrapper;
    mode?: PlannerMode;
    zoom: number;
    setZoomLevel: (zoom: number | ((currentZoom: number) => number)) => void;
    size: PlannerNodeSize;
    getBlockByRef(ref: string): BlockKind | undefined;
    updateBlockDefinition(ref: string, update: BlockKind): void;
    updateBlockInstance(blockId: string, updater: BlockUpdater): void;
    removeBlockInstance(blockId: string): void;

    // resources
    addResource(blockId: string);
    removeResource(
        blockId: string,
        resourceName: string,
        resourceRole: ResourceRole
    ): void;

    // connection stuff
    addConnection(connection: BlockConnectionSpec): void;
    removeConnection(connection: BlockConnectionSpec): void;
    hasConnections(connectionSpec: BlockResourceReferenceSpec): boolean;
    connectionPoints: {
        addPoint(id: string, point: Point): void;
        getPointById(id: string): Point | null;
        removePoint(pointId: string): void;
    };
}

const defaultValue: PlannerContextData = {
    focusedBlock: undefined,
    mode: PlannerMode.VIEW,
    zoom: 1,
    setZoomLevel() {},

    size: PlannerNodeSize.MEDIUM,
    blockAssets: [],
    getBlockByRef(_ref: string) {
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
export const usePlannerContext = ({
    plan: extPlan,
    blockAssets: extBlockAssets,
    mode = PlannerMode.VIEW,
}: PlannerContextProps): PlannerContextData => {
    const [points, setPoints] = useState<{ [id: string]: Point }>({});
    const connectionPoints = useMemo(
        () => ({
            addPoint(id: string, point: Point) {
                setPoints((ps) => ({ ...ps, [id]: point }));
            },
            getPointById(id: string) {
                return points[id] || null;
            },
            removePoint(id: string) {
                setPoints((prev) => {
                    const newPoints = { ...prev };
                    delete newPoints[id];
                    return newPoints;
                });
            },
        }),
        [points, setPoints]
    );

    // region View state
    const [focusedBlock, setFocusedBlock] =
        useState<PlannerBlockModelWrapper>();
    const [viewMode, setViewMode] = useState(mode);
    const [zoom, setZoomLevel] = useState(1);
    // zoom
    // size
    // endregion

    // Allow internal changes, but load from props in case props change
    const [plan, setPlan] = useState(extPlan);
    useEffect(() => {
        setPlan(extPlan);
    }, [extPlan]);

    // Allow internal changes, but load from props in case props change
    const [blockAssets, setBlockAssets] = useState(extBlockAssets);
    useEffect(() => {
        setBlockAssets(extBlockAssets);
    }, [extBlockAssets]);

    return useMemo(
        () => ({
            // view state
            focusedBlock,
            zoom,
            setZoomLevel,
            size: PlannerNodeSize.MEDIUM,
            //
            mode: viewMode,
            //
            plan: plan,
            blockAssets,
            getBlockByRef(ref: string) {
                const blockAsset = blockAssets.find(
                    (asset) =>
                        parseKapetaUri(asset.ref).compare(
                            parseKapetaUri(ref)
                        ) === 0
                );
                return blockAsset?.data;
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
                    return newPlan;
                });
            },
            // resources
            addResource(blockId: string) {
                // ...
            },
            removeResource(
                blockId: string,
                resourceName: string,
                resourceRole: ResourceRole
            ) {
                setBlockAssets((prevState) => {
                    const newAssets = cloneDeep(prevState);
                    const blockIx =
                        newAssets.findIndex(
                            (pblock) => pblock.id === blockId
                        ) ?? -1;
                    if (blockIx === -1) {
                        throw new Error(`Block #${blockId} not found`);
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
                            `Resource ${resourceName} not found in block #${blockId}`
                        );
                    }
                    list!.splice(resourceIx, 1);
                    return newAssets;
                });
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
        }),
        [
            blockAssets,
            plan,
            zoom,
            setZoomLevel,
            connectionPoints,
            focusedBlock,
            viewMode,
        ]
    );
};

export const withPlannerContext = function <T>(Inner: React.ComponentType<T>) {
    return (props: T & JSX.IntrinsicAttributes & PlannerContextProps) => {
        const context = usePlannerContext(props);
        return (
            <PlannerContext.Provider value={context}>
                <Inner {...props} />
            </PlannerContext.Provider>
        );
    };
};
