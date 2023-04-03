export interface IVideo {
  videoId: string
  userId: string
  channelId: string
  title: string
  description: string
  thumbnail: string
  category: string
  tags?: string[]
  reactions?: IReacion[]
  comments?: string[]
  filePath: string
  duration?: number
}

export interface IReacion {
  reactionType: string
  reactingUserId: string
}
