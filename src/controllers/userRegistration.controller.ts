import { Dayjs } from 'dayjs'
import { NextFunction, Request, Response } from 'express'

import * as config from './../config'
import { accountVerificationModel } from '../models/account-verification'
import { MembershipType } from '../models/enums'
import { userModel } from '../models/user'

import dayjs = require('dayjs')

export const verifyUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const verifyingMember = await accountVerificationModel.findOne({
      email: req.body.email,
      code: req.body.code,
    })

    if (verifyingMember) {
      verifyingMember.isVerified = true
      await verifyingMember.save()

      return res.status(200).json({
        status: 200,
        verifiedMember: verifyingMember,
        message: 'Code verified successfully.',
      })
    } else {
      return res.status(400).json({ status: 400, errorMessage: 'Invalid code provided.' })
    }
  } catch (error) {
    // Handle any errors that occur during the process
    return res.status(500).json({
      status: 500,
      message:
        'System failed to send verification code to your specified mobile number. Please ensure you provided a valid mobile number.',
    })
  }
}

export const getUserRegistrationStatus = async (req: Request, res: Response) => {
  try {
    const { email, mobile } = req.body

    // Check if user already exists
    const existingUser = await userModel.findOne({ email, mobile })

    if (existingUser) {
      // User already registered, check membership
      if (existingUser.isMembershipExpired) {
        res.status(200).json({
          RegStatus: 'MembershipExpired',
          message:
            'The user has already been registered. Please sign in to upgrade your membership.',
        })
      } else {
        res.status(200).json({
          RegStatus: 'MembershipActive',
          message: 'The user has already been registered. And Membership is active.',
        })
      }
    } else {
      res.status(200).json({
        RegStatus: 'unRegistered',
        message: 'The user has not been registered before.',
      })
    }
  } catch (error) {
    console.error('Error during user registration:', error)
    res.status(500).json({
      message: 'An error occurred during user registration.',
    })
  }
}

export const generateSixDigitCode = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const reqPayLoad = req.body

  const codeLength = 6
  const min = Math.pow(10, codeLength - 1)
  const max = Math.pow(10, codeLength) - 1
  const code = Math.floor(Math.random() * (max - min + 1)) + min

  const updatedRequestBody = {
    ...reqPayLoad,
    code: code.toString(),
  }

  // Update the request body with the new object
  req.body = updatedRequestBody

  next()
}

export const sendSmsForVerification = async (mobile: string, code: string) => {
  return new Promise<void>((resolve, reject) => {
    const sgMail = require('@sendgrid/mail')
    sgMail.setApiKey(config.sendgrid_api_key)

    const msg = {
      to: mobile,
      from: 'streamvault.pi@gmail.com',
      subject: 'Email verification code',
      text: `Your verification code is: ${code}`,
    }

    sgMail
      .send(msg)
      .then(() => {
        resolve() // Resolve the promise
      })
      .catch((error: any) => {
        console.error('Error sending verification email:', error)
        reject(error) // Reject the promise with the error
      })
  })
}

export const registerUser = async (req: Request, res: Response) => {
  try {
    const reqPayLoad = req.body

    let planType: string = reqPayLoad.membership.planType // Can be 'free', 'monthly' or 'yearly'

    let regDate: Dayjs = dayjs().startOf('day')
    let renewalDate: Dayjs = dayjs().startOf('day')

    switch (planType) {
      case MembershipType.Free:
        renewalDate = regDate.add(100, 'year')
        break
      case MembershipType.Monthly:
        renewalDate = regDate.add(1, 'month')
        break
      case MembershipType.Annually:
        renewalDate = regDate.add(1, 'year')
        break
      default:
        break
    }

    const newUser = new userModel({
      userName: generateUserName(
        reqPayLoad.name.first,
        reqPayLoad.name.last,
        reqPayLoad.registrationDate
      ),
      firstName: reqPayLoad.name.first,
      lastName: reqPayLoad.name.last,
      email: reqPayLoad.email,
      mobile: reqPayLoad.mobile,
      language: reqPayLoad.language,
      age18Above: reqPayLoad.age18Above,
      agreeToTerms: reqPayLoad.agreeToTerms,
      membership: reqPayLoad.membership,
      role: reqPayLoad.role,
      isProfileDisabled: false,
      isMembershipExpired: false,
      membershipRenewalDate: renewalDate,
      registrationDate: regDate,
    })

    // Save the new user in the collection
    await newUser.save()

    res.status(200).json({
      status: 200,
      RegStatus: 'Registered',
      message: 'User registered successfully.',
    })
  } catch (error) {
    console.error('Error during user registration:', error)
    res.status(500).json({
      message: 'An error occurred during user registration.',
    })
  }
}

function generateRandomDigits(length: number): string {
  let result = ''
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 10)
  }
  return result
}

function generateUserName(
  firstName: string,
  lastName: string,
  registrationDate: Date
): string {
  try {
    const formattedDate = dayjs(registrationDate).format('DDMMYY')
    const truncatedFirstName = firstName.substring(0, 4).toLowerCase()
    const truncatedLastName = `${lastName.substring(0, 1).toUpperCase()}${lastName
      .substring(1, 2)
      .toLowerCase()}`

    const userName = `${truncatedFirstName}${truncatedLastName}${formattedDate}`
    return userName
  } catch (error) {
    console.error('Error occurred while formatting date:', error)
    const randomDigits = generateRandomDigits(5)
    const truncatedFirstName = firstName.substring(0, 4).toLowerCase()
    const truncatedLastName = `${lastName.substring(0, 1).toUpperCase()}${lastName
      .substring(1, 2)
      .toLowerCase()}`

    const userName = `${truncatedFirstName}${truncatedLastName}-${randomDigits}`
    return userName
  }
}