import { NextFunction, Request, Response } from 'express'

import Joi = require('joi')

export const generateCodeApiValidator = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // return res.status(200).json({
  //   status: 200,
  //   message: 'A six-digit verification code has been sent to your mobile number.',
  //})

  const verifiyingMemberSchema = Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    mobile: Joi.string().required(),
  })

  const { error } = verifiyingMemberSchema.validate(req.body)
  if (error) {
    // Invalid request body, return an error response

    res.status(400).json({ error: error.details[0].message })
    return
  } else {
    next()
  }
}

export const verifyMobileNumberApiValidator = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const verifiyingMemberSchema = Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    mobile: Joi.string().required(),
    code: Joi.string().required(),
  })

  const { error } = verifiyingMemberSchema.validate(req.body)

  if (error) {
    // Invalid request query string, return an error response

    res.status(400).json({ 1: error.details[0].message })
    return
  } else {
    next()
  }
}

export const registerUserApiValidator = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const verifiyingMemberSchema = Joi.object({
    name: Joi.object({
      first: Joi.string().required(),
      last: Joi.string().required(),
    }).required(),
    language: Joi.string().required(),
    age18Above: Joi.boolean().required(),
    agreeToTerms: Joi.boolean().required(),
    email: Joi.string().email().required(),
    mobile: Joi.string().required(),
    membership: Joi.object({
      planType: Joi.string().valid('free', 'monthly', 'yearly').required(),
      amount: Joi.number().required(),
      paymentMode: Joi.string().required(),
      currency: Joi.string().required(),
    }).required(),
    role: Joi.string().required(),
    registrationDate: Joi.date().required(),
  })

  const { error } = verifiyingMemberSchema.validate(req.body)

  if (error) {
    // Invalid request query string, return an error response

    res.status(400).json({ 1: error.details[0].message })
    return
  } else {
    next()
  }
}
