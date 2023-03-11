import { IVideo } from './video'

export interface IChannel {
  userId: string
  channelId: string
  thumbnail?: string
  name: string
  description: string
  category: string
  tags: string[]
  handle: string
  privacySubscribers: boolean
  videos?: IVideo[]
  subscribers?: string[]
}
