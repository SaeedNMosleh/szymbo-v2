// select-collections-to-drop.mjs - Selectively drop collections based on user input
import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// MongoDB connection
async function connectToDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI environment variable is not set");
    }

    await mongoose.connect(mongoUri);
    console.log("🔗 Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    throw error;
  }
}

// Simple Course schema for this script only
const CourseSchema = new mongoose.Schema(
  {},
  { strict: false, collection: "courses" }
);
const Course = mongoose.model("Course", CourseSchema);

async function selectiveReset() {
  try {
    await connectToDatabase();

    console.log("🔍 Analyzing database collections...");

    // Get all collections
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    const collectionNames = collections
      .map((col) => col.name)
      .filter((name) => !name.startsWith("system."));

    console.log(`\n📋 Found ${collectionNames.length} collections:`);

    if (collectionNames.length === 0) {
      console.log("❌ No collections found to drop");
      return;
    }

    // Display collections with numbers
    collectionNames.forEach((name, index) => {
      console.log(`   ${index + 1}. ${name}`);
    });

    // Get user input for which collections to drop
    const readline = await import("readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    // Handle selection options
    console.log("\n🔢 Selection options:");
    console.log('   • Enter numbers separated by commas (e.g., "1,3,5")');
    console.log('   • Enter a range (e.g., "1-5")');
    console.log('   • Enter "all" to select all collections');
    console.log('   • Enter "none" to cancel the operation');
    console.log('   • You can combine options (e.g., "1-3,5,7-9")');

    const userInput = await new Promise((resolve) => {
      rl.question("\n🔍 Which collections would you like to drop? ", resolve);
    });

    // Parse user input
    let collectionsToDelete = [];

    if (userInput.toLowerCase() === "all") {
      collectionsToDelete = [...collectionNames];
    } else if (userInput.toLowerCase() === "none") {
      console.log("❌ Operation cancelled");
      rl.close();
      return;
    } else {
      // Handle comma-separated and range inputs
      const parts = userInput.split(",").map((part) => part.trim());

      for (const part of parts) {
        if (part.includes("-")) {
          // Handle range (e.g., "1-5")
          const [start, end] = part
            .split("-")
            .map((num) => parseInt(num.trim(), 10));

          if (
            isNaN(start) ||
            isNaN(end) ||
            start < 1 ||
            end > collectionNames.length
          ) {
            console.log(
              `⚠️ Invalid range: ${part}. Must be between 1 and ${collectionNames.length}`
            );
            continue;
          }

          for (let i = start; i <= end; i++) {
            collectionsToDelete.push(collectionNames[i - 1]);
          }
        } else {
          // Handle single number
          const index = parseInt(part, 10);

          if (isNaN(index) || index < 1 || index > collectionNames.length) {
            console.log(
              `⚠️ Invalid number: ${part}. Must be between 1 and ${collectionNames.length}`
            );
            continue;
          }

          collectionsToDelete.push(collectionNames[index - 1]);
        }
      }
    }

    // Remove duplicates
    collectionsToDelete = [...new Set(collectionsToDelete)];

    if (collectionsToDelete.length === 0) {
      console.log("❌ No valid collections selected for deletion");
      rl.close();
      return;
    }

    // Display selected collections
    console.log("\n🗑️ Collections selected for deletion:");
    collectionsToDelete.forEach((name, index) => {
      console.log(`   ${index + 1}. ${name}`);
    });

    // Confirm before proceeding
    const confirmation = await new Promise((resolve) => {
      rl.question(
        "\n⚠️ Are you sure you want to proceed with deletion? (y/N): ",
        resolve
      );
    });

    rl.close();

    if (
      confirmation.toLowerCase() !== "y" &&
      confirmation.toLowerCase() !== "yes"
    ) {
      console.log("❌ Operation cancelled");
      return;
    }

    // Drop selected collections
    console.log("\n🗑️ Dropping collections...");
    for (const collectionName of collectionsToDelete) {
      try {
        await mongoose.connection.db.collection(collectionName).drop();
        console.log(`   ✅ Dropped: ${collectionName}`);
      } catch (error) {
        if (error.codeName === "NamespaceNotFound") {
          console.log(
            `   ⚠️ Collection ${collectionName} doesn't exist, skipping`
          );
        } else {
          console.error(
            `   ❌ Error dropping ${collectionName}:`,
            error.message
          );
        }
      }
    }

    // Ask if the user wants to reset courses' conceptExtractionStatus
    const shouldResetCourses = await new Promise((resolve) => {
      const rlReset = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      rlReset.question(
        '\n🔄 Do you want to reset courses\' conceptExtractionStatus to "pending"? (y/N): ',
        (answer) => {
          rlReset.close();
          resolve(
            answer.toLowerCase() === "y" || answer.toLowerCase() === "yes"
          );
        }
      );
    });

    if (shouldResetCourses) {
      console.log("\n🔄 Resetting course extraction status...");

      const updateResult = await Course.updateMany(
        {}, // Match all documents
        {
          $set: {
            conceptExtractionStatus: "pending",
          },
        }
      );

      console.log(
        `   ✅ Updated ${updateResult.modifiedCount} courses to "pending" status`
      );
    }

    // Show final statistics
    console.log("\n📊 Final Statistics:");
    const coursesCount = await Course.countDocuments();
    console.log(`   📚 Courses count: ${coursesCount}`);

    const remainingCollections = await mongoose.connection.db
      .listCollections()
      .toArray();
    console.log(
      `   📁 Total collections remaining: ${remainingCollections.length}`
    );
    console.log(
      `   📝 Collection names: ${remainingCollections.map((c) => c.name).join(", ")}`
    );

    console.log("\n🎉 Selective collection drop completed successfully!");
    console.log("\n📝 Summary:");
    console.log(`   • Deleted ${collectionsToDelete.length} collections`);
    if (shouldResetCourses) {
      console.log(`   • Reset courses to "pending" extraction status`);
    }
    console.log("\n✨ Your database has been updated!");
  } catch (error) {
    console.error("❌ Error during operation:", error);
    process.exit(1);
  } finally {
    // Ensure the process exits
    process.exit(0);
  }
}

// Handle help
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`
📖 Selective Collection Drop Script

Usage: node select-collections-to-drop.mjs [options]

Options:
  -h, --help  Show this help message

What this script does:
  ✅ Lists all collections in the database with numbers
  ✅ Allows you to select which collections to drop
  ✅ Optionally resets courses' conceptExtractionStatus to "pending"

Selection syntax:
  • Individual numbers: "1,3,5"
  • Ranges: "1-5" 
  • Combinations: "1-3,5,7-9"
  • All collections: "all"
  • Cancel: "none"

Example:
  node select-collections-to-drop.mjs
  `);
  process.exit(0);
}

// Run the script
selectiveReset().catch(console.error);
