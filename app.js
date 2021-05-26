const express = require('express');
const app = express();
const port = 3000
const middleware = require('./middleware');

const server = app.listen(port, () => {
  console.log(`The server is up and running at https://localhost:${port}`)
});

app.set('view engine', 'pug');
app.set('views', 'views');

// Routes
const loginRoute = require('./routes/loginRoutes');

app.use('/login', loginRoute);

app.get('/', middleware.requireLogin, (req, res, next) => {
  let payload = {
    pageTitle: 'Home',
  }
  res.status(200).render('home', payload);
});
