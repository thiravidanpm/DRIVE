const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/companies', require('./routes/companies'));
app.use('/api/questions', require('./routes/questions'));
app.use('/api/drive', require('./routes/drive'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/coding', require('./routes/coding'))
app.use('/api/profile', require('./routes/profile'))

app.get('/', (req, res) => res.send('DRIVE API running'));

mongoose.connect(process.env.MONGO_URI, {
  ssl: true,
  tls: true,
})
  .then(() => {
    console.log('MongoDB connected');
    app.listen(process.env.PORT, () =>
      console.log(`Server running on port ${process.env.PORT}`)
    );
  })
  .catch(err => console.error(err));