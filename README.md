# Host Helper Clean - Professional Cleaning Management for Rental Hosts

A professional web application for managing home rental and short-term rental cleaning operations with customizable checklists, team management, and shareable cleaner portals.

## Features

### For Property Managers
- **Property Management**: Add and manage multiple home rental properties
- **Custom Checklists**: Create detailed cleaning checklists for each property
- **Team Management**: Add cleaners and assign them to specific properties
- **Shareable Links**: Generate unique links for cleaners to access checklists without accounts
- **Real-time Updates**: Track cleaning progress in real-time
- **Supplies Tracking**: Monitor when properties need restocking
- **Analytics Dashboard**: View cleaning statistics and performance metrics

### For Cleaners
- **No Login Required**: Access checklists via unique shareable links
- **Mobile-Friendly**: Complete checklists on any device
- **Task Tracking**: Check off tasks as they're completed
- **Supply Reporting**: Report when supplies are running low
- **Issue Reporting**: Flag any problems for property managers

## Getting Started

1. Open `index.html` in a web browser
2. Click "Sign Up Free" to create an account
3. Add your properties
4. Create cleaning checklists
5. Share links with your cleaning team

## Demo Credentials

You can log in with any email/password combination as authentication is simulated for demo purposes.

## Technology Stack

- **Frontend**: Pure HTML, CSS, and JavaScript
- **Styling**: Custom CSS with responsive design
- **Icons**: Font Awesome
- **Storage**: LocalStorage (for demo - would use a database in production)

## Project Structure

```
airbnb-cleaner-website/
├── index.html          # Main application file
├── css/
│   └── style.css      # All styling
├── js/
│   └── script.js      # Application logic
├── images/            # Image assets (placeholder)
└── README.md          # This file
```

## Key Features Walkthrough

### 1. Landing Page
- Professional marketing site with features, pricing, and benefits
- Clear call-to-action for signing up

### 2. Authentication
- Login/Signup modals
- Account creation with free trial
- Persistent login state

### 3. Dashboard
- Overview of properties, cleanings, and team
- Quick stats and recent activity
- Today's cleaning schedule

### 4. Property Management
- Add properties with details (bedrooms, bathrooms, address)
- Special instructions for cleaners
- Property-specific settings

### 5. Checklist Creation
- Templates for different cleaning types (Standard, Deep Clean, etc.)
- Customizable task lists by room/category
- Assign to specific cleaners and dates

### 6. Cleaner Portal
- Accessible via unique URL (no login required)
- Progress tracking with visual progress bar
- Task completion with checkbox interface
- Supply request functionality
- Issue reporting

### 7. Sharing System
- Generate unique links for each checklist
- Copy-to-clipboard functionality
- Links work without authentication

## Future Enhancements

- Backend API integration
- Database storage
- Email/SMS notifications
- Calendar integration
- Payment processing
- Multi-language support
- Native mobile apps
- Advanced reporting
- Integration with property management systems

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers

## License

This is a demo project for educational purposes.