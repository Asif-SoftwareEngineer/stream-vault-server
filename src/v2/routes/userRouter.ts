import { Request, Response, Router } from 'express'
import * as moment from 'moment'
import { ObjectId } from 'mongodb'

import { errorLogger, infoLogger } from '../../loggers'
import { accountVerificationModel } from '../../models/account-verification'
import { CustomError } from '../../models/customErrorClass'
import { MembershipType } from '../../models/enums'
import { IUser, userModel } from '../../models/user'

const Joi = require('joi')

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
      videovault_username: 1,
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
  const userObj = await userModel.findOne({ userId: req.params.userId })
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
    videovault_username: regDto.videovault_username,
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

  userObj.save((err, userObjCreated) => {
    if (err) {
      res.send({ status: 500, message: 'User registration failed!' })
    } else {
      res.send({
        status: 200,
        message: `User [${userObj.pichain_username}] has been registered.`,
        userDetails: userObjCreated,
      })
    }
  })
})

router.post('/member', async (req: Request, res: Response) => {
  try {
    let updatedOrNewMember: any
    const regDto: IUser = req.body as IUser
    const registeredUser = await userModel.findOne({ userId: regDto.pichain_uid })

    // Define the subscription interval
    let subscriptionInterval: MembershipType = regDto.membership_Type! // Can be 'monthly', 'quarterly', 'half-yearly', or 'yearly'
    let renewalDate = moment()

    switch (subscriptionInterval) {
      case MembershipType.Monthly:
        renewalDate = moment().add(1, 'month')
        break
      case MembershipType.Quarterly:
        renewalDate = moment().add(3, 'months')
        break
      case MembershipType.SemiAnnually:
        renewalDate = moment().add(6, 'months')
        break
      case MembershipType.Annually:
        renewalDate = moment().add(1, 'year')
        break

      default:
        break
    }

    if (registeredUser) {
      // update membership details to the registered user only
      updatedOrNewMember = await userModel.updateOne(
        { pichain_uid: regDto.pichain_uid },
        {
          $set: {
            membership_date: regDto.membership_date,
            membership_Type: regDto.membership_Type,
            membership_renewal_date: renewalDate,
            isMembershipExpired: false,
          },
        }
      )
      infoLogger.info(
        `[Router: users/member]: Membership updated for the user  ${regDto.userId}`
      )
    } else {
      //This is completely a new registration with membership
      const userObj = new userModel({
        accessCode: regDto.accessCode,
        pichain_uid: regDto.pichain_uid,
        userId: regDto.userId,
        pichain_username: regDto.pichain_username,
        streamVault_username: regDto.pichain_username,
        email: regDto.email || '',
        country: regDto.country || '',
        city: regDto.city || '',
        role: regDto.role,
        registration_date: new Date(),
        picture: '',
        isProfileDisabled: regDto.isProfileDisabled,
        membership_date: regDto.membership_date,
        membership_Type: regDto.membership_Type,
        membership_renewal_date: renewalDate,
        isMembershipExpired: false,
      })

      updatedOrNewMember = await userObj.save()
      infoLogger.info(
        `[Router: users/member]: Membership created for the user  ${regDto.userId}`
      )
    }
    console.log(updatedOrNewMember)

    if (updatedOrNewMember) {
      res.send({
        status: 200,
        message: `User [${regDto.pichain_username}] has been registered as a subscribed member.`,
        userDetails: regDto,
      })
    } else {
      res.send({
        status: 400,
        message: 'Member subscription failed!',
        userDetails: regDto,
      })
    }
  } catch (error) {
    console.log('error in user/member api')
    errorLogger.error(`[Router: users/member]: ${error}`)
    res.send({ status: 500, message: 'Member subscription failed!' })
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
        .send({ message: `User with Id: [${req.query.userId}] deleted successfully.` })
    }
  })
})

router.post('/verifyEmail', async (req: Request, res: Response) => {
  const verificationSchema = Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
  })

  const { error, value } = verificationSchema.validate(req.body)

  if (error) {
    // Invalid request body, return an error response
    res.status(400).json({ error: error.details[0].message })
    return
  }

  try {
    // Valid request body, proceed with saving
    const verifyingUserObj = new accountVerificationModel({
      firstName: value.firstName,
      lastName: value.lastName,
      email: value.email,
      isVerified: false,
      code: generateSixDigitCode(),
      createdAt: new Date(),
    })

    await verifyingUserObj.save()

    try {
      const email = verifyingUserObj.email
      const verificationCode = verifyingUserObj.code
      await sendVerificationEmail(email, verificationCode)
      console.log('Email sent successfully.')

      res.status(200).json({
        status: 200,
        message: 'Six digit verification code sent!',
        verifyingUser: verifyingUserObj,
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
          status: 500,
          message: 'Failed to send verification email!',
        })
      } else {
        // Handle other custom errors if needed
      }
    } else {
      // Handle other non-custom errors
      res.status(500).json({
        status: 500,
        message: 'System failed to dispatch a verification email!',
      })
    }
  }
})

router.get('/verifyCode', async (req, res) => {
  const { email, code } = req.query

  try {
    const verification = await accountVerificationModel.findOne({ email, code })

    if (verification) {
      // Code is valid for the given email
      // Update the isVerified field to true
      verification.isVerified = true
      await verification.save()

      return res.status(200).json({ message: 'Code verified successfully' })
    } else {
      // Code is invalid or doesn't match any records
      return res.status(400).json({ message: 'Invalid code' })
    }
  } catch (error) {
    // Handle any errors that occur during the process
    return res.status(500).json({ message: 'Internal server error' })
  }
})

function generateSixDigitCode() {
  const codeLength = 6
  const min = Math.pow(10, codeLength - 1)
  const max = Math.pow(10, codeLength) - 1
  const code = Math.floor(Math.random() * (max - min + 1)) + min
  return code.toString()
}

function sendVerificationEmail(email: string, code: string) {
  return new Promise<void>((resolve, reject) => {
    const sgMail = require('@sendgrid/mail')
    sgMail.setApiKey('YOUR_SENDGRID_API_KEY')

    const msg = {
      to: email,
      from: 'streamvault.pi@gmail.com',
      subject: 'Email verification code',
      text: `Your verification code is: ${code}`,
    }

    sgMail
      .send(msg)
      .then(() => {
        console.log('Verification email sent successfully.')
        resolve() // Resolve the promise
      })
      .catch((error: any) => {
        console.error('Error sending verification email:', error)
        reject(error) // Reject the promise with the error
      })
  })
}

export default router
