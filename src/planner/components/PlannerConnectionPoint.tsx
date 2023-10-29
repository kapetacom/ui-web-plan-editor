/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React, { useContext, useEffect } from 'react';
import { PlannerContext } from '../PlannerContext';
import { LayoutContext } from '../LayoutContext';

export const PlannerConnectionPoint: React.FC<{
    pointId: string;
}> = (props) => {
    const { pointId } = props;
    const { connectionPoints } = useContext(PlannerContext);
    const { offset } = useContext(LayoutContext);

    const addPoint = connectionPoints.addPoint;
    useEffect(() => {
        addPoint(pointId, {
            x: offset.x,
            y: offset.y,
        });
    }, [addPoint, offset.x, offset.y, pointId]);

    const removePoint = connectionPoints.removePoint;
    useEffect(() => () => removePoint(pointId), [removePoint, pointId]);

    // This thing is not really a visual thing
    return null;
};
