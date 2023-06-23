import { Schema, model } from 'mongoose'

import { ImageType } from './enums'

export interface IImage {
  fileName: string
  userId: string
  type: ImageType
  imageUrl: string
}

const imageSchema = new Schema<IImage>({
  fileName: { type: String, required: true },
  userId: { type: String, required: true },
  type: { type: String, required: true },
  imageUrl: { type: String, required: true },
})

export const imageModel = model<IImage>('UploadedImage', imageSchema)
