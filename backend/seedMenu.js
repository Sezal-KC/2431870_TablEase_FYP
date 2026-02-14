const mongoose = require('mongoose');
const MenuItem = require('./Models/MenuItem');
require('dotenv').config();
require('dotenv').config({ path: './.env' })

mongoose.connect(process.env.MONGO_CONN)
  .then(async () => {
    await MenuItem.deleteMany({}); // clear old

    await MenuItem.insertMany([
      // Starters
      { name: 'Chicken Chilli', category: 'Starters', price: 380, imageUrl: 'https://images.unsplash.com/photo-1606890658317-7d14490b76fd?w=400' },
      { name: 'Veg Momo (8 pcs)', category: 'Starters', price: 220, imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=400' },
      { name: 'Chicken Momo (8 pcs)', category: 'Starters', price: 320, imageUrl: 'https://images.unsplash.com/photo-1627308594178-35d0f4d3f3e2?w=400' },
      { name: 'Aloo Sandheko', category: 'Starters', price: 180, imageUrl: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400' },
      
      // Main Course
      { name: 'Dal Bhat Tarkari', category: 'Main Course', price: 280, imageUrl: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400' },
      { name: 'Chicken Sekuwa', category: 'Main Course', price: 450, imageUrl: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400' },
      { name: 'Mutton Curry', category: 'Main Course', price: 520, imageUrl: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400' },
      { name: 'Chowmein (Chicken)', category: 'Main Course', price: 350, imageUrl: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400' },
      
      // Drinks
      { name: 'Lassi (Sweet/Salted)', category: 'Drinks', price: 120, imageUrl: 'https://images.unsplash.com/photo-1570545887536-2e3c5f4b8a0e?w=400' },
      { name: 'Lemon Soda', category: 'Drinks', price: 80, imageUrl: 'https://images.unsplash.com/photo-1621263764928-df144e0e2a3d?w=400' },
      { name: 'Masala Tea', category: 'Drinks', price: 60, imageUrl: 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400' },
      
      // Desserts
      { name: 'Kheer', category: 'Desserts', price: 140, imageUrl: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400' },
      { name: 'Gulab Jamun (2 pcs)', category: 'Desserts', price: 120, imageUrl: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400' },
      { name: 'Sikarni', category: 'Desserts', price: 160, imageUrl: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400' }
    ]);

    console.log('Menu items seeded successfully!');

    console.log('MONGO_CONN value:', process.env.MONGO_CONN); // ← debug line
    console.log('All env vars:', process.env); //
    mongoose.connection.close();
  })
  .catch(err => console.error('Seed error:', err));

