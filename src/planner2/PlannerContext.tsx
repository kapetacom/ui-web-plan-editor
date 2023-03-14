import React, { Context, useEffect, useState } from 'react';
import { PlannerBlockModelWrapper } from '../wrappers/PlannerBlockModelWrapper';
import {
    Asset,
    BlockInstanceSpec,
    BlockKind,
    PlanKind,
} from '@blockware/ui-web-types';
import { parseBlockwareUri } from '@blockware/nodejs-utils';
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
}

export interface PlannerContextType extends Context<PlannerContextData> {}

const defaultValue: PlannerContextData = {
    focusedBlock: undefined,
    mode: PlannerMode.VIEW,
    zoom: 1,
    size: PlannerNodeSize.MEDIUM,
    blockAssets: [],
    setZoomLevel() {},
    getBlockByRef(_ref: string) {
        return undefined;
    },
    updateBlockInstance(blockId, callback) {
        // noop
    },
};

export const PlannerContext: PlannerContextType =
    React.createContext(defaultValue);

// Helper to make sure we memoize anything we can for the context
const usePlannerContext = ({
    plan,
    blockAssets,
    mode = PlannerMode.VIEW,
}: {
    plan: PlanKind;
    blockAssets: Asset<BlockKind>[];
    mode: PlannerMode;
}): PlannerContextData => {
    // region View state
    const [focusedBlock, setFocusedBlock] =
        useState<PlannerBlockModelWrapper>();
    const [viewMode, setViewMode] = useState(mode);
    const [zoom, setZoomLevel] = useState(1);
    // zoom
    // size
    // endregion

    const [currentPlan, setCurrentPlan] = useState(plan);
    useEffect(() => {
        setCurrentPlan(plan);
    }, [plan]);

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
        plan: currentPlan,
        blockAssets,
        getBlockByRef(ref: string) {
            const blockAsset = blockAssets.find((asset) =>
                parseBlockwareUri(asset.ref).compare(parseBlockwareUri(ref))
            );
            return blockAsset?.data;
        },
        updateBlockInstance(blockId: string, updater) {
            // Use state callback to reference the previous state (avoid stale ref)
            setCurrentPlan((prevState) => {
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
    };
};

export const PlannerContextProvider: React.FC<
    Parameters<typeof usePlannerContext>[0] & { children: React.ReactNode }
> = (props) => {
    const plannerContext = usePlannerContext(props);
    return (
        <PlannerContext.Provider value={plannerContext}>
            {props.children}
        </PlannerContext.Provider>
    );
};
