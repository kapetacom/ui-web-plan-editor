import React, { useContext } from 'react';

import { ResourceRole } from '@blockware/ui-web-types';
import { toClass } from '@blockware/ui-web-utils';

import { PlannerBlockResourceListItem } from './PlannerBlockResourceListItem';
import { PlannerNodeSize } from '../../types';
import { PlannerContext } from '../PlannerContext';
import { useBlockContext } from '../BlockContext';
import { BlockMode, ResourceMode } from '../../wrappers/wrapperHelpers';
import { resourceHeight } from '../utils/planUtils';

export interface PlannerBlockResourceListProps {
    role: ResourceRole;
}

export const PlannerBlockResourceList: React.FC<
    PlannerBlockResourceListProps
> = (props) => {
    const { size } = useContext(PlannerContext);
    const {
        blockInstance,
        providers,
        consumers,
        instanceBlockHeight,
        blockMode,
    } = useBlockContext();

    const list = {
        [ResourceRole.CONSUMES]: consumers,
        [ResourceRole.PROVIDES]: providers,
    }[props.role];

    // Can we move layout stuff to its own helpers?
    const nodeSize = size !== undefined ? size : PlannerNodeSize.FULL;
    const offsetX = 1;
    const placeholderWidth = 4;
    const placeholderX =
        props.role === ResourceRole.PROVIDES
            ? blockInstance.dimensions!.width + offsetX
            : -placeholderWidth;

    const totalHeight = list.length * resourceHeight[size];
    const yPosition = (instanceBlockHeight - totalHeight) / 2 + 2;

    // Enable SHOW mode if the whole block is in SHOW mode
    const mode =
        blockMode === BlockMode.SHOW ? ResourceMode.SHOW : ResourceMode.HIDDEN;

    const showPlaceholder = () => {
        // TODO: showPlaceholder if we're dragging a compatible resource
        return false;
    };

    const plannerResourceListClass = toClass({
        'planner-resource-list': true,
        show: showPlaceholder(),
        [props.role.toLowerCase()]: true,
    });

    return (
        <svg
            className={plannerResourceListClass}
            overflow="visible"
            x={0}
            y={yPosition}
        >
            {list.map((resource, index: number) => {
                return (
                    <PlannerBlockResourceListItem
                        size={nodeSize}
                        key={`${resource.metadata.name}_${index}`}
                        index={index}
                        resource={resource}
                        // Should we render a consumer or provider?
                        role={props.role}
                        // Default to hidden unless the block has focus or the planner has a drag in progress
                        mode={mode}
                        // If hovering should trigger a different state, put it here
                        // show_options unless viewOnly or we're dragging
                        hoverMode={ResourceMode.SHOW_OPTIONS}
                    />
                );
            })}

            {/* Blinking "ghost" target when we're about to create a new connection */}
            <svg
                className="resource-placeholder"
                x={placeholderX}
                y={totalHeight}
            >
                <rect
                    height={resourceHeight[size] - 4}
                    width={placeholderWidth - offsetX}
                />
            </svg>
        </svg>
    );
};
