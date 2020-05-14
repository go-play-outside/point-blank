let mongoose = require('mongoose')
let validator = require('validator')

let userSchema = new mongoose.Schema({
  username: String,
  password: String
})

module.exports = mongoose.model('User', userSchema)
