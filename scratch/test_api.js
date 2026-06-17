const http = require('http');

http.get('http://localhost:8000/api/cases', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('GET response:', data);
    });
}).on('error', (err) => {
    console.error('Error:', err.message);
});
