import React from 'react';
import { DnDContainer } from './DnDContainer';
import { DnDDropZone } from './DnDDropZone';
import { DnDDraggable } from './DnDDraggable';
import { DnDPayload } from './types';
import { DnDContext, DnDContextType } from './DnDContext';

// Container based
export const DragAndDrop = {
    ContextProvider: DnDContainer,
    DropZone: DnDDropZone,
    Draggable: DnDDraggable,
};

// Exists to inject types into the interfaces
export const createDragAndDrop = <T extends DnDPayload>(): {
    ContextProvider: typeof DnDContainer<T>;
    DropZone: typeof DnDDropZone<T>;
    Draggable: typeof DnDDraggable<T>;
    Context: React.Context<DnDContextType<T>>;
} => {
    return {
        Context: DnDContext,
        ContextProvider: DnDContainer,
        DropZone: DnDDropZone,
        Draggable: DnDDraggable,
    };
};
