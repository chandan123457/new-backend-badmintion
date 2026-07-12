import type { Prisma } from '@prisma/client';
import { addMonths } from '../lib/date';
import { prisma } from '../lib/prisma';
import { getDaysRemaining, getMembershipStatus } from './reminder.service';
import type { CreateStudentInput } from '../types/student';

type StudentWithCourse = Prisma.StudentGetPayload<{
  include: {
    course: true;
  };
}>;

function formatStudent(student: StudentWithCourse) {
  const status = getMembershipStatus(student.courseEndAt);
  const daysRemaining = getDaysRemaining(student.courseEndAt);

  return {
    id: student.id,
    fullName: student.fullName,
    email: student.email,
    phoneNumber: student.phoneNumber,
    address: student.address,
    photoUrl: student.photoUrl,
    registeredAt: student.registeredAt,
    lastReactivatedAt: student.lastReactivatedAt,
    courseEndAt: student.courseEndAt,
    createdAt: student.createdAt,
    updatedAt: student.updatedAt,
    courseId: student.courseId,
    status,
    daysRemaining,
    course: {
      id: student.course.id,
      name: student.course.name,
      courseType: student.course.courseType,
      coachName: student.course.coachName,
      days: student.course.days,
      startTime: student.course.startTime,
      endTime: student.course.endTime,
      duration: student.course.duration,
      monthlyFee: student.course.monthlyFee,
      maxCapacity: student.course.maxCapacity,
      enrolled: student.course.enrolled
    }
  };
}

export async function listStudents(search?: string) {
  const students = await prisma.student.findMany({
    where: search
      ? {
          fullName: {
            contains: search,
            mode: 'insensitive'
          }
        }
      : undefined,
    include: {
      course: true
    },
    orderBy: {
      registeredAt: 'desc'
    }
  });

  return students.map((student) => formatStudent(student));
}

export async function createStudent(input: CreateStudentInput) {
  const course = await prisma.course.findUniqueOrThrow({
    where: {
      id: input.courseId
    }
  });
  const courseEndAt = addMonths(new Date(), course.duration);

  const [student] = await prisma.$transaction([
    prisma.student.create({
      data: {
        ...input,
        courseEndAt,
        status: getMembershipStatus(courseEndAt)
      },
      include: {
        course: true
      }
    }),
    prisma.course.update({
      where: {
        id: input.courseId
      },
      data: {
        enrolled: {
          increment: 1
        }
      }
    })
  ]);

  const refreshedStudent = await prisma.student.findUniqueOrThrow({
    where: {
      id: student.id
    },
    include: {
      course: true
    }
  });

  return formatStudent(refreshedStudent);
}

export async function reactivateStudent(studentId: string, courseId: string) {
  const student = await prisma.student.findUniqueOrThrow({
    where: {
      id: studentId
    },
    include: {
      course: true
    }
  });
  const nextCourse = await prisma.course.findFirstOrThrow({
    where: {
      id: courseId,
      deletedAt: null
    }
  });

  // Renewal starts today, so the new expiry is today + the chosen course duration.
  const reactivatedAt = new Date();
  const courseEndAt = addMonths(reactivatedAt, nextCourse.duration);
  const hasCourseChanged = student.courseId !== courseId;

  const operations: Prisma.PrismaPromise<unknown>[] = [
    prisma.student.update({
      where: {
        id: studentId
      },
      data: {
        courseId,
        courseEndAt,
        lastReactivatedAt: reactivatedAt,
        status: getMembershipStatus(courseEndAt),
        // Re-arm the reminder pipeline for the fresh cycle.
        twoDaysReminderSentAt: null,
        oneDayReminderCount: 0,
        finalDayReminderCount: 0
      }
    })
  ];

  if (hasCourseChanged) {
    operations.push(
      prisma.course.update({
        where: {
          id: student.courseId
        },
        data: {
          enrolled: {
            decrement: student.course.enrolled > 0 ? 1 : 0
          }
        }
      }),
      prisma.course.update({
        where: {
          id: courseId
        },
        data: {
          enrolled: {
            increment: 1
          }
        }
      })
    );
  }

  await prisma.$transaction(operations);

  const refreshedStudent = await prisma.student.findUniqueOrThrow({
    where: {
      id: studentId
    },
    include: {
      course: true
    }
  });

  return formatStudent(refreshedStudent);
}

export async function getStudent(studentId: string) {
  const student = await prisma.student.findUniqueOrThrow({
    where: {
      id: studentId
    },
    include: {
      course: true
    }
  });

  return formatStudent(student);
}

export async function removeStudent(studentId: string) {
  const student = await prisma.student.findUniqueOrThrow({
    where: {
      id: studentId
    },
    include: {
      course: true
    }
  });

  await prisma.$transaction([
    prisma.student.delete({
      where: {
        id: studentId
      }
    }),
    prisma.course.update({
      where: {
        id: student.courseId
      },
      data: {
        enrolled: {
          decrement: student.course.enrolled > 0 ? 1 : 0
        }
      }
    })
  ]);
}

export async function listNotifications() {
  const students = await prisma.student.findMany({
    include: {
      course: true
    },
    orderBy: {
      registeredAt: 'desc'
    }
  });

  return students.slice(0, 8).map((student) => {
    const daysRemaining = getDaysRemaining(student.courseEndAt);

    if (getMembershipStatus(student.courseEndAt) === 'INACTIVE') {
      return {
        id: `completed-${student.id}`,
        title: `${student.fullName}'s course completed`,
        body: `${student.course.name} ended on ${student.courseEndAt.toLocaleDateString('en-IN')}.`,
        tone: 'warning',
        occurredAt: student.courseEndAt
      };
    }

    if (daysRemaining <= 14) {
      return {
        id: `ending-${student.id}`,
        title: `${student.fullName} has ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left`,
        body: `${student.course.name} renews on ${student.courseEndAt.toLocaleDateString('en-IN')}.`,
        tone: 'info',
        occurredAt: student.courseEndAt
      };
    }

    return {
      id: `joined-${student.id}`,
      title: `${student.fullName} joined ${student.course.name}`,
      body: `Registered on ${student.registeredAt.toLocaleDateString('en-IN')} for ${student.course.duration} months.`,
      tone: 'success',
      occurredAt: student.registeredAt
    };
  });
}
