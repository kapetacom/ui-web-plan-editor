import { Asset, Point } from '@kapeta/ui-web-types';
import { AssetDisplay } from '@kapeta/ui-web-components';
import { parseKapetaUri } from '@kapeta/nodejs-utils';

export enum PlannerNodeSize {
    SMALL = 0,
    MEDIUM,
    FULL,
}

export interface AssetInfo<T> {
    version: string;
    ref: string;
    content: T;
    lastModified?: number;
    exists?: boolean;
    editable?: boolean;
    path?: string;
    ymlPath?: string;
}

export function fromAsset<T>(asset: Asset<T>): AssetInfo<T> {
    return {
        version: asset.version,
        lastModified: -1,
        ref: asset.ref,
        content: asset.data,
        exists: asset.exists,
        path: asset.path,
        ymlPath: asset.ymlPath,
    };
}

export function fromAssetDisplay<T>(asset: AssetDisplay<T>): AssetInfo<T> {
    return {
        version: asset.version,
        lastModified: asset.lastModified ? new Date(asset.lastModified).getTime() : -1,
        ref: parseKapetaUri(asset.content.metadata.name + ':' + asset.version).id,
        content: asset.content as T,
        exists: true,
    };
}

export interface FocusPositioningData {
    maxVerticalBlocks: number;
    maxHorizontalBlocks: number;
    totalUsedHeight: number;
    totalUsedHeightLeft: number;
    totalUsedHeightRight: number;
    plannerHeight: number;
    plannerWidth: number;
}

export interface BlockPositionCache {
    [key: string]: Point;
}

export interface ZoomAreaMap {
    [key: number]: Point;
}
