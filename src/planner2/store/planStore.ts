import {
    BlockConnectionSpec,
    BlockInstanceSpec,
    BlockResourceReferenceSpec,
    PlanKind,
} from '@kapeta/ui-web-types';
import { immer } from 'zustand/middleware/immer';
import { isEqual } from 'lodash';

interface State {
    plan: PlanKind | null;
}

interface Actions {
    updateBlockInstance(
        blockId: string,
        updater: (BlockInstanceSpec) => BlockInstanceSpec
    ): void;
    addConnection(connection: BlockConnectionSpec): void;
}

export const planSlice = immer<State & Actions>((set, get) => ({
    plan: null as PlanKind | null,
    updateBlockInstance(blockId, updater) {
        set((state) => {
            const block = state.plan?.spec.blocks?.find(
                (b) => b.id === blockId
            );
            if (!block) {
                return;
            }
            state.plan!.spec.blocks = state.plan!.spec.blocks!.map((b) =>
                b.id === blockId ? updater(b) : b
            );
        });
    },
    addConnection(connection: BlockConnectionSpec) {
        set((state) => {
            state.plan!.spec.connections = [
                ...(state.plan!.spec.connections || []),
                connection,
            ];
        });
    },
    removeConnection(connection: BlockConnectionSpec) {
        set((state) => {
            state.plan!.spec.connections = state.plan!.spec.connections!.filter(
                (c) => isEqual(c, connection)
            );
        });
    },
}));

export const planSelectors = {
    hasConnections(
        connectionSpec: BlockResourceReferenceSpec
    ): (state: State) => boolean {
        return ({ plan }) =>
            !!plan?.spec.connections?.find(
                (connection) =>
                    (connection.from.blockId === connectionSpec.blockId &&
                        connection.from.resourceName ===
                            connectionSpec.resourceName) ||
                    (connection.to.blockId === connectionSpec.blockId &&
                        connection.to.resourceName ===
                            connectionSpec.resourceName)
            );
    },
};
