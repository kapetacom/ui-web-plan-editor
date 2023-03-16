import React, { useContext, useEffect } from 'react';
import { PlannerContext } from '../PlannerContext';
import { LayoutContext } from '../LayoutContext';

export const PlannerConnectionPoint: React.FC<{
    pointId: string;
}> = (props) => {
    const { pointId } = props;
    const { connectionPoints } = useContext(PlannerContext);
    const { offset } = useContext(LayoutContext);

    useEffect(() => {
        connectionPoints.addPoint(pointId, {
            x: offset.x,
            y: offset.y,
        });
    }, [connectionPoints, offset.x, offset.y, pointId]);

    // This thing is not really a visual thing
    return null;
};
