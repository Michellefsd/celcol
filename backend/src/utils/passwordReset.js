const crypto = require('crypto');
const argon2 = require('argon2');

function b64url(buf) {
  return buf.toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}

async function newResetToken() {
  const id = crypto.randomUUID().replace(/-/g,''); // selector
  const secret = b64url(crypto.randomBytes(32));    // verificador
  const token = `${id}.${secret}`;                  // viaja en el link
  const tokenHash = await argon2.hash(secret, { type: 2 }); // se guarda en DB
  return { id, token, tokenHash, secret };
}

async function verifySecret(hash, secret) {
  return argon2.verify(hash, secret);
}

module.exports = { newResetToken, verifySecret };
