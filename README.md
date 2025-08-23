# DirReactFinal - Directory Management System

A comprehensive directory management system built with Django backend and React frontend, featuring user management, family groups, scoring systems, and advanced search capabilities.

## 🚀 Features

### Core Functionality
- **User Management**: Comprehensive user registration, authentication, and profile management
- **Family Groups**: Create and manage family connections with hierarchical relationships
- **Directory Search**: Advanced search with intelligent query parsing and field visibility controls
- **Image Management**: Photo uploads and image-based search functionality
- **Scoring System**: Points-based access control for premium features
- **Admin Panel**: Full administrative interface for user and system management

### Technical Features
- **Smart Search**: Intelligent query parsing with Maldivian geography context
- **Dynamic Fields**: Configurable search field visibility based on admin settings
- **Responsive Design**: Mobile-first approach with modern UI/UX
- **Real-time Updates**: Live data synchronization between frontend and backend
- **Security**: JWT authentication, role-based access control, and audit logging

## 🏗️ Architecture

- **Backend**: Django 5.0 with REST API
- **Frontend**: React 18 with TypeScript and Vite
- **Database**: SQLite (development) / PostgreSQL (production)
- **Authentication**: JWT-based with role management
- **Deployment**: Docker containerization with Apache/Nginx

## 📁 Project Structure

```
DirReactFinal/
├── django_backend/          # Django backend application
│   ├── api_app/            # API endpoints and views
│   ├── core/               # Core models and utilities
│   ├── directory/          # Directory management
│   ├── family/             # Family group management
│   ├── moderation/         # Content moderation
│   ├── scoring/            # Points and scoring system
│   └── users/              # User management
├── react_frontend/         # React frontend application
│   ├── components/         # Reusable UI components
│   ├── pages/              # Application pages
│   ├── services/           # API service layer
│   ├── store/              # State management
│   └── types/              # TypeScript type definitions
├── deployment/             # Deployment configurations
├── docs/                   # Documentation
└── shared/                 # Shared utilities and scripts
```

## 🛠️ Setup Instructions

### Prerequisites
- Python 3.12+
- Node.js 18+
- Git

### Backend Setup
```bash
cd django_backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Set environment variables
export USE_MEMORY_CACHE=true
export TESTING=true

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start development server
python manage.py runserver 0.0.0.0:8000
```

### Frontend Setup
```bash
cd react_frontend
npm install

# Start development server
npm run dev
```

### Development Environment
```bash
# Backend (Terminal 1)
export USE_MEMORY_CACHE=true && export TESTING=true && python manage.py runserver 0.0.0.0:8000

# Frontend (Terminal 2)
npm run dev
```

## 🔧 Configuration

### Environment Variables
- `USE_MEMORY_CACHE`: Enable in-memory caching (development)
- `TESTING`: Enable testing mode
- `DEBUG`: Django debug mode
- `SECRET_KEY`: Django secret key
- `DATABASE_URL`: Database connection string

### Admin Settings
- Search field visibility configuration
- Points system configuration
- User type management
- System-wide settings

## 🚀 Deployment

### Production Deployment
```bash
# Build frontend
cd react_frontend
npm run build

# Deploy using provided scripts
cd deployment
./deploy_production.sh
```

### Docker Deployment
```bash
cd deployment/docker
docker-compose -f docker-compose.prod.yml up -d
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/login/` - User login
- `POST /api/auth/register/` - User registration
- `POST /api/auth/refresh/` - Token refresh

### Directory Endpoints
- `GET /api/directory/search/` - Search directory entries
- `GET /api/directory/entries/` - List directory entries
- `POST /api/directory/entries/` - Create new entry

### User Management
- `GET /api/users/profile/` - Get user profile
- `PUT /api/users/profile/` - Update user profile
- `POST /api/users/change-password/` - Change password

## 🧪 Testing

```bash
# Backend tests
cd django_backend
python manage.py test

# Frontend tests
cd react_frontend
npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For support and questions, please contact the development team or create an issue in the repository.

---

**Last Updated**: January 27, 2025
**Version**: 1.0.0
