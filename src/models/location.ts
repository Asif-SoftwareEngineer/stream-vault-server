import { Schema, model } from 'mongoose'

const locationSchema = new Schema({
  name: String,
  iso3: String,
  iso2: String,
  phone_code: String,
  capital: String,
  currency: String,
  currency_symbol: String,
  tld: String,
  native: String,
  region: String,
  subregion: String,
})

// Create a model based on the schema
export const locationModel = model('Location', locationSchema)
