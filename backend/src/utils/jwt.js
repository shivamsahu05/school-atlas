// src/utils/jwt.js
const jwt = require('jsonwebtoken')

const SECRET  = process.env.JWT_SECRET  || 'change_me_in_production'
const EXPIRES = process.env.JWT_EXPIRES_IN || '7d'

/**
 * Sign a payload and return a JWT token.
 */
const signToken = (payload) => jwt.sign(payload, SECRET, { expiresIn: EXPIRES })

/**
 * Verify a token and return the decoded payload, or throw.
 */
const verifyToken = (token) => jwt.verify(token, SECRET)

module.exports = { signToken, verifyToken }
