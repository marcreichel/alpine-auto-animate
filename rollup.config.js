import babel from 'rollup-plugin-babel';
import filesize from 'rollup-plugin-filesize';
import resolve from 'rollup-plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';

export default {
    input: 'builds/cdn.js',
    output: [
        {
            file: 'dist/alpine-auto-animate.js',
            format: 'umd',
            sourcemap: true,
        },
        {
            file: 'dist/alpine-auto-animate.min.js',
            format: 'umd',
            plugins: [terser()],
            sourcemap: true,
        }
    ],
    plugins: [
        resolve(),
        filesize(),
        babel({
            babelrc: false,
            exclude: 'node_modules/**',
            presets: [
                [
                    '@babel/preset-env',
                    {
                        targets: {
                            node: 'current',
                        },
                    },
                ],
            ],
        }),
    ],
};
