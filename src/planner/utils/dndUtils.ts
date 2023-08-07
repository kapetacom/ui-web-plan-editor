import { createDragAndDrop } from '../DragAndDrop';
import { PlannerPayload } from '../types';
const MAX_ROTATION_DEG = 5;
/**
 * Define the Drag- and droppable payloads for the planner.
 * Will let the callbacks have the right signatures / completions.
 */
export const DragAndDrop = createDragAndDrop<PlannerPayload>();


/**
 * Calculate the rotation of a dragged element given the distance it's been moved on the X axis.;
 */
export const useDraggedRotation = (xDistance?:number) => {
    if (xDistance !== undefined && Math.abs(xDistance) > 10) {
        if (xDistance < 0) {
            // Moved left
            return MAX_ROTATION_DEG * (Math.max(-10, xDistance) / 10);
        }

        // Moved right
        return MAX_ROTATION_DEG * (Math.min(10, xDistance) / 10);
    }

    // Not moved enough
    return 0
}