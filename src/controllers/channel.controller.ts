import { NextFunction, Request, Response } from 'express'

import { userModel } from '../models/user'

export function checkForDuplicateChannels(req: Request, res: Response, next: NextFunction) {
  userModel.aggregate(
    [
      { $unwind: '$channels' },
      { $group: { _id: '$channels.name', count: { $sum: 1 } } },
      { $match: { count: { $gt: 0 } } },
    ],
    function (err, result) {
      if (err) {
        res.status(400).send({
          errorMessage: `Error happened while checking duplicate record for channel name`,
        })
      } else if (result) {
        let isChannelNameExists = result.find(({ _id }) => _id === req.body.name)

        if (isChannelNameExists) {
          return res.status(409).send({
            status: 409,
            errorMessage: `Duplicate record found! Channel Name:[${isChannelNameExists._id}] already exists!`,
          })
        } else {
          return next()
        }
      } else {
        return next()
      }
    }
  )
}
