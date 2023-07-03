import { Types } from 'mongoose'

import { Video } from './video'

export interface Channel {
  userId: Types.ObjectId
  channelId: Types.ObjectId
  name: string
  description: string
  category: string
  handle: string
  profileImageUrl?: string
  bannerImageUrl?: string
  followers?: Types.ObjectId[]
  videos?: Video[]
}
