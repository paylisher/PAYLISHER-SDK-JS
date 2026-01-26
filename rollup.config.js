import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import replace from '@rollup/plugin-replace';
import dotenv from 'dotenv';

dotenv.config();

export default {
    input: 'src/index.ts',
    output: [
        {
            file: 'dist/paylisher.js',
            format: 'umd',
            name: 'Paylisher',
            sourcemap: true,
        },
        {
            file: 'dist/paylisher.min.js',
            format: 'umd',
            name: 'Paylisher',
            plugins: [terser()],
            sourcemap: true,
        },
        {
            file: 'dist/paylisher.esm.js',
            format: 'es',
            sourcemap: true,
        },
    ],
    plugins: [
        resolve(),
        commonjs(),
        typescript({ tsconfig: './tsconfig.json' }),
        replace({
            'process.env.DATA_STUDIO_HOST': JSON.stringify(process.env.DATA_STUDIO_HOST || 'https://ds.i.paylisher.com'),
            'process.env.CAMPAIGN_HOST': JSON.stringify(process.env.CAMPAIGN_HOST || 'https://link.usepublisher.com'),
            preventAssignment: true,
        }),
    ],
};
