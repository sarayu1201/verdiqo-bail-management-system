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

const files = [
    '../src/utils/verificationEngine.js',
    '../src/verdiqo_db.js',
    '../src/components/ReportViewer.js',
    '../src/components/DashboardStaff.js',
    '../src/components/DashboardJudge.js',
    '../src/components/DashboardAdmin.js',
    '../src/components/DashboardCitizen.js',
    '../src/app.js'
];

async function run() {
    for (const file of files) {
        try {
            await import(file);
            console.log(`✓ SUCCESS: ${file} loaded fine.`);
        } catch (err) {
            console.error(`✗ FAILURE on ${file}:`, err);
        }
    }
}

run();
