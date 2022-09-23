import { ChildProcess, fork } from 'child_process';
import { createConnection } from 'net';

import { runtime } from './runtime.js';

/**
 * Local HTTP server is used as a test CDN for loading module definitions over network.
 */
let httpServer: ChildProcess;

before(async () => {
    httpServer = fork('node_modules/.bin/http-server',
        ['-p', String(runtime.httpPort)],
        {
            stdio: 'ignore'
        });
    await waitForPort(runtime.httpPort);
});

after(async () => {
    httpServer.kill('SIGTERM');
    await new Promise(r => httpServer.on('exit', r));
});

async function waitForPort(port: number, timeout = 5000) {
    const timeoutAt = Date.now() + timeout;
    let lastError;
    while (Date.now() < timeoutAt) {
        try {
            return await tryConnect(port);
        } catch (err) {
            lastError = err;
            await new Promise(r => setTimeout(r, 100));
        }
    }
    throw lastError;
}

function tryConnect(port: number) {
    return new Promise<void>((resolve, reject) => {
        const onConnect = () => {
            socket.destroy();
            resolve();
        };
        const onError = (err: Error) => {
            socket.destroy();
            reject(err);
        };
        const socket = createConnection({
            host: '127.0.0.1',
            port,
        });
        socket.on('connect', onConnect);
        socket.on('error', onError);
    });
}
