const { rollup } = require('rollup');
const commonjs = require('@rollup/plugin-commonjs');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const { minify } = require('terser');
const fs = require('fs');

async function build() {
    try {
        const bundle = await rollup({
            input: 'node_modules/@octokit/rest/dist-src/index.js',
            plugins: [nodeResolve(), commonjs()]
        });
        const { output } = await bundle.generate({ format: 'iife', name: 'Octokit' });
        const minified = await minify(output[0].code, { compress: true, mangle: true });
        fs.writeFileSync('admin/octokit.min.js', minified.code);
        console.log('octokit.min.js created in admin/');
    } catch (error) {
        console.error('Build failed:', error);
    }
}
build();