import React, { useRef, useState } from 'react';
import { DragAndDrop } from '../src/planner/DragAndDrop';

export default {
    title: 'Drag and drop',
    parameters: {
        layout: 'fullscreen',
    },
};

const DropZoneWrapper = (props: { style: any }) => {
    const [{ isActive, data: hoverData }, setActive] = useState({
        isActive: false,
        data: null as null | any,
    });
    const [data, setData] = useState<any>(null);

    return (
        <DragAndDrop.DropZone
            onDragEnter={(payload) => {
                setActive({ isActive: true, data: payload });
            }}
            onDragLeave={(payload) => {
                setActive({ isActive: false, data: null });
            }}
            onDrop={(dropData) => {
                setData(dropData);
            }}
        >
            {({ onRef }) => (
                <div
                    ref={onRef}
                    style={{
                        background: isActive ? '#ff3' : '#ff9',
                        padding: '20px',
                        margin: '48px auto',
                        width: '300px',
                        ...props.style,
                    }}
                >
                    <pre>{isActive ? 'active' : 'inactive'}</pre>
                    <pre>{JSON.stringify(hoverData || data, null, 4)}</pre>
                </div>
            )}
        </DragAndDrop.DropZone>
    );
};

export const DragAndDropDemo = () => {
    const [savedPosition, setSavedPosition] = useState({ top: 0, left: 0 });
    const payload = {
        type: 'demo',
        data: { test: 1 },
    };
    const rootRef = useRef(null);
    return (
        <DragAndDrop.ContextProvider root={rootRef}>
            <div className="storywrapper" style={{ position: 'relative' }} ref={rootRef}>
                <DropZoneWrapper style={{ position: 'relative', top: '300' }} />
                <DropZoneWrapper style={{ position: 'relative', top: '400' }} />
                <DropZoneWrapper style={{ position: 'relative', top: '500' }} />

                <DragAndDrop.Draggable
                    data={payload}
                    onDrop={(dragEvent) =>
                        setSavedPosition({
                            left: savedPosition.left + dragEvent.zone.diff.x,
                            top: savedPosition.top + dragEvent.zone.diff.y,
                        })
                    }
                >
                    {(evt) => (
                        <div
                            {...evt.componentProps}
                            style={{
                                position: 'absolute',
                                top: savedPosition.top + evt.zone.diff.y,
                                left: savedPosition.left + evt.zone.diff.x,
                                userSelect: 'none',
                                cursor: evt.isDragging ? 'grabbing' : 'grab',
                            }}
                        >
                            DRAG ME!
                            <pre>{JSON.stringify(evt.zone.end)}</pre>
                        </div>
                    )}
                </DragAndDrop.Draggable>
            </div>
        </DragAndDrop.ContextProvider>
    );
};
