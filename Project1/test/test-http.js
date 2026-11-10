const http = require('http');

http.get('http://localhost:3000/', (res) => {
  console.log('Status code for /:', res.statusCode);
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    console.log('Body length:', data.length);
    console.log('Snippet:', data.substring(0, 100));
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
});
