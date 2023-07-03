import { Document, Model, Schema, Types, model } from 'mongoose'

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
  visibilty: string
  commentsPreference: string
  language: string
  location: string
  approved: boolean
  likes?: Reaction[]
  dislikes?: Reaction[]
  comments?: string[]
  duration?: number
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
  visibilty: { type: String, required: true },
  commentsPreference: { type: String, required: true },
  language: { type: String, required: true },
  location: { type: String, required: true },
  approved: { type: Boolean, required: true },
})

export const videoModel: Model<Video> = model<Video>('Video', videoSchema)
