import React from 'react';
import {PlannerConnectionModelWrapper} from "../wrappers/PlannerConnectionModelWrapper";

import { BlockConnectionSpec, DataWrapper, ItemType, Point } from "@blockware/ui-web-types";
import { toClass } from "@blockware/ui-web-utils";
import {DialogControl, DialogTypes, showToasty, ToastType} from '@blockware/ui-web-components';

import { PlannerNodeSize } from '../types';

import './PlannerConnection.less';
import { observer } from "mobx-react";
import {PlannerConnectionButtons} from "./PlannerConnectionButtons";
import {PlannerBlockModelWrapper} from "../wrappers/PlannerBlockModelWrapper";

interface PlannerConnectionProps {
    size: PlannerNodeSize;
    className?:string
    connection?: PlannerConnectionModelWrapper;
    path?: string | null;
    readOnly?: boolean;
    viewOnly?: boolean;
    onFocus?: () => void;
    focusBlock?:PlannerBlockModelWrapper;
    onDelete?: (connection: PlannerConnectionModelWrapper) => void;
    setItemToEdit?: (res: DataWrapper<BlockConnectionSpec>, type: ItemType, block?: PlannerBlockModelWrapper) => void;
    handleInspectClick?: (connection: PlannerConnectionModelWrapper) => void;
}

interface PlannerConnectionState {
    over: boolean,
}

@observer
export class PlannerConnection extends React.Component<PlannerConnectionProps, PlannerConnectionState> {

    constructor(props: any) {
        super(props);

        const show = (this.props.connection && !this.props.connection.isValid()) ? true : false
        this.state = {
            over: show
        };
    }

    onMouseOver = () => {
        this.setState({ over: true });
        if (this.props.onFocus) {
            this.props.onFocus();
        }
    };

    onMouseOut = () => {
        const show = (this.props.connection && this.props.connection.isValid() === false) ? true : false;
        this.setState({ over: show });
    };


    handleEditClick = () => {
        if (this.props.setItemToEdit &&
            this.props.connection) {
            this.props.setItemToEdit(this.props.connection, ItemType.CONNECTION);
        }
    };

    handleDeleteClick = () => {
        if (this.props.onDelete &&
            this.props.connection) {
            DialogControl.show("Delete connection?", "from " + this.props.connection.from.resourceName + " to " + this.props.connection.to.resourceName, () => {
                if (this.props.onDelete &&
                    this.props.connection) {
                    this.props.onDelete(this.props.connection);
                    showToasty({
                        type: ToastType.SUCCESS,
                        title: 'Connection deleted',
                        message: `Connection between ${this.props.connection.from.resourceName} and ${this.props.connection.to.resourceName} has been deleted.`
                    })
                }
            }, DialogTypes.DELETE)
        }
    };

    handleInspectClick = () => {
        if (this.props.connection && this.props.handleInspectClick) {
            this.props.handleInspectClick(this.props.connection);
        }
    };

    getMiddlePoint(list: Point[]) {
        //don't calculate it if the list is empty, to avoid setting the initial value to 0,0
        if(list.length<=0){
            return;
        }
        let sumX = 0;
        let sumY = 0;        
        list.forEach((point) => {
            sumX += point.x;
            sumY += point.y;
        });
        return {
            x: sumX / list.length - 15,
            y: sumY / list.length
        }
    }

    render() {

        let path = null;
        let middlePoint: Point | undefined = undefined;

        if (this.props.path) {
            path = this.props.path;
        } else if (this.props.connection) {
            path = this.props.connection.calculatePath(this.props.size);
            middlePoint = this.getMiddlePoint(this.props.connection.getPoints(this.props.size))
        } else {
            throw new Error('Either "path" or "connection" property needs to be set with valid value');
        }

        let className = toClass({
            'planner-connection': true,
            'highlight': this.props.connection ? this.props.connection.editing : false,
            'invalid': !!(this.props.connection && !this.props.connection.isValid())
        });

        if (this.props.className) {
            className += ' ' + this.props.className;
        }

        
        return (
            <>
                <g className={className.trim()}
                    onMouseOver={this.onMouseOver}
                    onMouseOut={this.onMouseOut} >

                    <path className={'background'} d={path} />
                    <path className={'line'}
                        d={path} />

                    {this.props.connection &&
                        middlePoint &&
                        !this.props.viewOnly &&
                        <PlannerConnectionButtons
                            connection={this.props.connection}
                            open={this.state.over}
                            readOnly={this.props.readOnly}
                            x={middlePoint.x}
                            y={middlePoint.y}
                            onDelete={this.handleDeleteClick}
                            onEdit={this.handleEditClick}
                            onInspect={this.handleInspectClick}
                        />
                    }
                </g>
            </>
        )
    }

}

