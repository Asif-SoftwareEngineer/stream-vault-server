import { NextFunction, Response } from 'express'
import * as jwt from 'jsonwebtoken'

import * as config from '../config'

import { AuthenticatingRequest } from '../models/customRequest'

// interface decodedToken extends jwt.JwtPayload {
//   id: string
// }

const verifyToken = (req: AuthenticatingRequest, res: Response, next: NextFunction) => {
  const token = req.headers['x-access-token']!.toString()

  if (!token) {
    res.status(403).send({ message: 'No token provided!' })
  }

  jwt.verify(token, config.session_secret, (err, decoded: any) => {
    if (err) {
      res.status(401).send({ message: 'Unauthorized!' })
    }
    req.userId = decoded.id

    if (req) next()
  })
}

const authJwt = {
  verifyToken,
}

export default authJwt
