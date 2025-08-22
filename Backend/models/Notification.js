const mongoose = require('mongoose');
const { Schema } = mongoose;

const NotificationSchema = new Schema({
  user:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type:  { type: String, enum: ['REQUEST_RECEIVED','REQUEST_ACCEPTED','REQUEST_REJECTED','NEW_MESSAGE'], required: true },
  title: { type: String, required: true },
  body:  { type: String, default: '' },
  data:  { type: Object, default: {} },
  read:  { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
