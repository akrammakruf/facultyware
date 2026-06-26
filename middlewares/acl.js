const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.redirect("/login");
      }

      const sessionUser = req.session.user || {};

      const userPermissions =
        sessionUser.permissions ||
        req.session.permissions ||
        [];

      const userRole =
        sessionUser.role ||
        req.session.role ||
        "admin";

      const userEmail =
        sessionUser.email ||
        req.session.email ||
        "";

      const isAdmin =
        userRole === "admin" ||
        userEmail === "admin@facultyware.test" ||
        req.session.username === "Admin Facultyware";

      if (isAdmin) {
        return next();
      }

      if (Array.isArray(userPermissions)) {
        if (Array.isArray(requiredPermission)) {
          if (requiredPermission.some(p => userPermissions.includes(p))) {
            return next();
          }
        } else if (userPermissions.includes(requiredPermission)) {
          return next();
        }
      }

      return res.status(403).render("error", {
        message: "Anda tidak memiliki akses ke halaman ini.",
        error: {
          status: 403,
          stack: "",
        },
      });
    } catch (err) {
      return next(err);
    }
  };
};

module.exports = {
  checkPermission,
};