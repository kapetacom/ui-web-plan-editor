import React, { useContext, useEffect, useMemo } from 'react';
import { PlannerContext } from './PlannerContext';
import { DragAndDrop } from './utils/dndUtils';
import { useBoundingBox } from './hooks/boundingBox';
import { BLOCK_SIZE, calculateCanvasSize, createBlockInstanceForBlock } from './utils/planUtils';
import { toClass } from '@kapeta/ui-web-utils';
import { BlockInstanceSpec, Point } from '@kapeta/ui-web-types';
import { ZoomButtons } from '../components/ZoomButtons';

import { ZOOM_STEP_SIZE } from './types';
import { PlannerMode } from '../wrappers/PlannerModelWrapper';
import { FocusTopbar } from './components/FocusTopbar';
import { PlannerFocusSideBar } from './components/PlannerFocusSideBar';

const PLAN_PADDING = 50;

const toBlockPoint = (mousePoint: Point, zoom: number): Point => {
    return {
        y: mousePoint.y / zoom,
        x: mousePoint.x / zoom,
    };
};

const blockPositionUpdater = (diff: Point, zoom: number) => (block: BlockInstanceSpec) => {
    const point = toBlockPoint(diff, zoom);
    return {
        ...block,
        dimensions: {
            ...block.dimensions!,
            top: block.dimensions!.top + point.y,
            left: block.dimensions!.left + point.x,
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

            <PlannerFocusSideBar
                block={planner.focusedBlock}
                blurFocus={() => {
                    planner.setFocusedBlock(undefined);
                }}
                onClose={() => {
                    planner.setFocusedBlock(undefined);
                }}
                onFocusChange={(block) => planner.setFocusedBlock(block)}
            />

            <div className="planner-area-position-parent" ref={onRef}>
                <DragAndDrop.DropZone
                    scale={planner.zoom}
                    accept={(draggable) => {
                        // Filter types
                        return ['block', 'block-type'].includes(draggable.type);
                    }}
                    onDrop={(draggable, dragEvent) => {
                        if (draggable.type === 'block') {
                            planner.updateBlockInstance(
                                draggable.data.id,
                                blockPositionUpdater(dragEvent.zone.diff, planner.zoom)
                            );
                            return;
                        }

                        if (draggable.type === 'block-type') {
                            const blockInstance = createBlockInstanceForBlock(draggable.data);
                            const center = (BLOCK_SIZE / 2) * planner.zoom; //To account for mouse offset
                            let point = dragEvent.zone.end;
                            point.x -= center;
                            point.y -= center;
                            const blockPoint = toBlockPoint(point, planner.zoom);
                            blockInstance.dimensions = {
                                height: -1,
                                width: BLOCK_SIZE,
                                left: blockPoint.x,
                                top: blockPoint.y,
                            };
                            planner.addBlockInstance(blockInstance);
                        }
                    }}
                >
                    {({ onRef: zoneRef }) => (
                        <div className="planner-area-scroll" ref={zoneRef}>
                            <div
                                className="planner-area-canvas"
                                style={{
                                    transformOrigin: 'top left',
                                    transform: `scale(${planner.zoom})`,
                                    width: PLAN_PADDING + canvasSize.width,
                                    height: PLAN_PADDING + canvasSize.height,
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
