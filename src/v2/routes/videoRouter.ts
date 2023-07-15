import { Request, Response, Router } from 'express'
import { Types } from 'mongoose'

import { newVideoApiValidator } from '../../controllers/data-validator.controller'
import {
  isUserAndChannelExisting,
  uploadVideoFile,
} from '../../controllers/video.controller'
import { videoUploadRequest } from '../../models/customRequest'
import { VideoPublishStage } from '../../models/enums'
import { VideoView, videoModel } from '../../models/video'

import dayjs = require('dayjs')

const router = Router()

router.get('/:videoId', async (req: Request, res: Response) => {
  try {
    const videoId: string = req.params.videoId
    console.log('Video ID: ' + videoId)
    const video = await videoModel.findById(videoId)

    if (!video) {
      res.status(404).json({ errorMessage: 'Video not found!' })
    }

    res.status(200).json({
      status: 200,
      video,
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ errorMessage: 'Internal Server Error' })
  }
})

router.get('/', async (req: Request, res: Response) => {
  try {
    const videoViews: VideoView[] = await videoModel.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: '$user',
      },
      {
        $lookup: {
          from: 'users',
          localField: 'channelId',
          foreignField: 'channels.channelId',
          as: 'channel',
        },
      },
      {
        $unwind: '$channel',
      },
      {
        $project: {
          videoId: '$_id',
          userId: '$userId',
          channelId: '$channelId',
          userName: '$user.userName',
          channelName: {
            $filter: {
              input: '$user.channels',
              as: 'channel',
              cond: { $eq: ['$$channel.channelId', '$channelId'] },
            },
          },
          title: '$title',
          description: '$description',
          url: '$videoPathUrl',
          thumbnail: '$thumbnailImageUrl',
          comments: '$comments',
          reactions: '$reactions',
        },
      },
      {
        $unwind: '$channelName',
      },
      {
        $project: {
          videoId: 1,
          userId: 1,
          channelId: 1,
          userName: 1,
          channelName: '$channelName.name',
          channelProfileImage: '$channelName.profileImageUrl',
          title: 1,
          description: 1,
          url: 1,
          thumbnail: 1,
          comments: 1,
          reactions: 1,
        },
      },
    ])

    if (videoViews.length === 0) {
      return res.status(404).json({ errorMessage: 'No Videos found!' })
    }

    return res.status(200).json(videoViews)
  } catch (error) {
    console.error('Error:', error)
    return res.status(500).json({ errorMessage: 'Internal Server Error' })
  }
})

router.post(
  '/addVideoDocument',
  newVideoApiValidator,
  isUserAndChannelExisting,
  async (req: Request, res: Response) => {
    try {
      const {
        videoId,
        userId,
        channelId,
        title,
        description,
        category,
        reactions,
        comments,
        duration,
        videoPathUrl,
        thumbnailImageUrl,
        audience,
        visibility,
        commentsPreference,
        language,
        location,
      } = req.body

      // Find the video document by videoId
      const video = await videoModel.findById(videoId)

      if (!video) {
        return res.status(404).json({
          status: 404,
          errorMessage: 'Video not found.',
        })
      }

      // Update the video object
      video.userId = new Types.ObjectId(userId)
      video.channelId = new Types.ObjectId(channelId)
      video.title = title
      video.description = description
      video.category = category
      video.reactions = reactions
      video.comments = comments
      video.duration = duration
      video.videoPathUrl = videoPathUrl
      video.thumbnailImageUrl = thumbnailImageUrl
      video.audience = audience
      video.visibility = visibility
      video.commentsPreference = commentsPreference
      video.language = language
      video.location = location
      video.publishStage = VideoPublishStage.InformationAdded

      // Save the updated video to the database
      const updatedVideo = await video.save()

      return res.status(200).json({
        status: 200,
        message:
          'The uploaded video is currently undergoing review by our content validation team [Validators] and advanced artificial intelligence models. Once the content is verified and approved, it will be published promptly for your audience to enjoy. We appreciate your patience during this process to ensure the highest quality and compliance with our content standards.',
        updatedVideo,
      })
    } catch (error) {
      console.error(error)
      return res.status(500).json({
        status: 500,
        errorMessage: 'An error occurred while updating the video.',
      })
    }
  }
)

router.post(
  '/uploadVideo/:userId/:channelId/:identifier',
  isUserAndChannelExisting,
  uploadVideoFile,
  async (req: videoUploadRequest, res: Response) => {
    try {
      const videoObj = new videoModel({
        _id: new Types.ObjectId(req.params.identifier),
        userId: new Types.ObjectId(req.params.userId),
        channelId: new Types.ObjectId(req.params.channelId),
        title: 'dummy-title',
        description: 'dummy-description',
        category: 'dummy-category',
        likes: [],
        dislikes: [],
        comments: [],
        duration: 0,
        videoPathUrl: req.videoUrl,
        thumbnailImageUrl: req.thumbnailUrl,
        audience: 'dummy-audience',
        visibility: 'dummy-visibility',
        commentsPreference: 'commentsPreference',
        language: 'dummy-language',
        location: 'dummy-location',
        publishStage: VideoPublishStage.Uploaded,
        uploadDate: dayjs().startOf('day').toDate(),
      })

      const savedVideo = await videoObj.save()

      if (savedVideo) {
        res.status(201).json({
          status: 201,
          video: savedVideo,
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

export default router
