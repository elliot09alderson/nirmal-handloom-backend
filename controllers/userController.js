const User = require('../models/User');

// @desc    Add address to user profile
// @route   POST /api/users/address
// @access  Private
const addAddress = async (req, res) => {
    const { street, city, state, zip, country, phone, isDefault, latitude, longitude } = req.body;

    try {
        const user = await User.findById(req.user._id);

        if (user) {
            if (user.addresses.length >= 4) {
                return res.status(400).json({ message: 'You can only save up to 4 addresses' });
            }

            const address = { street, city, state, zip, country, phone, isDefault, latitude, longitude };

            // If new address is default, unset others
            if (isDefault) {
                user.addresses.forEach(addr => addr.isDefault = false);
            } else if (user.addresses.length === 0) {
                // First address is always default
                address.isDefault = true;
            }

            user.addresses.push(address);
            await user.save();
            res.status(201).json(user.addresses);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user addresses
// @route   GET /api/users/address
// @access  Private
const getAddresses = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (user) {
            res.json(user.addresses);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all users (Admin)
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
    try {
        const pageSize = Number(req.query.limit) || 10;
        const page = Number(req.query.page) || 1;

        const count = await User.countDocuments({});
        const users = await User.find({})
            .limit(pageSize)
            .skip(pageSize * (page - 1));

        res.json({ users, page, pages: Math.ceil(count / pageSize), total: count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user status (Enable/Disable)
// @route   PUT /api/users/:id/status
// @access  Private/Admin
const updateUserStatus = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            // Prevent admin from deactivating themselves
            if (req.user._id.toString() === user._id.toString() && req.body.isActive === false) {
                return res.status(400).json({ message: 'You cannot deactivate your own account' });
            }

            user.isActive = req.body.isActive;
            const updatedUser = await user.save();
            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                isActive: updatedUser.isActive,
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            user.phone = req.body.phone || user.phone;
            if (req.body.password) {
                user.password = req.body.password;
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone,
                role: updatedUser.role,
                token: generateToken(updatedUser._id),
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update address
// @route   PUT /api/users/address/:id
// @access  Private
const updateAddress = async (req, res) => {
    const { street, city, state, zip, country, phone, isDefault, latitude, longitude } = req.body;
    try {
        const user = await User.findById(req.user._id);
        if (user) {
            const address = user.addresses.id(req.params.id);
            if (address) {
                address.street = street || address.street;
                address.city = city || address.city;
                address.state = state || address.state;
                address.zip = zip || address.zip;
                address.country = country || address.country;
                address.phone = phone || address.phone;
                address.latitude = latitude !== undefined ? latitude : address.latitude;
                address.longitude = longitude !== undefined ? longitude : address.longitude;
                
                if (isDefault) {
                     user.addresses.forEach(addr => addr.isDefault = false);
                     address.isDefault = true;
                } else if (address.isDefault && isDefault === false) {
                     // If unsetting default, we might want to ensure at least one is default, 
                     // or just let it be. Logic depends on requirements. 
                     // Usually we don't allow unsetting default without setting another. 
                     // But let's allow it for flexibility.
                     address.isDefault = false;
                }

                await user.save();
                res.json(user.addresses);
            } else {
                res.status(404).json({ message: 'Address not found' });
            }
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
         res.status(500).json({ message: error.message });
    }
};

// @desc    Delete address
// @route   DELETE /api/users/address/:id
// @access  Private
const deleteAddress = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (user) {
            user.addresses = user.addresses.filter(addr => addr._id.toString() !== req.params.id);
            await user.save();
            res.json(user.addresses);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const generateToken = require('../utils/generateToken');

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = async (req, res) => {
    let { email, emailOrPhone, password } = req.body;
    emailOrPhone = emailOrPhone || email;

    try {
        // Check if input is email or phone
        const isEmail = emailOrPhone.includes('@');
        const query = isEmail ? { email: emailOrPhone } : { phone: emailOrPhone };

        const user = await User.findOne(query);

        if (user && (await user.matchPassword(password))) {
            if (!user.isActive) {
                return res.status(401).json({ message: 'Account is disabled. Please contact admin.' });
            }

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email/phone or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = async (req, res) => {
    const { name, email, phone, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (!email && !phone) {
        return res.status(400).json({ message: 'Please provide either email or phone number' });
    }

    try {
        // Check if user exists (by email OR phone)
        const userExists = await User.findOne({
            $or: [
                { email: email || null }, // null check avoids matching nulls if not provided
                { phone: phone || null }
            ]
        });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email,
            phone,
            password,
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { authUser, registerUser, addAddress, getAddresses, updateAddress, deleteAddress, getUsers, updateUserStatus, updateUserProfile };
