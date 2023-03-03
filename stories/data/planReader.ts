import { PlannerModelReader } from '../../src/planner/PlannerModelReader';
import { BlockServiceMock } from './BlockServiceMock';
import { PlannerData } from './PlannerData';
import { PlannerModelWrapper } from '../../src';

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
