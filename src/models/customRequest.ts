import { Request } from 'express'

export interface AuthenticatingRequest extends Request {
  userId?: string
}
