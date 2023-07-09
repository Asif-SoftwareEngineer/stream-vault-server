import { Request } from 'express'

import { User } from './user'

export interface AuthenticatingRequest extends Request {
  userId?: string
}

export interface UserFindingrRequest extends Request {
  user?: User
}

export interface videoUploadRequest extends Request {
  videoUrl?: string
  thumbnailUrl?: string
}
