import { Document, Model, Schema, Types, model } from 'mongoose'

import { VideoPublishStage } from './enums'
import { Reaction } from './reaction'

export interface Video extends Document {
  userId: Types.ObjectId
  channelId: Types.ObjectId
  title: string
  description: string
  category: string
  videoPathUrl?: string
  thumbnailImageUrl?: string
  audience: string
  visibility: string
  commentsPreference: string
  language: string
  location: string
  uploadDate: Date
  likes?: Reaction[]
  dislikes?: Reaction[]
  comments?: string[]
  duration?: number
  publishStage: VideoPublishStage
  publishDate?: Date
}

const videoSchema = new Schema<Video>({
  userId: { type: Schema.Types.ObjectId, required: true },
  channelId: { type: Schema.Types.ObjectId, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  likes: [
    {
      reactionType: { type: String, required: true },
      reactingUserId: { type: Types.ObjectId, required: true },
    },
  ],
  dislikes: [
    {
      reactionType: { type: String, required: true },
      reactingUserId: { type: Types.ObjectId, required: true },
    },
  ],
  comments: [String],
  duration: { type: Number, required: true },
  videoPathUrl: { type: String, required: true },
  thumbnailImageUrl: { type: String, required: true },
  audience: { type: String, required: true },
  visibility: { type: String, required: true },
  commentsPreference: { type: String, required: true },
  language: { type: String, required: true },
  location: { type: String, required: true },
  publishStage: { type: String, enum: Object.values(VideoPublishStage), required: true },
  uploadDate: { type: Date, required: true },
  publishDate: { type: Date, required: false },
})

export const videoModel: Model<Video> = model<Video>('Video', videoSchema)
