import React from "react";
import {toClass, createHexagonPath, Orientation} from "@blockware/ui-web-utils";

import {SVGText} from "@blockware/ui-web-components";
import {ResourceRole} from "@blockware/ui-web-types";

import {PlannerNodeSize } from "../types";
import './BlockResource.less';

interface PlannerResourceProps {
    size?: PlannerNodeSize;
    role?: ResourceRole;
    type:string
    typeName?:string
    name:string
    height: number
    width: number
    readOnly?:boolean

}

export function BlockResource(props:PlannerResourceProps) {

    const nodeSize = props.size !== undefined ? props.size : PlannerNodeSize.MEDIUM;
    const isSmall = nodeSize === PlannerNodeSize.SMALL;
    const consumer = props.role === ResourceRole.CONSUMES;
    const textX = consumer ? 12 : 20;
    const hexagonPath = createHexagonPath(props.width, props.height, 2, Orientation.HORIZONTAL, 7);

    const resourceClass = toClass({
        'block-resource': true,
        [props.type]: true,
        'read-only': !!props.readOnly
    });

    const maxTextWidth = props.width - 50;


    return (
        <g className={resourceClass} >

            <path className={'block-resource-body'} d={hexagonPath} />

            <SVGText className={'block-resource-text'}
                  maxWidth={maxTextWidth}
                  y={isSmall ? 17 : 14}
                  x={textX}
                  value={props.name} />

            <SVGText className={'block-resource-text sub'}
                  maxWidth={maxTextWidth}
                  y={props.height - 8}
                  x={textX}
                  value={props.typeName || props.type}/>
        </g>
    )
}