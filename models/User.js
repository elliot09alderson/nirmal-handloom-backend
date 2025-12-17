const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        // Email is not strictly required if phone is present (handled in controller logic usually, but here we can keep unique sparse)
        unique: true,
        sparse: true, // Allows multiple nulls if using phone only
    },
    phone: {
        type: String,
        unique: true,
        sparse: true, // Allows multiple nulls if using email only
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    addresses: [{
        street: String,
        city: String,
        state: String,
        zip: String,
        country: { type: String, default: 'India' },
        phone: String,
        isDefault: { type: Boolean, default: false }
    }],
    wishlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
    }],
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
