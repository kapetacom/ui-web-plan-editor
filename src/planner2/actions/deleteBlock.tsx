import { PlannerAction } from '../types';
import { PlannerContextData } from '../PlannerContext';
import { PlannerBlockContextData } from '../BlockContext';

/**
 * Remove a block from plan
 */
export const deleteBlockAction: PlannerAction<any> = {
    enabled(
        planner: PlannerContextData,
        block: PlannerBlockContextData
    ): boolean {
        return true;
    },
    render() {
        return null;
    },
};
