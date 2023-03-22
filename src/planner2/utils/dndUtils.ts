import { createDragAndDrop } from '../DragAndDrop';
import { PlannerPayload } from '../types';

/**
 * Define the Drag- and droppable payloads for the planner.
 * Will let the callbacks have the right signatures / completions.
 */
export const DragAndDrop = createDragAndDrop<PlannerPayload>();
