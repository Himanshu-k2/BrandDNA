import { Router } from 'express';
import {
  createBrand,
  getBrands,
  getBrandById,
  updateBrand,
  deleteBrand,
} from '../controllers/brandController.js';
import {
  createGuideline,
  getGuidelinesByBrand,
} from '../controllers/guidelineController.js';
import {
  createFact,
  getFactsByBrand,
} from '../controllers/factController.js';
import {
  createTerminology,
  getTerminologyByBrand,
} from '../controllers/terminologyController.js';
import {
  createVisualAsset,
  getVisualAssetsByBrand,
} from '../controllers/visualAssetController.js';
import { handleUpload } from '../middleware/uploadMiddleware.js';
import {
  getBrandDocuments,
  getBrandDocumentById,
  uploadBrandDocument,
  reviewExtractedItem,
} from '../controllers/guidelineDocumentController.js';

import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { validateBody } from '../middleware/validateMiddleware.js';

import {
  createBrandSchema,
  updateBrandSchema,
  createGuidelineSchema,
  createFactSchema,
  createTerminologySchema,
  createVisualAssetSchema,
} from '../validators/brandValidators.js';

const router = Router();

// ========================
// Brand Workspace CRUD
// ========================
router
  .route('/')
  .post(protect, authorize('admin', 'brand_manager'), validateBody(createBrandSchema), createBrand)
  .get(protect, getBrands);

router
  .route('/:id')
  .get(protect, getBrandById)
  .patch(protect, authorize('admin', 'brand_manager'), validateBody(updateBrandSchema), updateBrand)
  .delete(protect, authorize('admin', 'brand_manager'), deleteBrand);

// ========================
// Nested Sub-resources
// ========================

// Guidelines for brand
router
  .route('/:id/guidelines')
  .post(protect, authorize('admin', 'brand_manager'), validateBody(createGuidelineSchema), createGuideline)
  .get(protect, getGuidelinesByBrand);

// Facts for brand
router
  .route('/:id/facts')
  .post(protect, authorize('admin', 'brand_manager'), validateBody(createFactSchema), createFact)
  .get(protect, getFactsByBrand);

// Terminology rules for brand
router
  .route('/:id/terminology')
  .post(protect, authorize('admin', 'brand_manager'), validateBody(createTerminologySchema), createTerminology)
  .get(protect, getTerminologyByBrand);

// Visual assets for brand
router
  .route('/:id/visual-assets')
  .post(protect, authorize('admin', 'brand_manager'), validateBody(createVisualAssetSchema), createVisualAsset)
  .get(protect, getVisualAssetsByBrand);

// ========================
// Guideline Document Intelligence & Staging
// ========================
router
  .route('/:id/documents')
  .get(protect, getBrandDocuments)
  .post(protect, authorize('admin', 'brand_manager'), handleUpload, uploadBrandDocument);

router
  .route('/:id/documents/:docId')
  .get(protect, getBrandDocumentById);

router
  .route('/:id/documents/:docId/items/:itemId')
  .patch(protect, authorize('admin', 'brand_manager'), reviewExtractedItem);

export default router;
