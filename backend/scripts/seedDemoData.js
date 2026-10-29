import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Brand from '../src/models/Brand.js';
import BrandGuideline from '../src/models/BrandGuideline.js';
import ApprovedFact from '../src/models/ApprovedFact.js';
import TerminologyRule from '../src/models/TerminologyRule.js';
import BrandVisualAsset from '../src/models/BrandVisualAsset.js';
import { connectDB, closeDB } from '../src/config/db.js';

dotenv.config();

/**
 * Demo companies dataset with >= 5 guidelines, >= 5 facts, >= 3 terminology rules each.
 * All data is strictly fictional and explicitly labeled as [Fictional Demo].
 */
export const demoCompanies = [
  // 1. NovaFit
  {
    name: 'NovaFit',
    industry: 'Fitness and wellness',
    description: '[Fictional Demo] Subscription fitness community and wellness app',
    tone: 'Professional and encouraging',
    visualIdentity: {
      primaryColors: ['#FF4500'], // Electric Orange
      secondaryColors: ['#1E1E1E', '#FFFFFF'], // Dark Slate & Crisp White
      prohibitedColors: ['#39FF14'], // Neon Green
      logoRules: {
        minClearSpace: '24px on all sides',
        prohibitedModifications: ['Do not rotate or distort logo', 'Do not alter orange gradient'],
        requiredPlacement: 'Top left or centered header in promotional collateral',
      },
      typography: {
        primaryFont: 'Inter',
        secondaryFont: 'Montserrat',
      },
      visualTone: 'Clean, energetic, premium fitness aesthetic with high contrast',
    },
    visualAssets: [
      {
        name: 'NovaFit Primary Color Palette',
        assetType: 'color_palette',
        details: {
          hexColors: ['#FF4500', '#1E1E1E', '#FFFFFF'],
          colorRole: 'primary',
          prohibitedColors: ['#39FF14'],
          notes: 'Electric Orange (#FF4500) is the signature brand color. Neon green is strictly prohibited.',
        },
      },
      {
        name: 'NovaFit Official Logo Usage Rules',
        assetType: 'logo',
        details: {
          logoRules: 'Maintain 24px clear space. Never rotate, skew, or recolor the flame emblem.',
          notes: 'Standard logo must appear on contrasting dark or white background.',
        },
      },
    ],
    guidelines: [
      {
        title: 'Professional and Encouraging Tone',
        category: 'Tone of voice',
        ruleText: 'All copy must maintain a professional and encouraging tone without condescension, aggressive pressure, or informal slang.',
        severity: 'medium',
      },
      {
        title: 'No Unsupported Market Ranking Claims',
        category: 'Claims and disclaimers',
        ruleText: 'Do not claim "India\'s No. 1 fitness app" or any equivalent superlative ranking unless independently substantiated and cited.',
        severity: 'high',
      },
      {
        title: 'No Guaranteed Physical Transformation Claims',
        category: 'Claims and disclaimers',
        ruleText: 'Never promise guaranteed weight loss, specific calorie reductions, or unrealistic timeframes (e.g., "lose 10kg in 10 days").',
        severity: 'high',
      },
      {
        title: 'Mandatory Medical Consultation Disclaimer',
        category: 'Required phrases',
        ruleText: 'Workout advice and meal suggestions must include the approved disclaimer: "Consult your physician before beginning any exercise routine."',
        severity: 'high',
      },
      {
        title: 'Community Respect and Inclusion',
        category: 'Prohibited content',
        ruleText: 'Never use shaming, body-negative language, or exclusionary fitness stereotypes.',
        severity: 'medium',
      },
    ],
    facts: [
      {
        key: 'subscription_price',
        value: '₹999',
        category: 'pricing',
        description: 'Monthly Premium membership subscription fee',
        sourceReference: '[Fictional Demo] Board Pricing Memo Q3',
      },
      {
        key: 'product_name',
        value: 'NovaFit Premium',
        category: 'product',
        description: 'Primary subscription mobile offering',
        sourceReference: '[Fictional Demo] Product Catalog 2026',
      },
      {
        key: 'subscription_period',
        value: 'Monthly',
        category: 'pricing',
        description: 'Standard billing interval',
        sourceReference: '[Fictional Demo] Billing Terms v2',
      },
      {
        key: 'trial_duration',
        value: '7 Days',
        category: 'product',
        description: 'Standard free trial period for new members',
        sourceReference: '[Fictional Demo] Marketing Playbook',
      },
      {
        key: 'headquarters_location',
        value: 'Bengaluru, India',
        category: 'general',
        description: 'Primary corporate registered office',
        sourceReference: '[Fictional Demo] Corporate Registry 2026',
      },
    ],
    terminology: [
      {
        prohibitedTerm: 'users',
        preferredTerm: 'members',
        replacementSuggestion: 'members',
        explanation: 'NovaFit treats customers as community members, not impersonal users.',
      },
      {
        prohibitedTerm: 'guaranteed results',
        preferredTerm: 'proven milestones',
        replacementSuggestion: 'proven milestones',
        explanation: 'Avoid guaranteeing health outcomes; emphasize milestone tracking.',
      },
      {
        prohibitedTerm: 'cheap membership',
        preferredTerm: 'accessible pricing',
        replacementSuggestion: 'accessible pricing',
        explanation: 'Maintain brand prestige by referring to value and accessibility.',
      },
    ],
  },

  // 2. GreenBasket
  {
    name: 'GreenBasket',
    industry: 'Organic grocery delivery',
    description: '[Fictional Demo] Direct-from-farm certified organic produce and grocery delivery',
    tone: 'Friendly and environmentally conscious',
    guidelines: [
      {
        title: 'Friendly and Eco-Conscious Voice',
        category: 'Tone of voice',
        ruleText: 'Use approachable, warm, and ecologically mindful messaging celebrating sustainable farming.',
        severity: 'medium',
      },
      {
        title: 'Organic Certification Substantiation',
        category: 'Claims and disclaimers',
        ruleText: 'Never claim 100% organic unless all featured items possess verified NPOP certification records.',
        severity: 'high',
      },
      {
        title: 'Zero Waste Delivery Transparency',
        category: 'Messaging',
        ruleText: 'Describe packaging accurately as biodegradable or reusable; do not claim zero-footprint without certification.',
        severity: 'medium',
      },
      {
        title: 'Farmer Partnership Verification',
        category: 'Claims and disclaimers',
        ruleText: 'Fair trade and direct farmer partnership claims must be supported by cooperative audit references.',
        severity: 'medium',
      },
      {
        title: 'Mandatory Storage Instructions',
        category: 'Required phrases',
        ruleText: 'Perishable organic produce items must feature: "Store in a cool dry place or refrigerate immediately upon receipt."',
        severity: 'low',
      },
    ],
    facts: [
      {
        key: 'delivery_fee',
        value: '₹49',
        category: 'pricing',
        description: 'Standard city express delivery charge',
        sourceReference: '[Fictional Demo] Logistics Tariff Sheet 2026',
      },
      {
        key: 'free_delivery_threshold',
        value: '₹499',
        category: 'pricing',
        description: 'Cart value required for free delivery',
        sourceReference: '[Fictional Demo] Promotional Policy v4',
      },
      {
        key: 'delivery_window',
        value: 'Under 90 Minutes',
        category: 'product',
        description: 'Target city delivery timeframe',
        sourceReference: '[Fictional Demo] Operations SLA',
      },
      {
        key: 'partner_farms_count',
        value: '150 Certified Organic Farms',
        category: 'specifications',
        description: 'Current active agricultural suppliers',
        sourceReference: '[Fictional Demo] Farmer Alliance Registry',
      },
      {
        key: 'packaging_type',
        value: '100% Compostable Bagasse',
        category: 'specifications',
        description: 'Approved sustainable container material',
        sourceReference: '[Fictional Demo] Sustainability Audit 2026',
      },
    ],
    terminology: [
      {
        prohibitedTerm: 'buyers',
        preferredTerm: 'shoppers',
        replacementSuggestion: 'shoppers',
        explanation: 'GreenBasket refers to customers warmly as shoppers.',
      },
      {
        prohibitedTerm: 'chemical free',
        preferredTerm: 'certified organic',
        replacementSuggestion: 'certified organic',
        explanation: 'Use certified organic to reflect regulatory compliance instead of vague chemical-free slogans.',
      },
      {
        prohibitedTerm: 'cheap vegetables',
        preferredTerm: 'fresh farm produce',
        replacementSuggestion: 'fresh farm produce',
        explanation: 'Preserve product quality by highlighting freshness rather than cheapness.',
      },
    ],
  },

  // 3. FinWise
  {
    name: 'FinWise',
    industry: 'Personal finance education',
    description: '[Fictional Demo] Financial literacy workshops, interactive budgeting tools, and stock market courses',
    tone: 'Clear and responsible',
    guidelines: [
      {
        title: 'Clear and Responsible Financial Voice',
        category: 'Tone of voice',
        ruleText: 'Communicate with sobriety, clarity, and fiscal responsibility. Never use get-rich-quick hype.',
        severity: 'high',
      },
      {
        title: 'Absolute Ban on Guaranteed Return Claims',
        category: 'Claims and disclaimers',
        ruleText: 'Never promise or imply guaranteed stock market profits, fixed mutual fund returns, or zero-risk wealth creation.',
        severity: 'high',
      },
      {
        title: 'Mandatory SEBI Educational Disclaimer',
        category: 'Required phrases',
        ruleText: 'All investment learning materials must display: "Mutual fund and securities investments are subject to market risks. Read all scheme related documents carefully."',
        severity: 'high',
      },
      {
        title: 'Distinction Between Advice and Education',
        category: 'Writing style',
        ruleText: 'Clearly state that FinWise provides financial education and simulation tools, not licensed advisory tips.',
        severity: 'high',
      },
      {
        title: 'Objective Tax Information',
        category: 'Claims and disclaimers',
        ruleText: 'Tax-saving discussions must clarify that deductions depend on individual circumstances under applicable tax regimes.',
        severity: 'medium',
      },
    ],
    facts: [
      {
        key: 'course_price',
        value: '₹499',
        category: 'pricing',
        description: 'Beginner Financial Freedom masterclass fee',
        sourceReference: '[Fictional Demo] Academy Catalog 2026',
      },
      {
        key: 'curriculum_modules_count',
        value: '12 Interactive Modules',
        category: 'product',
        description: 'Comprehensive syllabus scope',
        sourceReference: '[Fictional Demo] Course Syllabus v3',
      },
      {
        key: 'certificate_accreditation',
        value: 'FinWise Literacy Foundation Certified',
        category: 'specifications',
        description: 'Issued completion credential title',
        sourceReference: '[Fictional Demo] Academic Standards Board',
      },
      {
        key: 'annual_pass_price',
        value: '₹2,499',
        category: 'pricing',
        description: 'All-access annual masterclass membership',
        sourceReference: '[Fictional Demo] Board Pricing Schedule',
      },
      {
        key: 'simulator_tool_name',
        value: 'FinWise Portfolio Sandbox',
        category: 'product',
        description: 'Proprietary mock portfolio simulator application',
        sourceReference: '[Fictional Demo] Tech Registry 2026',
      },
    ],
    terminology: [
      {
        prohibitedTerm: 'guaranteed investors',
        preferredTerm: 'learners',
        replacementSuggestion: 'learners',
        explanation: 'FinWise trains learners; we do not guarantee investments.',
      },
      {
        prohibitedTerm: 'hot stock tips',
        preferredTerm: 'market case studies',
        replacementSuggestion: 'market case studies',
        explanation: 'Position curriculum as objective historical case studies, not speculative tips.',
      },
      {
        prohibitedTerm: 'risk free wealth',
        preferredTerm: 'disciplined wealth creation',
        replacementSuggestion: 'disciplined wealth creation',
        explanation: 'Acknowledge market realities and emphasize disciplined habits.',
      },
    ],
  },

  // 4. TravelNest
  {
    name: 'TravelNest',
    industry: 'Travel and holiday packages',
    description: '[Fictional Demo] Curated experiential domestic and international vacation itineraries',
    tone: 'Welcoming and inspiring',
    guidelines: [
      {
        title: 'Welcoming and Inspiring Tone',
        category: 'Tone of voice',
        ruleText: 'Spark curiosity, cultural appreciation, and wanderlust with warm, evocative, and respectful storytelling.',
        severity: 'low',
      },
      {
        title: 'Explicit Package Inclusions and Exclusions',
        category: 'Claims and disclaimers',
        ruleText: 'Itineraries must unambiguously list inclusions (flights, breakfast) and exclusions (visa fees, personal taxes).',
        severity: 'high',
      },
      {
        title: 'Transparent Seasonal Pricing Clauses',
        category: 'Messaging',
        ruleText: 'Avoid "All-inclusive from ₹X" unless all peak-season hotel and fuel surcharges are itemized.',
        severity: 'medium',
      },
      {
        title: 'Mandatory Visa and Passport Requirement Notice',
        category: 'Required phrases',
        ruleText: 'International package overviews must include: "Passports must have a minimum validity of 6 months from travel date."',
        severity: 'high',
      },
      {
        title: 'Local Cultural Respect and Heritage Preservation',
        category: 'Prohibited content',
        ruleText: 'Never trivialize local indigenous customs or promote ecologically fragile wildlife exploitation.',
        severity: 'medium',
      },
    ],
    facts: [
      {
        key: 'demo_package_price',
        value: '₹12,999',
        category: 'pricing',
        description: 'Goa Coastal Serenity 4D/3N holiday package price per person',
        sourceReference: '[Fictional Demo] Seasonal Tariff Book 2026',
      },
      {
        key: 'hotel_category_standard',
        value: '4-Star Verified Resorts',
        category: 'product',
        description: 'Standard lodging partner benchmark',
        sourceReference: '[Fictional Demo] Hospitality Standards Manual',
      },
      {
        key: 'cancellation_window',
        value: '72 Hours Before Departure',
        category: 'legal',
        description: 'Full refund eligibility cancellation timeline',
        sourceReference: '[Fictional Demo] Booking Terms v5',
      },
      {
        key: 'support_availability',
        value: '24/7 Dedicated Concierge Support',
        category: 'specifications',
        description: 'On-trip traveller assistance availability',
        sourceReference: '[Fictional Demo] Operations Charter',
      },
      {
        key: 'package_name',
        value: 'Goa Coastal Serenity',
        category: 'product',
        description: 'Flagship domestic beach holiday experience',
        sourceReference: '[Fictional Demo] Itinerary Catalog',
      },
    ],
    terminology: [
      {
        prohibitedTerm: 'tourists',
        preferredTerm: 'travellers',
        replacementSuggestion: 'travellers',
        explanation: 'TravelNest inspires mindful travellers rather than mass tourists.',
      },
      {
        prohibitedTerm: 'budget trap',
        preferredTerm: 'handcrafted package',
        replacementSuggestion: 'handcrafted package',
        explanation: 'Emphasize personalized craft and experiential value.',
      },
      {
        prohibitedTerm: 'all hidden costs included',
        preferredTerm: 'transparent breakdown',
        replacementSuggestion: 'transparent breakdown',
        explanation: 'Avoid dubious claims of no hidden costs; provide transparent itemized breakdowns.',
      },
    ],
  },

  // 5. PureGlow
  {
    name: 'PureGlow',
    industry: 'Skincare and beauty',
    description: '[Fictional Demo] Dermatologically tested botanical skincare formulations and serums',
    tone: 'Calm and informative',
    guidelines: [
      {
        title: 'Calm and Informative Demeanour',
        category: 'Tone of voice',
        ruleText: 'Communicate with scientific transparency, soothing reassurance, and educational authority.',
        severity: 'medium',
      },
      {
        title: 'Ban on Medical Cure Assertions',
        category: 'Claims and disclaimers',
        ruleText: 'Cosmetic products must never claim to cure, prevent, or treat chronic skin diseases such as eczema, psoriasis, or cystic acne.',
        severity: 'high',
      },
      {
        title: 'Dermatological Test Substantiation',
        category: 'Claims and disclaimers',
        ruleText: 'Claims of "hypoallergenic" or "dermatologist tested" require reference to certified laboratory safety dossiers.',
        severity: 'high',
      },
      {
        title: 'Cruelty-Free and PETA Alignment',
        category: 'Messaging',
        ruleText: 'All product copy must reflect our PETA-certified cruelty-free manufacturing principles.',
        severity: 'medium',
      },
      {
        title: 'Mandatory Patch Test Warning',
        category: 'Required phrases',
        ruleText: 'Product application instructions must state: "Perform a patch test 24 hours prior to regular application."',
        severity: 'medium',
      },
    ],
    facts: [
      {
        key: 'serum_price',
        value: '₹699',
        category: 'pricing',
        description: 'PureGlow Radiant Niacinamide 10% 30ml serum price',
        sourceReference: '[Fictional Demo] Retail Price Sheet 2026',
      },
      {
        key: 'product_name',
        value: 'Radiant Niacinamide Serum',
        category: 'product',
        description: 'Flagship facial brightening formulation',
        sourceReference: '[Fictional Demo] Formulation Catalog',
      },
      {
        key: 'active_ingredient_percentage',
        value: '10% Pure Niacinamide + 1% Zinc PCA',
        category: 'specifications',
        description: 'Lab verified active ingredient concentration',
        sourceReference: '[Fictional Demo] Lab Assay Certificate',
      },
      {
        key: 'clinical_study_timeline',
        value: '4 Weeks Clinical Trial',
        category: 'specifications',
        description: 'Efficacy assessment observation period',
        sourceReference: '[Fictional Demo] Dermatological Trial Dossier',
      },
      {
        key: 'ph_level',
        value: 'pH 5.5 Skin Balanced',
        category: 'specifications',
        description: 'Balanced dermal acidity rating',
        sourceReference: '[Fictional Demo] QA Testing Sheet',
      },
    ],
    terminology: [
      {
        prohibitedTerm: 'guaranteed cure',
        preferredTerm: 'skincare routine',
        replacementSuggestion: 'skincare routine',
        explanation: 'Cosmetics support ongoing healthy skincare routines; they are not guaranteed medical cures.',
      },
      {
        prohibitedTerm: 'overnight miracle',
        preferredTerm: 'consistent results',
        replacementSuggestion: 'consistent results',
        explanation: 'Dermatological health requires consistent habit rather than miraculous overnight claims.',
      },
      {
        prohibitedTerm: 'pore eraser',
        preferredTerm: 'pore refining',
        replacementSuggestion: 'pore refining',
        explanation: 'Pores cannot be erased biologically; use pore refining instead.',
      },
    ],
  },

  // 6. ByteForge
  {
    name: 'ByteForge',
    industry: 'Software and cloud services',
    description: '[Fictional Demo] Developer-first cloud infrastructure, container hosting, and edge computing',
    tone: 'Technical and direct',
    guidelines: [
      {
        title: 'Technical and Direct Clarity',
        category: 'Tone of voice',
        ruleText: 'Write concisely, technically, and without marketing fluff. Respect developer intelligence.',
        severity: 'medium',
      },
      {
        title: 'Precise Uptime SLA Disclosures',
        category: 'Claims and disclaimers',
        ruleText: 'State SLA availability as exactly 99.95%; never claim 100% unbreakable uptime.',
        severity: 'high',
      },
      {
        title: 'Security and Encryption Transparency',
        category: 'Claims and disclaimers',
        ruleText: 'Specify exact cipher suites (e.g., AES-256 at rest, TLS 1.3 in transit) rather than claiming military grade security.',
        severity: 'high',
      },
      {
        title: 'Open Source Attribution',
        category: 'Messaging',
        ruleText: 'Acknowledge community open-source dependencies under Apache 2.0 or MIT license terms.',
        severity: 'medium',
      },
      {
        title: 'Mandatory Rate Limiting Policy Notice',
        category: 'Required phrases',
        ruleText: 'Developer API docs must cite: "Standard tier API requests are throttled at 1,000 requests per minute."',
        severity: 'medium',
      },
    ],
    facts: [
      {
        key: 'starter_plan_price',
        value: '₹1,499/month',
        category: 'pricing',
        description: 'Starter Cloud Node tier monthly subscription',
        sourceReference: '[Fictional Demo] Infrastructure Pricing v2',
      },
      {
        key: 'uptime_sla_percentage',
        value: '99.95% Availability SLA',
        category: 'specifications',
        description: 'Contractually backed system availability benchmark',
        sourceReference: '[Fictional Demo] Service Level Agreement 2026',
      },
      {
        key: 'encryption_standard',
        value: 'AES-256 and TLS 1.3',
        category: 'specifications',
        description: 'Storage and in-transit data protection ciphers',
        sourceReference: '[Fictional Demo] SOC2 Compliance Report',
      },
      {
        key: 'edge_regions_count',
        value: '24 Global Edge Zones',
        category: 'product',
        description: 'Active worldwide server deployment points',
        sourceReference: '[Fictional Demo] Network Topology Sheet',
      },
      {
        key: 'backup_frequency',
        value: 'Hourly Automated Snapshots',
        category: 'specifications',
        description: 'Automated disaster recovery backup interval',
        sourceReference: '[Fictional Demo] Backup Operations Policy',
      },
    ],
    terminology: [
      {
        prohibitedTerm: 'end users',
        preferredTerm: 'customers',
        replacementSuggestion: 'customers',
        explanation: 'ByteForge views client developers and organizations as valued customers.',
      },
      {
        prohibitedTerm: 'unhackable cloud',
        preferredTerm: 'hardened zero-trust architecture',
        replacementSuggestion: 'hardened zero-trust architecture',
        explanation: 'Security is an active posture; never make foolish unhackable claims.',
      },
      {
        prohibitedTerm: 'infinitely scalable',
        preferredTerm: 'elastic auto-scaling',
        replacementSuggestion: 'elastic auto-scaling',
        explanation: 'Use engineering precision: elastic auto-scaling within quota bounds.',
      },
    ],
  },

  // 7. EduSpark
  {
    name: 'EduSpark',
    industry: 'Online education',
    description: '[Fictional Demo] Full-stack engineering and data analytics career accelerator programs',
    tone: 'Encouraging and accessible',
    guidelines: [
      {
        title: 'Encouraging and Accessible Demeanour',
        category: 'Tone of voice',
        ruleText: 'Inspire students of all technical backgrounds with patient, empowering, and accessible guidance.',
        severity: 'low',
      },
      {
        title: 'Strict Prohibition on Placement Guarantees',
        category: 'Claims and disclaimers',
        ruleText: 'Never promise 100% job placement, guaranteed corporate hiring, or specific salary CTC figures.',
        severity: 'high',
      },
      {
        title: 'Verified Hiring Partner Transparency',
        category: 'Messaging',
        ruleText: 'Company logos displayed as hiring partners must have active recruiter agreements signed within the last 12 months.',
        severity: 'high',
      },
      {
        title: 'Student Project Ownership Guarantee',
        category: 'Claims and disclaimers',
        ruleText: 'Affirm that all capstone repositories created during bootcamps remain the sole intellectual property of the student.',
        severity: 'medium',
      },
      {
        title: 'Mandatory Refund Window Disclaimer',
        category: 'Required phrases',
        ruleText: 'Course enrollment pages must cite: "Tuition refunds are available within the first 14 days of cohort commencement."',
        severity: 'high',
      },
    ],
    facts: [
      {
        key: 'course_price',
        value: '₹799',
        category: 'pricing',
        description: 'Full Stack Web Fundamentals self-paced foundation course',
        sourceReference: '[Fictional Demo] Course Catalog Q2 2026',
      },
      {
        key: 'bootcamp_pro_price',
        value: '₹24,999',
        category: 'pricing',
        description: 'Intensive 16-week Career Accelerator Bootcamp',
        sourceReference: '[Fictional Demo] Bootcamp Enrollment Board',
      },
      {
        key: 'average_placement_timeline',
        value: '4 Months Post-Graduation',
        category: 'specifications',
        description: 'Historical median student career transition window',
        sourceReference: '[Fictional Demo] Annual Outcomes Report 2025',
      },
      {
        key: 'live_mentorship_hours',
        value: '40 Hours of 1-on-1 Code Reviews',
        category: 'product',
        description: 'Mentor coaching commitment per learner',
        sourceReference: '[Fictional Demo] Mentor Handbook',
      },
      {
        key: 'curriculum_projects_count',
        value: '8 Production Grade Capstones',
        category: 'specifications',
        description: 'Hands-on portfolio assignments included',
        sourceReference: '[Fictional Demo] Syllabus Framework v4',
      },
    ],
    terminology: [
      {
        prohibitedTerm: 'placement-guaranteed candidates',
        preferredTerm: 'students',
        replacementSuggestion: 'students',
        explanation: 'We foster skilled students; we do not sell placement guarantees.',
      },
      {
        prohibitedTerm: 'instant high salary',
        preferredTerm: 'competitive career skills',
        replacementSuggestion: 'competitive career skills',
        explanation: 'Focus on mastering competitive tech skills rather than sensationalized salary claims.',
      },
      {
        prohibitedTerm: 'no effort required',
        preferredTerm: 'guided hands-on practice',
        replacementSuggestion: 'guided hands-on practice',
        explanation: 'Honesty regarding student dedication and rigorous hands-on practice.',
      },
    ],
  },

  // 8. FreshBite
  {
    name: 'FreshBite',
    industry: 'Healthy food delivery',
    description: '[Fictional Demo] Calorie-counted chef-prepared macro-balanced meal subscription boxes',
    tone: 'Fresh and friendly',
    guidelines: [
      {
        title: 'Fresh and Friendly Culinary Tone',
        category: 'Tone of voice',
        ruleText: 'Evoke vibrant flavors, farm ingredients, and positive nutritional habits in a friendly, cheerful voice.',
        severity: 'low',
      },
      {
        title: 'Macro and Calorie Precision',
        category: 'Claims and disclaimers',
        ruleText: 'All nutritional labels and calorie counts must stay within +/- 5% of certified laboratory food assays.',
        severity: 'high',
      },
      {
        title: 'No Guilt-Driven Dietary Messaging',
        category: 'Prohibited content',
        ruleText: 'Never refer to healthy food as punishment or regular meals as "bad" or "dirty". Reject toxic diet culture.',
        severity: 'medium',
      },
      {
        title: 'Preservative and Additive Clarity',
        category: 'Messaging',
        ruleText: 'Accurately specify "zero artificial preservatives added"; do not make unsupported claims of eternal freshness.',
        severity: 'medium',
      },
      {
        title: 'Mandatory Allergen Warning',
        category: 'Required phrases',
        ruleText: 'All meal box menus must feature: "Prepared in a facility that also handles nuts, dairy, soy, and gluten."',
        severity: 'high',
      },
    ],
    facts: [
      {
        key: 'meal_price',
        value: '₹199',
        category: 'pricing',
        description: 'High-Protein Mediterranean Bowl single order price',
        sourceReference: '[Fictional Demo] Daily Menu Tariff 2026',
      },
      {
        key: 'weekly_subscription_price',
        value: '₹1,199',
        category: 'pricing',
        description: '6-Day Lunch Box healthy office subscription',
        sourceReference: '[Fictional Demo] Subscription Board Pricing',
      },
      {
        key: 'calorie_range_standard',
        value: '450 to 550 kCal',
        category: 'specifications',
        description: 'Verified caloric bracket for Standard Fitness bowls',
        sourceReference: '[Fictional Demo] Nutritionist Assay 2026',
      },
      {
        key: 'delivery_temperature',
        value: 'Chilled at 4 Degrees Celsius',
        category: 'specifications',
        description: 'Cold-chain dispatch food safety standard',
        sourceReference: '[Fictional Demo] FSSAI Compliance Protocol',
      },
      {
        key: 'protein_content_standard',
        value: '35g Clean Protein',
        category: 'specifications',
        description: 'Guaranteed minimum protein per Fitness Bowl',
        sourceReference: '[Fictional Demo] Lab Test Certificate',
      },
    ],
    terminology: [
      {
        prohibitedTerm: 'cheat meals',
        preferredTerm: 'meals',
        replacementSuggestion: 'meals',
        explanation: 'FreshBite avoids shame-based diet terminology like cheat meals.',
      },
      {
        prohibitedTerm: 'guilt free binge',
        preferredTerm: 'nourishing portion',
        replacementSuggestion: 'nourishing portion',
        explanation: 'Promote healthy portion balance rather than binge psychology.',
      },
      {
        prohibitedTerm: 'fat melting ingredients',
        preferredTerm: 'metabolism supporting nutrients',
        replacementSuggestion: 'metabolism supporting nutrients',
        explanation: 'Use scientifically grounded language regarding metabolism support.',
      },
    ],
  },

  // 9. HomeEase
  {
    name: 'HomeEase',
    industry: 'Home cleaning and maintenance',
    description: '[Fictional Demo] On-demand certified deep cleaning, electrical repairs, and home disinfection',
    tone: 'Reassuring and practical',
    guidelines: [
      {
        title: 'Reassuring and Practical Voice',
        category: 'Tone of voice',
        ruleText: 'Provide dependable, calm, and trustworthy communications addressing homeowner concerns directly.',
        severity: 'low',
      },
      {
        title: 'Honest Verification and Police Check Disclosures',
        category: 'Claims and disclaimers',
        ruleText: 'Do not claim 100% crime-free guarantees; state that background checks and Aadhaar/police verifications are performed.',
        severity: 'high',
      },
      {
        title: 'Accidental Damage Insurance Protection',
        category: 'Claims and disclaimers',
        ruleText: 'Highlight our up to ₹10,000 property damage coverage with policy claim terms explicitly linked.',
        severity: 'medium',
      },
      {
        title: 'Worker Dignity and Fair Wage Standard',
        category: 'Writing style',
        ruleText: 'Portray our service staff with professional pride, fair hourly compensation, and health coverage.',
        severity: 'high',
      },
      {
        title: 'Mandatory Service Guarantee Disclaimer',
        category: 'Required phrases',
        ruleText: 'Booking invoices must state: "Free rework guaranteed within 48 hours if dissatisfied with cleaning quality."',
        severity: 'medium',
      },
    ],
    facts: [
      {
        key: 'cleaning_service_price',
        value: '₹599',
        category: 'pricing',
        description: 'Standard 2BHK deep bathroom and kitchen disinfection service',
        sourceReference: '[Fictional Demo] Service Rate Card 2026',
      },
      {
        key: 'rework_guarantee_window',
        value: '48 Hours Post-Service',
        category: 'legal',
        description: 'Complimentary service inspection and rework guarantee',
        sourceReference: '[Fictional Demo] Customer Satisfaction Guarantee',
      },
      {
        key: 'damage_protection_cover',
        value: 'Up to ₹10,000 Insurance Cover',
        category: 'legal',
        description: 'Third-party insured property protection limit',
        sourceReference: '[Fictional Demo] Insurance Policy Underwriting',
      },
      {
        key: 'technician_rating_benchmark',
        value: '4.8 Stars Average Professional Rating',
        category: 'specifications',
        description: 'Minimum operational benchmark across 50,000 jobs',
        sourceReference: '[Fictional Demo] Quality Operations Audit',
      },
      {
        key: 'chemical_safety_standard',
        value: 'Govt Approved Hospital Grade Disinfectants',
        category: 'specifications',
        description: 'Eco-certified child-safe sanitation products',
        sourceReference: '[Fictional Demo] Material Safety Data Sheets',
      },
    ],
    terminology: [
      {
        prohibitedTerm: 'cheap labour',
        preferredTerm: 'service professionals',
        replacementSuggestion: 'service professionals',
        explanation: 'HomeEase honors worker dignity by employing trained service professionals.',
      },
      {
        prohibitedTerm: 'maids',
        preferredTerm: 'cleaning partners',
        replacementSuggestion: 'cleaning partners',
        explanation: 'Use professional terms like cleaning partners or technicians.',
      },
      {
        prohibitedTerm: 'unbreakable security',
        preferredTerm: 'verified background checks',
        replacementSuggestion: 'verified background checks',
        explanation: 'Avoid exaggerated security absolutes; cite real background verification steps.',
      },
    ],
  },

  // 10. EcoDrive
  {
    name: 'EcoDrive',
    industry: 'Electric vehicles and charging',
    description: '[Fictional Demo] Ultra-fast public EV charging network and smart charging station fleet management',
    tone: 'Innovative and factual',
    guidelines: [
      {
        title: 'Innovative and Factual Tone',
        category: 'Tone of voice',
        ruleText: 'Champion sustainable mobility through rigorous engineering data, forward-thinking optimism, and precision.',
        severity: 'medium',
      },
      {
        title: 'Charging Speed and Vehicle Range Substantiation',
        category: 'Claims and disclaimers',
        ruleText: 'Charging times (e.g. 10% to 80% in 18 minutes) must specify vehicle battery architecture compatibility (e.g., 800V DC).',
        severity: 'high',
      },
      {
        title: 'True Green Grid Power Sourcing',
        category: 'Claims and disclaimers',
        ruleText: 'Claims of 100% solar-powered charging must match stations with verified Open Access green energy wheeling certificates.',
        severity: 'high',
      },
      {
        title: 'Battery Longevity and Thermal Management',
        category: 'Messaging',
        ruleText: 'Explain how liquid-cooled CCS2 charging cables protect battery lifespan without marketing hyperbole.',
        severity: 'medium',
      },
      {
        title: 'Mandatory EV Charging Safety Instructions',
        category: 'Required phrases',
        ruleText: 'Station terminals must feature: "Ensure vehicle parking brake is engaged prior to connector insertion."',
        severity: 'high',
      },
    ],
    facts: [
      {
        key: 'charging_price',
        value: '₹15/kWh',
        category: 'pricing',
        description: 'Standard Fast DC off-peak electricity dispensing tariff',
        sourceReference: '[Fictional Demo] Central Electricity Regulatory Filing',
      },
      {
        key: 'ultra_fast_charger_capacity',
        value: '180 kW Dual Gun DC Fast Charger',
        category: 'specifications',
        description: 'Maximum dispensing output capacity per charging bay',
        sourceReference: '[Fictional Demo] Hardware Specifications Sheet',
      },
      {
        key: 'charging_speed_benchmark',
        value: '10% to 80% in 22 Minutes',
        category: 'specifications',
        description: 'Tested charging curve on 400V 60kWh battery packs',
        sourceReference: '[Fictional Demo] Fleet Test Report 2026',
      },
      {
        key: 'network_uptime_rate',
        value: '99.2% Station Reliability',
        category: 'specifications',
        description: 'Audited charger connector operational availability',
        sourceReference: '[Fictional Demo] Operations Uptime Audit',
      },
      {
        key: 'charging_stations_count',
        value: '500 Fast Charging Hubs',
        category: 'product',
        description: 'National highway corridor network reach',
        sourceReference: '[Fictional Demo] Network Deployment Map',
      },
    ],
    terminology: [
      {
        prohibitedTerm: 'gas car users',
        preferredTerm: 'drivers',
        replacementSuggestion: 'drivers',
        explanation: 'EcoDrive welcomes all motorists transitioning to electric as drivers.',
      },
      {
        prohibitedTerm: 'dirty petrol engines',
        preferredTerm: 'internal combustion vehicles',
        replacementSuggestion: 'internal combustion vehicles',
        explanation: 'Avoid hostile derogatory slogans; use technical terminology.',
      },
      {
        prohibitedTerm: 'instant zero second charging',
        preferredTerm: 'ultra-fast DC charging',
        replacementSuggestion: 'ultra-fast DC charging',
        explanation: 'Be technologically honest about charging speeds.',
      },
    ],
  },
];

/**
 * Idempotently seeds all 10 fictional demo brands, guidelines, facts, and terminology rules.
 * Automatically aligns with any existing user workspaces in the database so that both
 * registered user accounts and pre-configured Postman demo accounts share access.
 *
 * @param {mongoose.Types.ObjectId} [targetOrgId] - Optional specific organization ID
 * @param {mongoose.Types.ObjectId} [adminUserId] - Optional admin user ID
 */
export const seedAllDemoData = async (targetOrgId, adminUserId) => {
  console.log('🌱 Starting idempotent seed for 10 Fictional Demo Companies...');

  // 1. Identify existing primary admin user or any existing user
  const existingAdmin = (await User.findOne({ role: 'admin' })) || (await User.findOne());

  // Determine primary organization ID
  let primaryOrgId =
    targetOrgId ||
    (existingAdmin ? existingAdmin.organizationId : new mongoose.Types.ObjectId());

  // 2. Ensure demo admin user exists in the primary organization
  let adminUser = adminUserId ? await User.findById(adminUserId) : null;
  let demoAdmin = await User.findOne({ email: 'admin@demobrands.test' });

  if (!demoAdmin) {
    demoAdmin = new User({
      name: 'BrandDNA Demo Administrator (Fictional Demo)',
      email: 'admin@demobrands.test',
      passwordHash: 'DemoPasswordSecure2026!',
      role: 'admin',
      organizationId: primaryOrgId,
    });
    await demoAdmin.save();
    console.log(`👤 Created Demo Admin User: ${demoAdmin.email}`);
  } else if (demoAdmin.organizationId.toString() !== primaryOrgId.toString() && !targetOrgId) {
    demoAdmin.organizationId = primaryOrgId;
    await demoAdmin.save();
    console.log(`👤 Aligned Demo Admin User to primary organization: ${primaryOrgId}`);
  }

  if (!adminUser) {
    adminUser = existingAdmin || demoAdmin;
  }

  // 3. Ensure demo reviewer and creator exist in the primary organization
  let reviewerUser = await User.findOne({ email: 'reviewer@demobrands.test' });
  if (!reviewerUser) {
    reviewerUser = new User({
      name: 'BrandDNA Demo Reviewer (Fictional Demo)',
      email: 'reviewer@demobrands.test',
      passwordHash: 'DemoPasswordSecure2026!',
      role: 'reviewer',
      organizationId: primaryOrgId,
    });
    await reviewerUser.save();
    console.log(`👤 Created Demo Reviewer: ${reviewerUser.email}`);
  } else if (reviewerUser.organizationId.toString() !== primaryOrgId.toString() && !targetOrgId) {
    reviewerUser.organizationId = primaryOrgId;
    await reviewerUser.save();
  }

  let creatorUser = await User.findOne({ email: 'creator@demobrands.test' });
  if (!creatorUser) {
    creatorUser = new User({
      name: 'BrandDNA Demo Creator (Fictional Demo)',
      email: 'creator@demobrands.test',
      passwordHash: 'DemoPasswordSecure2026!',
      role: 'creator',
      organizationId: primaryOrgId,
    });
    await creatorUser.save();
    console.log(`👤 Created Demo Creator: ${creatorUser.email}`);
  } else if (creatorUser.organizationId.toString() !== primaryOrgId.toString() && !targetOrgId) {
    creatorUser.organizationId = primaryOrgId;
    await creatorUser.save();
  }

  // 4. Collect all organizations to seed:
  // If targetOrgId was explicitly provided, seed only that.
  // Otherwise, seed every distinct active organization in the database so no user is left with empty brands.
  let orgsToSeed = [];
  if (targetOrgId) {
    orgsToSeed = [targetOrgId];
  } else {
    const distinctOrgs = await User.distinct('organizationId');
    orgsToSeed = distinctOrgs.length > 0 ? distinctOrgs : [primaryOrgId];
  }

  let totalBrandsCreated = 0;
  let totalGuidelinesCreated = 0;
  let totalFactsCreated = 0;
  let totalTerminologyCreated = 0;
  const brandSummary = [];

  for (const orgId of orgsToSeed) {
    const orgUser =
      (await User.findOne({ organizationId: orgId, role: 'admin' })) ||
      (await User.findOne({ organizationId: orgId })) ||
      adminUser;

    for (const company of demoCompanies) {
      // Upsert Brand
      let brand = await Brand.findOne({ organizationId: orgId, name: company.name });
      if (!brand) {
        brand = new Brand({
          name: company.name,
          description: company.description,
          tone: company.tone,
          organizationId: orgId,
          createdBy: orgUser._id,
          status: 'active',
        });
        await brand.save();
        totalBrandsCreated++;
      } else {
        brand.description = company.description;
        brand.tone = company.tone;
        brand.status = 'active';
      }

      if (company.visualIdentity) {
        brand.visualIdentity = company.visualIdentity;
      }
      await brand.save();

      // Upsert Visual Assets (if defined)
      if (company.visualAssets) {
        for (const v of company.visualAssets) {
          const existing = await BrandVisualAsset.findOne({
            brandId: brand._id,
            name: v.name,
          });
          if (!existing) {
            await BrandVisualAsset.create({
              brandId: brand._id,
              organizationId: orgId,
              name: v.name,
              assetType: v.assetType,
              details: v.details || {},
              status: 'active',
              createdBy: orgUser._id,
            });
          }
        }
      }

      // Upsert Guidelines (>= 5 per brand)
      for (const g of company.guidelines) {
        const existing = await BrandGuideline.findOne({
          brandId: brand._id,
          title: g.title,
        });
        if (!existing) {
          await BrandGuideline.create({
            brandId: brand._id,
            organizationId: orgId,
            title: g.title,
            category: g.category,
            ruleText: g.ruleText,
            severity: g.severity,
            version: 1,
            createdBy: orgUser._id,
            status: 'active',
          });
          totalGuidelinesCreated++;
        } else {
          existing.ruleText = g.ruleText;
          existing.category = g.category;
          existing.severity = g.severity;
          existing.status = 'active';
          await existing.save();
        }
      }

      // Upsert Approved Facts (>= 5 per brand)
      for (const f of company.facts) {
        const existing = await ApprovedFact.findOne({
          brandId: brand._id,
          key: f.key,
        });
        if (!existing) {
          await ApprovedFact.create({
            brandId: brand._id,
            organizationId: orgId,
            key: f.key,
            value: f.value,
            category: f.category,
            description: f.description,
            sourceReference: f.sourceReference,
            verificationStatus: 'verified',
            version: 1,
            createdBy: orgUser._id,
            status: 'active',
          });
          totalFactsCreated++;
        } else {
          existing.value = f.value;
          existing.category = f.category;
          existing.description = f.description;
          existing.sourceReference = f.sourceReference;
          existing.verificationStatus = 'verified';
          existing.status = 'active';
          await existing.save();
        }
      }

      // Upsert Terminology Rules (>= 3 per brand)
      for (const t of company.terminology) {
        const existing = await TerminologyRule.findOne({
          brandId: brand._id,
          prohibitedTerm: t.prohibitedTerm,
        });
        if (!existing) {
          await TerminologyRule.create({
            brandId: brand._id,
            organizationId: orgId,
            prohibitedTerm: t.prohibitedTerm,
            preferredTerm: t.preferredTerm,
            replacementSuggestion: t.replacementSuggestion,
            explanation: t.explanation,
            caseSensitive: false,
            createdBy: orgUser._id,
            status: 'active',
          });
          totalTerminologyCreated++;
        } else {
          existing.preferredTerm = t.preferredTerm;
          existing.replacementSuggestion = t.replacementSuggestion;
          existing.explanation = t.explanation;
          existing.status = 'active';
          await existing.save();
        }
      }

      if (orgId.toString() === primaryOrgId.toString()) {
        brandSummary.push({
          name: brand.name,
          brandId: brand._id.toString(),
          industry: company.industry,
          tone: company.tone,
        });
      }
    }
  }

  return {
    organizationId: primaryOrgId.toString(),
    organizationsSeeded: orgsToSeed.length,
    brandsCount: brandSummary.length,
    newBrandsAdded: totalBrandsCreated,
    newGuidelinesAdded: totalGuidelinesCreated,
    newFactsAdded: totalFactsCreated,
    newTerminologyAdded: totalTerminologyCreated,
    brands: brandSummary,
  };
};

// Standalone execution handler
if (process.argv[1]?.endsWith('seedDemoData.js')) {
  (async () => {
    try {
      console.log('🔌 Connecting to MongoDB...');
      const conn = await connectDB();
      if (!conn || mongoose.connection.readyState !== 1) {
        console.error('❌ Cannot run demo seed: Database connection failed. Verify your MONGODB_URI and IP whitelist in MongoDB Atlas.');
        process.exit(1);
      }
      const summary = await seedAllDemoData();
      console.log('\n======================================================');
      console.log('✅ DEMO SEED COMPLETED SUCCESSFULLY');
      console.log('======================================================');
      console.log(`Total Brands Active:        ${summary.brandsCount}`);
      console.log(`New Brands Created:         ${summary.newBrandsAdded}`);
      console.log(`New Guidelines Created:     ${summary.newGuidelinesAdded}`);
      console.log(`New Facts Created:          ${summary.newFactsAdded}`);
      console.log(`New Terminology Rules:      ${summary.newTerminologyAdded}`);
      console.log('------------------------------------------------------');
      console.log('Demo Brands Summary:');
      summary.brands.forEach((b, idx) => {
        console.log(` ${idx + 1}. ${b.name.padEnd(14)} [ID: ${b.brandId}] (${b.industry})`);
      });
      console.log('======================================================\n');
      await closeDB();
      process.exit(0);
    } catch (err) {
      console.error('❌ Error executing demo seed:', err.message);
      process.exit(1);
    }
  })();
}
