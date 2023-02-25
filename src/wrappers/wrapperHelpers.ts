import { ResourceRole } from '@blockware/ui-web-types';

export enum ResourceMode {
    HIDDEN = 0,
    SHOW = 1,
    HOVER_COMPATIBLE = 2,
    COMPATIBLE = 3,
    SHOW_OPTIONS = 4,
    HIGHLIGHT = 5,
    SHOW_FIXED = 6,
}

export enum BlockMode {
    HIDDEN = 0,
    SHOW = 1,
    HOVER_DROP_CONSUMER = 3,
    HOVER_DROP_PROVIDER = 4,
    SHOW_RESOURCES = 5,
    HIGHLIGHT = 6,
    FOCUSED = 7,
}

export function createResourceId(
    blockId: string,
    role: ResourceRole,
    ix: number
) {
    return `${blockId}_${role}_${ix}`;
}
