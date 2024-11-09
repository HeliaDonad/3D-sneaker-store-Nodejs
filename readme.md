In terminal:
1) $ npx express-generator
2) $ npm i
3) package.json:
    "dev": "node --watch ./bin/www"
4) $ npm run dev
5) $ npm install express mongoose jsonwebtoken bcryptjs jsend
6) $ npm install mongoose
7) $ npm install config
8) $ npm install cors

// voor github doe: git push -u origin master


database
    username: adlin
    password: SedaHelia1478










    router.delete('/orders/:id', auth, adminAuth, async (req, res) => {
  try {
    console.log("Ontvangen ID voor verwijdering:", req.params.id);  // Controleer het ontvangen ID

    // Controleer of de bestelling bestaat
    const order = await Order.findById(req.params.id);
    if (!order) {
      console.log("Bestelling niet gevonden voor ID:", req.params.id);
      return res.status(404).json({ status: 'fail', message: 'Order not found' });
    }

    // Verwijder de bestelling
    await Order.findByIdAndDelete(req.params.id);
    console.log("Bestelling verwijderd:", req.params.id);
    res.status(200).json({ status: 'success', data: null });
  } catch (error) {
    console.error("Fout bij verwijderen:", error.message);
    res.status(500).json({ status: 'error', message: error.message });
  }
});