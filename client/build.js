// @ts-nocheck

import { build, context } from 'esbuild'

const base = '../node_modules/monaco-editor/esm'

const entrypoints = [
    'vs/editor/editor.worker.js',
].map((entrypoint) => `${base}/${entrypoint}`)

void (async () => {
    const production = process.env.NODE_ENV === 'production'
    const watch = process.argv.includes('--watch')
    const opts = production ? { minify: true } : { sourcemap: true }

    // annotate type as BuildOptions

    const monaco = {
        entryPoints: entrypoints,
        bundle: true,
        format: 'esm',
        outbase: base,
        outdir: 'dist',
        logLevel: 'info',
        ...opts,
    }

    const app = {
        entryPoints: ['source/app.jsx'],
        bundle: true,
        format: 'esm',
        outdir: 'dist',
        loader: { '.ttf': 'file' },
        jsxImportSource: 'react',
        jsx: 'automatic',
        logLevel: 'info',
        splitting: true,
        ...opts,
    }

    if (watch) {
        const contexts = await Promise.all([monaco, app].map(context))
        await Promise.all(contexts.map((context) => context.watch()))
    } else {
        await Promise.all([monaco, app].map(build))
    }
})()
