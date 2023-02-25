import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { action, makeObservable, observable, toJS } from 'mobx';
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
} from '@blockware/ui-web-components';

import {
    BlockTypeProvider,
    IdentityService,
    ResourceTypeProvider,
} from '@blockware/ui-web-context';

import { parseBlockwareUri } from '@blockware/nodejs-utils';

import type {
    BlockConnectionSpec,
    BlockMetadata,
    DataWrapper,
    SchemaEntity,
    SchemaKind,
} from '@blockware/ui-web-types';
import { ResourceKind } from '@blockware/ui-web-types';

import { EditableItemInterface } from '../../wrappers/models';
import { PlannerConnectionModelWrapper } from '../../wrappers/PlannerConnectionModelWrapper';
import { PlannerBlockModelWrapper } from '../../wrappers/PlannerBlockModelWrapper';
import { PlannerResourceModelWrapper } from '../../wrappers/PlannerResourceModelWrapper';

import './ItemEditorPanel.less';
import { ErrorBoundary } from 'react-error-boundary';
import { useAsync } from 'react-use';

// Higher-order-component to allow us to use hooks for data loading (not possible in class components)
const withNamespaces = (Component) => {
    return (props) => {
        const { value: namespaces, loading } = useAsync(async () => {
            const identity = await IdentityService.getCurrent();
            const memberships = await IdentityService.getMemberships(
                identity.id
            );
            return [
                identity.handle,
                ...memberships.map((membership) => membership.identity.handle),
            ];
        });
        return (
            <SimpleLoader loading={loading}>
                <Component {...props} namespaces={namespaces || []} />
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

interface Props {
    editableItem: DataWrapper | any | undefined;
    onClosed: () => void;
    onBlockSaved: (item: PlannerBlockModelWrapper) => void;
    onConnectionSaved: (item: PlannerConnectionModelWrapper) => void;
    onBlockRemoved: (item: PlannerBlockModelWrapper) => void;
    onConnectionRemoved: (item: PlannerConnectionModelWrapper) => void;
}

interface State {
    entry?: SchemaKind;
    initialValue?: SchemaKind;
}

@observer
export class ItemEditorPanel extends Component<Props, State> {
    @observable
    private editedConnection?: BlockConnectionEditData;

    private saved: boolean = false;

    constructor(props: Props) {
        super(props);
        this.state = {
            initialValue: this.props.editableItem?.item?.getData(),
        };
        makeObservable(this);
    }

    @action
    private onPanelClosed = () => {
        try {
            if (!this.props.editableItem) {
                return;
            }

            this.editedConnection = undefined;

            if (this.saved) {
                this.saved = false;
                return;
            }

            if (!this.props.editableItem.creating) {
                return;
            }

            if (
                this.props.editableItem.item instanceof
                PlannerConnectionModelWrapper
            ) {
                this.props.onConnectionRemoved(this.props.editableItem.item);
            }

            if (
                this.props.editableItem.item instanceof PlannerBlockModelWrapper
            ) {
                this.props.onBlockRemoved(this.props.editableItem.item);
            }

            if (
                this.props.editableItem.item instanceof
                PlannerResourceModelWrapper
            ) {
                this.props.editableItem.item.remove();
            }
        } finally {
            this.props.onClosed();
        }
    };

    @action
    private onPanelCancel = () => {
        if (!this.props.editableItem) {
            return;
        }
        this.onPanelClosed();
    };

    @action
    private saveAndClose = (data: any) => {
        try {
            this.saved = true;
            this.save(data);
            this.editedConnection = undefined;
        } catch (e) {
            console.log(e);
        } finally {
            this.onPanelClosed();
        }
    };

    @action
    private save(data: SchemaKind): void {
        if (!this.props.editableItem) {
            return;
        }

        const item = this.props.editableItem.item;

        if (item instanceof PlannerConnectionModelWrapper) {
            if (!this.editedConnection) {
                return;
            }

            const fromBlock = item.fromResource.block;
            const toBlock = item.toResource.block;

            const editedConnection = toJS(this.editedConnection);

            if (editedConnection.sourceEntities) {
                fromBlock.setEntities(editedConnection.sourceEntities);
            }

            if (editedConnection.targetEntities) {
                toBlock.setEntities(editedConnection.targetEntities);
            }

            item.fromResource.setData(editedConnection.source);
            item.toResource.setData(editedConnection.target);
            item.setData(editedConnection.connection);

            this.editedConnection = undefined;

            this.props.onConnectionSaved(item);
            return;
        }

        if (!data) {
            return;
        }

        //Resource is being saved
        item.setData(data);

        if (item instanceof PlannerBlockModelWrapper) {
            //We always overwrite the instance name for now.
            if (!item.name) {
                item.name = item.getBlockName();
            }

            this.props.onBlockSaved(item);
        }
    }

    @action
    private onMappingChanged = (change: any) => {
        const connection = this.props.editableItem.item;
        this.editedConnection = {
            target: change.target,
            targetEntities: toJS(change.targetEntities),
            source: change.source,
            sourceEntities: toJS(change.sourceEntities),
            connection: {
                from: toJS(connection.from),
                to: toJS(connection.to),
                mapping: change.data,
            },
        };
    };

    private renderBlockFields(data: SchemaKind) {
        const kindUri = parseBlockwareUri(data.kind);
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
                    name={'kind'}
                    type={FormFieldType.ENUM}
                    label={'Type'}
                    validation={['required']}
                    help={'The block type and version'}
                    options={options}
                />

                <AutoLoadAssetNameInput
                    name={'metadata.name'}
                    label={'Name'}
                    help={'The name of this block - e.g. "myhandle/my-block"'}
                />

                <FormField
                    name={'metadata.title'}
                    label={'Title'}
                    help={'This blocks human-friendly title'}
                />
            </>
        );
    }

    private getData(): SchemaKind {
        const definition = this.props.editableItem.item.getData();

        let data: SchemaKind;
        if (
            this.state.entry &&
            parseBlockwareUri(this.state.entry.kind).fullName ===
                parseBlockwareUri(definition.kind).fullName
        ) {
            data = this.state.entry;
        } else {
            data = definition;
        }

        return data;
    }

    private renderEditableItemForm(editableItem: EditableItemInterface): any {
        if (editableItem.item instanceof PlannerConnectionModelWrapper) {
            const connection = editableItem.item;

            const sourceKind = connection.fromResource.getKind();
            const targetKind = connection.toResource.getKind();
            const ConverterType = ResourceTypeProvider.getConverterFor(
                sourceKind,
                targetKind
            );

            if (!ConverterType) {
                return <></>;
            }

            const MappingComponent = ConverterType.mappingComponentType;

            if (!MappingComponent) {
                return <></>;
            }

            return (
                <MappingComponent
                    key={connection.id}
                    title={'mapping-editor'}
                    source={connection.fromResource.getData()}
                    target={connection.toResource.getData()}
                    sourceEntities={connection.fromResource.block.getEntities()}
                    targetEntities={connection.toResource.block.getEntities()}
                    value={toJS(connection.mapping)}
                    onDataChanged={(change) => this.onMappingChanged(change)}
                />
            );
        }

        if (editableItem.item instanceof PlannerBlockModelWrapper) {
            const data = this.getData();

            const BlockTypeConfig = BlockTypeProvider.get(data.kind);

            if (!BlockTypeConfig.componentType) {
                return (
                    <div key={editableItem.item.id}>
                        {this.renderBlockFields(data)}
                    </div>
                );
            }

            return (
                <div key={editableItem.item.id}>
                    {this.renderBlockFields(data)}
                    <ErrorBoundary
                        fallbackRender={(props) => (
                            <div>
                                Failed to render block type: {data.kind}. <br />
                                Error: {props.error.message}
                            </div>
                        )}
                    >
                        <BlockTypeConfig.componentType
                            creating={editableItem.creating}
                        />
                    </ErrorBoundary>
                </div>
            );
        }

        if (editableItem.item instanceof PlannerResourceModelWrapper) {
            const data = this.getData();
            const resourceType = ResourceTypeProvider.get(data.kind);

            if (!resourceType.componentType) {
                return <></>;
            }

            const dataKindUri = parseBlockwareUri(data.kind);

            const versions: { [key: string]: string } = {};
            const versionAlternatives = ResourceTypeProvider.getVersionsFor(
                dataKindUri.fullName
            );
            versionAlternatives.forEach((version) => {
                const versionName =
                    version === 'local' ? 'Local Disk' : version;
                const resourceType = ResourceTypeProvider.get(
                    `${dataKindUri.fullName}:${version}`
                );
                versions[`${dataKindUri.fullName}:${version}`] =
                    resourceType && resourceType.title
                        ? `${resourceType.title} [${versionName}]`
                        : versionName;
            });

            return (
                <>
                    <FormField
                        options={versions}
                        type={FormFieldType.ENUM}
                        help={'The kind and version of this resource'}
                        validation={['required']}
                        label={'Resource kind'}
                        name={'kind'}
                    />
                    <ErrorBoundary
                        fallbackRender={(props) => (
                            <div>
                                Failed to render resource type: {data.kind}.{' '}
                                <br />
                                Error: {props.error.message}
                            </div>
                        )}
                    >
                        <resourceType.componentType
                            key={editableItem.item.id}
                            block={editableItem.item.block}
                            creating={editableItem.creating}
                        />
                    </ErrorBoundary>
                </>
            );
        }

        return <></>;
    }

    componentDidUpdate(prevProps: Readonly<Props>) {
        if (this.props.editableItem !== prevProps.editableItem) {
            //When we change editableItem - reset
            this.setState({
                entry: undefined,
                initialValue: this.props.editableItem?.item?.getData(),
            });
        }
    }

    render() {
        const panelHeader = () => {
            if (!this.props.editableItem) {
                return '';
            }
            return `Edit ${this.props.editableItem.type.toLowerCase()}`;
        };

        return (
            <SidePanel
                title={panelHeader()}
                size={PanelSize.large}
                open={!!this.props.editableItem}
                onOpen={() => (this.saved = false)}
                onClose={this.onPanelClosed}
            >
                {this.props.editableItem && (
                    <div className={'item-editor-panel'}>
                        <FormContainer
                            initialValue={this.state.initialValue}
                            onChange={(data) =>
                                this.setState({ entry: data as SchemaKind })
                            }
                            onSubmitData={(data) => this.saveAndClose(data)}
                        >
                            <div className={'item-form'}>
                                {this.renderEditableItemForm(
                                    this.props.editableItem
                                )}
                            </div>
                            <FormButtons>
                                <Button
                                    width={70}
                                    type={ButtonType.BUTTON}
                                    style={ButtonStyle.DANGER}
                                    onClick={this.onPanelCancel}
                                    text="Cancel"
                                />
                                <Button
                                    width={70}
                                    type={ButtonType.SUBMIT}
                                    style={ButtonStyle.PRIMARY}
                                    text="Save"
                                />
                            </FormButtons>
                        </FormContainer>
                    </div>
                )}
                {!this.props.editableItem && <div>No item selected</div>}
            </SidePanel>
        );
    }
}
