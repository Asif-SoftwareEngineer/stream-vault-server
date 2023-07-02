import * as util from 'util'

import * as multer from 'multer'

let videoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Uploads is the Upload_folder_name
    cb(null, 'uploads/videos')
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

const maxSizeVideo = 900 * 1024 * 1024

let uploadVideoFile = util.promisify(
  multer({
    storage: videoStorage,
    limits: { fileSize: maxSizeVideo },
  }).single('file')
)
//-----------------------------------------------------------------------------

// Set up multer storage configuration for an Image File
const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Get the imageType parameter from the request object
    const imageType = req.params.imageType

    // Specify the base upload directory
    let uploadDirectory = 'uploads/'

    // Check the imageType and update the upload directory accordingly
    if (imageType === 'banner') {
      uploadDirectory += 'banners/'
    } else if (imageType === 'profile') {
      uploadDirectory += 'profiles/'
    } else if (imageType === 'thumbnail') {
      uploadDirectory += 'thumbnails/'
    } else {
      // Handle invalid imageType value or set a default directory
      uploadDirectory += 'default/'
    }

    // Pass the updated upload directory to the cb function
    cb(null, uploadDirectory)
  },
  filename: function (req, file, cb) {
    const fileName = file.originalname
    const fileTypes = ['PNG', 'GIF', 'JPEG', 'JPG']

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

// Initialize multer upload

let uploadImageFile = util.promisify(multer({ storage: imageStorage }).single('file'))

const fileUploadMiddleWare = {
  uploadVideoFile,
  uploadImageFile,
}

export default fileUploadMiddleWare
