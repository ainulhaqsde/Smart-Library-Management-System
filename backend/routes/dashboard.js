const express = require("express");

const Book = require("../models/Book");
const Borrow = require("../models/Borrow");
const User = require("../models/User");
const Fine = require("../models/Fine");

const { protect } = require("../middleware/auth");

const r = express.Router();


/* =========================================================
   DASHBOARD STATISTICS
========================================================= */

r.get(
    "/stats",
    protect,
    async (req, res) => {

        /* =================================================
           ADMIN DASHBOARD
        ================================================= */

        if (req.user.role === "admin") {
            const [
                titles,
                students,
                active,
                overdue,
                unpaid,
                paid,
                agg
            ] = await Promise.all([
                Book.countDocuments(),

                User.countDocuments({
                    role: "student"
                }),

                Borrow.countDocuments({
                    status: "borrowed"
                }),

                Borrow.countDocuments({
                    status: "borrowed",
                    dueDate: {
                        $lt: new Date()
                    }
                }),

                Fine.aggregate([
                    {
                        $match: {
                            status: "unpaid"
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            v: {
                                $sum: "$amount"
                            }
                        }
                    }
                ]),

                Fine.aggregate([
                    {
                        $match: {
                            status: "paid"
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            v: {
                                $sum: "$amount"
                            }
                        }
                    }
                ]),

                Book.aggregate([
                    {
                        $group: {
                            _id: null,
                            total: {
                                $sum: "$totalCopies"
                            },
                            available: {
                                $sum: "$availableCopies"
                            }
                        }
                    }
                ])
            ]);

            const a = agg[0] || {
                total: 0,
                available: 0
            };

            return res.json({
                bookTitles: titles,
                totalBooks: a.total,
                availableBooks: a.available,
                issuedBooks:
                    a.total - a.available,
                totalStudents: students,
                activeBorrowings: active,
                overdueBooks: overdue,
                outstandingFines:
                    unpaid[0]?.v || 0,
                paidFines:
                    paid[0]?.v || 0
            });
        }


        /* =================================================
           STUDENT DASHBOARD
        ================================================= */

        const [
            active,
            overdue,
            fines,
            history
        ] = await Promise.all([
            Borrow.countDocuments({
                student: req.user._id,
                status: "borrowed"
            }),

            Borrow.countDocuments({
                student: req.user._id,
                status: "borrowed",
                dueDate: {
                    $lt: new Date()
                }
            }),

            Fine.aggregate([
                {
                    $match: {
                        student: req.user._id,
                        status: "unpaid"
                    }
                },
                {
                    $group: {
                        _id: null,
                        v: {
                            $sum: "$amount"
                        }
                    }
                }
            ]),

            Borrow.countDocuments({
                student: req.user._id,
                status: "returned"
            })
        ]);

        res.json({
            currentBorrowed: active,
            overdueBooks: overdue,
            currentFines:
                fines[0]?.v || 0,
            returnHistory: history
        });
    }
);


/* =========================================================
   EXPORT ROUTER
========================================================= */

module.exports = r;