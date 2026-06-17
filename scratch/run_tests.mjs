import { runTests } from './testVerification.js';

const results = runTests((msg, type) => {
    if (type === 'success') {
        console.log(`\x1b[32m${msg}\x1b[0m`);
    } else if (type === 'danger') {
        console.log(`\x1b[31m${msg}\x1b[0m`);
    } else if (type === 'info') {
        console.log(`\x1b[33m${msg}\x1b[0m`);
    } else {
        console.log(msg);
    }
});

if (results.failed > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
