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
    ButtonStyle, FormSelect
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
        const item = this.props.editableItem.item;
        this.editedSchema = {
            kind: kind,
            metadata: item.metadata,
            spec: item.spec
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
            const BlockTypeConfig = BlockTypeProvider.get(definition.kind);

            if (!BlockTypeConfig.componentType) {
                return <></>;
            }

            const data = (!this.editedSchema || this.editedSchema.kind !== definition.kind) ?
                definition : this.editedSchema;

            return <>
                <BlockTypeConfig.componentType
                    key={editableItem.item.id}
                    {...data}
                    creating={editableItem.creating}
                    onDataChanged={(metadata, spec) => this.onSchemaChanged(metadata, spec)}
                />
            </>;

        }

        if (editableItem.item instanceof PlannerResourceModelWrapper) {

            const definition = editableItem.item.getData();
            const resourceType = ResourceTypeProvider.get(definition.kind);

            if (!resourceType.componentType) {
                return <></>;
            }

            const data = (!this.editedSchema || this.editedSchema.kind !== definition.kind) ?
                definition : this.editedSchema;

            const blockwareUri = parseBlockwareUri(data.kind);

            const versions:{[key:string]:string} = {};
            const versionAlternatives = ResourceTypeProvider.getVersionsFor(blockwareUri.fullName);
            console.log('lists', versionAlternatives);
            versionAlternatives.forEach(resourceType => {
                const versionName = resourceType.version === 'local' ? 'Local Disk' : resourceType.version;
                versions[resourceType.version] = `${resourceType.title} [${versionName}]`;
            })
            console.log('versions', versions);

            return <>
                <FormSelect options={versions}
                            value={blockwareUri.version}
                            help={'Current version'}
                            validation={['required']}
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