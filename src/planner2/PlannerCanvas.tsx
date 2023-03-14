import React, { useContext, useMemo } from 'react';
import { PlannerContext, PlannerMode } from './PlannerContext';
import { DragAndDrop } from './DragAndDrop';
import { useBoundingBox } from './hooks/boundingBox';
import { calculateCanvasSize } from './utils/planUtils';
import { toClass } from '@blockware/ui-web-utils';
import { DragEventInfo } from './DragAndDrop/types';
import { BlockInstanceSpec } from '@blockware/ui-web-types';

const blockPositionUpdater =
    (dragEvent: DragEventInfo) => (block: BlockInstanceSpec) => {
        return {
            ...block,
            dimensions: {
                ...block.dimensions!,
                top: block.dimensions!.top + dragEvent.diff.y,
                left: block.dimensions!.left + dragEvent.diff.x,
            },
        };
    };

export const PlannerCanvas: React.FC<React.PropsWithChildren> = (props) => {
    const { size, zoom, mode, blockAssets, plan, updateBlockInstance } =
        useContext(PlannerContext);

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
                <div className="planner-area-scroll">
                    <DragAndDrop.DropZone<{ id: string }>
                        accept={(draggable) => {
                            // Filter types
                            return true;
                        }}
                        onDrop={(draggable, dragEvent) => {
                            updateBlockInstance(
                                draggable.id,
                                blockPositionUpdater(dragEvent)
                            );
                        }}
                    >
                        {({ onRef: zoneRef }) => (
                            <div
                                className="planner-area-canvas"
                                style={{
                                    ...canvasSize,
                                    transform: `scale(${1 / zoom})`,
                                }}
                                ref={zoneRef}
                            >
                                {props.children}
                            </div>
                        )}
                    </DragAndDrop.DropZone>
                </div>
            </div>
        </div>
    );
};
