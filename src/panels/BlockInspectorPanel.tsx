/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React, { useContext, useEffect, useMemo, useRef } from 'react';
import { BlockDefinition, BlockInstance } from '@kapeta/schemas';
import { LogEntry, LogPanel } from '../logs/LogPanel';
import { PlannerContext } from '../planner/PlannerContext';
import { useBlockValidationIssues } from '../planner/hooks/block-validation';
import { PlannerSidebar } from './PlannerSidebar';
import { Box, List, ListItem, Stack, Tab, Tabs, Typography } from '@mui/material';

interface BlockInspectorPanelProps {
    instance?: BlockInstance;
    configuration?: any;
    logs?: LogEntry[];
    initialTab?: string;
    open: boolean;
    onClosed: () => void;
}

export const BlockInspectorPanel = (props: BlockInspectorPanelProps) => {
    const planner = useContext(PlannerContext);
    const [tab, setTab] = React.useState(props.initialTab ?? 'logs');

    const [scrolledToBottom, setScrolledToBottom] = React.useState(true);

    const scrollContainer = useRef<HTMLDivElement>();

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

    useEffect(() => {
        if (!scrollContainer.current) {
            return;
        }

        const elm = scrollContainer.current;

        const handler = () => {
            const atBottom = Math.abs(elm.scrollHeight - (elm.clientHeight + elm.scrollTop)) < 10;
            setScrolledToBottom(atBottom);
        };

        elm.addEventListener('scroll', handler);

        return () => {
            elm.removeEventListener('scroll', handler);
        };
    }, [scrolledToBottom, setScrolledToBottom]);

    useEffect(() => {
        if (!scrollContainer.current) {
            return;
        }

        const elm = scrollContainer.current;

        if (scrolledToBottom) {
            elm.scrollTop = elm.scrollHeight - elm.clientHeight;
        }
    }, [scrollContainer.current?.scrollHeight, scrolledToBottom, props.logs]);

    return (
        <PlannerSidebar title={title} open={props.open} size="large" onClose={props.onClosed} minWidth={400}>
            {props.instance && (
                <Stack
                    direction="column"
                    sx={{
                        height: '100%',
                    }}
                >
                    <Tabs value={tab} onChange={(evt, newTabId) => setTab(newTabId)}>
                        {props.logs && <Tab label="Logs" value="logs" data-kap-id="block-inspector-log-tab" />}
                        <Tab
                            label={`Issues (${issues.length})`}
                            value="issues"
                            data-kap-id="block-inspector-issues-tab"
                        />
                    </Tabs>
                    {tab === 'logs' && (
                        <Box
                            flex={1}
                            ref={scrollContainer}
                            sx={{
                                pt: 2,
                                overflowY: 'auto',
                            }}
                        >
                            <LogPanel logs={props.logs} />
                        </Box>
                    )}
                    {tab === 'issues' && (
                        <Box sx={{ flex: 1, p: 2 }}>
                            {(!valid && (
                                <>
                                    <Typography variant="body2" component="span">
                                        Found the following issues in block
                                    </Typography>
                                    <List>
                                        {issues.map((issue, ix) => {
                                            return (
                                                <ListItem key={`issue_${ix}`} divider sx={{ px: 0 }}>
                                                    <Box sx={{ fontSize: '12px' }}>
                                                        <Typography variant="body2">
                                                            {issue.level}: <strong>{issue.name}</strong>
                                                        </Typography>
                                                        <Typography variant="body2">{issue.issue}</Typography>
                                                    </Box>
                                                </ListItem>
                                            );
                                        })}
                                    </List>
                                </>
                            )) || (
                                <Typography variant="body2" component="span">
                                    No issues found
                                </Typography>
                            )}
                        </Box>
                    )}
                </Stack>
            )}
        </PlannerSidebar>
    );
};
