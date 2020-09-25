const express = require("express");
const router = new express.Router();
const ExpressError = require("../expressError");
const Message = require("../models/message");
const { ensureLoggedIn, ensureCorrectUser } = require("../middleware/auth")

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
        const {username} = req.user;
        const {id} = req.params;
        const message = await Message.get(id);
        if (username == message.from_usernmae || username == message.to_username) {
            return res.json(message);
        } else {
            throw new ExpressError("Not authorized to see this message");
        }

    } catch(e) {
        next(e);
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
        const from_username  = req.user.username;
        const {to_username, body} = req.body;

        const message = await Message.create({from_username, to_username, body});
        res.json({message});

    } catch(e) {
        next(e);
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
        const {id} = req.params;
        const {username} = req.user;
        const message = await Message.get(id);
        if (username != message.to_user.username) {
            throw new ExpressError("You are not authorized to mark this message as read!!", 500);
        }
        const results = await Message.markRead(id);
        const messageRead = results.rows[0];
        return res.json({message: messageRead})

    } catch(e) {
        next(e);
    }
})



module.exports = router;