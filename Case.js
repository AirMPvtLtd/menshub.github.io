const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  caseType: {
    type: String,
    required: [true, 'Please select case type'],
    enum: ['498A', 'DV', 'Maintenance', 'Custody', 'Extortion', 'Other']
  },
  title: {
    type: String,
    required: [true, 'Please enter case title'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please enter case description']
  },
  policeStation: String,
  location: {
    type: String,
    required: [true, 'Please enter location']
  },
  status: {
    type: String,
    enum: ['Active', 'Closed', 'Won', 'Lost', 'Settled'],
    default: 'Active'
  },
  documents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Case', caseSchema);
