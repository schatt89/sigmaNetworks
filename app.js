const express = require("express");
const app = express();
app.listen(3030, () => console.log('listening at 3030'));

app.use(express.static('public/'));
app.use(express.json('100mb'));

app.post('/api', (request, response) => {
    console.log("I got a request!");
    console.log(request.body);
    const data = request.body;
    response.json({
        status: "success",
        data: data
    });
});

