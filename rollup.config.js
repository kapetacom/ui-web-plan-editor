import resolve from "@rollup/plugin-node-resolve"
import commonjs from "@rollup/plugin-commonjs"
import typescript from "@rollup/plugin-typescript"
import { terser } from "rollup-plugin-terser"
import external from "rollup-plugin-peer-deps-external"
import styles from "rollup-plugin-styles"
import dts from "rollup-plugin-dts"


const packageJson = require("./package.json")

export default [
    {
        input: "src/index.ts",
        inlineDynamicImports: true,
        output: [
            {
                file: packageJson.main,
                format: "cjs",
                sourcemap: 'inline',
                name: packageJson.name,
            },
            {
                file: packageJson.module,
                format: "esm",
                sourcemap: 'inline',
            }
        ],
        plugins: [
            //sourcemaps(),
            external(),
            resolve(),
            commonjs(),
            typescript({
                tsconfig: "./tsconfig.build.json"
            }),
            styles(),
            terser(),
        ],
    },
    {
        input: "dist/esm/index.d.ts",
        output: [{ file: "dist/index.d.ts", format: "esm" }],
        external: [/\.(css|less)$/],
        plugins: [dts()],
    }
]