# Module: booking-calendar

Multi-step booking wizard. 4 steps: service → date+time → details → confirmation. Drops into the existing `contact.html` (or any page) where the basic contact form would otherwise sit.

## What it adds

- **Step bar** with progress indicator (active / done states)
- **Service picker** — card grid; one selectable, durations shown
- **Calendar** — month grid with prev/next navigation, past days greyed, closed days struck-through (Sundays by default)
- **Time slot grid** — 30-minute slots between configurable open/close hours, booked slots disabled
- **Details form** — first/last name, email, phone, notes; live summary panel showing the selected service / date / time
- **Confirmation panel** — tick + summary on success

## Dependencies

- **`backend-api`** — to actually persist bookings. The form POSTs to `/api/bookings`. Without it the calendar still functions in the browser but submissions go nowhere. **Pull in `backend-api` first.**

## Files to copy

```
modules/booking-calendar/snippet.html             →  paste into contact.html (replace the existing contact-form-wrap section)
modules/booking-calendar/booking-calendar.css     →  append to shared.css
modules/booking-calendar/booking-calendar.js      →  append to shared.js
```

## Customization

In `booking-calendar.js` at the top:

```js
const SERVICES = [
  { id: 'consult',    name: 'Consultation',    desc: 'First-visit chat and assessment.', duration: 30 },
  { id: 'standard',   name: 'Standard visit',  desc: 'Routine appointment.',             duration: 60 },
  { id: 'extended',   name: 'Extended visit',  desc: 'Complex case or treatment plan.',  duration: 90 },
];
const OPEN_HOUR  = 9;     // 24h
const CLOSE_HOUR = 17.5;  // half = 17:30
const SLOT_MIN   = 30;    // minutes per slot
const CLOSED_DOW = [0];   // 0 = Sunday
```

For the dental-style 6-service set with named openings per weekday, see `demo-site/demo-contact.html` and adapt — the structure here is the same; the data layout differs.

## Integration checklist

- [ ] `backend-api` deployed and reachable at `/api/bookings`
- [ ] `SERVICES` and hours customized for the brand
- [ ] Page-specific stylesheet imports `booking-calendar.css` (or appended to `shared.css`)
- [ ] `booking-calendar.js` loaded (or appended to `shared.js`)
- [ ] Confirmation copy in `snippet.html` matches the brand's tone
- [ ] (Optional) Send-notification env vars set on backend (`SMTP_*`) so staff get an email on each booking
