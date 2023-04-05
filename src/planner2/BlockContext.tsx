import React, { useContext, useMemo, useState } from 'react';
import { KapetaURI, parseKapetaUri } from '@kapeta/nodejs-utils';
import { PlannerContext } from './PlannerContext';
import { getBlockHeightByResourceCount } from './utils/planUtils';
import { BlockMode } from '../wrappers/wrapperHelpers';
import { InstanceStatus } from '@kapeta/ui-web-context';
import {BlockDefinition, BlockInstance, Resource} from "@kapeta/schemas";

export interface PlannerBlockContextData {
    blockInstance: BlockInstance | null;
    blockDefinition?: BlockDefinition;
    blockReference: KapetaURI | null;
    consumers: Resource[];
    providers: Resource[];
    instanceStatus: InstanceStatus;
    instanceBlockHeight: number;

    blockMode: BlockMode;
    setBlockMode: (mode: BlockMode) => void;
    isBlockDefinitionReadOnly: boolean;
    isBlockInstanceReadOnly: boolean;
}

const defaultValue: PlannerBlockContextData = {
    blockDefinition: undefined,
    blockInstance: null,
    blockReference: null,
    consumers: [],
    providers: [],
    instanceStatus: InstanceStatus.STOPPED,
    instanceBlockHeight: 0,
    blockMode: BlockMode.HIDDEN,
    setBlockMode(mode: BlockMode) {
        this.blockMode = mode;
    },
    isBlockDefinitionReadOnly: false,
    isBlockInstanceReadOnly: false,
};

export const BlockContext = React.createContext(defaultValue);

interface BlockProviderProps extends React.PropsWithChildren {
    blockId: string;
}
export const BlockContextProvider: React.FC<BlockProviderProps> = ({ blockId, children }) => {
    const planner = useContext(PlannerContext);
    const [blockMode, setBlockMode] = useState(BlockMode.HIDDEN);

    const blockInstance = planner.plan?.spec.blocks?.find((block) => block.id === blockId) || null;
    const blockDefinition = planner.getBlockByRef(blockInstance?.block.ref || '');
    // Overrides from external sources, such as the sidebar
    const overrideMode = blockInstance && planner.assetState.getViewModeForBlock(blockInstance);
    const focusedMode = planner.focusedBlock?.id === blockId ? BlockMode.FOCUSED : undefined;
    const instanceStatus = planner.instanceStates[blockId] || InstanceStatus.STOPPED;

    const value = useMemo(() => {
        // calculate Resource height
        const consumers = blockDefinition?.spec.consumers || [];
        const providers = blockDefinition?.spec.providers || [];

        const pendingConsumers = blockMode === BlockMode.HOVER_DROP_CONSUMER ? 1 : 0;
        const pendingProviders = blockMode === BlockMode.HOVER_DROP_PROVIDER ? 1 : 0;
        const resourceCount = Math.max(consumers.length + pendingConsumers, providers.length + pendingProviders);
        const instanceBlockHeight = getBlockHeightByResourceCount(resourceCount, planner.nodeSize);
        const blockReference = blockInstance && parseKapetaUri(blockInstance?.block.ref);

        return {
            blockInstance,
            blockDefinition,
            blockReference,
            consumers,
            providers,
            instanceStatus,
            instanceBlockHeight,
            blockMode: focusedMode ?? overrideMode ?? blockMode,
            setBlockMode,
            isBlockInstanceReadOnly: !planner.canEditBlocks,
            isBlockDefinitionReadOnly: blockReference?.version !== 'local' || planner.canEditBlocks === false,
        };
    }, [
        planner.nodeSize,
        planner.canEditBlocks,
        blockInstance,
        blockDefinition,
        instanceStatus,
        blockMode,
        setBlockMode,
        overrideMode,
        focusedMode,
    ]);
    return <BlockContext.Provider value={value}>{children}</BlockContext.Provider>;
};

// TODO: theres got to be a better way to do this (non-null a field)
type WithEnsuredFields<T, KS extends keyof T> = {
    [K in keyof T]: K extends KS ? NonNullable<T[K]> : T[K];
};

type BlockContextWData = WithEnsuredFields<PlannerBlockContextData, 'blockReference' | 'blockInstance'>;

export const useBlockContext = (): BlockContextWData => {
    const ctx = useContext(BlockContext);
    if (!ctx.blockInstance || !ctx.blockReference) {
        throw new Error('Unable to find block in plan context.');
    }
    return ctx as BlockContextWData;
};
