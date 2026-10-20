// Feature page content, carried over from the design canvas (Feature.dc.html).
// PATCH entries override the base entries, exactly as the design merged them.
const D = "Westbrook Middle School demo";
const S = (kind, what) => [kind, "Screenshot: " + what + ", " + D];

const F = {
  fees: {
    name: "Fees and budgets",
    h1: "Know who owes what, without the envelope pile.",
    sub: "Assign fees, take payments straight into your program's account, and see every balance the moment it changes.",
    how: [
      "Assign a fee to one student, an ensemble or the whole program.",
      "Families pay online from their portal, or turn in cash or a check and upload the receipt for you to approve.",
      "Each payment lands on the right balance, and reminders go out on their own."
    ],
    shots: [S("browser", "assign a fee"), S("phone", "parent portal payment"), S("browser", "student balances")],
    get: [
      "A live balance for every student, visible to staff, parents and the student.",
      "Online payment through your program's own Stripe, Square or PayPal account, with Venmo through PayPal.",
      "A review queue for cash, checks and anything paid outside the app, like Venmo, Cash App, Zelle or a ticketing site. Families upload the receipt and you approve it onto the right balance.",
      "Automatic fee reminders and a receipt for every payment.",
      "A Program Store for merch, accessories and required items. A student's order waits for a parent to confirm it before it becomes a fee.",
      "Multiple ledgers for income and expenses, with receipts attached.",
      "Fiscal-year budgets by category, with budget vs. actual as the year goes.",
      "Reports that summarize finances and participation without changing a thing."
    ],
    faq: [
      ["Does Program Partner take a percentage?", "No. Payments go to your program's own processor account. Program Partner charges no payment fees; your processor's standard rates apply."],
      ["What if a family pays a little more than they owe?", "The extra is never quietly turned into credit. It waits where you can see it and decide what to do with it."],
      ["Can our booster treasurer use it without seeing everything else?", "Yes. Staff and booster roles each get their own permissions."]
    ]
  },
  students: {
    name: "Students and families",
    h1: "One roster everyone can trust.",
    sub: "Students, guardians and ensembles on one roster, with portals that answer parents' questions before they reach your inbox.",
    how: [
      "Import your roster from a spreadsheet, or send it to us and we'll do it.",
      "Give each family a private registration code and a printed welcome letter.",
      "Parents and students sign in to see balances, forms and announcements."
    ],
    shots: [S("browser", "student roster"), S("browser", "family welcome letter"), S("phone", "parent portal home")],
    get: [
      "Student profiles with guardians, ensembles, instrument and section.",
      "Private registration codes and branded welcome letters for every family.",
      "A parent portal with balances, forms and announcements for every child they're linked to.",
      "A student portal where students see their own balance, assignments and music.",
      "One workbook import that fills in students, inventory and your music library together.",
      "End-of-year rollover that promotes grades, archives graduates and carries balances forward, with a record of every change.",
      "Recruitment tracking from first contact to enrollment, including a link families can fill out themselves.",
      "Sizes and measurements on each student's profile."
    ],
    faq: [
      ["Who creates parent accounts?", "You do, from inside Program Partner. Families join with the code you give them."],
      ["What happens to a student who leaves?", "Archive them. Their logins close, their history stays, and you can bring them back."],
      ["Does rollover ever delete anyone?", "No. It never deletes a student or erases a balance."]
    ]
  },
  communication: {
    name: "Communication",
    h1: "Messages people actually see.",
    sub: "Announcements by email, direct messages, and one calendar for the whole program.",
    how: [
      "Write it once and choose who it's for: everyone, an ensemble, or a handful of families.",
      "Send it now or schedule it for later.",
      "See who received it and who opened it."
    ],
    shots: [S("browser", "new announcement"), null, S("browser", "announcement delivery tracking")],
    get: [
      "Announcements by email, plus notifications on families' phones.",
      "Direct message threads between staff and families.",
      "Scheduled sends for reminders you want out on Sunday night.",
      "Delivery tracking, so a bounced email doesn't go unnoticed.",
      "One program calendar, with your Google Calendar imported and feeds families can add to their own phones.",
      "Volunteer jobs and shifts with sign-ups and automatic reminders."
    ],
    faq: [
      ["How do I know families actually got it?", "Delivery tracking shows who received each announcement and who opened it, and flags any email that bounced."]
    ]
  },
  forms: {
    name: "Forms and paperwork",
    h1: "Permission slips that chase themselves.",
    sub: "Fillable forms with signatures, reminders that go out on their own, and a clear list of who still hasn't signed.",
    how: [
      "Upload the PDF you already use, start from a template, or build a form from scratch.",
      "Assign it to a student, an ensemble or everyone going on a trip.",
      "Reminders keep going until it's signed, and you see who's done at a glance."
    ],
    shots: [S("browser", "form builder"), S("phone", "parent signing a form"), S("browser", "form completion status")],
    get: [
      "Fillable PDF forms that parents complete and sign on a phone, tablet or computer.",
      "Ready-made templates for common forms, like medical releases and travel forms.",
      "Assignment by student, ensemble or event, with automatic reminders.",
      "An acknowledgements page showing everyone who has, and hasn't, signed the handbook or a policy.",
      "A documents area for handbooks, forms and permission slips, shared with exactly the people who should see them.",
      "Workflow Studio, if you want it, to turn form answers into roster updates and fees. Forms work fine without it."
    ],
    faq: [
      ["Can I keep using my own forms?", "Yes. Upload your PDF and make its fields fillable."],
      ["Who can see a signed form?", "Only staff with access to forms, and the family it belongs to."]
    ]
  },
  events: {
    name: "Events and trips",
    h1: "Know who's ready before the bus leaves.",
    sub: "Event HQ tracks every student's fees, forms and registration for each concert, competition and trip.",
    how: [
      "Create the event and choose who it's for.",
      "Make it required or optional. Families register, pay and sign from their portal.",
      "Event HQ shows who's ready and exactly what everyone else still needs."
    ],
    shots: [S("browser", "new event"), S("phone", "parent event registration"), S("tablet", "Event HQ readiness")],
    get: [
      "A readiness view for each event: paid, signed and registered, student by student.",
      "Required or optional events, with registration deadlines.",
      "Chaperone signup for parents, with your approval.",
      "Trips with traveler rosters, payment packages and installment due dates.",
      "Charges for adults who travel, without creating fake student records.",
      "Event reminders that go out on their own.",
      "The Attention Center: one list of everything across the program that needs your follow-up."
    ],
    faq: [
      ["Can families pay for a trip in installments?", "Yes. Each package has its own schedule, and every installment shows up on the family's balance."],
      ["What if the trip price changes?", "Create a new version of the package. You see each traveler's old and new totals before anything changes."]
    ]
  },
  inventory: {
    name: "Inventory and uniforms",
    h1: "Know where every instrument is.",
    sub: "Instruments, equipment and uniforms with who has them, what shape they're in and what they're worth, so the year-end count isn't a scavenger hunt.",
    how: [
      "Add your inventory, or send us your spreadsheet.",
      "Check items out to students, with a signed equipment agreement on file.",
      "Track condition, repairs and value through the year."
    ],
    shots: [S("browser", "instrument inventory"), S("tablet", "instrument check-out"), null],
    get: [
      "Instruments and equipment with serial numbers, barcodes, condition and value.",
      "Check-out and return, with signed equipment agreements saved as PDFs.",
      "Repair tracking, and damage cases with letters to families when something comes back broken.",
      "A uniform catalog with condition, cost and who has each piece.",
      "Fitting day: enter sizes for a whole ensemble in one fast grid.",
      "Vendor size charts that suggest the right size from a student's measurements."
    ],
    faq: [
      ["Can I bring in my current spreadsheet?", "Yes. Import it yourself, or we'll do it as part of setup."],
      ["Can I hand the principal an inventory report?", "Yes. Reports has an inventory summary, including items in repair and overdue check-outs, that you can print."]
    ]
  },
  library: {
    name: "Music library",
    h1: "Your library, finally searchable.",
    sub: "Repertoire, scores and part assignments, searchable, with digital parts and practice recordings for students if you want them.",
    how: [
      "Import your catalog from a spreadsheet, or we'll do it.",
      "Assign parts to students and track what's checked out.",
      "If you choose, share PDF parts and practice recordings with the students playing each piece."
    ],
    shots: [S("browser", "music library catalog"), null, S("tablet", "student digital part")],
    get: [
      "A searchable catalog of your repertoire and scores.",
      "Part assignments and music check-outs by student.",
      "Digital parts, scores and practice recordings, shared with the students who have each piece or with everyone.",
      "Recordings that play inside Program Partner rather than as files passed around."
    ],
    faq: [
      ["Do I have to use digital parts?", "No. They stay off until you turn them on."],
      ["Who can hear a recording?", "Only the students you share it with."]
    ]
  },
  seating: {
    name: "Seating charts",
    h1: "Seating charts for class and concert.",
    sub: "Seat each class from its rankings, then build concert charts that combine ensembles or hand-picked students.",
    how: [
      "Seat a class from its Skill Pathways rankings.",
      "Build a concert chart: pull in whole ensembles, or pick students one by one.",
      "Drag students into chairs. Drop one on an occupied chair and the two swap."
    ],
    shots: [S("browser", "class seating from rankings"), null, S("tablet", "concert seating chart")],
    get: [
      "Class seating and rankings that stay with the class.",
      "Named charts you can keep and reuse.",
      "Concert charts that combine ensembles or any students you choose, kept separate from class seating.",
      "Riser planning that places singers by height from their measurements, with your pins kept in place.",
      "Shared concert seating: one room setup for up to four performances in a single concert.",
      "Instrument areas, standing players and an unassigned list, so nobody gets lost between charts."
    ],
    faq: [
      ["Will a concert chart change my class seating?", "No. Concert charts are separate."],
      ["Can several groups share one stage setup for a concert?", "Yes. Shared concert seating keeps one room for up to four performances."]
    ]
  },
  teaching: {
    name: "Teaching tools",
    h1: "Teaching tools that speak your program's language.",
    sub: "Skill Pathways, practice logs, curriculum, quizzes and attendance, renamed to match the words your students already use.",
    how: [
      "Set up your levels and skills, and call them whatever your program calls them.",
      "Students submit recordings and practice logs from their phones.",
      "You grade, give feedback and see progress across the whole program."
    ],
    shots: [S("browser", "Skill Pathways setup"), S("phone", "student recording submission"), S("tablet", "program progress")],
    get: [
      "Skill Pathways: leveled skills, video and audio submissions, pass or try-again grading, and a Quick Skill Check for in-person passes.",
      "Your own names for the program, levels and skills.",
      "Practice Studio: practice logs, reflections, weekly expectations, recordings and director feedback, with optional parent sign-off.",
      "A Curriculum Center for lessons, warm-ups, rubrics, rehearsal plans and sub plans.",
      "Quizzes with scores and review.",
      "Attendance for rehearsals, lessons and events, with parent absence requests and participation grades.",
      "Thespian Points for theatre troupes, with progress toward induction.",
      "A behavior log, only where your district allows it, with guardians notified by email."
    ],
    faq: [
      ["We already have our own belt system. Can we keep the names?", "Yes. Rename the program, the levels and the skills."],
      ["Do I have to use all of this?", "No. Each tool turns on or off for your program."]
    ]
  }
};

const PATCH = {
  fees: {
    get: [
      "Every student has a live balance that staff, parents and the student can all see. Families pay online through your program's own Stripe, Square or PayPal account, with Venmo through PayPal.",
      "Cash, checks and anything paid outside the app, like Venmo, Cash App, Zelle or a ticketing site, go to a review queue. Families upload the receipt and you approve it onto the right balance.",
      "Fee reminders go out on their own, and every payment gets a receipt."
    ],
    cta: "Bring your fee spreadsheet. We'll show you it here."
  },
  students: {
    get: [
      "Each student profile holds guardians, ensembles, instrument and section. Every family gets a private registration code and a welcome letter.",
      "Parents see balances, forms and announcements for every child they're linked to. Students see their own balance, assignments and music.",
      "At the end of the year, rollover promotes grades, archives graduates and carries balances forward, with a record of every change."
    ],
    cta: "Send us your roster and watch it get set up.",
    how: [
      "Import your roster from a spreadsheet, or send it to us and we'll do it.",
      "Give each family a private registration code. Parents and students sign in to see balances, forms and announcements."
    ],
    shots: [S("browser", "student roster"), S("phone", "parent portal home")]
  },
  communication: {
    get: [
      "Announcements go out by email, with notifications on families' phones, and you can schedule them for Sunday night. Delivery tracking means a bounced email doesn't go unnoticed.",
      "Direct messages keep staff and family conversations in threads. One program calendar imports your Google Calendar and gives families feeds they can add to their own phones."
    ],
    cta: "See what your families would actually receive.",
    how: [
      "Write it once and choose who it's for: everyone, an ensemble or a handful of families. Send it now or schedule it for later.",
      "See who received it and who opened it."
    ],
    shots: [S("browser", "new announcement"), S("browser", "announcement delivery tracking")]
  },
  forms: {
    get: [
      "Parents fill out and sign PDF forms from their portal. Start from your own PDF or a ready-made template for medical releases and travel forms.",
      "Assign a form to a student, an ensemble or an event, and reminders keep going until it's signed. The acknowledgements page shows everyone who has, and hasn't, signed the handbook or a policy."
    ],
    cta: "Bring the permission slip you used last year."
  },
  events: {
    get: [
      "Each event has a readiness view showing who has paid, signed and registered, student by student. Make it required or optional, with a registration deadline.",
      "Trips get traveler rosters, payment packages and installment due dates. Parents can sign up to chaperone, with your approval."
    ],
    cta: "Bring your next trip. We'll set it up with you.",
    h1: "Every student ready before the bus leaves."
  },
  inventory: {
    get: [
      "Every instrument and piece of equipment has its serial number, barcode, condition and value. Check-outs come with a signed equipment agreement saved as a PDF.",
      "Repairs are tracked, and when something comes back broken you can open a damage case and send a letter to the family. Uniforms get their own catalog with condition, cost and who has each piece."
    ],
    cta: "Bring us your instrument spreadsheet.",
    h1: "The year-end instrument count, without the scavenger hunt."
  },
  library: {
    get: [
      "Your repertoire and scores are searchable, with part assignments and check-outs by student.",
      "If you turn them on, digital parts, scores and practice recordings are shared with the students who have each piece. Recordings play inside Program Partner instead of as files passed around."
    ],
    cta: "Bring your library catalog, however messy it is.",
    how: [
      "Import your catalog from a spreadsheet, or we'll do it. Then assign parts to students and track what's checked out.",
      "If you choose, share PDF parts and practice recordings with the students playing each piece."
    ],
    shots: [S("browser", "music library catalog"), S("tablet", "student digital part")]
  },
  seating: {
    get: [
      "Class seating and rankings stay with the class. Concert charts combine ensembles or any students you choose, and they're kept separate from class seating.",
      "Riser planning places singers by height from their measurements and keeps your pins in place. Shared concert seating holds one room setup for up to four performances in a single concert."
    ],
    cta: "Bring this year's seating chart.",
    h1: "Seat the class from rankings. Seat the concert from everyone."
  },
  teaching: {
    get: [
      "Skill Pathways gives students leveled skills to pass with video or audio submissions, graded pass or try again, plus a Quick Skill Check for in-person passes. Rename the program, levels and skills to match your own.",
      "Practice Studio collects practice logs, reflections and recordings, with your feedback and optional parent sign-off. Attendance covers rehearsals, lessons and events, with parent absence requests."
    ],
    cta: "Show us how your students level up.",
    how: [
      "Set up your levels and skills, and call them whatever your program calls them.",
      "Students submit recordings and practice logs from their phones.",
      "You grade, give feedback and see progress across the whole program.",
      "Their rankings can set the class seating chart."
    ],
    shots: [S("browser", "Skill Pathways setup"), S("phone", "student recording submission"), S("browser", "reviewing a submission and passing it"), S("browser", "class seating from rankings")]
  }
};

const PHONE = {
  fees: "parent portal payment", students: "parent portal home", communication: "parent announcements on a phone",
  forms: "parent signing a form", events: "parent event registration", inventory: "student instrument check-out",
  library: "student digital part", seating: "student practice recording", teaching: "student Skill Pathways submission"
};

export default Object.keys(F).map((key) => {
  const d = { ...F[key], ...PATCH[key] };
  const steps = d.how.map((body, i) => {
    const s = d.shots[i];
    return s ? { body, kind: s[0], caption: s[1], slot: key + "-how-" + i } : { body };
  });
  return {
    key,
    name: d.name, h1: d.h1, sub: d.sub, get: d.get, cta: d.cta,
    faq: d.faq.map(([q, a]) => ({ q, a })),
    steps,
    getPhone: "Screenshot: " + PHONE[key] + ", " + D,
    isFees: key === "fees",
    isSeating: key === "seating"
  };
});
