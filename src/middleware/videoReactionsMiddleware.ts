import { NextFunction, Request, Response } from 'express'
import { getClientIp } from 'request-ip'

import { userModel } from '../models/user'

export interface CustomRequest extends Request {
  checkIfUserExistsWithThisReaction?: any
}

const validateVideoReactionRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { userId, channelId, videoId, reActingUserId, reactionType } = req.params
  if (!userId || !channelId || !videoId || !reActingUserId || !reactionType) {
    res.status(400).send({ message: 'Invalid/missing request parameters specified!' })
  } else {
    const ip = getClientIp(req)!
    req.params.reActingUserId =
      req.params.reActingUserId === 'visitor' ? `vis-${ip}` : req.params.reActingUserId
    next()
  }
}

const checkIfReactionAlreayExists = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, channelId, videoId, reActingUserId, reactionType } = req.params

    const pipeline = [
      {
        $match: {
          userId: userId,
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
      {
        $unwind: '$channels.videos.reactions',
      },
      {
        $match: {
          'channels.channelId': channelId,
          'channels.videos.videoId': videoId,
          'channels.videos.reactions': { $exists: true, $ne: [] },
        },
      },
      {
        $match: {
          'channels.videos.reactions.reactingUserId': reActingUserId,
          'channels.videos.reactions.reactionType': reactionType,
        },
      },
      {
        $project: {
          _id: 0,
          title: '$channels.videos.title',
        },
      },
    ]

    const vidWithReaction = await userModel.aggregate(pipeline).exec()

    req.checkIfUserExistsWithThisReaction = vidWithReaction.length > 0 ? true : false
    next()
  } catch (error) {
    console.error(error)
    res.status(500).send({ message: 'An error occurred while processing request.' })
  }
}

const toggleLikeDislikeReaction = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, channelId, videoId, reActingUserId, reactionType } = req.params

    const deletableOppositeReaction = reactionType === 'like' ? 'dislike' : 'like'

    if (reactionType === 'like' || reactionType === 'dislike') {
      // Like/dislike reaction does not exist

      //the reaction exists so we need to delete it
      const reactionToRemove = {
        reactionType: deletableOppositeReaction,
        reactingUserId: reActingUserId,
      }

      await userModel.findOneAndUpdate(
        {
          userId: userId,
          'channels.channelId': channelId,
          'channels.videos.videoId': videoId,
        },
        {
          $pull: {
            'channels.$[channel].videos.$[video].reactions': reactionToRemove,
          },
        },
        {
          arrayFilters: [
            { 'channel.channelId': channelId },
            { 'video.videoId': videoId },
          ],
          new: true,
        }
      )
    }

    next()
  } catch (error) {
    console.error(error)
    res.status(500).send({ message: 'An error occurred while processing request.' })
  }
}

const getTotalReactionsWithLikesAndDislikes = async (
  channelId: string,
  videoId: string,
  objLikesDislikes: any
) => {
  const pipeline = [
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
    {
      $match: {
        'channels.channelId': channelId,
        'channels.videos.videoId': videoId,
        'channels.videos.reactions': { $exists: true, $ne: [] },
      },
    },
    {
      $project: {
        _id: 0,
        title: '$channels.videos.title',
        likes: {
          $size: {
            $filter: {
              input: '$channels.videos.reactions',
              cond: { $eq: ['$$this.reactionType', 'like'] },
            },
          },
        },
        disLikes: {
          $size: {
            $filter: {
              input: '$channels.videos.reactions',
              cond: { $eq: ['$$this.reactionType', 'dislike'] },
            },
          },
        },
      },
    },
  ]

  const videoWithAggregateReactions = await userModel.aggregate(pipeline).exec()

  if (!videoWithAggregateReactions) {
  } else {
    if (videoWithAggregateReactions.length) {
      objLikesDislikes.Likes = videoWithAggregateReactions[0].likes
      objLikesDislikes.Dislikes = videoWithAggregateReactions[0].disLikes
    }
  }
}

const reactions = {
  validateVideoReactionRequest,
  checkIfReactionAlreayExists,
  toggleLikeDislikeReaction,
  getTotalReactionsWithLikesAndDislikes,
}

export default reactions
