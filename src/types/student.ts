export type CreateStudentInput = {
  fullName: string;
  phoneNumber: string;
  photoUrl: string;
  courseId: string;
  // Optional: registration only needs a name, phone, photo and course.
  email?: string;
  address?: string;
};
