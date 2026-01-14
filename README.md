<<<<<<< HEAD
# Bedwars
=======
# Hotel Marketplace MVP

A minimal reverse hotel marketplace where users create travel intentions and hotels make competing offers.

## Features

### User Mode
- Create travel intentions with city, dates, and max price
- View all offers from hotels
- Select and accept an offer (closes the intention)

### Hotel Mode
- View active intentions in hotel's city
- Create one offer per intention
- Update offers up to 2 times
- Pricing constraints enforced (above min price, below max price)

## Tech Stack

- Backend: Node.js + Express
- Database: SQLite with better-sqlite3
- Frontend: HTML + Vanilla JavaScript
- No authentication (simple role switching)

## Installation

1. Install dependencies:
```bash
npm install
```

## Running the Application

1. Start the server:
```bash
npm start
```

2. Open your browser and navigate to:
```
http://localhost:3000
```

3. The database will be created automatically on first run with seed data.

## Seed Data

The application comes with pre-populated data:

**Users:**
- John Doe
- Jane Smith

**Hotels:**
- Grand Hotel (Paris, min price: $100)
- Luxury Inn (Paris, min price: $150)
- Budget Stay (London, min price: $80)
- City Center Hotel (London, min price: $120)

## Usage

### Creating an Intention (User Mode)

1. Select "User Mode" from the home page
2. Choose a user from the dropdown
3. Fill in the form:
   - City (e.g., Paris)
   - Check-in date
   - Check-out date
   - Maximum price you're willing to pay
4. Click "Create Intention"
5. Your intention will appear below with any offers hotels make

### Making an Offer (Hotel Mode)

1. Select "Hotel Mode" from the home page
2. Choose a hotel from the dropdown
3. View active intentions in your city
4. Click "Make Offer" on an intention
5. Enter price (must be >= hotel's min price and <= intention's max price)
6. Optionally add extras (e.g., "Free breakfast")
7. Submit the offer

### Updating an Offer (Hotel Mode)

- Each hotel can update their offer up to 2 times
- Click "Update Offer" on an existing offer
- Change the price and/or extras
- Submit the update

### Accepting an Offer (User Mode)

1. In User Mode, view your intentions
2. Click "Select This Offer" on your preferred offer
3. Confirm the selection
4. The intention will be marked as "closed"
5. No more offers can be made on closed intentions

## Business Rules

- Hotels can only see intentions in their city
- Hotels can only make one offer per intention
- Offer price must be >= hotel's minimum price
- Offer price must be <= intention's maximum price
- Hotels can update offers max 2 times
- Closed intentions cannot receive new offers
- City matching is case-sensitive

## API Endpoints

### Users & Hotels
- `GET /api/users` - Get all users
- `GET /api/hotels` - Get all hotels

### Intentions
- `POST /api/intentions` - Create intention
- `GET /api/intentions/user/:userId` - Get user's intentions
- `GET /api/intentions/city/:city` - Get intentions by city
- `POST /api/intentions/:intentionId/close` - Close intention

### Offers
- `GET /api/intentions/:intentionId/offers` - Get offers for intention
- `POST /api/offers` - Create offer
- `PUT /api/offers/:offerId` - Update offer

## Project Structure

```
MVP/
├── backend/
│   ├── server.js       # Express server and API endpoints
│   └── db.js           # Database setup and seed data
├── frontend/
│   ├── index.html      # Home page with mode selection
│   ├── user.html       # User mode interface
│   └── hotel.html      # Hotel mode interface
├── package.json
└── README.md
```

## Notes

- This is an MVP - no production security measures
- No real authentication (role switching only)
- SQLite database file is created in the root directory
- All prices are in USD
- Dates are stored as strings (YYYY-MM-DD format)
>>>>>>> 61d6e4e (First commit of Bedwars MVP)
