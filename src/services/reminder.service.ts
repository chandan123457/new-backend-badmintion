import { StudentStatus } from '@prisma/client';
import {
  addIndianDays,
  differenceInIndianCalendarDays,
  getIndianDateKey,
  getIndianHourAndMinute,
  hasIndianDatePassed
} from '../lib/date';
import { prisma } from '../lib/prisma';
import { sendMembershipExpirySms } from './sms.service';

const REMINDER_INTERVAL_MS = 15 * 60 * 1000;
const REMINDER_SLOTS_IST = [0, 5, 10, 15, 20];

let schedulerHandle: NodeJS.Timeout | null = null;
let isProcessing = false;

function getReminderSlotIndex(now: Date) {
  const { hour, minute } = getIndianHourAndMinute(now);

  for (let index = REMINDER_SLOTS_IST.length - 1; index >= 0; index -= 1) {
    const slotHour = REMINDER_SLOTS_IST[index];

    if (hour > slotHour || (hour === slotHour && minute >= 0)) {
      return index;
    }
  }

  return -1;
}

async function sendInitialReminder(studentId: string, fullName: string, phoneNumber: string, courseEndAt: Date) {
  await sendMembershipExpirySms({ fullName, phoneNumber, courseEndAt });

  await prisma.student.update({
    where: {
      id: studentId
    },
    data: {
      twoDaysReminderSentAt: new Date()
    }
  });
}

async function sendSlotReminder(
  studentId: string,
  fullName: string,
  phoneNumber: string,
  courseEndAt: Date,
  countField: 'oneDayReminderCount' | 'finalDayReminderCount',
  currentCount: number,
  dueSlotIndex: number
) {
  for (let reminderIndex = currentCount; reminderIndex <= dueSlotIndex; reminderIndex += 1) {
    await sendMembershipExpirySms({ fullName, phoneNumber, courseEndAt });
  }

  await prisma.student.update({
    where: {
      id: studentId
    },
    data: {
      [countField]: dueSlotIndex + 1
    }
  });
}

export async function processMembershipReminders() {
  if (isProcessing) {
    return;
  }

  isProcessing = true;

  try {
    const now = new Date();
    const todayKey = getIndianDateKey(now);
    const currentSlotIndex = getReminderSlotIndex(now);
    const students = await prisma.student.findMany({
      include: {
        course: true
      }
    });

    for (const student of students) {
      try {
        const expiryDateKey = getIndianDateKey(student.courseEndAt);
        const twoDaysBeforeKey = addIndianDays(expiryDateKey, -2);
        const oneDayBeforeKey = addIndianDays(expiryDateKey, -1);
        const hasExpired = hasIndianDatePassed(student.courseEndAt, now);
        const nextStatus = hasExpired ? StudentStatus.INACTIVE : StudentStatus.ACTIVE;

        if (student.status !== nextStatus) {
          await prisma.student.update({
            where: {
              id: student.id
            },
            data: {
              status: nextStatus
            }
          });
        }

        if (todayKey === twoDaysBeforeKey && !student.twoDaysReminderSentAt) {
          await sendInitialReminder(student.id, student.fullName, student.phoneNumber, student.courseEndAt);
          continue;
        }

        if (todayKey === oneDayBeforeKey && currentSlotIndex >= 0 && student.oneDayReminderCount <= currentSlotIndex) {
          await sendSlotReminder(
            student.id,
            student.fullName,
            student.phoneNumber,
            student.courseEndAt,
            'oneDayReminderCount',
            student.oneDayReminderCount,
            currentSlotIndex
          );
          continue;
        }

        if (todayKey === expiryDateKey && currentSlotIndex >= 0 && student.finalDayReminderCount <= currentSlotIndex) {
          await sendSlotReminder(
            student.id,
            student.fullName,
            student.phoneNumber,
            student.courseEndAt,
            'finalDayReminderCount',
            student.finalDayReminderCount,
            currentSlotIndex
          );
        }
      } catch (error) {
        console.error(`Failed to process reminders for student ${student.id}`, error);
      }
    }
  } catch (error) {
    console.error('Failed to process membership reminders', error);
  } finally {
    isProcessing = false;
  }
}

export function startMembershipReminderScheduler() {
  if (schedulerHandle) {
    return schedulerHandle;
  }

  void processMembershipReminders();
  schedulerHandle = setInterval(() => {
    void processMembershipReminders();
  }, REMINDER_INTERVAL_MS);

  return schedulerHandle;
}

export function getMembershipStatus(courseEndAt: Date, referenceDate = new Date()) {
  return hasIndianDatePassed(courseEndAt, referenceDate) ? StudentStatus.INACTIVE : StudentStatus.ACTIVE;
}

export function getDaysRemaining(courseEndAt: Date, referenceDate = new Date()) {
  return Math.max(differenceInIndianCalendarDays(referenceDate, courseEndAt), 0);
}
