import { createStore as zStore, useStore } from 'zustand';
import { PlannerMode } from '../PlannerContext';
import { PlannerNodeSize } from '../../types';
import React, { useContext } from 'react';

const plannerViewStateStore = (set, get) => ({
    size: PlannerNodeSize.MEDIUM,
    mode: PlannerMode.VIEW,
    zoom: 1,
});

type State = ReturnType<typeof plannerViewStateStore>;
export const createStore = (initialState: State) => {
    const store = zStore(plannerViewStateStore, initialState);
    return store;
};

/**
 * COME ON
 */

const store = createStore({
    mode: PlannerMode.EDIT,
    zoom: 1,
    size: PlannerNodeSize.MEDIUM,
});

const plannerStoreContext = React.createContext(store);
export const usePlannerStore = (selector) => {
    const storeContext = useContext(plannerStoreContext);
    return useStore(storeContext, selector);
};

export const Test = () => {
    const mode = usePlannerStore((state) => state.mode);
    return <div>{mode}</div>;
};
