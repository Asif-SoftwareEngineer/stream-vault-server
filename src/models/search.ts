import { Schema, model } from 'mongoose'

export interface ISearch {
  user_id: Schema.Types.ObjectId
  fields: string[]
}

const searchSchema = new Schema<ISearch>({
  user_id: { type: Schema.Types.ObjectId, required: true },
  fields: [{ type: String, required: true }],
})

export const searchModel = model<ISearch>('Search', searchSchema)
