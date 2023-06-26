import { Request } from 'express'

import { IUser } from './user'

export interface AuthenticatingRequest extends Request {
  userId?: string
}

export interface UserFindingrRequest extends Request {
  user?: IUser
}
