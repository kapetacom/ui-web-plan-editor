import React, { useState } from "react";
import { createHexagonPath, Orientation } from "@blockware/ui-web-utils";
import { SVGText, SVGAutoSizeText } from "@blockware/ui-web-components";
import { InstanceStatus } from "@blockware/ui-web-context";

import './BlockNode.less';
import PlannerBlockWarningTag from "./PlannerBlockWarningTag";
import { Guid } from "guid-typescript";
import { Point } from "@blockware/ui-web-types";

interface BlockNodeProps {
    name: string
    typeName?: string
    instanceName: string
    version?: string
    height: number
    width: number
    status?: InstanceStatus
    pointSize?: number
    position?:Point
    valid?: boolean
    variant?: string
    blockRef?: (elm: SVGPathElement) => void
    onInstanceNameChange?: (newName: string) => void
}

export default function BlockNode(props: BlockNodeProps) {
    const maxWidth = props.width - 20;
    const typeFullName = props.typeName || 'unknown/unknown';
    const [typeHandle, typeName] = typeFullName.split('/');
    const [id] = useState(Guid.create().toString());
    function blockOrTypeName() {
        if (props.name === props.instanceName) {
            return typeFullName;
        }

        return props.name;
    }

    const variant = props.variant ? props.variant : 'service';
    const pointSize = props.pointSize ? props.pointSize : 30;
    const clipWidth = 4;
    const hexagonClipPath = "hex_clip"+id;
    const path = createHexagonPath(props.width, props.height, 5, Orientation.VERTICAL, pointSize);
    const clipPath = createHexagonPath(props.width+clipWidth , props.height+clipWidth , 5, Orientation.VERTICAL, pointSize)

    return (
        <>
            <clipPath id={hexagonClipPath} >
                <path x={20} d={clipPath} fill="transparent" />
            </clipPath>
  
            <g className={`block-node ${variant}`} clipPath={`url(#${hexagonClipPath})`} x={(props.position)?props.position.x:50}>
                <path className="block-body"
                    ref={props.blockRef}
                    d={path}
                />
                        <PlannerBlockWarningTag show={!props.valid} blockName={props.name} />

                {props.status &&
                    <circle className={"instance_" + props.status} r={4} cx={props.width * 0.75} cy={pointSize + 10} />
                }
                <SVGAutoSizeText className={'block-body-text instance-name'}
                    y={50}
                    x={props.width / 2}
                    lineHeight={24}
                    maxHeight={36}
                    maxWidth={maxWidth}
                    maxChars={15}
                    maxLines={2}
                    onChange={props.onInstanceNameChange}
                    value={props.instanceName} />

                <SVGAutoSizeText className={'block-body-text block-name'}
                    y={85}
                    x={props.width / 2}
                    lineHeight={12}
                    maxHeight={20}
                    maxChars={25}
                    maxLines={1}
                    maxWidth={maxWidth}
                    value={typeName} />

                <SVGAutoSizeText className={'block-body-text block-handle'}
                                 y={100}
                                 x={props.width / 2}
                                 lineHeight={10}
                                 maxHeight={20}
                                 maxChars={25}
                                 maxLines={1}
                                 maxWidth={maxWidth}
                                 value={typeHandle} />

                {props.version &&
                    <SVGText className={'block-body-text block-version'}
                        y={props.height - 24}
                        x={(props.width / 2) - 4}
                        maxWidth={maxWidth}
                        value={props.version} />
                }
            </g>
        </>
    )
}