const Case = require('../models/Case');
const Document = require('../models/Document');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const cloudinary = require('cloudinary').v2;

// @desc    Get all cases
// @route   GET /api/cases
// @access  Private
exports.getCases = asyncHandler(async (req, res, next) => {
  // Check if user is admin
  if (req.user.role === 'admin') {
    const cases = await Case.find().populate('user', 'name email');
    return res.status(200).json({
      success: true,
      count: cases.length,
      data: cases
    });
  }

  // Get cases for logged in user
  const cases = await Case.find({ user: req.user.id });

  res.status(200).json({
    success: true,
    count: cases.length,
    data: cases
  });
});

// @desc    Get single case
// @route   GET /api/cases/:id
// @access  Private
exports.getCase = asyncHandler(async (req, res, next) => {
  const caseDoc = await Case.findById(req.params.id).populate('user', 'name email');

  if (!caseDoc) {
    return next(
      new ErrorResponse(`Case not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is case owner or admin
  if (caseDoc.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`User not authorized to access this case`, 401)
    );
  }

  res.status(200).json({
    success: true,
    data: caseDoc
  });
});

// @desc    Create new case
// @route   POST /api/cases
// @access  Private
exports.createCase = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.user = req.user.id;

  const caseDoc = await Case.create(req.body);

  res.status(201).json({
    success: true,
    data: caseDoc
  });
});

// @desc    Update case
// @route   PUT /api/cases/:id
// @access  Private
exports.updateCase = asyncHandler(async (req, res, next) => {
  let caseDoc = await Case.findById(req.params.id);

  if (!caseDoc) {
    return next(
      new ErrorResponse(`Case not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is case owner or admin
  if (caseDoc.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`User not authorized to update this case`, 401)
    );
  }

  caseDoc = await Case.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: caseDoc
  });
});

// @desc    Delete case
// @route   DELETE /api/cases/:id
// @access  Private
exports.deleteCase = asyncHandler(async (req, res, next) => {
  const caseDoc = await Case.findById(req.params.id);

  if (!caseDoc) {
    return next(
      new ErrorResponse(`Case not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is case owner or admin
  if (caseDoc.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`User not authorized to delete this case`, 401)
    );
  }

  await caseDoc.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Upload document for case
// @route   PUT /api/cases/:id/documents
// @access  Private
exports.uploadDocument = asyncHandler(async (req, res, next) => {
  const caseDoc = await Case.findById(req.params.id);

  if (!caseDoc) {
    return next(
      new ErrorResponse(`Case not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is case owner or admin
  if (caseDoc.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`User not authorized to add documents to this case`, 401)
    );
  }

  if (!req.files) {
    return next(new ErrorResponse(`Please upload a file`, 400));
  }

  const file = req.files.file;

  // Check file type
  if (!file.mimetype.startsWith('image') && !file.mimetype.startsWith('application/pdf')) {
    return next(new ErrorResponse(`Please upload an image or PDF file`, 400));
  }

  // Check file size
  if (file.size > process.env.MAX_FILE_UPLOAD) {
    return next(
      new ErrorResponse(
        `Please upload a file less than ${process.env.MAX_FILE_UPLOAD / 1000000}MB`,
        400
      )
    );
  }

  // Upload to cloudinary
  const result = await cloudinary.uploader.upload(file.tempFilePath, {
    folder: 'justicehub',
    resource_type: 'auto'
  });

  // Create document
  const document = await Document.create({
    user: req.user.id,
    case: req.params.id,
    name: file.name,
    url: result.secure_url,
    public_id: result.public_id,
    format: result.format
  });

  // Add document to case
  caseDoc.documents.push(document._id);
  await caseDoc.save();

  res.status(200).json({
    success: true,
    data: document
  });
});
