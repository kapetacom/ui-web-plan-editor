import React, { Component } from "react";
import {observable, action, makeObservable} from "mobx";
import { observer } from "mobx-react";

import { Modal, ModalSize } from "@blockware/ui-web-components";
import {TrafficService, TrafficEventType,  ResourceTypeProvider} from "@blockware/ui-web-context";
import { ConnectionMethodsMapping, Traffic } from "@blockware/ui-web-types";

import {
    PlannerConnectionModelWrapper
} from "../../wrappers/PlannerConnectionModelWrapper"

interface InspectConnectionWrapperProps {
    connection: PlannerConnectionModelWrapper,
    onClose: () => void
}

interface InspectConnectionWrapperState {
    selectedMethod?: string
    selectedPayload?: Traffic
}

@observer
export class InspectConnectionPanel extends Component<InspectConnectionWrapperProps, InspectConnectionWrapperState>{

    @observable
    private trafficLines: Traffic[] = []

    private unsubscribers: Function[] = [];

    private modal: Modal | null = null;


    constructor(props: InspectConnectionWrapperProps) {
        super(props);
        makeObservable(this);
        this.state = {};
    }

    private findInTrafficLines = (trafficId: string) => {
        let exists = this.trafficLines.find((trafficLine: Traffic) => {
            return trafficLine.id === trafficId;
        });
        return exists;
    };

    @action
    private onTrafficStart = (payload: Traffic) => {
        this.trafficLines.push(payload);

    };

    @action
    private onTrafficEnd = (payload: Traffic) => {
        const trafficLine = this.findInTrafficLines(payload.id)
        if (trafficLine) {
            Object.assign(trafficLine, payload);
        }
    };

    private unsubscribeAll() {
        while (this.unsubscribers.length > 0) {
            const unsubscriber = this.unsubscribers.pop();
            if (unsubscriber) {
                unsubscriber();
            }
        }
    }

    public open() {
        if (!this.modal) {
            return;
        }

        this.modal.open();
    }

    public close() {
        if (!this.modal) {
            return;
        }

        this.modal.close();
    }

    componentDidMount() {
        this.unsubscribeAll();
        let { connection } = this.props;
        this.unsubscribers = [
            TrafficService.subscribe(connection.id, TrafficEventType.TRAFFIC_START, this.onTrafficStart),
            TrafficService.subscribe(connection.id, TrafficEventType.TRAFFIC_END, this.onTrafficEnd)
        ];
    }

    componentWillUnmount() {
        this.unsubscribeAll();
    }

    renderContent() {
        const converter = ResourceTypeProvider.getConverterFor(
            this.props.connection.fromResource.getKind(),
            this.props.connection.toResource.getKind()
        );

        if (!converter || 
            !converter.inspectComponentType) {
            return (
                <div>
                    No traffic inspector defined for connection type
                </div>
            );
        }

        const Inspector = converter.inspectComponentType;

        const mapping:ConnectionMethodsMapping = this.props.connection.mapping || {};

        return (
            <Inspector
                trafficLines={this.trafficLines}
                mapping={mapping} />
        )
    }

    render() {

        return ( <Modal ref={(ref) => this.modal = ref}
                        openInitially={true}
                   title="Connection Traffic Inspector"
                   onClose={this.props.onClose}
                   size={ModalSize.large}  >
                {this.renderContent()}
            </Modal>
        )
    }
}