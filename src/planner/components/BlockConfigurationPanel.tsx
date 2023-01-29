import React, {useMemo, useState} from "react";
import {
    Button,
    ButtonStyle,
    ButtonType,
    FormButtons,
    FormContainer,
    FormField,
    FormFieldType,
    PanelSize,
    SidePanel,
    SimpleLoader
} from "@blockware/ui-web-components";
import {PlannerBlockModelWrapper} from "../../wrappers/PlannerBlockModelWrapper";

import './ItemEditorPanel.less';
import {BlockService} from "@blockware/ui-web-context";
import {parseBlockwareUri} from '@blockware/nodejs-utils';
import {BlockConfigurationData} from "../../wrappers/models";

type Options = {[key:string]:string}


interface Props {
    block?: PlannerBlockModelWrapper
    open: boolean
    onClose: () => void
    onSave: (data: BlockConfigurationData) => void
}

export const BlockConfigurationPanel = (props: Props) => {

    const [loading, setLoading] = useState(true);
    const [versionOptions, setVersionOptions] = useState<Options>({});

    const panelHeader = () => {
        if (!props.block) {
            return '';
        }
        return `Configure ${props.block.name}`;
    };

    const data:BlockConfigurationData = useMemo<BlockConfigurationData>(() => {
        if (!props.block) {
            return {
                version: '',
                name: ''
            };
        }
        return {
            version: props.block.version,
            name: props.block.name
        };
    }, [props.open, props.block?.ref]);

    const loader = async () => {
        if (!props.block) {
            setLoading(false);
            return {};
        }
        setLoading(true);
        try {
            const blockUri = parseBlockwareUri(props.block.ref);
            const blocks = await BlockService.list();
            const opts:Options = {};
            blocks
                .filter(block => {
                    const uri = parseBlockwareUri(block.ref);
                    return (uri.fullName === blockUri.fullName);
                })
                .forEach(block => {
                    opts[block.version] = block.version === 'local' ? 'Local Disk' : block.version;
                });

            setVersionOptions(opts);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SidePanel
            title={panelHeader()}
            size={PanelSize.large}
            open={props.open}
            onClose={props.onClose}>
            <SimpleLoader loading={loading}
                          key={props.block?.ref ?? 'unknown-block'}
                          loader={loader}
                          text={'Loading details... Please wait'}>
                <div className={'block-configuration-panel'}>
                    <FormContainer initialValue={data}
                                   onSubmitData={(data) => props.onSave(data as BlockConfigurationData)}>

                        <FormField name={'name'}
                                   label={'Instance name'}
                                   help={'This related only to the instance of the block and not the block itself.'}
                                   readOnly={props.block?.plan.isReadOnly()}
                                   type={FormFieldType.STRING}/>

                        <FormField name={'version'}
                                   label={'Version'}
                                   options={versionOptions}
                                   help={'The current version used by this plan'}
                                   readOnly={props.block?.plan.isReadOnly()}
                                   type={FormFieldType.ENUM}/>

                        <FormButtons>
                            <Button width={70} type={ButtonType.BUTTON} style={ButtonStyle.DANGER}
                                    onClick={props.onClose} text="Cancel"/>
                            <Button width={70} type={ButtonType.SUBMIT} style={ButtonStyle.PRIMARY} text="Save"/>
                        </FormButtons>
                    </FormContainer>
                </div>
            </SimpleLoader>
        </SidePanel>
    );
}