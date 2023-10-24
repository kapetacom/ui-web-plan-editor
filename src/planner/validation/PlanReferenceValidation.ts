import { BlockDefinition, Plan } from '@kapeta/schemas';
import { BlockTypeProvider, BlockTargetProvider, ResourceTypeProvider } from '@kapeta/ui-web-context';
import { AssetInfo } from '../../types';
import { useEffect, useMemo } from 'react';
import { normalizeKapetaUri, parseKapetaUri } from '@kapeta/nodejs-utils';

export enum ReferenceType {
    BLOCK,
    KIND,
    TARGET,
    CONSUMER,
    PROVIDER,
}

export interface MissingReference {
    type: ReferenceType;
    ref: string;
    blockRef?: string;
    instanceId?: string;
    resourceName?: string;
    instanceTitle?: string;
    referenceTitle?: string;
}

export class ReferenceValidationError extends Error {
    constructor(message: string, public readonly missingReferences: MissingReference[]) {
        super(message);
    }
}

export interface ReferenceValidation {
    validate(): MissingReference[];
}

export class PlanReferenceValidation implements ReferenceValidation {
    private readonly plan: Plan;
    private blockAssets: AssetInfo<BlockDefinition>[];

    constructor(plan: Plan, blockAssets: AssetInfo<BlockDefinition>[]) {
        this.plan = plan;
        this.blockAssets = blockAssets;
    }

    public validate(): MissingReference[] {
        const out: MissingReference[] = [];
        const blockMap = new Map<string, AssetInfo<BlockDefinition>>();
        this.blockAssets.forEach((block) => {
            blockMap.set(normalizeKapetaUri(block.ref), block);
        });

        this.plan.spec.blocks?.forEach((instance) => {
            const blockRef = normalizeKapetaUri(instance.block.ref);
            const blockAsset = blockMap.get(blockRef);
            if (!blockAsset) {
                out.push({
                    type: ReferenceType.BLOCK,
                    ref: blockRef,
                    instanceId: instance.id,
                    instanceTitle: instance.name,
                });
                return;
            }

            const blockValidator = new BlockReferenceValidation(blockAsset);
            out.push(
                ...blockValidator.validate().map((data) => {
                    return {
                        ...data,
                        instanceId: instance.id,
                        instanceTitle: instance.name,
                        blockRef,
                    };
                })
            );
        });

        return out;
    }
}

export class BlockReferenceValidation implements ReferenceValidation {
    private readonly blockAsset: AssetInfo<BlockDefinition>;

    constructor(block: AssetInfo<BlockDefinition>) {
        this.blockAsset = block;
    }

    public validate(): MissingReference[] {
        const out: MissingReference[] = [];

        const block = this.blockAsset.content;

        const blockRef = normalizeKapetaUri(this.blockAsset.ref);

        if (!block.kind || !BlockTypeProvider.exists(block.kind)) {
            out.push({
                type: ReferenceType.KIND,
                ref: normalizeKapetaUri(block.kind),
                blockRef,
            });
        }

        if (block.spec?.target?.kind && !BlockTargetProvider.exists(block.spec.target.kind)) {
            out.push({
                type: ReferenceType.TARGET,
                ref: normalizeKapetaUri(block.spec.target.kind),
                blockRef,
            });
        }

        block.spec.consumers?.forEach((consumer) => {
            if (!ResourceTypeProvider.exists(consumer.kind)) {
                out.push({
                    type: ReferenceType.CONSUMER,
                    ref: normalizeKapetaUri(consumer.kind),
                    blockRef,
                    resourceName: consumer.metadata.name,
                    referenceTitle: consumer.metadata.name,
                });
            }
        });

        block.spec.providers?.forEach((provider) => {
            if (!ResourceTypeProvider.exists(provider.kind)) {
                out.push({
                    type: ReferenceType.PROVIDER,
                    ref: normalizeKapetaUri(provider.kind),
                    blockRef,
                    resourceName: provider.metadata.name,
                    referenceTitle: provider.metadata.name,
                });
            }
        });

        return out;
    }
}

export const usePlanValidation = (plan?: Plan, blockAssets?: AssetInfo<BlockDefinition>[]) => {
    return useMemo(() => {
        if (!plan) {
            return [];
        }
        const validation = new PlanReferenceValidation(plan, blockAssets ?? []);
        return validation.validate();
    }, [plan, blockAssets]);
};
