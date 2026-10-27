import jwt from 'jsonwebtoken';

function extractBearerToken(authorizationHeader) {
  if (typeof authorizationHeader !== 'string') {
    return null;
  }

  const [scheme, token, ...extraParts] = authorizationHeader.trim().split(/\s+/);

  if (scheme?.toLowerCase() !== 'bearer' || !token || extraParts.length > 0) {
    return null;
  }

  return token;
}

const authenticateToken = (req, res, next) => {
  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication token is required',
    });
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    return res.status(500).json({
      success: false,
      message: 'Authentication service is not configured',
    });
  }

  try {
    const payload = jwt.verify(token, jwtSecret);

    if (
      typeof payload !== 'object' ||
      typeof payload.id !== 'string' ||
      typeof payload.role !== 'string'
    ) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token',
      });
    }

    req.user = {
      id: payload.id,
      role: payload.role,
    };

    return next();
  } catch (error) {
    const message =
      error.name === 'TokenExpiredError'
        ? 'Authentication token has expired'
        : 'Invalid authentication token';

    return res.status(401).json({
      success: false,
      message,
    });
  }
};

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication is required',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this resource',
      });
    }

    return next();
  };
};

export { authenticateToken, authorizeRoles };
