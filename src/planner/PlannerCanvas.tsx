import React, { PropsWithChildren, useContext, useEffect, useMemo } from 'react';
import { PlannerContext } from './PlannerContext';
import { DragAndDrop } from './utils/dndUtils';
import { useBoundingBox } from './hooks/boundingBox';
import { BLOCK_SIZE, calculateCanvasSize } from './utils/planUtils';
import { toClass } from '@kapeta/ui-web-utils';
import { IBlockTypeProvider, Point } from '@kapeta/ui-web-types';
import { ZoomButtons } from '../components/ZoomButtons';

import { PlannerPayloadType, ZOOM_STEP_SIZE } from './types';
import { PlannerMode } from '../utils/enums';
import { FocusTopbar } from './components/FocusTopbar';
import { PlannerFocusSideBar } from './components/PlannerFocusSideBar';
import { BlockDefinition, BlockInstance } from '@kapeta/schemas';
import { createBlockInstanceForBlock, createBlockInstanceForBlockType } from './utils/blockUtils';
import { DnDPayload, DragEventInfo } from './DragAndDrop/types';
import { parseKapetaUri } from '@kapeta/nodejs-utils';
import { adjustBlockEdges } from './components/PlannerBlockNode';

const PLAN_PADDING = 50;

const toBlockPoint = (mousePoint: Point, zoom: number): Point => {
    return {
        y: mousePoint.y / zoom,
        x: mousePoint.x / zoom,
    };
};

const blockPositionUpdater = (diff: Point, zoom: number) => (block: BlockInstance) => {
    const point = toBlockPoint(diff, zoom);
    point.x += block.dimensions!.left;
    point.y += block.dimensions!.top;
    adjustBlockEdges(point);

    return {
        ...block,
        dimensions: {
            ...block.dimensions!,
            top: point.y,
            left: point.x,
        },
    };
};

interface Props extends PropsWithChildren {
    onCreateBlock?: (block: BlockDefinition, instance: BlockInstance) => void;
}

export const PlannerCanvas: React.FC<Props> = (props) => {
    const planner = useContext(PlannerContext);
    const { isDragging } = useContext(DragAndDrop.Context);

    const classNames = toClass({
        'read-only': planner.mode === PlannerMode.VIEW,
        dragging: isDragging,
        focused: !!planner.focusedBlock,
    });

    const { value: boundingBox, onRef } = useBoundingBox();
    const canvasSize = useMemo(() => {
        return calculateCanvasSize(planner.plan?.spec.blocks || [], planner.blockAssets, planner.nodeSize, {
            height: boundingBox.height,
            width: boundingBox.width,
        });
    }, [planner.plan?.spec.blocks, planner.blockAssets, planner.nodeSize, boundingBox.width, boundingBox.height]);

    function calculateDimensions(dragEvent: DragEventInfo<DnDPayload>) {
        const center = (BLOCK_SIZE / 2) * planner.zoom; // To account for mouse offset
        const point = dragEvent.zone.end;
        point.x -= center;
        point.y -= center;
        const blockPoint = toBlockPoint(point, planner.zoom);
        return {
            height: -1,
            width: BLOCK_SIZE,
            left: blockPoint.x,
            top: blockPoint.y,
        };
    }

    function createLocalRef(block: IBlockTypeProvider) {
        let ref;
        let attempt = 0;
        let postfix = '';
        const providerUri = parseKapetaUri(block.definition.metadata.name);
        do {
            ref = `kapeta://${planner.uri?.handle}/new-${providerUri.name}${postfix}:local`;
            postfix = `-${++attempt}`;
        } while (planner.hasBlockDefinition(ref));

        return ref;
    }

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
                    data={{ type: PlannerPayloadType.PLAN, data: planner.plan! }}
                    scale={planner.zoom}
                    accept={(draggable) => {
                        // Filter types
                        return [
                            PlannerPayloadType.BLOCK,
                            PlannerPayloadType.BLOCK_DEFINITION,
                            PlannerPayloadType.BLOCK_TYPE,
                        ].includes(draggable.type);
                    }}
                    onDrop={(draggable, dragEvent) => {
                        if (draggable.type === PlannerPayloadType.BLOCK) {
                            planner.updateBlockInstance(
                                draggable.data.id,
                                blockPositionUpdater(dragEvent.zone.diff, planner.zoom)
                            );
                            return;
                        }

                        if (draggable.type === PlannerPayloadType.BLOCK_DEFINITION) {
                            const blockInstance = createBlockInstanceForBlock(draggable.data);
                            blockInstance.dimensions = calculateDimensions(dragEvent);
                            planner.addBlockInstance(blockInstance);
                        }

                        if (draggable.type === PlannerPayloadType.BLOCK_TYPE) {
                            const ref = createLocalRef(draggable.data);
                            const blockInfo = createBlockInstanceForBlockType(ref, draggable.data);
                            blockInfo.instance.dimensions = calculateDimensions(dragEvent);

                            // Callback should handle the creation of the block and remove the block definition
                            // and instance from the planner if the creation is cancelled
                            props.onCreateBlock?.(blockInfo.block, blockInfo.instance);
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
