# 🔌 dirReactFinal API Documentation

**Version**: 1.0.0  
**Base URL**: `/api/`  
**Authentication**: JWT Token-based  
**Date**: 2025-01-27

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [User Management](#user-management)
3. [Directory Management](#directory-management)
4. [Family Management](#family-management)
5. [Moderation](#moderation)
6. [Scoring & Gamification](#scoring--gamification)
7. [Analytics](#analytics)
8. [Error Handling](#error-handling)
9. [Rate Limiting](#rate-limiting)
10. [Examples](#examples)

---

## 🔐 Authentication

### Login
**POST** `/api/auth/login/`

Authenticate user and receive JWT tokens.

**Request Body:**
```json
{
    "username": "user@example.com",
    "password": "password123"
}
```

**Response:**
```json
{
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "user": {
        "id": 1,
        "username": "user@example.com",
        "email": "user@example.com",
        "user_type": "premium",
        "score": 150,
        "status": "active"
    }
}
```

### Register
**POST** `/api/auth/register/`

Register a new user account.

**Request Body:**
```json
{
    "username": "newuser",
    "email": "newuser@example.com",
    "password": "password123",
    "password_confirm": "password123",
    "user_type": "basic"
}
```

### Refresh Token
**POST** `/api/auth/refresh/`

Refresh expired access token.

**Request Body:**
```json
{
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### Logout
**POST** `/api/auth/logout/`

Logout user and blacklist refresh token.

**Request Body:**
```json
{
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

---

## 👥 User Management

### Get User Profile
**GET** `/api/users/{id}/`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
    "id": 1,
    "username": "user@example.com",
    "email": "user@example.com",
    "user_type": "premium",
    "relatedto": "family123",
    "status": "active",
    "score": 150,
    "spam_score": 0,
    "warning_count": 0,
    "is_banned": false,
    "join_date": "2025-01-27T10:00:00Z",
    "created_at": "2025-01-27T10:00:00Z",
    "updated_at": "2025-01-27T10:00:00Z"
}
```

### Update User Score
**POST** `/api/users/{id}/update_score/`

**Request Body:**
```json
{
    "points": 10,
    "reason": "Added new contact"
}
```

### List Users
**GET** `/api/users/`

**Query Parameters:**
- `search`: Search by username or email
- `user_type`: Filter by user type (basic, premium, admin, moderator)
- `status`: Filter by status (active, inactive, suspended)
- `is_banned`: Filter by ban status
- `min_score`: Minimum score filter
- `max_score`: Maximum score filter
- `joined_after`: Filter by join date (YYYY-MM-DD)
- `joined_before`: Filter by join date (YYYY-MM-DD)
- `ordering`: Sort by username, join_date, or score

---

## 📚 Directory Management

### Get Phonebook Entries
**GET** `/api/phonebook/`

**Query Parameters:**
- `search`: Search across name, contact, NID, address, profession
- `atoll`: Filter by atoll
- `island`: Filter by island
- `street`: Filter by street
- `ward`: Filter by ward
- `name`: Filter by name
- `contact`: Filter by contact number
- `nid`: Filter by NID
- `email`: Filter by email
- `gender`: Filter by gender (Male, Female, Other)
- `profession`: Filter by profession
- `status`: Filter by status (active, inactive, pending)
- `change_status`: Filter by change status (pending, approved, rejected)
- `image_status`: Filter by image status (pending, approved, rejected, no_image)
- `min_age`: Minimum age filter
- `max_age`: Maximum age filter
- `party`: Filter by political party
- `pep_status`: Filter by PEP status (yes, no, pending)
- `created_after`: Filter by creation date (YYYY-MM-DD)
- `created_before`: Filter by creation date (YYYY-MM-DD)
- `ordering`: Sort by name, contact, or created_at

### Create Phonebook Entry
**POST** `/api/phonebook/`

**Request Body:**
```json
{
    "nid": "A123456",
    "name": "John Doe",
    "contact": "7771234",
    "address": "123 Main Street",
    "atoll": "Male",
    "island": "Male City",
    "street": "Main Street",
    "ward": "Ward 1",
    "party": "Independent",
    "DOB": "15/06/1985",
    "status": "active",
    "remark": "Local business owner",
    "email": "john.doe@example.com",
    "gender": "Male",
    "extra": "Additional information",
    "profession": "Business Owner",
    "pep_status": "no"
}
```

### Advanced Search
**POST** `/api/phonebook/advanced_search/`

**Request Body:**
```json
{
    "query": "John",
    "atoll": "Male",
    "profession": "Business",
    "min_age": 25,
    "max_age": 50,
    "gender": "Male",
    "page": 1,
    "page_size": 20
}
```

### Bulk Operations
**POST** `/api/phonebook/bulk_operation/`

**Request Body:**
```json
{
    "operation": "update_status",
    "entry_ids": [1, 2, 3],
    "update_data": {
        "status": "active"
    }
}
```

### Get Single Entry
**GET** `/api/phonebook/{id}/`

### Update Entry
**PUT** `/api/phonebook/{id}/`

### Delete Entry
**DELETE** `/api/phonebook/{id}/`

---

## 👨‍👩‍👧‍👦 Family Management

### Get Family Groups
**GET** `/api/family-groups/`

**Query Parameters:**
- `search`: Search by name or description
- `created_by`: Filter by creator
- `created_after`: Filter by creation date (YYYY-MM-DD)
- `created_before`: Filter by creation date (YYYY-MM-DD)

### Create Family Group
**POST** `/api/family-groups/`

**Request Body:**
```json
{
    "name": "Doe Family",
    "description": "Extended family of John Doe"
}
```

### Get Family Members
**GET** `/api/family-members/`

**Query Parameters:**
- `family_group`: Filter by family group ID
- `relationship_type`: Filter by relationship type
- `is_primary`: Filter by primary member status

---

## 🛡️ Moderation

### Get Pending Changes
**GET** `/api/pending-changes/`

**Query Parameters:**
- `status`: Filter by status (pending, approved, rejected)
- `change_type`: Filter by change type (name, contact, address, email, profession, other)
- `requested_by`: Filter by requester
- `reviewed_by`: Filter by reviewer
- `requested_after`: Filter by request date (YYYY-MM-DD)
- `requested_before`: Filter by request date (YYYY-MM-DD)

### Approve Change
**POST** `/api/pending-changes/{id}/approve/`

### Reject Change
**POST** `/api/pending-changes/{id}/reject/`

### Get Photo Moderation
**GET** `/api/photo-moderation/`

---

## 🎯 Scoring & Gamification

### Get Score Transactions
**GET** `/api/score-transactions/`

**Query Parameters:**
- `transaction_type`: Filter by transaction type
- `user`: Filter by user ID
- `ordering`: Sort by timestamp

### Get Reward Rules
**GET** `/api/reward-rules/`

**Query Parameters:**
- `action_type`: Filter by action type
- `is_active`: Filter by active status

---

## 📊 Analytics

### Get Analytics
**GET** `/api/analytics/`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
    "overview": {
        "total_users": 1250,
        "total_contacts": 15420,
        "total_families": 890,
        "pending_changes": 45
    },
    "users": {
        "active_users": 1180,
        "banned_users": 12,
        "average_score": 145.67
    },
    "contacts_by_atoll": [
        {"atoll": "Male", "count": 5230},
        {"atoll": "Addu", "count": 2890},
        {"atoll": "Fuvahmulah", "count": 1560}
    ],
    "recent_activity": [
        {
            "id": 1,
            "user": 123,
            "user_name": "john.doe",
            "event_type": "add_contact",
            "description": "Added contact: Jane Smith",
            "timestamp": "2025-01-27T15:30:00Z"
        }
    ]
}
```

---

## 🚨 Error Handling

### Error Response Format
```json
{
    "error": "Error message",
    "detail": "Detailed error description",
    "code": "ERROR_CODE",
    "field_errors": {
        "field_name": ["Error message"]
    }
}
```

### Common HTTP Status Codes
- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Permission denied
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

---

## ⚡ Rate Limiting

### Rate Limits by User Type
- **Anonymous**: 20 requests/hour
- **Basic**: 100 requests/hour
- **Premium**: 500 requests/hour
- **Moderator**: 800 requests/hour
- **Admin**: 1000 requests/hour

### Endpoint-Specific Limits
- **Search**: 50 searches/hour
- **Upload**: 10 uploads/hour
- **Authentication**: 5 attempts/minute
- **Directory**: 100 operations/hour
- **Family**: 50 operations/hour
- **Moderation**: 200 operations/hour
- **User Management**: 50 operations/hour
- **Analytics**: 30 requests/hour

---

## 📝 Examples

### Complete Contact Creation Flow

1. **Login to get token:**
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "user@example.com", "password": "password123"}'
```

2. **Create contact:**
```bash
curl -X POST http://localhost:8000/api/phonebook/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "contact": "7775678",
    "address": "456 Oak Avenue",
    "atoll": "Male",
    "island": "Male City"
  }'
```

3. **Search for contact:**
```bash
curl -X GET "http://localhost:8000/api/phonebook/?search=Jane&atoll=Male" \
  -H "Authorization: Bearer <access_token>"
```

### Advanced Search Example
```bash
curl -X POST http://localhost:8000/api/phonebook/advanced_search/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "business",
    "profession": "owner",
    "min_age": 25,
    "max_age": 60,
    "atoll": "Male"
  }'
```

---

## 🔧 Development

### Running the API
```bash
cd django_backend
python manage.py runserver
```

### Testing Endpoints
```bash
# Health check
curl http://localhost:8000/api/health/

# Get API root
curl http://localhost:8000/api/
```

### Database Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

---

## 📚 Additional Resources

- [Django REST Framework Documentation](https://www.django-rest-framework.org/)
- [JWT Authentication](https://django-rest-framework-simplejwt.readthedocs.io/)
- [Django Filters](https://django-filter.readthedocs.io/)

---

**Last Updated**: 2025-01-27  
**API Version**: 1.0.0  
**Maintainer**: dirReactFinal Development Team
