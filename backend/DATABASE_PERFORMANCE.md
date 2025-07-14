# Database Performance Optimization

This document outlines the database indexes implemented to optimize query performance in the Collaborative Playlist Manager.

## Overview

Database indexes have been strategically added to all models to improve query performance, especially for frequently accessed data patterns.

## Implemented Indexes

### User Model (`users` collection)

| Index | Type | Purpose |
|-------|------|---------|
| `username_1` | Unique | User authentication, profile lookup |
| `email_1` | Unique | User authentication, profile lookup |
| `createdAt_-1` | Single | User listing, sorting by registration date |
| `spotifyId_1` | Sparse | Spotify integration lookup |

### Playlist Model (`playlists` collection)

| Index | Type | Purpose |
|-------|------|---------|
| `creator_1_createdAt_-1` | Compound | User's playlists sorted by creation date |
| `collaborators.user_1` | Single | Finding playlists where user is collaborator |
| `isPublic_1_createdAt_-1` | Compound | Public playlists discovery |
| `tags_1` | Single | Tag-based playlist search |
| `creator_1_collaborators.user_1_isPublic_1` | Compound | Access control queries |
| `isPublic_1_tags_1_createdAt_-1` | Compound | Advanced public playlist discovery |

### Song Model (`songs` collection)

| Index | Type | Purpose |
|-------|------|---------|
| `spotifyId_1` | Unique Sparse | Spotify track lookup |
| `youtubeId_1` | Sparse | YouTube video lookup |
| `playlist_1_order_1` | Compound | Playlist songs ordered by position |
| `playlist_1_addedAt_-1` | Compound | Recently added songs in playlist |
| `title_text_artist_text_album_text` | Text | Full-text search across song metadata |
| `addedBy_1_addedAt_-1` | Compound | User's song contributions |
| `playlist_1_order_1_addedAt_-1` | Compound | Optimized playlist queries |

## Performance Benefits

### Query Optimization

1. **User Authentication**: O(1) lookup for login/registration
2. **Playlist Access Control**: Fast permission checking
3. **Song Ordering**: Efficient playlist display
4. **Search Operations**: Full-text search across song metadata
5. **Collaborative Features**: Quick collaborator lookup

### Expected Performance Improvements

- **User lookup**: ~95% faster (index scan vs collection scan)
- **Playlist queries**: ~80-90% faster for large datasets
- **Song search**: ~99% faster with text indexes
- **Collaborative queries**: ~85% faster access control checks

## Index Management

### Automatic Creation

Indexes are automatically created when the application starts:

```javascript
// In database connection
await createIndexes();
```

### Manual Management

Use the provided CLI tool for index management:

```bash
# Create all indexes
node manage-indexes.js create

# View current indexes
node manage-indexes.js info

# Recreate all indexes (⚠️ USE WITH CAUTION)
node manage-indexes.js recreate
```

## Monitoring

### Index Usage

Monitor index usage in production:

```javascript
// Get index statistics
db.collection.getIndexStats()

// Explain query execution
db.collection.find(query).explain("executionStats")
```

### Performance Metrics

Key metrics to monitor:
- Query execution time
- Index hit ratio
- Collection scan frequency
- Memory usage

## Best Practices

### Query Patterns

1. **Always use indexed fields** in query filters
2. **Compound index order** matters - most selective fields first
3. **Text search** should use the text index
4. **Avoid** negation queries on non-indexed fields

### Index Maintenance

1. **Regular monitoring** of index usage
2. **Remove unused indexes** to save space
3. **Update indexes** when query patterns change
4. **Test performance** before and after index changes

## Development Guidelines

### Adding New Indexes

1. Add index definition to the appropriate model
2. Update this documentation
3. Test with production-like data volume
4. Monitor query performance

### Query Optimization

```javascript
// ✅ Good - Uses indexes
User.find({ email: userEmail })
Playlist.find({ creator: userId }).sort({ createdAt: -1 })
Song.find({ playlist: playlistId }).sort({ order: 1 })

// ❌ Bad - Full collection scan
User.find({ "preferences.theme": "dark" })
Playlist.find({ name: { $regex: /playlist/i } })
```

## Production Considerations

### Memory Usage

- Indexes consume RAM
- Monitor available memory
- Consider index size vs query frequency

### Write Performance

- Indexes slow down writes
- Balance read vs write performance
- Consider partial indexes for large collections

### Maintenance Windows

- Index creation can be resource-intensive
- Plan index changes during low-traffic periods
- Use background index creation when possible

## Troubleshooting

### Common Issues

1. **Index conflicts**: Check for duplicate index definitions
2. **Performance degradation**: Monitor index usage and query plans
3. **Memory issues**: Review index size and necessity

### Debug Commands

```bash
# Check index conflicts
node manage-indexes.js info

# Monitor query performance
# Use MongoDB Compass or profiler

# Check index usage
db.runCommand({ collStats: "users", indexDetails: true })
```
