import * as path from 'path'

import { Request } from 'express'
import * as multer from 'multer'

type DestinationCallback = (error: Error | null, destination: string) => void
type FileNameCallback = (error: Error | null, filename: string) => void

export const fileStorage = multer.diskStorage({
  destination: (
    request: Request,
    file: Express.Multer.File,
    callback: DestinationCallback
  ): void => {
    callback(null, './uploads/')
  },

  filename: (
    req: Request,
    file: Express.Multer.File,
    callback: FileNameCallback
  ): void => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(
      file.originalname
    )}`
    callback(null, uniqueName)
  },
})

export const fileFilter = (
  request: Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback
): void => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    callback(null, true)
  } else {
    callback(new Error('Image uploaded is not of type jpg/jpeg or png'))
  }
}
