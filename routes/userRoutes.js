const express = require('express');
const router = express.Router();
const { addAddress, getAddresses, updateAddress, deleteAddress, getUsers, updateUserStatus, registerUser, authUser, updateUserProfile } = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/login', authUser);

router.route('/address')
    .post(protect, addAddress)
    .get(protect, getAddresses);

router.route('/address/:id')
    .put(protect, updateAddress)
    .delete(protect, deleteAddress);

router.route('/')
    .post(registerUser)
    .get(protect, admin, getUsers);

router.put('/profile', protect, updateUserProfile);

router.route('/:id/status')
    .put(protect, admin, updateUserStatus);

module.exports = router;
