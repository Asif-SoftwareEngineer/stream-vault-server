import { Router } from 'express'

import { piUserModel } from '../../models/pisignuser'
import platformAPIClient from '../../platformApiClient'

const router = Router()

// handle the user auth accordingly
router.post('/:token', async (req, res) => {
  const token = req.params.token

  if (!token) {
    return res.status(401).json({ error: 'Invalid access token' })
  }

  try {
    const meResponse = await platformAPIClient.get(`/v2/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    const me = meResponse.data

    let currentUser = await piUserModel.findOne({ uid: me.uid })

    if (currentUser) {
      await piUserModel.updateOne(
        {
          _id: currentUser._id,
        },
        {
          $set: {
            accessToken: token,
            valid_timestamp: me.credentials.valid_until.timestamp,
            iso8601: me.credentials.valid_until.iso8601,
          },
        }
      )

      return res.status(200).json({ status: 200, message: 'User signed in' })
    } else {
      const newPiSigningUser = new piUserModel({
        username: me.username,
        uid: me.uid,
        accessToken: token,
        valid_timestamp: me.credentials.valid_until.timestamp,
        iso8601: me.credentials.valid_until.iso8601,
      })

      await newPiSigningUser.save()

      return res.status(200).json({ status: 200, message: 'User signed in' })
    }
  } catch (err) {
    console.error(err)
    return res.status(401).json({ error: 'Invalid access token' })
  }
})

// handle the user auth accordingly
router.get('/signout', async (req, res) => {
  //req.session.currentUser = null;
  return res.status(200).json({ message: 'User signed out' })
})

export default router
