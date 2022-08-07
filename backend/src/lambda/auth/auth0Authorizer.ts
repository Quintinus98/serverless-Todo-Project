import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
// import Axios from 'axios'
import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('auth')
// TODO: Provide a URL that can be used to download a certificate that can be used
// to verify JWT token signature.
// To get this URL you need to go to an Auth0 page -> Show Advanced Settings -> Endpoints -> JSON Web Key Set
// const jwksUrl = 'https://quentinsop.us.auth0.com/.well-known/jwks.json'

// async function getCertificate(): Promise<string> {
//   logger.info(`Fetching certificate from ${jwksUrl}`)

//   const res = await Axios.get(jwksUrl)
//   const keys = res.data.keys

//   const filteredKeys = keys.filter(
//     (key: {
//       use: string
//       kty: string
//       alg: string
//       n: any
//       e: any
//       kid: any
//       x5c: string | any[]
//     }) =>
//       key.use === 'sig' &&
//       key.kty === 'RSA' &&
//       key.alg === 'RS256' &&
//       key.n &&
//       key.e &&
//       key.kid &&
//       key.x5c &&
//       key.x5c.length
//   )

//   const key = filteredKeys[0]
//   const publicKey = key.x5c[0]

//   // Convert pubkey to PEM
//   const cert = publicKey.match(/.{1,64}/g).join('\n')
//   const pem = `-----BEGIN CERTIFICATE-----\n${cert}\n-----END CERTIFICATE-----\n`

//   return pem
// }

const cert2 = `-----BEGIN CERTIFICATE-----
MIIDCTCCAfGgAwIBAgIJIFUk3xTB9d/8MA0GCSqGSIb3DQEBCwUAMCIxIDAeBgNV
BAMTF3F1ZW50aW5zb3AudXMuYXV0aDAuY29tMB4XDTIyMDcyNTA4Mzk0MVoXDTM2
MDQwMjA4Mzk0MVowIjEgMB4GA1UEAxMXcXVlbnRpbnNvcC51cy5hdXRoMC5jb20w
ggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCc9xle2qYzkHcIqvTg9q3U
+JsPReTjFpe/ld14aww/Q4PCiml7unkywjfOLEiDSqb6mLQqjKdWsWMue7qa1BQV
/y/3YJYuoZ+DfmV4x7FLaq9u+DZlJPvSkxLJg1eXVMidV3Wk46fEiiwAEqqInCWl
UhCAlSzV1/pHV03bf0DZoxuMvb+fr3ygmdhc/TBdXNQO95tep7zcYYV88Eo80mCh
RXFJ5wDGjOHL8IQHIz52Nw+ptmOMwp5el75LU4g5X26GtpLW0hd7W0dJJA0Dy7eI
q691iReWk83cqyowrNa9HZIGZybUaFpTMfA9WIeW5QR+uxEYMG57KTTGu5+oCXv3
AgMBAAGjQjBAMA8GA1UdEwEB/wQFMAMBAf8wHQYDVR0OBBYEFN10Gbbn6mwYN1Oc
lQXh1hKtv+TkMA4GA1UdDwEB/wQEAwIChDANBgkqhkiG9w0BAQsFAAOCAQEAeXcq
g+Kzo+3qU7EJTbKaqiA8tNbMdZ9C1E+29lYQ3OGaldPTARrrLJfwGg02KB/3xVNu
1bry2WBvcSWEzyIrafH1iJr7DppUZOIT3FCArQ1tw6iYft7VR/rzyPF+K+cI/B59
puTzQsvsEOE+4BL0J83vvYPKqPgLYqFEaZOw+S0GgojJVlHVJefcQijgfgvLjBAg
Xb8nGmrTKDFgif98URRhC9utVmk1j+8LhrAy7uY9T3E90b4eLM7U2QXFPLqLNXwU
Mb+NmBYQKBG3fePkzxYpoQIlpI0RhiLmSgnhc9T7z7loLYdVedr/05wiglk9H2yH
1hEphE7wNo/NlWi1aQ==
-----END CERTIFICATE-----`

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('Auth successful')

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (error) {
    logger.error('You are not allowed to perform this action', {
      error: error.message
    })
    // revoke auth if failed
    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)

  // const cert = await getCertificate()

  logger.info(`Verifying token ${token}`)

  return verify(token, cert2, { algorithms: ['RS256'] }) as JwtPayload
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}