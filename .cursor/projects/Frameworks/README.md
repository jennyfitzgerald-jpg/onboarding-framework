# Staff Onboarding Framework

An interactive, shareable website tool for tracking staff onboarding progress with a database backend. This tool helps teams communicate what has been done, assign leaders to each step, and visualize what still needs to be completed.

## Features

- ✅ **Database-Backed**: All data stored in SQLite database for persistence and sharing
- ✅ **Interactive Step Management**: Add, edit, and delete onboarding steps
- 👤 **Leader Assignment**: Assign a person to lead each step
- 📊 **Progress Tracking**: Visual progress bar showing completion percentage
- 🏷️ **Categorization**: Organize steps by category (Preparation, Training, Documentation, etc.)
- ✅ **Status Indicators**: Clear visual indicators for completed vs. pending steps
- 🔗 **Shareable**: Share the URL with your team to view current progress
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile devices
- 🗄️ **RESTful API**: Full CRUD API for step management

## Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)

## Installation

1. **Clone or download this repository**

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Seed the database with default framework steps:**
   ```bash
   npm run seed
   ```
   
   This will populate the database with default onboarding steps. You can customize these in `seed.js`.

4. **Start the server:**
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to `http://localhost:3000`

## Database

The application uses SQLite for data storage. The database file (`database.sqlite`) will be created automatically when you first run the server.

### Seeding Default Steps

The `seed.js` file contains default onboarding framework steps. To customize:

1. Edit `seed.js` and modify the `defaultSteps` array
2. Run `npm run seed` to reset and populate the database

### Database Schema

The `steps` table contains:
- `id` (TEXT, PRIMARY KEY)
- `title` (TEXT, NOT NULL)
- `description` (TEXT)
- `leader` (TEXT)
- `category` (TEXT, DEFAULT 'other')
- `completed` (INTEGER, DEFAULT 0)
- `created_at` (TEXT)
- `updated_at` (TEXT)
- `completed_at` (TEXT)
- `step_order` (INTEGER, DEFAULT 0)

## API Endpoints

### Get All Steps
```
GET /api/steps
```

### Get Single Step
```
GET /api/steps/:id
```

### Create Step
```
POST /api/steps
Body: { title, description?, leader?, category?, step_order? }
```

### Update Step
```
PUT /api/steps/:id
Body: { title, description?, leader?, category?, completed?, step_order? }
```

### Delete Step
```
DELETE /api/steps/:id
```

### Toggle Step Completion
```
PATCH /api/steps/:id/toggle
```

### Get Statistics
```
GET /api/stats
Returns: { total, completed, pending, percentage }
```

## Usage

### Adding Steps

1. Click the "Add Step" button
2. Fill in the step details:
   - **Title** (required): Name of the onboarding step
   - **Description**: Additional details about what needs to be done
   - **Assigned Leader**: Name of the person leading this step
   - **Category**: Choose from Preparation, Training, Documentation, Integration, Review, or Other
3. Click "Add Step" to save

### Editing Steps

1. Click the "Edit" button on any step card
2. Modify the details as needed
3. Check "Mark as completed" to mark a step as done
4. Click "Save Changes"

### Completing Steps

- Click anywhere on a step card (except buttons) to toggle completion status
- Or use the edit modal to mark as completed

### Sharing Progress

1. Click the "Share Progress" button
2. Copy the URL and share it with your team
3. The shared view shows current progress statistics

### Deleting Steps

1. Click the "Delete" button on any step card
2. Confirm the deletion

## Customization

### Adding More Categories

Edit `index.html` and update the category select options in both the add and edit modals.

### Changing Colors

Modify the CSS variables in `styles.css`:

```css
:root {
    --primary-color: #2563eb;
    --success-color: #10b981;
    /* ... other colors */
}
```

### Customizing Default Steps

Edit `seed.js` to modify the default onboarding framework steps. The structure is:

```javascript
{
    title: "Step Title",
    description: "Step description",
    category: "preparation", // or training, documentation, integration, review, other
    step_order: 1 // Order in which steps appear
}
```

## Deployment

### Option 1: Local Network

Run the server and access it from other devices on your network using your computer's IP address:
```
http://YOUR_IP_ADDRESS:3000
```

### Option 2: Cloud Hosting

Deploy to platforms like:
- **Heroku**: Add a `Procfile` with `web: node server.js`
- **Railway**: Connect your repository
- **Render**: Deploy as a web service
- **DigitalOcean**: Use App Platform
- **AWS/Azure/GCP**: Deploy as a Node.js application

### Environment Variables

You can set the port using:
```bash
PORT=3000 npm start
```

## File Structure

```
Frameworks/
├── index.html          # Main HTML file
├── styles.css          # All styling
├── app.js              # Frontend application logic
├── server.js           # Express server and API
├── seed.js             # Database seeding script
├── package.json        # Dependencies and scripts
├── .gitignore          # Git ignore file
├── database.sqlite     # SQLite database (created on first run)
└── README.md           # This file
```

## Troubleshooting

### Database Errors

If you encounter database errors:
1. Delete `database.sqlite` and restart the server
2. Run `npm run seed` to recreate the database

### Port Already in Use

If port 3000 is already in use:
```bash
PORT=3001 npm start
```

### CORS Issues

CORS is enabled for all origins. If you need to restrict it, modify the CORS settings in `server.js`.

## Future Enhancements

Potential features that could be added:

- [ ] User authentication
- [ ] Multiple onboarding frameworks
- [ ] Due dates and deadlines
- [ ] Comments/notes on steps
- [ ] Email notifications
- [ ] Step dependencies
- [ ] Timeline view
- [ ] Export/Import functionality
- [ ] Activity log/history

## License

This project is open source and available for use and modification.

## Support

For issues or questions, please check the code comments or modify as needed for your specific use case.
