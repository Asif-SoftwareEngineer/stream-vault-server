import { NextFunction, Request, Response } from 'express'

import fileUploadMiddleWare from '../middleware/uploadFileMiddleware'

export const uploadVideo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // if (req.file == undefined) {
    //   return res.status(422).json({ error: 'No video file provided.' })
    // }

    await fileUploadMiddleWare.uploadVideoFile(req, res)
    return next()
  } catch (err) {
    return next(err)
  }
}

export const uploadImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await fileUploadMiddleWare.uploadImageFile(req, res)

    return next()
  } catch (err) {
    return next(err)
  }
}
