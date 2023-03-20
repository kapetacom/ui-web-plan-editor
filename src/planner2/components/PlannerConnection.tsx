import React, { useContext } from 'react';
import { PlannerContext } from '../PlannerContext';
import { PlannerNodeSize } from '../../types';
import { calculatePathBetweenPoints } from '../utils/connectionUtils';
import { BlockConnectionSpec } from '@blockware/ui-web-types';
import { toClass } from '@blockware/ui-web-utils';
import './PlannerConnection.less';
import { getResourceId } from '../utils/planUtils';

export const PlannerConnection: React.FC<{
    connection: BlockConnectionSpec;
    // eslint-disable-next-line react/no-unused-prop-types
    size: PlannerNodeSize;
    className?: string;
}> = (props) => {
    const { connectionPoints } = useContext(PlannerContext);

    const fromId = getResourceId(
        props.connection.from.blockId,
        props.connection.from.resourceName
    );
    const toId = getResourceId(
        props.connection.to.blockId,
        props.connection.to.resourceName
    );
    const from = connectionPoints.getPointById(fromId);
    const to = connectionPoints.getPointById(toId);
    if (!from || !to) {
        // TODO: Handle connection not found
        return null;
    }

    let className = toClass({
        'planner-connection-2': true,
        // highlight: this.props.connection
        //     ? this.props.connection.editing
        //     : false,
        // invalid: !this.connectionValid,
    });

    if (props.className) {
        className += ` ${props.className}`;
    }

    const path = calculatePathBetweenPoints(from, to);

    return (
        <svg>
            <g
                className={className.trim()}
                // onMouseOver={this.onMouseOver}
                // onMouseOut={this.onMouseOut}
            >
                <path className="background" d={path} />
                <path className="line" d={path} />

                {/* {this.props.connection && middlePoint && !this.props.viewOnly && ( */}
                {/*     <PlannerConnectionButtons */}
                {/*         connection={this.props.connection} */}
                {/*         open={this.buttonsVisible} */}
                {/*         x={middlePoint.x} */}
                {/*         y={middlePoint.y} */}
                {/*         onDelete={this.handleDeleteClick} */}
                {/*         onEdit={this.handleEditClick} */}
                {/*         onInspect={this.handleInspectClick} */}
                {/*     /> */}
                {/* )} */}
            </g>
        </svg>
    );
};
