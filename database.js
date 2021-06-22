const mongoose = require('mongoose');
const MONGO_KEY = require('./config.js');
mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useUnifiedTopology', true);
mongoose.set('useCreateIndex', true);



class Database {

  constructor() {
    this.connect();
  }

  connect() {
    mongoose.connect(MONGO_KEY.MONGO_KEY)
      .then(() => {
        console.log('database connection successful!');
      })
      .catch((err) => {
        console.log('database connection Failed!: ', err);
      });
  }
}

module.exports = new Database();



