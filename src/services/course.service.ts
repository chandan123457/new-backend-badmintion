import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import type { CreateCourseInput, UpdateCourseInput } from '../types/course';

type CourseRecord = Prisma.CourseGetPayload<Record<string, never>>;

function formatCourse(course: CourseRecord) {
  return {
    id: course.id,
    name: course.name,
    courseType: course.courseType,
    coachName: course.coachName,
    days: course.days,
    startTime: course.startTime,
    endTime: course.endTime,
    duration: course.duration,
    monthlyFee: course.monthlyFee,
    maxCapacity: course.maxCapacity,
    enrolled: course.enrolled,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
    // maxCapacity 0 means "no capacity limit", so there is nothing to count down.
    availableSlots: course.maxCapacity > 0 ? Math.max(course.maxCapacity - course.enrolled, 0) : 0
  };
}

// The optional details are stored as empty string / 0 rather than NULL, so every
// existing reader keeps working. Empty simply means "not provided yet".
function normalizeCourseInput(input: CreateCourseInput | UpdateCourseInput) {
  return {
    name: input.name,
    courseType: input.courseType,
    duration: input.duration,
    monthlyFee: input.monthlyFee,
    coachName: input.coachName ?? '',
    days: input.days ?? '',
    startTime: input.startTime ?? '',
    endTime: input.endTime ?? '',
    maxCapacity: input.maxCapacity ?? 0
  };
}

export async function listCourses() {
  const courses = await prisma.course.findMany({
    where: {
      deletedAt: null
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  return courses.map(formatCourse);
}

export async function createCourse(input: CreateCourseInput) {
  const course = await prisma.course.create({
    data: normalizeCourseInput(input)
  });

  return formatCourse(course);
}

export async function updateCourse(courseId: string, input: UpdateCourseInput) {
  const course = await prisma.course.update({
    where: {
      id: courseId,
      deletedAt: null
    },
    data: normalizeCourseInput(input)
  });

  return formatCourse(course);
}

export async function deleteCourse(courseId: string) {
  // Soft delete: keep the row so already-enrolled students retain their course
  // details and expiry untouched. The course simply disappears from the active
  // list and from new-registration selection.
  await prisma.course.update({
    where: {
      id: courseId,
      deletedAt: null
    },
    data: {
      deletedAt: new Date()
    }
  });
}
