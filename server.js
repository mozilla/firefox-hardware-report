const http = require('http');


const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    res.writeHead(302, {
        Location: 'https://data.firefox.com/dashboard/hardware',
    });
    res.end();
});

server.listen(port, () => console.log(`Listening on port ${port}...`));
