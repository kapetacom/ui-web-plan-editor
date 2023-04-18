import React, { useContext } from 'react';

import { ResourceRole } from '@kapeta/ui-web-types';
import { toClass } from '@kapeta/ui-web-utils';

import { PlannerBlockResourceListItem } from './PlannerBlockResourceListItem';
import { PlannerContext } from '../PlannerContext';
import { useBlockContext } from '../BlockContext';
import { BlockMode, ResourceMode } from '../../wrappers/wrapperHelpers';
import { resourceHeight } from '../utils/planUtils';
import { SVGLayoutNode } from '../LayoutContext';
import { DnDContext } from '../DragAndDrop/DnDContext';
import { ActionContext, PlannerAction, PlannerPayload } from '../types';

export interface PlannerBlockResourceListProps {
    role: ResourceRole;
    actions: PlannerAction<any>[];
    onResourceMouseEnter?: (context: ActionContext) => void;
    onResourceMouseLeave?: (context: ActionContext) => void;
}

export const PlannerBlockResourceList: React.FC<PlannerBlockResourceListProps> = (props) => {
    const planner = useContext(PlannerContext);
    const { blockInstance, providers, consumers, blockMode } = useBlockContext();
    const { draggable } = useContext(DnDContext);

    const list = {
        [ResourceRole.CONSUMES]: consumers,
        [ResourceRole.PROVIDES]: providers,
    }[props.role];

    // Can we move layout stuff to its own helpers?
    const offsetX = 1;
    const placeholderWidth = 4;
    const placeholderX =
        props.role === ResourceRole.PROVIDES ? blockInstance.dimensions!.width + offsetX : -placeholderWidth;

    // Enable SHOW mode if the whole block is in SHOW mode
    const mode =
        blockMode === BlockMode.SHOW || blockMode === BlockMode.FOCUSED ? ResourceMode.SHOW : ResourceMode.HIDDEN;

    const showPlaceholder = () => {
        const payload = draggable as PlannerPayload | null;
        if (!payload) {
            return false;
        }
        const rightTypeAndRole =
            (payload.type === 'resource' && payload.data.role === props.role) ||
            (payload.type === 'resource-type' && payload.data.config.role === props.role);
        return (
            rightTypeAndRole &&
            (blockMode === BlockMode.HOVER_DROP_CONSUMER || blockMode === BlockMode.HOVER_DROP_PROVIDER)
        );
    };

    const plannerResourceListClass = toClass({
        'planner-resource-list': true,
        show: showPlaceholder(),
        [props.role.toLowerCase()]: true,
    });

    // Offset for the top of the hexagon, plus centering if there is only 1
    const hexagonTopHeight = 35 + 2;
    const resourceCount = list.length + (showPlaceholder() ? 1 : 0);
    const yPosition = resourceCount === 1 ? hexagonTopHeight + resourceHeight[planner.nodeSize] / 2 : hexagonTopHeight;
    const placeholderHeight = list.length * resourceHeight[planner.nodeSize];

    return (
        <SVGLayoutNode className={plannerResourceListClass} overflow="visible" x={0} y={yPosition}>
            {list.map((resource, index: number) => {
                return (
                    <PlannerBlockResourceListItem
                        size={planner.nodeSize}
                        key={`${blockInstance.id}_${resource.metadata.name}_${index}`}
                        index={index}
                        resource={resource}
                        // Should we render a consumer or provider?
                        role={props.role}
                        // Default to hidden unless the block has focus or the planner has a drag in progress
                        mode={mode}
                        // If hovering should trigger a different state, put it here
                        // show_options unless viewOnly or we're dragging
                        hoverMode={ResourceMode.SHOW_OPTIONS}
                        actions={props.actions}
                        onMouseEnter={props.onResourceMouseEnter}
                        onMouseLeave={props.onResourceMouseLeave}
                    />
                );
            })}

            {/* Blinking "ghost" target when we're about to create a new connection */}
            <svg className="resource-placeholder" x={placeholderX} y={placeholderHeight}>
                <rect height={resourceHeight[planner.nodeSize] - 4} width={placeholderWidth - offsetX} />
            </svg>
        </SVGLayoutNode>
    );
};
