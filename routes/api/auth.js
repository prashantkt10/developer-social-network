const express = require('express'), bcrypt = require('bcryptjs'), jwt = require('jsonwebtoken'), { check, validationResult } = require('express-validator'), config = require('config');
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const router = express.Router();


// @route GET api/auth
// @desc Auth route
// @access Public
router.get('/', auth, async (req, res) => {
    try { const user = await User.findById(req.user.id).select('-password'); res.json(user); }
    catch (e) { console.error(e.message); res.send('Server Error'); }
});

// @route   POST api/users
// @desc    Authenticate User & Get Token
// @access  Public
router.post('/', [
    check('email', 'Please enter a valid email').isEmail(),
    check('password', 'Password is required').exists()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { return res.status(400).json({ errors: errors.array() }); }
    const { email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (!user) { return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] }); };
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) { return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] }); }
        const payload = { user: { id: user.id } };
        jwt.sign(payload, config.get('jwtSecret'), { expiresIn: 360000 }, (err, token) => {
            if (err) { throw err; } res.json({ token }); return;
        });
    } catch (e) { console.error(e.message); res.status(500).send('Server Error'); }
});

module.exports = router;