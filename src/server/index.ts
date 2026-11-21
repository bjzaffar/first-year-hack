import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { port } from './config.js';

const app = createApp(fileURLToPath(new URL('../../client', import.meta.url)));
const apiPort = port(process.env.API_PORT, 3001);
const listener = app.listen(apiPort, '127.0.0.1', () => console.log(`FoldLens local server: http://127.0.0.1:${apiPort}`));
listener.on('error', () => { console.error('Could not start local server. Check API_PORT and whether it is already in use.'); process.exitCode = 1; });
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, () => listener.close());
