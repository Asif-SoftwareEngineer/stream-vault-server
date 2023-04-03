import axios from 'axios'
import { Request, Response, Router } from 'express'
import * as moment from 'moment'
import { getClientIp } from 'request-ip'

import * as config from '../../config'
import { errorLogger, infoLogger } from '../../loggers'
import { LogEventType } from '../../models/enums'
import { PaymentDTO, paymentModel } from '../../models/payment'
import { IUser, userModel } from '../../models/user'
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
    const paymentIdCB = req.body.paymentId
    const paymentObj = await platformAPIClient.get<PaymentDTO>(
      `/v2/payments/${paymentIdCB}`
    )
    const { data: currentPayment } = paymentObj

    const payment = new paymentModel({
      uid: currentPayment.user_uid,
      paymentId: currentPayment.identifier,
      memo: currentPayment.memo,
      amount: currentPayment.amount,
      paid: false,
      cancelled: false,
      created_at: new Date(),
    })

    const paymentObjCreated = await payment.save()

    const userId: string = currentPayment.user_uid
    const evnetType: string = LogEventType.StreamVaultPaymentApproved

    const url = config.server_url
    const clientIp: string = getClientIp(req)!
    await axios.post(`${url}/v2/log/userAction`, {
      userId,
      evnetType,
      clientIp,
    })

    // let Pi Servers know that you're ready
    infoLogger.info('About to call the approve api at pi blockchain testnet')

    await platformAPIClient.post(`/v2/payments/${paymentObjCreated.paymentId}/approve`)

    res.status(200).json({
      status: 200,
      paymentfor: 'membership',
      message: `Approved the payment ${paymentObjCreated.paymentId}`,
    })
  } catch (err) {
    errorLogger.error(err)
  }
})

router.post('/complete', async (req, res) => {
  const paymentIdCB = req.body.paymentId
  const txidCB = req.body.txid
  infoLogger.info('Complete API called back')

  try {
    const paymentObj = await platformAPIClient.get<PaymentDTO>(
      `/v2/payments/${paymentIdCB}`
    )
    const { data: currentPayment } = paymentObj

    const isMembershipCreatedOrUpdted = await createMembership(currentPayment.metadata)

    if (isMembershipCreatedOrUpdted) {
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
      infoLogger.info(`Membership for the user  ${currentPayment.user_uid}`)
      res.status(200).json({
        status: 200,
        paymentfor: 'membership',
        message: `Completed the payment. ${paymentIdCB}`,
      })
    } else {
      throw new Error(`Failed to create membership against payment: ${paymentIdCB}`)
    }
  } catch (error) {
    errorLogger.error(error)
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
        },
      }
    )

    // Make a POST request to the /userAction endpoint with the data from the request body

    const userId: string = currentPayment.user_uid
    const evnetType: string = LogEventType.CancelPayment

    const url = config.server_url
    const clientIp: string = getClientIp(req)!
    await axios.post(`${url}/v2/log/userAction`, {
      userId,
      evnetType,
      clientIp,
    })

    res.status(200).json({
      status: 200,
      paymentfor: 'membership',
      message: `Payment has been cancelled: ${paymentIdCB}`,
    })

    infoLogger.info(`Payment for User [ ${userId} ] has been cancelled.`)
  } catch (error) {
    errorLogger.error(error)
  }
})

async function createMembership(paramRegDTO: any): Promise<boolean> {
  try {
    const regDTO: IUser = paramRegDTO as IUser
    const registeredUser = await userModel.findOne({ userId: regDTO.pichain_uid })

    // Define the subscription interval
    const subscriptionInterval = 'monthly' // Can be 'monthly', 'quarterly', 'half-yearly', or 'yearly'
    let renewalDate = moment()

    // Calculate the renewal date based on the subscription interval
    // Default to one month ahead
    if (subscriptionInterval === 'monthly') {
      renewalDate = moment().add(1, 'month')
    } else if (subscriptionInterval === 'quarterly') {
      renewalDate = moment().add(3, 'months')
    } else if (subscriptionInterval === 'half-yearly') {
      renewalDate = moment().add(6, 'months')
    } else if (subscriptionInterval === 'yearly') {
      renewalDate = moment().add(1, 'year')
    }

    if (registeredUser) {
      // update membership details to the registered user only
      await userModel.updateOne(
        { pichain_uid: regDTO.pichain_uid },
        {
          $set: {
            membership_date: regDTO.membership_date,
            membership_Type: regDTO.membership_Type,
            membership_renewal_date: renewalDate,
            isMembershipExpired: false,
          },
        }
      )
    } else {
      //This is completely a new registration with membership
      const userObj = new userModel({
        accessCode: regDTO.accessCode,
        pichain_uid: regDTO.pichain_uid,
        userId: regDTO.userId,
        pichain_username: regDTO.pichain_username,
        streamVault_username: regDTO.pichain_username,
        email: regDTO.email || '',
        country: regDTO.country || '',
        city: regDTO.city || '',
        role: regDTO.role,
        registration_date: new Date(),
        picture: '',
        isProfileDisabled: regDTO.isProfileDisabled,
        membership_date: regDTO.membership_date,
        membership_Type: regDTO.membership_Type,
        membership_renewal_date: renewalDate,
        isMembershipExpired: false,
      })

      await userObj.save()
    }

    return true
  } catch (error) {
    errorLogger.error(error)
    return false
  }
}

export default router
