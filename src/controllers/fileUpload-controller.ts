import { Request, Response } from 'express'

import uploadFile from '../middleware/uploadFileMiddleware'

export const upload = async (req: Request, res: Response) => {
  try {
    await uploadFile(req, res)

    if (req?.file == undefined) {
      return res.status(400).send({ message: 'Please upload a file!' })
    }

    return res.status(200).send({
      message: 'Uploaded the file successfully: ' + req.file?.originalname,
      fileHandle: req?.file.path,
    })
  } catch (err) {
    return res.status(500).send({
      message: `Could not upload the file: ${req.file?.originalname}. ${err}`,
    })
  }
}
