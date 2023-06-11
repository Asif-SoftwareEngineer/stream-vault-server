import { Dayjs } from 'dayjs'
import { NextFunction, Request, Response } from 'express'

import * as config from './../config'
import { accountVerificationModel } from '../models/account-verification'
import { MembershipType } from '../models/enums'
import { IUser, userModel } from '../models/user'

import dayjs = require('dayjs')

export const verifyUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const verifyingMember = await accountVerificationModel.findOne({
      email: req.body.email,
      code: req.body.code,
      isVerified: false,
    })

    if (verifyingMember) {
      verifyingMember.isVerified = true
      await verifyingMember.save()

      return res
        .status(200)
        .json({ verifiedMember: verifyingMember, message: 'Code verified successfully.' })
    } else {
      return res.status(400).json({ message: 'Invalid code provided.' })
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

export const checkRegisteringUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
    }
    next()
  } catch (error) {
    console.error('Error during user registration:', error)
    res.status(500).json({
      message: 'An error occurred during user registration.',
    })
  }
}

export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let planType: string = req.body.membershipPlan.planType // Can be 'free', 'monthly' or 'yearly'
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

    // User not registered before, create a new user
    const newUser: IUser = {
      userName: req.body.userName,
      email: req.body.email,
      mobile: req.body.mobile,
      membershipPlan: req.body.membershipPlan,
      role: req.body.role,
      isProfileDisabled: false,
      isMembershipExpired: false,
      membershipRenewalDate: renewalDate,
      registrationDate: regDate,
    }

    // Insert the new user into the collection
    await userModel.updateOne(newUser)

    res.status(200).json({
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

export const generateSixDigitCode = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const codeLength = 6
  const min = Math.pow(10, codeLength - 1)
  const max = Math.pow(10, codeLength) - 1
  const code = Math.floor(Math.random() * (max - min + 1)) + min

  const updatedRequestBody = {
    ...req.body,
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
        console.log('Verification email sent successfully.')
        resolve() // Resolve the promise
      })
      .catch((error: any) => {
        console.error('Error sending verification email:', error)
        reject(error) // Reject the promise with the error
      })
  })
}
