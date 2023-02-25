import { PlannerResourceModelWrapper } from './PlannerResourceModelWrapper';
import { DataWrapper, ItemType } from '@blockware/ui-web-types';

export interface SelectedResourceItem {
    resource: PlannerResourceModelWrapper;
    original: PlannerResourceModelWrapper;
}

export interface EditableItemInterface {
    type: ItemType;
    item: DataWrapper | any | undefined;
    creating: boolean;
}

export interface BlockConfigurationData {
    version: string;
    name: string;
    configuration?: { [key: string]: string };
}
