import { Request, Response, Router } from 'express'
import { ObjectId } from 'mongodb'

import { IUser, userModel } from '../../models/user'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  userModel.find((err, usersList) => {
    if (err) {
      res.send(err)
    } else {
      res.send({ status: 200, list: usersList })
    }
  })
})

router.get('/registeredUser', async (req: Request, res: Response) => {
  try {
    // Extract the query fields from the request parameters
    const accessCode = req.query.accessCode
    const pichain_uid = req.query.pichain_uid
    const pichain_username = req.query.pichain_username

    // Build the MongoDB query object based on the extracted query fields
    const query = {
      $or: [
        { accessCode: accessCode },
        { pichain_uid: pichain_uid },
        { pichain_username: pichain_username },
      ],
    }

    // Build the MongoDB projection object to get only the required fields
    const projection = {
      accessCode: 1,
      pichain_uid: 1,
      pichain_username: 1,
      streamvault_uid: 1,
      streamvault_username: 1,
      email: 1,
      country: 1,
      city: 1,
      role: 1,
      registration_date: 1,
      membership_date: 1,
      membership_Type: 1,
      membership_renewal_date: 1,
      picture: 1,
      isProfileDisabled: 1,
      isMembershipExpired: 1,
      _id: 0,
      userId: '$_id',
    }

    // Find the user with the given query fields and projection
    const user = await userModel.findOne(query, projection).exec()

    if (user) {
      // User found with the required fields
      res.json(user)
    } else {
      // User not found with the given query fields
      res.status(404).json({ message: 'User not found' })
    }
  } catch (error: any) {
    // Error occurred while executing the query
    res.status(500).json({ message: error.message })
  }
})

router.get('/:userId', async (req: Request, res: Response) => {
  const userObj = await userModel.findOne({ userId: new ObjectId(req.params.userId) })
  if (!userObj) {
    res.status(404).send({ message: 'User not found.' })
  } else {
    res.send({ status: 200, user: userObj })
  }
})

router.post('/register', async (req: Request, res: Response) => {
  let regDto = req.body
  let userObj = new userModel({
    accessCode: regDto.accessCode,
    pichain_uid: regDto.pichain_uid,
    pichain_username: regDto.pichain_username,
    streamvault_username: regDto.streamvault_username,
    email: regDto.email,
    country: regDto.country,
    city: regDto.city,
    role: regDto.role,
    registration_date: new Date(),
    membership_date: null,
    membership_Type: '',
    membership_renewal_date: null,
    picture: '',
    isProfileDisabled: regDto.isProfileDisabled,
    isMembershipExpired: true,
  })

  //      res.send({ status: 500, Message: 'User registration failed!' })

  userObj.save((err, userObjCreated) => {
    if (err) {
      console.log(err.message)
      res.send({ status: 500, Message: 'User registration failed!' })
    } else {
      console.log(JSON.stringify(userObjCreated))
      res.send({
        status: 200,
        Message: `User [${userObj.pichain_username}] has been registered.`,
        userDetails: userObjCreated,
      })
    }
  })
})

router.post('/member', async (req: Request, res: Response) => {
  let regDto = req.body
  let userObj = new userModel({})

  if (regDto.userId.length > 0) {
    // update membership only details to the registered user only
    userObj = new userModel({
      membership_date: regDto.membership_date,
      membership_Type: regDto.membership_Type,
      //membership_renewal_date: regDto.membership_renewal_date, //we will look into this later
      isMembershipExpired: false,
    })

    await userModel.findOneAndUpdate(
      { _id: new ObjectId(regDto.userId) },
      {
        $set: userObj,
      }
    )
  } else {
    userObj = new userModel({
      // create a newly registered user with membership details
      accessCode: regDto.accessCode,
      pichain_uid: regDto.pichain_uid,
      pichain_username: regDto.pichain_username,
      streamvault_username: regDto.streamvault_username,
      email: regDto.email,
      country: regDto.country,
      city: regDto.city,
      role: regDto.role,
      registration_date: new Date(),
      picture: '',
      isProfileDisabled: regDto.isProfileDisabled,

      membership_date: regDto.membership_date,
      membership_Type: regDto.membership_Type,
      //membership_renewal_date: regDto.membership_renewal_date, //we will look into this later
      isMembershipExpired: false,
    })

    await userObj.save((err, userObj) => {
      if (err) {
        console.log(err.message)
        res.send({ status: 500, Message: 'Unable to register the user!' })
      } else {
        res.send({
          status: 200,
          Message: `User added as a registered member: ${userObj.pichain_username} `,
          userDetails: userObj,
        })
      }
    })
  }
})

router.put('/:userId', async (req: Request, res: Response) => {
  const userObj = req.body as IUser
  //delete userObj._id
  await userModel.findOneAndUpdate(
    { _id: new ObjectId(req.params.userId) },
    {
      $set: userObj,
    }
  )

  const updatedUser = await userModel.findOne({ _id: new ObjectId(req.params.userId) })

  if (!updatedUser) {
    res.status(404).send({ message: 'User not found.' })
  } else {
    res.send({ status: 200, updatedUser: updatedUser })
  }
})

router.delete('/deleteUser', async (req: Request, res: Response) => {
  const userId = req.query.userId

  await userModel.findByIdAndDelete(userId, function (err: any, response: any) {
    if (err) {
      res.send(err)
    } else {
      res
        .status(200)
        .send({ Message: `User with Id: [${req.query.userId}] deleted successfully.` })
    }
  })
})

export default router
