import { Router } from 'express'
import mongoose from 'mongoose'

import { connectToDatabase } from '../../db'
import { errorLogger } from '../../loggers'
import { locationModel } from '../../models/location'

const router = Router()

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

router.get('/city-country-list', async (req, res) => {
  try {
    // Connect to the database
    await connectToDatabase()

    // Retrieve data from the "locations" collection
    const locations = await mongoose.connection.db
      .collection('locations')
      .find()
      .toArray()

    // Extract the user input from the request query parameters
    const userInput = req.query.input?.toString().toLowerCase() || ''

    console.log(userInput)

    // Filter the locations based on the user input
    // Filter the locations based on the user input
    let filteredLocations: string[] = []
    locations.forEach((location: any) => {
      location.cities.forEach((city: any) => {
        if (city.name.toLowerCase().includes(userInput.toLowerCase())) {
          filteredLocations.push(`${city.name}, ${location.name}`)
        }
      })
    })

    filteredLocations = filteredLocations.sort((a, b) => a.localeCompare(b))

    // Return the filtered cityCountryList as a JSON response
    res.json(filteredLocations)
  } catch (error) {
    console.error('Error fetching locations:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})


export default router
