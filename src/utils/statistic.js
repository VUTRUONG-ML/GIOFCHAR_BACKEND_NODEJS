export function getWeekdayLabel(dateStr) {
  const date = new Date(dateStr);
  const map = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

  return map[date.getDay()];
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
      key: dataKey,
      label: getWeekdayLabel(dataKey),
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
