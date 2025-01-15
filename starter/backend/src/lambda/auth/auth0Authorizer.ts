import { createLogger } from '../../utils/logger.mjs'
import axios from "axios";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";

// Configure the JWKS client
const client = jwksClient({
  jwksUri: "https://fremfi.auth0.com/.well-known/jwks.json",
});


const logger = createLogger('auth')

const getSigningKey = async (kid) => {
  const key = await client.getSigningKey(kid);
  return key.getPublicKey();
};

export async function handler(event) {
  try {
    const jwtToken = await verifyToken(event.authorizationToken)

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
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

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

async function verifyToken(authHeader) {
  const token = getToken(authHeader)

  try {
    const decodedHeader = jwt.decode(token, { complete: true });
    if (!decodedHeader?.header?.kid) {
      throw new Error("Invalid token header");
    }

    // Get the signing key using the kid
    const signingKey = await getSigningKey(decodedHeader.header.kid);

    // Verify the JWT
    const decodedToken = jwt.verify(token, signingKey, {
      audience: "https://fremfi.auth0.com/api/v2/",
      issuer: "https://fremfi.auth0.com/",
    });
    return decodedToken;

  } catch (error) {
    logger.error('Token verification failed', { error })
  }
  return undefined;
}


function getToken(authHeader) {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}
