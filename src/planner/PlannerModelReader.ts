import {BlockStore} from "@blockware/ui-web-context";
import {BlockReference, BlockInstanceSpec, PlanKind, BlockKind} from "@blockware/ui-web-types";

import {PlannerModelWrapper} from "../wrappers/PlannerModelWrapper";
import {PlannerBlockModelWrapper} from "../wrappers/PlannerBlockModelWrapper";
import {PlannerConnectionModelWrapper} from "../wrappers/PlannerConnectionModelWrapper";
import Path from 'path';

function toReferenceId(block: BlockReference) {
    return block.ref;
}

export class PlannerModelReader {
    private readonly blockStore: BlockStore;

    constructor(blockStore:BlockStore) {
        this.blockStore = blockStore;
    }

    private resolveReference(blockRef:string, planRef:string):string {
        if (blockRef.startsWith('file://') &&
            planRef.startsWith('file://')) {
            return 'file://' + Path.resolve(Path.dirname(planRef.substring(7)), blockRef.substring(7));
        }
        return blockRef;
    }

    private async loadBlockDefinitions(blockInstances: BlockInstanceSpec[], plan:PlannerModelWrapper) {
        const definitions:{[key:string]:BlockKind} = {};

        for (let i = 0; i < blockInstances.length;i++) {
            const blockInstance = blockInstances[i];
            const refId = toReferenceId(blockInstance.block);   
            let blockDefinition = definitions[refId];
            if (!blockDefinition) {
                const blockRef = this.resolveReference(blockInstance.block.ref, plan.getRef());
                const asset:any = await this.blockStore.get(blockRef);
                           
                if(asset.data){
                    blockDefinition = asset.data;
                }else{
                    blockDefinition = asset;
                }
                
                if (!blockDefinition) {
                    throw new Error(`Block definition not available: ${refId}`);
                }
                definitions[refId] = blockDefinition;
            }

            plan.blocks.push(new PlannerBlockModelWrapper(blockInstance, blockDefinition, plan));
        }
    }

    async load(planKind:PlanKind, planRef: string):Promise<PlannerModelWrapper> {
        const out = new PlannerModelWrapper(planRef, planKind.metadata.name);

        if (planKind.spec.blocks) {
            await this.loadBlockDefinitions(planKind.spec.blocks, out);
        }

        if (planKind.spec.connections) {
            out.connections = planKind.spec.connections.map((data) =>
                PlannerConnectionModelWrapper.createFromData(data, out)
            );
        }

        return out;
    }
}