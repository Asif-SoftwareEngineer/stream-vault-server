export const IsProd = process.env.NODE_ENV === 'production'
export const Port = process.env.PORT || 3000
export const MongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pistream_db'
export const JwtSecret = () => process.env.JWT_SECRET || '123456'
