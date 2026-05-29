# Cloudinary Integration Guide

## Configuration

All Cloudinary settings are in `.env`:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=dk2srogw3
CLOUDINARY_API_KEY=667866949346456
CLOUDINARY_API_SECRET=JibC3600K8jyf1GfZaCTaHq3mxc
CLOUDINARY_URL=cloudinary://667866949346456:JibC3600K8jyf1GfZaCTaHq3mxc@dk2srogw3
```

## Database Mode Switching

Switch between local SQLite and remote Turso database:

```env
# Local Mode (Offline)
DB_MODE=local
LOCAL_DATABASE_URL=file:./database/school.db

# Online Mode (Remote Turso)
DB_MODE=online
REMOTE_DATABASE_URL=libsql://school-database-ansar-stack.aws-ap-south-1.turso.io
TURSO_AUTH_TOKEN=your_turso_token_here
```

## Usage in Controllers

### Example: Upload Student Photo

```javascript
import { uploadImage, deleteImage } from "../utils/cloudinary.util.js";

// Upload with compression
const uploadStudentPhoto = async (req, res) => {
  try {
    const fileBuffer = req.file.buffer; // from multer

    const result = await uploadImage(fileBuffer, {
      folder: "students",
      publicId: `student_${studentId}`,
      quality: 80,        // 80% quality
      maxWidth: 800,      // max 800px width
      maxHeight: 800,     // max 800px height
    });

    const photoUrl = result.secure_url;
    
    // Save photoUrl to database
    // ...
    
    res.json({ success: true, url: photoUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete old photo
const deleteStudentPhoto = async (photoUrl) => {
  try {
    const publicId = getPublicIdFromUrl(photoUrl);
    await deleteImage(publicId);
  } catch (error) {
    console.error("Failed to delete photo:", error);
  }
};
```

### Example: Upload Teacher Photo

```javascript
const result = await uploadImage(req.file.buffer, {
  folder: "teachers",
  publicId: `teacher_${teacherId}`,
  quality: 85,
  maxWidth: 1000,
  maxHeight: 1000,
});
```

### Example: Upload Staff Photo

```javascript
const result = await uploadImage(req.file.buffer, {
  folder: "staff",
  publicId: `staff_${staffId}`,
  quality: 80,
  maxWidth: 800,
  maxHeight: 800,
});
```

## Compression Details

- **Backend Compression**: Images are compressed using Sharp BEFORE uploading to Cloudinary
- **Format**: All images converted to JPEG with mozjpeg optimization
- **Quality**: Default 80% (adjustable per upload)
- **Resize**: Images resized to fit within max dimensions without enlargement
- **No Cloudinary Compression**: Cloudinary receives already-compressed images

## Benefits

1. **Reduced Upload Time**: Smaller files upload faster
2. **Lower Bandwidth**: Saves internet data
3. **Cost Effective**: Cloudinary charges less for smaller files
4. **Better Performance**: Faster page loads with optimized images
5. **Offline-First Compatible**: Works with both local and remote databases

## Folder Structure in Cloudinary

```
school/
├── students/
│   ├── student_1.jpg
│   ├── student_2.jpg
│   └── ...
├── teachers/
│   ├── teacher_1.jpg
│   └── ...
├── staff/
│   ├── staff_1.jpg
│   └── ...
└── documents/
    └── ...
```

## Error Handling

```javascript
try {
  const result = await uploadImage(fileBuffer, options);
} catch (error) {
  if (error.message.includes("Invalid image")) {
    // Handle invalid image format
  } else if (error.message.includes("File too large")) {
    // Handle large file
  } else {
    // Handle other errors
  }
}
```

## Testing

1. **Test Local Database**:
   ```bash
   # Set in .env
   DB_MODE=local
   npm run dev
   ```

2. **Test Remote Database**:
   ```bash
   # Set in .env
   DB_MODE=online
   TURSO_AUTH_TOKEN=your_token
   npm run dev
   ```

3. **Test Image Upload**:
   - Upload a student/teacher/staff photo
   - Check Cloudinary dashboard: https://console.cloudinary.com/
   - Verify image is compressed and in correct folder

## Notes

- Sharp package is already installed in your project
- Cloudinary package has been installed
- Backend compression happens before upload (saves bandwidth)
- Images are automatically converted to JPEG format
- Original aspect ratio is maintained during resize
