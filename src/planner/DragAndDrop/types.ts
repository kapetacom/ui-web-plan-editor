/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { Point } from '@kapeta/ui-web-types';

export interface DnDPayload<T = any> {
    type: string;
    data: T;
}

export interface DragEventInfo<T extends DnDPayload> {
    sourceDraggable: T;
    targetZone?: T;

    // Relative to the last drag event
    diff: Point;
    // Client relative coordinates
    client: {
        start: Point;
        end: Point;
        diff: Point;
    };
    zone: {
        start: Point;
        end: Point;
        diff: Point;
    };
}
