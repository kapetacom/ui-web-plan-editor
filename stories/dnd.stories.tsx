import React, { useState } from 'react';
import { Simulate } from 'react-dom/test-utils';
import drag = Simulate.drag;
import { DragAndDrop } from '../src/planner2/DragAndDrop';

export default {
    title: 'Drag and drop',
    parameters: {
        layout: 'fullscreen',
    },
};

const DropZoneWrapper = (props) => {
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
    const data = {
        test: 1,
    };

    return (
        <div className="storywrapper" style={{ position: 'relative' }}>
            <DragAndDrop.ContextProvider>
                <DropZoneWrapper style={{ position: 'relative', top: '300' }} />
                <DropZoneWrapper style={{ position: 'relative', top: '400' }} />
                <DropZoneWrapper style={{ position: 'relative', top: '500' }} />

                <DragAndDrop.Draggable
                    data={data}
                    onDrop={(position) =>
                        setSavedPosition({
                            left: savedPosition.left + position.x,
                            top: savedPosition.top + position.y,
                        })
                    }
                >
                    {({ position, isDragging, componentProps }) => (
                        <div
                            {...componentProps}
                            style={{
                                position: 'absolute',
                                top: savedPosition.top + position.y,
                                left: savedPosition.left + position.x,
                                userSelect: 'none',
                                cursor: isDragging ? 'grabbing' : 'grab',
                            }}
                        >
                            DRAG ME!
                            <pre>{JSON.stringify(position)}</pre>
                        </div>
                    )}
                </DragAndDrop.Draggable>
            </DragAndDrop.ContextProvider>
        </div>
    );
};
