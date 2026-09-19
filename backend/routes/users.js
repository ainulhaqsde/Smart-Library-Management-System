const express = require("express");
const bcrypt = require("bcryptjs");

const User = require("../models/User");

const {
    protect,
    allow
} = require("../middleware/auth");

const r = express.Router();


/* =========================================================
   PROTECT ALL USER ROUTES
========================================================= */

r.use(protect);


/* =========================================================
   GET ALL STUDENTS
   ADMIN ONLY
========================================================= */

r.get(
    "/",
    allow("admin"),
    async (req, res, next) => {
        try {
            const {
                q = "",
                status = "",
                page = 1,
                limit = 50
            } = req.query;

            const filter = {
                role: "student"
            };

            if (q) {
                filter.$or = [
                    {
                        name: {
                            $regex: q,
                            $options: "i"
                        }
                    },
                    {
                        email: {
                            $regex: q,
                            $options: "i"
                        }
                    },
                    {
                        studentId: {
                            $regex: q,
                            $options: "i"
                        }
                    }
                ];
            }

            if (status) {
                filter.active =
                    status === "active";
            }

            const items =
                await User.find(filter)
                    .sort({
                        createdAt: -1
                    })
                    .skip(
                        (+page - 1) *
                            +limit
                    )
                    .limit(
                        Math.min(
                            100,
                            +limit
                        )
                    );

            res.json({
                items,
                total:
                    await User.countDocuments(
                        filter
                    )
            });
        } catch (error) {
            next(error);
        }
    }
);


/* =========================================================
   CREATE STUDENT
   ADMIN ONLY
========================================================= */

r.post(
    "/",
    allow("admin"),
    async (req, res) => {
        try {
            const {
                name,
                email,
                password,
                studentId,
                phone
            } = req.body;

            if (
                !name ||
                !email ||
                !password
            ) {
                return res
                    .status(400)
                    .json({
                        message:
                            "Name, email and password are required"
                    });
            }

            if (password.length < 8) {
                return res
                    .status(400)
                    .json({
                        message:
                            "Password must be at least 8 characters"
                    });
            }

            const user =
                await User.create({
                    name,
                    email,
                    password:
                        await bcrypt.hash(
                            password,
                            12
                        ),
                    studentId:
                        studentId ||
                        undefined,
                    phone,
                    role: "student"
                });

            res.status(201).json(user);
        } catch (error) {
            res.status(400).json({
                message:
                    error.code === 11000
                        ? "Email or Student ID already exists"
                        : error.message
            });
        }
    }
);


/* =========================================================
   GET STUDENT BY ID
   ADMIN ONLY
========================================================= */

r.get(
    "/:id",
    allow("admin"),
    async (req, res) => {
        const user =
            await User.findById(
                req.params.id
            );

        if (!user) {
            return res.status(404).json({
                message:
                    "Student not found"
            });
        }

        res.json(user);
    }
);


/* =========================================================
   UPDATE STUDENT
   ADMIN ONLY
========================================================= */

r.put(
    "/:id",
    allow("admin"),
    async (req, res) => {
        const allowed = [
            "name",
            "email",
            "studentId",
            "phone",
            "profileImage"
        ];

        const set = {};

        allowed.forEach((key) => {
            if (
                req.body[key] !==
                undefined
            ) {
                set[key] =
                    req.body[key];
            }
        });

        const user =
            await User.findOneAndUpdate(
                {
                    _id: req.params.id,
                    role: "student"
                },
                set,
                {
                    new: true,
                    runValidators: true
                }
            );

        if (!user) {
            return res.status(404).json({
                message:
                    "Student not found"
            });
        }

        res.json(user);
    }
);


/* =========================================================
   UPDATE STUDENT STATUS
   ADMIN ONLY
========================================================= */

r.patch(
    "/:id/status",
    allow("admin"),
    async (req, res) => {
        const user =
            await User.findOneAndUpdate(
                {
                    _id: req.params.id,
                    role: "student"
                },
                {
                    active:
                        !!req.body.active
                },
                {
                    new: true
                }
            );

        if (!user) {
            return res.status(404).json({
                message:
                    "Student not found"
            });
        }

        res.json(user);
    }
);


/* =========================================================
   UPDATE OWN PROFILE
========================================================= */

r.put(
    "/me/profile",
    async (req, res) => {
        const allowed = [
            "name",
            "phone",
            "profileImage"
        ];

        allowed.forEach((key) => {
            if (
                req.body[key] !==
                undefined
            ) {
                req.user[key] =
                    req.body[key];
            }
        });

        await req.user.save();

        res.json(req.user);
    }
);


/* =========================================================
   CHANGE OWN PASSWORD
========================================================= */

r.put(
    "/me/password",
    async (req, res) => {
        const user =
            await User.findById(
                req.user._id
            ).select("+password");

        if (
            !(await bcrypt.compare(
                req.body.currentPassword ||
                    "",
                user.password
            ))
        ) {
            return res.status(400).json({
                message:
                    "Current password is incorrect"
            });
        }

        if (
            (
                req.body.newPassword ||
                ""
            ).length < 8
        ) {
            return res.status(400).json({
                message:
                    "New password must be at least 8 characters"
            });
        }

        user.password =
            await bcrypt.hash(
                req.body.newPassword,
                12
            );

        await user.save();

        res.json({
            message:
                "Password updated"
        });
    }
);


/* =========================================================
   EXPORT ROUTER
========================================================= */

module.exports = r;