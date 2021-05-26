const express = require('express');
const app = express();
const port = 3000

const server = app.listen(port, () => {
  console.log(`The server is up and running at https://localhost:${port}`)
});

app.set('view engine', 'pug');
app.set('views', 'views');

app.get('/', (req, res, next) => {
  res.status(200).render('home');
});
