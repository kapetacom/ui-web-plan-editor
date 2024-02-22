/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { BlockService } from './BlockServiceMock';
import { ValidPlannerData, InvalidPlannerData, WonkyConnectionPlannerData } from './PlannerData';
import { BlockDefinition, Plan } from '@kapeta/schemas';
import _ from 'lodash';
import { AssetInfo, fromAsset } from '../../src';

export async function readPlanV2(): Promise<{
    plan: Plan;
    blockAssets: AssetInfo<BlockDefinition>[];
}> {
    for (const block of ValidPlannerData.spec.blocks || []) {
        await BlockService.get(block.block.ref);
    }

    const blocks = await BlockService.list();

    return {
        plan: _.cloneDeep(ValidPlannerData),
        blockAssets: blocks.map(fromAsset),
    };
}

export async function readInvalidPlan(): Promise<{
    plan: Plan;
    blockAssets: AssetInfo<BlockDefinition>[];
}> {
    const blocks = await BlockService.list();

    return {
        plan: _.cloneDeep(InvalidPlannerData),
        blockAssets: blocks.map(fromAsset),
    };
}

export async function readWonkyPlan(): Promise<{
    plan: Plan;
    blockAssets: AssetInfo<BlockDefinition>[];
}> {
    const blocks = await BlockService.list();

    return {
        plan: _.cloneDeep(WonkyConnectionPlannerData),
        blockAssets: blocks.map(fromAsset),
    };
}
