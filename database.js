let mongoose = require('mongoose');
let userModel = require('./user')

const server = '127.0.0.1:27017';
const database = 'users';

class Database {
  constructor() {
    //Gets rid of deprecated mongoose methods
    mongoose.set('useNewUrlParser', true);
    mongoose.set('useFindAndModify', false);
    mongoose.set('useCreateIndex', true);
    mongoose.set('useUnifiedTopology', true);
    this._connect()
  }

_connect() {
     mongoose.connect(`mongodb://${server}/${database}`)
       .then(() => {
         console.log('Database connection successful')
       })
       .catch(err => {
         console.error('Failed to connect to Mongo database')
       })
  }
}
module.exports = new Database()
