import 'dotenv/config';

import bcrypt from 'bcryptjs';

import { connectDB, disconnectDB } from '../config/db.js';
import User from '../models/User.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_BYTES = 72;
const BCRYPT_SALT_ROUNDS = 10;

function validateAdminInput() {
  const errors = [];
  const name = process.env.ADMIN_NAME?.trim() ?? '';
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase() ?? '';
  const password = process.env.ADMIN_PASSWORD;

  if (!name) {
    errors.push('ADMIN_NAME is required');
  } else if (name.length < 2 || name.length > 100) {
    errors.push('ADMIN_NAME must be between 2 and 100 characters');
  }

  if (!email) {
    errors.push('ADMIN_EMAIL is required');
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.push('ADMIN_EMAIL must be a valid email address');
  }

  if (typeof password !== 'string' || !password) {
    errors.push('ADMIN_PASSWORD is required');
  } else {
    if (password.length < PASSWORD_MIN_LENGTH) {
      errors.push(
        `ADMIN_PASSWORD must be at least ${PASSWORD_MIN_LENGTH} characters long`,
      );
    }

    if (Buffer.byteLength(password, 'utf8') > PASSWORD_MAX_BYTES) {
      errors.push(
        `ADMIN_PASSWORD cannot exceed ${PASSWORD_MAX_BYTES} bytes`,
      );
    }
  }

  return { errors, name, email, password };
}

async function createAdmin() {
  const { errors, name, email, password } = validateAdminInput();

  if (errors.length > 0) {
    console.error('Administrator creation failed:');
    errors.forEach((error) => console.error(`- ${error}`));
    console.error(
      'Set ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD as environment variables and try again.',
    );
    process.exitCode = 1;
    return;
  }

  try {
    await connectDB();

    const existingUser = await User.exists({ email });

    if (existingUser) {
      console.error(
        'Administrator creation failed: an account with this email already exists.',
      );
      process.exitCode = 1;
      return;
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    await User.create({
      name,
      email,
      passwordHash,
      role: 'admin',
    });

    console.log(`Administrator account created successfully for ${email}.`);
  } catch (error) {
    if (error.code === 11000) {
      console.error(
        'Administrator creation failed: an account with this email already exists.',
      );
    } else {
      console.error(`Administrator creation failed: ${error.message}`);
    }

    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}

await createAdmin();
