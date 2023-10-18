import { Preview } from '@storybook/react';
import { configure } from 'mobx';
import { MemoryRouter } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { lightTheme, darkTheme } from '@kapeta/style';
import { useMemo } from 'react';
import './styles.less';

configure({
    enforceActions: 'always',
    computedRequiresReaction: true,
    reactionRequiresObservable: true,
    observableRequiresReaction: true,
    disableErrorBoundaries: true,
});

// Add your theme configurations to an object that you can
// pull your desired theme from.
const THEMES = {
    // TODO: fix theme json to match mui theme
    light: createTheme(lightTheme as any),
    dark: createTheme(darkTheme as any),
};

export const withMuiTheme = (Story, context) => {
    // The theme global we just declared
    const { theme: themeKey } = context.globals;

    // only recompute the theme if the themeKey changes
    const theme = useMemo(() => THEMES[themeKey] || THEMES['light'], [themeKey]);

    return (
        <div>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <MemoryRouter>
                    <Story />
                </MemoryRouter>
            </ThemeProvider>
        </div>
    );
};

const preview: Preview = {
    parameters: {
        actions: { argTypesRegex: '^on[A-Z].*' },
    },
    globalTypes: {
        theme: {
            name: 'Theme',
            title: 'Theme',
            description: 'Theme for our components',
            defaultValue: 'light',
            toolbar: {
                icon: 'paintbrush',
                dynamicTitle: true,
                items: [
                    { value: 'light', left: '☀️', title: 'Light mode' },
                    { value: 'dark', left: '🌙', title: 'Dark mode' },
                ],
            },
        },
    },
    decorators: [withMuiTheme],
};

export default preview;

window['__DEV__'] = true;
