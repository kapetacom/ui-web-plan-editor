import React, {useContext, useMemo, useState} from 'react';
import {KapetaURI, parseKapetaUri} from '@kapeta/nodejs-utils';
import {PlannerContext} from './PlannerContext';
import {getDefaultBlockHeight, RESOURCE_HEIGHTS} from './utils/planUtils';
import {BlockMode} from '../utils/enums';
import {BlockTypeProvider, InstanceStatus} from '@kapeta/ui-web-context';
import {BlockDefinition, BlockInstance, Resource} from '@kapeta/schemas';
import {IBlockTypeProvider} from "@kapeta/ui-web-types";
import {PlannerNodeSize} from "../types";

export interface PlannerBlockContextData {
    blockInstance: BlockInstance | null;
    blockDefinition?: BlockDefinition;
    blockReference: KapetaURI | null;
    configuration?: any;
    consumers: Resource[];
    providers: Resource[];
    instanceStatus: InstanceStatus;
    instanceBlockHeight: number;
    instanceBlockWidth: number;
    instanceResourceHeight: number;

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
    instanceBlockWidth: 150,
    instanceResourceHeight: 0,
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
    configuration?: any;
}

interface BlockSizeProps {
    nodeSize: PlannerNodeSize;
    blockType?: IBlockTypeProvider;
    blockMode?: BlockMode
    blockDefinition?: BlockDefinition;
}

export const calculateBlockHeights = (props: BlockSizeProps) => {
    const consumers = props.blockDefinition?.spec.consumers || [];
    const providers = props.blockDefinition?.spec.providers || [];

    const pendingConsumers = props.blockMode === BlockMode.HOVER_DROP_CONSUMER ? 1 : 0;
    const pendingProviders = props.blockMode === BlockMode.HOVER_DROP_PROVIDER ? 1 : 0;
    const resourceCount = Math.max(consumers.length + pendingConsumers, providers.length + pendingProviders);
    const instanceResourceHeight = RESOURCE_HEIGHTS[props.nodeSize] * resourceCount;
    const instanceBlockHeight = props.blockType?.getShapeHeight
        ? props.blockType.getShapeHeight(instanceResourceHeight)
        : getDefaultBlockHeight(instanceResourceHeight);

    return {
        instanceBlockHeight,
        instanceResourceHeight
    }
}
export const BlockContextProvider = (props: BlockProviderProps) => {
    const planner = useContext(PlannerContext);
    const [blockMode, setBlockMode] = useState(BlockMode.HIDDEN);

    const blockInstance = planner.plan?.spec.blocks?.find((block) => block.id === props.blockId) || null;
    const blockDefinition = planner.getBlockByRef(blockInstance?.block.ref || '');
    // Overrides from external sources, such as the sidebar
    const overrideMode = blockInstance && planner.assetState.getViewModeForBlock(blockInstance.id);
    const focusedMode = planner.focusedBlock?.id === props.blockId ? BlockMode.FOCUSED : undefined;
    const instanceStatus = planner.instanceStates[props.blockId] || InstanceStatus.STOPPED;
    const blockType = blockDefinition?.kind ? BlockTypeProvider.get(blockDefinition!.kind) : undefined;

    const value = useMemo(() => {
        // calculate Resource height
        const consumers = blockDefinition?.spec.consumers || [];
        const providers = blockDefinition?.spec.providers || [];

        const {
            instanceResourceHeight,
            instanceBlockHeight
        } = calculateBlockHeights({
            nodeSize: planner.nodeSize,
            blockType,
            blockMode,
            blockDefinition
        });

        const blockReference = blockInstance && parseKapetaUri(blockInstance?.block.ref);

        return {
            blockInstance,
            blockDefinition,
            blockReference,
            configuration: props.configuration,
            consumers,
            providers,
            instanceStatus,
            instanceBlockHeight,
            instanceBlockWidth: blockType?.shapeWidth || 150,
            instanceResourceHeight,
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
        props.configuration,
        blockType,
    ]);
    return <BlockContext.Provider value={value}>{props.children}</BlockContext.Provider>;
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
