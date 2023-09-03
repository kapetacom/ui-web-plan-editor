import React, { useEffect, useMemo } from 'react';

import { XTerm, escapeSequence, toDateText, KapDateTime } from '@kapeta/ui-web-components';
import { EventEmitter } from 'events';

export interface LogEmitter {
    onLog(listener: (entry: LogEntry) => void): () => void;
}

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
    time: number;
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
    const prefix = `${escapeSequence('3;100;232m')}${dateString}:${escapeSequence('0m')}`;
    return `${prefix} ${entry.message.trim()}`;
}

export interface LogPanelProps {
    logs?: LogEntry[];
    emitter?: LogEmitter;
}

const terminalOptions = {
    disableStdin: true,
    convertEol: true,
};

export const LogPanel = (props: LogPanelProps) => {
    const stream = useMemo(() => {
        const eventEmitter = new EventEmitter();

        return {
            write: (data: string) => {
                eventEmitter.emit('data', data);
            },
            on: (listener: (line: string) => void) => {
                eventEmitter.on('data', listener);
                return () => {
                    eventEmitter.off('data', listener);
                };
            },
        };
    }, []);

    useEffect(() => {
        if (!props.emitter) {
            return;
        }

        return props.emitter!.onLog((entry: LogEntry) => {
            stream.write(asLogString(entry) + '\n');
        });
    }, [props.emitter, stream]);

    const lines = useMemo(() => {
        return props.logs ? props.logs.map(asLogString) : [];
    }, [props.logs]);

    return (
        <XTerm
            terminalOptions={{
                disableStdin: true,
                convertEol: true,
            }}
            lines={lines}
            stream={stream}
        />
    );
};
