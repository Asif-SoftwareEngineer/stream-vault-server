import * as path from 'path'

import * as bodyParser from 'body-parser'
import * as cors from 'cors'
import * as express from 'express'

import api from './api'

//import * as requestIp from 'request-ip'

const app = express()

let jsonParser = bodyParser.json()

let urlencodedParser = bodyParser.urlencoded({ extended: false })

app.use(jsonParser)
app.use(urlencodedParser)

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

app.use('/channel/banner', express.static(path.join('uploads', 'banners')))

//---------------

app.use(
  '/thumbnails/channels',
  express.static(path.join('uploads', 'thumbnails', 'channels'))
)

app.use('/thumbnails/vidz', express.static(path.join('uploads', 'thumbnails', 'videos')))

app.use('/vidz', express.static(path.join('uploads', 'videos')))

app.use('/stream/:file', express.static(path.join('uploads', 'videos')))

app.use(express.urlencoded({ extended: true }))

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')))

// Serve the index.html file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

app.get('/check_health', (req, res) => {
  res.json('The Node Server is running!')
})

app.use(api)

export default app
