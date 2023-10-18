import { BlockService } from './BlockServiceMock';
import { PlannerData } from './PlannerData';
import { BlockDefinition, Plan } from '@kapeta/schemas';
import _ from 'lodash';
import { AssetInfo, fromAsset } from '../../src';

export async function readPlanV2(): Promise<{
    plan: Plan;
    blockAssets: AssetInfo<BlockDefinition>[];
}> {
    for (const block of PlannerData.spec.blocks || []) {
        await BlockService.get(block.block.ref);
    }

    const blocks = await BlockService.list();

    return {
        plan: _.cloneDeep(PlannerData),
        blockAssets: blocks.map(fromAsset),
    };
}
