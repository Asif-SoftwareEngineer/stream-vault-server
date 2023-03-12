export interface IVideo {
  videoId: string
  userId: string
  channelId: string
  title: string
  description: string
  thumbnail: string
  category: string
  tags?: string[]
  likes?: string[]
  dislikes?: string[]
  comments?: string[]
  filePath: string
  duration?: number
}
