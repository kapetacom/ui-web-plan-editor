import { initRenderer } from './RendererContext';

export enum BlockOutlet {
    BlockInstanceName = 'BlockInstanceName',
    BlockStatus = 'BlockStatus',
    BlockName = 'BlockName',
    BlockHandle = 'BlockHandle',
}

export const blockRenderer = initRenderer<{}, BlockOutlet>();
