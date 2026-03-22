const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')

// Only load dotenv in development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/auth', require('./routes/auth'))
app.use('/api/companies', require('./routes/companies'))
app.use('/api/questions', require('./routes/questions'))
app.use('/api/drive', require('./routes/drive'))
app.use('/api/feedback', require('./routes/feedback'))
app.use('/api/coding', require('./routes/coding'))
app.use('/api/answersheet', require('./routes/answersheet'))
app.use('/api/profile', require('./routes/profile'))

app.get('/', (req, res) => res.send('DRIVE API running'))

const PORT = process.env.PORT || 5000

console.log('Starting server...')
console.log('MONGO_URI exists:', !!process.env.MONGO_URI)
console.log('PORT:', PORT)

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected')
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`)
    })
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message)
    process.exit(1)
  })