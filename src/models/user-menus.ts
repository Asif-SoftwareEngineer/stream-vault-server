import { Document, Schema, Types, model } from 'mongoose'

export interface UserMenus extends Document {
  userId: string
  menuIds: Types.ObjectId[]
}

const userMenuSchema = new Schema<UserMenus>({
  userId: {
    type: String,
    required: true,
  },
  menuIds: [
    {
      type: Types.ObjectId,
      ref: 'MenuItem',
    },
  ],
})

export const userMenu = model<UserMenus>('UserMenu', userMenuSchema)
