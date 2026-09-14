import {build} from 'esbuild';
import {copyFile} from 'node:fs/promises';
await copyFile('LICENSE','packages/browser/LICENSE');
await copyFile('LICENSE','packages/mcp/LICENSE');
await copyFile('README.md','packages/mcp/README.md');
await build({entryPoints:['packages/mcp/src/cli.ts'],outfile:'packages/mcp/dist/cli.js',bundle:true,platform:'node',format:'esm',packages:'external',banner:{js:'#!/usr/bin/env node'}});
await build({entryPoints:['packages/core/src/index.ts'],outfile:'packages/core/dist/index.js',bundle:true,platform:'node',format:'esm',packages:'external'});
await build({entryPoints:['packages/browser/src/worker.ts'],outfile:'packages/browser/dist/worker.js',bundle:true,platform:'node',format:'esm',packages:'external'});
