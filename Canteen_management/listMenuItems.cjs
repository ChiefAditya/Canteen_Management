const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: String,
  price: Number,
  quantity: Number,
  category: String,
  description: String,
  image: String,
  canteenId: mongoose.Schema.Types.ObjectId,
  isAvailable: Boolean,
}, { timestamps: true });

const MenuItem = mongoose.model('MenuItem', menuItemSchema, 'menuitems');

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/canteen_management';
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  const items = await MenuItem.find();
  items.forEach(item => {
    console.log({ name: item.name, canteenId: item.canteenId, _id: item._id });
  });
  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); }); 