import React, { useContext, useEffect, useState } from 'react';
import {
    AssetNameInput,
    Button,
    ButtonStyle,
    ButtonType,
    FormButtons,
    FormContainer,
    FormField,
    FormFieldType,
    PanelSize,
    SidePanel,
    SimpleLoader,
} from '@kapeta/ui-web-components';

import { BlockTypeProvider, IdentityService, ResourceTypeProvider } from '@kapeta/ui-web-context';

import { parseKapetaUri } from '@kapeta/nodejs-utils';

import type { BlockConnectionSpec, BlockKind, SchemaEntity, SchemaKind } from '@kapeta/ui-web-types';
import { ItemType, ResourceKind, ResourceRole } from '@kapeta/ui-web-types';

import './ItemEditorPanel.less';
import { ErrorBoundary } from 'react-error-boundary';
import { useAsync } from 'react-use';
import { EditableItemInterface2 } from '../types';
import { cloneDeep } from 'lodash';
import { PlannerContext, PlannerContextData } from '../PlannerContext';

// Higher-order-component to allow us to use hooks for data loading (not possible in class components)
const withNamespaces = (ChildComponent) => {
    return (props) => {
        const { value: namespaces, loading } = useAsync(async () => {
            const identity = await IdentityService.getCurrent();
            const memberships = await IdentityService.getMemberships(identity.id);
            return [identity.handle, ...memberships.map((membership) => membership.identity.handle)];
        });
        return (
            <SimpleLoader loading={loading}>
                <ChildComponent {...props} namespaces={namespaces || []} />
            </SimpleLoader>
        );
    };
};
const AutoLoadAssetNameInput = withNamespaces(AssetNameInput);

interface BlockConnectionEditData {
    connection: BlockConnectionSpec;
    target: ResourceKind;
    targetEntities?: SchemaEntity[];
    source: ResourceKind;
    sourceEntities?: SchemaEntity[];
}

function renderBlockFields(data: SchemaKind) {
    const kindUri = parseKapetaUri(data.kind);
    const versions = BlockTypeProvider.getVersionsFor(kindUri.fullName);
    const options: { [key: string]: string } = {};

    versions.forEach((version) => {
        const id = `${kindUri.fullName}:${version}`;
        const typeProvider = BlockTypeProvider.get(id);
        const title = typeProvider.title ?? typeProvider.kind;
        options[id] = `${title} [${version}]`;
    });

    return (
        <>
            <FormField
                name="kind"
                type={FormFieldType.ENUM}
                label="Type"
                validation={['required']}
                help="The block type and version"
                options={options}
            />

            <AutoLoadAssetNameInput
                name="metadata.name"
                label="Name"
                help={'The name of this block - e.g. "myhandle/my-block"'}
            />

            <FormField name="metadata.title" label="Title" help="This blocks human-friendly title" />
        </>
    );
}

function renderEditableItemForm(planner: PlannerContextData, editableItem: EditableItemInterface2): any {
    if (editableItem.type === ItemType.CONNECTION) {
        const connection = editableItem.item as BlockConnectionSpec;

        const source = planner.getResourceByBlockIdAndName(
            connection.from.blockId,
            connection.from.resourceName,
            ResourceRole.PROVIDES
        );
        const target = planner.getResourceByBlockIdAndName(
            connection.to.blockId,
            connection.to.resourceName,
            ResourceRole.CONSUMES
        );

        if (!source || !target) {
            throw new Error(`Could not find resource for connection: ${JSON.stringify(connection)}`);
        }

        const ConverterType = ResourceTypeProvider.getConverterFor(source.kind, target.kind);

        if (!ConverterType) {
            return <></>;
        }

        const MappingComponent = ConverterType.mappingComponentType;

        if (!MappingComponent) {
            return <></>;
        }

        return (
            <MappingComponent
                title="mapping-editor"
                source={source}
                target={target}
                sourceEntities={[]} // connection.fromResource.block.getEntities()}
                targetEntities={[]} // connection.toResource.block.getEntities()}
                value={connection.mapping}
                onDataChanged={(change) => this.onMappingChanged(change)}
            />
        );
    }

    if (editableItem.type === ItemType.BLOCK) {
        const data = editableItem.item as BlockKind;

        const BlockTypeConfig = BlockTypeProvider.get(data.kind);

        if (!BlockTypeConfig.componentType) {
            return <div key={editableItem.ref}>{renderBlockFields(data)}</div>;
        }

        return (
            <div key={editableItem.ref}>
                {this.renderBlockFields(data)}
                <ErrorBoundary
                    fallbackRender={(props) => (
                        <div>
                            Failed to render block type: {data.kind}. <br />
                            Error: {props.error.message}
                        </div>
                    )}
                >
                    <BlockTypeConfig.componentType creating={editableItem.creating} />
                </ErrorBoundary>
            </div>
        );
    }

    // TODO: Implement resource editing
    // @ts-ignore
    if (editableItem.type === 'resource') {
        const data = editableItem.item as ResourceKind;
        const resourceType = ResourceTypeProvider.get(data.kind);

        if (!resourceType.componentType) {
            return <></>;
        }

        const dataKindUri = parseKapetaUri(data.kind);

        const versions: { [key: string]: string } = {};
        const versionAlternatives = ResourceTypeProvider.getVersionsFor(dataKindUri.fullName);
        versionAlternatives.forEach((version) => {
            const versionName = version === 'local' ? 'Local Disk' : version;
            const altResourceType = ResourceTypeProvider.get(`${dataKindUri.fullName}:${version}`);
            versions[`${dataKindUri.fullName}:${version}`] =
                altResourceType && altResourceType.title ? `${altResourceType.title} [${versionName}]` : versionName;
        });

        return (
            <>
                <FormField
                    options={versions}
                    type={FormFieldType.ENUM}
                    help="The kind and version of this resource"
                    validation={['required']}
                    label="Resource kind"
                    name="kind"
                />
                <ErrorBoundary
                    fallbackRender={(props) => (
                        <div>
                            Failed to render resource type: {data.kind}. <br />
                            Error: {props.error.message}
                        </div>
                    )}
                >
                    <resourceType.componentType
                        key={editableItem.ref}
                        // TODO: make resource componentType accept ResourceKind/Schemakind
                        // @ts-ignore
                        block={data}
                        creating={editableItem.creating}
                    />
                </ErrorBoundary>
            </>
        );
    }

    return <></>;
}

interface Props {
    editableItem?: EditableItemInterface2;
    open: boolean;
    onSubmit: (data: SchemaKind) => void;
    onClose: () => void;
}

export const ItemEditorPanel: React.FC<Props> = (props) => {
    const planner = useContext(PlannerContext);
    // callbacks
    const saveAndClose = (data: SchemaKind) => {
        props.onSubmit(data);
        props.onClose();
    };
    const onPanelCancel = () => {
        props.onClose();
    };

    const [initialValue, setInitialValue] = useState<any>({});

    useEffect(() => {
        if (props.editableItem) setInitialValue(cloneDeep(props.editableItem?.item));
    }, [props.editableItem]);

    const panelHeader = () => {
        if (!props.editableItem) {
            return '';
        }
        return `Edit ${props.editableItem.type}`;
    };

    return (
        <SidePanel title={panelHeader()} size={PanelSize.large} open={!!props.open} onClose={props.onClose}>
            {initialValue && props.editableItem && (
                <div className="item-editor-panel">
                    <FormContainer
                        // Do we need editableItem state?
                        initialValue={initialValue}
                        onSubmitData={(data) => saveAndClose(data as SchemaKind)}
                    >
                        <div className="item-form">{renderEditableItemForm(planner, props.editableItem)}</div>
                        <FormButtons>
                            <Button
                                width={70}
                                type={ButtonType.BUTTON}
                                style={ButtonStyle.DANGER}
                                onClick={onPanelCancel}
                                text="Cancel"
                            />
                            <Button width={70} type={ButtonType.SUBMIT} style={ButtonStyle.PRIMARY} text="Save" />
                        </FormButtons>
                    </FormContainer>
                </div>
            )}
            {!props.editableItem && <div>No item selected</div>}
        </SidePanel>
    );
};
