import { initRenderer } from './RendererContext';

export enum BlockOutlet {
    BlockName = 'BlockName',
    BlockInstanceName = 'BlockInstanceName',
    BlockStatus = 'BlockStatus',
}

export const blockRenderer = initRenderer<{}, BlockOutlet>();
