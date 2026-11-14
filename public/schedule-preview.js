let resizeController;

// This imported timetable describes November 2026. Do not roll stale dates forward.
export function upcomingLessons(days, now = new Date()) {
  const local = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Irkutsk', dateStyle: 'short', timeStyle: 'medium', hour12: false
  }).format(now).replace(' ', 'T');
  const lessons = [];
  for (const day of days) {
    const dates = [...day.dates.split('ноября')[0].matchAll(/\b\d{2}\b/g)].map(m => m[0]);
    for (const [when, title, price] of day.events) {
      const time = when.match(/\b\d{2}:\d{2}\b/)?.[0];
      if (!time) continue;
      const specific = when.match(/^(\d{2})\.11\b/);
      for (const date of specific ? [specific[1]] : dates) {
        const key = `2026-11-${date}T${time}:00`;
        if (key >= local) lessons.push({key, date, time, title, price});
      }
    }
  }
  return lessons.sort((a,b) => a.key.localeCompare(b.key)).slice(0,3);
}

export function compactSchedule(section, content) {
  resizeController?.abort();
  resizeController = new AbortController();
  const full = document.createElement('details');
  full.className = 'full-timetable';
  const summary = document.createElement('summary');
  summary.textContent = 'Полное расписание на ноябрь';
  const body = document.createElement('div');
  body.append(...section.childNodes);
  full.append(summary, body);
  const preview = document.createElement('div');
  preview.className = 'upcoming-lessons';
  const heading = document.createElement('h3');
  heading.textContent = 'Ближайшие занятия';
  preview.append(heading);
  const lessons = upcomingLessons(content.novemberSchedule);
  if (!lessons.length) {
    const empty = document.createElement('p');
    empty.textContent = 'Новые даты уточните у мастерской';
    preview.append(empty);
  }
  for (const lesson of lessons) {
    const row = document.createElement('article');
    row.className = 'upcoming-lesson';
    const time = document.createElement('time');
    time.dateTime = lesson.key + '+08:00';
    time.textContent = `${Number(lesson.date)} ноября · ${lesson.time}`;
    const title = document.createElement('h4');
    title.textContent = lesson.title;
    row.append(time, title);
    if (lesson.price) {
      const price = document.createElement('p');
      price.textContent = lesson.price;
      row.append(price);
    }
    preview.append(row);
  }
  const action = document.createElement('a');
  action.className = 'button button-small';
  action.href = '#contacts';
  action.textContent = 'Записаться ↗';
  preview.append(action);
  section.append(preview, full);
  const mobile = matchMedia('(max-width: 620px)');
  full.open = !mobile.matches;
  mobile.addEventListener('change', () => { full.open = !mobile.matches; }, {signal: resizeController.signal});
}
