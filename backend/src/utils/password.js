const argon2 = require('argon2');

async function hashPassword(plain) {
  return argon2.hash(plain, {
    type: argon2.argon2id,
    memoryCost: 19456, // ~19MB
    timeCost: 2,
    parallelism: 1,
  });
}

async function verifyPassword(hash, plain) {
  return argon2.verify(hash, plain);
}

module.exports = { hashPassword, verifyPassword };
