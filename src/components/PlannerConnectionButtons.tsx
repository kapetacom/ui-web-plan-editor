import React from 'react';

import { toClass } from "@blockware/ui-web-utils";
import { SVGButtonEdit, SVGButtonDelete, SVGButtonWarning, SVGButtonInspect } from "@blockware/ui-web-components";
import { ResourceTypeProvider } from "@blockware/ui-web-context";

import './PlannerConnectionButtons.less';
import {PlannerConnectionModelWrapper} from "../wrappers/PlannerConnectionModelWrapper";

function makeButtonBg(x:number, y:number, height:number, lineLength:number) {

    const size = 18;

    if (height > 0) {
        height += 5; //More padding
    }

    return `M ${x},${y}
            q 0,${height} ${size},${height}
            l ${lineLength},0
            q ${size},0 ${size},-${height}
            q 0,-${height} ${-size},-${height}
            l -${lineLength},0
            q -${size},0 -${size},${height}
            m ${(lineLength + (size*2)).toFixed()},0`;
}

let ID_IX = 1;

interface PlannerConnectionButtonsProps {
    connection: PlannerConnectionModelWrapper
    open: boolean,
    x:number,
    y:number,
    readOnly?: boolean;
    onEdit: () => void,
    onDelete: () => void,
    onInspect:()=> void
}

interface PlannerConnectionButtonsPropsState {
    over: boolean
}

export class PlannerConnectionButtons extends React.Component<PlannerConnectionButtonsProps, PlannerConnectionButtonsPropsState> {

    private ix:number = ID_IX++;

    constructor(props: any) {
        super(props);

        this.state = {
            over: false
        };
    }

    onMouseOver = () => {
        this.setState({over:true});
    };

    onMouseOut = () => {
        this.setState({over:false});
    };

    render() {

        let editX = 5,
            inspectX = 35,
            deleteX = 65,
            warningX = 2,
            warningY = -14;
        let clipHeight = 12;
        let buttonHeight = 12;
        let length = this.state.over ? 60 : 0;
        let x = this.state.over ? -30 : 0;

        const clipId = `planner_connection_buttons_${this.ix}`;

        let hasMapping = true,
            hasInspector = true;

        const converter = ResourceTypeProvider.getConverterFor(
            this.props.connection.fromResource.getKind(),
            this.props.connection.toResource.getKind()
        );

        if (!converter || !converter.mappingComponentType) {
            hasMapping = false;
        }

        if (!converter || !converter.inspectComponentType) {
            hasInspector = false;
        }

        if (!hasMapping) {
            inspectX -= 30;
            deleteX -= 30;
            if (this.state.over){
                length -= 30;
                x += 15;
            }

        }

        if (!hasInspector) {
            deleteX -= 30;
            if (this.state.over){
                length -= 30;
                x += 15;
            }
        }

        if (this.state.over) {
            warningX = 5;
        }

        const bgPath = makeButtonBg(x, 0, this.props.open ? clipHeight +2 : 0, length);
        const bgPathClip = makeButtonBg(x, 0, this.props.open ? clipHeight : 0, length);

        const showEditBtn =
            !this.props.connection.isValid() || hasMapping;

        const showInspect = hasInspector;

        const showDelete = !this.props.readOnly;

        if (!showDelete &&
            !showEditBtn &&
            !showInspect) {
            return <></>
        }

        return (
            <g className={'buttons'} >
                <g className={toClass({
                        'planner-connection-buttons': true,
                        'over': this.state.over,
                        'open': this.props.open || !this.props.connection.isValid(),
                        'no-inspect': !hasInspector,
                        'no-mapping': !hasMapping
                    })}
                    transform={`translate(${this.props.x},${this.props.y})`}
                    onMouseOver={this.onMouseOver}
                    onMouseOut={this.onMouseOut} >

                    <path className={'border'} d={bgPath} />

                    <clipPath id={clipId}>
                        <path className={'background'} d={bgPathClip} />
                    </clipPath>

                    <svg clipPath={`url(#${clipId})`} >
                        {!this.props.connection.isValid() &&
                            <SVGButtonWarning x={warningX} y={warningY} onClick={this.props.onEdit} />
                        }
                        {hasMapping && this.props.connection.isValid() &&
                            <SVGButtonEdit x={editX} y={-buttonHeight} onClick={this.props.onEdit} />
                        }

                        {showInspect &&
                            <SVGButtonInspect x={inspectX} y={-buttonHeight} onClick={this.props.onInspect} />
                        }

                        {showDelete &&
                            <SVGButtonDelete x={deleteX} y={-buttonHeight} onClick={this.props.onDelete} />
                        }
                    </svg>
                </g>
            </g>
        );
    }
}

