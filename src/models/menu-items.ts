import { Schema, model } from 'mongoose'

const menuItemSchema = new Schema({
  menuId: {
    type: Number,
    required: true,
  },
  menuName: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    default: '',
  },
})

export const menuItems = model('MenuItem', menuItemSchema)
