function requireAdmin(req, res, next) {
  if (req.session && req.session.adminId) {
    return next();
  }
  const redirectTo = encodeURIComponent(req.originalUrl);
  return res.redirect(`/admin/login?next=${redirectTo}`);
}

module.exports = { requireAdmin };
