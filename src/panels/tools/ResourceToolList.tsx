import { IResourceTypeProvider, ItemType, Point } from '@kapeta/ui-web-types';
import { Box, Divider, Portal, Stack, Typography } from '@mui/material';
import { DragAndDrop } from '../../planner/utils/dndUtils';

import React, { useState } from 'react';
import { PlannerPayloadType } from '../../planner/types';
import { ResourceShape } from '../../components/ResourceShape';
import { TipIcon } from '../../components/TipIcon';

interface Props {
    dataKapId: string;
    title: string;
    description?: string | React.ReactNode;
    readMoreLink?: string;
    resources: IResourceTypeProvider[];
}

export const ResourceToolList = (props: Props) => {
    const [dragging, setDragging] = useState<IResourceTypeProvider>();
    const [draggingPosition, setDraggingPosition] = useState<Point | null>(null);
    const [draggedDiff, setDraggedDiff] = useState<Point | null>(null);

    return (
        <>
            <Stack
                direction={'column'}
                className={'planner-resource-list'}
                data-kap-id={props.dataKapId}
                sx={{
                    pb: 2,
                    pt: 2,
                }}
            >
                <Stack
                    direction={'row'}
                    justifyContent={'center'}
                    alignItems={'center'}
                    className={'planner-resource-list-header'}
                    gap={1}
                >
                    <Divider
                        flexItem={true}
                        sx={{
                            flex: 1,
                            height: 6,
                        }}
                    />
                    <Typography
                        color={'text.secondary'}
                        whiteSpace={'nowrap'}
                        flex={0}
                        fontSize={'12px'}
                        lineHeight={'12px'}
                    >
                        {props.title}
                        {props.description && <TipIcon content={props.description} readMoreLink={props.readMoreLink} />}
                    </Typography>
                    <Divider
                        flexItem={true}
                        sx={{
                            flex: 1,
                            height: 6,
                        }}
                    />
                </Stack>
                <Stack
                    direction={'row'}
                    alignItems={'flex-start'}
                    flexWrap={'wrap'}
                    sx={{
                        mt: 2,
                    }}
                    gap={2}
                >
                    {props.resources.map((resource, ix) => {
                        return (
                            <DragAndDrop.Draggable
                                key={`resource-${ix}`}
                                disabled={false}
                                data={{
                                    type: PlannerPayloadType.RESOURCE_TYPE,
                                    data: {
                                        title: resource.title || resource.kind,
                                        kind: resource.kind,
                                        config: resource,
                                    },
                                }}
                                onDragStart={(evt) => {
                                    setDragging(resource);
                                }}
                                onDragEnd={(evt) => {
                                    setDragging(undefined);
                                    setDraggingPosition(null);
                                    setDraggedDiff(null);
                                }}
                                onDrag={(evt) => {
                                    setDraggingPosition({
                                        x: evt.client.end.x,
                                        y: evt.client.end.y,
                                    });
                                    setDraggedDiff(evt.diff);
                                }}
                                onDrop={(evt) => {}}
                            >
                                {(evt) => {
                                    return <ResourceShape {...evt.componentProps} resource={resource} />;
                                }}
                            </DragAndDrop.Draggable>
                        );
                    })}
                </Stack>
            </Stack>
            {dragging && draggingPosition && (
                <Portal>
                    <ResourceShape
                        resource={dragging}
                        dragging={true}
                        dragged={draggedDiff}
                        position={draggingPosition}
                    />
                </Portal>
            )}
        </>
    );
};
