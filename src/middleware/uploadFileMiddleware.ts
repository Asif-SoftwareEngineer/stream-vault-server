//import { NextFunction, Request, Response, Router } from 'express'

import * as multer from 'multer'

//import path = require('path')
import util = require('util')

let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Uploads is the Upload_folder_name
    cb(null, 'uploads')
  },
  filename: function (req, file, cb) {
    const fileName = file.originalname
    const fileTypes = ['MP4', 'AVI', 'MOV', 'WMV', 'FLV', 'MKV', 'M4V', 'MPG']

    // Extract the file extension using a regular expression
    const fileExtension: string = fileName.match(/\.(.{3})$/)?.[1]?.toUpperCase() || ''

    // Check if the extracted extension matches any element of the fileTypes array
    const isFileTypeMatched = fileTypes.includes(fileExtension)

    if (isFileTypeMatched) {
      cb(null, `${req.params.userId}-${file.fieldname}-${Date.now()}.${fileExtension}`)
    } else {
      cb(
        Error(
          `File upload only supports the following filetypes - $ ${fileTypes.join('|')}`
        ),
        ''
      )
    }
  },
})

const maxSize = 900 * 1024 * 1024

let uploadFile = multer({
  storage: storage,
  limits: { fileSize: maxSize },
}).single('file')

let uploadFileMiddleware = util.promisify(uploadFile)

export default uploadFileMiddleware
