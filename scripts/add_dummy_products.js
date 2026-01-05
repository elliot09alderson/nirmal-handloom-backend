const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:5001/api';
// Use the ID for "Banarsi Silk" found in previous step
const CATEGORY_ID = '6951f749a431f12816745166';

async function addProductWithImages() {
    try {
        // 1. Use downloaded real images
        const images = ['image1.jpg', 'image2.jpg', 'image3.jpg', 'image4.jpg'];
        const imagePaths = [];
        for (const imgName of images) {
             imagePaths.push(path.join(__dirname, imgName));
        }

        // 2. Login as specific Admin
        // Use the admin we created in the previous successful run
        // If this admin doesn't exist (DB reset), you need to re-enable userController hack temporarily.
        const adminEmail = 'admin_1767598193610@example.com'; 
        const password = 'password123';
        
        console.log(`Logging in as Admin: ${adminEmail}`);
        
        let token;
        try {
            const loginRes = await axios.post(`${API_URL}/users/login`, {
                email: adminEmail,
                password: password
            });
            token = loginRes.data.token;
            console.log('✅ Logged in successfully.');
        } catch (e) {
            console.error('❌ Login failed:', e.response ? e.response.data : e.message);
            // Fallback: Try to register (will fail if hack is removed, but worth a shot if DB was reset and hack is missing)
            console.log('Ensure you have a valid admin user.');
            return;
        }

        if (!token) return;

        // 3. Define Products
        const products_to_add = [
            {
                name: 'Royal Banarsi Silk Saree',
                price: 15999,
                description: 'Authentic Banarsi Silk saree handwoven with pure gold zari work. Perfect for weddings.',
                category: CATEGORY_ID, 
                countInStock: 10,
                discount: 10,
                isActive: true
            },
            {
                name: 'Elegant Chanderi Cotton Suit',
                price: 4500,
                description: 'Lightweight and comfortable Chanderi cotton suit piece for daily wear.',
                category: CATEGORY_ID, // Ideally use Chanderi ID if known, defaulting to same for test
                countInStock: 15,
                discount: 5,
                isActive: true
            },
            {
                name: 'Traditional Kanjivaram Silk',
                price: 25000,
                description: 'Vibrant Kanjivaram silk saree with temple border design.',
                category: CATEGORY_ID, 
                countInStock: 5,
                discount: 0,
                isActive: true
            },
            {
                name: 'Modern Party Wear Gown',
                price: 8999,
                description: 'Stylish western gown with embroidery, perfect for receptions.',
                category: CATEGORY_ID,
                countInStock: 8,
                discount: 15,
                isActive: true
            }
        ];

        console.log(`Starting upload of ${products_to_add.length} products...`);

        for (const productData of products_to_add) {
            const form = new FormData();
            form.append('name', productData.name);
            form.append('price', productData.price);
            form.append('description', productData.description);
            form.append('category', productData.category);
            form.append('countInStock', productData.countInStock);
            form.append('discount', productData.discount);
            form.append('isActive', String(productData.isActive));

            // Append dummy images (reuse the same ones for now for simplicity, or rotate)
            imagePaths.forEach(p => {
                form.append('images', fs.createReadStream(p));
            });

            console.log(`Uploading: ${productData.name}...`);
            const config = {
                headers: {
                    ...form.getHeaders(),
                    Authorization: `Bearer ${token}`
                }
            };

            const response = await axios.post(`${API_URL}/products`, form, config);
            console.log(`✅ Created: ${response.data.name} (ID: ${response.data._id})`);
            console.log(`   Image URL: ${response.data.image}`);
        }

        console.log('All products created successfully!');
        
        // Cleanup
        imagePaths.forEach(p => fs.unlinkSync(p));

    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

addProductWithImages();
