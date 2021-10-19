require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const app = express();

const sVote = require('./models/vote');

mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_URL}/${process.env.DB_NAME}?retryWrites=true&w=majority`,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log('DB is OK'))
  .catch(() => console.log('DB failed'));


app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', '*');
  next();
});

app.use(express.json());


app.post('/votes', (req, res, next) => {

  const vote = new sVote({ ...req.body });
  vote.save().then(() => {
    res.status(201).json({
      message: 'Vote enregistrée'
    })
  }).catch((error) => {
    res.status(400).json({ error })
  })
});

app.get('/votes', (req, res, next) => {
  sVote.find()
    .then(votes => res.status(200).json(votes))
    .catch(error => res.status(400).json({ error }));
});

app.get('/votes/:id', (req, res, next) => {
  sVote.findOne({ _id: req.params.id })
    .then(thing => res.status(200).json(thing))
    .catch(error => res.status(404).json({ error }));
});

app.put('/votes/:id', (req, res, next) => {
  sVote.updateOne({ _id: req.params.id }, { ...req.body, _id: req.params.id })
    .then(() => res.status(200).json({ message: 'Vote modifiée' }))
    .catch(error => res.status(400).json({ error }));
});

app.delete('/votes/:id', (req, res, next) => {
  sVote.deleteOne({ _id: req.params.id })
    .then(() => res.status(200).json({ message: 'Vote supprimée' }))
    .catch(error => res.status(400).json({ error }));
});

module.exports = app;