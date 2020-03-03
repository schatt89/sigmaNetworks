const express = require("express");
const app = express();
const PORT = process.env.PORT || 7000;
app.listen(PORT, () => console.log(`Listening on ${ PORT }`));

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

