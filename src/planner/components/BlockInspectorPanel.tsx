import React, {Component} from "react";
import {observer} from "mobx-react";
import {action, makeObservable, observable} from "mobx";
import {PanelSize, SidePanel, TabContainer, TabPage} from "@blockware/ui-web-components";
import {InstanceEventType, InstanceService} from "@blockware/ui-web-context";

import {PlannerBlockModelWrapper} from "../../wrappers/PlannerBlockModelWrapper";
import {LogEmitter, LogEntry, LogPanel} from "../../logs/LogPanel";

import './BlockInspectorPanel.less';

interface BlockInspectorPanelProps {
    block?: PlannerBlockModelWrapper
    planRef: string
    title: string
    onClosed: () => void
}

@observer
export class BlockInspectorPanel extends Component<BlockInspectorPanelProps> {

    private sidePanel: SidePanel | null = null;

    private logListener?: ((entry: LogEntry) => void);

    private logEmitter: LogEmitter;

    @observable
    private loading: boolean = true;

    @observable
    private logs: LogEntry[] = [];

    constructor(props: BlockInspectorPanelProps) {
        super(props);
        makeObservable(this);

        this.logEmitter = {
            onLog: (listener: (entry: LogEntry) => void) => {
                this.logListener = listener;
            }
        }
    }

    @action
    public async open() {
        if (!this.sidePanel) {
            return;
        }

        this.sidePanel.open();
    }

    @action
    private async loadLogs() {
        if (!this.props.block?.getRef()) {
            return;
        }
        this.setLoading(true);
        try {
            const result = await InstanceService.getInstanceLogs(this.props.planRef, this.props.block?.id);
            this.setLogs(result.ok === false ? [] : result.logs);
        } finally {
            this.setLoading(false);
        }
    }

    @action
    private setLogs(logs: LogEntry[]) {
        this.logs = logs;
    }

    @action
    private setLoading(loading: boolean) {
        this.loading = loading;
    }

    @action
    public close() {
        if (!this.sidePanel) {
            return;
        }

        this.sidePanel.close();
    }

    @action
    private onPanelClosed = () => {
        try {
            if (!this.props.block) {
                return;
            }

        } finally {
            this.props.onClosed();
        }
    };

    @action
    private onPanelCancel = () => {
        if (!this.props.block) {
            return;
        }
        this.close();
    };


    private onInstanceLog = (log: any) => {
        if (this.logListener) {
            this.logListener(log);
        }
    }

    private startListening() {
        if (!this.props.block) {
            return;
        }
        this.stopListening();
        InstanceService.subscribe(this.props.block.getRef(), InstanceEventType.EVENT_INSTANCE_LOG, this.onInstanceLog);
    }

    private stopListening() {
        if (!this.props.block) {
            return;
        }

        InstanceService.unsubscribe(this.props.block.getRef(), InstanceEventType.EVENT_INSTANCE_LOG, this.onInstanceLog);
    }

    componentDidUpdate(prevProps: Readonly<BlockInspectorPanelProps>, prevState: Readonly<{}>, snapshot?: any) {
        this.startListening();

        if (!this.props.block?.getRef()) {
            return;
        }

        if (this.props.block?.getRef() == prevProps.block?.getRef()) {
            return;
        }

        this.loadLogs().catch((err) => {
            console.warn('Failed while loading logs', err);
        });
    }

    componentWillUnmount() {
        this.stopListening();
    }

    render() {
        return (<SidePanel ref={(ref) => this.sidePanel = ref}
                           title={this.props.title}
                           size={PanelSize.large}
                           onClose={this.onPanelClosed}
            >

                {this.props.block &&
                    <div className={'item-inspector-panel'}>
                        <TabContainer>
                            <TabPage id={'logs'} title={'Logs'}>
                                <LogPanel key={this.props.block.getRef() + '_logs'} logs={this.logs} emitter={this.logEmitter}/>
                            </TabPage>
                            <TabPage id={'issues'} title={'Issues'}>
                                <div className={'issues-container'} key={this.props.block.getRef() + '_issues'}>
                                    {!this.props.block.isValid() && (
                                        <>
                                            <span>
                                                Found the following issues in block
                                            </span>
                                            <ul className={'issues-list'}>
                                                {this.props.block.getIssues().map((issue) => {
                                                    return (
                                                        <li>
                                                            <div className={'issue-context'}>
                                                                <span className={'level'}>{issue.level}</span>
                                                                :
                                                                <span className={'name'}>{issue.name}</span>
                                                            </div>
                                                            <div className={'issue-message'}>{issue.issue}</div>
                                                        </li>
                                                    )
                                                })}
                                            </ul>
                                        </>
                                    ) || <span>No issues found</span>}
                                </div>
                            </TabPage>
                        </TabContainer>

                    </div>
                }
            </SidePanel>
        )
    }

}