const http = require('http');
const cookie = require('cookie');

http.createServer((req, res) => {
    console.log("req.headers.cookie", req.headers.cookie);

    let cookies = {};
    if (req.headers.cookie !== undefined) {
        cookies = cookie.parse(req.headers.cookie);
    }
   
    console.log("yummy_cookie", cookies.yummy_cookie);

    res.writeHead(200, {
        'Set-Cookie': ['yummy_cookie=choco', 'tasty_cookie=strawberry']
    });

    res.end('Cookie!');
}).listen(3000);