import React, { useContext, useMemo } from 'react';
import { TabContainer, TabPage } from '@kapeta/ui-web-components';

import './BlockInspectorPanel.less';
import { BlockDefinition, BlockInstance } from '@kapeta/schemas';
import { LogEmitter, LogEntry, LogPanel } from '../logs/LogPanel';
import { PlannerContext } from '../planner/PlannerContext';
import { useBlockValidationIssues } from '../planner/hooks/block-validation';
import { PlannerSidebar } from './PlannerSidebar';
import { Box } from '@mui/material';

interface BlockInspectorPanelProps {
    instance?: BlockInstance;
    configuration?: any;
    logs?: LogEntry[];
    emitter?: LogEmitter;
    open: boolean;
    onClosed: () => void;
}

export const BlockInspectorPanel = (props: BlockInspectorPanelProps) => {
    const planner = useContext(PlannerContext);

    let block: BlockDefinition | undefined = undefined;
    if (props.instance?.block.ref) {
        block = planner.getBlockByRef(props.instance.block.ref);
    }

    const issues = useBlockValidationIssues({
        blockInstance: props.instance ?? null,
        blockDefinition: block,
        configuration: props.configuration,
    });

    const valid = issues.length === 0;

    const title = useMemo(() => {
        return props.instance ? `Inspect ${props.instance?.name}` : 'Inspect';
    }, [props.instance]);

    return (
        <PlannerSidebar title={title} open={props.open} size={'large'} onClose={props.onClosed}>
            {props.instance && (
                <div className="item-inspector-panel">
                    <TabContainer>
                        {props.emitter && (
                            <TabPage id="logs" title="Logs">
                                <Box
                                    sx={{
                                        mt: 2,
                                        height: 'calc(100% - 16px)',
                                    }}
                                >
                                    <LogPanel logs={props.logs} emitter={props.emitter} />
                                </Box>
                            </TabPage>
                        )}
                        <TabPage id="issues" title="Issues">
                            <div className="issues-container" key={`${props.instance.block.ref}_issues`}>
                                {(!valid && (
                                    <>
                                        <span>Found the following issues in block</span>
                                        <ul className="issues-list">
                                            {issues.map((issue, ix) => {
                                                return (
                                                    <li key={`issue_${ix}`}>
                                                        <div className="issue-context">
                                                            <span className="level">{issue.level}</span>:
                                                            <span className="name">{issue.name}</span>
                                                        </div>
                                                        <div className="issue-message">{issue.issue}</div>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </>
                                )) || <span>No issues found</span>}
                            </div>
                        </TabPage>
                    </TabContainer>
                </div>
            )}
        </PlannerSidebar>
    );
};
