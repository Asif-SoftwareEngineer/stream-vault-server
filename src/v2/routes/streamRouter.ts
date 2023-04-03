import * as fs from 'fs'
import * as path from 'path'

import axios from 'axios'
import { NextFunction, Request, Response, Router } from 'express'
import { getClientIp } from 'request-ip'

import * as config from '../../config'
import { errorLogger } from '../../loggers'
import { LogEventType } from '../../models/enums'

const router = Router()

router.get(
  '/:file/:userId/:videoId',
  (req: Request, res: Response, next: NextFunction) => {
    //
    // 1. Path to the movie to stream

    //

    if (!req.params.file || !req.params.userId) return

    const fileName = req.params.file

    const extension = path.extname(fileName).substring(1)

    const file = path.join(process.cwd(), 'uploads', 'videos', `${fileName}`)

    //
    // 2. Get meta information from the file. In this case we are interested
    //    in its size.
    //

    fs.stat(file, async (err, stats) => {
      //
      // 1. If there was an error reading the file stats we inform the
      //    browser of what actual happened
      //
      if (err) {
        //
        // 1. Check if the file exists
        //
        if (err.code === 'ENOENT') {
          //
          // -> 404 Error if file not found
          //
          errorLogger.error('Video File not Found')

          return res.sendStatus(404)
        }

        //
        // 2. In any other case, just output the full error
        //
        return next(err)
      }

      //
      // 2. Save the range the browser is asking for in a clear and
      //    reusable variable
      //
      //    The range tells us what part of the file the browser wants
      //    in bytes.
      //
      //    EXAMPLE: bytes=65534-33357823
      //
      const range = req.headers.range

      //
      // 3. Make sure the browser asks for a range to be sent.
      //
      if (!range) {
        //
        // 1. Create the error
        //
        const err = new Error('Wrong range')
        //err = 416;

        //
        // -> Send the error and stop the request.
        //
        return next(err)
      }

      //
      // 4. Convert the string range into an array for easy use.
      //
      const positions = range.replace(/bytes=/, '').split('-')

      //
      // 5. Convert the start value into an integer
      //
      const start = parseInt(positions[0], 10)

      //
      // 6. Save the total file size into a clear variable
      //
      const file_size = stats.size

      //
      // 7. IF    the end parameter is present we convert it into an
      //          integer, the same way we did the start position
      //
      //    ELSE  We use the file_size variable as the last part to be
      //          sent.
      //
      const end = positions[1] ? parseInt(positions[1], 10) : file_size - 1

      //
      // 8. Calculate the amount of bits that will be sent back to the
      //    browser.
      //
      const chunksize = end - start + 1

      //
      // 9. Create the header for the video tag so it knows what is
      //    receiving.
      //
      const head = {
        'Content-Range': `bytes ${start}-${end}/${file_size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': `video/${extension}`,
      }

      //
      // 10. Send the custom header
      //
      res.writeHead(206, head)

      //
      // 11. Create the createReadStream option object so createReadStream
      //     knows how much data it should read from the file.
      //
      const stream_position = {
        start,
        end,
      }

      if (start === 0) {
        //Log Video Stream Initialization
        try {
          // Make a POST request to the /userAction endpoint with the data from the request body

          const userId: string = req.params.userId
          const eventType: string = LogEventType.StreamInit
          const videoId: string = req.params.videoId

          const url = config.server_url
          const clientIp: string = getClientIp(req)
          await axios.post(`${url}/v2/log/videoAction`, {
            userId,
            eventType,
            videoId,
            clientIp,
          })
        } catch (error) {
          errorLogger.error(error)
        }
      }

      //	12.	Create a stream chunk based on what the browser asked us for
      //
      let stream = fs.createReadStream(file, stream_position)

      //
      //	13.	Once the stream is open, we pipe the data through the response
      //		object.
      //
      stream.on('open', function () {
        stream.pipe(res)
      })

      //
      //	->	If there was an error while opening a stream we stop the
      //		request and display it.
      //
      stream.on('error', function (err) {
        return next(err)
      })
    })
  }
)

export default router
