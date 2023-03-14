import { PlannerModelReader } from '../../src/planner/PlannerModelReader';
import { BlockServiceMock } from './BlockServiceMock';
import { PlannerData } from './PlannerData';
import { PlannerModelWrapper } from '../../src';
import { Asset, BlockKind, PlanKind } from '@blockware/ui-web-types';

export function readPlan(): Promise<PlannerModelWrapper> {
    const reader = new PlannerModelReader(BlockServiceMock);
    try {
        return reader.load(PlannerData, 'blockware/my-todo-system');
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to get mock plan', e);
        throw e;
    }
}

export async function readPlanV2(): Promise<{
    plan: PlanKind;
    blockAssets: Asset<BlockKind>[];
}> {
    for (const block of PlannerData.spec.blocks || []) {
        await BlockServiceMock.get(block.block.ref);
    }

    return {
        plan: PlannerData,
        blockAssets: await BlockServiceMock.list(),
    };
}
