import { NextFunction, Request, Response } from 'express'
import { Types } from 'mongoose'

import * as config from '../config'
import { videoUploadRequest } from '../models/customRequest'
import { User, userModel } from '../models/user'

const fs = require('fs')
const path = require('path')

export const isUserAndChannelExisting = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId: string = req.params.userId ? req.params.userId : req.body.userId
  const channelId: string = req.params.channelId
    ? req.params.channelId
    : req.body.channelId

  userModel.findOne(
    {
      _id: new Types.ObjectId(userId),
      'channels.channelId': new Types.ObjectId(channelId),
    },
    (err: Error, user: User) => {
      if (!user) {
        res.status(404).send({
          errorMessage: 'Invalid User or Channel specified.',
        })
      } else {
        next()
      }
    }
  )
}

export const uploadVideoFile = async (
  req: videoUploadRequest,
  res: Response,
  next: NextFunction
) => {
  const { thumbnail, video } = req.body
  const videoId: Types.ObjectId = new Types.ObjectId(req.params.identifier)

  const thumbnailData = thumbnail.replace(/^data:image\/png;base64,/, '')
  const thumbnailFileName = `${videoId}.png`
  const thumbnailPath = path.join(config.thumbnailPath, thumbnailFileName)
  const thumbnailUrl = `video/thumbnails/${thumbnailFileName}`

  const videoData = video.replace(/^data:video\/mp4;base64,/, '')
  const videoFileName = `${videoId}.mp4`
  const videoPath = path.join(config.videoUploadPath, videoFileName)
  const videoUrl = `videos/${videoFileName}`

  try {
    await Promise.all([
      saveFile(thumbnailData, thumbnailPath),
      saveFile(videoData, videoPath),
    ])

    // Access thumbnailUrl and videoUrl here
    console.log('Thumbnail URL:', thumbnailUrl)
    console.log('Video URL:', videoUrl)

    // Set the values in the request object
    req.thumbnailUrl = thumbnailUrl
    req.videoUrl = videoUrl

    // Call the next middleware
    return next()
  } catch (error) {
    // Catch any errors that occur
    console.error('Error:', error)

    // Set the error status in the response object
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

async function saveFile(data: string, filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, data, 'base64', (error: any) => {
      if (error) {
        reject(error)
      } else {
        resolve(filePath)
      }
    })
  })
}

//#region  Archive
// const validateDataForGetAllVidzRequest = (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   if (!req.params.watchingUserId) {
//     res.status(400).json({
//       message: 'UserId is missing.',
//     })
//   } else {
//     const ip = getClientIp(req)!
//     req.params.watchingUserId =
//       req.params.watchingUserId === 'visitor' ? `vis-${ip}` : req.params.watchingUserId
//     next()
//   }
// }

// router.get(
//   '/:watchingUserId',
//   validateDataForGetAllVidzRequest,
//   async (req: Request, res: Response) => {
//     const serverUrl: string = `${req.protocol}://${req.get('host')}`
//     const watchingUserId: string = req.params.watchingUserId

//     const pipeline = [
//       // Match documents that have at least one video
//       {
//         $match: {
//           'channels.videos': { $exists: true },
//         },
//       },
//       // Unwind the channels array to create a separate document for each channel
//       {
//         $unwind: '$channels',
//       },
//       // Unwind the videos array to create a separate document for each video
//       {
//         $unwind: '$channels.videos',
//       },
//       // Project the fields you want to include in the output
//       {
//         $project: {
//           _id: 0,
//           userId: 1,
//           channelId: '$channels.channelId',
//           videoId: '$channels.videos.videoId',
//           userName: '$streamVault_username',
//           channelName: '$channels.name',
//           title: '$channels.videos.title',
//           description: '$channels.videos.description',
//           url: {
//             $concat: [
//               serverUrl,
//               '/v2/stream/',
//               '$channels.videos.filePath',
//               '/',
//               watchingUserId,
//               '/',
//               '$channels.videos.videoId',
//             ],
//           },
//           thumbnail: {
//             $concat: [serverUrl, '/thumbnails/vidz/', '$channels.videos.thumbnail'],
//           },
//           likes: {
//             $size: {
//               $filter: {
//                 input: '$channels.videos.reactions',
//                 cond: { $eq: ['$$this.reactionType', 'like'] },
//               },
//             },
//           },
//           dislikes: {
//             $size: {
//               $filter: {
//                 input: '$channels.videos.reactions',
//                 cond: { $eq: ['$$this.reactionType', 'dislike'] },
//               },
//             },
//           },

//           yourReaction: {
//             $ifNull: [
//               {
//                 $arrayElemAt: [
//                   {
//                     $filter: {
//                       input: '$channels.videos.reactions',
//                       cond: { $eq: ['$$this.reactingUserId', watchingUserId] },
//                     },
//                   },
//                   0,
//                 ],
//               },
//               { reactionType: null },
//             ],
//           },
//         },
//       },
//     ]

//     const videosList = await userModel.aggregate(pipeline).exec()

//     if (videosList === undefined) {
//       res.status(404).send({
//         status: 404,
//         message: 'No videos found for the specified userId.',
//       })
//     } else {
//       res.status(200).send({
//         status: 200,
//         videosList,
//       })
//     }
//   }
// )
//#endregion
