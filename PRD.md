# NORBS SERVICE - Invoice Management System

A professional, offline-capable invoice management system for NORBS SERVICE with multi-language support, PDF generation, and comprehensive reporting.

**Experience Qualities**:
1. **Professional** - Clean, trustworthy interface that instills confidence in business operations
2. **Efficient** - Streamlined workflows that minimize clicks and maximize productivity
3. **Reliable** - Robust data persistence and clear feedback for all operations

**Complexity Level**: Complex Application (advanced functionality, multi-entity management)
- Multiple interconnected data models (companies, clients, products, invoices)
- Advanced PDF generation with QR codes
- Comprehensive reporting and analytics
- Multi-language support (PL/NL/EN)

## Essential Features

### Company Settings Management
- **Functionality**: Configure NORBS SERVICE company details (VAT, IBAN, contact info)
- **Purpose**: Centralize business information for invoice generation
- **Trigger**: Settings page or first-time setup
- **Progression**: Navigate to settings → Edit company form → Save → Toast confirmation
- **Success criteria**: Data persists and appears on generated invoices

### Client Management
- **Functionality**: CRUD operations for client database with search and filtering
- **Purpose**: Maintain organized customer records for invoicing
- **Trigger**: Clients page or quick-add during invoice creation
- **Progression**: Clients list → Add/Edit button → Form dialog → Validate → Save → Refresh list
- **Success criteria**: Clients appear in dropdown during invoice creation

### Product/Service Catalog
- **Functionality**: Manage products/services with pricing and VAT rates
- **Purpose**: Standardize billing items and pricing
- **Trigger**: Products page or invoice line item creation
- **Progression**: Products list → Add/Edit → Define price/VAT → Save → Available in invoices
- **Success criteria**: Products auto-populate invoice lines with correct pricing

### Invoice Creation & Management
- **Functionality**: Generate invoices with automatic numbering (FV-YYYY-MM-XXX), line items, VAT calculation
- **Purpose**: Core business function - billing clients professionally
- **Trigger**: "New Invoice" button from dashboard or invoices page
- **Progression**: New invoice → Select client → Add line items → Review totals → Generate number → Save → Generate PDF
- **Success criteria**: Invoice number increments correctly, totals calculate accurately, PDF generates successfully

### PDF Generation with QR Code
- **Functionality**: Generate professional PDF invoices with SEPA EPC QR codes for payment
- **Purpose**: Provide print-ready, scannable invoices for clients
- **Trigger**: "Generate PDF" button on invoice detail
- **Progression**: Select invoice → Generate PDF → Render HTML template → Create QR code → Download PDF
- **Success criteria**: PDF contains all invoice data, QR code scans correctly with SEPA payment info

### Financial Reports
- **Functionality**: Generate annual/monthly reports with totals, charts, top clients
- **Purpose**: Business intelligence and tax preparation
- **Trigger**: Reports page with date range selection
- **Progression**: Select period → Generate report → View charts/tables → Export CSV
- **Success criteria**: Accurate totals matching invoice data, charts render correctly

### Multi-language Support
- **Functionality**: Switch UI and invoice language between PL/NL/EN
- **Purpose**: Serve international clients and user preferences
- **Trigger**: Language selector in header
- **Progression**: Click language → Select PL/NL/EN → UI updates → Preference saved
- **Success criteria**: All UI text translates, invoice PDFs use selected language

## Edge Case Handling
- **Empty States** - Show helpful CTAs when no clients/products/invoices exist
- **Duplicate Prevention** - Validate unique invoice numbers with month/year counters
- **VAT Edge Cases** - Support 0% reverse charge with explanatory notes
- **Data Loss Prevention** - Auto-save drafts, confirm destructive actions
- **Invalid QR Data** - Validate IBAN format before QR generation
- **Number Formatting** - Handle locale-specific decimal/thousand separators

## Design Direction
The design should feel professional, trustworthy, and efficient - like a premium business tool that accountants and business owners rely on daily. Minimal interface with clear information hierarchy, focusing on data clarity and task completion speed.

## Color Selection
**Custom palette** - Professional business application with trustworthy blue primary and clear status colors

- **Primary Color**: Deep Professional Blue `oklch(0.45 0.15 250)` - Communicates trust, stability, and corporate professionalism
- **Secondary Colors**: 
  - Soft Gray `oklch(0.96 0.005 250)` for backgrounds
  - Medium Gray `oklch(0.65 0.01 250)` for supporting elements
- **Accent Color**: Vibrant Blue `oklch(0.55 0.20 250)` for CTAs and active states
- **Foreground/Background Pairings**:
  - Background (White `oklch(1 0 0)`): Dark Gray text `oklch(0.20 0 0)` - Ratio 16.5:1 ✓
  - Card (White `oklch(1 0 0)`): Dark Gray text `oklch(0.20 0 0)` - Ratio 16.5:1 ✓
  - Primary (Deep Blue `oklch(0.45 0.15 250)`): White text `oklch(1 0 0)` - Ratio 8.2:1 ✓
  - Secondary (Soft Gray `oklch(0.96 0.005 250)`): Dark Gray text `oklch(0.20 0 0)` - Ratio 15.8:1 ✓
  - Accent (Vibrant Blue `oklch(0.55 0.20 250)`): White text `oklch(1 0 0)` - Ratio 6.1:1 ✓
  - Muted (Light Gray `oklch(0.96 0.005 250)`): Medium Gray text `oklch(0.50 0.01 250)` - Ratio 7.5:1 ✓

## Font Selection
Professional, highly legible sans-serif fonts that convey modern business efficiency - Inter for UI (geometric, neutral) and JetBrains Mono for invoice numbers and financial data (monospaced clarity).

- **Typographic Hierarchy**:
  - H1 (Page Titles): Inter SemiBold/32px/tight tracking
  - H2 (Section Headers): Inter SemiBold/24px/tight tracking
  - H3 (Card Titles): Inter Medium/18px/normal tracking
  - Body (General Text): Inter Regular/15px/relaxed line-height (1.6)
  - Small (Meta Info): Inter Regular/13px/normal tracking
  - Mono (Invoice Numbers, Amounts): JetBrains Mono Medium/14px/tabular numbers

## Animations
Subtle and purposeful - animations should reinforce actions (save confirmations, page transitions) without slowing productivity. Fast, crisp transitions that feel responsive.

- **Purposeful Meaning**: Quick feedback on data saves (checkmark animations), smooth page transitions maintaining context
- **Hierarchy of Movement**: Primary actions (save, generate PDF) get subtle scale feedback; secondary navigation uses simple fades

## Component Selection
- **Components**: 
  - Dialog for forms (client/product/invoice creation)
  - Card for data display (invoices, reports, dashboard KPIs)
  - Table for lists (clients, products, invoice lines)
  - Select for dropdowns (client selection, VAT rates)
  - Input for text fields with labels
  - Button with primary/secondary variants
  - Tabs for report views and settings sections
  - Calendar for date selection (issue/due dates)
  - Badge for status indicators (paid/unpaid)
  
- **Customizations**: 
  - Custom invoice line item editor with live total calculation
  - PDF preview component with download action
  - Custom KPI cards with large numbers and trend indicators
  
- **States**: 
  - Buttons: hover with slight lift, active with scale-down, disabled with opacity
  - Inputs: focus with blue ring, error with red border, success with green checkmark
  - Tables: hover row highlight, selected row with background
  
- **Icon Selection**: 
  - Plus (add new), PencilSimple (edit), Trash (delete)
  - FileText (invoice), Users (clients), Package (products)
  - ChartBar (reports), Gear (settings), DownloadSimple (export)
  - QrCode (QR payment), CalendarBlank (dates), CurrencyEur (amounts)
  
- **Spacing**: 
  - Container padding: p-6 (24px)
  - Card padding: p-4 (16px)
  - Element gaps: gap-4 (16px) for sections, gap-2 (8px) for form fields
  - Section margins: mb-6 (24px) between major sections
  
- **Mobile**: 
  - Stack sidebar navigation to hamburger menu
  - Single-column layouts for forms and tables
  - Touch-friendly button sizes (min 44px height)
  - Responsive table with horizontal scroll for invoice lines
