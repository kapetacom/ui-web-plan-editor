import React from "react";
import { BlockConfig } from "@blockware/ui-web-types";
import {InstanceStatus} from "@blockware/ui-web-context";

import { PlannerToolboxPainterProps } from "./PlannerToolbox";
import {BlockNode} from "../../components/BlockNode";


export function PlannerToolboxBlock(props: PlannerToolboxPainterProps<BlockConfig>) {

    return (
        <svg width={120} height={120}>
            <BlockNode name={'Block'}
                valid={true}
                status={InstanceStatus.STOPPED}
                instanceName={props.item.title}
                version={'0.0.1'}
                variant={'new'}
                height={120}
                width={120}
                pointSize={20}
            />
        </svg>
    )
}