const express = require("express");
const router = new express.Router();
const db = require("../db");

const { SECRET_KEY, BCRYPT_WORK_FACTOR } = require("../config");
const { ensureLoggedIn, ensureCorrectUser } = require("../middleware/auth");
const Message = require("../models/message");
/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get("/:id", ensureLoggedIn, async (req, res, next) => {
    try {
        const message = await Message.get(req.params.id)
        if (req.user == await message.from_user.username || req.user == await message.to_user.username) {
            return res.json({ message })
        }
        throw newExpressError(`Unauthorized`, 400)
    } catch (err) {
        return next(err)
    }
})


/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post("/", ensureLoggedIn, async (req, res, next) => {
    try {
        const { to_username, body } = req.body
        const username = req.user.username
        const message = await Message.create({ username, to_username, body })
        return res.json(message)
    }
    catch (err) {
        return next(err)
    }
})

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/
router.post("/:id/read", ensureLoggedIn, async (req, res, next) => {
    try {
        const to_username = await db.query(`SELECT to_username FROM messages WHERE id=$1`,
            [req.params.id])
        if (req.user.username === to_username) {
            return res.json(await Message.markRead(req.params.id))
        }
    } catch (err) {
        return next(err)
    }
})

module.exports = router