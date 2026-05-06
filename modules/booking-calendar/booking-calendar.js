/* =====================================================================
   BOOKING CALENDAR — append to shared.js
   Drop the snippet.html block into the page; this script wires it up.
   POSTs to /api/bookings (requires backend-api module).
   ===================================================================== */
(function() {
  if (!document.getElementById('serviceOptions')) return;

  // ── CUSTOMIZE per project ──
  const SERVICES = [
    { id: 'consult',  name: 'Consultation',   desc: 'First-visit chat and assessment.', duration: 30 },
    { id: 'standard', name: 'Standard visit', desc: 'Routine appointment.',             duration: 60 },
    { id: 'extended', name: 'Extended visit', desc: 'Complex case or treatment plan.',  duration: 90 },
  ];
  const OPEN_HOUR  = 9;
  const CLOSE_HOUR = 17.5;
  const SLOT_MIN   = 30;
  const CLOSED_DOW = [0]; // 0 = Sunday
  const BOOKED_TIMES = new Set(); // could be hydrated from /api/bookings/availability

  // ── State ──
  const state = {
    step: 1,
    service: null,
    viewYear: new Date().getFullYear(),
    viewMonth: new Date().getMonth(),
    selectedDate: null, // ISO YYYY-MM-DD
    selectedTime: null, // HH:MM
  };

  // ── Helpers ──
  const $ = (id) => document.getElementById(id);
  const isPast = (d) => { const t=new Date(); t.setHours(0,0,0,0); return d < t; };
  const isClosed = (d) => CLOSED_DOW.includes(d.getDay());
  const fmtDate = (d) => d.toISOString().slice(0,10);
  const dayName = (d) => d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
  const monthName = (y, m) => new Date(y, m, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  // ── Step navigation ──
  function goToStep(n) {
    state.step = n;
    document.querySelectorAll('.booking-step-panel').forEach(p => {
      p.classList.toggle('is-active', Number(p.dataset.step) === n);
    });
    document.querySelectorAll('.booking-step-pill').forEach(p => {
      const s = Number(p.dataset.step);
      p.classList.toggle('is-active', s === n);
      p.classList.toggle('is-done', s < n);
    });
    if (n === 3) renderSummary();
  }
  document.querySelectorAll('[data-back-to]').forEach(b => {
    b.addEventListener('click', () => goToStep(Number(b.dataset.backTo)));
  });

  // ── Step 1: Service ──
  function renderServices() {
    const wrap = $('serviceOptions');
    wrap.innerHTML = '';
    SERVICES.forEach(s => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'service-option';
      b.dataset.id = s.id;
      b.innerHTML = `
        <div class="service-option-name"></div>
        <div class="service-option-desc"></div>
        <div class="service-option-duration"></div>
      `;
      b.querySelector('.service-option-name').textContent = s.name;
      b.querySelector('.service-option-desc').textContent = s.desc;
      b.querySelector('.service-option-duration').textContent = `${s.duration} min`;
      b.addEventListener('click', () => selectService(s.id));
      wrap.appendChild(b);
    });
  }
  function selectService(id) {
    state.service = SERVICES.find(s => s.id === id);
    document.querySelectorAll('.service-option').forEach(o => {
      o.classList.toggle('is-selected', o.dataset.id === id);
    });
    $('serviceNext').disabled = false;
  }
  $('serviceNext').addEventListener('click', () => { renderCalendar(); goToStep(2); });

  // ── Step 2: Calendar ──
  function renderCalendar() {
    const grid = $('calendarGrid');
    grid.innerHTML = '';
    ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].forEach(d => {
      const el = document.createElement('div');
      el.className = 'calendar-dow';
      el.textContent = d;
      grid.appendChild(el);
    });

    const first = new Date(state.viewYear, state.viewMonth, 1);
    const offset = (first.getDay() + 6) % 7; // Mon=0
    const daysInMonth = new Date(state.viewYear, state.viewMonth + 1, 0).getDate();
    const today = new Date(); today.setHours(0,0,0,0);

    for (let i = 0; i < offset; i++) {
      const cell = document.createElement('div');
      cell.className = 'calendar-day is-other-month';
      grid.appendChild(cell);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(state.viewYear, state.viewMonth, d);
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'calendar-day';
      cell.textContent = d;
      if (date.getTime() === today.getTime()) cell.classList.add('is-today');
      if (isPast(date)) cell.classList.add('is-past');
      else if (isClosed(date)) cell.classList.add('is-closed');
      else cell.addEventListener('click', () => selectDate(date, cell));
      if (state.selectedDate === fmtDate(date)) cell.classList.add('is-selected');
      grid.appendChild(cell);
    }

    $('calendarMonth').innerHTML = monthName(state.viewYear, state.viewMonth)
      .replace(/(\w+)\s(\d+)/, '$1 <em>$2</em>');
    const prevDisabled = state.viewYear < today.getFullYear()
      || (state.viewYear === today.getFullYear() && state.viewMonth <= today.getMonth());
    $('calPrev').disabled = prevDisabled;
  }
  function selectDate(date, cell) {
    state.selectedDate = fmtDate(date);
    state.selectedTime = null;
    document.querySelectorAll('.calendar-day').forEach(c => c.classList.remove('is-selected'));
    cell.classList.add('is-selected');
    renderTimeslots(date);
    $('dateTimeNext').disabled = true;
  }
  function renderTimeslots(date) {
    $('timeslotsDayName').textContent = dayName(date);
    $('timeslotsDayMeta').textContent = `${state.service.duration} min · ${state.service.name}`;
    $('timeslotsEmpty').style.display = 'none';
    const grid = $('timeslotsGrid');
    grid.innerHTML = '';
    const slots = [];
    for (let t = OPEN_HOUR * 60; t + state.service.duration <= CLOSE_HOUR * 60; t += SLOT_MIN) {
      const hh = String(Math.floor(t / 60)).padStart(2, '0');
      const mm = String(t % 60).padStart(2, '0');
      slots.push(`${hh}:${mm}`);
    }
    slots.forEach(time => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'timeslot';
      b.textContent = time;
      const key = `${state.selectedDate}T${time}`;
      if (BOOKED_TIMES.has(key)) b.disabled = true;
      else b.addEventListener('click', () => selectTime(time, b));
      grid.appendChild(b);
    });
  }
  function selectTime(time, btn) {
    state.selectedTime = time;
    document.querySelectorAll('.timeslot').forEach(t => t.classList.remove('is-selected'));
    btn.classList.add('is-selected');
    $('dateTimeNext').disabled = false;
  }
  $('calPrev').addEventListener('click', () => { state.viewMonth--; if (state.viewMonth < 0) { state.viewMonth = 11; state.viewYear--; } renderCalendar(); });
  $('calNext').addEventListener('click', () => { state.viewMonth++; if (state.viewMonth > 11) { state.viewMonth = 0; state.viewYear++; } renderCalendar(); });
  $('dateTimeNext').addEventListener('click', () => goToStep(3));

  // ── Step 3: Details ──
  function renderSummary() {
    $('sumService').textContent = state.service.name;
    $('sumDate').textContent = new Date(state.selectedDate + 'T00:00:00').toLocaleDateString(undefined,
      { weekday: 'long', day: 'numeric', month: 'long' });
    $('sumTime').textContent = state.selectedTime;
    $('sumDuration').textContent = `${state.service.duration} min`;
  }
  $('bookingForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = Object.fromEntries(fd.entries());
    payload.service = state.service.id;
    payload.date    = state.selectedDate;
    payload.time    = state.selectedTime;
    try {
      const r = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error('booking failed');
      $('confirmEmail').textContent = payload.email;
      $('confService').textContent = state.service.name;
      $('confDate').textContent = $('sumDate').textContent;
      $('confTime').textContent = state.selectedTime;
      goToStep(4);
    } catch (err) {
      alert('Sorry — something went wrong. Please call us instead.');
    }
  });

  // ── Reset ──
  $('bookAnother').addEventListener('click', () => {
    state.service = null; state.selectedDate = null; state.selectedTime = null;
    document.querySelectorAll('.service-option.is-selected').forEach(o => o.classList.remove('is-selected'));
    $('serviceNext').disabled = true;
    $('bookingForm').reset();
    goToStep(1);
  });

  // ── Boot ──
  renderServices();
})();
