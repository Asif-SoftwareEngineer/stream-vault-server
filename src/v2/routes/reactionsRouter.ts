import { Response, Router } from 'express'

import reactions, { CustomRequest } from '../../middleware/videoReactionsMiddleware'
import { userModel } from '../../models/user'

const router = Router()

router.post(
  '/submit/:userId/:channelId/:videoId/:reActingUserId/:reactionType',
  reactions.validateVideoReactionRequest,
  reactions.checkIfReactionAlreayExists,
  reactions.toggleLikeDislikeReaction,
  async (req: CustomRequest, res: Response) => {
    try {
      let obj = {
        Likes: Number,
        Dislikes: Number,
      }

      if (!req.checkIfUserExistsWithThisReaction) {
        //there is no specific reaction, so we need to add one

        const reaction = {
          reactionType: req.params.reactionType,
          reactingUserId: req.params.reActingUserId,
        }

        const updatedUser = await userModel.findOneAndUpdate(
          {
            userId: req.params.userId,
            'channels.channelId': req.params.channelId,
            'channels.videos.videoId': req.params.videoId,
          },
          {
            $addToSet: {
              'channels.$[channel].videos.$[video].reactions': reaction,
            },
          },
          {
            arrayFilters: [
              {
                'channel.channelId': req.params.channelId,
              },
              { 'video.videoId': req.params.videoId },
            ],
            upsert: true,
            new: true,
          }
        )

        if (!updatedUser) {
          res.status(500).send({ message: 'Reaction to the video failed!' })
        } else {
          await reactions.getTotalReactionsWithLikesAndDislikes(
            req.params.channelId,
            req.params.videoId,
            obj
          )
        }

        res.status(200).send({
          status: 200,
          reactionType: reaction.reactionType,
          message: 'Reaction added to the video.',
          likes: obj.Likes,
          dislikes: obj.Dislikes,
        })
      } else {
        res.status(409).send({
          message: `Reaction already exists from the user: ${req.params.reActingUserId}.`,
        })
      }
    } catch (error) {
      // handle any errors that may occur during the database update operation
      console.error(error)
      res.status(500).send({ message: 'An error occurred while updating the database.' })
    }
  }
)

router.post(
  '/withdraw/:userId/:channelId/:videoId/:reActingUserId/:reactionType',
  reactions.validateVideoReactionRequest,
  reactions.checkIfReactionAlreayExists,
  async (req: CustomRequest, res: Response) => {
    try {
      let obj = {
        Likes: Number,
        Dislikes: Number,
      }

      if (req.checkIfUserExistsWithThisReaction) {
        const reactionToRemove = {
          reactionType: req.params.reactionType,
          reactingUserId: req.params.reActingUserId,
        }

        const updatedUser = await userModel.findOneAndUpdate(
          {
            userId: req.params.userId,
            'channels.channelId': req.params.channelId,
            'channels.videos.videoId': req.params.videoId,
          },
          {
            $pull: {
              'channels.$[channel].videos.$[video].reactions': reactionToRemove,
            },
          },
          {
            arrayFilters: [
              { 'channel.channelId': req.params.channelId },
              { 'video.videoId': req.params.videoId },
            ],
            new: true,
          }
        )

        if (!updatedUser) {
          res.status(500).send({ message: 'Reaction to the video failed!' })
        } else {
          await reactions.getTotalReactionsWithLikesAndDislikes(
            req.params.channelId,
            req.params.videoId,
            obj
          )
        }

        res.status(200).send({
          status: 200,
          message: 'Reaction withdrawn from the video.',
          likes: obj.Likes,
          dislikes: obj.Dislikes,
        })
      } else {
        res.status(200).send({
          message: `Reaction does not exist from the user: ${req.params.reActingUserId}.`,
        })
      }
    } catch (error) {
      // handle any errors that may occur during the database update operation
      console.error(error)
      res.status(500).send({ message: 'An error occurred while updating the database.' })
    }
  }
)

export default router
