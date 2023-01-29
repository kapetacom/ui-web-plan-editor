import React from "react";
import {ButtonStyle} from "@blockware/ui-web-components";
import {toClass} from "@blockware/ui-web-utils";
import './SVGCircleButton.less'

interface Props {
    icon: string
    style: ButtonStyle
    className?:string
    x: number
    y: number
    onClick: (evt:MouseEvent) => void | Promise<void>
}

export const SVGCircleButton = (props: Props) => {

    const classNameObj:any = {
        'svg-circle-button':true,
        [props.style]: true
    };

    if (props.className) {
        classNameObj[props.className] = true;
    }

    const className = toClass(classNameObj)

    return (
        <foreignObject
            x={props.x}
            y={props.y}
            className={className}
            onClick={(evt:any) => { props.onClick(evt)}}>
            <div className={'container'}>
                <i className={props.icon} />
            </div>
        </foreignObject>
    );
}