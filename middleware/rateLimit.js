const rateLimit = require('express-rate-limit');

// General ceiling for all API traffic — generous, just a backstop against abuse/DoS.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false
});

// Tight limit for credential-guessing / OTP-spamming surfaces (logins, OTP request+verify,
// registration). Keyed by IP; low enough to blunt brute-force and SMS-bombing, high enough
// that a real user retrying a typo won't get locked out.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please wait a few minutes and try again.' }
});

module.exports = { apiLimiter, authLimiter };
