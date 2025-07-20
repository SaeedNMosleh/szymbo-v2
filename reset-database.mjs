// reset-database.js - Drop all collections except courses and reset course status
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// MongoDB connection
async function connectToDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    await mongoose.connect(mongoUri);
    console.log('🔗 Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
}

// Simple Course schema for this script only
const CourseSchema = new mongoose.Schema({}, { strict: false, collection: 'courses' });
const Course = mongoose.model('Course', CourseSchema);

async function resetDatabase() {
  try {
    await connectToDatabase();
    
    console.log('🔄 Starting database reset...');
    
    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(col => col.name);
    
    console.log('📋 Found collections:', collectionNames);
    
    // Collections to preserve (only courses)
    const preserveCollections = ['courses'];
    
    // Collections to drop (everything except courses)
    const collectionsToDelete = collectionNames.filter(name => 
      !preserveCollections.includes(name) && !name.startsWith('system.')
    );
    
    console.log('🗑️  Collections to delete:', collectionsToDelete);
    console.log('💾 Collections to preserve:', preserveCollections);
    
    // Confirm before proceeding
    if (process.argv.includes('-y')) {
      console.log('✅ Auto-confirming...');
    } else {
      const readline = await import('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise(resolve => {
        rl.question('\n⚠️  Are you sure you want to proceed? This will DELETE all data except courses! (y/N): ', resolve);
      });
      
      rl.close();
      
      if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
        console.log('❌ Operation cancelled');
        return;
      }
    }
    
    // Step 1: Drop all collections except courses
    console.log('\n🗑️  Dropping collections...');
    for (const collectionName of collectionsToDelete) {
      try {
        await mongoose.connection.db.collection(collectionName).drop();
        console.log(`   ✅ Dropped: ${collectionName}`);
      } catch (error) {
        if (error.codeName === 'NamespaceNotFound') {
          console.log(`   ⚠️  Collection ${collectionName} doesn't exist, skipping`);
        } else {
          console.error(`   ❌ Error dropping ${collectionName}:`, error.message);
        }
      }
    }
    
    // Step 2: Reset courses' conceptExtractionStatus to "pending"
    console.log('\n🔄 Resetting course extraction status...');
    
    const updateResult = await Course.updateMany(
      {}, // Match all documents
      { 
        $set: { 
          conceptExtractionStatus: 'pending'
        } 
      }
    );
    
    console.log(`   ✅ Updated ${updateResult.modifiedCount} courses to "pending" status`);
    
    // Step 3: Show final statistics
    console.log('\n📊 Final Statistics:');
    const coursesCount = await Course.countDocuments();
    console.log(`   📚 Courses preserved: ${coursesCount}`);
    
    const remainingCollections = await mongoose.connection.db.listCollections().toArray();
    console.log(`   📁 Total collections remaining: ${remainingCollections.length}`);
    console.log(`   📝 Collection names: ${remainingCollections.map(c => c.name).join(', ')}`);
    
    console.log('\n🎉 Database reset completed successfully!');
    console.log('\n📝 Summary:');
    console.log(`   • Deleted ${collectionsToDelete.length} collections`);
    console.log(`   • Preserved ${coursesCount} courses`);
    console.log(`   • Reset all courses to "pending" extraction status`);
    console.log('\n✨ Your app is ready to be used with fresh data!');
    
  } catch (error) {
    console.error('❌ Error during database reset:', error);
    process.exit(1);
  }
}

// Handle help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
📖 Database Reset Script

Usage: node scripts/reset-database.js [options]

Options:
  -y          Skip confirmation prompt
  -h, --help  Show this help message

What this script does:
  ✅ Preserves all courses in the database
  ❌ Deletes all other collections (concepts, questions, sessions, etc.)
  🔄 Resets all courses' conceptExtractionStatus to "pending"

Example:
  node scripts/reset-database.js          # Interactive mode with confirmation
  node scripts/reset-database.js -y       # Auto-confirm mode
  `);
  process.exit(0);
}

// Run the script
resetDatabase().catch(console.error);