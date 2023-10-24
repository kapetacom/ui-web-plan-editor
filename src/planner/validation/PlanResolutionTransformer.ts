import { parseKapetaUri } from '@kapeta/nodejs-utils';
import { BlockDefinition, Plan } from '@kapeta/schemas';
import EventEmitter from 'events';
import _ from 'lodash';
import { AssetInfo } from '../../types';
import { ActionType, MissingReferenceResolution } from '../reference-resolver/types';
import { MissingReference, ReferenceType } from './PlanReferenceValidation';

export type PlanResolutionContext = {
    plan: Plan;
    blockAssets: AssetInfo<BlockDefinition>[];
};

export type PlanResolutionResult = {
    plan?: Plan;
    blockAssets: AssetInfo<BlockDefinition>[];
    errors: string[];
};

export type PlanResolutionOptions = {
    installAsset?: (ref: string) => Promise<void>;
    importAsset?: (ref: string) => Promise<void>;
};

export enum ResolutionStateType {
    IDLE,
    ACTIVE,
    DONE,
    ERROR,
}

export interface ResolutionState {
    reference: MissingReferenceResolution;
    state: ResolutionStateType;
    error?: string;
}

export class PlanResolutionTransformer extends EventEmitter {
    private readonly context: PlanResolutionContext;
    private readonly options?: PlanResolutionOptions;
    private readonly changedBlocks: AssetInfo<BlockDefinition>[] = [];
    private resolutionStates: ResolutionState[] = [];
    private changedPlan?: Plan;

    constructor(
        context: PlanResolutionContext,
        resolutions: MissingReferenceResolution[],
        opts?: PlanResolutionOptions
    ) {
        super();
        this.changedPlan = undefined;
        this.context = context;
        this.options = opts;
        this.resolutionStates = resolutions.map((referenceResolution) => {
            return {
                reference: referenceResolution,
                state: ResolutionStateType.IDLE,
            };
        });
    }

    public getResolutionStates() {
        return this.resolutionStates;
    }

    public async apply(): Promise<PlanResolutionResult> {
        const errors: string[] = [];

        const promises = this.resolutionStates.map(async ({ reference }) => {
            this.emitApplyStart(reference);
            try {
                await this.applyResolution(reference);
                this.emitApplyEnd(reference);
            } catch (e: any) {
                console.log('Error applying resolution', e);
                this.emitApplyError(reference, e.message);
                errors.push(e);
            }
        });

        await Promise.all(promises);

        console.log('applied', this.context, this.changedPlan, this.changedBlocks);

        return {
            plan: this.changedPlan,
            blockAssets: this.changedBlocks,
            errors,
        };
    }

    private async applyResolution(referenceResolution: MissingReferenceResolution) {
        switch (referenceResolution.resolution.action) {
            case ActionType.INSTALL:
                return this.install(referenceResolution.ref);

            case ActionType.SELECT_ALTERNATIVE_VERSION:
                // Replace this in the right context
                return this.replaceReference(referenceResolution, referenceResolution.resolution.value!);
            case ActionType.SELECT_ALTERNATIVE_TYPE:
                // Replace this in the right context
                return this.replaceReference(referenceResolution, referenceResolution.resolution.value!);

            case ActionType.SELECT_LOCAL_VERSION:
                // Import this from the path provided
                return this.importLocalVersion(referenceResolution.resolution.value!);

            case ActionType.REMOVE_BLOCK:
                // Remove block from plan
                return this.removeInstance(referenceResolution.instanceId!);
        }
    }

    private removeInstance(instanceId: string) {
        const tempPlan = this.getPlanForEditing();

        let anyRemoved = false;
        if (tempPlan.spec.blocks) {
            tempPlan.spec.blocks = tempPlan.spec.blocks.filter((block) => {
                const matchesId = block.id === instanceId;
                if (matchesId) {
                    anyRemoved = true;
                }
                return !matchesId;
            });
        }

        if (anyRemoved) {
            this.setChangedPlan(tempPlan);
        }
    }

    private replaceReference(referenceResolution: MissingReference, value: string) {
        const tempPlan = this.getPlanForEditing();
        const instance = tempPlan.spec.blocks?.find((block) => {
            return block.id === referenceResolution.instanceId;
        });

        if (!instance) {
            throw new Error('Instance not found');
        }

        if (referenceResolution.type === ReferenceType.BLOCK) {
            instance.block.ref = value;
            this.setChangedPlan(tempPlan);
            return;
        }

        const blockAsset = this.getBlockForEditing(instance.block.ref);

        if (!blockAsset) {
            throw new Error('Editable block not found');
        }

        const blockDef = blockAsset.content;

        switch (referenceResolution.type) {
            case ReferenceType.TARGET:
                blockDef.spec.target!.kind = value;
                this.addChangedBlock(blockAsset);
                break;
            case ReferenceType.KIND:
                blockDef.kind = value;
                this.addChangedBlock(blockAsset);
                break;
            case ReferenceType.CONSUMER:
            case ReferenceType.PROVIDER:
                const resourceList =
                    referenceResolution.type === ReferenceType.CONSUMER
                        ? blockDef.spec.consumers
                        : blockDef.spec.providers;

                const resource = resourceList?.find((resource) => {
                    return resource.metadata.name === referenceResolution.resourceName;
                });

                if (!resource) {
                    throw new Error('Resource not found');
                }
                resource.kind = value;
                this.addChangedBlock(blockAsset);
                break;
        }
    }

    private getPlanForEditing() {
        return this.changedPlan ?? _.cloneDeep(this.context.plan);
    }

    private setChangedPlan(plan: Plan) {
        if (!this.changedPlan) {
            this.changedPlan = plan;
        } else if (this.changedPlan !== plan) {
            throw new Error('Plan already changed');
        }
    }

    private getBlockForEditing(ref: string) {
        const blockUri = parseKapetaUri(ref);
        if (blockUri.version !== 'local') {
            return undefined;
        }

        let changedBlock = this.changedBlocks.find((blockAsset) => {
            return parseKapetaUri(blockAsset.ref).equals(blockUri);
        });

        if (changedBlock) {
            return changedBlock;
        }

        const blockAsset = this.context.blockAssets.find((blockAsset) => {
            return parseKapetaUri(blockAsset.ref).equals(blockUri);
        });

        if (!blockAsset) {
            return;
        }

        return _.cloneDeep(blockAsset);
    }

    private addChangedBlock(blockAsset: AssetInfo<BlockDefinition>) {
        if (!this.changedBlocks.includes(blockAsset)) {
            this.changedBlocks.push(blockAsset);
        }
    }

    private async importLocalVersion(kapetaYmlPath: string) {
        return this.options?.importAsset?.(kapetaYmlPath);
    }

    private async install(ref: string) {
        return this.options?.installAsset?.(ref);
    }

    public onApplyStart(listener: (reference: MissingReferenceResolution) => void) {
        this.on('apply-start', listener);
    }

    public onApplyEnd(listener: (reference: MissingReferenceResolution) => void) {
        this.on('apply-end', listener);
    }

    public onApplyError(listener: (reference: MissingReferenceResolution, error: string) => void) {
        this.on('apply-error', listener);
    }

    public onStateChange(listener: (states: ResolutionState[]) => void) {
        this.on('state-change', listener);
    }

    private emitApplyStart(reference: MissingReferenceResolution) {
        this.emit('apply-start', { reference });
        this.setState(reference, ResolutionStateType.ACTIVE);
    }

    private emitApplyEnd(reference: MissingReferenceResolution) {
        this.emit('apply-end', { reference });
        this.setState(reference, ResolutionStateType.DONE);
    }

    private emitApplyError(reference: MissingReferenceResolution, error: string) {
        this.emit('apply-error', { reference, error });
        this.setState(reference, ResolutionStateType.ERROR, error);
    }

    private setState(reference: MissingReferenceResolution, stateType: ResolutionStateType, error?: string) {
        this.resolutionStates = this.resolutionStates.map((state) => {
            if (state.reference === reference) {
                return {
                    reference,
                    state: stateType,
                    error,
                };
            }
            return state;
        });

        this.emit('state-change', this.resolutionStates);
    }
}
