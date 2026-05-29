# Cloudinary Client-Side Usage Guide

## Components Created

### 1. CloudinaryImage - Base Image Component
### 2. Avatar - Circular Profile Image
### 3. Thumbnail - Small Preview
### 4. ImagePreview - Large Preview with Modal
### 5. ImageUpload - Upload with Preview

## Installation

Already configured! Just use the components.

## Usage Examples

### 1. Display Student Photo

```jsx
import { CloudinaryImage, Avatar } from "@/components/ui/CloudinaryImage";

// Full size image
<CloudinaryImage
  src={student.photoUrl}
  alt={student.name}
  width={300}
  height={300}
  quality={85}
  className="rounded-lg"
/>

// Avatar (circular)
<Avatar
  src={student.photoUrl}
  alt={student.name}
  size={50}
/>
```

### 2. Display Teacher Photo

```jsx
import { ImagePreview } from "@/components/ui/CloudinaryImage";

// Clickable preview with modal
<ImagePreview
  src={teacher.photoUrl}
  alt={teacher.name}
  className="rounded-lg"
/>
```

### 3. Upload Student Photo

```jsx
import { ImageUpload } from "@/components/ui/ImageUpload";
import { useState } from "react";

function StudentForm() {
  const [photo, setPhoto] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append("photo", photo);
    formData.append("name", name);
    // ... other fields

    const response = await fetch("/api/v1/students", {
      method: "POST",
      body: formData,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <ImageUpload
        value={null}
        onChange={setPhoto}
        label="صورة الطالب"
        maxSize={5}
        previewSize={150}
      />
      {/* Other form fields */}
    </form>
  );
}
```

### 4. Display in Table

```jsx
import { Thumbnail } from "@/components/ui/CloudinaryImage";

<table>
  <tbody>
    {students.map(student => (
      <tr key={student.id}>
        <td>
          <Thumbnail src={student.photoUrl} alt={student.name} />
        </td>
        <td>{student.name}</td>
      </tr>
    ))}
  </tbody>
</table>
```

### 5. Display in Card

```jsx
import { CloudinaryImage } from "@/components/ui/CloudinaryImage";

<div className="card">
  <CloudinaryImage
    src={student.photoUrl}
    alt={student.name}
    width={200}
    height={200}
    quality={80}
    className="rounded-t-lg"
    objectFit="cover"
  />
  <div className="p-4">
    <h3>{student.name}</h3>
    <p>{student.class}</p>
  </div>
</div>
```

## Component Props

### CloudinaryImage

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| src | string | required | Image URL (Cloudinary or regular) |
| alt | string | "صورة" | Alt text |
| width | number | 400 | Width in pixels |
| height | number | 400 | Height in pixels |
| quality | number | 80 | Image quality (1-100) |
| className | string | "" | CSS classes |
| fallback | string | "/placeholder.png" | Fallback image |
| rounded | boolean | false | Circular image |
| objectFit | string | "cover" | CSS object-fit |

### Avatar

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| src | string | required | Image URL |
| alt | string | required | Alt text |
| size | number | 40 | Size in pixels (width & height) |
| className | string | "" | CSS classes |

### Thumbnail

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| src | string | required | Image URL |
| alt | string | required | Alt text |
| className | string | "" | CSS classes |

### ImagePreview

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| src | string | required | Image URL |
| alt | string | required | Alt text |
| className | string | "" | CSS classes |

### ImageUpload

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| value | string | null | Current image URL |
| onChange | function | required | Callback with File object |
| label | string | "تحميل الصورة" | Label text |
| error | string | null | Error message |
| disabled | boolean | false | Disable upload |
| maxSize | number | 5 | Max file size in MB |
| accept | string | "image/jpeg,image/png,image/jpg" | Accepted file types |
| previewSize | number | 150 | Preview size in pixels |
| className | string | "" | CSS classes |

## Features

### ✅ Automatic Optimization
- Images are automatically optimized via Cloudinary transformations
- Width, height, and quality parameters are applied
- Format is auto-detected (WebP for supported browsers)

### ✅ Loading States
- Shows loading animation while image loads
- Smooth fade-in transition when loaded

### ✅ Error Handling
- Shows fallback icon if image fails to load
- Graceful degradation for missing images

### ✅ Responsive
- Images scale properly on all devices
- Maintains aspect ratio

### ✅ Performance
- Lazy loading support (add `loading="lazy"` via props)
- Optimized Cloudinary URLs reduce bandwidth
- Backend compression ensures small file sizes

## Backend Integration

When uploading images, the backend will:
1. Compress image using Sharp (80% quality, max 1200x1200)
2. Upload to Cloudinary
3. Return secure URL
4. Save URL to database

Client receives the URL and displays it using CloudinaryImage component.

## Example: Complete Student Form

```jsx
import { useState } from "react";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { Input } from "@/components/ui/Input";
import { toast } from "sonner";

function AddStudent() {
  const [formData, setFormData] = useState({
    name: "",
    fatherName: "",
    class: "",
    photo: null,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    data.append("name", formData.name);
    data.append("fatherName", formData.fatherName);
    data.append("class", formData.class);
    if (formData.photo) {
      data.append("photo", formData.photo);
    }

    try {
      const response = await fetch("/api/v1/students", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: data,
      });

      if (response.ok) {
        toast.success("تم إضافة الطالب بنجاح");
      }
    } catch (error) {
      toast.error("خطأ في إضافة الطالب");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ImageUpload
        value={null}
        onChange={(file) => setFormData({ ...formData, photo: file })}
        label="صورة الطالب"
      />

      <Input
        label="الاسم"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />

      <Input
        label="اسم الأب"
        value={formData.fatherName}
        onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
      />

      <button type="submit" className="btn-primary">
        حفظ
      </button>
    </form>
  );
}
```

## Notes

- All images are automatically compressed on backend before upload
- Cloudinary transformations are applied on-the-fly
- Works with both local and remote databases
- Fallback to placeholder if image not available
- RTL-friendly (Pashto text support)
