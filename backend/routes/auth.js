const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const User = require("../models/User");
const { protect } = require("../middleware/auth");

const r = express.Router();


/* =========================================================
   AUTH HELPERS
========================================================= */

const sign = (user) =>
    jwt.sign(
        {
            id: user._id.toString(),
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn:
                process.env.JWT_EXPIRES_IN ||
                "7d"
        }
    );

const clean = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    studentId: user.studentId,
    phone: user.phone,
    profileImage: user.profileImage,
    active: user.active
});


/* =========================================================
   STUDENT SIGNUP
========================================================= */

r.post("/signup", async (req, res) => {
    try {
        let {
            name,
            email,
            password,
            studentId,
            phone
        } = req.body;

        email = String(email || "")
            .toLowerCase()
            .trim();

        if (!name || !email || !password) {
            return res.status(400).json({
                message:
                    "Name, email and password are required"
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message:
                    "Password must be at least 8 characters"
            });
        }

        if (await User.exists({ email })) {
            return res.status(409).json({
                message:
                    "Email already registered"
            });
        }

        const user = await User.create({
            name,
            email,
            password: await bcrypt.hash(
                password,
                12
            ),
            studentId:
                studentId || undefined,
            phone,
            role: "student"
        });

        res.status(201).json({
            token: sign(user),
            user: clean(user)
        });
    } catch (error) {
        res.status(400).json({
            message:
                error.code === 11000
                    ? "Email or Student ID already exists"
                    : error.message
        });
    }
});


/* =========================================================
   LOGIN
========================================================= */

r.post("/login", async (req, res) => {
    try {
        const email = String(
            req.body.email || ""
        )
            .toLowerCase()
            .trim();

        const user = await User.findOne({
            email
        }).select("+password");

        if (
            !user ||
            !(await bcrypt.compare(
                req.body.password || "",
                user.password
            ))
        ) {
            return res.status(401).json({
                message:
                    "Invalid email or password"
            });
        }

        if (!user.active) {
            return res.status(403).json({
                message:
                    "Account is disabled"
            });
        }

        user.lastLoginAt = new Date();

        await user.save();

        res.json({
            token: sign(user),
            user: clean(user)
        });
    } catch (error) {
        res.status(500).json({
            message: "Login failed"
        });
    }
});


/* =========================================================
   LOGOUT
========================================================= */

r.post("/logout", (req, res) => {
    res.json({
        message: "Signed out"
    });
});


/* =========================================================
   CURRENT USER
========================================================= */

r.get(
    "/me",
    protect,
    (req, res) => {
        res.json({
            user: clean(req.user)
        });
    }
);


/* =========================================================
   FORGOT PASSWORD
========================================================= */

r.post(
    "/forgot-password",
    async (req, res, next) => {
        try {
            const email = String(
                req.body.email || ""
            )
                .toLowerCase()
                .trim();

            const user =
                await User.findOne({
                    email
                }).select(
                    "+resetPasswordToken +resetPasswordExpires"
                );

            let devResetUrl = null;

            if (user) {
                const raw = crypto
                    .randomBytes(32)
                    .toString("hex");

                user.resetPasswordToken =
                    crypto
                        .createHash(
                            "sha256"
                        )
                        .update(raw)
                        .digest("hex");

                user.resetPasswordExpires =
                    Date.now() +
                    15 * 60 * 1000;

                await user.save();

                const url =
                    `${
                        process.env.APP_URL ||
                        "http://localhost:5000"
                    }/?reset=${raw}`;

                if (
                    process.env.SMTP_HOST
                ) {
                    const transporter =
                        nodemailer.createTransport(
                            {
                                host:
                                    process.env
                                        .SMTP_HOST,

                                port: +(
                                    process.env
                                        .SMTP_PORT ||
                                    587
                                ),

                                secure:
                                    String(
                                        process.env
                                            .SMTP_SECURE
                                    ) ===
                                    "true",

                                auth:
                                    process.env
                                        .SMTP_USER
                                        ? {
                                              user:
                                                  process
                                                      .env
                                                      .SMTP_USER,

                                              pass:
                                                  process
                                                      .env
                                                      .SMTP_PASS
                                          }
                                        : undefined
                            }
                        );

                    await transporter.sendMail(
                        {
                            from:
                                process.env
                                    .MAIL_FROM,

                            to: user.email,

                            subject:
                                "Smart Library password reset",

                            text:
                                `Use this link within 15 minutes: ${url}`
                        }
                    );
                } else if (
                    process.env.NODE_ENV !==
                    "production"
                ) {
                    devResetUrl = url;
                }
            }

            res.json({
                message:
                    "If that email exists, reset instructions have been sent.",
                devResetUrl
            });
        } catch (error) {
            next(error);
        }
    }
);


/* =========================================================
   RESET PASSWORD
========================================================= */

r.post(
    "/reset-password",
    async (req, res) => {
        try {
            if (
                (req.body.password || "")
                    .length < 8
            ) {
                return res
                    .status(400)
                    .json({
                        message:
                            "Password must be at least 8 characters"
                    });
            }

            const hash = crypto
                .createHash("sha256")
                .update(
                    req.body.token || ""
                )
                .digest("hex");

            const user =
                await User.findOne({
                    resetPasswordToken:
                        hash,

                    resetPasswordExpires: {
                        $gt: new Date()
                    }
                }).select(
                    "+password +resetPasswordToken +resetPasswordExpires"
                );

            if (!user) {
                return res
                    .status(400)
                    .json({
                        message:
                            "Reset link is invalid or expired"
                    });
            }

            user.password =
                await bcrypt.hash(
                    req.body.password,
                    12
                );

            user.resetPasswordToken =
                undefined;

            user.resetPasswordExpires =
                undefined;

            await user.save();

            res.json({
                message:
                    "Password reset successfully"
            });
        } catch (error) {
            res.status(500).json({
                message: "Reset failed"
            });
        }
    }
);


/* =========================================================
   EXPORT ROUTER
========================================================= */

module.exports = r;