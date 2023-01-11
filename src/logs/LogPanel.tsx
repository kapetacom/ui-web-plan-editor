import React, {useEffect} from "react";
import {useList} from "react-use";
import {toClass} from "@blockware/ui-web-utils";

import './LogPanel.less'

export interface LogEmitter {
    onLog(listener:(entry:LogEntry) => void):void
}

export enum LogLevel {
    TRACE = 'TRACE',
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARNING = 'WARNING',
    ERROR = 'ERROR',
    FATAL = 'FATAL'
}

export enum LogSource {
    STDOUT = 'stdout',
    STDERR = 'stderr',
}

export interface LogEntry {

    time: number
    message: string
    level: LogLevel
    source?: LogSource
}

export interface LogPanelProps {
    logs?: LogEntry[]
    emitter?: LogEmitter
    reverse?:boolean
    maxEntries?:number
}

const DEFAULT_MAX_ENTRIES = 200;


export const LogPanel = (props:LogPanelProps) => {

    const maxEntries = props.maxEntries || DEFAULT_MAX_ENTRIES;
    let [logs, logListHandler] = useList(props.logs || []);

    if (props.emitter) {
        const logListener = (entry:LogEntry) => {
            while(logs.length >= maxEntries) {
                if (props.reverse) {
                    logs.pop();
                } else {
                    logs.shift();
                }
            }

            if (props.reverse) {
                logs.unshift(entry);
            } else {
                logs.push(entry);
            }
            logListHandler.set(logs);
        }
        props.emitter.onLog(logListener);
    }

    useEffect(() => {
        logListHandler.clear();
    }, [props.emitter])

    useEffect(() => {
        logListHandler.set(props.logs ? props.logs : []);
    }, [props.logs])

    return (
        <div className={'log-panel'}>
            {logs.map((logEntry, ix) => {

                const className = toClass({
                    'log-entry':true,
                    ['status-' + logEntry.level.toLowerCase()]:true
                });

                return (
                    <div className={className} key={`log_entry_${ix}`} >
                        <div className={'date'}>{new Date(logEntry.time).toISOString()}</div>
                        <div className={'type'}>{logEntry.level}</div>
                        <div className={'message'}>{logEntry.message.trim()}</div>
                    </div>
                )
            })}

        </div>
    )
}