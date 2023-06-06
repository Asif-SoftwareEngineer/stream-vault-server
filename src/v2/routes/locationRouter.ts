import { Router } from 'express'

import { errorLogger } from '../../loggers'
import { locationModel } from '../../models/location'

const router = Router()

// router.get('/countryCodes', async (req, res) => {
//   try {
//     const countryCodes = await countryCodeModel.find({}, 'name phone_code')

//     if (countryCodes) {
//       return res.status(200).json({ status: 200, listCountryCodes: countryCodes })
//     } else {
//       return res.status(400).json({ message: 'No Country Codes found!' })
//     }
//   } catch (error) {
//     // Handle any errors that occur during the process
//     return res.status(500).json({ message: 'Internal server error' })
//   }
// })

router.get('/countryCodes', async (req, res) => {
  try {
    // Fetch the desired properties from the MongoDB collection
    const locations = await locationModel.find({}, 'name iso2 phone_code')

    const countryCodes = locations.map((location) => ({
      countryName: location.name,
      iso2Code: location.iso2,
      phoneCode: location.phone_code,
    }))

    // Return the formatted data as the response
    return res.status(200).json(countryCodes)
  } catch (error) {
    errorLogger.error(`[Router: /location]: error: ${JSON.stringify(error)}`)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

export default router
