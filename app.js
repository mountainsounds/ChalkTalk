const express = require('express');
const app = express();
const port = 3000

const server = app.listen(port, () => {
  console.log(`The server is up and running at https://localhost:${port}`)
});


app.get('/', (req, res) => {
  res.send('<h1>Hello World!</h1>');
});
