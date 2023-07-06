import { NextFunction, Request, Response, Router } from 'express'
import { Types } from 'mongoose'
import { getClientIp } from 'request-ip'

import { uploadVideo } from '../../controllers/fileUpload-controller'
import { userModel } from '../../models/user'
import { videoModel } from '../../models/video'

//import * as config from '../../config'
import { VideoPublishStage, VideoUploadStatus } from '../../models/enums'
import { isUserAndChannelExisting } from '../../controllers/video.controller'

//const fs = require('fs')
//const path = require('path')
const { ObjectId } = require('mongodb')

const router = Router()

const validateDataForGetAllVidzRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.params.watchingUserId) {
    res.status(400).json({
      message: 'UserId is missing.',
    })
  } else {
    const ip = getClientIp(req)!
    req.params.watchingUserId =
      req.params.watchingUserId === 'visitor' ? `vis-${ip}` : req.params.watchingUserId
    next()
  }
}

const validateVideoAddRequest = (req: Request, res: Response, next: NextFunction) => {
  const data = req.body

  if (
    !req.params.userId ||
    !req.params.channelId ||
    !data.title ||
    !data.description ||
    !data.category ||
    !data.tags
  ) {
    res.status(400).json({
      message: 'Video creation request failed due to insufficient information.',
    })
  } else {
    next()
  }
}

router.get(
  '/:watchingUserId',
  validateDataForGetAllVidzRequest,
  async (req: Request, res: Response) => {
    const serverUrl: string = `${req.protocol}://${req.get('host')}`
    const watchingUserId: string = req.params.watchingUserId

    const pipeline = [
      // Match documents that have at least one video
      {
        $match: {
          'channels.videos': { $exists: true },
        },
      },
      // Unwind the channels array to create a separate document for each channel
      {
        $unwind: '$channels',
      },
      // Unwind the videos array to create a separate document for each video
      {
        $unwind: '$channels.videos',
      },
      // Project the fields you want to include in the output
      {
        $project: {
          _id: 0,
          userId: 1,
          channelId: '$channels.channelId',
          videoId: '$channels.videos.videoId',
          userName: '$streamVault_username',
          channelName: '$channels.name',
          title: '$channels.videos.title',
          description: '$channels.videos.description',
          url: {
            $concat: [
              serverUrl,
              '/v2/stream/',
              '$channels.videos.filePath',
              '/',
              watchingUserId,
              '/',
              '$channels.videos.videoId',
            ],
          },
          thumbnail: {
            $concat: [serverUrl, '/thumbnails/vidz/', '$channels.videos.thumbnail'],
          },
          likes: {
            $size: {
              $filter: {
                input: '$channels.videos.reactions',
                cond: { $eq: ['$$this.reactionType', 'like'] },
              },
            },
          },
          dislikes: {
            $size: {
              $filter: {
                input: '$channels.videos.reactions',
                cond: { $eq: ['$$this.reactionType', 'dislike'] },
              },
            },
          },

          yourReaction: {
            $ifNull: [
              {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: '$channels.videos.reactions',
                      cond: { $eq: ['$$this.reactingUserId', watchingUserId] },
                    },
                  },
                  0,
                ],
              },
              { reactionType: null },
            ],
          },
        },
      },
    ]

    const videosList = await userModel.aggregate(pipeline).exec()

    if (videosList === undefined) {
      res.status(404).send({
        status: 404,
        message: 'No videos found for the specified userId.',
      })
    } else {
      res.status(200).send({
        status: 200,
        videosList,
      })
    }
  }
)

router.post(
  '/add/:userId/:channelId',
  validateVideoAddRequest,
  isUserAndChannelExisting,
  async (req: Request, res: Response) => {
    try {
      const {
        userId,
        channelId,
        title,
        description,
        category,
        likes,
        dislikes,
        comments,
        duration,
        videoPathUrl,
        thumbnailImageUrl,
        audience,
        visibility,
        commentsPreference,
        language,
        location,
        approved,
      } = req.body

      // Create a new video object
      const video = new videoModel({
        userId: new Types.ObjectId(userId),
        channelId: new Types.ObjectId(channelId),
        title,
        description,
        category,
        likes,
        dislikes,
        comments,
        duration,
        videoPathUrl,
        thumbnailImageUrl,
        audience,
        visibility,
        commentsPreference,
        language,
        location,
        approved,
      })

      // Save the video to the database
      const savedVideo = await video.save()

      res.status(201).json(savedVideo)
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: 'An error occurred while creating the video.' })
    }
  }
)

router.post(
  '/uploadVideo/:userId/:channelId',
  isUserAndChannelExisting,
  async (req: Request, res: Response) => {
    try {
      //const { thumbnail, video } = req.body
      const { userId, channelId } = req.params
      const videoId: Types.ObjectId = new ObjectId()

      //const thumbnailData = thumbnail.replace(/^data:image\/png;base64,/, '')
      const thumbnailFileName = `${videoId}.png`
      //const thumbnailPath = path.join(config.thumbnailPath, thumbnailFileName)
      const thumbnailUrl = `video/thumbnails/${thumbnailFileName}`

      //const videoData = video.replace(/^data:video\/mp4;base64,/, '')
      const videoFileName = `${videoId}.mp4`
      //const videoPath = path.join(config.videoUploadPath, videoFileName)
      const videoUrl = `videos/${videoFileName}`

      // await Promise.all([
      //   saveFile(thumbnailData, thumbnailPath),
      //   saveFile(videoData, videoPath),
      // ])

      const videoObj = new videoModel({
        userId: new Types.ObjectId(userId),
        channelId: new Types.ObjectId(channelId),
        title: 'dummy-title',
        description: 'dummy-description',
        category: 'dummy-category',
        likes: [],
        dislikes: [],
        comments: [],
        duration: 0,
        videoPathUrl: videoUrl,
        thumbnailImageUrl: thumbnailUrl,
        audience: 'dummy-audience',
        visibility: 'dummy-visibility',
        commentsPreference: 'commentsPreference',
        language: 'dummy-language',
        location: 'dummy-location',
        uploadStatus: VideoUploadStatus.Completed,
        publishStage: VideoPublishStage.Uploaded,
      })

      //const savedVideo = await videoObj.save()

      if (videoObj) {
        res.status(201).json({
          status: 201,
          video: videoObj,
          message: 'Video uploaded successfully.',
        })
      }
    } catch (error) {
      console.error('Error uploading video:', error)
      res.status(500).json({
        status: 500,
        errorMessage: 'Internal server error.',
      })
    }
  }
)

router.post('/upload/:userId/:channelId', uploadVideo)

// async function saveFile(data: string, filePath: string): Promise<string> {
//   return new Promise((resolve, reject) => {
//     fs.writeFile(filePath, data, 'base64', (error: any) => {
//       if (error) {
//         reject(error)
//       } else {
//         resolve(filePath)
//       }
//     })
//   })
// }

export default router
