import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Brand from '../models/Brand.js';
import BrandGuideline from '../models/BrandGuideline.js';
import ApprovedFact from '../models/ApprovedFact.js';
import TerminologyRule from '../models/TerminologyRule.js';
import BrandVisualAsset from '../models/BrandVisualAsset.js';
import { connectDB, closeDB } from '../config/db.js';

dotenv.config();

/**
 * Seeds fictional brand data for "NovaFit" to support end-to-end testing and demos.
 * Clearly labeled as FICTIONAL test data.
 *
 * @param {mongoose.Types.ObjectId} [targetOrgId] - Optional organization ID
 * @param {mongoose.Types.ObjectId} [adminUserId] - Optional admin user ID
 */
export const seedNovaFitData = async (targetOrgId, adminUserId) => {
  let orgId = targetOrgId;
  let userId = adminUserId;

  // If no user provided, find or create default NovaFit admin
  if (!userId) {
    const existingAdmin = (await User.findOne({ role: 'admin' })) || (await User.findOne());
    let admin = await User.findOne({ email: 'admin@novafit.test' });
    if (!admin) {
      orgId = orgId || (existingAdmin ? existingAdmin.organizationId : new mongoose.Types.ObjectId());
      admin = new User({
        name: 'NovaFit Brand Admin (Fictional Demo)',
        email: 'admin@novafit.test',
        passwordHash: 'DemoPassword123!',
        role: 'admin',
        organizationId: orgId,
      });
      await admin.save();
    } else if (existingAdmin && admin.organizationId.toString() !== existingAdmin.organizationId.toString() && !targetOrgId) {
      admin.organizationId = existingAdmin.organizationId;
      await admin.save();
    }
    userId = admin._id;
    orgId = admin.organizationId;
  }

  // 1. Create or update Brand "NovaFit"
  let brand = await Brand.findOne({ organizationId: orgId, name: 'NovaFit' });
  if (!brand) {
    brand = new Brand({
      name: 'NovaFit',
      description: 'Fictional fitness brand for brand governance and AI compliance testing',
      tone: 'Professional and encouraging',
      organizationId: orgId,
      createdBy: userId,
      status: 'active',
      visualIdentity: {
        primaryColors: ['#FF4500', '#1E1E1E'],
        secondaryColors: ['#F5F5F5'],
        prohibitedColors: ['#39FF14'],
        logoRules: {
          clearSpace: '24px',
          minimumHeight: '32px',
          allowMonochrome: true,
          prohibitSkewing: true,
        },
        typography: {
          primaryFont: 'Inter',
          headingFont: 'Montserrat',
        },
      },
    });
    await brand.save();
  }

  // 2. Seed Guidelines
  const guidelinesData = [
    {
      title: 'Professional and Encouraging Tone',
      category: 'Tone of voice',
      ruleText:
        'All copy must maintain a professional and encouraging tone. Avoid aggressive slang, excessive hype, or informal greetings like "Hey guys" in formal promotional messages.',
      severity: 'medium',
    },
    {
      title: 'No Unsupported Market Leadership Claims',
      category: 'Claims and disclaimers',
      ruleText:
        'Do not claim "India\'s No. 1 fitness app" or any equivalent superlative ranking unless independently substantiated and accompanied by an explicit, approved third-party audit citation.',
      severity: 'high',
    },
    {
      title: 'Member-Centric Community Terminology',
      category: 'Prohibited content',
      ruleText:
        'Never address or refer to customers as "users". Always refer to our fitness community as "members".',
      severity: 'high',
    },
    {
      title: 'Exact Product Pricing Consistency',
      category: 'Required phrases',
      ruleText:
        'Subscription offerings must strictly quote the current approved board price of ₹999 for NovaFit Premium.',
      severity: 'high',
    },
  ];

  for (const g of guidelinesData) {
    const existing = await BrandGuideline.findOne({
      brandId: brand._id,
      title: g.title,
    });
    if (!existing) {
      await BrandGuideline.create({
        ...g,
        brandId: brand._id,
        organizationId: orgId,
        createdBy: userId,
        status: 'active',
        version: 1,
      });
    }
  }

  // 3. Seed Approved Facts
  const factsData = [
    {
      key: 'subscription_price',
      value: '₹999',
      description: 'Approved monthly subscription price for NovaFit Premium membership',
      category: 'pricing',
      sourceReference: 'NovaFit Board of Directors Pricing Memo Q3',
      verificationStatus: 'verified',
    },
    {
      key: 'product_name',
      value: 'NovaFit Premium',
      description: 'Official flagship fitness subscription product title',
      category: 'product',
      sourceReference: 'Brand Style Guide 2026',
      verificationStatus: 'verified',
    },
    {
      key: 'subscription_period',
      value: 'Monthly',
      description: 'Standard billing interval for Premium memberships',
      category: 'pricing',
      sourceReference: 'NovaFit Billing Terms & Conditions',
      verificationStatus: 'verified',
    },
  ];

  for (const f of factsData) {
    const existing = await ApprovedFact.findOne({
      brandId: brand._id,
      key: f.key,
    });
    if (!existing) {
      await ApprovedFact.create({
        ...f,
        brandId: brand._id,
        organizationId: orgId,
        createdBy: userId,
        status: 'active',
        version: 1,
      });
    }
  }

  // 4. Seed Terminology Rules
  const terminologyData = [
    {
      prohibitedTerm: 'users',
      preferredTerm: 'members',
      replacementSuggestion: 'members',
      explanation:
        'Use the approved term when referring to the brand\'s customer community. NovaFit regards customers as active community members, not impersonal users.',
      caseSensitive: false,
    },
  ];

  for (const t of terminologyData) {
    const existing = await TerminologyRule.findOne({
      brandId: brand._id,
      prohibitedTerm: t.prohibitedTerm,
    });
    if (!existing) {
      await TerminologyRule.create({
        ...t,
        brandId: brand._id,
        organizationId: orgId,
        createdBy: userId,
        status: 'active',
      });
    }
  }

  // 5. Seed Visual Asset
  const existingAsset = await BrandVisualAsset.findOne({
    brandId: brand._id,
    name: 'NovaFit Brand Palette & Logo Rules',
  });
  if (!existingAsset) {
    await BrandVisualAsset.create({
      brandId: brand._id,
      organizationId: orgId,
      name: 'NovaFit Brand Palette & Logo Rules',
      assetType: 'color_palette',
      rules: {
        primaryColors: ['#FF4500', '#1E1E1E'],
        prohibitedColors: ['#39FF14'],
      },
      createdBy: userId,
      status: 'active',
    });
  }

  return {
    organizationId: orgId,
    adminUserId: userId,
    brandId: brand._id,
    brandName: brand.name,
  };
};

// Standalone execution support
if (process.argv[1]?.endsWith('seedNovaFit.js')) {
  (async () => {
    try {
      console.log('🌱 Connecting to database for NovaFit seed...');
      const conn = await connectDB();
      if (!conn || mongoose.connection.readyState !== 1) {
        console.error('❌ Cannot run NovaFit seed: Database connection failed. Verify your MONGODB_URI and IP whitelist in MongoDB Atlas.');
        process.exit(1);
      }
      const result = await seedNovaFitData();
      console.log('✅ Successfully seeded fictional NovaFit brand knowledge base:');
      console.log(`   - Brand ID: ${result.brandId}`);
      console.log(`   - Organization ID: ${result.organizationId}`);
      console.log(`   - Admin User ID: ${result.adminUserId}`);
      await closeDB();
      process.exit(0);
    } catch (err) {
      console.error('❌ Error seeding NovaFit demo data:', err);
      process.exit(1);
    }
  })();
}
