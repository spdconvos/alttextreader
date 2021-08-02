const express = require('express');
const app = express();

app.use(express.static('/public'));

app.get("/", (req, resp) => {
    resp.sendFile(__dirname + '/views/index.html');
});

const listener = app.listen(process.env.PORT, () => {
    console.log(`Started up on port: ${listener.address}`);
});