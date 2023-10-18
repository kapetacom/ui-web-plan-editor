import type { StorybookConfig } from '@storybook/react-webpack5';
import lessPreprocessor from 'less';

const config: StorybookConfig = {
    stories: ['../stories/**/*.stories.tsx'],

    framework: {
        name: '@storybook/react-webpack5',
        options: {},
    },

    addons: [
        '@storybook/addon-essentials',
        {
            name: '@storybook/addon-styling-webpack',

            options: {
                rules: [
                    {
                        test: /\.css$/,
                        sideEffects: true,
                        use: [
                            require.resolve('style-loader'),
                            {
                                loader: require.resolve('css-loader'),
                                options: {},
                            },
                        ],
                    },
                    {
                        test: /\.less$/,
                        sideEffects: true,
                        use: [
                            require.resolve('style-loader'),
                            {
                                loader: require.resolve('css-loader'),
                                options: {},
                            },
                            require.resolve('less-loader'),
                        ],
                    },
                ],
            },
        },
    ],

    webpackFinal: async (config, { configType }) => {
        if (config.module && config.module.rules) {
            config.module.rules.push({
                test: /\.ya?ml$/,
                use: ['json-loader', 'yaml-loader'],
            });
        }
        config.resolve!.extensions!.push('.less');

        return config;
    },
};

export default config;
