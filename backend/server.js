const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('frontend'));

/* ===================== USERS ===================== */

app.get('/api/users', async (req, res) => {
  try {
    const users = await db.all('SELECT * FROM users');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ===================== HOTELS ===================== */

app.get('/api/hotels', async (req, res) => {
  try {
    const hotels = await db.all('SELECT * FROM hotels');
    res.json(hotels);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/hotels/:hotelId', async (req, res) => {
  try {
    const hotel = await db.get(
      'SELECT * FROM hotels WHERE id = ?',
      [req.params.hotelId]
    );

    if (!hotel) {
      return res.status(404).json({ error: 'Hotel not found' });
    }

    res.json(hotel);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/* ===================== INTENTIONS ===================== */

app.post('/api/intentions', async (req, res) => {
  const { user_id, city, check_in, check_out, max_price, guests } = req.body;

  try {
    await db.run(
      `INSERT INTO intentions 
       (user_id, city, check_in, check_out, max_price, guests, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user_id, city, check_in, check_out, max_price, guests || 1, 'active']
    );

    const intention = await db.get(
      'SELECT * FROM intentions ORDER BY id DESC LIMIT 1'
    );

    res.json(intention);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/intentions/user/:userId', async (req, res) => {
  try {
    const intentions = await db.all(
      'SELECT * FROM intentions WHERE user_id = ? ORDER BY id DESC',
      [req.params.userId]
    );
    res.json(intentions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/intentions/city/:city', async (req, res) => {
  try {
    const intentions = await db.all(
      'SELECT * FROM intentions WHERE city = ? AND status = ? ORDER BY id DESC',
      [req.params.city, 'active']
    );
    res.json(intentions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/intentions/:intentionId/close', async (req, res) => {
  try {
    const { offer_id } = req.body;

    const intention = await db.get(
      'SELECT * FROM intentions WHERE id = ?',
      [req.params.intentionId]
    );

    if (!intention) {
      return res.status(404).json({ error: 'Intention not found' });
    }

    if (intention.status !== 'active') {
      return res.status(400).json({ error: 'Intention is not active' });
    }

    if (offer_id) {
      const offer = await db.get(
        'SELECT * FROM offers WHERE id = ? AND intention_id = ?',
        [offer_id, req.params.intentionId]
      );

      if (!offer) {
        return res.status(400).json({ error: 'Offer not found for this intention' });
      }

      await db.run(
        'UPDATE intentions SET status = ?, accepted_offer_id = ? WHERE id = ?',
        ['closed', offer_id, req.params.intentionId]
      );
    } else {
      await db.run(
        'UPDATE intentions SET status = ? WHERE id = ?',
        ['closed', req.params.intentionId]
      );
    }

    res.json({ message: 'Intention closed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/intentions/:intentionId', async (req, res) => {
  try {
    const intention = await db.get(
      'SELECT * FROM intentions WHERE id = ?',
      [req.params.intentionId]
    );

    if (!intention) {
      return res.status(404).json({ error: 'Intention not found' });
    }

    await db.run('DELETE FROM offers WHERE intention_id = ?', [req.params.intentionId]);
    await db.run('DELETE FROM intentions WHERE id = ?', [req.params.intentionId]);

    res.json({ message: 'Intention deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ===================== OFFERS ===================== */

app.get('/api/intentions/:intentionId/offers', async (req, res) => {
  try {
    const offers = await db.all(
      `
      SELECT offers.*, hotels.name AS hotel_name
      FROM offers
      JOIN hotels ON offers.hotel_id = hotels.id
      WHERE offers.intention_id = ?
      `,
      [req.params.intentionId]
    );

    res.json(offers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/offers', async (req, res) => {
  const { intention_id, hotel_id, price, extras } = req.body;

  try {
    const intention = await db.get(
      'SELECT * FROM intentions WHERE id = ?',
      [intention_id]
    );

    if (!intention || intention.status !== 'active') {
      return res.status(400).json({ error: 'Intention is not active' });
    }

    const hotel = await db.get(
      'SELECT * FROM hotels WHERE id = ?',
      [hotel_id]
    );

    if (!hotel) {
      return res.status(400).json({ error: 'Hotel not found' });
    }

    if (hotel.city !== intention.city) {
      return res.status(400).json({ error: 'Hotel city must match intention city' });
    }

    if (price < hotel.min_price || price > intention.max_price) {
      return res.status(400).json({ error: 'Price out of allowed range' });
    }

    const existingOffer = await db.get(
      'SELECT * FROM offers WHERE intention_id = ? AND hotel_id = ?',
      [intention_id, hotel_id]
    );

    if (existingOffer) {
      return res.status(400).json({ error: 'Offer already exists' });
    }

    await db.run(
      `INSERT INTO offers 
       (intention_id, hotel_id, price, extras, updates_count)
       VALUES (?, ?, ?, ?, 0)`,
      [intention_id, hotel_id, price, extras || '']
    );

    const offer = await db.get(
      'SELECT * FROM offers ORDER BY id DESC LIMIT 1'
    );

    res.json(offer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/* ===================== SERVER ===================== */

const PORT = process.env.PORT || 3000;

db.initDb()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(error => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });

