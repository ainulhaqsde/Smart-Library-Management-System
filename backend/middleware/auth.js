const jwt = require("jsonwebtoken");
const User = require("../models/User");


/* =========================================================
   PROTECT ROUTES
========================================================= */

exports.protect = async (req, res, next) => {
    try {
        const authorization =
            req.headers.authorization || "";

        if (
            !authorization.startsWith(
                "Bearer "
            )
        ) {
            return res.status(401).json({
                message:
                    "Authentication required"
            });
        }

        const decoded = jwt.verify(
            authorization.slice(7),
            process.env.JWT_SECRET
        );

        const user = await User.findById(
            decoded.id
        );

        if (!user || !user.active) {
            return res.status(401).json({
                message:
                    "Account unavailable"
            });
        }

        req.user = user;

        next();
    } catch (error) {
        return res.status(401).json({
            message:
                "Invalid or expired session"
        });
    }
};


/* =========================================================
   ROLE AUTHORIZATION
========================================================= */

exports.allow =
    (...roles) =>
    (req, res, next) => {
        if (
            roles.includes(
                req.user.role
            )
        ) {
            return next();
        }

        return res.status(403).json({
            message:
                "You are not authorized to perform this action"
        });
    };