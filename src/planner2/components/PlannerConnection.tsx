import React, { useContext, useState } from 'react';
import { PlannerContext } from '../PlannerContext';
import { PlannerNodeSize } from '../../types';
import {
    calculatePathBetweenPoints,
    getCurveMainPoints,
    getMiddlePoint,
} from '../utils/connectionUtils';
import { BlockConnectionSpec } from '@kapeta/ui-web-types';
import { toClass } from '@kapeta/ui-web-utils';
import { getResourceId } from '../utils/planUtils';
import { PlannerAction } from '../types';
import { ActionButtons } from './ActionButtons';

export const PlannerConnection: React.FC<{
    connection: BlockConnectionSpec;
    // eslint-disable-next-line react/no-unused-prop-types
    size: PlannerNodeSize;
    className?: string;
    viewOnly?: boolean;
    actions?: PlannerAction<any>[];
}> = (props) => {
    const { connectionPoints } = useContext(PlannerContext);
    const [hasFocus, setHasFocus] = useState(false);

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
        return null;
    }

    let className = toClass({
        'planner-connection': true,
        // highlight: this.props.connection
        //     ? this.props.connection.editing
        //     : false,
        // invalid: !this.connectionValid,
    });

    if (props.className) {
        className += ` ${props.className}`;
    }

    const path = calculatePathBetweenPoints(from, to);
    const points = getCurveMainPoints(from, to);
    const middlePoint = getMiddlePoint(points);

    return (
        <svg style={{ position: 'absolute', zIndex: -1 }}>
            <g
                className={className.trim()}
                onMouseOver={() => setHasFocus(true)}
                onMouseOut={() => setHasFocus(false)}
            >
                <path className="background" d={path} />
                <path className="line" d={path} />

                {props.connection && middlePoint && props.actions && (
                    <ActionButtons
                        show={hasFocus}
                        x={middlePoint.x}
                        // TODO: how can we avoid the magic number?
                        y={middlePoint.y - 5}
                        actions={props.actions}
                        actionContext={{
                            connection: props.connection,
                        }}
                    />
                )}
            </g>
        </svg>
    );
};
