export const authorizeRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.respond(403, "تاسو د دې عمل لپاره اجازه نلرئ");
  }
  next();
};
