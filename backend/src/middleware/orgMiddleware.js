/**
 * Verifies that the authenticated user belongs to the requested organization/workspace.
 * Prevents cross-tenant / cross-organization data access and tampering.
 * Must be used AFTER authMiddleware.protect.
 *
 * @param {Function} [getOrgId] - Optional extractor function: (req) => orgId.
 * Defaults to checking req.params.orgId || req.body.organizationId || req.query.organizationId.
 */
export const verifyOrgAccess = (getOrgId) => {
  return (req, res, next) => {
    if (!req.user || !req.user.organizationId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Missing user organization context',
      });
    }

    const targetOrgId = getOrgId
      ? getOrgId(req)
      : req.params.orgId || req.body?.organizationId || req.query?.organizationId;

    if (!targetOrgId) {
      // No target org specified in request, proceed safely
      return next();
    }

    if (req.user.organizationId.toString() !== targetOrgId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to access resources in another organization',
      });
    }

    next();
  };
};
