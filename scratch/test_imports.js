// Simulating browser DOM for node import check
global.window = {
    addEventListener: () => {}
};
global.document = {
    addEventListener: () => {},
    getElementById: () => ({
        addEventListener: () => {},
        classList: { toggle: () => {} },
        querySelector: () => ({ addEventListener: () => {} })
    }),
    body: {
        classList: {
            contains: () => false,
            add: () => {},
            remove: () => {}
        }
    }
};
global.localStorage = {
    getItem: () => null,
    setItem: () => {}
};
global.fetch = () => Promise.resolve({
    ok: true,
    json: () => Promise.resolve([])
});

import('../src/app.js').then(() => {
    console.log("SUCCESS: app.js loaded and executed without errors!");
    process.exit(0);
}).catch(err => {
    console.error("FAILURE: Error importing app.js:", err);
    process.exit(1);
});
