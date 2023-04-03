import { Request } from 'express'

const requestIp = require('request-ip')

export const getClientIp = (request: Request): string => {
  let clientIp = requestIp.getClientIp(request)

  // Check for a forwarded IP address in the X-Forwarded-For header
  const forwardedFor = request.headers['x-forwarded-for']
  if (typeof forwardedFor === 'string') {
    // X-Forwarded-For can contain a comma-separated list of IP addresses
    // The client's IP address is typically the first address in the list
    clientIp = forwardedFor.split(',')[0]
  }

  return clientIp
}
