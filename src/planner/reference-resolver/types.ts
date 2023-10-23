import { KapetaURI } from '@kapeta/nodejs-utils';
import { MissingReference } from '../validation/PlanReferenceValidation';
import { AssetInfo } from '../../types';
import { BlockDefinition } from '@kapeta/schemas';

export enum ActionType {
    NONE = 1,
    INSTALL,
    SELECT_ALTERNATIVE_VERSION,
    SELECT_ALTERNATIVE_TYPE,
    SELECT_LOCAL_VERSION,
    REMOVE_BLOCK,
}

export interface Resolution {
    action: ActionType;
    value?: string;
}

export const NO_RESOLUTION: Resolution = {
    action: ActionType.NONE,
};

export interface MissingReferenceResolution extends MissingReference {
    resolution: Resolution;
}

export interface SharedProps {
    installAsset: (ref: string) => Promise<void>;
    selectAssetFromDisk?: () => Promise<string | undefined>;
    blockAssets: AssetInfo<BlockDefinition>[];
}

export interface ItemProps extends SharedProps {
    missingReference: MissingReference;
    assetCanBeInstalled: (ref: string) => Promise<boolean>;
    readOnlyPlan: boolean;
    onResolution: (resolution: Resolution) => void;
    resolution: Resolution;
}

export interface InnerItemProps extends ItemProps {
    blockUri: KapetaURI;
    refUri: KapetaURI;
    canInstall: boolean;
    readOnlyBlock: boolean;
    resolution: Resolution;
}
