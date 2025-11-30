# IMS-CICS Documentation
## Cagayan State University - Internship Management System

**Version:** 1.0  
**Last Updated:** November 30, 2025  
**Developed by:** CSU Interns (Jhomilyn P. Guerrero, Krizel Jane V. Sabio, Maricar C. Tabalno, Jenifer C. Uddipa)  
**Maintained by:** Mark Angelo Doctolero

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Getting Started](#getting-started)
3. [User Roles](#user-roles)
4. [Features by Role](#features-by-role)
   - [Student Features](#student-features)
   - [Admin/Coordinator Features](#admincoordinator-features)
5. [Detailed User Guides](#detailed-user-guides)
6. [Technical Information](#technical-information)
7. [Troubleshooting](#troubleshooting)
8. [Support](#support)

---

## System Overview

The **Internship Management System (IMS-CICS)** is a comprehensive web-based platform designed to streamline the entire internship process for students, academic coordinators, and host companies at Cagayan State University.

### Key Objectives

- **Centralized Management:** Single platform for all internship-related activities
- **Real-time Tracking:** Monitor internship hours and progress in real-time
- **Automated Reporting:** Generate and submit reports digitally
- **Compliance Monitoring:** Ensure students meet internship requirements
- **Communication Hub:** Facilitate coordination between students, coordinators, and companies

### Technology Stack

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Server Actions
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **UI Components:** shadcn/ui
- **Deployment:** Vercel (recommended)

---

## Getting Started

### System Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Stable internet connection
- Valid CSU email address (for registration)

### Accessing the System

1. Navigate to the IMS-CICS URL (provided by your institution)
2. Click **"Get Started"** or **"Access Dashboard"** on the landing page
3. Choose to **Register** (first-time users) or **Login** (existing users)

### Registration Process

#### For Students:

1. Click **"Get Started"** or **"Register"**
2. Fill in the registration form:
   - Full Name
   - Student ID
   - Email Address (CSU email)
   - Password (minimum 8 characters)
   - Course/Program
   - Year Level
3. Click **"Create Account"**
4. Check your email for a confirmation link
5. Click the confirmation link to verify your account
6. Login with your credentials

#### For Administrators:

- Admin accounts are created by system administrators
- Contact the IT department or system administrator for account creation

---

## User Roles

### 1. Student
Students enrolled in internship programs who need to log hours, submit reports, and track their progress.

### 2. Admin/Coordinator
Academic coordinators and faculty members who oversee internship programs, manage students, and monitor compliance.

### 3. Company Supervisor (Future)
Representatives from host companies who supervise interns (feature in development).

---

## Features by Role

## Student Features

### 1. Dashboard

**Access:** Student Dashboard → `/student/dashboard`

**Features:**
- **Overview Cards:**
  - Total hours logged
  - Pending reports
  - Approved reports
  - Completion percentage
- **Quick Actions:**
  - Clock In/Out
  - Submit New Report
  - View Profile
- **Recent Activity:** Latest reports and attendance records
- **Notifications:** Important updates and reminders

**How to Use:**
1. Login to your account
2. You'll be automatically directed to your dashboard
3. View your internship statistics at a glance
4. Use quick action buttons for common tasks

---

### 2. Attendance Tracking

**Access:** Student Dashboard → Attendance → `/student/attendance`

**Features:**
- **Clock In/Out System:**
  - Real-time time tracking
  - GPS location verification (if enabled)
  - Automatic duration calculation
- **Attendance History:**
  - View all clock-in/out records
  - Filter by date range
  - Export attendance records
- **Daily Summary:**
  - Hours worked per day
  - Weekly/monthly totals

**How to Use:**

#### Clocking In:
1. Navigate to **Attendance** page
2. Click **"Clock In"** button
3. Confirm your location (if prompted)
4. Your start time is recorded

#### Clocking Out:
1. Return to **Attendance** page
2. Click **"Clock Out"** button
3. System automatically calculates hours worked
4. Hours are added to your total

#### Viewing History:
1. Scroll down to **Attendance History** section
2. Use date filters to view specific periods
3. Click **"Export"** to download records (if available)

**Important Notes:**
- Always clock out at the end of your shift
- Ensure accurate location data for verification
- Report any discrepancies to your coordinator immediately

---

### 3. Report Management

**Access:** Student Dashboard → Reports → `/student/reports`

**Features:**
- **Create New Reports:**
  - Weekly/Monthly reports
  - Activity descriptions
  - File attachments (documents, images)
  - Rich text editor
- **View Reports:**
  - All submitted reports
  - Status tracking (Pending, Approved, Rejected)
  - Coordinator feedback
- **Edit Reports:**
  - Modify pending reports
  - Resubmit rejected reports
- **Report History:**
  - Filter by status
  - Search by date or keyword

**How to Use:**

#### Creating a New Report:
1. Go to **Reports** → **"New Report"** → `/student/reports/new`
2. Fill in the report form:
   - **Report Period:** Select start and end dates
   - **Title:** Brief description of the report
   - **Activities:** Detailed description of work performed
   - **Learnings:** What you learned during the period
   - **Challenges:** Any difficulties encountered
   - **Attachments:** Upload supporting documents (optional)
3. Click **"Submit Report"**
4. Wait for coordinator approval

#### Viewing Report Status:
1. Go to **Reports** page
2. View status badges:
   - 🟡 **Pending:** Awaiting review
   - 🟢 **Approved:** Accepted by coordinator
   - 🔴 **Rejected:** Needs revision
3. Click on a report to view details and feedback

#### Editing/Resubmitting Reports:
1. Find the report you want to edit
2. Click **"Edit"** or **"Resubmit"**
3. Make necessary changes based on feedback
4. Click **"Resubmit"** to send for review again

**Report Guidelines:**
- Submit reports on time (weekly/monthly as required)
- Be detailed and specific in your descriptions
- Attach relevant documentation
- Address all coordinator feedback when resubmitting
- Use professional language

---

### 4. Profile Management

**Access:** Student Dashboard → Profile → `/student/profile`

**Features:**
- **Personal Information:**
  - Name, Student ID
  - Email, Contact Number
  - Course, Year Level
- **Internship Details:**
  - Host company information
  - Internship start/end dates
  - Required hours
  - Current progress
- **Account Settings:**
  - Change password
  - Update contact information
  - Notification preferences

**How to Use:**

#### Updating Profile:
1. Navigate to **Profile** page
2. Click **"Edit Profile"**
3. Update your information
4. Click **"Save Changes"**

#### Changing Password:
1. Go to **Profile** → **"Security"**
2. Enter current password
3. Enter new password (minimum 8 characters)
4. Confirm new password
5. Click **"Update Password"**

#### Viewing Internship Progress:
1. Check the **Internship Details** section
2. View progress bar showing completion percentage
3. See remaining hours needed
4. Check important dates and deadlines

---

## Admin/Coordinator Features

### 1. Admin Dashboard

**Access:** Admin Dashboard → `/admin/dashboard`

**Features:**
- **System Overview:**
  - Total students enrolled
  - Active internships
  - Pending reports
  - Compliance statistics
- **Quick Stats:**
  - Students by status
  - Reports by status
  - Company partnerships
- **Recent Activity:**
  - Latest student registrations
  - Recent report submissions
  - System notifications
- **Analytics:**
  - Completion rates
  - Average hours logged
  - Trends and insights

**How to Use:**
1. Login with admin credentials
2. View system-wide statistics
3. Monitor overall internship program health
4. Access quick links to manage different areas

---

### 2. Student Management

**Access:** Admin Dashboard → Students → `/admin/students`

**Features:**
- **Student Directory:**
  - View all registered students
  - Search by name, ID, or course
  - Filter by status, course, or company
- **Student Details:**
  - Complete profile information
  - Internship progress
  - Attendance records
  - Report history
- **Student Actions:**
  - Add new students
  - Edit student information
  - Assign to companies
  - Monitor compliance
  - Generate student reports

**How to Use:**

#### Viewing All Students:
1. Navigate to **Students** page
2. Browse the student list
3. Use search bar to find specific students
4. Apply filters to narrow results

#### Adding a New Student:
1. Click **"Add Student"** → `/admin/students/new`
2. Fill in student information:
   - Name, Student ID
   - Email, Contact
   - Course, Year Level
   - Internship details
3. Click **"Create Student"**

#### Viewing Student Details:
1. Click on a student's name
2. View comprehensive information:
   - Personal details
   - Internship assignment
   - Hours logged
   - Reports submitted
   - Attendance records
3. Use tabs to navigate different sections

#### Editing Student Information:
1. Open student details
2. Click **"Edit"**
3. Update necessary information
4. Click **"Save Changes"**

#### Monitoring Student Progress:
1. View student's dashboard
2. Check hours logged vs. required
3. Review report submission status
4. Verify attendance regularity
5. Identify students needing attention

---

### 3. Company Management

**Access:** Admin Dashboard → Companies → `/admin/companies`

**Features:**
- **Company Directory:**
  - List of all partner companies
  - Company details and contacts
  - Active internships per company
- **Company Operations:**
  - Add new companies
  - Edit company information
  - Assign students to companies
  - Track company partnerships
- **Company Analytics:**
  - Students per company
  - Completion rates
  - Company feedback

**How to Use:**

#### Adding a New Company:
1. Go to **Companies** → **"Add Company"** → `/admin/companies/new`
2. Enter company information:
   - Company Name
   - Industry/Sector
   - Contact Person
   - Email, Phone
   - Address
   - **Location (Required):**
     - Latitude
     - Longitude
     - (Use Google Maps to find coordinates)
3. Click **"Create Company"**

#### Editing Company Details:
1. Find the company in the list
2. Click **"Edit"**
3. Update information
4. **Note:** Latitude and Longitude are required fields
5. Click **"Save Changes"**

#### Assigning Students to Companies:
1. Open company details
2. Click **"Assign Students"**
3. Select students from the list
4. Set internship start/end dates
5. Click **"Assign"**

#### Viewing Company Statistics:
1. Open company details
2. View:
   - Number of active interns
   - Completed internships
   - Average student performance
   - Company feedback (if available)

---

### 4. Report Review & Approval

**Access:** Admin Dashboard → Reports → `/admin/reports`

**Features:**
- **Report Queue:**
  - All pending reports
  - Filter by student, date, or status
  - Bulk actions
- **Review Interface:**
  - Read report content
  - View attachments
  - Check student progress
  - Add feedback/comments
- **Approval Actions:**
  - Approve reports
  - Reject with feedback
  - Request revisions
- **Report Analytics:**
  - Submission rates
  - Approval rates
  - Common issues

**How to Use:**

#### Reviewing Reports:
1. Navigate to **Reports** page
2. Click on a pending report
3. Read the report content carefully
4. Review attachments
5. Check for:
   - Completeness
   - Accuracy
   - Professional writing
   - Proper documentation

#### Approving a Report:
1. Open the report
2. If satisfactory, click **"Approve"**
3. Add optional comments
4. Click **"Confirm Approval"**
5. Student receives notification

#### Rejecting a Report:
1. Open the report
2. Click **"Reject"**
3. **Important:** Provide clear feedback:
   - What needs improvement
   - Specific issues found
   - Guidance for revision
4. Click **"Confirm Rejection"**
5. Student can revise and resubmit

#### Bulk Actions:
1. Select multiple reports using checkboxes
2. Choose action from dropdown:
   - Approve selected
   - Mark as reviewed
   - Export selected
3. Click **"Apply"**

---

### 5. Attendance Monitoring

**Access:** Admin Dashboard → Attendance → `/admin/attendance`

**Features:**
- **Attendance Overview:**
  - All student attendance records
  - Real-time clock-in/out status
  - Daily/weekly/monthly summaries
- **Filters & Search:**
  - By student
  - By company
  - By date range
  - By status
- **Analytics:**
  - Attendance patterns
  - Irregular attendance alerts
  - Hours distribution
- **Export:**
  - Generate attendance reports
  - Export to Excel/CSV
  - Company-specific reports

**How to Use:**

#### Viewing Attendance Records:
1. Go to **Attendance** page
2. View all recent clock-in/out records
3. Use filters to narrow results:
   - Select student
   - Choose date range
   - Filter by company

#### Monitoring Real-time Status:
1. Check **"Currently Clocked In"** section
2. See which students are currently working
3. View their clock-in time and duration

#### Generating Reports:
1. Set desired filters
2. Click **"Export"**
3. Choose format (Excel/CSV/PDF)
4. Download the report

#### Identifying Issues:
1. Look for:
   - Missing clock-outs
   - Irregular hours
   - Excessive absences
2. Contact students with discrepancies
3. Make necessary corrections

---

### 6. Course Management

**Access:** Admin Dashboard → Courses → `/admin/courses`

**Features:**
- **Course Directory:**
  - All courses/programs
  - Course details
  - Enrolled students
- **Course Operations:**
  - Add new courses
  - Edit course information
  - Assign students
  - Set requirements
- **Course Analytics:**
  - Students per course
  - Completion rates
  - Performance metrics

**How to Use:**

#### Adding a New Course:
1. Go to **Courses** → **"Add Course"**
2. Enter course information:
   - Course Code
   - Course Name
   - Department
   - Required internship hours
   - Duration
3. Click **"Create Course"**

#### Managing Course Details:
1. Click on a course
2. View enrolled students
3. Edit course requirements
4. Monitor student progress

---

### 7. System Settings

**Access:** Admin Dashboard → Settings → `/admin/settings`

**Features:**
- **General Settings:**
  - System name
  - Logo upload
  - Hero image
  - Contact information
- **Notification Settings:**
  - Email templates
  - Notification triggers
  - Reminder schedules
- **Internship Settings:**
  - Default required hours
  - Report submission deadlines
  - Attendance rules
- **User Management:**
  - Admin accounts
  - Permissions
  - Role assignments

**How to Use:**

#### Updating System Branding:
1. Go to **Settings** → **"General"**
2. Upload logo image
3. Upload hero image for landing page
4. Update system name
5. Click **"Save Changes"**

#### Configuring Notifications:
1. Navigate to **Settings** → **"Notifications"**
2. Enable/disable notification types
3. Set reminder schedules
4. Customize email templates
5. Click **"Save"**

#### Managing Internship Requirements:
1. Go to **Settings** → **"Internship"**
2. Set default required hours
3. Configure report deadlines
4. Set attendance policies
5. Click **"Update Settings"**

---

## Detailed User Guides

### For Students

#### Getting the Most Out of Your Internship

1. **Be Proactive:**
   - Clock in/out accurately every day
   - Submit reports on time
   - Respond to coordinator feedback promptly

2. **Document Everything:**
   - Keep detailed notes of your activities
   - Take photos of your work (if appropriate)
   - Save important documents and certificates

3. **Communicate:**
   - Report issues immediately
   - Ask questions when unclear
   - Keep your coordinator informed

4. **Stay Organized:**
   - Check your dashboard daily
   - Review notifications regularly
   - Plan ahead for report deadlines

#### Common Tasks Quick Reference

| Task | Steps | Frequency |
|------|-------|-----------|
| Clock In | Attendance → Clock In | Daily (start of shift) |
| Clock Out | Attendance → Clock Out | Daily (end of shift) |
| Submit Report | Reports → New Report | Weekly/Monthly |
| Check Progress | Dashboard → View Stats | As needed |
| Update Profile | Profile → Edit | When info changes |

---

### For Administrators

#### Best Practices for Managing Internships

1. **Regular Monitoring:**
   - Check dashboard daily
   - Review pending reports weekly
   - Monitor attendance patterns

2. **Timely Feedback:**
   - Review reports within 48 hours
   - Provide constructive feedback
   - Acknowledge good work

3. **Proactive Communication:**
   - Send reminders before deadlines
   - Alert students of issues early
   - Keep companies informed

4. **Data-Driven Decisions:**
   - Use analytics to identify trends
   - Address systemic issues
   - Improve processes based on data

#### Administrative Workflow

```
Daily Tasks:
├── Check dashboard for alerts
├── Review new student registrations
├── Approve/reject pending reports
└── Monitor attendance issues

Weekly Tasks:
├── Generate progress reports
├── Contact students with low hours
├── Update company information
└── Review system analytics

Monthly Tasks:
├── Generate compliance reports
├── Evaluate program effectiveness
├── Plan improvements
└── Update system settings
```

---

## Technical Information

### System Architecture

```
Frontend (Next.js)
├── App Router
├── Server Components
├── Client Components
└── API Routes

Backend (Supabase)
├── PostgreSQL Database
├── Authentication
├── Storage
└── Real-time Subscriptions

Deployment
└── Vercel (Recommended)
```

### Database Schema

#### Main Tables:
- **users:** User accounts (students, admins)
- **students:** Student profiles and internship details
- **companies:** Partner companies
- **courses:** Academic courses/programs
- **attendance:** Clock-in/out records
- **reports:** Student reports
- **system_settings:** System configuration

### API Endpoints

#### Student APIs:
- `POST /api/student/clock-in` - Clock in
- `POST /api/student/clock-out` - Clock out
- `GET /api/student/reports` - Get reports
- `POST /api/student/reports` - Create report
- `PUT /api/student/reports/[id]` - Update report

#### Admin APIs:
- `GET /api/admin/students` - Get all students
- `POST /api/admin/students` - Create student
- `GET /api/admin/companies` - Get companies
- `POST /api/admin/companies` - Create company
- `GET /api/admin/attendance` - Get attendance records
- `PUT /api/admin/reports/[id]/approve` - Approve report

### Security Features

- **Authentication:** Supabase Auth with email verification
- **Authorization:** Role-based access control (RBAC)
- **Data Encryption:** All data encrypted in transit and at rest
- **Session Management:** Secure session handling
- **Input Validation:** Server-side validation for all inputs
- **SQL Injection Prevention:** Parameterized queries
- **XSS Protection:** Content sanitization

---

## Troubleshooting

### Common Issues & Solutions

#### Login Issues

**Problem:** Cannot login / "Invalid credentials" error

**Solutions:**
1. Verify email and password are correct
2. Check if account is verified (check email for confirmation link)
3. Try password reset if forgotten
4. Clear browser cache and cookies
5. Try a different browser
6. Contact administrator if issue persists

---

#### Clock In/Out Issues

**Problem:** Clock in/out button not working

**Solutions:**
1. Check internet connection
2. Ensure location services are enabled (if required)
3. Refresh the page
4. Clear browser cache
5. Try a different browser
6. Report to coordinator if problem continues

---

#### Report Submission Issues

**Problem:** Cannot submit report / Upload fails

**Solutions:**
1. Check file size (max 10MB per file)
2. Verify file format is supported
3. Ensure all required fields are filled
4. Check internet connection
5. Try uploading files one at a time
6. Contact support if issue persists

---

#### Missing Hours/Data

**Problem:** Hours not showing / Data disappeared

**Solutions:**
1. Refresh the page
2. Check if you're logged into the correct account
3. Verify date range filters
4. Clear browser cache
5. Contact administrator to verify database records

---

### Browser Compatibility

**Recommended Browsers:**
- ✅ Google Chrome (latest version)
- ✅ Mozilla Firefox (latest version)
- ✅ Microsoft Edge (latest version)
- ✅ Safari (latest version)

**Not Recommended:**
- ❌ Internet Explorer (any version)
- ❌ Outdated browser versions

---

### Performance Tips

1. **Use a stable internet connection**
2. **Keep browser updated**
3. **Clear cache regularly**
4. **Close unnecessary tabs**
5. **Use recommended browsers**
6. **Avoid uploading very large files**

---

## Support

### Getting Help

#### For Students:

1. **Check this documentation first**
2. **Contact your coordinator:**
   - Email: [coordinator-email]
   - Office hours: [hours]
3. **Submit a support ticket** (if available)
4. **Visit the help center** (if available)

#### For Administrators:

1. **Technical Support:**
   - Email: cics@csu.edu.ph
   - Phone: [phone-number]
2. **System Administrator:**
   - Mark Angelo Doctolero
   - Email: [admin-email]

### Reporting Bugs

When reporting a bug, please include:
1. What you were trying to do
2. What happened instead
3. Steps to reproduce the issue
4. Browser and device information
5. Screenshots (if applicable)

### Feature Requests

To suggest new features:
1. Email your coordinator or system administrator
2. Describe the feature and its benefits
3. Explain how it would improve the system

---

## Appendix

### Glossary

- **Clock In/Out:** Recording start and end times of work
- **Internship Hours:** Total time spent at internship
- **Report:** Written documentation of internship activities
- **Coordinator:** Academic staff overseeing internships
- **Host Company:** Organization where internship takes place
- **Compliance:** Meeting all internship requirements

### Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Go to Dashboard | `Alt + D` |
| New Report | `Alt + N` |
| Search | `Ctrl + K` or `Cmd + K` |
| Logout | `Alt + L` |

### Changelog

**Version 1.0 (November 2025)**
- Initial release
- Student and Admin portals
- Attendance tracking
- Report management
- Company management
- Course management
- System settings

---

## Privacy & Data Protection

This system complies with data protection regulations. For details, see:
- [Privacy Policy](#) (accessible from footer)
- [Terms of Service](#) (accessible from footer)

Your data is:
- ✅ Encrypted in transit and at rest
- ✅ Stored securely in Supabase
- ✅ Accessible only to authorized users
- ✅ Backed up regularly
- ✅ Never sold to third parties

---

## Acknowledgments

**Developed by CSU Interns:**
- Jhomilyn P. Guerrero
- Krizel Jane V. Sabio
- Maricar C. Tabalno
- Jenifer C. Uddipa

**Maintained by:**
- Mark Angelo Doctolero

**Special Thanks:**
- Cagayan State University
- College of Information and Computing Sciences
- All faculty advisors and coordinators

---

**© 2025 Cagayan State University - Internship Management System**  
**All rights reserved.**

For the latest updates and information, visit the system regularly and check for announcements.
