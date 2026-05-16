// Convert a Neo4j temporal value to a correct ISO-8601 UTC string.
//
// Bug this fixes: the old code did
//   new Date(year, month-1, day, hour, ...).toISOString()
// new Date(...) with numeric args interprets them as LOCAL time, so
// toISOString() then shifted every timestamp by the server's UTC offset
// (e.g. ~5.5h on IST machines). Here we treat the stored components as
// wall-clock at their own timezone offset and build the real UTC instant.

const num = (v) =>
  v && typeof v === "object" && "low" in v ? v.low : Number(v);

function toIsoString(t) {
  if (!t) return new Date().toISOString();

  // Already a string / Date / epoch
  if (typeof t !== "object" || t instanceof Date) {
    const d = new Date(t);
    return isNaN(d) ? new Date().toISOString() : d.toISOString();
  }

  // Neo4j DateTime / LocalDateTime structural object
  if (t.year === undefined) {
    const d = new Date(t.toString());
    return isNaN(d) ? new Date().toISOString() : d.toISOString();
  }

  const offsetSec = t.timeZoneOffsetSeconds ? num(t.timeZoneOffsetSeconds) : 0;
  const ms =
    Date.UTC(
      num(t.year),
      num(t.month) - 1,
      num(t.day),
      num(t.hour) || 0,
      num(t.minute) || 0,
      num(t.second) || 0,
      Math.floor((num(t.nanosecond) || 0) / 1e6)
    ) -
    offsetSec * 1000;

  return new Date(ms).toISOString();
}

module.exports = { toIsoString };
