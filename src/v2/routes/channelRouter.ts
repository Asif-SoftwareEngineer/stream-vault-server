import { randomBytes } from 'crypto'

import { NextFunction, Request, Response, Router } from 'express'

import { IChannel } from '../../models/channel'
import { IUser, userModel } from '../../models/user'
import { uploadImage } from '../../controllers/fileUpload-controller'
import { imageModel } from '../../models/image'
import { ImageType } from '../../models/enums'

const router = Router()

// Define a middleware function for validation
const validateData = (req: Request, res: Response, next: NextFunction) => {
  const data = req.body
  if (
    !req.params.userId ||
    !data.name ||
    !data.description ||
    !data.category ||
    !data.tags ||
    !data.handle
  ) {
    res.status(400).json({
      message: 'Channel creation request failed due to insufficient information.',
    })
  } else {
    next()
  }
}

const isUserExisting = (req: Request, res: Response, next: NextFunction) => {
  userModel.findOne({ userId: req.params.userId }, function (err: Error, user: IUser) {
    if (user === null || typeof user === 'undefined') {
      res.status(404).send({
        message: 'Channel creation request failed due to invalid UserId.',
      })
    } else {
      next()
    }
  })
}

const checkForDuplicateChannels = (req: Request, res: Response, next: NextFunction) => {
  userModel.aggregate(
    [
      { $unwind: '$channels' },
      { $group: { _id: '$channels.name', count: { $sum: 1 } } },
      { $match: { count: { $gt: 0 } } },
    ],
    function (err, result) {
      if (err) {
        res.status(400).send({
          message: `Error happened while checking duplicate record for channel name`,
        })
      } else if (result) {
        let isChannelNameExists = result.find(({ _id }) => _id === req.body.name)

        if (isChannelNameExists) {
          res.status(409).send({
            status: 409,
            message: `Duplicate record found! Channel Name:[${isChannelNameExists._id}] already exists!`,
          })
        } else {
          console.log('no duplicate found')
          next()
        }
      } else {
        next()
      }
    }
  )
}

router.get('/', async (req: Request, res: Response) => {
  const pipeline = [
    { $project: { channels: 1, _id: 0 } },
    { $unwind: '$channels' },
    { $replaceRoot: { newRoot: '$channels' } },
  ]
  const channelsList = await userModel.aggregate(pipeline).exec()
  if (channelsList === undefined) {
    res.status(404).send({
      status: 404,
      message: 'No channels found!',
    })
  } else {
    res.status(200).send({
      status: 200,
      channelsList,
    })
  }
})

router.get('/:userId', (req: Request, res: Response) => {
  userModel.findOne(
    {
      userId: req.params.userId,
    },
    function (err: Error, user: IUser) {
      if (user === null || typeof user === 'undefined') {
        res.status(404).send({
          status: 404,
          message: 'No user found with the specified userId.',
        })
      } else {
        const channels = user?.channels
        if (channels === undefined) {
          res.status(404).send({
            status: 404,
            message: 'No channels found for the specified userId.',
          })
        } else {
          res.status(200).send({
            status: 200,
            channels,
          })
        }
      }
    }
  )
})

router.post(
  '/add/:userId',
  validateData,
  isUserExisting,
  checkForDuplicateChannels,
  async (req: Request, res: Response) => {
    const channelObj = req.body as IChannel
    channelObj.channelId = randomBytes(12).toString('hex')
    channelObj.userId = req.params.userId

    const updatedUser = await userModel.findOneAndUpdate(
      { userId: channelObj.userId },
      {
        $addToSet: { channels: { $each: [channelObj] } },
      },
      { returnDocument: 'after' }
    )

    if (!updatedUser) {
      res.status(404).send({
        status: 404,
        message: 'Channel Addition failed!',
      })
    } else {
      res.status(200).send({
        status: 200,
        message: 'Channel has been created successfully.',
        channelAdded: channelObj,
      })
    }
  }
)

router.get('/check/:channelName', (req: Request, res: Response) => {
  userModel.aggregate(
    [
      { $unwind: '$channels' },
      { $group: { _id: '$channels.name', count: { $sum: 1 } } },
      { $match: { count: { $gt: 0 } } },
    ],
    function (err, result) {
      if (err) {
        res.status(400).send({
          message: `Error happened while checking duplicate record for channel name`,
        })
      } else if (result) {
        let isChannelNameExists = result.find(({ _id }) => _id === req.params.channelName)

        if (isChannelNameExists) {
          res.status(409).send({
            status: 409,
            message: `Duplicate record found! Channel Name:[${isChannelNameExists._id}] already exists!`,
          })
        } else {
          res.status(200).json('no duplicate found')
        }
      }
    }
  )
})

router.post(
  '/uploadBannerImage/:userId',
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

      const imageLocation: string = updatedImage!.imageUrl
      const imageUrl: string = imageLocation
        .replace(/\\/g, '/')
        .replace('uploads/banners', 'channel/banner')

      return res.status(200).json({
        status: 200,
        message: 'Banner Image uploaded successfully.', //,
        image: updatedImage,
        imageUrl: imageUrl,
      })
    } catch (error) {
      console.error('Error saving image:', error)
      return res.status(500).json({ error: 'Failed to save banner image.' })
    }
  }
)

export default router
