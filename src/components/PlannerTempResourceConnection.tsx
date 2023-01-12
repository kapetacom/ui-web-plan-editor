import React, { Component } from 'react';
import { observer } from "mobx-react";
import { Point } from "@blockware/ui-web-types";

import './PlannerBlockResourceListItem.less';

import { PlannerNodeSize } from "../types";

import {PlannerConnection} from "./PlannerConnection";
import {PlannerConnectionModelWrapper} from '../wrappers/PlannerConnectionModelWrapper';
import {SelectedResourceItem} from "../wrappers/models";


export interface PlannerTempResourceConnectionProps {
    size: PlannerNodeSize
    selectedResource: SelectedResourceItem;
}


@observer
export class PlannerTempResourceConnection extends Component<PlannerTempResourceConnectionProps> {

    constructor(props: PlannerTempResourceConnectionProps) {
        super(props);
    }

    private get resource() {
        return this.props.selectedResource.resource;
    }

    private get original() {
        return this.props.selectedResource.original;
    }

    //path for dragging resource 
    calculateTempPath( toPoint: Point) {
        const fromPoint: Point = this.original.getConnectionPoint(this.props.size);

        return PlannerConnectionModelWrapper.calculatePathBetweenPoints(fromPoint, toPoint);
    }

    render() {
        let path = null;
        if (this.resource.dimensions) {   
            const tempPoint ={
                x: this.resource.dimensions.left,
                y: this.resource.dimensions.top + (this.resource.dimensions.height / 2)
            };
            path = this.calculateTempPath(tempPoint);
        }

        return (
            <>
                {
                    path &&
                        <PlannerConnection path={path} size={this.props.size} />
                }
            </>
        )
    }
}
