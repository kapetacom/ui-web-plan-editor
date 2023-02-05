import React, {Component} from "react";
import {observer} from "mobx-react";
import {action, toJS, observable, makeObservable} from "mobx";
import {
    Button,
    ButtonType,
    PanelSize,
    FormContainer,
    FormButtons,
    SidePanel,
    ButtonStyle, FormSelect, FormInput
} from "@blockware/ui-web-components";

import {
    BlockTypeProvider,
    ResourceTypeProvider
} from "@blockware/ui-web-context";

import {parseBlockwareUri} from '@blockware/nodejs-utils';

import type {BlockConnectionSpec, SchemaKind, DataWrapper, BlockMetadata, SchemaEntity} from "@blockware/ui-web-types";
import {ResourceKind} from "@blockware/ui-web-types";


import {EditableItemInterface} from "../../wrappers/models";
import {
    PlannerConnectionModelWrapper
} from "../../wrappers/PlannerConnectionModelWrapper";
import {PlannerBlockModelWrapper} from "../../wrappers/PlannerBlockModelWrapper";
import {PlannerResourceModelWrapper} from "../../wrappers/PlannerResourceModelWrapper";

import './ItemEditorPanel.less';

function validateBlockName(field:string, value:string) {
    if (!/^[a-z][a-z0-9_-]*\/[a-z][a-z0-9_-]*$/i.test(value)) {
        throw new Error('Invalid block name. Expected format is <handle>/<name>');
    }
}

interface BlockConnectionEditData {
    connection: BlockConnectionSpec
    target: ResourceKind
    targetEntities?: SchemaEntity[]
    source: ResourceKind
    sourceEntities?: SchemaEntity[]
}

interface ItemEditorPanelProps {
    editableItem: DataWrapper | any | undefined
    onClosed: () => void
    onBlockSaved: (item: PlannerBlockModelWrapper) => void
    onConnectionSaved: (item: PlannerConnectionModelWrapper) => void
    onBlockRemoved: (item: PlannerBlockModelWrapper) => void
    onConnectionRemoved: (item: PlannerConnectionModelWrapper) => void
}

@observer
export class ItemEditorPanel extends Component<ItemEditorPanelProps> {

    @observable
    private editedSchema?: SchemaKind;

    @observable
    private editedConnection?: BlockConnectionEditData;

    private saved: boolean = false;

    constructor(props: ItemEditorPanelProps) {
        super(props);
        makeObservable(this);
    }

    @action
    private onPanelClosed = () => {
        try {
            if (!this.props.editableItem) {
                return;
            }

            this.editedSchema = undefined;
            this.editedConnection = undefined;

            if (this.saved) {
                this.saved = false;
                return;
            }

            if (!this.props.editableItem.creating) {
                return;
            }

            if (this.props.editableItem.item instanceof PlannerConnectionModelWrapper) {
                this.props.onConnectionRemoved(this.props.editableItem.item);

            }

            if (this.props.editableItem.item instanceof PlannerBlockModelWrapper) {
                this.props.onBlockRemoved(this.props.editableItem.item);
            }

            if (this.props.editableItem.item instanceof PlannerResourceModelWrapper) {
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
    private saveAndClose = () => {
        try {
            this.saved = true;
            this.save();
            this.editedSchema = undefined;
            this.editedConnection = undefined;
        } catch (e) {
            console.log(e);
        } finally {
            this.onPanelClosed();
        }
    }

    @action
    private save(): void {


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

        if (!this.editedSchema) {
            return;
        }

        //Resource is being saved
        item.setData(this.editedSchema);
        this.editedSchema = undefined;

        if (item instanceof PlannerBlockModelWrapper) {
            //We always overwrite the instance name for now.
            if (!item.name) {
                item.name = item.getBlockName();
            }

            this.props.onBlockSaved(item);
        }
    }


    @action
    private onSchemaChanged = (metadata: BlockMetadata, spec: any) => {
        const item = this.props.editableItem.item;
        this.editedSchema = {
            kind: this.editedSchema?.kind ?? item.getData().kind,
            metadata,
            spec
        };
    }

    @action
    private onKindChanged = (kind:string) => {
        const itemData = this.editedSchema ?? toJS(this.props.editableItem.item.getData());
        this.editedSchema = {
            kind: kind,
            metadata: itemData.metadata,
            spec: itemData.spec
        };
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
                mapping: change.data
            }
        };
    }

    private renderBlockFields(data:SchemaKind) {
        const kindUri = parseBlockwareUri(data.kind);
        const versions = BlockTypeProvider.getVersionsFor(kindUri.fullName);
        const options:{[key:string]:string} = {};

        versions.forEach(version => {
            const id = `${kindUri.fullName}:${version}`;
            const typeProvider = BlockTypeProvider.get(id);
            const title = typeProvider.title ?? typeProvider.kind;
            options[id] = `${title} [${version}]`
        })

        return (
            <>
                <FormSelect
                    name={"kind"}
                    value={kindUri.id}
                    label={"Type"}
                    validation={['required']}
                    help={"The block type and version"}
                    options={options}
                    onChange={(name, value) => {
                        this.onKindChanged(value);
                    }}
                />

                <FormInput name={'name'}
                           validation={['required', validateBlockName]}
                           value={data.metadata.name}
                           onChange={(name,value) => {
                               data.metadata[name] = value;
                               this.onSchemaChanged(data.metadata, data.spec);
                           }}
                           label={'Name'}
                           help={'The name of this block - e.g. "myhandle/my-block"'}

                />

                <FormInput name={'title'}
                           label={'Title'}
                           value={data.metadata.title}
                           onChange={(name,value) => {
                               data.metadata[name] = value;
                               this.onSchemaChanged(data.metadata, data.spec);
                           }}
                           help={'This blocks human-friendly title'}

                />
            </>
        )
    }

    private renderEditableItemForm(editableItem: EditableItemInterface): any {

        if (editableItem.item instanceof PlannerConnectionModelWrapper) {
            const connection = editableItem.item;

            const sourceKind = connection.fromResource.getKind();
            const targetKind = connection.toResource.getKind();
            const ConverterType = ResourceTypeProvider.getConverterFor(sourceKind, targetKind);

            if (!ConverterType) {
                return <></>;
            }

            const MappingComponent = ConverterType.mappingComponentType;

            if (!MappingComponent) {
                return <></>;
            }

            return <>
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
            </>;

        }

        if (editableItem.item instanceof PlannerBlockModelWrapper) {
            const definition = editableItem.item.getData();

            let data:SchemaKind;
            if (this.editedSchema &&
                parseBlockwareUri(this.editedSchema.kind).fullName === parseBlockwareUri(definition.kind).fullName) {
                data = this.editedSchema
            } else {
                data = definition;
            }

            const BlockTypeConfig = BlockTypeProvider.get(data.kind);

            if (!BlockTypeConfig.componentType) {
                return <div key={editableItem.item.id}>
                    {this.renderBlockFields(data)}
                </div>;
            }

            return <div key={editableItem.item.id}>
                {this.renderBlockFields(data)}
                <BlockTypeConfig.componentType
                    {...data}
                    creating={editableItem.creating}
                    onDataChanged={(metadata, spec) => this.onSchemaChanged(metadata, spec)}
                />
            </div>;
        }

        if (editableItem.item instanceof PlannerResourceModelWrapper) {

            const definition = editableItem.item.getData();
            const resourceType = ResourceTypeProvider.get(definition.kind);

            if (!resourceType.componentType) {
                return <></>;
            }

            const kindUri = parseBlockwareUri(definition.kind);
            const editedKindUri = this.editedSchema?.kind ?
                parseBlockwareUri(this.editedSchema.kind) : null;

            const data = (this.editedSchema && editedKindUri.fullName === kindUri.fullName) ?
                this.editedSchema : definition;

            const dataKindUri = parseBlockwareUri(data.kind);

            const versions:{[key:string]:string} = {};
            const versionAlternatives = ResourceTypeProvider.getVersionsFor(dataKindUri.fullName);
            versionAlternatives.forEach(version => {
                const versionName = version === 'local' ? 'Local Disk' : version;
                const resourceType = ResourceTypeProvider.get(`${dataKindUri.fullName}:${version}`);
                versions[version] = resourceType && resourceType.title ?
                    `${resourceType.title} [${versionName}]` :
                    versionName;
            });

            return <>
                <FormSelect options={versions}
                            value={dataKindUri.version}
                            help={'The kind and version of this resource'}
                            validation={['required']}
                            label={'Resource kind'}
                            name={'version'}
                            onChange={(name, newVersion) => {
                                const kindUri = parseBlockwareUri(data.kind);
                                if (kindUri.version !== newVersion) {
                                    kindUri.version = newVersion;
                                    this.onKindChanged(kindUri.id)
                                }
                            }} />
                <resourceType.componentType
                    key={editableItem.item.id}
                    {...data}
                    block={editableItem.item.block}
                    creating={editableItem.creating}
                    onDataChanged={(metadata, spec) => this.onSchemaChanged(metadata, spec)}
                />
            </>;
        }

        return <>
        </>

    }

    render() {

        const panelHeader = () => {
            if (!this.props.editableItem) {
                return '';
            }
            return `Edit ${this.props.editableItem.type.toLowerCase()}`;
        };

        return <SidePanel
            title={panelHeader()}
            size={PanelSize.large}
            open={!!this.props.editableItem}
            onOpen={() => this.saved = false}
            onClose={this.onPanelClosed}>

            {this.props.editableItem &&
                <div className={'item-editor-panel'}>
                    <FormContainer onSubmit={() => this.saveAndClose()}>
                        <div className={'item-form'}>
                            {
                                this.renderEditableItemForm(this.props.editableItem)
                            }
                        </div>
                        <FormButtons>
                            <Button width={70} type={ButtonType.BUTTON} style={ButtonStyle.DANGER}
                                    onClick={this.onPanelCancel} text="Cancel"/>
                            <Button width={70} type={ButtonType.SUBMIT} style={ButtonStyle.PRIMARY} text="Save"/>
                        </FormButtons>
                    </FormContainer>
                </div>
            }
            {!this.props.editableItem && <div>No item selected</div>}
        </SidePanel>

    }
}