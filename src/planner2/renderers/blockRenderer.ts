import { BlockDefinition, BlockInstance } from '@kapeta/schemas';
import { initRenderer } from './RendererContext';
import { InstanceStatus } from '@kapeta/ui-web-context';

export enum BlockOutlet {
    BlockInstanceName = 'BlockInstanceName',
    BlockStatus = 'BlockStatus',
    BlockName = 'BlockName',
    BlockHandle = 'BlockHandle',
    BlockVersion = 'BlockVersion',
}

export const blockRenderer = initRenderer<
    {
        block: BlockDefinition;
        instance: BlockInstance;
        height: number;
        width: number;
        status?: InstanceStatus;
        valid?: boolean;
        readOnly?: boolean;
    },
    BlockOutlet
>();
