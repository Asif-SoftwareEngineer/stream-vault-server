import { Types } from 'mongoose'

export interface Reaction {
  reactionType: string
  reactingUserId: Types.ObjectId
}
