import { initRenderer } from './RendererContext';
import { ActionContext } from '../types';

export enum PlannerOutlet {
    ResourceTitle = 'ResourceTitle',
    ResourceSubTitle = 'ResourceSubTitle',
}

export const plannerRenderer = initRenderer<ActionContext, PlannerOutlet>();
