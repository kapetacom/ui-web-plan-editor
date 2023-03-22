import React, { useContext, useMemo } from 'react';
import { PlannerContext, PlannerMode } from './PlannerContext';
import { DragAndDrop } from './utils/dndUtils';
import { useBoundingBox } from './hooks/boundingBox';
import { calculateCanvasSize } from './utils/planUtils';
import { toClass } from '@kapeta/ui-web-utils';
import { PositionDiff } from './DragAndDrop/types';
import { BlockInstanceSpec } from '@kapeta/ui-web-types';
import { ZoomButtons } from '../components/ZoomButtons';

const blockPositionUpdater =
    (diff: PositionDiff, zoom: number) => (block: BlockInstanceSpec) => {
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
    const {
        size,
        zoom,
        setZoomLevel,
        mode,
        blockAssets,
        plan,
        updateBlockInstance,
    } = useContext(PlannerContext);

    const classNames = toClass({
        'read-only': mode === PlannerMode.VIEW,
    });

    const { value: boundingBox, onRef } = useBoundingBox();
    const canvasSize = useMemo(() => {
        return calculateCanvasSize(plan?.spec.blocks || [], blockAssets, size, {
            height: boundingBox.height,
            width: boundingBox.width,
        });
    }, [
        plan?.spec.blocks,
        blockAssets,
        size,
        boundingBox.width,
        boundingBox.height,
    ]);

    return (
        <div className={`planner-area-container ${classNames}`}>
            <div className="planner-area-position-parent" ref={onRef}>
                <DragAndDrop.DropZone
                    scale={zoom}
                    accept={(draggable) => {
                        // Filter types
                        return (
                            draggable.type === 'block' && !!draggable.data.id
                        );
                    }}
                    onDrop={(draggable, dragEvent) => {
                        // Is it possible to narrow the type via the accept fn?
                        if (draggable.type !== 'block') {
                            return;
                        }
                        updateBlockInstance(
                            draggable.data.id,
                            blockPositionUpdater(dragEvent.diff, zoom)
                        );
                    }}
                >
                    {({ onRef: zoneRef }) => (
                        <div className="planner-area-scroll" ref={zoneRef}>
                            <div
                                className="planner-area-canvas"
                                style={{
                                    ...canvasSize,
                                    transform: `scale(${zoom})`,
                                }}
                            >
                                {props.children}
                            </div>
                        </div>
                    )}
                </DragAndDrop.DropZone>

                <ZoomButtons
                    currentZoom={zoom}
                    onZoomIn={() =>
                        setZoomLevel((currentZoom) => currentZoom + 0.25)
                    }
                    onZoomOut={() =>
                        setZoomLevel((currentZoom) => currentZoom - 0.25)
                    }
                    onZoomReset={() => setZoomLevel(1)}
                />
            </div>
        </div>
    );
};
