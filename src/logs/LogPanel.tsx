/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React from 'react';

import { TerminalOutput, escapeSequence, toDateText, KapDateTime } from '@kapeta/ui-web-components';

export enum LogLevel {
    TRACE = 'TRACE',
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARNING = 'WARNING',
    ERROR = 'ERROR',
    FATAL = 'FATAL',
}

export enum LogSource {
    STDOUT = 'stdout',
    STDERR = 'stderr',
}

export interface LogEntry {
    time: string | number | Date;
    message: string;
    level: LogLevel;
    source?: LogSource;
}

function asLogString(entry: LogEntry) {
    const dateString = entry.time
        ? toDateText({
              format: KapDateTime.TIME_24_WITH_SECONDS,
              date: entry.time,
              allowRelative: false,
          })
        : 'unknown';

    // See: https://en.wikipedia.org/wiki/ANSI_escape_code#3-bit_and_4-bit
    const prefix = `${escapeSequence('3;90m')}${dateString}:${escapeSequence('0m')}`;
    return `${prefix} ${entry.message.trim()}`;
}

export interface LogPanelProps {
    logs?: LogEntry[];
}

export const LogPanel = (props: LogPanelProps) => {
    return <TerminalOutput data={props.logs ? props.logs.map(asLogString) : []} />;
};
