export function getWeekdayLabel(dateStr) {
  const date = new Date(dateStr);
  const map = [
    "Chủ nhật",
    "Thứ 2",
    "Thứ 3",
    "Thứ 4",
    "Thứ 5",
    "Thứ 6",
    "Thứ 7",
  ];
  const mapName = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

  return { label: map[date.getDay()], name: mapName[date.getDay()] };
}

function formatDDMMYY(dateStr) {
  // dateStr: "2025-12-24"
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y.slice(2)}`;
}

export function buildLast7DaysRevenue(rows) {
  const map = new Map(rows.map((r) => [r.date, r.revenue]));

  const result = [];

  for (let i = 6; i >= 0; i--) {
    // tìm từng ngày của 6 ngày trước
    const d = new Date(); // Ngày hiện tại DD-MM-YYYY
    d.setDate(d.getDate() - i); // i ngày trước là ngày bao nhi | hàm setDate() có nhận số âm
    const dataKey = d.toISOString().slice(0, 10); // Chuyển i ngày trước sang định dạng ngày giờ

    result.push({
      name: getWeekdayLabel(dataKey).name,
      tooltip: dataKey,
      label: getWeekdayLabel(dataKey).label,
      value: Number(map.get(dataKey)) || 0,
    });
  }

  return result;
}

export function buildLast30DaysRevenue(rows) {
  /*
    map [date, revenue]
    result []
    biến đêm = 0
    sumweek = 0 
    lưu lại ngày đầu tiên từ ngày hiện tại trừ đi 26 ngày;
    Duyệt i qua từ 26 ngày đến ngày 0:
      luôn cập nhật ngày cuối cùng trong tuần  

      tìm ngày thứ [ngày hiện tại trừ đi ngày thứ i] -> để lấy key 
      lấy ra revenue của ngày key đó dựa vào MAP đã có
      cộng dồn revenue vào sumweek
      tăng biến điếm

      nếu count === 7:
        thêm vào result ngày đầu tiên và ngày cuối cùng, cùng với sumWeek 

        reset biến đếm = 0
        reset tạo sumWeek = 0,
  */
  const map = new Map(rows.map((r) => [r.date, Number(r.revenue)]));
  const result = [];

  let count = 0;
  let sumWeek = 0;

  const DAYS = 28; // 4 tuần
  const today = new Date();

  let startDate = null;
  let endDate = null;

  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);

    if (count === 0) {
      startDate = key;
    }

    endDate = key;
    sumWeek += map.get(key) ?? 0;
    count++;

    if (count === 7) {
      result.push({
        label: `${formatDDMMYY(startDate)} - ${formatDDMMYY(endDate)}`,
        value: sumWeek,
      });

      // reset tuần
      count = 0;
      sumWeek = 0;
    }
  }

  // tuần cuối (nếu chưa đủ 7 ngày)
  if (count > 0) {
    result.push({
      label: `${formatDDMMYY(startDate)} - ${formatDDMMYY(endDate)}`,
      value: sumWeek,
    });
  }

  return result;
}

// DAYS 7 30 90
export function buildLastNDaysRevenue(rows, DAYS, col) {
  // col là muốn chia bao nhiêu cột
  if (col <= 0 || DAYS <= 0 || col > DAYS) {
    throw new Error("Invalid DAYS or col value");
  }

  const dayOfColumn = Math.ceil(DAYS / col);
  const map = new Map(rows.map((r) => [r.date, Number(r.revenue)]));

  const today = new Date();

  // Tao timeline DAYS ngay lien tuc
  const days = Array.from({ length: DAYS }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (DAYS - 1 - i)); //  tìm ngày thứ i trước đó
    return {
      date: d.toISOString().slice(0, 10),
      value: map.get(d.toISOString().slice(0, 10)) ?? 0,
    };
  });

  // Nhóm khoảng thời gian theo dayOfColumn
  const periods = days.reduce((acc, day, index) => {
    const timeIndex = Math.floor(index / dayOfColumn); // DAYS = 90, dayOfColumn 30 => timeIndex [0, 2] => 90 ngày, mỗi cột 30 ngày thì sẽ có 3 cột vì DAYS = 90 nhưng index -> 89

    if (!acc[timeIndex]) {
      acc[timeIndex] = {
        start: day.date,
        end: day.date,
        revenue: 0,
      };
    }

    acc[timeIndex].end = day.date;
    acc[timeIndex].revenue += day.value;

    return acc;
  }, []);

  return periods.map((p, i) => ({
    name: col === 4 ? `week${i + 1}` : `month${i + 1}`,
    tooltip: `${formatDDMMYY(p.start)} - ${formatDDMMYY(p.end)}`,
    label: `${formatDDMMYY(p.start)} - ${formatDDMMYY(p.end)}`,
    value: p.revenue,
  }));
}
