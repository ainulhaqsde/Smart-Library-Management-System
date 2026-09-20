const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { Resend } = require("resend");

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
                        .createHash("sha256")
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

                /*
                 * Development:
                 * Return the reset URL so password reset
                 * can still be tested locally without Resend.
                 */
                if (
                    process.env.NODE_ENV !==
                        "production" &&
                    !process.env.RESEND_API_KEY
                ) {
                    devResetUrl = url;
                } else {
                    /*
                     * Production:
                     * Send password reset email using Resend.
                     */
                    if (!process.env.RESEND_API_KEY) {
                        throw new Error(
                            "RESEND_API_KEY is not configured"
                        );
                    }

                    const resend = new Resend(
                        process.env.RESEND_API_KEY
                    );

                    const {
                        data,
                        error
                    } = await resend.emails.send({
                        from:
                            process.env.MAIL_FROM ||
                            "Smart Library <onboarding@resend.dev>",

                        to: [user.email],

                        subject:
                            "Reset your Smart Library password",

                        html: `
                            <div style="
                                font-family: Arial, sans-serif;
                                max-width: 600px;
                                margin: 0 auto;
                                padding: 24px;
                                color: #222;
                            ">
                                <h2>
                                    Smart Library
                                </h2>

                                <p>
                                    We received a request to reset
                                    your Smart Library password.
                                </p>

                                <p>
                                    Click the button below to create
                                    a new password.
                                </p>

                                <p style="
                                    margin: 28px 0;
                                ">
                                    <a
                                        href="${url}"
                                        style="
                                            display: inline-block;
                                            padding: 12px 20px;
                                            background: #111827;
                                            color: #ffffff;
                                            text-decoration: none;
                                            border-radius: 6px;
                                            font-weight: bold;
                                        "
                                    >
                                        Reset Password
                                    </a>
                                </p>

                                <p>
                                    This password reset link will
                                    expire in 15 minutes.
                                </p>

                                <p>
                                    If you did not request a password
                                    reset, you can ignore this email.
                                </p>

                                <hr style="
                                    margin: 28px 0;
                                    border: 0;
                                    border-top: 1px solid #dddddd;
                                ">

                                <p style="
                                    font-size: 12px;
                                    color: #666666;
                                ">
                                    Smart Library Management System
                                </p>
                            </div>
                        `
                    });

                    if (error) {
                        console.error(
                            "Resend email error:",
                            error
                        );

                        throw new Error(
                            "Unable to send password reset email"
                        );
                    }

                    console.log(
                        "Password reset email sent:",
                        data?.id
                    );
                }
            }

            res.json({
                message:
                    "If that email exists, reset instructions have been sent.",
                devResetUrl
            });
        } catch (error) {
            console.error(
                "Forgot password error:",
                error
            );

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
            console.error(
                "Reset password error:",
                error
            );

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