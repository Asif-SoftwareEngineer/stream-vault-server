import { Request, Response, Router } from 'express'
import { Types } from 'mongoose'

import { newVideoApiValidator } from '../../controllers/data-validator.controller'
import {
  isUserAndChannelExisting,
  uploadVideoFile,
} from '../../controllers/video.controller'
import { videoUploadRequest } from '../../models/customRequest'
import { VideoPublishStage } from '../../models/enums'
import { videoModel } from '../../models/video'

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
    res.status(500).json({ error: 'Internal Server Error' })
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
      video.likes = likes
      video.dislikes = dislikes
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
