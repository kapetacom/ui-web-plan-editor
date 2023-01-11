import React from "react";
import {ResourceConfig} from "@blockware/ui-web-types";

import {PlannerToolboxPainterProps} from "./PlannerToolbox";
import BlockResource from "../../components/BlockResource";

export default function PlannerToolboxResource(props:PlannerToolboxPainterProps<ResourceConfig>) {

    return (
        <svg width={125} height={35}>
            <BlockResource
                type={props.item.data.type.toLowerCase()}
                height={35}
                width={150}
                name={props.item.title}
            />
        </svg>
    )
}