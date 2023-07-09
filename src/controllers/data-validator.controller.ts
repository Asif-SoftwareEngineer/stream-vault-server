import { NextFunction, Request, Response } from 'express'

import Joi = require('joi')

export async function generateCodeApiValidator(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const verifiyingMemberSchema = Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    mobile: Joi.string().required(),
  })

  const { error } = verifiyingMemberSchema.validate(req.body)
  if (error) {
    // Invalid request body, return an error response
    return res.status(422).json({ errorMessage: error.details[0].message })
  } else {
    return next()
  }
}

export async function verifyMobileNumberApiValidator(
  req: Request,
  res: Response,
  next: NextFunction
) {
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
    return res.status(422).json({ errorMessage: error.details[0].message })
  } else {
    return next()
  }
}

export async function registerUserApiValidator(
  req: Request,
  res: Response,
  next: NextFunction
) {
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
    return res.status(422).json({ errorMessage: error.details[0].message })
  } else {
    return next()
  }
}

export async function newChannelApiValidator(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const newChannelSchema = Joi.object({
    userId: Joi.string().required(),
    name: Joi.string().required(),
    category: Joi.string().required(),
    handle: Joi.string().required(),
  })

  const { userId, name, category, handle } = req.body
  const validatingData = { userId, name, category, handle }

  const { error } = newChannelSchema.validate(validatingData)

  if (error) {
    // Invalid request query string, return an error response
    return res.status(422).json({ errorMessage: error.details[0].message })
  } else {
    return next()
  }
}

export async function newVideoApiValidator(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const data = req.body

  if (
    !data.userId ||
    !data.channelId ||
    !data.title ||
    !data.description ||
    !data.category
  ) {
    return res.status(400).json({
      message: 'Video creation request failed due to insufficient information.',
    })
  } else {
    return next()
  }
}
