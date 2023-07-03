import { Schema, model } from 'mongoose'

export interface Search {
  user_id: Schema.Types.ObjectId
  fields: string[]
}

const searchSchema = new Schema<Search>({
  user_id: { type: Schema.Types.ObjectId, required: true },
  fields: [{ type: String, required: true }],
})

export const searchModel = model<Search>('Search', searchSchema)
