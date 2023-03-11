export const IsProd = process.env.NODE_ENV === 'production'
export const Port = process.env.PORT || 3000
export const MongoUri =
  process.env.MONGO_URI ||
  'mongodb+srv://asifj:Allah786online$$@videovaultdb.vz1cpzp.mongodb.net/videovault_db'
export const session_secret = process.env.SESSION_SECRET || 'This is my session secret'
export const pi_api_key =
  process.env.PI_API_KEY ||
  'vxjwy7zscab2oc4u2vboyezktln264tgcajyyirvybiq2cmydu80l7ww7ie5yts6'
export const platform_api_url = process.env.PLATFORM_API_URL || 'https://api.minepi.com'
export const mongo_host = process.env.MONGO_HOST || 'videovaultdb.vz1cpzp.mongodb.net'
export const mongo_db_name = process.env.MONGODB_DATABASE_NAME || 'videovault_db'
export const mongo_user = process.env.MONGODB_USERNAME || 'Allah786online$$'
export const mongo_password = process.env.MONGODB_PASSWORD || 'asifj'
export const frontend_url = process.env.FRONTEND_URL || 'http://localhost:3314'
