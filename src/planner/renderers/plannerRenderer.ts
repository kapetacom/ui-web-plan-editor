/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { initRenderer } from './RendererContext';
import { ActionContext } from '../types';

export enum PlannerOutlet {
    ResourceTitle = 'ResourceTitle',
    ResourceSubTitle = 'ResourceSubTitle',
}

export const plannerRenderer = initRenderer<ActionContext, PlannerOutlet>();
