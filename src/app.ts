import * as path from 'path'

import * as cors from 'cors'
import * as express from 'express'
import * as logger from 'morgan'

import api from './api'

import bodyParser = require('body-parser')

const app = express()

// create application/json parser
var jsonParser = bodyParser.json()

// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false })

// parse application/json + url encoded
app.use(jsonParser)
app.use(urlencodedParser)

app.use(cors())

app.use(
  '/channels',
  express.static(`D:\\Sites_Backup\\streamvault\\server\\uploads\\thumbnails\\channels`)
)

app.use('/vidz', express.static(`D:\\Sites_Backup\\streamvault\\server\\uploads\\videos`))

app.use(express.urlencoded({ extended: true }))
app.use(logger('dev'))

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')))

// Serve the index.html file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

app.get('/check_health', (req, res) => {
  res.json('<h1>The Node Server is running!</h1>')
})

app.use(api)

export default app
