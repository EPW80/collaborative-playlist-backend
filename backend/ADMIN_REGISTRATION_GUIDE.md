# Enhanced Admin Registration System

## Overview

The Collaborative Playlist Manager now includes an enhanced registration system that allows creating users with different privilege levels during the registration process. This replaces the need for separate admin registration endpoints while maintaining security through admin secret validation.

## User Roles

### Role Hierarchy
1. **user** (Level 1) - Default role
2. **moderator** (Level 2) - Enhanced permissions
3. **admin** (Level 3) - Administrative access
4. **superadmin** (Level 4) - Highest privileges

### Role Permissions

#### Regular User (`user`)
- Create and manage own playlists
- Collaborate on shared playlists (with appropriate permissions)
- Search for music and add songs
- Standard user functionality

#### Moderator (`moderator`)
- All user permissions
- Enhanced content moderation capabilities
- Can moderate public playlists
- Advanced reporting features

#### Administrator (`admin`)
- All moderator permissions
- Full administrative access
- User management capabilities
- System configuration access
- Analytics and reporting

#### Super Administrator (`superadmin`)
- All admin permissions
- System-wide control
- Server management access
- Critical system operations

## Registration Methods

### Method 1: Enhanced Regular Registration Endpoint

**Endpoint:** `POST /api/auth/register`

#### Regular User Registration
```bash
curl -X POST "http://localhost:5000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "securePassword123"
  }'
```

#### Admin User Registration
```bash
curl -X POST "http://localhost:5000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin_user",
    "email": "admin@example.com",
    "password": "securePassword123",
    "role": "admin",
    "adminSecret": "super_secret_admin_key_2025_playlist_manager"
  }'
```

#### SuperAdmin User Registration
```bash
curl -X POST "http://localhost:5000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "super_admin",
    "email": "superadmin@example.com",
    "password": "securePassword123",
    "role": "superadmin",
    "adminSecret": "super_secret_admin_key_2025_playlist_manager"
  }'
```

### Method 2: Dedicated Admin Registration Endpoint

**Endpoint:** `POST /api/auth/register-admin`

```bash
curl -X POST "http://localhost:5000/api/auth/register-admin" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin_user",
    "email": "admin@example.com",
    "password": "securePassword123",
    "role": "admin",
    "adminSecret": "super_secret_admin_key_2025_playlist_manager"
  }'
```

### Method 3: Direct Database Script

```bash
cd /home/epw/collaborative-playlist-manager/backend
node scripts/createAdmin.js admin_user admin@example.com SecurePassword123 admin
```

## Security Features

### Admin Secret Protection
- Elevated roles (`moderator`, `admin`, `superadmin`) require a valid `adminSecret`
- Secret is stored in environment variable: `ADMIN_REGISTRATION_SECRET`
- Invalid or missing secret returns `403 Forbidden`

### Validation
- **Username:** 3-30 characters
- **Email:** Valid email format
- **Password:** Minimum 6 characters
- **Role:** Must be one of: `user`, `moderator`, `admin`, `superadmin`
- **Admin Secret:** Required string for elevated roles

### Error Handling
- Duplicate email/username detection
- Role validation
- Secret validation
- Comprehensive error messages

## Frontend Integration

### React Component Usage

```jsx
import AdminRegistrationDialog from './components/AdminRegistrationDialog';

function AdminPanel() {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleUserCreated = (user) => {
    console.log('New user created:', user);
    // Handle success (refresh user list, show notification, etc.)
  };

  return (
    <div>
      <Button onClick={() => setDialogOpen(true)}>
        Add New User
      </Button>
      
      <AdminRegistrationDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={handleUserCreated}
      />
    </div>
  );
}
```

### Features
- Visual role selection with icons and descriptions
- Conditional admin secret field
- Real-time validation
- Error handling and display
- Role-based button styling

## User Model Methods

The User model includes helper methods for role management:

```javascript
// Check if user is admin or superadmin
user.isAdmin() // returns boolean

// Check if user is superadmin
user.isSuperAdmin() // returns boolean

// Check role hierarchy level
user.hasRoleLevel('admin') // returns boolean
```

## Middleware for Admin Protection

Use the admin authentication middleware for protected routes:

```javascript
const { requireAdmin, requireAnyAdmin, requireSuperAdmin } = require('./middleware/adminAuth');

// Require any admin level (admin or superadmin)
router.get('/admin-only', auth, requireAnyAdmin, controller);

// Require specific admin level
router.get('/admin-required', auth, requireAdmin('admin'), controller);

// Require superadmin only
router.delete('/critical-operation', auth, requireSuperAdmin, controller);
```

## Environment Configuration

Add to your `.env` file:

```env
# Admin Registration Secret (change this in production!)
ADMIN_REGISTRATION_SECRET=super_secret_admin_key_2025_playlist_manager
```

## Example Responses

### Successful Admin Registration
```json
{
  "success": true,
  "message": "admin user registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "6887e0a7dfe938662a6ace82",
      "username": "admin_user",
      "email": "admin@example.com",
      "role": "admin",
      "createdAt": "2025-07-28T20:42:15.491Z"
    }
  }
}
```

### Invalid Admin Secret
```json
{
  "success": false,
  "message": "Invalid admin secret required for elevated roles",
  "statusCode": 403
}
```

### Invalid Role
```json
{
  "success": false,
  "message": "Invalid role specified",
  "statusCode": 400
}
```

## Testing

Use the provided test script to verify functionality:

```bash
cd /home/epw/collaborative-playlist-manager/backend
chmod +x test_admin_registration.sh
./test_admin_registration.sh
```

## Best Practices

1. **Change the admin secret** in production environments
2. **Use environment variables** for secrets, never hardcode
3. **Limit superadmin accounts** to essential personnel only
4. **Regular audit** of admin and superadmin accounts
5. **Implement logging** for admin account creations and activities
6. **Use strong passwords** for all admin accounts
7. **Consider 2FA** for admin accounts in production

## Migration from Previous System

If you have existing users that need admin privileges:

1. **Database Update Script:**
```javascript
// Update existing user to admin
await User.findByIdAndUpdate(userId, { role: 'admin' });
```

2. **Bulk Role Assignment:**
```javascript
// Promote multiple users
await User.updateMany(
  { email: { $in: ['admin1@example.com', 'admin2@example.com'] } },
  { role: 'admin' }
);
```

## Troubleshooting

### Common Issues

1. **403 Forbidden:** Check admin secret matches environment variable
2. **400 Bad Request:** Verify role is valid and all required fields provided
3. **409 Conflict:** Email or username already exists
4. **Rate Limited:** Too many requests, wait before retrying

### Debug Mode

Enable debug logging by uncommenting debug lines in the auth controller for detailed request information.

---

This enhanced system provides flexible user management while maintaining security through proper validation and secret protection.
