const mongoose = require('mongoose');
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
    mongoose.connect("mongodb+srv://admin:-vbGzD3Vz6W5423@chalktalkcluster.0mmvw.mongodb.net/ChalkTalkDB?retryWrites=true&w=majority")
      .then(() => {
        console.log('database connection successful!');
      })
      .catch((err) => {
        console.log('database connection Failed!: ', err);
      });
  }
}

module.expoprts = new Database();



