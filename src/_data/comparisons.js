// Comparison pages (/compare/<key>/). Every claim about another product comes
// from that product's own website on the date in `checked`, with the pages
// listed in `sources`. Re-check before changing anything here: their features
// and prices change, and a stale comparison is worse than none.

const checked = "October 23, 2026";

const cuttimeSources = [
  ["CutTime FAQs", "https://gocuttime.com/faqs"],
  ["CutTime features", "https://gocuttime.com/features"],
  ["CutTime financials", "https://gocuttime.com/features/fine-arts-financials"],
  ["CutTime on Conn-Selmer's site", "https://connselmer.com/education/cuttime"],
];

// Rows shared by both pages: [topic, Program Partner, CutTime].
const rows = [
  [
    "Who it's for",
    "Band, orchestra, choir and theatre programs, booster clubs and private studios. Built by a working band director.",
    "School music and fine arts programs and districts. Built by former educators and administrators.",
  ],
  [
    "Pricing",
    "Quoted for each program, with parent and student portals at no cost to families.",
    "A subscription quoted by sales, with volume discounts for qualifying districts. Conn-Selmer lists its inventory tools as a $395-a-year value.",
  ],
  [
    "Family payments",
    "Families pay into your program's own processor account. Program Partner adds no fee; your processor's standard rates apply.",
    "Stripe Connect or Vanco. CutTime's FAQ lists a 3.5% convenience fee on each online payment, added to what the family pays.",
  ],
  [
    "Communication",
    "Email announcements, direct messages, and one calendar that imports your Google Calendar and gives families feeds for their phones.",
    "Email and text (SMS) announcements to groups, calendars, and reminders for overdue signatures and forms.",
  ],
  [
    "Forms and signatures",
    "Fillable forms with signatures, reminders that go out on their own, and a list of who hasn't signed.",
    "Signature requests for handbooks and permission slips, and custom fillable forms with exports.",
  ],
  [
    "Events and trips",
    "Event HQ tracks each student's fees, forms and registration for every event. Trips get traveler rosters, payment packages and installment due dates.",
    "Events on public and district calendars, with ticket sales through Simple Raise. Its features pages don't describe trip rosters or packages.",
  ],
  [
    "Inventory and uniforms",
    "Instruments, equipment and uniforms, with who has them, what shape they're in and what they're worth.",
    "Barcode and QR scanning, assignments of instruments, attire and library items, inspections, repairs, transfers and depreciation.",
  ],
  [
    "Music library",
    "Searchable repertoire, scores and part assignments, with digital parts and practice recordings for students.",
    "Library items can be assigned through inventory. Its features page doesn't describe a separate music library.",
  ],
  [
    "Seating charts",
    "Class seating from rankings, and concert charts that combine ensembles.",
    "Not described on its features pages.",
  ],
  [
    "Teaching tools",
    "Skill Pathways, practice logs, curriculum, quizzes and attendance.",
    "Not described on its features pages.",
  ],
  [
    "Booster finances",
    "Ledgers and budgets your board can see, with the treasurer's report ready before the meeting.",
    "A financial dashboard with costs, payments, member balances and payment reports. Budgets and ledgers aren't described.",
  ],
  [
    "Fundraising",
    "Fees, payments and balances. No separate fundraising platform.",
    "Simple Raise, its sister platform: fundraising campaigns, online stores and event tickets.",
  ],
  [
    "Getting started",
    "We set you up and can import your students, families, inventory and music library for you.",
    "Importers and templates for spreadsheets and other systems, with guidance in its help center.",
  ],
];

const fitCuttime = [
  "You want text messages (SMS) as your main way to reach families. Program Partner sends announcements by email.",
  "You want fundraising campaigns, online stores and event ticket sales built in. CutTime has these through Simple Raise.",
  "Your district wants one system across many schools, with district-wide inventory search and transfers.",
  "Your district already collects payments through Vanco and wants to keep using it.",
];

const differences = [
  [
    "No percentage on what families pay",
    "Families pay into your program's own account, and Program Partner adds nothing on top. CutTime's FAQ lists a 3.5% convenience fee on each online payment.",
  ],
  [
    "The teaching side is built in",
    "Skill Pathways, practice logs, quizzes, attendance and seating charts sit next to the roster, renamed to the words your students already use.",
  ],
  [
    "A real music library",
    "Repertoire, scores and part assignments you can search, with digital parts and practice recordings for students who need them.",
  ],
  [
    "Books your boosters can run",
    "Ledgers and budgets come from the same records families pay into, so the treasurer's report is ready before the meeting.",
  ],
];

export default [
  {
    key: "cuttime",
    name: "CutTime",
    description:
      "How Program Partner compares with CutTime for school music programs: family payments and fees, forms, trips, inventory, music library, seating and teaching tools.",
    sub: "Both run the office side of a school music program. Here's where they differ, in plain terms, so you can pick the one that fits yours.",
    glanceIntro: `What each one does, from Program Partner's own pages and CutTime's public website as of ${checked}.`,
    rows,
    sourceNote: `CutTime details come from its public website, checked ${checked}. Features and prices change, so check with CutTime for the latest. CutTime is a trademark of its owner.`,
    sources: cuttimeSources,
    differences,
    fitIntro: "No tool is right for every program. CutTime may be the better fit if:",
    fit: fitCuttime,
    switching: [
      "Send us your exports or spreadsheets: students, families, inventory and music library. We import them for you and check them with you before your families ever see a portal.",
      "Most programs switch at a natural break, such as summer or between semesters. We'll quote your program and plan the move around your calendar.",
    ],
    faq: [
      { q: "Can you import what we have in CutTime?", a: "Yes. Send us your exports or spreadsheets and we'll bring over your students, families, inventory and music library." },
      { q: "Do families pay a fee to pay online?", a: "Program Partner adds none. Families pay into your program's own processor account at its standard rates." },
      { q: "Can we keep texting families?", a: "Program Partner sends announcements by email and has direct messages in the portal. If texting is how your families expect to hear from you, tell us and we'll talk it through." },
      { q: "What does it cost?", a: "We quote each program to fit its size and the parts it uses. A quote takes one business day." },
    ],
    cta: "See how Program Partner fits your program.",
  },
  {
    key: "charms",
    name: "Charms",
    description:
      "Charms is now part of CutTime. If your program is moving off Charms, here's how Program Partner compares: fees, forms, trips, attendance, music library and booster books.",
    sub: "Charms is now part of CutTime, and Charms programs have been moving there. If you're deciding where your program goes next, here's how Program Partner compares.",
    glanceIntro: `CutTime bought the Charms Office platform from Vanco in July 2023 and has been moving Charms programs onto CutTime. So the comparison that matters now is with CutTime, from Program Partner's own pages and CutTime's public website as of ${checked}.`,
    rows: [
      ...rows.slice(0, 5),
      [
        "Attendance",
        "Built in, next to your roster and seating charts.",
        "When CutTime welcomed Charms customers, it said attendance wasn't planned for CutTime. Its features pages still don't describe it.",
      ],
      [
        "Trips",
        "Traveler rosters, payment packages and installment due dates, on the family's balance.",
        "Its Charms welcome page said trip management would need a separate app.",
      ],
      [
        "Booster books",
        "Ledgers and budgets your board can see.",
        "Its Charms welcome page said ledger accounting would need a separate app.",
      ],
      ...rows.slice(6),
    ].filter((r) => r[0] !== "Booster finances"),
    sourceNote: `CutTime details come from its public website, including the page it wrote for Charms customers, checked ${checked}. Features and prices change, so check with CutTime for the latest. Charms and CutTime are trademarks of their owners.`,
    sources: [
      ["CutTime acquires the Charms Office platform (July 5, 2023)", "https://gocuttime.com/blog/cuttime-acquires-the-charms-office-platform-from-vanco"],
      ["CutTime's page for Charms customers", "https://campaign.gocuttime.com/welcomecharms"],
      ...cuttimeSources,
    ],
    differences: [
      [
        "The Charms features directors relied on",
        "Attendance, trip rosters and payment packages, booster ledgers and a music library are all built in, not moved to a separate app.",
      ],
      ...differences.filter((d) => d[0] !== "Books your boosters can run").slice(0, 3),
    ],
    fitIntro: "If your program is happy with where CutTime is taking Charms, staying may be simplest. CutTime may be the better fit if:",
    fit: fitCuttime,
    switching: [
      "Send us your Charms exports or spreadsheets: students, families, inventory and music library. We import them for you and check them with you first.",
      "If CutTime has already moved your data, send us your CutTime exports instead. Either way, we'll plan the switch around your calendar.",
    ],
    faq: [
      { q: "Is Charms going away?", a: "CutTime bought Charms in July 2023 and has been moving Charms programs onto CutTime. Check with CutTime for your program's timeline." },
      { q: "Can you bring over our Charms data?", a: "Yes. Send us your Charms or CutTime exports, or your spreadsheets, and we'll import your students, families, inventory and music library." },
      { q: "We used Charms for attendance and trips. Does Program Partner do both?", a: "Yes. Attendance sits next to your roster, and trips get traveler rosters, payment packages and installment due dates." },
      { q: "What does it cost?", a: "We quote each program to fit its size and the parts it uses. A quote takes one business day." },
    ],
    cta: "Moving off Charms? Let's plan it together.",
  },
];
