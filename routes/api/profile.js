const express = require('express'), { check, validationResult } = require('express-validator'), config = require('config'), request = require('request');
const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile');
const User = require('../../models/User');
const router = express.Router();



// @route GET api/profile/me
// @desc get current user
// @access Private
router.get('/me', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'avatar']);
        if (!profile) return res.status(400).json({ msg: 'There is no profile for this user' });
        return res.json(profile);
    }
    catch (e) { console.error(e.message); return res.status(500).send('Server Error'); }
});


//  @route  POST /api/profile
//  @desc   Create or update user profile
//  @access Private
router.post('/', [auth, [
    check('status', 'Status is required').not().isEmpty(),
    check('skills', 'Skills is required').not().isEmpty()
]], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { return res.status(400).json({ errors: errors.array() }); }
    const { company, website, location, bio, status, githubusername, skills, youtube, facebook, twitter, instagram, linkedin } = req.body;

    //Build profile objects
    const profileFields = {};
    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;
    if (skills) profileFields.skills = skills.split(',').map((skill) => skill.trim());

    //Build social object
    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (facebook) profileFields.social.facebook = facebook;
    if (twitter) profileFields.social.twitter = twitter;
    if (instagram) profileFields.social.instagram = instagram;
    if (linkedin) profileFields.social.linkedin = linkedin;
    try {
        let profile = await Profile.findOne({ user: req.user.id });
        if (profile) {
            profile = await Profile.findOneAndUpdate({ user: req.user.id }, { $set: profileFields }, { new: true });
            return res.json(profile);
        }
        profile = new Profile(profileFields); await profile.save(); return res.json(profile);

    } catch (e) { console.error(e.message); return res.status(500).send('Server Error'); }
});

//@route    GET api/profile
//@desc     Get all profiles
//@access   Public
router.get('/', async (req, res) => {
    try {
        const profiles = await Profile.find().populate('user', ['name', 'avatar']);
        return res.json(profiles);
    } catch (e) { console.log(e.message); return res.status(500).send('Server Error'); }
});


//@route    GET api/profile/user/user_id
//@desc     Get profile by user id
//@access   Public
router.get('/user/:user_id', async (req, res) => {
    try {
        const profiles = await Profile.findOne({ user: req.params.user_id }).populate('user', ['name', 'avatar']);
        if (!profiles) { return res.status(400).json({ msg: 'There is no profile for this user' }); }
        return res.json(profiles);
    } catch (e) {
        console.log(e.message);
        if (e.kind == 'ObjectId') { return res.status(400).json({ msg: 'There is no profile for this user' }); }
        return res.status(500).send('Server Error');
    }
});


//@route    DELETE api/profile
//@desc     Get profile, user & posts
//@access   Private
router.delete('/', auth, async (req, res) => {
    try {
        await Promise.all([User.findOneAndDelete({ _id: req.user.id }), Profile.findOneAndDelete({ user: req.user.id })]);
        return res.json({ msg: 'User Deleted' });
    } catch (e) { return res.status(500).send('Server Error'); }
});


//  @route  PUT api/profile/experience
//  @desc   Add profile experience
//  @access Private
router.put('/experience', [auth, [
    check('title', 'Title is required').not().isEmpty(),
    check('company', 'Company is required').not().isEmpty(),
    check('from', 'From date is required').not().isEmpty(),
]], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { return res.status(400).json({ errors: errors.array() }) }
    const { title, company, location, from, to, current, description } = req.body;
    const newExp = { title, company, location, from, to, current, description };
    try {
        const profile = await Profile.findOne({ user: req.user.id });
        profile.experience.unshift(newExp);
        await profile.save(); return res.json(profile);
    } catch (e) { console.log(e.message); return res.send(500).send('Server Error'); }
});


//  @route  DELETE api/profile/experience/:exp_id
//  @desc   Delete profile experience
//  @access Private
router.delete('/experience/:exp_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });
        const removeIndex = profile.experience.map(item => item._id).indexOf(req.params.exp_id);
        if (removeIndex < 0) { return res.status(400).send('Invalid request'); }
        profile.experience.splice(removeIndex, 1);
        await profile.save(); return res.json(profile);
    } catch (e) { console.log(e.message); return res.status(500).send('Server Error'); }
});



//  @route  PUT api/profile/education
//  @desc   Add profile education
//  @access Private
router.put('/education', [auth, [
    check('school', 'School is required').not().isEmpty(),
    check('degree', 'Degree is required').not().isEmpty(),
    check('fieldofstudy', 'Field of study is required').not().isEmpty(),
]], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { return res.status(400).json({ errors: errors.array() }) }
    const { school, degree, fieldofstudy, from, to, current, description } = req.body;
    const newEdu = { school, degree, fieldofstudy, from, to, current, description };
    try {
        const profile = await Profile.findOne({ user: req.user.id });
        profile.education.unshift(newEdu);
        await profile.save(); return res.json(profile);
    } catch (e) { console.log(e.message); return res.status(500).send('Server Error'); }
});


//  @route  DELETE api/profile/education/:edu_id
//  @desc   Delete profile education
//  @access Private
router.delete('/education/:edu_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });
        const removeIndex = profile.education.map(item => item._id).indexOf(req.params.edu_id);
        if (removeIndex < 0) { return res.status(400).send('Invalid request'); }
        profile.education.splice(removeIndex, 1);
        await profile.save(); return res.json(profile);
    } catch (e) { console.log(e.message); return res.status(500).send('Server Error'); }
});

//  @route  GET api/profile/github/:username
//  @desc   Get user repos from Github
//  @access Public
router.get('/github/:username', (req, res) => {
    try {
        const options = {
            uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get('gitClientID')}&client_secret=${config.get('gitClientSecret')}`,
            method: 'GET',
            headers: { 'user-agent': 'node.js' }
        };
        console.log(options.uri);
        request(options, (er, response, body) => {
            if (er) { console.error(er.message); }
            if (response.statusCode != 200) { return res.status(404).json({ msg: 'No Github Profile found' }); }
            return res.json(JSON.parse(body));
        });
    }
    catch (e) { }
});

module.exports = router;