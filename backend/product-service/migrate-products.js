/**
 * Migration Script: Add Category Names to Existing Products
 * 
 * This script populates categoryName and categorySlug fields for existing products
 * that were created before the denormalization changes.
 * 
 * Usage: node migrate-products.js
 */

const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://omerahmed200237_db_user:DxIla04kZgha2YdZ@cluster0.cjmpeva.mongodb.net/Product_db?appName=Cluster0';
const CATEGORY_SERVICE_URL = process.env.CATEGORY_SERVICE_HTTP_URL || 'http://localhost:3006';

// Product Schema
const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  categoryId: String,
  categoryName: String,
  categorySlug: String,
  stock: Number,
  images: [String],
  coverImage: String,
  isActive: Boolean,
  specifications: Object,
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

// Fetch category from Category Service
async function fetchCategory(categoryId) {
  try {
    const response = await axios.get(`${CATEGORY_SERVICE_URL}/categories/${categoryId}`);
    return response.data.data;
  } catch (error) {
    console.error(`Failed to fetch category ${categoryId}:`, error.message);
    return null;
  }
}

// Main migration function
async function migrateProducts() {
  try {
    console.log('🔄 Starting product migration...\n');
    console.log(`📦 Connecting to: ${MONGODB_URI.replace(/:[^:]*@/, ':****@')}\n`);
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find products missing category data
    const productsToMigrate = await Product.find({
      categoryId: { $exists: true, $ne: null },
      $or: [
        { categoryName: { $exists: false } },
        { categoryName: null },
        { categoryName: '' }
      ]
    });

    console.log(`📊 Found ${productsToMigrate.length} products to migrate\n`);

    if (productsToMigrate.length === 0) {
      console.log('✨ All products are already up to date!');
      process.exit(0);
    }

    let successCount = 0;
    let failCount = 0;

    for (const product of productsToMigrate) {
      try {
        console.log(`🔄 Migrating: ${product.name} (ID: ${product._id})`);
        
        const category = await fetchCategory(product.categoryId);
        
        if (category) {
          product.categoryName = category.name;
          product.categorySlug = category.slug;
          await product.save();
          
          console.log(`   ✅ Updated with category: ${category.name} (${category.slug})\n`);
          successCount++;
        } else {
          console.log(`   ❌ Category not found for ID: ${product.categoryId}\n`);
          failCount++;
        }
      } catch (error) {
        console.error(`   ❌ Error migrating product ${product._id}:`, error.message, '\n');
        failCount++;
      }
    }

    console.log('\n📊 Migration Complete!');
    console.log(`   ✅ Successfully migrated: ${successCount} products`);
    console.log(`   ❌ Failed: ${failCount} products`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateProducts();

