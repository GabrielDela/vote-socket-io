const mongoose = require('mongoose');

const VoteSchema = mongoose.Schema({
  question: { type: String, required: true },
  proposition1: { type: String, required: true },
  proposition2: { type: String, required: true },
  count1: { type: Number, required: true },
  count2: { type: Number, required: true },
});

module.exports = mongoose.model('Vote', VoteSchema);