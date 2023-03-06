import React, { useContext, useMemo, useState } from 'react';
import {
    BlockInstanceSpec,
    BlockKind,
    ResourceKind,
} from '@blockware/ui-web-types';
import { parseBlockwareUri, BlockwareURI } from '@blockware/nodejs-utils';
import { PlannerContext } from './PlannerContext';
import { getBlockHeightByResourceCount } from './utils/planUtils';
import { BlockMode } from '../wrappers/wrapperHelpers';

export interface PlannerBlockContextData {
    blockInstance: BlockInstanceSpec | null;
    blockDefinition: BlockKind | null;
    blockReference: BlockwareURI | null;
    consumers: ResourceKind[];
    providers: ResourceKind[];
    instanceBlockHeight: number;

    blockMode: BlockMode;
    setBlockMode: (mode: BlockMode) => void;
}

const defaultValue: PlannerBlockContextData = {
    blockDefinition: null,
    blockInstance: null,
    blockReference: null,
    consumers: [],
    providers: [],
    instanceBlockHeight: 0,
    blockMode: BlockMode.HIDDEN,
    setBlockMode(mode: BlockMode) {
        this.blockMode = mode;
    },
};

export const BlockContext = React.createContext(defaultValue);

interface BlockProviderProps extends React.PropsWithChildren {
    blockId: string;
}
export const BlockContextProvider: React.FC<BlockProviderProps> = ({
    blockId,
    children,
}) => {
    const { plan, size, getBlockByRef } = useContext(PlannerContext);
    const [blockMode, setBlockMode] = useState(BlockMode.HIDDEN);

    const value = useMemo(() => {
        const blockInstance =
            plan?.spec.blocks?.find((block) => block.id === blockId) || null;
        const blockDefinition =
            getBlockByRef(blockInstance?.block.ref || '') || null;
        // calculate Resource height
        const consumers = blockDefinition?.spec.consumers || [];
        const providers = blockDefinition?.spec.providers || [];
        const resourceCount = Math.max(consumers.length, providers.length);
        const instanceBlockHeight = getBlockHeightByResourceCount(
            resourceCount,
            size
        );
        // TODO: group layout helpers
        const blockReference =
            blockInstance && parseBlockwareUri(blockInstance?.block.ref);

        return {
            blockInstance,
            blockDefinition,
            blockReference,
            consumers,
            providers,
            instanceBlockHeight,
            blockMode,
            setBlockMode,
        };
    }, [plan, size, getBlockByRef, blockMode, setBlockMode, blockId]);
    return (
        <BlockContext.Provider value={value}>{children}</BlockContext.Provider>
    );
};

// TODO: theres got to be a better way to do this (non-null a field)
type WithEnsuredFields<T, KS extends keyof T> = {
    [K in keyof T]: K extends KS ? NonNullable<T[K]> : T[K];
};

type BlockContextWData = WithEnsuredFields<
    PlannerBlockContextData,
    'blockReference' | 'blockDefinition' | 'blockInstance'
>;

export const useBlockContext = (): BlockContextWData => {
    const ctx = useContext(BlockContext);
    if (!ctx.blockInstance || !ctx.blockReference) {
        throw new Error('Unable to find block in plan context.');
    }
    if (!ctx.blockDefinition) {
        throw new Error('Unable to find block definition');
    }
    return ctx as BlockContextWData;
};
