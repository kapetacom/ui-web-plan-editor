import { toJS } from 'mobx';
import { DataWrapper, ItemType } from '@blockware/ui-web-types';

import { Planner } from '../Planner';
import { PlannerResourceModelWrapper } from '../../wrappers/PlannerResourceModelWrapper';
import { BlockMode, ResourceMode } from '../../wrappers/wrapperHelpers';
import { PlannerBlockModelWrapper } from '../../wrappers/PlannerBlockModelWrapper';
import { PlannerConnectionModelWrapper } from '../../wrappers/PlannerConnectionModelWrapper';

/**
 * Helper class for handling editing items in the Planner UI
 */
export class EditPanelHelper {
    private planner: Planner;

    constructor(planner: Planner) {
        this.planner = planner;
    }

    private reset() {
        this.planner.setEditingItem(undefined);
    }

    public edit(
        item: DataWrapper | any | undefined,
        type: ItemType,
        creating?: boolean
    ) {
        this.reset();

        if (item instanceof PlannerResourceModelWrapper) {
            item.setMode(ResourceMode.HIGHLIGHT);
        }

        if (item instanceof PlannerBlockModelWrapper) {
            item.setMode(BlockMode.HIGHLIGHT);
        }

        if (item instanceof PlannerConnectionModelWrapper) {
            item.setEditing(true);
            item.toResource.setMode(ResourceMode.HIGHLIGHT);
            item.fromResource.setMode(ResourceMode.HIGHLIGHT);
        }

        this.planner.setEditingItem(
            toJS({ item: item, type: type, creating: !!creating })
        );
    }

    public onClosed = () => {
        this.reset();
    };
}
