// 北京思道浸信会 2026-2027 第七届门徒训练班课程大纲
// 每周六下午 2:00-5:00

export interface ScheduleEntry {
  date: string     // YYYY-MM-DD
  lessonId: number
  topic: string    // 大纲课题名
}

export const SCHEDULE: ScheduleEntry[] = [
  { date: '2026-06-13', lessonId: 1,  topic: '门徒造就' },
  { date: '2026-06-27', lessonId: 2,  topic: '成为门徒' },
  { date: '2026-07-04', lessonId: 3,  topic: '灵修时间' },
  { date: '2026-07-11', lessonId: 4,  topic: '研读圣经' },
  { date: '2026-07-18', lessonId: 5,  topic: '祷告生活' },
  { date: '2026-07-25', lessonId: 6,  topic: '敬拜赞美' },
  { date: '2026-08-08', lessonId: 7,  topic: '三一真神' },
  { date: '2026-08-15', lessonId: 8,  topic: '神的形象' },
  { date: '2026-08-22', lessonId: 9,  topic: '罪与审判' },
  { date: '2026-09-05', lessonId: 10, topic: '恩典为王' },
  { date: '2026-09-12', lessonId: 11, topic: '救赎大能' },
  { date: '2026-09-19', lessonId: 12, topic: '因信称义' },
  { date: '2026-10-17', lessonId: 13, topic: '儿女名份' },
  { date: '2026-11-07', lessonId: 14, topic: '圣灵充满' },
  { date: '2026-11-14', lessonId: 15, topic: '圣灵果子' },
  { date: '2026-11-21', lessonId: 16, topic: '信靠为基' },
  { date: '2026-11-28', lessonId: 17, topic: '爱联全德' },
  { date: '2026-12-05', lessonId: 18, topic: '公义为冕' },
  { date: '2027-01-09', lessonId: 19, topic: '活为见证' },
  { date: '2027-02-20', lessonId: 20, topic: '教会为母' },
  { date: '2027-02-27', lessonId: 21, topic: '服事恩赐' },
  { date: '2027-03-06', lessonId: 22, topic: '属灵争战' },
  { date: '2027-03-13', lessonId: 23, topic: '与神同行' },
  { date: '2027-03-20', lessonId: 24, topic: '与人分享' },
  { date: '2027-03-27', lessonId: 25, topic: '奉献生活' },
]

/**
 * 返回「本周经文」的课次 ID。
 * 逻辑：优先找本周（周一—周日）内有上课的一节；
 * 若本周无课，取已过的最近一节；
 * 课程尚未开始则取第一节。
 */
export function getWeekLessonId(): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 寻找今天及以后首个上课的大纲条目
  const upcoming = SCHEDULE.find(entry => {
    const d = new Date(entry.date)
    return d >= today
  })

  if (upcoming) {
    return upcoming.lessonId
  }

  // 若所有课程均已结束，则返回最后一节课
  return SCHEDULE[SCHEDULE.length - 1].lessonId
}

/** 返回指定课次对应的大纲条目 */
export function getScheduleEntry(lessonId: number): ScheduleEntry | undefined {
  return SCHEDULE.find(e => e.lessonId === lessonId)
}
