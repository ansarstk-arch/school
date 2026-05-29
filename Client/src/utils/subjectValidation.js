export const validateSubject = (data) => {
  const errors = {};
  const nameRegex = /^[\u0600-\u06FF\u200C\u200Da-zA-Z\s]+$/;

  // Validate name
  if (!data.name || !data.name.trim()) {
    errors.name = "د مضمون نوم اړین دی";
  } else if (data.name.trim().length < 2) {
    errors.name = "د مضمون نوم باید لږترلږه ۲ توري وي";
  } else if (data.name.trim().length > 100) {
    errors.name = "د مضمون نوم باید د ۱۰۰ توري څخه لږ وي";
  } else if (!nameRegex.test(data.name.trim())) {
    errors.name = "د مضمون نوم یوازې پښتو، دري یا انګلیسي توري ولري";
  }

  // Validate type
  if (!data.type) {
    errors.type = "ډول اړین دی";
  } else if (!["School", "Center", "Madrasa"].includes(data.type)) {
    errors.type = "ډول باید ښوونځی، مرکز یا مدرسه وي";
  }

  // Validate classIds
  if (!data.classIds || !Array.isArray(data.classIds) || data.classIds.length === 0) {
    errors.classIds = "لږترلږه یو ټولګی وټاکئ";
  }

  return errors;
};
