import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import User from '../models/User.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_BYTES = 72;
const BCRYPT_SALT_ROUNDS = 10;
const TOKEN_EXPIRY = '1h';

function sanitizeUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department ?? null,
    studentId: user.studentId ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function parseOptionalString(value, label, maxLength, errors) {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== 'string') {
    errors.push(`${label} must be a string`);
    return undefined;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return undefined;
  }

  if (trimmedValue.length > maxLength) {
    errors.push(`${label} cannot exceed ${maxLength} characters`);
    return undefined;
  }

  return trimmedValue;
}

function validateRegistration(body) {
  const errors = [];
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = body.password;

  if (!name) {
    errors.push('Name is required');
  } else if (name.length < 2 || name.length > 100) {
    errors.push('Name must be between 2 and 100 characters');
  }

  if (!email) {
    errors.push('Email is required');
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.push('Please provide a valid email address');
  }

  if (typeof password !== 'string') {
    errors.push('Password is required');
  } else {
    if (password.length < PASSWORD_MIN_LENGTH) {
      errors.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters long`);
    }

    if (Buffer.byteLength(password, 'utf8') > PASSWORD_MAX_BYTES) {
      errors.push(`Password cannot exceed ${PASSWORD_MAX_BYTES} bytes`);
    }
  }

  const department = parseOptionalString(body.department, 'Department', 100, errors);
  const studentId = parseOptionalString(body.studentId, 'Student ID', 50, errors);

  return {
    errors,
    values: { name, email, password, department, studentId },
  };
}

function handleUserWriteError(error, res, next) {
  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'An account with this email already exists',
    });
  }

  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(
      (validationError) => validationError.message,
    );

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  return next(error);
}

async function register(req, res, next) {
  try {
    const { errors, values } = validateRegistration(req.body ?? {});

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    const existingUser = await User.exists({ email: values.email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    const passwordHash = await bcrypt.hash(
      values.password,
      BCRYPT_SALT_ROUNDS,
    );

    const user = await User.create({
      name: values.name,
      email: values.email,
      passwordHash,
      role: 'student',
      department: values.department,
      studentId: values.studentId,
    });

    return res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      user: sanitizeUser(user),
    });
  } catch (error) {
    return handleUserWriteError(error, res, next);
  }
}

async function login(req, res, next) {
  try {
    const body = req.body ?? {};

    if (
      typeof body.email !== 'string' ||
      typeof body.password !== 'string' ||
      !body.email.trim() ||
      !body.password
    ) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const email = body.email.trim().toLowerCase();
    const user = await User.findOne({ email }).select('+passwordHash');

    const passwordMatches = user
      ? await bcrypt.compare(body.password, user.passwordHash)
      : false;

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      return res.status(500).json({
        success: false,
        message: 'Authentication service is not configured',
      });
    }

    const token = jwt.sign(
      { id: user._id.toString(), role: user.role },
      jwtSecret,
      { expiresIn: TOKEN_EXPIRY },
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    return next(error);
  }
}

async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Account no longer exists',
      });
    }

    return res.status(200).json({
      success: true,
      user: sanitizeUser(user),
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token',
      });
    }

    return next(error);
  }
}

export { register, login, getMe };
