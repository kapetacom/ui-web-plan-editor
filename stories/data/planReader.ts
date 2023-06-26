import { BlockServiceMock } from './BlockServiceMock';
import { PlannerData } from './PlannerData';
import { Asset } from '@kapeta/ui-web-types';
import { BlockDefinition, Plan } from '@kapeta/schemas';
import _ from 'lodash';

export async function readPlanV2(): Promise<{
    plan: Plan;
    blockAssets: Asset<BlockDefinition>[];
}> {
    for (const block of PlannerData.spec.blocks || []) {
        await BlockServiceMock.get(block.block.ref);
    }

    return {
        plan: _.cloneDeep(PlannerData),
        blockAssets: await BlockServiceMock.list(),
    };
}
