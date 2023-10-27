import { KapetaURI } from '@kapeta/nodejs-utils';
import { MissingReference } from '../validation/PlanReferenceValidation';
import { AssetInfo } from '../../types';
import { BlockDefinition, Plan } from '@kapeta/schemas';
import { ResolutionState } from '../validation/PlanResolutionTransformer';

export enum ActionType {
    NONE = 1,
    INSTALL,
    SELECT_ALTERNATIVE_VERSION,
    SELECT_ALTERNATIVE_TYPE,
    SELECT_LOCAL_VERSION,
    REMOVE_BLOCK,
    NONE_AVAILABLE,
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
    plan: Plan;
    selectAssetFromDisk?: () => Promise<string | undefined>;
    blockAssets: AssetInfo<BlockDefinition>[];
    showErrors?: boolean;
}

export interface ReferenceResolverProps extends SharedProps {
    missingReferences: MissingReference[];
    resolutionStates?: ResolutionState[];
    assetCanBeInstalled: (ref: string) => Promise<boolean>;
    readOnly: boolean;
    onChange: (resolutions: MissingReferenceResolution[], valid: boolean) => void;
}

export interface ItemProps extends SharedProps {
    missingReference: MissingReference;
    assetCanBeInstalled: (ref: string) => Promise<boolean>;
    readOnlyPlan: boolean;
    onResolution: (resolution: Resolution) => void;
    resolution: Resolution;
    resolutionState?: ResolutionState;
}

export interface InnerItemProps extends ItemProps {
    blockUri: KapetaURI | null;
    refUri: KapetaURI;
    canInstall: boolean;
    readOnlyBlock: boolean;
    resolution: Resolution;
}
