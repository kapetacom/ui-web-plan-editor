import { action, makeObservable, observable } from 'mobx';
import type { DataWrapper, ItemType } from '@kapeta/ui-web-types';

import { Planner } from '../Planner';
import { BlockMode } from '../../wrappers/wrapperHelpers';
import { PlannerBlockModelWrapper } from '../../wrappers/PlannerBlockModelWrapper';

/**
 * Helper class for handling inspecting blocks in the Planner UI
 */
export class InspectBlockPanelHelper {
    private planner: Planner;

    @observable
    public current?: PlannerBlockModelWrapper;

    constructor(planner: Planner) {
        this.planner = planner;
        makeObservable(this);
    }

    @action
    private reset() {
        if (this.current) {
            const item = this.current;
            item.setMode(BlockMode.HIDDEN);
        }
    }

    @action
    public show(item: DataWrapper | any | undefined, type: ItemType, creating?: boolean) {
        this.reset();

        item.setMode(BlockMode.HIGHLIGHT);

        this.current = item;

        this.open();
    }

    public open() {
        const blockInspectorPanel = this.planner.getBlockInspectorPanel();

        if (blockInspectorPanel) {
            blockInspectorPanel.open();
        }
    }

    onClosed = () => {
        this.reset();
    };
}
