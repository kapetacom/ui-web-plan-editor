module.exports = {
    stories: ['../stories/**/*.stories.tsx'],
    core: {
        builder: 'webpack5',
        disableTelemetry: true, // 👈 Disables telemetry
    },
    addons: ['@storybook/addon-controls'],
};
