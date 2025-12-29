export const statusOverview = (resultToday, resultYes) => {
  let status = "increase" | "decrease" | "no_change";
  let percent = 0;
  const diff = resultToday - resultYes;
  if (resultToday === 0 && resultYes === 0)
    return { status: "no_change", percent: 0 };
  if (resultToday !== 0 && resultYes === 0)
    return { status: "increase", percent: 100 };
  percent = (Math.abs(resultToday - resultYes) / resultYes) * 100;
  status = diff > 0 ? "increase" : diff < 0 ? "decrease" : "no_change";
  return { status, percent };
};
