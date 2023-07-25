import * as path from 'path'

import * as bodyParser from 'body-parser'
import * as cors from 'cors'
import * as express from 'express'

import api from './api'

//import * as requestIp from 'request-ip'

const app = express()

app.use(bodyParser.json({ limit: '2048mb' }))
app.use(bodyParser.urlencoded({ limit: '2048mb', extended: true }))

// let corsOptions = {
//   origin: 'http://localhost:4200',
// }
// app.use(cors(corsOptions))

app.use(
  cors({
    origin: '*',
  })
)

app.set('trust proxy', true)

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')))

// Serve the index.html file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

app.get('/', (req, res) => {
  res.json('This is the backend server for Streamvault Application!')
})

app.use(api)

export default app
