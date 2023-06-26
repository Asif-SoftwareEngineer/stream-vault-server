import { IVideo } from './video'

export interface IChannel {
  userId: string
  channelId: string
  profileImageUrl?: string
  bannerImageUrl?: string
  name: string
  description: string
  category: string
  handle: string
  videos?: IVideo[]
  followers?: string[]
}
