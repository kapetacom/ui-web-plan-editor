import { PlannerModelReader } from '../../src/planner/PlannerModelReader';
import { BlockServiceMock } from './BlockServiceMock';
import { PlannerData } from './PlannerData';
import { PlannerModelWrapper } from '../../src';
import { Asset} from '@kapeta/ui-web-types';
import {BlockDefinition, Plan } from '@kapeta/schemas';

export function readPlan(): Promise<PlannerModelWrapper> {
    const reader = new PlannerModelReader(BlockServiceMock);
    try {
        return reader.load(PlannerData, 'kapeta/my-todo-system');
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to get mock plan', e);
        throw e;
    }
}

export async function readPlanV2(): Promise<{
    plan: Plan;
    blockAssets: Asset<BlockDefinition>[];
}> {
    for (const block of PlannerData.spec.blocks || []) {
        await BlockServiceMock.get(block.block.ref);
    }

    return {
        plan: PlannerData,
        blockAssets: await BlockServiceMock.list(),
    };
}
