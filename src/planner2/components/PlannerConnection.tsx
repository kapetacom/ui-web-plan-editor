import React, { useContext, useState } from 'react';
import { PlannerContext } from '../PlannerContext';
import { PlannerNodeSize } from '../../types';
import { calculatePathBetweenPoints, getCurveMainPoints, getMiddlePoint } from '../utils/connectionUtils';
import { BlockConnectionSpec, ResourceRole } from '@kapeta/ui-web-types';
import { toClass } from '@kapeta/ui-web-utils';
import { getResourceId } from '../utils/planUtils';
import { PlannerAction } from '../types';
import { ActionButtons } from './ActionButtons';
import { ResourceTypeProvider } from '@kapeta/ui-web-context';

export const PlannerConnection: React.FC<{
    connection: BlockConnectionSpec;
    // eslint-disable-next-line react/no-unused-prop-types
    size: PlannerNodeSize;
    className?: string;
    // eslint-disable-next-line react/no-unused-prop-types
    viewOnly?: boolean;
    actions?: PlannerAction<any>[];
}> = (props) => {
    const planner = useContext(PlannerContext);
    const [hasFocus, setHasFocus] = useState(false);

    const fromId = getResourceId(
        props.connection.from.blockId,
        props.connection.from.resourceName,
        ResourceRole.PROVIDES
    );
    const toId = getResourceId(props.connection.to.blockId, props.connection.to.resourceName, ResourceRole.CONSUMES);
    const from = planner.connectionPoints.getPointById(fromId);
    const to = planner.connectionPoints.getPointById(toId);

    if (!from || !to) {
        // Where can we render this error if there is no destination?
        return null;
    }

    const fromResource = planner.getResourceByBlockIdAndName(
        props.connection.from.blockId,
        props.connection.from.resourceName,
        ResourceRole.PROVIDES
    );
    const toResource = planner.getResourceByBlockIdAndName(
        props.connection.to.blockId,
        props.connection.to.resourceName,
        ResourceRole.CONSUMES
    );
    const fromEntities = planner.getBlockById(props.connection.from.blockId)?.spec.entities?.types || [];
    const toEntities = planner.getBlockById(props.connection.to.blockId)?.spec.entities?.types || [];

    let connectionValid = true;
    if (fromResource && toResource) {
        try {
            const converter = ResourceTypeProvider.getConverterFor(fromResource.kind, toResource.kind);
            if (converter) {
                const errors = converter.validateMapping
                    ? converter.validateMapping(props.connection, fromResource, toResource, fromEntities, toEntities)
                    : [];
                connectionValid = errors.length === 0;
            }
        } catch (e) {
            // Ignore in case the resource types are not loaded or the converter is not found
            // eslint-disable-next-line no-console
            console.error('Connection cannot render.', e);
        }
    }

    let className = toClass({
        'planner-connection': true,
        // highlight: this.props.connection
        //     ? this.props.connection.editing
        //     : false,
        invalid: !connectionValid,
    });

    if (props.className) {
        className += ` ${props.className}`;
    }

    const path = calculatePathBetweenPoints(from, to);
    const points = getCurveMainPoints(from, to);
    const middlePoint = getMiddlePoint(points);

    return (
        <svg style={{ position: 'absolute', zIndex: -1 }}>
            <g className={className.trim()} onMouseOver={() => setHasFocus(true)} onMouseOut={() => setHasFocus(false)}>
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
