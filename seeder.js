const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');
const Category = require('./models/Category');
const SubCategory = require('./models/SubCategory');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const categoryData = [
    {
        name: 'Silk Sarees',
        subcategories: ['Banarasi Silk', 'Kanjivaram Silk', 'Patola Silk', 'Paithani Silk', 'Assam Silk', 'Mysore Silk', 'Uppada Silk', 'Gadwal Silk', 'Tussar Silk', 'Raw Silk']
    },
    {
        name: 'Cotton Sarees',
        subcategories: ['Pure Cotton', 'Khadi Cotton', 'Chanderi Cotton', 'Kota Cotton', 'Bengal Cotton', 'Handloom Cotton']
    },
    {
        name: 'Georgette Sarees',
        subcategories: ['Printed Georgette', 'Embroidered Georgette', 'Designer Georgette']
    },
    {
        name: 'Chiffon Sarees',
        subcategories: ['Printed Chiffon', 'Designer Chiffon', 'Embellished Chiffon']
    },
    {
        name: 'Organza Sarees',
        subcategories: ['Pure Organza', 'Printed Organza', 'Embroidered Organza']
    },
    {
        name: 'Banarasi Sarees',
        subcategories: ['Katan Banarasi', 'Organza Banarasi', 'Georgette Banarasi', 'Soft Silk Banarasi']
    },
    {
        name: 'Handloom Sarees',
        subcategories: ['Jamdani', 'Ikat', 'Bhagalpuri', 'Maheshwari', 'Sambalpuri']
    },
    {
        name: 'Printed Sarees',
        subcategories: ['Digital Print', 'Block Print', 'Floral Print', 'Kalamkari Print']
    },
    {
        name: 'Party Wear Sarees',
        subcategories: ['Sequin Sarees', 'Stone Work Sarees', 'Heavy Work Sarees', 'Designer Party Sarees']
    },
    {
        name: 'Net Sarees',
        subcategories: ['Embroidered Net', 'Stone Work Net', 'Designer Net']
    }
];

// Helper to get random item from array
const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const importData = async () => {
    try {
        await connectDB();

        // CLEAR EXISTING DATA
        await Order.deleteMany();
        await Product.deleteMany();
        await User.deleteMany();
        await Category.deleteMany();
        await SubCategory.deleteMany();

        console.log('Data Cleared');

        // CREATE USERS
        const createdUsers = await User.create([
            {
                name: 'Admin User',
                email: 'admin@example.com',
                password: '123456',
                role: 'admin',
                isActive: true
            },
            {
                name: 'John Doe',
                email: 'john@example.com',
                password: '123456',
                role: 'user',
                isActive: true
            },
        ]);

        const adminUser = createdUsers[0]._id;
        console.log('Users Created');

        // CREATE CATEGORIES & SUBCATEGORIES
        let allProducts = [];

        // Loop through each main category
        for (const catData of categoryData) {
            // Create Category
            const category = await Category.create({
                name: catData.name,
                description: `Collection of ${catData.name}`,
                isActive: true
            });

            // Create Subcategories
            const subCatIds = [];
            for (const subName of catData.subcategories) {
                const subCat = await SubCategory.create({
                    name: subName,
                    category: category._id,
                    isActive: true
                });
                subCatIds.push(subCat._id);

                // For each subcategory, create 1-3 products
                const numProducts = Math.floor(Math.random() * 3) + 1;
                for (let i = 0; i < numProducts; i++) {
                    const price = Math.floor(Math.random() * (25000 - 2000) + 2000); // 2000 to 25000
                    const discount = Math.random() > 0.3 ? Math.floor(Math.random() * 30) : 0; // 70% chance of discount

                    allProducts.push({
                        name: `${subName} Exclusive ${i + 1}`,
                        image: getRandom([
                            'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800',
                            'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=800',
                            'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&q=80&w=800',
                            'https://images.unsplash.com/photo-1610030469668-965361487501?auto=format&fit=crop&q=80&w=800',
                            'https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&q=80&w=800',
                        ]),
                        description: `Premium ${subName} from Nirmal Handloom. Perfect for special occasions. Handwoven with care.`,
                        brand: 'Nirmal Handloom',
                        category: category._id,      // Main Category ID
                        subcategory: subCat._id,     // SubCategory ID
                        price: price,
                        discount: discount,
                        countInStock: Math.floor(Math.random() * 20) + 1,
                        rating: (Math.random() * (5 - 3.5) + 3.5).toFixed(1), // 3.5 to 5
                        numReviews: Math.floor(Math.random() * 50),
                        user: adminUser,
                    });
                }
            }
        }

        await Product.insertMany(allProducts);
        console.log(`Created ${allProducts.length} Products across all categories`);

        console.log('Data Imported!');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

const destroyData = async () => {
    try {
        await connectDB();
        await Order.deleteMany();
        await Product.deleteMany();
        await User.deleteMany();
        await Category.deleteMany();
        await SubCategory.deleteMany();

        console.log('Data Destroyed!');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

if (process.argv[2] === '-d') {
    destroyData();
} else {
    importData();
}
