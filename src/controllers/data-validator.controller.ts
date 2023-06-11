import { NextFunction, Request, Response } from 'express'

import Joi = require('joi')

export const generateCodeApiValidator = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  return res.status(200).json({
    status: 200,
    message: 'A six-digit verification code has been sent to your mobile number.',
  })
  // const verifiyingMemberSchema = Joi.object({
  //   firstName: Joi.string().required(),
  //   lastName: Joi.string().required(),
  //   email: Joi.string().email().required(),
  //   mobile: Joi.string().required(),
  //   ageAbove18: Joi.boolean().required(),
  //   agreeWithTerms: Joi.boolean().required(),
  // })

  // const { error } = verifiyingMemberSchema.validate(req.body)
  // if (error) {
  //   // Invalid request body, return an error response
  //   res.status(400).json({ error: error.details[0].message })
  //   return
  // } else {
  //   next()
  // }
}

export const verifyMobileNumberApiValidator = async (req: Request, res: Response) => {
  const verifiyingMemberSchema = Joi.object({
    email: Joi.string().required(),
    mobile: Joi.string().required(),
    code: Joi.string().email().required(),
  })

  const { error } = verifiyingMemberSchema.validate(req.query)

  if (error) {
    // Invalid request query string, return an error response
    res.status(400).json({ error: error.details[0].message })
    return
  }
}
