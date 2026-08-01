const express = require("express");
const app = express();

app.get(
"/", (req, res) => {
res. send("Hello World");
});

app.listen(3000);

/*Powershell
>> curl.exe -i http://localhost:3000/
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: text/html; charset=utf-8
Content-Length: 11
ETag: W/"b-Ck1VqNd45QIvq3AZd8XYQLvEhtA"
Date: Sat, 01 Aug 2026 15:34:12 GMT
Connection: keep-alive
Keep-Alive: timeout=5

Hello World
*/