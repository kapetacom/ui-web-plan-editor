import React, { useContext, useEffect, useMemo } from 'react';
import { PlannerContext } from './PlannerContext';
import { DragAndDrop } from './utils/dndUtils';
import { useBoundingBox } from './hooks/boundingBox';
import { calculateCanvasSize } from './utils/planUtils';
import { toClass } from '@kapeta/ui-web-utils';
import { PositionDiff } from './DragAndDrop/types';
import { BlockInstanceSpec } from '@kapeta/ui-web-types';
import { ZoomButtons } from '../components/ZoomButtons';

import { ZOOM_STEP_SIZE } from './types';
import { PlannerMode } from '../wrappers/PlannerModelWrapper';
import { FocusTopbar } from './components/FocusTopbar';

const blockPositionUpdater = (diff: PositionDiff, zoom: number) => (block: BlockInstanceSpec) => {
    return {
        ...block,
        dimensions: {
            ...block.dimensions!,
            top: block.dimensions!.top + diff.y / zoom,
            left: block.dimensions!.left + diff.x / zoom,
        },
    };
};

export const PlannerCanvas: React.FC<React.PropsWithChildren> = (props) => {
    const planner = useContext(PlannerContext);
    const { isDragging } = useContext(DragAndDrop.Context);

    const classNames = toClass({
        'read-only': planner.mode === PlannerMode.VIEW,
        dragging: isDragging,
    });

    const { value: boundingBox, onRef } = useBoundingBox();
    const canvasSize = useMemo(() => {
        return calculateCanvasSize(planner.plan?.spec.blocks || [], planner.blockAssets, planner.nodeSize, {
            height: boundingBox.height,
            width: boundingBox.width,
        });
    }, [planner.plan?.spec.blocks, planner.blockAssets, planner.nodeSize, boundingBox.width, boundingBox.height]);

    useEffect(() => {
        planner.setCanvasSize(canvasSize);
    }, [planner, canvasSize]);

    const focusToolbar = toClass({
        'client-block-focus': !!planner.focusedBlock,
        'focus-toolbar': true,
        'focus-toolbar-hidden': !planner.focusedBlock,
    });

    return (
        <div className={`planner-area-container ${classNames}`}>
            <div className={focusToolbar}>
                <FocusTopbar setFocusBlock={planner.setFocusedBlock} focusedBlock={planner.focusedBlock} />
            </div>
            <div className="planner-area-position-parent" ref={onRef}>
                <DragAndDrop.DropZone
                    scale={planner.zoom}
                    accept={(draggable) => {
                        // Filter types
                        return draggable.type === 'block' && !!draggable.data.id;
                    }}
                    onDrop={(draggable, dragEvent) => {
                        // Is it possible to narrow the type via the accept fn?
                        if (draggable.type !== 'block') {
                            return;
                        }
                        planner.updateBlockInstance(
                            draggable.data.id,
                            blockPositionUpdater(dragEvent.zone.diff, planner.zoom)
                        );
                    }}
                >
                    {({ onRef: zoneRef }) => (
                        <div className="planner-area-scroll" ref={zoneRef}>
                            <div
                                className="planner-area-canvas"
                                style={{
                                    ...canvasSize,
                                    transform: `scale(${planner.zoom})`,
                                }}
                            >
                                {props.children}
                            </div>
                        </div>
                    )}
                </DragAndDrop.DropZone>

                {!planner.focusedBlock && (
                    <ZoomButtons
                        currentZoom={planner.zoom}
                        onZoomIn={() => planner.setZoomLevel((currentZoom) => currentZoom + ZOOM_STEP_SIZE)}
                        onZoomOut={() => planner.setZoomLevel((currentZoom) => currentZoom - ZOOM_STEP_SIZE)}
                        onZoomReset={() => planner.setZoomLevel(1)}
                    />
                )}
            </div>
        </div>
    );
};
