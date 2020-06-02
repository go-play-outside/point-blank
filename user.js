let mongoose = require('mongoose')
let validator = require('validator')

let userSchema = new mongoose.Schema({
  username: String,
  password: String,
  points: Number,
  games: Number
})

module.exports = mongoose.model('User', userSchema)
