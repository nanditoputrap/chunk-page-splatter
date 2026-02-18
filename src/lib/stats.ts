import { Submission, generateDateRange } from '@/lib/constants';
import { formatLocalYmd } from '@/lib/date';

export const getStats = (studentName: string, className: string, submissions: Submission[], classId?: string) => {
  let totalScore = 0;
  let totalMaxScore = 0;
  let haidDaysCount = 0;
  const counts = { puasa: 0, sholat: 0, tarawih: 0, rawatibDays: 0, tilawah: 0, dzikir: 0, dhuha: 0, tahajjud: 0, birrul: 0, ceramah: 0, takjil: 0, sedekah: 0 };
  const dateRange = generateDateRange();

  dateRange.forEach(date => {
    const dateStr = formatLocalYmd(date);
    const sub = submissions.find((s) => {
      const sameClass = classId ? (s.classId ? s.classId === classId : s.className === className) : s.className === className;
      return s.studentName === studentName && sameClass && s.date === dateStr;
    });

    if (sub) {
      if (sub.isHaid) {
        haidDaysCount++;
        totalMaxScore += 5;
        if (sub.dzikir) { totalScore++; counts.dzikir++; }
        if (sub.birrul) { totalScore++; counts.birrul++; }
        if (sub.ceramah) { totalScore++; counts.ceramah++; }
        if (sub.takjil) { totalScore++; counts.takjil++; }
        if (sub.sedekah) { totalScore++; counts.sedekah++; }
      } else {
        totalMaxScore += 12;
        if (sub.puasa === 'Ya') { totalScore++; counts.puasa++; }
        // Monthly recap: count 1 point if at least one wajib prayer is checked that day.
        if (Object.values(sub.sholatWajib).some(Boolean)) { totalScore++; counts.sholat++; }
        if (sub.tarawih) { totalScore++; counts.tarawih++; }
        if (parseInt(String(sub.rawatib)) > 0) { totalScore++; counts.rawatibDays++; }
        if (sub.tilawahQuran || sub.tilawahJilid) { totalScore++; counts.tilawah++; }
        if (sub.dzikir) { totalScore++; counts.dzikir++; }
        if (sub.dhuha) { totalScore++; counts.dhuha++; }
        if (sub.tahajjud) { totalScore++; counts.tahajjud++; }
        if (sub.birrul) { totalScore++; counts.birrul++; }
        if (sub.ceramah) { totalScore++; counts.ceramah++; }
        if (sub.takjil) { totalScore++; counts.takjil++; }
        if (sub.sedekah) { totalScore++; counts.sedekah++; }
      }
    } else {
      totalMaxScore += 12;
    }
  });

  const percentage = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;
  return { ...counts, rawatib: counts.rawatibDays, haid: haidDaysCount, percentage };
};
