import { TestServer } from './test-server.js';

const testServer = new TestServer();

before(async () => {
    await testServer.start();
});

after(async () => {
    await testServer.stop();
});
