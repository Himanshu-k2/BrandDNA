/**
 * Role-based authorization middleware.
 * Restricts access to users having one of the specified roles.
 * Must be used AFTER authMiddleware.protect.
 *
 * @param  {...string} allowedRoles - e.g. 'admin', 'creator', 'reviewer'
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not authenticated',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: User role '${req.user.role}' is not permitted to perform this action. Required role(s): ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
};
