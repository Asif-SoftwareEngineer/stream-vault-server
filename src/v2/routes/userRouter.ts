import { Request, Response, Router } from 'express'
import { ObjectId } from 'mongodb'

import {
  generateCodeApiValidator,
  registerUserApiValidator,
  verifyMobileNumberApiValidator,
} from '../../controllers/data-validator.controller'
import {
  generateSixDigitCode,
  getUserRegistrationStatus,
  registerUser,
  sendSmsForVerification,
  verifyUser,
} from '../../controllers/userRegistration.controller'
import { accountVerificationModel } from '../../models/account-verification'
import { CustomError } from '../../models/customErrorClass'
import { User, userModel } from '../../models/user'

//"postbuild": "npm run copy:assets",

const router = Router()

router.get('/profile/:userId', async (req, res) => {
  try {
    const userId = req.params.userId

    const user = await userModel.findById(userId)

    if (!user) {
      res.status(404).json({ message: 'User not found' })
    } else {
      const filteredUser = {
        userName: user.userName,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        mobile: user.mobile,
        language: user.language,
        role: user.role,
        registrationDate: user.registrationDate,
        membership: user.membership,
        membershipRenewalDate: user.membershipRenewalDate,
        isMembershipExpired: user.isMembershipExpired,
        isVerified: user.isVerified,
      }

      res.status(200).json(filteredUser)
    }
  } catch (error) {
    console.error('Error fetching user:', error)
    res.status(500).json({ errorMessage: 'Failed to fetch user data' })
  }
})

router.get('/', (req: Request, res: Response) => {
  userModel.find((err, usersList) => {
    if (err) {
      res.send(err)
    } else {
      res.send({ status: 200, list: usersList })
    }
  })
})

router.get('/:userId', async (req: Request, res: Response) => {
  const userObj = await userModel.findOne({ userId: req.params.userId })
  if (!userObj) {
    res.status(404).send({ message: 'User not found.' })
  } else {
    res.send({ status: 200, user: userObj })
  }
})

router.put('/:userId', async (req: Request, res: Response) => {
  const userObj = req.body as User
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
        .send({ message: `User with Id: [${req.query.userId}] deleted successfully.` })
    }
  })
})

router.post(
  '/generateVerificationCode',
  generateCodeApiValidator,
  generateSixDigitCode,
  async (req: Request, res: Response) => {
    try {
      const userReq = req.body
      // Valid request body, proceed with saving
      const verifyingMember = new accountVerificationModel({
        firstName: userReq.firstName,
        lastName: userReq.lastName,
        email: userReq.email,
        mobile: userReq.mobile,
        ageAbove18: userReq.ageAbove18,
        agreeWithTerms: userReq.agreeWithTerms,
        isVerified: false,
        code: userReq.code,
        createdAt: new Date(),
      })

      await verifyingMember.save()

      try {
        const email = verifyingMember.email
        const verificationCode = verifyingMember.code

        await sendSmsForVerification(email, verificationCode) // sending email for testing purpose

        res.status(200).json({
          status: 200,
          message: 'A six-digit verification code has been sent to your mobile number.',
        })
      } catch {
        const internalError = new CustomError('Failed to send email', 101)
        throw internalError
      }
    } catch (error: any) {
      console.error(`[Router: /verifyEmail]: error: ${JSON.stringify(error)}`)
      if (error instanceof CustomError) {
        // Handle the custom error based on its number property
        if (error.number === 101) {
          res.status(500).json({
            status: 501,
            message:
              'We apologize, but we were unable to send the verification message. Kindly ensure that you have provided a valid mobile number.',
          })
        } else {
          // Handle other custom errors if needed
        }
      } else {
        // Handle other non-custom errors
        res.status(500).json({
          status: 500,
          message: 'System failed to register the user.',
        })
      }
    }
  }
)

router.post(
  '/verifyMobileNumber',
  verifyMobileNumberApiValidator,
  verifyUser,
  async (req, res) => {}
)

router.post(
  '/checkRegisteringUser',
  getUserRegistrationStatus,
  async (req: Request, res: Response) => {}
)

router.post(
  '/registerAsMember',
  registerUserApiValidator,
  registerUser,
  async (req: Request, res: Response) => {}
)

export default router
