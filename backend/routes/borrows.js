const express = require("express");
const mongoose = require("mongoose");

const Borrow = require("../models/Borrow");
const Book = require("../models/Book");
const User = require("../models/User");
const Fine = require("../models/Fine");

const {
    protect,
    allow
} = require("../middleware/auth");

const router = express.Router();

router.use(protect);


/* =========================================================
   CONSTANTS
========================================================= */

const DAY = 24 * 60 * 60 * 1000;
const BORROW_DAYS = 7;
const FINE_PER_DAY = 10;


/* =========================================================
   HELPERS
========================================================= */

function getDueDate(issueDate) {
    const dueDate = new Date(issueDate);

    dueDate.setDate(
        dueDate.getDate() + BORROW_DAYS
    );

    /*
        Student may return at any time on the displayed
        due date without receiving an overdue fine.
    */
    dueDate.setHours(
        23,
        59,
        59,
        999
    );

    return dueDate;
}


function getOverdueDays(
    dueDate,
    returnDate
) {
    const due = new Date(dueDate);
    const returned = new Date(returnDate);

    if (returned <= due) {
        return 0;
    }

    return Math.max(
        0,
        Math.ceil(
            (
                returned.getTime() -
                due.getTime()
            ) / DAY
        )
    );
}


/* =========================================================
   CREATE BORROWING HELPER
========================================================= */

async function createBorrowing({
    studentId,
    bookId,
    issuedBy
}) {
    const dbSession =
        await mongoose.startSession();

    try {
        let borrowing;

        await dbSession.withTransaction(
            async () => {

                /* -----------------------------------------
                   FIND ACTIVE STUDENT
                ----------------------------------------- */

                const student =
                    await User.findOne({
                        _id: studentId,
                        role: "student",
                        active: true
                    }).session(dbSession);


                if (!student) {
                    throw Object.assign(
                        new Error(
                            "Active student not found"
                        ),
                        {
                            status: 400
                        }
                    );
                }


                /* -----------------------------------------
                   PREVENT DUPLICATE ACTIVE BORROWING
                ----------------------------------------- */

                const existing =
                    await Borrow.exists({
                        student:
                            student._id,

                        book:
                            bookId,

                        status:
                            "borrowed"
                    }).session(
                        dbSession
                    );


                if (existing) {
                    throw Object.assign(
                        new Error(
                            "You already have this book borrowed"
                        ),
                        {
                            status: 409
                        }
                    );
                }


                /* -----------------------------------------
                   RESERVE ONE COPY
                ----------------------------------------- */

                const book =
                    await Book.findOneAndUpdate(
                        {
                            _id:
                                bookId,

                            status:
                                "active",

                            availableCopies: {
                                $gt: 0
                            }
                        },

                        {
                            $inc: {
                                availableCopies:
                                    -1
                            }
                        },

                        {
                            new: true,
                            session:
                                dbSession
                        }
                    );


                if (!book) {
                    throw Object.assign(
                        new Error(
                            "Book is unavailable or inactive"
                        ),
                        {
                            status: 400
                        }
                    );
                }


                /* -----------------------------------------
                   CREATE BORROWING
                ----------------------------------------- */

                const issueDate =
                    new Date();

                const dueDate =
                    getDueDate(
                        issueDate
                    );


                [borrowing] =
                    await Borrow.create(
                        [
                            {
                                student:
                                    student._id,

                                book:
                                    book._id,

                                issuedBy,

                                issueDate,

                                dueDate,

                                status:
                                    "borrowed",

                                fineAmount:
                                    0
                            }
                        ],

                        {
                            session:
                                dbSession
                        }
                    );
            }
        );


        return borrowing;

    } finally {
        await dbSession.endSession();
    }
}


/* =========================================================
   RETURN HELPER
========================================================= */

async function processReturn({
    borrowingId,
    studentId = null
}) {
    const dbSession =
        await mongoose.startSession();

    try {
        let result;

        await dbSession.withTransaction(
            async () => {

                const filter = {
                    _id:
                        borrowingId,

                    status:
                        "borrowed"
                };


                /*
                    For a student return, the borrowing
                    MUST belong to the logged-in student.
                */

                if (studentId) {
                    filter.student =
                        studentId;
                }


                const borrowing =
                    await Borrow.findOne(
                        filter
                    ).session(
                        dbSession
                    );


                if (!borrowing) {
                    throw Object.assign(
                        new Error(
                            studentId
                                ? "Active borrowing not found or this borrowing does not belong to you"
                                : "Active borrowing not found"
                        ),
                        {
                            status: 404
                        }
                    );
                }


                /* -----------------------------------------
                   CALCULATE RETURN + FINE
                ----------------------------------------- */

                const returnDate =
                    new Date();

                const daysOverdue =
                    getOverdueDays(
                        borrowing.dueDate,
                        returnDate
                    );

                const fineAmount =
                    daysOverdue *
                    FINE_PER_DAY;


                /* -----------------------------------------
                   UPDATE BORROWING
                ----------------------------------------- */

                borrowing.status =
                    "returned";

                borrowing.returnDate =
                    returnDate;

                borrowing.fineAmount =
                    fineAmount;


                await borrowing.save({
                    session:
                        dbSession
                });


                /* -----------------------------------------
                   RESTORE BOOK COPY
                ----------------------------------------- */

                const book =
                    await Book.findByIdAndUpdate(
                        borrowing.book,

                        {
                            $inc: {
                                availableCopies:
                                    1
                            }
                        },

                        {
                            new: true,
                            session:
                                dbSession
                        }
                    );


                if (!book) {
                    throw Object.assign(
                        new Error(
                            "Associated book could not be found"
                        ),
                        {
                            status: 404
                        }
                    );
                }


                /* -----------------------------------------
                   CREATE FINE
                ----------------------------------------- */

                if (
                    fineAmount > 0
                ) {
                    await Fine.findOneAndUpdate(
                        {
                            borrowing:
                                borrowing._id
                        },

                        {
                            $setOnInsert: {
                                student:
                                    borrowing.student,

                                amount:
                                    fineAmount,

                                daysOverdue,

                                status:
                                    "unpaid"
                            }
                        },

                        {
                            upsert: true,
                            new: true,
                            session:
                                dbSession
                        }
                    );
                }


                result = {
                    borrowing,
                    daysOverdue,
                    fineAmount
                };
            }
        );


        return result;

    } finally {
        await dbSession.endSession();
    }
}


/* =========================================================
   GET BORROWINGS
========================================================= */

router.get(
    "/",
    async (req, res, next) => {

        try {

            /*
                Admin sees everything.

                Student sees ONLY their own records.
            */

            const filter =
                req.user.role ===
                "admin"
                    ? {}
                    : {
                          student:
                              req.user._id
                      };


            if (
                req.query.status
            ) {
                filter.status =
                    req.query.status;
            }


            const items =
                await Borrow.find(
                    filter
                )

                    .populate(
                        "student",
                        "name email studentId"
                    )

                    .populate(
                        "book",
                        "title author isbn coverImage"
                    )

                    .populate(
                        "issuedBy",
                        "name"
                    )

                    .sort({
                        createdAt:
                            -1
                    });


            res.json(
                items
            );

        } catch (error) {
            next(error);
        }
    }
);


/* =========================================================
   GET OVERDUE
   ADMIN ONLY
========================================================= */

router.get(
    "/overdue",

    allow("admin"),

    async (
        req,
        res,
        next
    ) => {

        try {

            const items =
                await Borrow.find({
                    status:
                        "borrowed",

                    dueDate: {
                        $lt:
                            new Date()
                    }
                })

                    .populate(
                        "student",
                        "name email studentId"
                    )

                    .populate(
                        "book",
                        "title author"
                    )

                    .sort({
                        dueDate:
                            1
                    });


            res.json(
                items
            );

        } catch (error) {
            next(error);
        }
    }
);


/* =========================================================
   ADMIN ISSUE BOOK

   POST /api/borrowings/issue
========================================================= */

router.post(
    "/issue",

    allow("admin"),

    async (req, res) => {

        try {

            const {
                studentId,
                bookId
            } = req.body;


            if (
                !studentId ||
                !bookId
            ) {
                return res
                    .status(400)
                    .json({
                        message:
                            "Student and book are required"
                    });
            }


            const borrowing =
                await createBorrowing({
                    studentId,

                    bookId,

                    issuedBy:
                        req.user._id
                });


            res
                .status(201)
                .json({
                    message:
                        "Book issued successfully",

                    borrowing
                });

        } catch (error) {

            res
                .status(
                    error.status ||
                        400
                )
                .json({
                    message:
                        error.message
                });
        }
    }
);


/* =========================================================
   STUDENT BORROW BOOK

   POST /api/borrowings/borrow
========================================================= */

router.post(
    "/borrow",

    allow("student"),

    async (req, res) => {

        try {

            const {
                bookId
            } = req.body;


            if (!bookId) {
                return res
                    .status(400)
                    .json({
                        message:
                            "Book is required"
                    });
            }


            /*
                IMPORTANT:

                studentId comes from the authenticated
                user, NOT from the request body.

                A student therefore cannot borrow a book
                for another student.
            */

            const borrowing =
                await createBorrowing({
                    studentId:
                        req.user._id,

                    bookId,

                    issuedBy:
                        req.user._id
                });


            res
                .status(201)
                .json({
                    message:
                        "Book borrowed successfully",

                    borrowing
                });

        } catch (error) {

            res
                .status(
                    error.status ||
                        400
                )
                .json({
                    message:
                        error.message
                });
        }
    }
);


/* =========================================================
   RETURN BOOK

   ADMIN:
   Can return any active borrowing.

   STUDENT:
   Can return ONLY their own active borrowing.

   POST /api/borrowings/:id/return
========================================================= */

router.post(
    "/:id/return",

    async (req, res) => {

        try {

            const studentId =
                req.user.role ===
                "student"
                    ? req.user._id
                    : null;


            const result =
                await processReturn({
                    borrowingId:
                        req.params.id,

                    studentId
                });


            res.json(
                result
            );

        } catch (error) {

            res
                .status(
                    error.status ||
                        400
                )
                .json({
                    message:
                        error.message
                });
        }
    }
);


/* =========================================================
   EXPORT
========================================================= */

module.exports = router;