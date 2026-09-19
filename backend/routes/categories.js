const express = require("express");

const Category = require("../models/Category");
const Book = require("../models/Book");

const {
    protect,
    allow
} = require("../middleware/auth");

const r = express.Router();


/* =========================================================
   PROTECT ALL CATEGORY ROUTES
========================================================= */

r.use(protect);


/* =========================================================
   GET ALL CATEGORIES
========================================================= */

r.get("/", async (req, res) => {
    res.json(
        await Category.find().sort({
            name: 1
        })
    );
});


/* =========================================================
   CREATE CATEGORY
   ADMIN ONLY
========================================================= */

r.post(
    "/",
    allow("admin"),
    async (req, res) => {
        try {
            res.status(201).json(
                await Category.create(
                    req.body
                )
            );
        } catch (error) {
            res.status(400).json({
                message:
                    error.code === 11000
                        ? "Category already exists"
                        : error.message
            });
        }
    }
);


/* =========================================================
   UPDATE CATEGORY
   ADMIN ONLY
========================================================= */

r.put(
    "/:id",
    allow("admin"),
    async (req, res) => {
        const category =
            await Category.findByIdAndUpdate(
                req.params.id,
                req.body,
                {
                    new: true,
                    runValidators: true
                }
            );

        if (!category) {
            return res.status(404).json({
                message:
                    "Category not found"
            });
        }

        res.json(category);
    }
);


/* =========================================================
   GET BOOKS BY CATEGORY
========================================================= */

r.get(
    "/:id/books",
    async (req, res) => {
        const category =
            await Category.findById(
                req.params.id
            );

        if (!category) {
            return res.status(404).json({
                message:
                    "Category not found"
            });
        }

        res.json(
            await Book.find({
                category: category.name,
                status: "active"
            })
        );
    }
);


/* =========================================================
   EXPORT ROUTER
========================================================= */

module.exports = r;