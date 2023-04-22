import axios from 'axios'
import { Request, Response, Router } from 'express'
import { getClientIp } from 'request-ip'

import * as config from '../../config'
import { errorLogger, infoLogger } from '../../loggers'
import { CustomError } from '../../models/customErrorClass'
import { LogEventType, MembershipType } from '../../models/enums'
import { PaymentDTO, paymentModel } from '../../models/payment'
import { IUser } from '../../models/user'
import platformAPIClient from '../../platformApiClient'

const router = Router()

router.post('/incomplete', async (req, res) => {
  // Destructure the necessary values from req.body using object destructuring
  const {
    payment: {
      identifier: paymentIdCB = '', // get the value of identifier from payment object
      transaction: { txid: txidCB = '', _link: txURL = '' } = {}, // get the value of txid and _link from transaction object if it exists
    } = {},
    user_uid,
  } = req.body
  try {
    const pipeline = [
      {
        $match: {
          paymentId: paymentIdCB,
          'user.pichain_uid': user_uid,
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'uid',
          foreignField: 'pichain_uid',
          as: 'user',
        },
      },
      {
        $unwind: '$user',
      },
    ]

    const filteredPayment = await (
      await paymentModel.aggregate(pipeline).exec()
    ).find((payment) => payment.paymentId === paymentIdCB)

    if (!filteredPayment) {
      return res
        .status(200)
        .json({ status: 200, message: 'Previous payment not found in our records' })
    }

    // check the transaction on the Pi blockchain
    const horizonResponse = await axios.get(txURL)

    // and check other data as well e.g. amount
    if (horizonResponse.data.memo !== filteredPayment.paymentId) {
      return res.status(400).json({ status: 400, message: "Payment id doesn't match." })
    }

    await paymentModel.updateOne(
      { paymentId: paymentIdCB },
      {
        $set: {
          txid: txidCB,
          paid: true,
        },
      }
    )

    await platformAPIClient.post(`/v2/payments/${paymentIdCB}/complete`, { txid: txidCB })

    return res.status(200).json({
      status: 200,
      paymentfor: 'membership',
      message: `Payment is now complete for paymentId: ${paymentIdCB}`,
    })
  } catch (error) {
    return res.status(500).json({
      status: 500,
      paymentfor: 'membership',
      message: `Payment completion failed for paymentId: ${paymentIdCB}`,
    })
  }
})

// approve the current payment
router.post('/approve', async (req: Request, res: Response) => {
  try {
    infoLogger.info('[Router payments/approve]: Inside the approve post method')

    const paymentIdCB = req.body.paymentId
    const paymentObj = await platformAPIClient.get<PaymentDTO>(
      `/v2/payments/${paymentIdCB}`
    )
    const { data: currentPayment } = paymentObj

    // Check that user has specified the membership interval

    const regDto: IUser = currentPayment.metadata as IUser

    if (
      !regDto.membership_Type ||
      regDto.membership_Type.length === 0 ||
      !Object.values(MembershipType).includes(regDto.membership_Type)
    ) {
      const myError = new CustomError('Invalid Membership Type.', 301)
      throw myError
    }

    const payment = new paymentModel({
      uid: currentPayment.user_uid,
      paymentId: currentPayment.identifier,
      memo: currentPayment.memo,
      amount: currentPayment.amount,
      paid: false,
      cancelled: false,
      created_at: new Date(),
    })
    infoLogger.info(
      '[Router payments/approve]: About to create payment object inside approve post method'
    )
    const paymentObjCreated = await payment.save()

    const userId: string = currentPayment.user_uid
    const eventType: string = LogEventType.StreamVaultPaymentApproved

    infoLogger.info(
      '[Router payments/approve]: About to log the payment approval-inside Approve API call back '
    )
    const url = config.server_url
    const clientIp: string = getClientIp(req)!
    await axios.post(`${url}/v2/log/userAction`, {
      userId,
      eventType,
      clientIp,
    })
    // let Pi Servers know that you're ready
    infoLogger.info(
      '[Router payments/approve]: About to call the approve api at pi blockchain testnet'
    )

    await platformAPIClient.post(`/v2/payments/${paymentObjCreated.paymentId}/approve`)

    res.status(200).json({
      status: 200,
      paymentfor: 'membership',
      message: `Approved the payment ${paymentObjCreated.paymentId}`,
    })
  } catch (error: any) {
    if (error instanceof CustomError && error.number === 301) {
      errorLogger.error(
        `[Router payments/approve]: Custom error with number ${error.number}: ${error.message}`
      )
    } else {
      errorLogger.error(`[Router payments/approve]: Error: ${error.message}`)
    }
  }
})

router.post('/complete', async (req, res) => {
  const paymentIdCB = req.body.paymentId
  const txidCB = req.body.txid
  infoLogger.info('[Router: payments/complete] Complete API called back')

  try {
    const paymentObj = await platformAPIClient.get<PaymentDTO>(
      `/v2/payments/${paymentIdCB}`
    )

    const { data: currentPayment } = paymentObj

    const registeringMember: IUser = currentPayment.metadata as IUser

    infoLogger.info('[Router: payments/complete]: About to log the payment approval.')
    const url = config.server_url

    const response = await axios.post(`${url}/v2/user/member`, registeringMember)

    if (response.status === 200) {
      await paymentModel.updateOne(
        { paymentId: paymentIdCB },
        {
          $set: {
            txid: txidCB,
            paid: true,
          },
        }
      )
      await platformAPIClient.post(`/v2/payments/${paymentIdCB}/complete`, {
        txid: txidCB,
      })

      res.status(200).json({
        status: 200,
        paymentfor: 'membership',
        message: `Completed the payment. ${paymentIdCB}`,
      })
    } else {
      throw new Error(`Failed to create membership against payment: ${paymentIdCB}`)
    }
  } catch (error) {
    errorLogger.error(`[Router: /complete]: error: ${JSON.stringify(error)}`)
    res.status(500).json({
      status: 500,
      paymentfor: 'membership',
      message: `Failed to create membership against payment: ${paymentIdCB}`,
    })
  }
})

//handle the cancelled payment
router.post('/cancelled_payment', async (req, res) => {
  try {
    const paymentIdCB = req.body.paymentId
    const paymentObj = await platformAPIClient.get<PaymentDTO>(
      `/v2/payments/${paymentIdCB}`
    )
    const { data: currentPayment } = paymentObj

    await paymentModel.findOneAndUpdate(
      { paymentId: paymentIdCB },
      {
        $set: {
          paid: false,
          cancelled: true,
        },
      }
    )

    // Make a POST request to the /userAction endpoint with the data from the request body

    const userId: string = currentPayment.user_uid
    const eventType: string = LogEventType.CancelPayment

    const url = config.server_url
    const clientIp: string = getClientIp(req)!
    await axios.post(`${url}/v2/log/userAction`, {
      userId,
      eventType,
      clientIp,
    })

    res.status(200).json({
      status: 200,
      paymentfor: 'membership',
      message: `Payment has been cancelled: ${paymentIdCB}`,
    })

    infoLogger.info(
      `[Router: payments/cancelled_payment]: Payment for User [ ${userId} ] has been cancelled.`
    )
  } catch (error) {
    errorLogger.error(error)
  }
})

//handle the error happened within payment
router.post('/handle_error', async (req, res) => {
  // Destructure the necessary values from req.body using object destructuring
  const {
    payment: {
      identifier: paymentIdCB = '', // get the value of identifier from payment object
      transaction: { txid: txidCB = '', _link: txURL = '' } = {}, // get the value of txid and _link from transaction object if it exists
    } = {},
    user_uid,
  } = req.body.payment

  const error = req.body.error

  try {
    // const paymentIdCB = req.body.payment.identifier
    // const error = req.body.error ?? ''
    let logDetails: string = ''
    // let errorMessage: string = ''
    // const paymentObj = await platformAPIClient.get<PaymentDTO>(
    //   `/v2/payments/${paymentIdCB}`
    // )
    // const { data: currentPayment } = paymentObj

    // if (typeof error === 'object') {
    //   errorMessage = error?.message
    console.log(txidCB + txURL)
    logDetails = JSON.stringify(error)
    // }

    // Make a POST request to the /userAction endpoint with the data from the request body

    //const userId: string = currentPayment.user_uid
    const eventType: string = LogEventType.ErrorRaised

    const url = config.server_url
    const clientIp: string = getClientIp(req)!
    await axios.post(`${url}/v2/log/userAction`, {
      user_uid,
      eventType,
      clientIp,
      logDetails,
    })

    res.status(200).json({
      status: 200,
      paymentfor: 'membership',
      message: `Error [ ${logDetails} ] related to Payment [ ${paymentIdCB} ] has been logged.`,
    })

    infoLogger.info(
      `[Router: payments/handle_error]: Payment for User [ ${user_uid} ] has been logged with its raised error.`
    )
  } catch (error) {
    errorLogger.error(error)
  }
})

export default router
