# Builds the SmartDine ITEC404 graduation project report as a .docx file
# following the EMU Faculty of Computer and Information Sciences format.

from docx import Document
from docx.shared import Cm, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING, WD_BREAK
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

ASSETS = 'C:/smart_resturant/report_assets/'
OUT_PATH = 'C:/smart_resturant/SmartDine_Graduation_Project_Report.docx'

doc = Document()

# ---------------------------------------------------------------------------
# Page setup & base style
# ---------------------------------------------------------------------------

section = doc.sections[0]
section.left_margin = Cm(2.5)
section.right_margin = Cm(2.0)
section.top_margin = Cm(2.0)
section.bottom_margin = Cm(2.0)

normal = doc.styles['Normal']
normal.font.name = 'Calibri'
normal.font.size = Pt(12)
normal.paragraph_format.line_spacing_rule = WD_LINE_SPACING.MULTIPLE
normal.paragraph_format.line_spacing = 1.5
normal.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
rpr = normal.element.get_or_add_rPr()
rfonts = rpr.find(qn('w:rFonts'))
if rfonts is None:
    rfonts = OxmlElement('w:rFonts')
    rpr.append(rfonts)
rfonts.set(qn('w:ascii'), 'Calibri')
rfonts.set(qn('w:hAnsi'), 'Calibri')
rfonts.set(qn('w:cs'), 'Calibri')


# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------

def body(text, indent=True, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=6):
    p = doc.add_paragraph()
    p.paragraph_format.alignment = align
    p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.MULTIPLE
    p.paragraph_format.line_spacing = 1.5
    p.paragraph_format.space_after = Pt(space_after)
    if indent:
        p.paragraph_format.first_line_indent = Cm(1.0)
    p.add_run(text)
    return p


def bullet(text, level=0):
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.MULTIPLE
    p.paragraph_format.line_spacing = 1.5
    p.paragraph_format.left_indent = Cm(1.0 + 0.6 * level)
    p.add_run(text)
    return p


def chapter_heading(number, title):
    doc.add_page_break()
    p = doc.add_paragraph(style='Heading 1')
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
    p.paragraph_format.space_after = Pt(6)
    r1 = p.add_run(f'CHAPTER {number}')
    r1.bold = True
    r1.font.size = Pt(16)
    r1.font.name = 'Calibri'
    r1.font.color.rgb = RGBColor(0, 0, 0)
    p.add_run().add_break(WD_BREAK.LINE)
    r2 = p.add_run(title.upper())
    r2.bold = True
    r2.font.size = Pt(16)
    r2.font.name = 'Calibri'
    r2.font.color.rgb = RGBColor(0, 0, 0)
    doc.add_paragraph()


def section_heading(title):
    doc.add_page_break()
    p = doc.add_paragraph(style='Heading 1')
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
    p.paragraph_format.space_after = Pt(6)
    r = p.add_run(title.upper())
    r.bold = True
    r.font.size = Pt(16)
    r.font.name = 'Calibri'
    r.font.color.rgb = RGBColor(0, 0, 0)
    doc.add_paragraph()


def heading2(number, title):
    p = doc.add_paragraph(style='Heading 2')
    p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(6)
    r = p.add_run(f'{number} {title}')
    r.bold = True
    r.font.size = Pt(14)
    r.font.name = 'Calibri'
    r.font.color.rgb = RGBColor(0, 0, 0)
    return p


def heading3(number, title):
    p = doc.add_paragraph(style='Heading 3')
    p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
    p.paragraph_format.space_before = Pt(8)
    p.paragraph_format.space_after = Pt(4)
    r = p.add_run(f'{number} {title}')
    r.bold = True
    r.font.size = Pt(12)
    r.font.name = 'Calibri'
    r.font.color.rgb = RGBColor(0, 0, 0)
    return p


def add_figure(image_path, chapter, fig_no, caption, width_cm=15):
    doc.add_picture(ASSETS + image_path, width=Cm(width_cm))
    doc.paragraphs[-1].alignment = WD_ALIGN_PARAGRAPH.CENTER
    cap = doc.add_paragraph()
    cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    cap.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
    cap.paragraph_format.space_after = Pt(12)
    r = cap.add_run(f'Figure {chapter}.{fig_no}: {caption}')
    r.italic = True
    r.font.size = Pt(11)


def add_table(headers, rows, chapter, table_no, caption, col_widths=None):
    t = doc.add_table(rows=1, cols=len(headers))
    t.style = 'Table Grid'
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr = t.rows[0].cells
    for i, h in enumerate(headers):
        p = hdr[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
        run = p.add_run(h)
        run.bold = True
        run.font.size = Pt(10)
        run.font.name = 'Calibri'
        shd = OxmlElement('w:shd')
        shd.set(qn('w:fill'), 'D9E2F3')
        hdr[i]._tc.get_or_add_tcPr().append(shd)
    for row in rows:
        cells = t.add_row().cells
        for i, val in enumerate(row):
            p = cells[i].paragraphs[0]
            p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
            run = p.add_run(str(val))
            run.font.size = Pt(10)
            run.font.name = 'Calibri'
    if col_widths:
        for row in t.rows:
            for i, w in enumerate(col_widths):
                row.cells[i].width = Cm(w)
    cap = doc.add_paragraph()
    cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    cap.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
    cap.paragraph_format.space_before = Pt(4)
    cap.paragraph_format.space_after = Pt(12)
    r = cap.add_run(f'Table {chapter}.{table_no}: {caption}')
    r.italic = True
    r.font.size = Pt(11)


def add_toc():
    paragraph = doc.add_paragraph()
    run = paragraph.add_run()
    fldChar = OxmlElement('w:fldChar')
    fldChar.set(qn('w:fldCharType'), 'begin')
    instrText = OxmlElement('w:instrText')
    instrText.set(qn('xml:space'), 'preserve')
    instrText.text = 'TOC \\o "1-3" \\h \\z \\u'
    fldChar2 = OxmlElement('w:fldChar')
    fldChar2.set(qn('w:fldCharType'), 'separate')
    fldText = OxmlElement('w:t')
    fldText.text = "Right-click here and choose Update Field (or press F9) to generate the table of contents."
    fldChar2.append(fldText)
    fldChar4 = OxmlElement('w:fldChar')
    fldChar4.set(qn('w:fldCharType'), 'end')
    r_element = run._r
    r_element.append(fldChar)
    r_element.append(instrText)
    r_element.append(fldChar2)
    r_element.append(fldChar4)


# ---------------------------------------------------------------------------
# TITLE PAGE
# ---------------------------------------------------------------------------

def centered(text, size, bold=True, space_after=0, space_before=0, italic=False, all_caps=False):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.space_before = Pt(space_before)
    r = p.add_run(text.upper() if all_caps else text)
    r.bold = bold
    r.italic = italic
    r.font.size = Pt(size)
    r.font.name = 'Calibri'
    r.font.color.rgb = RGBColor(0, 0, 0)
    return p


centered('EASTERN MEDITERRANEAN UNIVERSITY', 14, space_before=20, space_after=4)
centered('FACULTY OF COMPUTER AND INFORMATION SCIENCES', 13, space_after=4)
centered('DEPARTMENT OF INFORMATION TECHNOLOGY', 13, space_after=40)

centered('ITEC404 - GRADUATION PROJECT REPORT', 14, space_after=60)

centered('SmartDine', 22, space_after=4)
centered('A Web-Based Smart Restaurant Ordering, Kitchen and Table Management System', 14, bold=False, space_after=80)

centered('Prepared by', 12, bold=False, space_after=2)
centered('<Student ID, Name-Surname>', 13, space_after=40)

centered('Supervised by', 12, bold=False, space_after=2)
centered('<Title, Name SURNAME>', 13, space_after=80)

centered('<Month, Year>', 13, space_after=4)
centered('<20__ - 20__ Fall / Spring Semester>', 13, space_after=0)


# ---------------------------------------------------------------------------
# ACKNOWLEDGMENT
# ---------------------------------------------------------------------------

doc.add_page_break()
p = doc.add_paragraph(style='Heading 1')
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
p.paragraph_format.space_after = Pt(18)
r = p.add_run('ACKNOWLEDGMENT')
r.bold = True
r.font.size = Pt(16)
r.font.name = 'Calibri'
r.font.color.rgb = RGBColor(0, 0, 0)

body(
    "I would like to thank my supervisor for the guidance, patience and constructive feedback "
    "given throughout the development of this project. The weekly discussions about the "
    "database design, the order workflow and the payment confirmation process were the moments "
    "where the project really took shape, and a lot of the decisions described in this report "
    "came directly out of those conversations."
)
body(
    "I am also grateful to the Department of Information Technology at Eastern Mediterranean "
    "University for the technical foundation built throughout the programme, which made it "
    "possible to design, implement and test a system of this size within a single semester."
)
body(
    "Finally, I want to thank my family and friends for their continuous encouragement and "
    "understanding during the long nights spent debugging the order and payment workflows, "
    "and my classmates for the informal testing sessions that helped uncover several issues "
    "before they became real problems."
)


# ---------------------------------------------------------------------------
# TABLE OF CONTENTS
# ---------------------------------------------------------------------------

doc.add_page_break()
p = doc.add_paragraph(style='Heading 1')
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
p.paragraph_format.space_after = Pt(18)
r = p.add_run('TABLE OF CONTENTS')
r.bold = True
r.font.size = Pt(16)
r.font.name = 'Calibri'
r.font.color.rgb = RGBColor(0, 0, 0)

add_toc()

# ---------------------------------------------------------------------------
# CHAPTER 1 - INTRODUCTION
# ---------------------------------------------------------------------------

chapter_heading(1, 'Introduction')

body(
    "Most small and medium-sized restaurants still run on a mixture of paper notepads, verbal "
    "communication between waiters and the kitchen, and a cash register that is only loosely "
    "connected to what is actually happening on the floor. This works, but it does not scale "
    "well: orders get miscommunicated, the kitchen has no idea how many tickets are waiting, "
    "and at the end of the day nobody can say with certainty which payments were collected by "
    "which member of staff. SmartDine was built to address exactly this gap - a single web "
    "application that lets a customer order from their phone, lets the kitchen and waiters see "
    "that order in real time, and lets the cashier and manager verify, report on and audit every "
    "payment that happens in the restaurant."
)

heading2('1.1', 'Objectives of the Project')

body(
    "The main objective of SmartDine is to provide an end-to-end digital workflow that covers "
    "every stage of a restaurant visit, from the moment a guest sits down and scans the QR code "
    "on their table to the moment the bill is settled and the table becomes available again. "
    "More specifically, the project sets out to:"
)
bullet("Provide a mobile-friendly, QR-code based menu and ordering experience for customers, including modifiers, promo codes, favorites and order tracking.")
bullet("Give the kitchen a live queue of confirmed orders with per-item preparation status, so nothing gets forgotten or duplicated.")
bullet("Give waiters a live table map, a feed of guest requests (water, help, the bill, cleaning) and a way to record that a cash payment was physically collected.")
bullet("Give cashiers a single screen to review pending and recent payments, confirm both online and physical payments, and issue refunds with a recorded reason.")
bullet("Give managers and administrators dashboards for sales, staff performance, table occupancy, inventory and system configuration (menu, users, tables, promotions, loyalty rewards).")
bullet("Implement a loyalty points programme that lets customers earn and redeem points for rewards, without allowing the same points to be spent twice in the same order.")
bullet("Support both Turkish Lira and US Dollar so that prices can be displayed in the currency that is most convenient for the customer.")
bullet("Keep every status change, payment confirmation and refund traceable through an audit log.")

heading2('1.2', 'Scope and Constraints')

body("The scope of the first release of SmartDine covers a single restaurant location and includes the following functional areas:")
bullet("Customer-facing ordering: table sessions via QR code, menu browsing by category, cart with modifiers, promo codes, loyalty point redemption, online or pay-after-eating checkout, order tracking, ratings and favorites.")
bullet("Kitchen workflow: a live order queue, per-item status updates (pending, preparing, ready, served) and estimated preparation times.")
bullet("Waiter workflow: table map and status, guest requests, order creation on behalf of a guest, and cash-collection confirmation.")
bullet("Cashier workflow: pending and recent payment views, payment confirmation for both online and physical payments, per-table payment history, receipts and refunds.")
bullet("Manager and admin workflow: sales analytics, staff performance and tip reports, table occupancy, CSV/PDF exports, menu/category/modifier management, user and table management, promo codes, loyalty rewards and an audit log.")
bullet("Supporting features: real-time updates over Socket.IO, web push notifications, shift clock-in/clock-out, table reservations and a basic inventory tracker.")

body("A number of items were deliberately placed outside the scope of this version of the project:")
bullet("Integration with a real payment gateway - card and mobile payments are recorded and confirmed inside the system, but no external processor is called.")
bullet("Support for multiple restaurant branches or franchises.")
bullet("Native mobile applications - the customer, waiter, kitchen, cashier, manager and admin experiences are all delivered through the same responsive web application.")
bullet("Automatic, recipe-based inventory deduction - the inventory module tracks stock levels and low-stock alerts, but does not yet subtract ingredients automatically when an order is placed.")

body(
    "The main constraint that shaped the design is that the system has to be usable from a "
    "shared restaurant tablet as well as a personal phone, while still enforcing strict "
    "role-based access so that, for example, a customer device can never reach the kitchen or "
    "admin endpoints. This pushed the project towards a stateless REST API protected by JSON "
    "Web Tokens, with a relational database that can enforce the business rules (such as one "
    "active session per table) through foreign keys and transactions."
)

heading2('1.3', 'Methodology')

body(
    "SmartDine follows a fairly standard three-tier web architecture: a single-page application "
    "in the browser, a REST and WebSocket API on the server, and a relational database. The "
    "technologies used in each layer are summarised in Table 1.1."
)

heading3('1.3.1', 'Programming Languages and Development Tools')

add_table(
    ['Layer', 'Technology', 'Notes'],
    [
        ['Frontend framework', 'Vue.js 3 (Composition API) with Vite', 'Single-page application, fast dev server and build'],
        ['State management', 'Pinia', 'Stores for authentication, cart, sockets, theme and toasts'],
        ['HTTP client', 'Axios', 'Wraps the REST API with an auth-token interceptor'],
        ['UI / styling', 'Bootstrap 5 and Bootstrap Icons', 'Responsive layout and iconography'],
        ['QR codes', 'qrcode.vue', 'Generates per-table QR codes for session start'],
        ['Backend runtime', 'Node.js with Express 5', 'REST API, middleware and routing'],
        ['Authentication', 'jsonwebtoken and bcryptjs', 'Stateless JWT auth with hashed passwords'],
        ['Real-time layer', 'Socket.IO (server and client)', 'Live order, payment, table and request updates'],
        ['Database driver', 'mysql2 (promise pool)', 'Parameterised queries against MariaDB'],
        ['Validation', 'express-validator', 'Request-level input validation'],
        ['Rate limiting', 'express-rate-limit', 'Protects order creation from abuse'],
        ['Reports', 'pdfkit', 'Server-generated PDF receipts and reports'],
        ['Push notifications', 'web-push', 'Browser push for order-ready alerts'],
        ['Testing', 'Jest and Supertest', 'Automated API-level test suite'],
        ['Database server', 'MariaDB 10.x', 'Relational storage with foreign-key constraints'],
    ],
    1, 1, 'Technologies used in each layer of SmartDine',
    col_widths=[4.5, 5.5, 7.0]
)

heading3('1.3.2', 'System Architecture')

body(
    "The frontend is organised into role-specific page groups (customer, waiter, kitchen, "
    "cashier, manager and admin) that share a common set of Pinia stores and a thin API/socket "
    "service layer. The backend mirrors this with a routes -> controllers -> services structure, "
    "where controllers contain the request handling and validation logic and a small set of "
    "services (such as the order workflow service) encapsulate rules that are shared between "
    "endpoints, for example the allowed order-status transitions. The package diagram in Figure "
    "3.6 (Chapter 3) shows how these layers connect to each other and to the database."
)
body(
    "Two communication channels are used between the client and the server. Regular CRUD "
    "operations - placing an order, confirming a payment, updating the menu - go through the "
    "REST API and are authenticated with a JWT bearer token. State changes that other roles need "
    "to see immediately - a new order arriving in the kitchen, an order becoming ready, a table "
    "becoming available, a guest request being raised - are additionally broadcast over "
    "Socket.IO to the relevant role-based rooms (kitchen, waiter, cashier, manager, admin), so "
    "that dashboards update without the user having to refresh the page."
)

heading3('1.3.3', 'Database Management System')

body(
    "MariaDB was chosen as the database management system because the data model is highly "
    "relational - orders reference tables, sessions, customers and promo codes; order items "
    "reference orders and menu items; payments reference orders and the staff members who "
    "confirmed them. Enforcing these relationships with foreign keys, together with ON DELETE "
    "rules such as CASCADE and SET NULL, removes an entire class of bugs that would otherwise "
    "have to be checked manually in application code. MariaDB is open source, has a small "
    "operational footprint and is fully compatible with the mysql2 driver used by the backend."
)

heading3('1.3.4', 'Hardware and Software Requirements')

body("The system was designed to run on modest hardware, since most restaurants will run it on a single on-site machine or a small cloud instance:")
bullet("Server: any machine capable of running Node.js 20 LTS or newer and a MariaDB 10.x server - in practice this can be a low-cost VPS or a small on-site PC.")
bullet("Client devices: any modern browser (Chrome, Edge, Safari, Firefox) on a phone, tablet or desktop with network access to the server, since the customer, waiter, kitchen, cashier, manager and admin interfaces are all delivered as a responsive web application.")
bullet("Network: a local Wi-Fi network is sufficient for in-restaurant use; an internet connection is only required if customers are expected to order from outside the building or if push notifications are used.")

heading2('1.4', 'Development Plan')

body(
    "The project was developed iteratively over a single semester, with each phase building on "
    "a working version of the previous one so that the application was always in a runnable "
    "state. The approximate plan is summarised in Table 1.2."
)

add_table(
    ['Phase', 'Focus'],
    [
        ['Weeks 1-2', 'Requirements analysis, use-case modelling and design of the relational database schema (19 tables covering users, tables, sessions, menu, orders, payments, loyalty, promotions and more).'],
        ['Week 3', 'Authentication and role-based access control (admin, manager, waiter, kitchen, cashier, customer).'],
        ['Weeks 4-5', 'Menu management and the customer ordering flow: categories, items, modifiers, cart, promo codes.'],
        ['Week 6', 'Kitchen display and the order-status workflow, including per-item status transitions.'],
        ['Week 7', 'Waiter dashboard: table map, table sessions, guest requests and order creation on behalf of guests.'],
        ['Week 8', 'Payment processing, including the two-stage waiter-then-cashier confirmation for pay-after-eating orders, and split payments.'],
        ['Week 9', 'Loyalty points and rewards, including the fix that reserves redeemed points so they cannot be spent twice.'],
        ['Week 10', 'Manager and admin dashboards: sales analytics, staff performance, table occupancy, CSV/PDF export, audit log.'],
        ['Week 11', 'Real-time notifications (Socket.IO and web push), reservations, shift tracking, inventory tracker, and the USD/TRY currency toggle.'],
        ['Week 12', 'End-to-end testing with Jest and Supertest, bug fixing, polishing the UI theme, and writing this report.'],
    ],
    1, 2, 'Development plan for SmartDine',
    col_widths=[3.0, 14.0]
)

heading2('1.5', 'Key Benefits of the Project')

body("Once deployed, SmartDine is expected to bring the following benefits compared with the paper-based process described in Chapter 2:")
bullet("Faster, more accurate ordering - customers enter their own order, including modifiers, which removes a step where mistakes traditionally creep in.")
bullet("Real-time visibility for the kitchen - confirmed orders appear instantly, with a running estimate of preparation time, so nothing is missed during busy periods.")
bullet("Transparent payment handling - every payment is tied to the staff member who collected or confirmed it, and the two-stage waiter/cashier confirmation for pay-after-eating orders removes the ambiguity around who is responsible for cash on the table.")
bullet("Repeat business through loyalty - customers automatically earn points on every order and can redeem them for rewards, with the system preventing the same points from being counted twice.")
bullet("Better decisions for management - sales, staff performance, tips and table occupancy are all available as live dashboards and exportable reports instead of being reconstructed by hand at the end of the day.")
bullet("Lower training overhead - because every role uses the same application with a consistent design, new staff only need to learn the parts of the interface relevant to their role.")


# ---------------------------------------------------------------------------
# CHAPTER 2 - CURRENT SYSTEM
# ---------------------------------------------------------------------------

chapter_heading(2, 'Current System')

heading2('2.1', 'Description of the Current System')

body(
    "The system that SmartDine replaces is the typical manual workflow found in many small and "
    "medium-sized restaurants. A guest sits down, a waiter walks over with a paper notepad or a "
    "printed menu, and the order is written down by hand. The waiter then walks to the kitchen "
    "and either reads the order out loud or hands over the paper ticket. The kitchen prepares "
    "the dishes in the order they receive the tickets, with no central view of how many orders "
    "are outstanding or how long each one has been waiting."
)
body(
    "When the guest is ready to leave, the waiter manually totals the bill (sometimes with the "
    "help of a basic point-of-sale till, sometimes purely by adding up the prices on the order "
    "slip), collects cash or runs a card through a separate terminal, and the table is then "
    "marked as free - often just by visually checking that it has been cleared. Any loyalty "
    "scheme, if one exists at all, is usually a paper stamp card. End-of-day sales, tips and "
    "staff performance figures are reconstructed afterwards from receipts and the till roll."
)

heading2('2.2', 'Problems with the Current System')

body("Several recurring problems motivated this project:")
bullet("Order errors and miscommunication - handwritten orders, especially with modifiers (\"no onions\", \"extra cheese\", \"medium spice\"), are easy to misread or forget to relay to the kitchen.")
bullet("No real-time visibility - the kitchen has no way of knowing how many orders are queued, which ones are urgent, or which table is waiting longest, which makes it hard to prioritise during rush hours.")
bullet("Payment disputes - when a guest pays cash to a waiter who is not the cashier, there is often no record of who collected the money or when, which makes it difficult to reconcile the till at the end of the shift.")
bullet("Slow table turnover - a table is only marked as available once a staff member notices it has been cleared, which can leave tables empty for longer than necessary during busy periods.")
bullet("No loyalty data - without a digital record of what a customer ordered and how much they spent, it is impossible to run a meaningful loyalty programme or to understand which menu items are most popular.")
bullet("Manual, error-prone reporting - sales totals, tip distribution and staff performance have to be reconstructed by hand from paper tickets and till receipts, which is slow and easy to get wrong.")
bullet("Static menus - updating prices, adding seasonal items or marking something as out of stock means reprinting menus, which discourages frequent updates.")

heading2('2.3', 'State of the Art')

body(
    "Digital ordering and restaurant management are not new ideas - commercial products such as "
    "Toast POS, Square for Restaurants and a large number of QR-code menu and ordering apps "
    "already exist and are used by restaurants of all sizes. These systems typically offer menu "
    "management, order taking, payment processing and some level of reporting, and many of them "
    "now include QR-code ordering that lets a guest order directly from their phone."
)
body(
    "However, these products are commercial SaaS platforms: they are usually sold as a monthly "
    "subscription, they are closed source, and customising the workflow to a specific "
    "restaurant's needs (for example, the exact two-stage cash-confirmation process between a "
    "waiter and a cashier, or a bespoke loyalty points formula) is either impossible or requires "
    "an enterprise contract. They are also frequently tied to specific hardware (proprietary "
    "card terminals, printers) which adds to the cost of adoption."
)
body(
    "SmartDine takes the same core idea - QR-based ordering, a live kitchen display, integrated "
    "payments and reporting - but implements it as an open, self-hostable application built on "
    "widely available open-source technologies (Node.js, Vue.js, MariaDB). This keeps the "
    "system affordable for a single independent restaurant while still covering the same "
    "day-to-day workflow as the commercial alternatives, and makes it straightforward to extend "
    "or adapt the business rules - such as the loyalty point calculation or the payment "
    "confirmation flow - directly in the source code."
)


# ---------------------------------------------------------------------------
# CHAPTER 3 - PROPOSED SYSTEM
# ---------------------------------------------------------------------------

chapter_heading(3, 'Proposed System')

heading2('3.1', 'Overview')

body(
    "SmartDine is a single web application that serves six different roles: customer, waiter, "
    "kitchen staff, cashier, manager and administrator. Each role logs in (or, for customers, "
    "starts a table session by scanning a QR code) and is presented with a dashboard that is "
    "tailored to the tasks that role needs to perform. Underneath these dashboards, every "
    "action revolves around three central concepts: a table session (the period during which a "
    "group of guests occupies a table), an order (one or more menu items placed during that "
    "session, with its own status that flows from pending through to completed), and a payment "
    "(which can be settled online before the food arrives or after the meal, and which - for "
    "pay-after-eating orders - goes through a two-stage confirmation by the waiter and then the "
    "cashier). This chapter presents the use-case, sequence, package and class diagrams that "
    "describe how these concepts fit together, followed by the design of the underlying "
    "database."
)

heading2('3.2', 'General Use-Case Diagram')

body(
    "Figure 3.1 shows the general use-case diagram for SmartDine, covering all six actors and "
    "their main interactions with the system. Customers browse the menu, place orders, pay (or "
    "choose to pay after eating), redeem loyalty points, request service and rate their order. "
    "Waiters and kitchen staff share responsibility for getting food from the kitchen to the "
    "table: the kitchen updates preparation status while the waiter views and serves table "
    "orders, makes tables available again, and collects cash payments. Cashiers verify and "
    "confirm payments (including cash collected by waiters) and process refunds. Managers and "
    "administrators both rely on sales and staff reports, while administrators additionally "
    "manage the menu, users, tables and promotions that the rest of the system depends on."
)
add_figure('usecase_general.png', 3, 1, 'General use-case diagram of SmartDine', width_cm=16)

heading2('3.3', 'Partial Use-Case Diagrams')

body(
    "To keep each diagram readable, the general use-case diagram is broken down into three "
    "partial diagrams, one per group of actors."
)

body(
    "Figure 3.2 focuses on the customer. After scanning the table's QR code, a customer can "
    "browse the menu by category, add items and modifiers to a cart, apply a promo code, redeem "
    "loyalty points or a reward, and then either pay online or choose to pay after eating. While "
    "waiting, the customer can track the order, request service, split the bill, rate a "
    "completed order, manage favourites and view their order history."
)
add_figure('usecase_customer.png', 3, 2, 'Partial use-case diagram - Customer', width_cm=13)

body(
    "Figure 3.3 focuses on the waiter and the kitchen staff. The waiter owns the table map: "
    "creating orders for guests who do not want to use their phone, resolving guest requests, "
    "collecting payments, confirming that cash has been collected, marking orders as served and "
    "making a table available once the guests have left. The kitchen staff work from the "
    "confirmed-orders queue, updating each item's status as it moves from pending to preparing "
    "to ready, using the estimated preparation time stored on the menu item."
)
add_figure('usecase_staff.png', 3, 3, 'Partial use-case diagram - Waiter and Kitchen Staff', width_cm=12)

body(
    "Figure 3.4 focuses on the cashier, the manager and the administrator. The cashier reviews "
    "pending payments by table, verifies cash that a waiter has collected, confirms card or "
    "online payments, looks up the payment history for a table, prints receipts and processes "
    "refunds with a recorded reason. The manager reviews sales, staff performance, tips and "
    "table occupancy. The administrator manages the data that the rest of the system relies on: "
    "users and roles, the menu and its categories and modifiers, tables and QR codes, promo "
    "codes and loyalty rewards, the inventory list, and the audit log."
)
add_figure('usecase_management.png', 3, 4, 'Partial use-case diagram - Cashier, Manager and Administrator', width_cm=16)

body(
    "Tables 3.1 to 3.3 give detailed use-case descriptions for three of the most important "
    "scenarios in the system: placing an order, confirming a pay-after-eating payment, and "
    "redeeming loyalty points."
)

add_table(
    ['Field', 'Description'],
    [
        ['Use case', 'UC-01: Place an Order'],
        ['Actor', 'Customer (also usable by a Waiter on behalf of a guest)'],
        ['Description', 'A customer browses the menu, builds a cart with optional modifiers, optionally applies a promo code and/or redeems loyalty points, and submits the order.'],
        ['Preconditions', 'An active table session exists (the table has been scanned via its QR code) and the cart contains at least one available menu item.'],
        ['Main flow', '1. Customer browses categories and adds items (with modifiers) to the cart.\n'
                       '2. Customer optionally enters a promo code, which is validated against promo_codes.\n'
                       '3. Customer optionally chooses to redeem loyalty points for a reward.\n'
                       '4. Customer submits the order; the server validates the reward redemption first and reserves its points.\n'
                       '5. The server computes the order total, applying the promo discount and the loyalty discount (using the reserved points so they cannot also be spent on the points-discount calculation).\n'
                       '6. The order, its items and an initial payment record are inserted, and the order is broadcast to the kitchen and waiter dashboards.'],
        ['Alternative flows', 'If the promo code is invalid or expired, it is rejected and the order total is computed without it.\n'
                               'If an item is out of stock, the order is rejected before it is created.\n'
                               'If the order total after discounts is zero, the order is marked as fully paid by loyalty points/rewards and no online payment step is required.'],
        ['Postconditions', 'A new order exists with status "pending" (or "confirmed" if payment is completed online), the points reserved for the reward have been deducted from the customer\'s balance, and the kitchen and waiter dashboards show the new order in real time.'],
    ],
    3, 1, 'Use-case description for Place an Order',
    col_widths=[3.5, 14.0]
)

add_table(
    ['Field', 'Description'],
    [
        ['Use case', 'UC-02: Confirm a Pay-After-Eating Payment'],
        ['Actor', 'Waiter, Cashier'],
        ['Description', 'For an order where the customer chose to pay after eating, the waiter records that cash (or card) has been physically collected at the table, and the cashier performs the final confirmation that completes the order.'],
        ['Preconditions', 'The order has been served and a payment record exists with payment_timing = "post" and status = "pending".'],
        ['Main flow', '1. The order becomes visible to the cashier as a pending payment once it is marked served.\n'
                       '2. The waiter collects the amount due from the guest and marks the payment as collected; this sets waiter_confirmed_by and waiter_confirmed_at on the payment record.\n'
                       '3. The cashier sees the waiter-confirmed payment in the pending-payments list and verifies the amount.\n'
                       '4. The cashier confirms the payment, which sets cashier_confirmed, confirmed_by and confirmed_at, updates the payment status to "paid", and transitions the order to "completed".\n'
                       '5. The payment now appears in the per-table payment history, with a link to the receipt.'],
        ['Alternative flows', 'If the waiter has already confirmed the payment once, a second waiter confirmation is rejected.\n'
                               'If the bill is split between several guests, each split is tracked as a separate payment row and each must be confirmed individually.'],
        ['Postconditions', 'The payment is marked "paid" with both a waiter and a cashier confirmation recorded, the order status is "completed", and the table can subsequently be made available again.'],
    ],
    3, 2, 'Use-case description for Confirm a Pay-After-Eating Payment',
    col_widths=[3.5, 14.0]
)

add_table(
    ['Field', 'Description'],
    [
        ['Use case', 'UC-03: Redeem Loyalty Points for a Discount'],
        ['Actor', 'Customer'],
        ['Description', 'A customer with enough accumulated loyalty points redeems a loyalty reward (typically a free or discounted menu item) when placing an order.'],
        ['Preconditions', 'The customer (identified by user_id or session_id) has a positive points balance, and the selected reward in loyalty_rewards is active and its points_cost does not exceed the balance.'],
        ['Main flow', '1. The customer opens the rewards list, which shows each reward alongside the current points balance.\n'
                       '2. The customer selects a reward to redeem with the current order.\n'
                       '3. When the order is submitted, the server first validates the redemption and reserves the reward\'s points_cost.\n'
                       '4. The order total is recalculated, applying any additional points-based discount only to the remaining (non-reserved) balance, so the same points cannot be counted twice.\n'
                       '5. A loyalty_points row of type "redeemed" is recorded, reducing the customer\'s balance.'],
        ['Alternative flows', 'If the requested redemption exceeds the available balance, the redemption is rejected and the order proceeds without it.\n'
                               'If the order total becomes zero after the reward and any further points discount, the order is treated as fully paid and skips the online payment step.'],
        ['Postconditions', 'The customer\'s loyalty point balance is reduced by exactly the points spent on the reward (and, if applicable, the additional discount), with no possibility of the same points being deducted twice for a single order.'],
    ],
    3, 3, 'Use-case description for Redeem Loyalty Points for a Discount',
    col_widths=[3.5, 14.0]
)

heading2('3.4', 'Sequence Diagram')

body(
    "Figure 3.5 traces the most important end-to-end flow in the system: a customer placing an "
    "order that uses loyalty points, through to the kitchen preparing it, the waiter serving it, "
    "and finally the two-stage confirmation of a pay-after-eating payment. The Checkout page "
    "sends the order (items, the points the customer wants to use, and any selected reward) to "
    "the order controller, which first calls the loyalty controller to validate the reward and "
    "reserve its points before computing the redemption discount - this ordering is what "
    "prevents the same points from being applied twice. The order, its items and an initial "
    "payment row are then written to the database in a single request, and a 'new-order' event "
    "is broadcast to the kitchen and waiter dashboards over Socket.IO. As the kitchen updates "
    "item statuses, an 'order-ready' event lets the waiter know the food can be served. For a "
    "pay-after-eating order, the waiter's confirmation that cash was collected and the cashier's "
    "final confirmation are each persisted and broadcast separately, so every dashboard reflects "
    "the true state of the payment at all times."
)
add_figure('sequence_order_payment.png', 3, 5, 'Sequence diagram - place order and confirm physical payment', width_cm=16)

heading2('3.5', 'Package Diagram')

body(
    "Figure 3.6 shows how the source code is organised. The frontend is split into page "
    "packages per role (customer, waiter, kitchen, cashier, manager, admin), shared UI "
    "components such as the pending-payments and payment-history panels, Pinia stores for "
    "authentication, cart, sockets, toasts and theme, and a thin services layer (api.js for "
    "REST calls, socket.js for the real-time connection). The backend mirrors this with route "
    "modules, controllers that implement each endpoint, a small services layer for shared "
    "business rules such as order-status transitions and push notifications, and middleware for "
    "authentication and audit logging. The frontend talks to the backend over a JSON REST API; "
    "the backend talks to MariaDB through the mysql2 driver; and a real-time layer built on "
    "Socket.IO lets the backend push live updates back to the frontend whenever the database "
    "changes in a way that another role's dashboard needs to know about."
)
add_figure('package_diagram.png', 3, 6, 'Package diagram of SmartDine', width_cm=15)

heading2('3.6', 'Database Design')

heading3('3.6.1', 'Entity-Relationship Diagram')

body(
    "Figure 3.7 shows the logical entity-relationship diagram for the core part of the SmartDine "
    "schema - the tables that directly support ordering, payment and the loyalty programme. "
    "Cardinalities are shown as min..max pairs next to each end of a relationship (for example "
    "1..* on the side of restaurant_tables and table_sessions means that one table can have many "
    "sessions over time, while each session belongs to exactly one table). The full schema "
    "contains 21 tables in total; the remaining tables (waiter_requests, favorites, ratings, "
    "order_status_history, reservations, audit_log, push_subscriptions, shifts and "
    "inventory_items) are supporting tables that are each linked to one of the core entities "
    "shown here and are summarised in Table 3.4."
)
add_figure('er_diagram.png', 3, 7, 'Logical ER diagram of the core SmartDine schema', width_cm=16)

heading3('3.6.2', 'Relational Schema')

body(
    "Table 3.4 lists every table in the smart_restaurant database, its primary key, its foreign "
    "keys and the purpose it serves. All foreign keys are enforced at the database level, with "
    "ON DELETE CASCADE used where child rows have no meaning without their parent (for example "
    "order_items without their order) and ON DELETE SET NULL used where the parent can be "
    "removed without invalidating the row (for example a payment whose confirming user account "
    "is later deleted)."
)
add_table(
    ['Table', 'Primary Key', 'Foreign Keys', 'Purpose'],
    [
        ['users', 'id', '-', 'Staff and customer accounts, with a role (admin, manager, waiter, kitchen, cashier, customer).'],
        ['restaurant_tables', 'id', 'waiter_id -> users', 'Physical tables, their QR token, capacity, status and assigned waiter.'],
        ['table_sessions', 'id', 'table_id -> restaurant_tables', 'One active period of occupancy for a table, started when the QR code is scanned.'],
        ['menu_categories', 'id', '-', 'Top-level grouping of menu items (e.g. Appetizers, Drinks, Desserts).'],
        ['menu_items', 'id', 'category_id -> menu_categories', 'Dishes and drinks, including price, stock, prep time and dietary tags.'],
        ['menu_item_modifiers', 'id', 'menu_item_id -> menu_items', 'Optional add-ons / variations for a menu item and their price delta.'],
        ['promo_codes', 'id', '-', 'Discount codes with type (percent/fixed), value, usage limits and expiry.'],
        ['orders', 'id', 'table_id -> restaurant_tables, session_id -> table_sessions, customer_id -> users, promo_code_id -> promo_codes', 'One order placed during a session, with status, total and discount.'],
        ['order_items', 'id', 'order_id -> orders, menu_item_id -> menu_items', 'Line items of an order, including quantity, price, modifiers and per-item status.'],
        ['payments', 'id', 'order_id -> orders, confirmed_by/waiter_confirmed_by/refunded_by -> users', 'Payment(s) for an order, including method, status, tips, confirmations and refunds.'],
        ['waiter_requests', 'id', 'table_id -> restaurant_tables', 'Guest-raised requests (help, water, salt, cleaning, complaint) for a table.'],
        ['favorites', 'id', 'menu_item_id -> menu_items', 'Menu items favourited by a customer session.'],
        ['ratings', 'id', 'order_id -> orders, menu_item_id -> menu_items', 'Customer rating and comment for a completed order or item.'],
        ['order_status_history', 'id', 'order_id -> orders', 'Audit trail of every status an order has passed through.'],
        ['reservations', 'id', 'table_id -> restaurant_tables', 'Advance table reservations made by customers.'],
        ['loyalty_points', 'id', 'order_id -> orders, user_id -> users', 'Ledger of points earned or redeemed, tied to an order where applicable.'],
        ['loyalty_rewards', 'id', 'menu_item_id -> menu_items', 'Catalogue of rewards that can be redeemed for points.'],
        ['audit_log', 'id', 'user_id -> users', 'Record of administrative actions (create/update/delete) across the system.'],
        ['push_subscriptions', 'id', 'user_id -> users', 'Web push subscription endpoints for order-ready notifications.'],
        ['shifts', 'id', 'user_id -> users', 'Staff clock-in / clock-out records.'],
        ['inventory_items', 'id', '-', 'Stock items with quantity, minimum threshold, cost and supplier.'],
    ],
    3, 4, 'Relational schema of the smart_restaurant database',
    col_widths=[3.2, 1.7, 5.0, 7.6]
)

heading3('3.6.3', 'Entity Documentation')

body(
    "Table 3.5 documents the purpose of each of the twelve core entities shown in the ER diagram "
    "in Figure 3.7."
)
add_table(
    ['Entity', 'Description'],
    [
        ['users', 'Every person who can act within the system: staff members (admin, manager, waiter, kitchen, cashier) and registered customers. Stores the hashed password and role used for authentication and access control.'],
        ['restaurant_tables', 'Each physical table in the restaurant, identified by a table number and a unique QR token used to start a session. Tracks whether the table is available, occupied or reserved, and which waiter is assigned to it.'],
        ['table_sessions', 'Represents one visit by a group of guests to a table, from the moment the QR code is scanned until the table is freed. All orders placed during a visit are linked to the same session.'],
        ['menu_categories', 'The top-level groups used to organise the menu, such as Appetizers, Main Course or Desserts.'],
        ['menu_items', 'An individual dish or drink, with its price, description, stock level, preparation time and dietary tags (e.g. vegetarian, gluten-free).'],
        ['menu_item_modifiers', 'Optional variations of a menu item (e.g. "extra cheese", "no ice") with their own price adjustment.'],
        ['orders', 'A set of items placed together during a session, with an overall status that progresses from pending to completed, a total, any discount applied, and whether it is paid online or after eating.'],
        ['order_items', 'One line of an order: a specific menu item, quantity, chosen modifiers and its own kitchen status (pending, preparing, ready, served).'],
        ['payments', 'One payment (or one part of a split payment) for an order, including the method, amount, tip, and the confirmation state from both the waiter and the cashier.'],
        ['loyalty_points', 'A ledger entry recording points earned from an order or redeemed against a reward, for a specific customer.'],
        ['loyalty_rewards', 'A reward that can be redeemed for a fixed number of loyalty points, optionally linked to a specific menu item that is given for free.'],
        ['promo_codes', 'A discount code that customers can apply at checkout, with a discount type (percentage or fixed amount), a minimum order value and a usage limit.'],
    ],
    3, 5, 'Entity documentation for the core SmartDine schema',
    col_widths=[4.0, 13.5]
)

heading3('3.6.4', 'Relationship Documentation')

body("Table 3.6 documents the relationships between the core entities and their cardinalities.")
add_table(
    ['Relationship', 'Cardinality', 'Description'],
    [
        ['restaurant_tables - table_sessions', '1 to many', 'A table can have many sessions over its lifetime, but each session belongs to exactly one table.'],
        ['restaurant_tables - users (waiter)', 'many to 1 (optional)', 'A table is optionally assigned to one waiter; a waiter can be assigned to many tables.'],
        ['table_sessions - orders', '1 to many (optional)', 'A session can contain many orders; an order is linked to the session active when it was placed.'],
        ['restaurant_tables - orders', '1 to many', 'Every order is placed against exactly one table.'],
        ['users (customer) - orders', '1 to many (optional)', 'A registered customer can place many orders; guest orders may have no linked user.'],
        ['promo_codes - orders', '1 to many (optional)', 'A promo code can be applied to many orders, but each order uses at most one promo code.'],
        ['orders - order_items', '1 to many', 'Each order consists of one or more order items.'],
        ['menu_items - order_items', '1 to many', 'A menu item can appear in many order items across different orders.'],
        ['menu_categories - menu_items', '1 to many', 'A category groups many menu items.'],
        ['menu_items - menu_item_modifiers', '1 to many', 'A menu item can offer several optional modifiers.'],
        ['orders - payments', '1 to many', 'An order has one payment for a single bill, or several payments when the bill is split.'],
        ['users (staff) - payments', 'many to 1 (optional, x3)', 'A payment may record which staff member confirmed it, which waiter collected it, and which staff member processed a refund.'],
        ['orders - loyalty_points', '1 to many (optional)', 'An order can generate a loyalty_points entry when points are earned or redeemed.'],
        ['users (customer) - loyalty_points', '1 to many (optional)', 'Each loyalty ledger entry belongs to a customer (or an anonymous session).'],
        ['menu_items - loyalty_rewards', '1 to many (optional)', 'A loyalty reward can optionally correspond to a specific free menu item.'],
    ],
    3, 6, 'Relationship documentation for the core SmartDine schema',
    col_widths=[5.0, 3.5, 9.0]
)

heading3('3.6.5', 'Attribute Documentation')

body(
    "A full attribute-level description of every table would run to many pages; Table 3.7 "
    "illustrates the level of documentation produced for each table by focusing on the two "
    "tables that carry the most business logic - orders and payments. The same documentation "
    "approach (attribute name, data type, constraints and description) was applied to every "
    "table in the schema during development; the complete column listing for all 21 tables is "
    "available in the project's database/schema.sql file and is summarised in Appendix A."
)
add_table(
    ['Table', 'Attribute', 'Data Type', 'Constraints', 'Description'],
    [
        ['orders', 'id', 'INT', 'PK, AUTO_INCREMENT', 'Unique identifier of the order.'],
        ['orders', 'table_id', 'INT', 'NOT NULL, FK -> restaurant_tables', 'Table the order was placed at.'],
        ['orders', 'session_id', 'INT', 'FK -> table_sessions', 'Session the order belongs to.'],
        ['orders', 'customer_id', 'INT', 'FK -> users, ON DELETE SET NULL', 'Registered customer who placed the order, if any.'],
        ['orders', 'status', 'ENUM', "DEFAULT 'pending'", 'Lifecycle stage: pending, confirmed, preparing, ready, served, completed or cancelled.'],
        ['orders', 'total', 'DECIMAL(10,2)', "DEFAULT 0.00", 'Final amount due after discounts.'],
        ['orders', 'promo_code_id', 'INT', 'FK -> promo_codes, ON DELETE SET NULL', 'Promo code applied to the order, if any.'],
        ['orders', 'discount_amount', 'DECIMAL(10,2)', "DEFAULT 0.00", 'Total discount applied (promo code plus loyalty points).'],
        ['orders', 'payment_type', 'ENUM', "DEFAULT 'online'", "Whether the order is paid online ('online') or after the meal ('physical')."],
        ['orders', 'estimated_ready_at', 'TIMESTAMP', 'NULL', 'Estimated time the order will be ready, set when confirmed.'],
        ['payments', 'id', 'INT', 'PK, AUTO_INCREMENT', 'Unique identifier of the payment.'],
        ['payments', 'order_id', 'INT', 'NOT NULL, FK -> orders, ON DELETE CASCADE', 'Order this payment belongs to.'],
        ['payments', 'amount', 'DECIMAL(10,2)', 'NOT NULL', 'Amount covered by this payment (or split share).'],
        ['payments', 'method', 'ENUM', "DEFAULT 'card'", "Payment method: card, cash or mobile."],
        ['payments', 'payment_timing', 'ENUM', "DEFAULT 'pre'", "Whether payment happens before ('pre') or after ('post') the meal."],
        ['payments', 'split_type', 'ENUM', "DEFAULT 'full'", "How the bill is divided: full, equal or custom."],
        ['payments', 'status', 'ENUM', "DEFAULT 'pending'", 'Payment status: pending, paid, failed or refunded.'],
        ['payments', 'tip_amount', 'DECIMAL(10,2)', "DEFAULT 0.00", 'Tip amount included with this payment.'],
        ['payments', 'cashier_confirmed', 'TINYINT(1)', "DEFAULT 0", 'Set when the cashier has confirmed the payment.'],
        ['payments', 'confirmed_by', 'INT', 'FK -> users, ON DELETE SET NULL', 'Staff member who confirmed the payment.'],
        ['payments', 'waiter_confirmed_by', 'INT', 'FK -> users, ON DELETE SET NULL', 'Waiter who confirmed cash was collected at the table.'],
        ['payments', 'refund_reason', 'VARCHAR(255)', 'NULL', 'Reason recorded when the payment is refunded.'],
        ['payments', 'refunded_by', 'INT', 'FK -> users, ON DELETE SET NULL', 'Staff member who processed the refund.'],
    ],
    3, 7, 'Attribute documentation for the orders and payments tables',
    col_widths=[2.2, 2.6, 2.3, 4.0, 6.4]
)

heading3('3.6.6', 'Domain Documentation')

body(
    "Table 3.8 documents the enumerated domains (ENUM types) used across the schema to constrain "
    "columns to a fixed set of valid values, which is one of the main ways the database itself "
    "enforces the business rules of the application."
)
add_table(
    ['Domain', 'Used In', 'Allowed Values'],
    [
        ['user_role', 'users.role', 'admin, manager, waiter, kitchen, cashier, customer'],
        ['table_status', 'restaurant_tables.status', 'available, occupied, reserved'],
        ['session_status', 'table_sessions.status', 'active, closed'],
        ['order_status', 'orders.status', 'pending, confirmed, preparing, ready, served, completed, cancelled'],
        ['order_payment_type', 'orders.payment_type', 'online, physical'],
        ['order_item_status', 'order_items.status', 'pending, preparing, ready, served'],
        ['payment_method', 'payments.method', 'card, cash, mobile'],
        ['payment_timing', 'payments.payment_timing', 'pre, post'],
        ['payment_split_type', 'payments.split_type', 'full, equal, custom'],
        ['payment_status', 'payments.status', 'pending, paid, failed, refunded'],
        ['promo_discount_type', 'promo_codes.discount_type', 'percent, fixed'],
        ['loyalty_point_type', 'loyalty_points.type', 'earned, redeemed'],
        ['waiter_request_type', 'waiter_requests.type', 'help, water, salt, cleaning, complaint'],
        ['waiter_request_status', 'waiter_requests.status', 'pending, handled'],
        ['reservation_status', 'reservations.status', 'pending, confirmed, cancelled, completed, no_show'],
    ],
    3, 8, 'Domain documentation - enumerated types used in the schema',
    col_widths=[4.5, 5.0, 8.0]
)

heading3('3.6.7', 'Database Security and Maintenance Plan')

body("Several measures protect the integrity and confidentiality of the data stored by SmartDine:")
bullet("Password security - user passwords are never stored in plain text; they are hashed with bcryptjs before being written to the users table.")
bullet("Authentication and authorisation - every protected endpoint requires a valid JSON Web Token, and role-checking middleware ensures that, for example, only kitchen staff can update an order item's preparation status and only managers/admins can access reporting endpoints.")
bullet("SQL injection prevention - all database access goes through the mysql2 parameterised query API; no user input is concatenated directly into SQL strings.")
bullet("Referential integrity - foreign keys with appropriate ON DELETE behaviour (CASCADE or SET NULL) ensure that, for example, deleting a menu item also removes its modifiers, while deleting a staff account does not delete the payments they once confirmed.")
bullet("Traceability - the audit_log table records who performed administrative actions (creating, updating or deleting users, menu items, categories and so on), and order_status_history records every status change of every order.")
bullet("Rate limiting - the order-creation endpoint is protected by express-rate-limit to prevent a single client from flooding the kitchen with orders.")

body(
    "For ongoing maintenance, the database schema is kept under version control alongside the "
    "application code (database/schema.sql and database/seed.js), so that the schema and the "
    "code that depends on it always evolve together. Regular backups (for example, a scheduled "
    "mysqldump of the smart_restaurant database) are recommended so that order, payment and "
    "loyalty history can be restored in the event of data loss. Because most tables use "
    "AUTO_INCREMENT primary keys and ON UPDATE CURRENT_TIMESTAMP on the orders table, "
    "restoring from a backup and replaying the application's audit log is sufficient to "
    "reconstruct the state of the system."
)

heading2('3.7', 'Design Class Diagram')

body(
    "Figure 3.8 shows a simplified design class diagram for the core domain model. It mirrors "
    "the ER diagram in Figure 3.7 but is expressed in terms of the objects that the backend "
    "controllers and services work with - for example, an Order is associated with many "
    "OrderItem objects and one or more Payment objects, and a User can both place Orders and "
    "confirm Payments. This is the model that the controllers in src/controllers and the shared "
    "logic in src/services operate on when validating a request, computing an order total or "
    "deciding whether a status transition is allowed."
)
add_figure('class_diagram.png', 3, 8, 'Simplified design class diagram', width_cm=16)


# ---------------------------------------------------------------------------
# CHAPTER 4 - SYSTEM TESTING
# ---------------------------------------------------------------------------

chapter_heading(4, 'System Testing')

heading2('4.1', 'Testing Strategy')

body(
    "SmartDine was tested at three levels during development. At the lowest level, the "
    "controllers and services in the backend were exercised through integration tests written "
    "with Jest and Supertest, which send real HTTP requests to the Express application and "
    "check both the HTTP response and the resulting rows in the database. Above that, the "
    "frontend was tested manually by walking through each role's dashboard in the browser - "
    "placing orders as a customer, progressing them through the kitchen and waiter views, and "
    "confirming payments as a cashier - to check that the Socket.IO events kept every dashboard "
    "in sync. Finally, the system as a whole was tested end-to-end by running through complete "
    "user journeys (for example, scanning a QR code, ordering, redeeming loyalty points, and "
    "paying) to confirm that the pieces tested individually also work together correctly."
)

heading2('4.2', 'Test Environment')

body(
    "The backend integration tests run against a dedicated MariaDB database "
    "(smart_restaurant_test), which is created and seeded from the same schema.sql and seed "
    "data used in production, so that the tests run against realistic data rather than an "
    "empty database. The test database is rebuilt by tests/database/init_test_db.js before the "
    "suite runs (Jest's globalSetup), and the suite is executed with --runInBand so that tests "
    "which share state (such as the same seeded order) run in a predictable order rather than "
    "in parallel. Each test file authenticates as the appropriate role (admin, manager, waiter, "
    "kitchen, cashier or customer) using the same /api/auth/login endpoint that the frontend "
    "uses, so the tests exercise the real authentication and role-checking middleware rather "
    "than bypassing it."
)

heading2('4.3', 'Test Suite Summary')

body(
    "The backend test suite contains 74 automated test cases across nine files, summarised in "
    "Table 4.1. All 74 tests pass against the current codebase."
)
add_table(
    ['Test File', 'Tests', 'Area Covered'],
    [
        ['admin.test.js', '12', 'Access control for admin-only routes, dashboard statistics, user management (list/create/update/delete), and menu category management with audit logging.'],
        ['auth.test.js', '6', 'Login with valid/invalid credentials, missing fields, and retrieving/rejecting the authenticated profile.'],
        ['loyalty.test.js', '7', 'Loyalty balance and history lookup, listing rewards, and redemption rules (including rejecting redemptions with no points or that exceed the balance).'],
        ['manager.test.js', '8', 'Access control, dashboard summary, sales analytics, staff performance, tip reports, table occupancy, and CSV export.'],
        ['menu.test.js', '5', 'Listing categories and items with modifiers/dietary tags, grouping items by category, and toggling favorites.'],
        ['orders.test.js', '11', 'Order validation (missing table, invalid table, insufficient stock), and the full order lifecycle from creation through confirmed, preparing, ready, served and completed.'],
        ['payments.test.js', '17', 'Pre-paid card payments with tips and refunds, pay-after-eating orders with waiter/cashier confirmation, and split payments between multiple payers.'],
        ['push.test.js', '7', 'VAPID key exposure, subscribing/unsubscribing devices for push notifications, with and without an authenticated user.'],
        ['rateLimit.test.js', '1', 'Rate limiting of the order-creation endpoint after repeated requests.'],
    ],
    4, 1, 'Backend automated test suite summary',
    col_widths=[3.5, 1.5, 12.5]
)

heading2('4.4', 'Test Cases')

body(
    "Table 4.2 documents a representative sample of test cases, chosen to cover the system's "
    "most important business rules: order validation and lifecycle, the two-stage payment "
    "confirmation, split payments, and the loyalty-points redemption logic that prevents the "
    "same points from being spent twice."
)
add_table(
    ['Test ID', 'Description', 'Input / Steps', 'Expected Result', 'Status'],
    [
        ['TC-01', 'Reject an order placed for a non-existent table', 'POST /api/orders with table_id pointing to a table that does not exist', '400 response with an error message; no order row is created', 'Pass'],
        ['TC-02', 'Reject an order when a menu item has insufficient stock', 'POST /api/orders with a quantity greater than the item\'s available stock', '400 response; order and order_items are not created', 'Pass'],
        ['TC-03', 'Create an order with modifiers and compute the correct total', 'POST /api/orders with two items, one carrying a paid modifier', '201 response; order total equals the sum of item prices, quantities and modifier price deltas', 'Pass'],
        ['TC-04', 'Reject an order status update from a role without permission', 'PATCH the order status as a role that is not allowed to perform that transition (e.g. kitchen marking an order "served")', '403 response; order status is unchanged', 'Pass'],
        ['TC-05', 'Cascade item statuses when an order moves to "preparing"', 'PATCH order status to "preparing" as kitchen staff', '200 response; the order and all of its order_items move to "preparing"', 'Pass'],
        ['TC-06', 'Cascade order to "ready" once the final item is marked ready', 'PATCH the last remaining order_item to "ready"', 'The parent order\'s status automatically becomes "ready"', 'Pass'],
        ['TC-07', 'Process a pre-paid card payment with a tip', 'POST /api/payments/:orderId with method "card", payment_timing "pre" and a tip_amount', '201 response; payment status is "paid"; order status moves to "confirmed"', 'Pass'],
        ['TC-08', 'Reject a second payment for an already-paid order', 'POST a second payment for the same order as TC-07', '400 response; no second payment row is created', 'Pass'],
        ['TC-09', 'Refund a paid payment with a valid reason', 'POST /api/payments/:id/refund with a non-empty reason', '200 response; payment status becomes "refunded" with refund_reason and refunded_by recorded', 'Pass'],
        ['TC-10', 'Reject refunding a payment that was already refunded', 'Repeat TC-09 for the same payment', '400 response; payment remains "refunded" with its original refund details', 'Pass'],
        ['TC-11', 'Waiter confirms cash collected for a pay-after-eating order', 'POST /api/payments/confirm/:payment_id as the waiter, before the order is served', '200 response; waiter_confirmed_by and waiter_confirmed_at are set; payment status remains "pending" until the cashier confirms', 'Pass'],
        ['TC-12', 'Reject a second waiter confirmation for the same payment', 'Repeat TC-11 for the same payment', '400 response; the original waiter confirmation is unchanged', 'Pass'],
        ['TC-13', 'Cashier finalises a pay-after-eating payment', 'POST /api/payments/confirm/:payment_id as the cashier, after the waiter has confirmed', '200 response; payment status becomes "paid"; order status becomes "completed"', 'Pass'],
        ['TC-14', 'Split a bill between two payers with one paying later', 'POST /api/payments/:orderId/split with two shares that sum to the order total, one "pre" and one "post"', '201 response; two payment rows are created, each tracked and confirmed independently', 'Pass'],
        ['TC-15', 'Reject split amounts that do not add up to the order total', 'POST a split payment whose shares sum to less than the order total', '400 response; no payment rows are created', 'Pass'],
        ['TC-16', 'Reject loyalty redemption that exceeds the available balance', 'POST /api/loyalty/redeem with a points value greater than the customer\'s balance', '400 response; the loyalty_points balance is unchanged', 'Pass'],
        ['TC-17', 'Redeem loyalty points without double-spending on the order discount', 'Place an order that redeems a reward and also has enough remaining points to qualify for a points discount', 'The order total reflects both discounts, but the total points deducted equals exactly the reward cost plus the discount points - never double-counted', 'Pass'],
        ['TC-18', 'Rate-limit repeated order creation', 'Send 21 POST /api/orders requests in quick succession from the same client', 'The 21st request receives a 429 Too Many Requests response', 'Pass'],
    ],
    4, 2, 'Representative backend test cases',
    col_widths=[2.0, 4.3, 4.7, 5.0, 1.5]
)

heading2('4.5', 'Test Results Summary')

body(
    "All 74 backend integration tests pass on the current codebase, and the frontend production "
    "build completes without errors or type warnings. Manual end-to-end walkthroughs of the "
    "customer ordering flow, the kitchen and waiter dashboards, the cashier payment-confirmation "
    "flow, and the manager/admin reporting pages did not reveal any regressions. The loyalty "
    "redemption logic in particular (TC-16 and TC-17) was tested carefully because an earlier "
    "version of the system allowed the same points to be deducted twice - once as part of a "
    "reward redemption and again as a separate points discount on the same order total. The "
    "current implementation reserves the points used by a reward before computing any further "
    "discount, which TC-17 verifies."
)


# ---------------------------------------------------------------------------
# CHAPTER 5 - IMPLEMENTATION STRATEGY
# ---------------------------------------------------------------------------

chapter_heading(5, 'Implementation Strategy')

heading2('5.1', 'Implementation Approach')

body(
    "SmartDine is designed to be rolled out gradually rather than switched on for an entire "
    "restaurant at once. The recommended approach is a pilot conversion: the system is first "
    "installed and configured for a small number of tables (for example, one section of the "
    "dining room), while the rest of the restaurant continues to operate as before. Staff who "
    "work that section - waiters, kitchen staff and the cashier - use SmartDine for a trial "
    "period while management observes order accuracy, kitchen timing and payment reconciliation "
    "against the existing process. Once the pilot section is running smoothly and staff are "
    "comfortable with the workflow, the QR codes and table records for the remaining tables are "
    "added and the system is extended section by section until the whole restaurant is covered. "
    "This phased rollout limits the impact of any early issues to a small part of the "
    "restaurant and gives staff time to adapt before the system becomes the only way orders are "
    "taken."
)

heading2('5.2', 'Installation and Configuration')

body(
    "The system consists of three parts that need to be installed: the MariaDB database, the "
    "Node.js backend, and the built frontend (served as static files). The installation steps "
    "are:"
)
bullet("Install MariaDB and create the smart_restaurant database, then run database/schema.sql to create the 21 tables described in Section 3.6.")
bullet("Run the seed script (npm run seed) to load the initial menu categories, menu items, tables and a default administrator account.")
bullet("Copy backend/.env.example to backend/.env and fill in the database connection details (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME), a strong JWT_SECRET, the PORT the API will listen on, and ALLOWED_ORIGINS for the frontend's domain.")
bullet("Install backend dependencies (npm install) and start the API with npm start; the API exposes the REST endpoints under /api and a Socket.IO server on the same port.")
bullet("Build the frontend for production (npm run build inside the frontend directory) and serve the resulting dist folder from a web server or static host, configured to call the backend's URL.")
bullet("Print and place a QR code at each physical table, generated from that table's qr_token as stored in restaurant_tables, so that scanning it opens the customer ordering page for that table.")

heading2('5.3', 'Data Migration')

body(
    "Restaurants adopting SmartDine typically move from a paper menu and a manual order/till "
    "system, so there is no automated data migration from a legacy database. Instead, the "
    "initial data load is a one-time setup task performed by the administrator through the "
    "admin dashboard (or directly via the seed script for the first batch): menu categories and "
    "items are entered with their prices, descriptions, dietary tags and stock levels; "
    "modifiers are added to the items that support them; tables are created with their seating "
    "capacity, and the system generates a unique QR token for each one; and staff accounts are "
    "created for every waiter, kitchen, cashier, manager and admin user, each assigned the "
    "correct role. Promo codes and loyalty rewards can be configured at any time afterwards "
    "through the admin dashboard, since they do not affect the core ordering flow until they "
    "are actually used."
)

heading2('5.4', 'Staff Training Plan')

body(
    "Because each role has a dashboard that only shows the actions relevant to that role, "
    "training can be delivered separately and briefly to each group:"
)
bullet("Waiters and kitchen staff: a short walkthrough of the table map / order queue, how to update an order item's status, how to mark an order served, and how to respond to guest requests.")
bullet("Cashiers: a walkthrough of the pending-payments list, verifying a waiter-confirmed cash payment, confirming card/online payments, processing refunds, and printing receipts.")
bullet("Managers: an overview of the dashboard summary, sales analytics, staff performance and tip reports, and table occupancy statistics.")
bullet("Administrators: a walkthrough of managing users, the menu (categories, items, modifiers), tables, promo codes, loyalty rewards and the audit log.")
bullet("Customers do not require training - the QR code and on-screen instructions are designed to be self-explanatory, but a short printed card at each table explaining how to scan the code and place an order is recommended for the first few weeks of the pilot.")

heading2('5.5', 'Rollout Schedule')

body(
    "Table 5.1 summarises a representative rollout schedule for a single restaurant location, "
    "following the phased approach described in Section 5.1."
)
add_table(
    ['Phase', 'Duration', 'Activities'],
    [
        ['1. Setup', '1 week', 'Install database, backend and frontend; load initial menu, table and staff data; print QR codes for the pilot section.'],
        ['2. Pilot', '2 weeks', 'Run SmartDine on the pilot section alongside the existing process; train pilot staff; gather feedback and fix any issues found.'],
        ['3. Phased rollout', '2-4 weeks', 'Extend to the remaining sections of the restaurant in stages, training each group of staff as their section goes live.'],
        ['4. Full operation', 'Ongoing', 'All tables use SmartDine; the legacy manual process is retired; staff use the system exclusively for ordering, kitchen tracking and payments.'],
    ],
    5, 1, 'Representative rollout schedule',
    col_widths=[3.5, 2.5, 11.0]
)


# ---------------------------------------------------------------------------
# CHAPTER 6 - MAINTENANCE AND SUPPORT
# ---------------------------------------------------------------------------

chapter_heading(6, 'Maintenance and Support')

heading2('6.1', 'Maintenance Strategy')

body(
    "Three kinds of maintenance are expected over the life of the system. Corrective "
    "maintenance addresses defects found after deployment - for example, the loyalty "
    "double-spend issue described in Section 4.5, which was found through testing and fixed by "
    "reserving redeemed points before computing further discounts. Adaptive maintenance covers "
    "changes needed because something outside the system has changed, such as a new payment "
    "method, a change to tax rules, or a new dependency version. Perfective maintenance covers "
    "improvements requested by the restaurant once the system is in use, such as new report "
    "types or menu features. Because the backend has an automated test suite (Section 4.3), any "
    "of these changes can be made with confidence that existing behaviour - particularly order "
    "totals, status transitions and payment confirmations - has not been broken, by re-running "
    "the suite before deploying a change."
)

heading2('6.2', 'Support Plan')

body(
    "Day-to-day support is expected to be handled by the restaurant's administrator, who has "
    "access to the admin dashboard and the audit log (Section 3.6.7) to investigate issues such "
    "as an incorrect menu price or a misconfigured promo code. Issues that require a code "
    "change - for example, a bug in the order or payment logic - are reported to the "
    "development team with enough detail to reproduce them: the user's role, the steps taken, "
    "and, where possible, the order or payment ID involved, which can be cross-referenced "
    "against order_status_history and the audit_log table. Because the system is composed of "
    "independent layers (frontend, backend API, database, real-time layer), most issues can be "
    "isolated to one layer before a fix is attempted - for instance, an order that appears on "
    "the kitchen screen with the wrong status points to the backend status-transition logic, "
    "while an order that does not appear at all points to the Socket.IO real-time layer."
)

heading2('6.3', 'Monitoring and Backups')

body(
    "The audit_log and order_status_history tables (Section 3.6) provide a built-in history of "
    "administrative changes and order progress that can be used to monitor how the system is "
    "being used and to diagnose problems after the fact. As described in Section 3.6.7, regular "
    "database backups (a scheduled mysqldump of smart_restaurant) should be taken so that order, "
    "payment and loyalty history can be restored if needed. Server-side logs from the Node.js "
    "process should be retained for at least a few days so that any unexpected errors (caught "
    "by the controllers' error handlers and returned as 500 responses) can be traced back to "
    "their cause."
)

heading2('6.4', 'Future Enhancements')

body(
    "Several enhancements were identified during development as valuable but out of scope for "
    "the current version, and are recommended as the basis for a future maintenance roadmap:"
)
bullet("Integration with a real payment gateway (e.g. Stripe) for online card payments, replacing the current simulated online payment status.")
bullet("Support for multiple restaurant locations within a single deployment, with location-scoped menus, tables and reports.")
bullet("A native mobile app (or installable PWA) for waiters and kitchen staff, to reduce reliance on shared tablets.")
bullet("Richer analytics for managers, such as menu-item profitability and demand forecasting based on the order history already collected.")
bullet("Automated email or SMS receipts in addition to the current in-app/printed receipt.")


# ---------------------------------------------------------------------------
# CHAPTER 7 - OUTSTANDING ISSUES
# ---------------------------------------------------------------------------

chapter_heading(7, 'Outstanding Issues')

body(
    "Table 7.1 lists the known limitations of the current version of SmartDine at the time of "
    "writing, together with their impact and a recommended direction for resolving them. None "
    "of these issues affect the core ordering, kitchen, payment or loyalty flows described in "
    "Chapter 3, which are covered by the automated test suite in Chapter 4."
)
add_table(
    ['Issue', 'Impact', 'Recommended Resolution'],
    [
        ['Online payments are recorded as completed without contacting a real payment processor.', 'A restaurant cannot actually take card payments online through the system as it stands; "online" payments must still be settled through an existing card terminal.', 'Integrate a payment gateway (e.g. Stripe) behind the existing payments API so that the payment status reflects a real transaction.'],
        ['The system supports a single restaurant location per deployment.', 'A restaurant chain would need a separate deployment (and database) per branch, with no shared reporting across branches.', 'Add a location_id to the relevant tables and scope tables, menus, staff and reports by location.'],
        ['Push notifications require the browser to support the Web Push API and the user to grant permission.', 'On devices or browsers where push notifications are blocked, kitchen-ready alerts fall back to the on-screen dashboard only.', 'Add an optional SMS or email fallback for order-ready notifications.'],
        ['Frontend UI is covered by manual testing only; there is no automated end-to-end (browser) test suite.', 'Visual or interaction regressions in the Vue frontend are only caught by manual walkthroughs, not by CI.', 'Add a Playwright or Cypress suite covering the key flows already documented in Chapter 4 as manual test cases.'],
        ['Reports (sales, staff performance, tips, occupancy) are generated on demand and are not cached.', 'On a very large order history, report endpoints may become slow.', 'Add caching or pre-aggregation for the manager reporting endpoints once order volumes grow significantly.'],
    ],
    7, 1, 'Outstanding issues and recommended resolutions',
    col_widths=[5.0, 5.5, 6.5]
)


# ---------------------------------------------------------------------------
# REFERENCES
# ---------------------------------------------------------------------------

section_heading('References')

refs = [
    'OpenJS Foundation, "Express - Node.js web application framework," 2024. [Online]. Available: https://expressjs.com/',
    'Vue.js, "Vue.js - The Progressive JavaScript Framework," 2024. [Online]. Available: https://vuejs.org/',
    'Vite, "Next Generation Frontend Tooling," 2024. [Online]. Available: https://vitejs.dev/',
    'Pinia, "The intuitive store for Vue.js," 2024. [Online]. Available: https://pinia.vuejs.org/',
    'Bootstrap, "Bootstrap - The most popular HTML, CSS, and JS library in the world," 2024. [Online]. Available: https://getbootstrap.com/',
    'MariaDB Foundation, "MariaDB Server Documentation," 2024. [Online]. Available: https://mariadb.com/kb/en/',
    'Socket.IO, "Socket.IO Documentation," 2024. [Online]. Available: https://socket.io/docs/',
    'M. Jones, J. Bradley and N. Sakimura, "JSON Web Token (JWT)," RFC 7519, Internet Engineering Task Force, May 2015. [Online]. Available: https://www.rfc-editor.org/rfc/rfc7519',
    'OpenJS Foundation, "Jest - Delightful JavaScript Testing," 2024. [Online]. Available: https://jestjs.io/',
    'MDN Web Docs, "Push API," Mozilla, 2024. [Online]. Available: https://developer.mozilla.org/en-US/docs/Web/API/Push_API',
    'I. Sommerville, Software Engineering, 10th ed. Boston, MA, USA: Pearson, 2015.',
    'R. Elmasri and S. B. Navathe, Fundamentals of Database Systems, 7th ed. Boston, MA, USA: Pearson, 2016.',
]
for i, r in enumerate(refs, start=1):
    p = doc.add_paragraph()
    p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.MULTIPLE
    p.paragraph_format.line_spacing = 1.5
    p.paragraph_format.left_indent = Cm(1.0)
    p.paragraph_format.first_line_indent = Cm(-1.0)
    p.paragraph_format.space_after = Pt(6)
    p.add_run(f'[{i}] {r}')


# ---------------------------------------------------------------------------
# APPENDIX A - API ENDPOINT REFERENCE
# ---------------------------------------------------------------------------

section_heading('Appendix A: API Endpoint Reference')

body(
    "This appendix lists the REST API endpoints exposed by the SmartDine backend, grouped by "
    "functional area. All endpoints are prefixed with /api and, unless noted otherwise, accept "
    "and return JSON. Endpoints that change data or reveal customer/staff information require "
    "a valid JWT in the Authorization header and, for staff-only actions, a matching role."
)

heading3('A.1', 'Authentication (/api/auth)')
add_table(
    ['Method', 'Endpoint', 'Description'],
    [
        ['POST', '/api/auth/register', 'Register a new customer account.'],
        ['POST', '/api/auth/login', 'Authenticate with email and password and receive a JWT.'],
        ['GET', '/api/auth/me', 'Return the profile of the authenticated user.'],
    ],
    'A', 1, 'Authentication endpoints', col_widths=[2.0, 6.0, 8.5]
)

heading3('A.2', 'Menu and Favorites (/api/menu)')
add_table(
    ['Method', 'Endpoint', 'Description'],
    [
        ['GET', '/api/menu/categories', 'List all menu categories.'],
        ['GET', '/api/menu/items', 'List menu items, including modifiers and dietary tags.'],
        ['GET', '/api/menu/grouped', 'List available items grouped by category.'],
        ['GET', '/api/menu/favorites', "List a customer session's favorite items."],
        ['POST', '/api/menu/favorites', 'Toggle a menu item as a favorite for a session.'],
    ],
    'A', 2, 'Menu and favorites endpoints', col_widths=[2.0, 6.0, 8.5]
)

heading3('A.3', 'Tables and Sessions (/api/tables)')
add_table(
    ['Method', 'Endpoint', 'Description'],
    [
        ['GET', '/api/tables', 'List all restaurant tables.'],
        ['GET', '/api/tables/number/:tableNumber', 'Get a table by its table number.'],
        ['GET', '/api/tables/qr/:qrToken', 'Get a table and its active session by QR token.'],
        ['POST', '/api/tables/qr/:qrToken/done', 'Customer signals they have finished, closing the session and freeing the table.'],
        ['PUT', '/api/tables/:id/status', 'Update a table\'s status (available, occupied, reserved).'],
        ['POST', '/api/tables/sessions/close', 'Close the active session for a table (waiter/admin).'],
    ],
    'A', 3, 'Table and session endpoints', col_widths=[2.0, 6.0, 8.5]
)

heading3('A.4', 'Orders (/api/orders)')
add_table(
    ['Method', 'Endpoint', 'Description'],
    [
        ['POST', '/api/orders', 'Create a new order with items, modifiers, promo code and loyalty redemption.'],
        ['GET', '/api/orders/my', "List the authenticated customer's orders."],
        ['GET', '/api/orders/session/:session_id', 'List orders placed during a table session.'],
        ['GET', '/api/orders/table/:table_id', 'List orders for a table.'],
        ['GET', '/api/orders/:id', 'Get full details of an order, including items and modifiers.'],
        ['PUT', '/api/orders/:id/status', 'Update the status of an order (role-restricted transitions).'],
        ['PUT', '/api/orders/:id/cancel', 'Cancel an order.'],
        ['POST', '/api/orders/:id/rate', 'Submit a rating and comment for a completed order.'],
        ['GET', '/api/orders/:id/rating', 'Get the rating submitted for an order.'],
    ],
    'A', 4, 'Order endpoints', col_widths=[2.0, 6.0, 8.5]
)

heading3('A.5', 'Payments (/api/payments)')
add_table(
    ['Method', 'Endpoint', 'Description'],
    [
        ['POST', '/api/payments', 'Record a payment for an order (card, cash or mobile; pre or post).'],
        ['POST', '/api/payments/split', 'Split the bill for an order between multiple payers.'],
        ['GET', '/api/payments/order/:orderId', 'Get the payment record(s) for an order.'],
        ['GET', '/api/payments/pending', 'List payments awaiting confirmation (cashier/waiter/manager/admin).'],
        ['GET', '/api/payments/recent', 'List recently confirmed/refunded payments (cashier/manager/admin).'],
        ['POST', '/api/payments/confirm/:payment_id', 'Confirm a payment - records the waiter\'s collection or the cashier\'s final confirmation depending on the caller\'s role.'],
        ['POST', '/api/payments/refund/:payment_id', 'Refund a payment with a recorded reason (cashier/manager/admin).'],
        ['POST', '/api/payments/notify-cash', 'Notify staff that a customer intends to pay with cash at the table.'],
    ],
    'A', 5, 'Payment endpoints', col_widths=[2.0, 6.5, 8.0]
)

heading3('A.6', 'Kitchen and Waiter Requests (/api/kitchen, /api/waiter-requests)')
add_table(
    ['Method', 'Endpoint', 'Description'],
    [
        ['GET', '/api/kitchen/orders', 'List orders/items the kitchen needs to prepare.'],
        ['PUT', '/api/kitchen/orders/:id/status', 'Update the overall status of an order.'],
        ['PUT', '/api/kitchen/orders/:id/items/:itemId/status', 'Update the status of a single order item (pending/preparing/ready/served).'],
        ['GET', '/api/waiter-requests/orders', 'List orders relevant to the waiter view.'],
        ['PUT', '/api/waiter-requests/orders/:id/status', 'Update an order\'s status from the waiter view.'],
        ['POST', '/api/waiter-requests', 'Create a guest service request (help, water, salt, cleaning, complaint).'],
        ['GET', '/api/waiter-requests', 'List waiter requests.'],
        ['PUT', '/api/waiter-requests/:id/handled', 'Mark a waiter request as handled.'],
    ],
    'A', 6, 'Kitchen and waiter request endpoints', col_widths=[2.0, 7.0, 7.5]
)

heading3('A.7', 'Loyalty and Promo Codes (/api/loyalty, /api/promos)')
add_table(
    ['Method', 'Endpoint', 'Description'],
    [
        ['GET', '/api/loyalty/balance', "Get a customer's loyalty point balance and history."],
        ['GET', '/api/loyalty/rewards', 'List active loyalty rewards alongside the balance.'],
        ['POST', '/api/loyalty/redeem', 'Redeem points for a discount or reward.'],
        ['GET', '/api/promos', 'List promo codes (admin).'],
        ['POST', '/api/promos', 'Create a promo code (admin).'],
        ['PUT', '/api/promos/:id', 'Update a promo code (admin).'],
        ['DELETE', '/api/promos/:id', 'Delete a promo code (admin).'],
        ['POST', '/api/promos/validate', 'Validate a promo code entered at checkout.'],
    ],
    'A', 7, 'Loyalty and promo code endpoints', col_widths=[2.0, 6.0, 8.5]
)

heading3('A.8', 'Reservations, Shifts and Receipts')
add_table(
    ['Method', 'Endpoint', 'Description'],
    [
        ['POST', '/api/reservations', 'Create a table reservation.'],
        ['GET', '/api/reservations', 'List reservations.'],
        ['GET', '/api/reservations/available', 'List tables available for a requested time.'],
        ['PUT', '/api/reservations/:id/status', 'Update a reservation\'s status.'],
        ['DELETE', '/api/reservations/:id', 'Cancel a reservation.'],
        ['POST', '/api/shifts/clock-in', 'Clock in for a staff shift.'],
        ['POST', '/api/shifts/clock-out', 'Clock out of a staff shift.'],
        ['GET', '/api/shifts/my', "Get the authenticated staff member's shift history."],
        ['GET', '/api/shifts', 'List shifts (manager/admin).'],
        ['GET', '/api/receipts/:id', 'Get a printable receipt for an order.'],
    ],
    'A', 8, 'Reservation, shift and receipt endpoints', col_widths=[2.0, 6.0, 8.5]
)

heading3('A.9', 'Inventory and Push Notifications')
add_table(
    ['Method', 'Endpoint', 'Description'],
    [
        ['GET', '/api/inventory/categories', 'List inventory categories.'],
        ['GET', '/api/inventory', 'List inventory items.'],
        ['GET', '/api/inventory/:id', 'Get a single inventory item.'],
        ['POST', '/api/inventory', 'Create an inventory item.'],
        ['PUT', '/api/inventory/:id', 'Update an inventory item.'],
        ['POST', '/api/inventory/:id/restock', 'Record a restock of an inventory item.'],
        ['DELETE', '/api/inventory/:id', 'Delete an inventory item.'],
        ['GET', '/api/push/vapid-public-key', 'Get the VAPID public key used to subscribe to push notifications.'],
        ['POST', '/api/push/subscribe', 'Register a device for push notifications.'],
        ['POST', '/api/push/unsubscribe', 'Remove a device\'s push subscription.'],
    ],
    'A', 9, 'Inventory and push notification endpoints', col_widths=[2.0, 6.0, 8.5]
)

heading3('A.10', 'Administration (/api/admin)')
add_table(
    ['Method', 'Endpoint', 'Description'],
    [
        ['GET', '/api/admin/stats', 'Get aggregate dashboard statistics.'],
        ['GET', '/api/admin/users', 'List users (paginated).'],
        ['POST', '/api/admin/users', 'Create a user.'],
        ['PUT', '/api/admin/users/:id', 'Update a user.'],
        ['DELETE', '/api/admin/users/:id', 'Delete a user.'],
        ['GET', '/api/admin/categories', 'List menu categories.'],
        ['POST', '/api/admin/categories', 'Create a menu category.'],
        ['PUT', '/api/admin/categories/:id', 'Update a menu category.'],
        ['DELETE', '/api/admin/categories/:id', 'Delete a menu category.'],
        ['GET', '/api/admin/items', 'List menu items.'],
        ['POST', '/api/admin/items', 'Create a menu item.'],
        ['PUT', '/api/admin/items/:id', 'Update a menu item.'],
        ['DELETE', '/api/admin/items/:id', 'Delete a menu item.'],
        ['GET', '/api/admin/items/:id/modifiers', 'List modifiers for a menu item.'],
        ['POST', '/api/admin/items/:id/modifiers', 'Add a modifier to a menu item.'],
        ['PUT', '/api/admin/modifiers/:modifierId', 'Update a modifier.'],
        ['DELETE', '/api/admin/modifiers/:modifierId', 'Delete a modifier.'],
        ['GET', '/api/admin/tables', 'List tables.'],
        ['POST', '/api/admin/tables', 'Create a table (generates a QR token).'],
        ['PUT', '/api/admin/tables/:id', 'Update a table.'],
        ['DELETE', '/api/admin/tables/:id', 'Delete a table.'],
        ['GET', '/api/admin/waiters', 'List waiter accounts for table assignment.'],
        ['PUT', '/api/admin/tables/:id/assign', 'Assign a waiter to a table.'],
        ['GET', '/api/admin/orders', 'List all orders (admin overview).'],
        ['GET', '/api/admin/loyalty-rewards', 'List loyalty rewards.'],
        ['POST', '/api/admin/loyalty-rewards', 'Create a loyalty reward.'],
        ['PUT', '/api/admin/loyalty-rewards/:id', 'Update a loyalty reward.'],
        ['DELETE', '/api/admin/loyalty-rewards/:id', 'Delete a loyalty reward.'],
        ['GET', '/api/admin/audit-log', 'List recorded administrative actions.'],
    ],
    'A', 10, 'Administration endpoints', col_widths=[2.0, 6.5, 8.0]
)

heading3('A.11', 'Manager Reports (/api/manager)')
add_table(
    ['Method', 'Endpoint', 'Description'],
    [
        ['GET', '/api/manager/dashboard', 'Get summary metrics for the manager dashboard.'],
        ['GET', '/api/manager/sales', 'Get sales analytics, including peak hours and day-of-week breakdowns.'],
        ['GET', '/api/manager/tips', 'Get a report of tips collected.'],
        ['GET', '/api/manager/staff-performance', 'Get performance metrics for waiters and cashiers.'],
        ['GET', '/api/manager/tables', 'Get table occupancy statistics.'],
        ['GET', '/api/manager/export/csv', 'Export the sales report as a CSV file.'],
        ['GET', '/api/manager/export/pdf', 'Export the sales report as a PDF file.'],
    ],
    'A', 11, 'Manager report endpoints', col_widths=[2.0, 6.0, 8.5]
)


# ---------------------------------------------------------------------------
# APPENDIX B - ENVIRONMENT CONFIGURATION REFERENCE
# ---------------------------------------------------------------------------

section_heading('Appendix B: Environment Configuration Reference')

body(
    "Table B.1 lists the environment variables read by the backend at startup (see "
    "backend/.env.example). These must be set in a backend/.env file before running the server."
)
add_table(
    ['Variable', 'Example Value', 'Purpose'],
    [
        ['PORT', '5000', 'TCP port the Express server and Socket.IO listen on.'],
        ['DB_HOST', 'localhost', 'Hostname of the MariaDB server.'],
        ['DB_USER', 'root', 'MariaDB username used by the backend.'],
        ['DB_PASSWORD', '(empty in example)', 'Password for the MariaDB user.'],
        ['DB_NAME', 'smart_restaurant', 'Name of the application database.'],
        ['JWT_SECRET', 'replace_with_a_long_random_secret_string', 'Secret key used to sign and verify JSON Web Tokens; must be kept private and unique per deployment.'],
        ['ALLOWED_ORIGINS', 'http://localhost:5173', 'Comma-separated list of origins allowed by CORS to call the API (the frontend\'s URL).'],
    ],
    'B', 1, 'Backend environment variables', col_widths=[3.5, 6.5, 6.5]
)


# ---------------------------------------------------------------------------
# USER MANUAL
# ---------------------------------------------------------------------------

section_heading('User Manual')

body(
    "This user manual describes how each role uses SmartDine on a day-to-day basis. Staff "
    "members log in with an email and password at the login page; customers do not log in - "
    "they start by scanning the QR code on their table."
)

heading2('U.1', 'Customer Guide')
bullet("Scan the QR code on your table with your phone's camera. This opens the SmartDine menu for your table and starts (or rejoins) your table's session.")
bullet("Browse the menu by category. Tap a dish to see its description, price, dietary tags and any available modifiers.")
bullet("Add items to your cart, choosing modifiers where offered, then open the cart to review your order.")
bullet("If you have a promo code, enter it in the cart before checkout to apply the discount.")
bullet("If you are a returning customer with loyalty points, open the rewards list to redeem a reward or apply a points discount.")
bullet("Choose to pay now (online) or pay after eating, then place the order. You can track its status (pending, preparing, ready, served) on the order screen.")
bullet("While you wait, you can request help, water, napkins or cleaning from the service-request menu, or split the bill with your table if you are paying after eating.")
bullet("After your meal, rate your order and, if you chose to pay after eating, wait for staff to confirm your payment. When you are ready to leave, use the \"I'm done\" option to free the table.")

heading2('U.2', 'Waiter Guide')
bullet("Log in and open the table map, which shows every table's status (available, occupied, reserved) and any orders awaiting attention.")
bullet("For walk-in guests who prefer not to use their phone, open a table and create an order on their behalf using the same menu the customer sees.")
bullet("Respond to service requests (help, water, cleaning, complaints) raised by guests; mark each as handled once resolved.")
bullet("When an order becomes ready, serve it to the table and mark it served.")
bullet("For pay-after-eating orders, collect the payment from the guest and mark it as collected so the cashier can perform the final confirmation.")
bullet("Once guests have left and all orders are completed, mark the table available again (or use the close-session action) so new guests can be seated.")

heading2('U.3', 'Kitchen Staff Guide')
bullet("Log in to see the queue of confirmed orders, sorted by the time they were placed.")
bullet("Each order shows its items, quantities, modifiers and the estimated preparation time for each item.")
bullet("Update an item's status from pending to preparing when you start working on it, and to ready when it is ready to be served.")
bullet("When the last item of an order becomes ready, the whole order automatically moves to ready and the assigned waiter is notified.")

heading2('U.4', 'Cashier Guide')
bullet("Log in to see the list of pending payments, grouped by table.")
bullet("For cash payments collected by a waiter, verify the amount and confirm the payment to complete it.")
bullet("For online/card payments, confirm the payment once it has been settled.")
bullet("Use the payment history to look up past payments for a table, including any refunds and their reasons.")
bullet("If a refund is needed, select the payment, enter a reason, and process the refund. Print or reprint a receipt for any completed payment.")

heading2('U.5', 'Manager Guide')
bullet("Log in to see the dashboard summary: today's sales, order counts and active tables.")
bullet("Open the sales analytics page to see revenue over time, peak hours and a day-of-week breakdown.")
bullet("Open the staff performance page to see metrics for waiters and cashiers, and the tips report to see tips collected.")
bullet("Open the table occupancy page to see how tables are being used throughout the day.")
bullet("Export the sales report as a CSV or PDF file for record-keeping or further analysis.")

heading2('U.6', 'Administrator Guide')
bullet("Log in to the admin dashboard to see system-wide statistics.")
bullet("Manage user accounts: create staff accounts with the correct role, and update or remove accounts as staff join or leave.")
bullet("Manage the menu: create and edit categories, items (price, description, stock, dietary tags, preparation time) and modifiers.")
bullet("Manage tables: add new tables (each gets a unique QR code), update their status, and assign waiters to tables.")
bullet("Manage promo codes and loyalty rewards: create discount codes and rewards, and activate or deactivate them.")
bullet("Review the audit log to see a history of administrative changes made by every staff member.")


print('Part 7 (References, Appendices, User Manual) built OK')
doc.save(OUT_PATH)
print('Saved checkpoint:', OUT_PATH)
