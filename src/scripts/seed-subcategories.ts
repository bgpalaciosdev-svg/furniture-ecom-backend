import mongoose from "../db/index";
import Category from "../db/models/category.model";
import Subcategory from "../db/models/subcategory.model";

// Subcategory data mapping
const subcategoryData = {
  Bedroom: [
    "Beds",
    "Nightstands",
    "Dressers",
    "Chest",
    "Mattresses & Foundation",
    "Youth Beds",
    "Vanities",
  ],
  "Living room": [
    "Sofa",
    "Sectionals",
    "Coffee Tables",
    "Loveseat",
    "Entertainment Center",
    "Accent Chairs",
    "Recliners",
    "End Tables",
    "Ottoman",
    "Sleeper Sofa / Day Bed",
  ],
  "Dining Room": [
    "Dining Tables",
    "Chairs",
    "Dining Sets",
    "Counter Height",
    "Bar",
    "Dining Cabinets",
    "Bar Stool & Benches",
  ],
  Office: ["Desk", "Book Cases", "Office Chairs"],
  "Entry and decor": [
    "Console Table",
    "Lamps",
    "Mirrors",
    "Shoe Racks",
    "Wardrobe",
    "Decor",
    "Rugs",
  ],
};

// Helper function to create slug from name
const createSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

const seedSubcategories = async () => {
  try {
    console.log("Starting subcategory seeding...");

    // Find all categories
    const categories = await Category.find();
    console.log(`Found ${categories.length} categories`);

    // Create a map of category names to IDs
    const categoryMap = new Map<string, string>();
    categories.forEach((cat) => {
      categoryMap.set(cat.name, cat._id.toString());
    });

    // Process each category and its subcategories
    for (const [categoryName, subcategoryNames] of Object.entries(
      subcategoryData,
    )) {
      const categoryId = categoryMap.get(categoryName);

      if (!categoryId) {
        console.warn(`Category "${categoryName}" not found. Skipping...`);
        continue;
      }

      console.log(`\nProcessing category: ${categoryName} (ID: ${categoryId})`);

      for (const subcategoryName of subcategoryNames) {
        const slug = createSlug(subcategoryName);

        // Check if subcategory already exists
        const existingSubcategory = await Subcategory.findOne({
          slug: slug,
          category: categoryId,
        });

        if (existingSubcategory) {
          console.log(
            `  ✓ Subcategory "${subcategoryName}" already exists. Skipping...`,
          );
          continue;
        }

        // Create new subcategory
        const subcategory = new Subcategory({
          name: subcategoryName,
          slug: slug,
          category: categoryId,
        });

        await subcategory.save();
        console.log(`  ✓ Created subcategory: ${subcategoryName}`);
      }
    }

    console.log("\n✅ Subcategory seeding completed successfully!");

    // Display summary
    const totalSubcategories = await Subcategory.countDocuments();
    console.log(`\nTotal subcategories in database: ${totalSubcategories}`);
  } catch (error) {
    console.error("Error seeding subcategories:", error);
    throw error;
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log("Database connection closed.");
  }
};

// Run the seed script
seedSubcategories()
  .then(() => {
    console.log("Seed script finished.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed script failed:", error);
    process.exit(1);
  });
