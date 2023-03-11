// import * as fs from 'fs'
// import * as url from 'url'

// import { Request, Response, Router } from 'express'
// import { ObjectId } from 'mongodb'
// import * as multer from 'multer'

// import { fileFilter, fileStorage } from '../../config/multer'
// import { userModel } from '../../models/user'

// const router = Router()

// const upload = multer({
//   storage: fileStorage,
//   limits: { fileSize: 1000000 * 5 },
//   fileFilter: fileFilter,
// })

// router.get('/:userId', async (req: Request, res: Response) => {
//   const userObj = await userModel.findOne({ userId: new ObjectId(req.params.userId) })
//   if (!userObj) {
//     getResponseIfMediaUpdateFailed(res)
//   } else {
//     res.send({ status: 200, user: userObj })
//   }
// })

// router.put('/:userId', upload.single('image'), async (req: Request, res: Response) => {
//   const updatedUserWithPics = await userModel.findOneAndUpdate(
//     { _id: new ObjectId(req.params.userId) },
//     {
//       $addToSet: { picture: req.file?.filename },
//     },
//     { returnDocument: 'after' }
//   )

//   if (!updatedUserWithPics) {
//     getResponseIfMediaUpdateFailed(res)
//   } else {
//     res.send({ status: 200, userWithUpdatedPictures: updatedUserWithPics })
//   }
// })

// router.delete('/delete', async (req: Request, res: Response) => {
//   var url_parts = url.parse(req.url, true)
//   var query = url_parts.query

//   const userId: string = query.userId as string
//   const mediaId: string = query.mediaId as string

//   //first find the user Object
//   const userObj = await userModel.findOne({ userId: userId })

//   // if (!userObj) {
//   //   getResponseIfMediaUpdateFailed(res)
//   // } else {
//   //   if (userObj.picture) {
//   //     let imageId = mediaId.toString()
//   //     const index = userObj.picture.indexOf(imageId) // find the media that need to be removed

//   //     if (index === -1) {
//   //       getResponseIfMediaUpdateFailed(res)
//   //     } else {
//   //       try {
//   //         const fileName = userObj.channels.splice(index, 1)
//   //         //Now update the user Object after deleting the media
//   //         const updatedUserWithPics = await userModel.findOneAndUpdate(
//   //           { userId: userId },
//   //           {
//   //             $set: userObj,
//   //           },
//   //           { returnDocument: 'after' }
//   //         )

//   //         if (!updatedUserWithPics) {
//   //           getResponseIfMediaUpdateFailed(res)
//   //         } else {
//   //           let filePath: string = `C:/dev/pistream/server/uploads/${fileName}`
//   //           fs.unlinkSync(filePath)
//   //           res.send({
//   //             status: 200,
//   //             message: {
//   //               message: 'File Deleted Successfully.',
//   //               userWithUpdatedPictures: updatedUserWithPics,
//   //             },
//   //           })
//   //         }
//   //       } catch (error) {
//   //         console.log(error)
//   //         getResponseIfMediaUpdateFailed(res)
//   //       }
//   //     }
//   //   }
//   // }
// })

// export default router

// const getResponseIfMediaUpdateFailed = (res: Response): void => {
//   res.status(404).send({ message: 'Unble to update the media' })
// }
