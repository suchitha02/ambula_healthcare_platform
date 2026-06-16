const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class AuthService {
  // Hash password
  static async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  // Verify password
  static async verifyPassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
  }

  // Generate tokens
  static generateTokens(userId) {
    const accessToken = jwt.sign(
      { userId, type: 'access' },
      process.env.JWT_SECRET || 'ambula_super_secret_key',
      { expiresIn: process.env.JWT_EXPIRY || '15m' }
    );

    const refreshToken = jwt.sign(
      { userId, type: 'refresh' },
      process.env.REFRESH_TOKEN_SECRET || 'ambula_refresh_secret_key',
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' }
    );

    return { accessToken, refreshToken };
  }

  // Verify access token
  static verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ambula_super_secret_key');
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }

  // Verify refresh token
  static verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET || 'ambula_refresh_secret_key');
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  // Generate new access token from refresh token
  static refreshAccessToken(refreshToken) {
    try {
      const decoded = this.verifyRefreshToken(refreshToken);
      const newAccessToken = jwt.sign(
        { userId: decoded.userId, type: 'access' },
        process.env.JWT_SECRET || 'ambula_super_secret_key',
        { expiresIn: process.env.JWT_EXPIRY || '15m' }
      );
      return newAccessToken;
    } catch (error) {
      throw new Error('Failed to refresh access token');
    }
  }
}

module.exports = AuthService;
