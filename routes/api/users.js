const express = require('express'), { check, validationResult } = require('express-validator'), gravtar = require('gravatar'), bcrypt = require('bcryptjs'), jwt = require('jsonwebtoken'), config = require('config');
const User = require('../../models/User');
const router = express.Router();


// @route   POST api/users
// @desc    Register user
// @access  Public
router.post('/', [
    check('name', 'Name is required').not().notEmpty(),
    check('email', 'Please enter a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { return res.status(400).json({ errors: errors.array() }); }
    const { name, email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) { return res.status(400).json({ errors: [{ msg: 'User already exists' }] }); };
        const avatar = gravtar.url(email, { s: 200, r: 'pg', d: 'mm' });
        user = new User({ name, email, avatar, password });
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save(); const payload = { user: { id: user.id } };
        jwt.sign(payload, config.get('jwtSecret'), { expiresIn: 360000 }, (err, token) => {
            if (err) { throw err; } res.json({ token }); return;
        });
    } catch (e) { console.error(e.message); res.status(500).send('Server Error'); }
});

module.exports = router;