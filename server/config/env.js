// Fail fast when required configuration is missing or weak.
const REQUIRED = ['MONGO_URI', 'JWT_SECRET', 'CLIENT_URL'];

function validateEnv() {
  const missing = REQUIRED.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(`Missing required environment variables: ${missing.join(', ')}. Copy server/.env.example to server/.env and fill it in.`);
    process.exit(1);
  }
  if (process.env.JWT_SECRET.length < 32 || process.env.JWT_SECRET.startsWith('replace_with')) {
    console.error('JWT_SECRET must be a random string of at least 32 characters (see README for a one-line generator).');
    process.exit(1);
  }
}

module.exports = { validateEnv };
