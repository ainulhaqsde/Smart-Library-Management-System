const express = require("express");

const Book = require("../models/Book");
const Borrow = require("../models/Borrow");

const {
    protect,
    allow
} = require("../middleware/auth");

const r = express.Router();


/* =========================================================
   PROTECT ALL BOOK ROUTES
========================================================= */

r.use(protect);


/* =========================================================
   GET ALL BOOKS
========================================================= */

r.get("/", async (req, res, next) => {
    try {
        const {
            q = "",
            category = "",
            availability = "",
            status = "",
            page = 1,
            limit = 50
        } = req.query;

        const filter = {};

        if (q) {
            filter.$or = [
                "title",
                "author",
                "isbn",
                "category"
            ].map((key) => ({
                [key]: {
                    $regex: q,
                    $options: "i"
                }
            }));
        }

        if (category) {
            filter.category = category;
        }

        if (status) {
            filter.status = status;
        }

        if (availability === "available") {
            filter.availableCopies = {
                $gt: 0
            };
        }

        if (availability === "unavailable") {
            filter.availableCopies = 0;
        }

        const skip =
            (Math.max(1, +page) - 1) *
            Math.min(
                100,
                +limit || 50
            );

        const [items, total] =
            await Promise.all([
                Book.find(filter)
                    .sort({
                        createdAt: -1
                    })
                    .skip(skip)
                    .limit(
                        Math.min(
                            100,
                            +limit || 50
                        )
                    ),

                Book.countDocuments(
                    filter
                )
            ]);

        res.json({
            items,
            total,
            page: +page || 1
        });
    } catch (error) {
        next(error);
    }
});


/* =========================================================
   GET SINGLE BOOK
========================================================= */

r.get("/:id", async (req, res, next) => {
    try {
        const book =
            await Book.findById(
                req.params.id
            );

        if (!book) {
            return res.status(404).json({
                message: "Book not found"
            });
        }

        res.json(book);
    } catch (error) {
        next(error);
    }
});


/* =========================================================
   CREATE BOOK
   ADMIN ONLY
========================================================= */

r.post(
    "/",
    allow("admin"),
    async (req, res) => {
        try {
            const total = Math.max(
                1,
                +req.body.totalCopies || 1
            );

            const book =
                await Book.create({
                    ...req.body,
                    totalCopies: total,
                    availableCopies: total
                });

            res.status(201).json(book);
        } catch (error) {
            res.status(400).json({
                message:
                    error.code === 11000
                        ? "ISBN already exists"
                        : error.message
            });
        }
    }
);


/* =========================================================
   UPDATE BOOK
   ADMIN ONLY
========================================================= */

r.put(
    "/:id",
    allow("admin"),
    async (req, res) => {
        try {
            const book =
                await Book.findById(
                    req.params.id
                );

            if (!book) {
                return res
                    .status(404)
                    .json({
                        message:
                            "Book not found"
                    });
            }

            const issued =
                book.totalCopies -
                book.availableCopies;

            const total = Math.max(
                issued,
                +req.body.totalCopies ||
                    book.totalCopies
            );

            const allowed = [
                "title",
                "author",
                "category",
                "isbn",
                "description",
                "coverImage",
                "publisher",
                "publicationYear",
                "language",
                "shelfLocation",
                "status"
            ];

            allowed.forEach((key) => {
                if (
                    req.body[key] !==
                    undefined
                ) {
                    book[key] =
                        req.body[key];
                }
            });

            book.totalCopies = total;

            book.availableCopies =
                total - issued;

            await book.save();

            res.json(book);
        } catch (error) {
            res.status(400).json({
                message:
                    error.code === 11000
                        ? "ISBN already exists"
                        : error.message
            });
        }
    }
);


/* =========================================================
   UPDATE BOOK STATUS
   ADMIN ONLY
========================================================= */

r.patch(
    "/:id/status",
    allow("admin"),
    async (req, res) => {
        const book =
            await Book.findByIdAndUpdate(
                req.params.id,
                {
                    status:
                        req.body.status
                },
                {
                    new: true,
                    runValidators: true
                }
            );

        if (!book) {
            return res.status(404).json({
                message: "Book not found"
            });
        }

        res.json(book);
    }
);


/* =========================================================
   DELETE BOOK
   ADMIN ONLY
========================================================= */

r.delete(
    "/:id",
    allow("admin"),
    async (req, res) => {
        if (
            await Borrow.exists({
                book: req.params.id,
                status: "borrowed"
            })
        ) {
            return res.status(409).json({
                message:
                    "Return all active copies before deleting this book"
            });
        }

        const book =
            await Book.findByIdAndDelete(
                req.params.id
            );

        if (!book) {
            return res.status(404).json({
                message: "Book not found"
            });
        }

        res.json({
            message: "Book deleted"
        });
    }
);


/* =========================================================
   EXPORT ROUTER
========================================================= */

module.exports = r;