import { Request, Response, Router } from 'express'

import { uploadImage } from '../../controllers/fileUpload-controller'
import { ImageType } from '../../models/enums'
import { imageModel } from '../../models/image'

const { ObjectId } = require('bson')

const router = Router()

router.post(
  '/uploadImage/:imageType/:fileNameIdentifier',
  uploadImage,
  async (req: Request, res: Response) => {
    try {
      if (req.file == undefined) {
        return res.status(422).json({ error: 'No image file provided.' })
      }

      const filter = { userId: req.params.userId, type: ImageType.ChannelBanner }

      const update = {
        fileName: req.file?.filename,
        userId: req.params.userId,
        type: ImageType.ChannelBanner,
        imageUrl: req.file?.path,
      }

      const options = {
        upsert: true, // Create a new document if it doesn't exist
        new: true, // Return the updated document
      }

      const updatedImage = await imageModel.findOneAndUpdate(filter, update, options)

      // construct the url for the banner image

      const imageUrl: string = req.file.path
        .replace(/\\/g, '/') // Replace backslashes with forward slashes (for Windows file paths)
        .replace('uploads/banners', 'channel/banners')
        .replace('uploads/thumbnails', 'video/thumbnails')
        .replace('uploads/profiles', 'channel/profiles')

      return res.status(200).json({
        status: 200,
        message: `${req.params.imageType} Image uploaded successfully.`,
        image: updatedImage,
        imageUrl: imageUrl,
      })
    } catch (error) {
      console.error('Error saving image:', error)
      return res.status(500).json({ error: 'Failed to save banner image.' })
    }
  }
)

router.get('/generateObjectId', (req, res) => {
  const objectId = new ObjectId().toHexString()
  console.log(objectId)
  res.json({ objectId })
})

export default router
