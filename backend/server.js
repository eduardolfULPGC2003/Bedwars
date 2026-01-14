const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('frontend'));

// Get all users
app.get('/api/users', (req, res) => {
  const users = db.all('SELECT * FROM users');
  res.json(users);
});

// Get all hotels
app.get('/api/hotels', (req, res) => {
  const hotels = db.all('SELECT * FROM hotels');
  res.json(hotels);
});

// Create intention
app.post('/api/intentions', (req, res) => {
  const { user_id, city, check_in, check_out, max_price } = req.body;

  try {
    db.run(
      'INSERT INTO intentions (user_id, city, check_in, check_out, max_price, status) VALUES (?, ?, ?, ?, ?, ?)',
      [user_id, city, check_in, check_out, max_price, 'active']
    );

    const intention = db.get('SELECT * FROM intentions WHERE id = (SELECT MAX(id) FROM intentions)');
    res.json(intention);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get user's intentions
app.get('/api/intentions/user/:userId', (req, res) => {
  const intentions = db.all('SELECT * FROM intentions WHERE user_id = ? ORDER BY id DESC', [req.params.userId]);
  res.json(intentions);
});

// Get intentions by city (for hotels)
app.get('/api/intentions/city/:city', (req, res) => {
  const intentions = db.all('SELECT * FROM intentions WHERE city = ? AND status = ? ORDER BY id DESC', [req.params.city, 'active']);
  res.json(intentions);
});

// Get offers for an intention
app.get('/api/intentions/:intentionId/offers', (req, res) => {
  const offers = db.all(`
    SELECT offers.*, hotels.name as hotel_name
    FROM offers
    JOIN hotels ON offers.hotel_id = hotels.id
    WHERE offers.intention_id = ?
  `, [req.params.intentionId]);
  res.json(offers);
});

// Create offer
app.post('/api/offers', (req, res) => {
  const { intention_id, hotel_id, price, extras } = req.body;

  try {
    // Check if intention is active
    const intention = db.get('SELECT * FROM intentions WHERE id = ?', [intention_id]);
    if (!intention || intention.status !== 'active') {
      return res.status(400).json({ error: 'Intention is not active' });
    }

    // Check if hotel exists and get its details
    const hotel = db.get('SELECT * FROM hotels WHERE id = ?', [hotel_id]);
    if (!hotel) {
      return res.status(400).json({ error: 'Hotel not found' });
    }

    // Check city match
    if (hotel.city !== intention.city) {
      return res.status(400).json({ error: 'Hotel city must match intention city' });
    }

    // Check price constraints
    if (price < hotel.min_price) {
      return res.status(400).json({ error: `Price must be >= hotel minimum price (${hotel.min_price})` });
    }

    if (price > intention.max_price) {
      return res.status(400).json({ error: `Price must be <= intention max price (${intention.max_price})` });
    }

    // Check if hotel already has an offer for this intention
    const existingOffer = db.get('SELECT * FROM offers WHERE intention_id = ? AND hotel_id = ?', [intention_id, hotel_id]);
    if (existingOffer) {
      return res.status(400).json({ error: 'Hotel already has an offer for this intention' });
    }

    db.run(
      'INSERT INTO offers (intention_id, hotel_id, price, extras, updates_count) VALUES (?, ?, ?, ?, ?)',
      [intention_id, hotel_id, price, extras || '', 0]
    );

    const offer = db.get('SELECT * FROM offers WHERE id = (SELECT MAX(id) FROM offers)');
    res.json(offer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update offer
app.put('/api/offers/:offerId', (req, res) => {
  const { price, extras } = req.body;

  try {
    const offer = db.get('SELECT * FROM offers WHERE id = ?', [req.params.offerId]);
    if (!offer) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    // Check update limit
    if (offer.updates_count >= 2) {
      return res.status(400).json({ error: 'Maximum 2 updates allowed' });
    }

    // Check if intention is still active
    const intention = db.get('SELECT * FROM intentions WHERE id = ?', [offer.intention_id]);
    if (!intention || intention.status !== 'active') {
      return res.status(400).json({ error: 'Intention is not active' });
    }

    // Get hotel details for validation
    const hotel = db.get('SELECT * FROM hotels WHERE id = ?', [offer.hotel_id]);

    // Check price constraints
    if (price < hotel.min_price) {
      return res.status(400).json({ error: `Price must be >= hotel minimum price (${hotel.min_price})` });
    }

    if (price > intention.max_price) {
      return res.status(400).json({ error: `Price must be <= intention max price (${intention.max_price})` });
    }

    db.run(
      'UPDATE offers SET price = ?, extras = ?, updates_count = updates_count + 1 WHERE id = ?',
      [price, extras || '', req.params.offerId]
    );

    const updatedOffer = db.get('SELECT * FROM offers WHERE id = ?', [req.params.offerId]);
    res.json(updatedOffer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Close intention (select offer)
app.post('/api/intentions/:intentionId/close', (req, res) => {
  const { offer_id } = req.body;

  try {
    const intention = db.get('SELECT * FROM intentions WHERE id = ?', [req.params.intentionId]);
    if (!intention) {
      return res.status(404).json({ error: 'Intention not found' });
    }

    if (intention.status !== 'active') {
      return res.status(400).json({ error: 'Intention is already closed' });
    }

    // Verify offer belongs to this intention
    const offer = db.get('SELECT * FROM offers WHERE id = ? AND intention_id = ?', [offer_id, req.params.intentionId]);
    if (!offer) {
      return res.status(400).json({ error: 'Offer not found for this intention' });
    }

    db.run('UPDATE intentions SET status = ? WHERE id = ?', ['closed', req.params.intentionId]);

    const updatedIntention = db.get('SELECT * FROM intentions WHERE id = ?', [req.params.intentionId]);
    res.json(updatedIntention);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete/withdraw intention
app.delete('/api/intentions/:intentionId', (req, res) => {
  try {
    const intention = db.get('SELECT * FROM intentions WHERE id = ?', [req.params.intentionId]);
    if (!intention) {
      return res.status(404).json({ error: 'Intention not found' });
    }

    if (intention.status !== 'active') {
      return res.status(400).json({ error: 'Can only withdraw active intentions' });
    }

    // Delete associated offers first
    db.run('DELETE FROM offers WHERE intention_id = ?', [req.params.intentionId]);

    // Delete intention
    db.run('DELETE FROM intentions WHERE id = ?', [req.params.intentionId]);

    res.json({ message: 'Intention withdrawn successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const PORT = 3000;

// Initialize database before starting server
db.initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}).catch(error => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});
