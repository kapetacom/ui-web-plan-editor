/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React from 'react';

type OutletConfig<TOutletId extends string, TContext> = {
    [id in TOutletId]: React.FC<TContext>;
};

const rendererContext = React.createContext<{
    outlets: any;
}>({ outlets: {} });

/**
 * Naming comes from React router outlets
 * @param props
 * @constructor
 */
class RendererOutlet<TOutletId extends string, TOutletContext> extends React.Component<
    React.PropsWithChildren<{
        id: TOutletId;
        context: TOutletContext;
    }>,
    {
        hasError?: boolean;
    }
> {
    static contextType = rendererContext;

    static getDerivedStateFromError(error: Error) {
        return { hasError: true };
    }
    constructor(props: any) {
        super(props);
        this.state = {};
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // eslint-disable-next-line no-console
        console.error('Error rendering outlet', error, errorInfo);
    }

    render() {
        const ctx = this.context as { outlets: OutletConfig<TOutletId, TOutletContext> };

        if (this.state.hasError) {
            return <div>Failed to render outlet.</div>;
        }

        if (ctx.outlets[this.props.id]) {
            const Component = ctx.outlets[this.props.id];
            // render as component in order to allow hooks in the outlet code
            // @ts-ignore - ignore intrinsicAttributes error
            return <Component {...this.props.context} />;
        }
        return <>{this.props.children}</>;
    }
}

const RendererProvider = <TOutletIds extends string, TContext>(
    props: React.PropsWithChildren<{
        outlets: {
            [k in TOutletIds]?: (context: TContext) => JSX.Element;
        };
    }>
) => {
    return <rendererContext.Provider value={{ outlets: props.outlets }}>{props.children}</rendererContext.Provider>;
};

/**
 * Create an instance of the renderer w/ the known outlets
 * Helps with type safety, by only allowing outlet ids that exist
 */
export const initRenderer = <TContext, TOutletId extends string = string>() => {
    return {
        Provider: RendererProvider as typeof RendererProvider<TOutletId, TContext>,
        Outlet: RendererOutlet as typeof RendererOutlet<TOutletId, TContext>,
    };
};
