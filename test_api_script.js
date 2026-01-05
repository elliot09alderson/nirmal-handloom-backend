const axios = require('axios');

const API_URL = 'http://localhost:5001/api';

const testAPIs = async () => {
    let token = ''; // Need a valid token for admin tests

    console.log('--- Starting Pagination API Tests ---');

    // 1. Login (Admin) to get token
    try {
        console.log('\nTesting Admin Login...');
        const res = await axios.post(`${API_URL}/users/login`, {
            email: 'admin@example.com',
            password: '123456'
        });
        token = res.data.token;
        console.log(`✅ Admin Login Success. Role: ${res.data.role}`);
    } catch (error) {
        console.error('❌ Admin Login Failed:', error.message);
        return; // Exit if login fails
    }

    // 2. Test Get Products Pagination
    try {
        console.log('\nTesting Get Products Pagination (Page 1, Limit 5)...');
        const res = await axios.get(`${API_URL}/products?page=1&limit=5`);
        if (res.data.products && res.data.products.length <= 5 && res.data.page === 1) {
             console.log(`✅ Get Products Pagination Success. Count: ${res.data.products.length}, Page: ${res.data.page}, Total Pages: ${res.data.pages}`);
        } else {
             console.error('❌ Get Products Pagination Failed (Invalid Structure)');
        }
    } catch (error) {
        console.error('❌ Get Products Pagination Failed:', error.message);
    }

    // 3. Test Get Users Pagination (Admin)
    try {
        console.log('\nTesting Get Users Pagination (Page 1, Limit 2)...');
        const res = await axios.get(`${API_URL}/users?page=1&limit=2`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.users && res.data.users.length <= 2 && res.data.page === 1) {
            console.log(`✅ Get Users Pagination Success. Count: ${res.data.users.length}, Page: ${res.data.page}, Total Pages: ${res.data.pages}`);
        } else {
             console.error('❌ Get Users Pagination Failed (Invalid Structure)');
        }
    } catch (error) {
        console.error('❌ Get Users Pagination Failed:', error.message);
    }

    // 4. Test Get Orders Pagination (Admin)
    try {
        console.log('\nTesting Get Orders Pagination (Page 1, Limit 2)...');
        const res = await axios.get(`${API_URL}/orders?page=1&limit=2`, {
             headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.orders && res.data.page === 1) {
             console.log(`✅ Get Orders Pagination Success. Count: ${res.data.orders.length}, Page: ${res.data.page}, Total Pages: ${res.data.pages}`);
        } else {
             console.error('❌ Get Orders Pagination Failed (Invalid Structure)');
        }
    } catch (error) {
        console.error('❌ Get Orders Pagination Failed:', error.message);
    }

    console.log('\n--- Pagination API Tests Completed ---');
};

testAPIs();
