import {PlannerModelReader} from "../../src/planner/PlannerModelReader";
import {BlockServiceMock} from "./BlockServiceMock";
import {PlannerData} from './PlannerData';

export function readPlan() {

    const reader = new PlannerModelReader(BlockServiceMock);
    try {
        return reader.load(PlannerData, 'blockware/my-todo-system');
    } catch (e) {
        console.error('Failed to get mock plan', e);
    }
}