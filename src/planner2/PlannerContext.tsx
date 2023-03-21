import React, { Context, useEffect, useMemo, useState } from 'react';
import { PlannerBlockModelWrapper } from '../wrappers/PlannerBlockModelWrapper';
import {
    Asset,
    BlockConnectionSpec,
    BlockInstanceSpec,
    BlockKind,
    BlockResourceReferenceSpec,
    PlanKind,
    Point,
} from '@kapeta/ui-web-types';
import { parseBlockwareUri } from '@kapeta/nodejs-utils';
import { PlannerNodeSize } from '../types';
import { cloneDeep } from 'lodash';

export enum PlannerMode {
    VIEW,
    CONFIGURATION,
    EDIT,
}

type BlockUpdater = (block: BlockInstanceSpec) => BlockInstanceSpec;
export interface PlannerContextData {
    plan?: PlanKind;
    blockAssets: Asset<BlockKind>[];
    focusedBlock?: PlannerBlockModelWrapper;
    mode?: PlannerMode;
    zoom: number;
    setZoomLevel: (zoom: number | ((currentZoom: number) => number)) => void;
    size: PlannerNodeSize;
    getBlockByRef(ref: string): BlockKind | undefined;
    updateBlockInstance(blockId: string, updater: BlockUpdater): void;
    addConnection(connection: BlockConnectionSpec): void;
    hasConnections(connectionSpec: BlockResourceReferenceSpec): boolean;
    connectionPoints: {
        addPoint(id: string, point: Point): void;
        getPointById(id: string): Point | null;
        removePoint(pointId: string): void;
    };
}

export interface PlannerContextType extends Context<PlannerContextData> {}

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
    updateBlockInstance(blockId, callback) {
        // noop
    },
    addConnection(connection: BlockConnectionSpec) {},
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

export const PlannerContext: PlannerContextType =
    React.createContext(defaultValue);

// Helper to make sure we memoize anything we can for the context
export const usePlannerContext = ({
    plan: extPlan,
    blockAssets,
    mode = PlannerMode.VIEW,
}: {
    plan: PlanKind;
    blockAssets: Asset<BlockKind>[];
    mode: PlannerMode;
}): PlannerContextData => {
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

    const [plan, setPlan] = useState(extPlan);
    useEffect(() => {
        setPlan(extPlan);
    }, [extPlan]);

    // Plan:
    // connections

    return {
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
                    parseBlockwareUri(asset.ref).compare(
                        parseBlockwareUri(ref)
                    ) === 0
            );
            return blockAsset?.data;
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

        addConnection({ from, to, mapping }: BlockConnectionSpec) {
            setPlan((prevState) => {
                const newPlan = cloneDeep(prevState);
                newPlan.spec.connections?.push({ from, to, mapping });
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
};
