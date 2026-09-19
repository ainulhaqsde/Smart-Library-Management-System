const express = require("express");

const Fine = require("../models/Fine");

const {
    protect,
    allow
} = require("../middleware/auth");

const r = express.Router();


/* =========================================================
   PROTECT ALL FINE ROUTES
========================================================= */

r.use(protect);


/* =========================================================
   GET FINES
========================================================= */

r.get("/", async (req, res) => {
    const filter =
        req.user.role === "admin"
            ? {}
            : {
                  student: req.user._id
              };

    res.json(
        await Fine.find(filter)
            .populate(
                "student",
                "name email studentId"
            )
            .populate({
                path: "borrowing",
                populate: {
                    path: "book",
                    select: "title author"
                }
            })
            .populate(
                "collectedBy",
                "name"
            )
            .sort({
                createdAt: -1
            })
    );
});


/* =========================================================
   MARK FINE AS PAID
   ADMIN ONLY
========================================================= */

r.post(
    "/:id/pay",
    allow("admin"),
    async (req, res) => {
        const fine =
            await Fine.findOneAndUpdate(
                {
                    _id: req.params.id,
                    status: "unpaid"
                },
                {
                    status: "paid",
                    paidAt: new Date(),
                    collectedBy:
                        req.user._id
                },
                {
                    new: true
                }
            );

        if (!fine) {
            return res.status(404).json({
                message:
                    "Unpaid fine not found"
            });
        }

        res.json(fine);
    }
);


/* =========================================================
   EXPORT ROUTER
========================================================= */

module.exports = r;