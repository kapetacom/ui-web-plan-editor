import React from 'react';

type OutletConfig<TOutletId extends string, TContext> = {
    [id in TOutletId]: (context: TContext) => JSX.Element;
};

const rendererContext = React.createContext<{
    outlets: any;
}>({ outlets: {} });

/**
 * Naming comes from React router outlets
 * @param props
 * @constructor
 */
const RendererOutlet = <TOutletId extends string, TOutletContext>(
    props: React.PropsWithChildren<{ id: TOutletId; context: TOutletContext }>
): JSX.Element => {
    const ctx: { outlets: OutletConfig<TOutletId, TOutletContext> } = useContext(rendererContext);

    if (ctx.outlets[props.id]) {
        return ctx.outlets[props.id](props.context);
    }
    return <>{props.children}</>;
};

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
