import { Eye, Download, Loader2 } from "lucide-react";
import IdCardGenerator from "./IdCardGenerator";
import TeacherIDCard from "./TeacherIDCard";
import StaffIDCard from "./StaffIDCard";

/**
 * IdCardPreview Component
 * Displays a thumbnail preview of an ID card with action buttons
 * 
 * @param {Object} student - Student data object or mapped teacher/staff data
 * @param {boolean} selected - Whether the card is selected
 * @param {Function} onSelect - Callback when checkbox is toggled
 * @param {Function} onPreview - Callback when preview button is clicked
 * @param {Function} onDownload - Callback when download button is clicked
 * @param {boolean} loading - Whether download is in progress
 * @param {string} cardType - Card type: student | teacher | staff
 */
export default function IdCardPreview({ student, selected, onSelect, onPreview, onDownload, loading = false, cardTitle, cardType = 'student' }) {
  const CardComponent = cardType === 'teacher' ? TeacherIDCard : cardType === 'staff' ? StaffIDCard : IdCardGenerator;
  const cardProps = cardType === 'teacher'
    ? { teacher: student }
    : cardType === 'staff'
    ? { staff: student }
    : { student, title: cardTitle || 'شاګرد پیژند کارډ' };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      {/* Card Thumbnail */}
      <div className="relative bg-muted overflow-hidden" style={{ aspectRatio: '1016/638' }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div style={{ transform: 'scale(0.25)', transformOrigin: 'center' }}>
            <CardComponent {...cardProps} scale={1} />
          </div>
        </div>
      </div>

      {/* Card Info & Actions */}
      <div className="p-3 space-y-2">
        {/* Student Info */}
        <div className="text-sm">
          <p className="font-medium text-foreground truncate">{student.fullName}</p>
          <p className="text-xs text-muted-foreground truncate">
            {student.fatherName} • {student.className || 'ټولګی نشته'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Checkbox */}
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={selected}
              onChange={(e) => onSelect(student.id, e.target.checked)}
              className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
            />
            <span className="text-xs text-muted-foreground">غوره کول</span>
          </label>

          {/* Preview Button */}
          <button
            onClick={() => onPreview(student)}
            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs border border-input rounded hover:bg-muted transition-colors"
            title="کتل"
          >
            <Eye className="size-3.5" />
            <span>کتل</span>
          </button>

          {/* Download Button */}
          <button
            onClick={() => onDownload(student)}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            title="ډاونلوډ"
          >
            {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
            <span>ډاونلوډ</span>
          </button>
        </div>
      </div>
    </div>
  );
}
