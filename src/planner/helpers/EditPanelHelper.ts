import {action, makeObservable, observable, toJS} from "mobx";
import { DataWrapper, ItemType } from "@blockware/ui-web-types";

import {Planner} from "../Planner";
import {PlannerResourceModelWrapper} from "../../wrappers/PlannerResourceModelWrapper";
import {BlockMode, ResourceMode} from "../../wrappers/wrapperHelpers";
import {PlannerBlockModelWrapper} from "../../wrappers/PlannerBlockModelWrapper";
import {
    PlannerConnectionModelWrapper
} from "../../wrappers/PlannerConnectionModelWrapper";
import type {EditableItemInterface} from "../../wrappers/models";


/**
 * Helper class for handling editing items in the Planner UI
 */
export class EditPanelHelper {

    private planner:Planner;

    @observable
    public current?: EditableItemInterface;

    constructor(planner:Planner) {
        this.planner = planner;
        makeObservable(this);
    }

    @action
    private reset() {
        if (this.current) {
            const item = this.current.item;

            if (item instanceof PlannerResourceModelWrapper) {
                item.setMode(ResourceMode.HIDDEN);
            }

            if (item instanceof PlannerBlockModelWrapper) {
                item.setMode(BlockMode.HIDDEN);
            }

            if (item instanceof PlannerConnectionModelWrapper) {
                item.setEditing(false);
                item.toResource.setMode(ResourceMode.HIDDEN);
                item.fromResource.setMode(ResourceMode.HIDDEN);
            }
        }
    }

    @action
    public edit(item: DataWrapper | any | undefined, type: ItemType, creating?: boolean) {
        
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

        this.current = toJS({ item: item, type: type, creating: !!creating });

        this.open();
    }

    public open() {
        const itemEditorPanel = this.planner.getItemEditorPanel();
        const inspectConnectionPanel = this.planner.getInspectConnectionPanel();

        if (itemEditorPanel) {
            itemEditorPanel.open();
        }

        if (inspectConnectionPanel) {
            inspectConnectionPanel.close();
        }
    }

    onClosed = () => {
        this.reset();
    }

}