import { PlannerResourceModelWrapper } from './PlannerResourceModelWrapper';
import { ItemType } from '@kapeta/ui-web-types';

export interface DataWrapper<T = any> {

}

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
