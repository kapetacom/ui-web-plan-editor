import { Point } from '@kapeta/ui-web-types';
import { omit } from 'lodash';

export const connectionPointSlice = (set, get) => ({
    points: {} as { [id: string]: Point },
    addPoint: (point: Point) =>
        set((state) => ({ points: [...state.points, point] })),
    removePoint: (id) => set((state) => ({ points: omit(state.points, id) })),
});
