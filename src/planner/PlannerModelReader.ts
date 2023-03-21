import { BlockStore } from '@kapeta/ui-web-context';
import {
    BlockReference,
    BlockInstanceSpec,
    PlanKind,
    BlockKind,
} from '@kapeta/ui-web-types';

import { PlannerModelWrapper } from '../wrappers/PlannerModelWrapper';
import { PlannerBlockModelWrapper } from '../wrappers/PlannerBlockModelWrapper';
import { PlannerConnectionModelWrapper } from '../wrappers/PlannerConnectionModelWrapper';
import Path from 'path';
import { runInAction } from 'mobx';

function toReferenceId(block: BlockReference) {
    return block.ref;
}

export class PlannerModelReader {
    private readonly blockStore: BlockStore;

    constructor(blockStore: BlockStore) {
        this.blockStore = blockStore;
    }

    private resolveReference(blockRef: string, planRef: string): string {
        if (blockRef.startsWith('file://') && planRef.startsWith('file://')) {
            return `file://${Path.resolve(
                Path.dirname(planRef.substring(7)),
                blockRef.substring(7)
            )}`;
        }
        return blockRef;
    }

    private async loadBlockDefinitions(
        blockInstances: BlockInstanceSpec[],
        plan: PlannerModelWrapper
    ) {
        const definitions: { [key: string]: BlockKind } = {};

        for (let i = 0; i < blockInstances.length; i++) {
            const blockInstance = blockInstances[i];
            const refId = toReferenceId(blockInstance.block);
            let blockDefinition = definitions[refId];
            if (!blockDefinition) {
                try {
                    const blockRef = this.resolveReference(
                        blockInstance.block.ref,
                        plan.getRef()
                    );

                    const asset: any = await this.blockStore.get(blockRef);
                    if (asset.error) {
                        // eslint-disable-next-line no-console
                        console.error(asset.error);
                        continue;
                    }

                    if (asset.data) {
                        blockDefinition = asset.data;
                    } else {
                        blockDefinition = asset;
                    }

                    if (!blockDefinition) {
                        // eslint-disable-next-line no-console
                        console.error(
                            `Block definition not available: ${refId}`
                        );
                        continue;
                    }
                    definitions[refId] = blockDefinition;
                } catch (e) {
                    // eslint-disable-next-line no-console
                    console.error(e);
                    continue;
                }
            }

            runInAction(() => {
                plan.blocks.push(
                    new PlannerBlockModelWrapper(
                        blockInstance,
                        blockDefinition,
                        plan
                    )
                );
            });
        }
    }

    async load(
        planKind: PlanKind,
        planRef: string
    ): Promise<PlannerModelWrapper> {
        const out = runInAction(
            () => new PlannerModelWrapper(planRef, planKind.metadata.name)
        );
        if (planKind.spec.blocks) {
            await this.loadBlockDefinitions(planKind.spec.blocks, out);
        }

        if (planKind.spec.connections) {
            runInAction(() => {
                out.connections = [];
                if (planKind.spec.connections) {
                    const connections = [...planKind.spec.connections];
                    connections.forEach((data) => {
                        try {
                            out.connections.push(
                                PlannerConnectionModelWrapper.createFromData(
                                    data,
                                    out
                                )
                            );
                        } catch (e) {
                            // Ignore and remove connections
                            if (planKind.spec.connections) {
                                const ix =
                                    planKind.spec.connections.indexOf(data);
                                if (ix > -1) {
                                    planKind.spec.connections.splice(ix, 1);
                                }
                            }
                        }
                    });
                }
            });
        }

        return out;
    }
}
