import React from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';

import { SidePanel, PanelAlignment, PanelSize, DnDDrag } from "@blockware/ui-web-components";
import {ResourceTypeProvider} from "@blockware/ui-web-context";
import { ResourceConfig, ComponentType, ResourceRole } from "@blockware/ui-web-types";
import { toClass, SVGCornersHelper, ResourceTagSide } from "@blockware/ui-web-utils";

import {PlannerToolboxResource} from "./PlannerToolboxResource";

import './PlannerToolbox.less';

export interface PlannerToolboxPainterProps<T> {
    item: ToolItem<T>
}

interface ToolItem<T> {
    kind: string;
    title: string
    data: T
}

interface ToolSection<T> {
    name: string;
    items: ToolItem<T>[];
    painter: ComponentType<PlannerToolboxPainterProps<T>>
}

interface PlannerToolboxProps {
    open: boolean;
    onClose?: () => void
    blockStore?:React.ComponentType
}

interface PlannerToolboxState {
    blockStoreVisible: boolean
}

export class PlannerToolbox extends React.Component<PlannerToolboxProps, PlannerToolboxState> {

    private toolSections: ToolSection<any>[] = [];
    private resourceTagHeight = 45;
    private resourceTagWidth = 128;
    private resourceTagRadius = 3;
    private resourceTagAnglePercent = 10;

    constructor(props: PlannerToolboxProps) {
        super(props);

        this.state = {
            blockStoreVisible: false
        };

        this.loadResourceSection();
    }

    private loadResourceSection() {
        const providerSection: ToolSection<ResourceConfig> = {
            name: 'Providers',
            items: [],
            painter: PlannerToolboxResource
        };

        const consumerSection: ToolSection<ResourceConfig> = {
            name: 'Consumers',
            items: [],
            painter: PlannerToolboxResource
        };

        ResourceTypeProvider.list().forEach((resourceConfig:ResourceConfig) => {
            const section = (resourceConfig.role === ResourceRole.PROVIDES) ? providerSection : consumerSection;
            section.items.push({
                title: resourceConfig.title || resourceConfig.kind,
                kind: resourceConfig.kind,
                data: resourceConfig
            });
        });

        this.toolSections.push(providerSection);
        this.toolSections.push(consumerSection);
    }


    private getResourceTagClasses = (resourceTag: any, isConsumer: boolean) => {
        return toClass({
            "toolbox-resource-listing-item": true,
            "database": resourceTag.data.type.toLowerCase() === "database",
            "service": resourceTag.data.type.toLowerCase() === "service",
            "extension": resourceTag.data.type.toLowerCase() === "extension",
            "consumer-item": isConsumer,
            "provide-item": !isConsumer
        });
    };

    render() {

        return (
            <SidePanel
                className={'planner-toolbox-container'}
                size={PanelSize.small}
                onClose={this.props.onClose}
                closable={false}
                side={PanelAlignment.right}
                open={this.props.open}
                modal={false}>

                <Tabs className="toolbox-tabs" defaultIndex={0} forceRenderTabPanel={true}>
                    <TabList >
                        {this.props.blockStore &&
                            <>
                                <Tab>Resources</Tab>
                                <Tab>Block Store</Tab>
                            </>
                            }
                    </TabList>
                    <TabPanel>
                        <div className={"consumer-resources-title resource-section"} >
                            <div className={"consumer-resources resources-section-title-line"}>
                                <div style={{ flex: 0.2 }}>
                                    <svg width="24" height="15" viewBox="0 0 24 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect width="6.66667" height="6.66667" transform="matrix(1 8.74228e-08 8.74228e-08 -1 8.3335 15)" fill="#F9DFDD" fillOpacity="0.87" />
                                        <rect width="6.66667" height="6.66667" transform="matrix(1 8.74228e-08 8.74228e-08 -1 0.000244141 15)" fill="#F9DFDD" />
                                        <rect width="6.66667" height="6.66667" transform="matrix(1 8.74228e-08 8.74228e-08 -1 8.3335 6.66667)" fill="#F9DFDD" fillOpacity="0.75" />
                                        <rect width="6.66667" height="6.66667" transform="matrix(1 8.74228e-08 8.74228e-08 -1 16.667 6.66667)" fill="#F9DFDD" fillOpacity="0.6" />
                                    </svg>
                                </div>
                                <div className={"resources-section-title"}><p>Consumers</p></div>
                            </div>
                            <div className={"resource-listing"}>
                                {this.toolSections.filter(section => section.name.toLowerCase() === "consumers")[0].items.map((item: ToolItem<any>, index: number) => {
                                    return (
                                        <DnDDrag type={'tool'} value={item.data} key={index}>
                                            <div className={this.getResourceTagClasses(item, true)} >
                                                <svg className="item" width={this.resourceTagWidth} height={this.resourceTagHeight} viewBox={"0 0 " + this.resourceTagWidth + " " + this.resourceTagHeight}>
                                                    <path d={SVGCornersHelper.getResourceTagPath(this.resourceTagHeight, this.resourceTagWidth, this.resourceTagRadius, ResourceTagSide.LEFT, this.resourceTagAnglePercent)} >
                                                    </path>
                                                    <text className={"resource-title"} textAnchor="start" x="20" y="20" >{item.title}</text>
                                                    <text className={"resource-type"} textAnchor="start" x="20" y="35" >{item.data.type.charAt(0) + item.data.type.toLowerCase().substring(1)}</text>
                                                </svg>
                                            </div>
                                        </DnDDrag>
                                    );
                                })}
                            </div>
                        </div>
                        <div className={"provider-resources-title resource-section"} >
                            <div className={"provider-resources resources-section-title-line"}>
                                <div style={{ flex: 0.2 }}>
                                    <svg width="24" height="15" viewBox="0 0 24 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect x="8.33325" width="6.66667" height="6.66667" fill="#F9DFDD" fillOpacity="0.87" />
                                        <rect width="6.66667" height="6.66667" fill="#F9DFDD" />
                                        <rect x="8.33325" y="8.33333" width="6.66667" height="6.66667" fill="#F9DFDD" fillOpacity="0.75" />
                                        <rect x="16.6667" y="8.33333" width="6.66667" height="6.66667" fill="#F9DFDD" fillOpacity="0.6" />
                                    </svg>
                                </div>
                                <div className={"resources-section-title"} ><p>Providers</p></div>
                            </div>
                            <div className={"resource-listing"}>
                                {this.toolSections.filter(section => section.name.toLowerCase() === "providers")[0].items.map((item: ToolItem<any>, index: number) => {
                                    return (
                                        <DnDDrag type={'tool'} value={item.data} key={index}>
                                            <div className={this.getResourceTagClasses(item, true)}>
                                                <svg className="item" width={this.resourceTagWidth} height={this.resourceTagHeight} viewBox={"0 0 " + this.resourceTagWidth + " " + this.resourceTagHeight}>
                                                    <path d={SVGCornersHelper.getResourceTag3_25(this.resourceTagWidth, this.resourceTagRadius, ResourceTagSide.RIGHT, this.resourceTagAnglePercent)}
                                                    >

                                                    </path>
                                                    <text className={"resource-title"} textAnchor="start" x="10" y="18" >{item.title}</text>
                                                    <text className={"resource-type"} textAnchor="start" x="10" y="35" >{item.data.type.charAt(0) + item.data.type.toLowerCase().substring(1)}</text>

                                                </svg>
                                            </div>
                                        </DnDDrag>
                                    );
                                })}
                            </div>
                        </div>

                    </TabPanel>
                    {this.props.blockStore &&
                        <TabPanel>
                            <this.props.blockStore />
                        </TabPanel>
                    }
                </Tabs>
            </SidePanel>
        )
    }

}

