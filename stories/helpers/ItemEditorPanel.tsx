/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React, { useContext, useMemo } from 'react';
import { AssetNameInput, FormButtons, FormContainer, FormField, FormFieldType } from '@kapeta/ui-web-components';

import { BlockTypeProvider, ResourceTypeProvider } from '@kapeta/ui-web-context';
import { parseKapetaUri } from '@kapeta/nodejs-utils';
import type { SchemaKind } from '@kapeta/ui-web-types';
import { ItemType, ResourceRole } from '@kapeta/ui-web-types';
import './ItemEditorPanel.less';
import { ErrorBoundary } from 'react-error-boundary';
import { Connection, Entity, Resource } from '@kapeta/schemas';
import { Button } from '@mui/material';
import { PlannerContext, PlannerContextData } from '../../src/planner/PlannerContext';
import { EditItemInfo } from '../../src/planner/types';
import { cloneDeep } from 'lodash';
import { PlannerSidebar } from '../../src/panels/PlannerSidebar';

interface BlockConnectionEditData {
    connection: Connection;
    target: Resource;
    targetEntities?: Entity[];
    source: Resource;
    sourceEntities?: Entity[];
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

            <AssetNameInput
                name="metadata.name"
                label="Name"
                namespaces={['kapeta', 'local']}
                help={'The name of this block - e.g. "myhandle/my-block"'}
            />

            <FormField name="metadata.title" label="Title" help="This blocks human-friendly title" />
        </>
    );
}

function renderEditableItemForm(planner: PlannerContextData, editableItem: EditItemInfo): any {
    if (editableItem.type === ItemType.CONNECTION) {
        const connection = editableItem.item as Connection;

        const source = planner.getResourceByBlockIdAndName(
            connection.provider.blockId,
            connection.provider.resourceName,
            ResourceRole.PROVIDES
        );
        const target = planner.getResourceByBlockIdAndName(
            connection.consumer.blockId,
            connection.consumer.resourceName,
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
            />
        );
    }

    if (editableItem.type === ItemType.BLOCK) {
        const data = editableItem.item.block;

        const BlockTypeConfig = BlockTypeProvider.get(data.kind);

        if (!BlockTypeConfig.editorComponent) {
            return <div>{renderBlockFields(data)}</div>;
        }

        return (
            <div>
                {renderBlockFields(data)}
                <ErrorBoundary
                    fallbackRender={(props) => (
                        <div>
                            Failed to render block type: {data.kind}. <br />
                            Error: {props.error.message}
                        </div>
                    )}
                >
                    <BlockTypeConfig.editorComponent block={data} creating={editableItem.creating} />
                </ErrorBoundary>
            </div>
        );
    }

    // TODO: Implement resource editing
    // @ts-ignore
    if (editableItem.type === ItemType.RESOURCE) {
        const data = editableItem.item.resource as Resource;
        const resourceType = ResourceTypeProvider.get(data.kind);

        if (!resourceType.editorComponent) {
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
                    <resourceType.editorComponent
                        key={editableItem.item.ref}
                        // TODO: make resource editorComponent accept Resource/Schemakind
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
    editableItem?: EditItemInfo;
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

    const initialValue = useMemo(() => {
        switch (props.editableItem?.type) {
            case ItemType.CONNECTION:
                return cloneDeep(props.editableItem.item);
            case ItemType.BLOCK:
                return cloneDeep(props.editableItem.item.block);
            case ItemType.RESOURCE:
                return cloneDeep(props.editableItem.item.resource);
            default:
                return {};
        }
    }, [props.editableItem]);

    const panelHeader = () => {
        if (!props.editableItem) {
            return '';
        }
        return `Edit ${props.editableItem.type}`;
    };

    const existingNames = useMemo(() => {
        if (props.editableItem && props.editableItem.type === ItemType.RESOURCE) {
            const propResource = props.editableItem.item.resource;
            const resources =
                ResourceTypeProvider.get(propResource.kind).role === ResourceRole.PROVIDES
                    ? props.editableItem.item.block.spec.providers
                    : props.editableItem.item.block.spec.consumers;
            // Remove one instance of current name, not all in order to allow correcting existing duplicate entries
            const index = resources?.findIndex((resource) => resource.metadata.name === propResource.metadata.name);
            return resources?.filter((_x, i) => i !== index).map((resource) => resource.metadata.name) || [];
        }
        return [];
    }, [props.editableItem]);

    return (
        <PlannerSidebar title={panelHeader()} minWidth={400} open={!!props.open} onClose={props.onClose}>
            {initialValue && props.editableItem && (
                <div className="item-editor-panel">
                    <FormContainer
                        // Do we need editableItem state?
                        validators={[
                            (name, value) => {
                                if (name === 'metadata.name' && existingNames.includes(value)) {
                                    throw new Error('Resource name already exists');
                                }
                            },
                        ]}
                        initialValue={initialValue}
                        onSubmitData={(data) => saveAndClose(data as SchemaKind)}
                    >
                        <div className="item-form">{renderEditableItemForm(planner, props.editableItem)}</div>
                        <FormButtons>
                            <Button variant={'contained'} color={'error'} onClick={onPanelCancel}>
                                Cancel
                            </Button>
                            <Button variant={'contained'} type={'submit'} color={'primary'}>
                                Save
                            </Button>
                        </FormButtons>
                    </FormContainer>
                </div>
            )}
            {!props.editableItem && <div>No item selected</div>}
        </PlannerSidebar>
    );
};
