# Product Requirements Document: Interactive Internship Map for High School Students

## 1. Executive Summary

The Interactive Internship Map is a web application designed to help high school students in Pittsburgh discover internship opportunities by viewing profiles of students who have completed internships. The platform visualizes internship locations on an interactive map, allowing students to explore past internships, learn about student experiences, and connect with peers who have relevant internship experience.

## 2. Problem Statement

High school students often struggle to find relevant internship opportunities and lack visibility into:
- Where internships are located geographically
- What types of internships other students have pursued
- What students learned and accomplished during their internships
- How to connect with students who have internship experience

## 3. Goals & Objectives

### Primary Goals
- Provide a visual, map-based interface for discovering internship opportunities in Pittsburgh
- Enable students to learn from peers' internship experiences
- Facilitate connections between students seeking and those who have completed internships
- Allow students to contribute their own internship experiences to help others

### Success Metrics
- Number of student profiles added to the map
- Number of profile views/interactions
- Number of contact information requests
- Geographic coverage of internships across Pittsburgh

## 4. User Personas

### Primary User: High School Student Seeking Internships
- Age: 14-18
- Tech-savvy, comfortable with web applications
- Looking for internship opportunities in Pittsburgh
- Wants to learn about different types of internships and student experiences

### Secondary User: High School Student Adding Profile
- Has completed an internship
- Wants to share their experience to help other students
- Comfortable filling out online forms

### Tertiary User: Non-Internal High School Student or Staff Member
- External to the primary school/organization
- May be from other schools, educational organizations, or community members
- Interested in viewing internship opportunities and student experiences
- Note: External view functionality and access controls are out of scope for MVP and will be addressed in future phases

## 5. Core Features & Requirements

### 5.1 Interactive Map View

**Description:** The main interface displays an interactive map of Pittsburgh with markers representing internship locations.

**Requirements:**
- Map centered on Pittsburgh, Pennsylvania
- Interactive markers (circles/pins) representing each internship location
- Markers clickable to reveal student profile information
- Map supports zoom and pan functionality
- Markers cluster when zoomed out (optional enhancement)
- Responsive design for desktop and mobile devices

**Technical Specifications:**
- Use Google Maps API for map rendering
- Map should load with appropriate zoom level to show Pittsburgh area
- Markers should be visually distinct and clearly indicate clickability

### 5.2 Student Profile Display

**Description:** Clicking on a map marker displays detailed information about a student and their internship.

**Required Information to Display:**
- Student's name (first name and last name, or first name and last initial)
- Internship company/organization name
- Internship address (full address with street, city, state, zip)
- Key accomplishments, learnings, and achievements (free-form text)
- Contact information:
  - Email address (required)
  - Phone number (optional)

**UI/UX Requirements:**
- Profile information displayed in a modal, popup, or side panel
- Clear visual hierarchy
- Easy to close/dismiss
- Contact information clearly visible and actionable
- Responsive layout for mobile devices

### 5.3 Add Student Profile Feature

**Description:** Students can add their own internship profile to the map.

**User Flow:**
1. User clicks "Add Your Profile" or similar button
2. Form modal/section appears
3. User fills out required and optional fields
4. User submits form
5. New marker appears on map at specified location

**Form Fields:**

**Required Fields:**
- First Name
- Last Name
- Email Address
- Internship Company/Organization Name
- Internship Address (with address validation/autocomplete)
- City (default: Pittsburgh, but editable)
- State (default: Pennsylvania)
- Zip Code
- Accomplishments/Learnings/Achievements (text area)

**Optional Fields:**
- Phone Number

**Validation Requirements:**
- Email format validation
- Address validation (ensure address exists in Pittsburgh area)
- Required fields must be completed before submission
- Phone number format validation (if provided)

**Technical Requirements:**
- Form should use address autocomplete (Google Places API integration recommended)
- Form submission should validate address and geocode it to get coordinates
- New profile should be saved to data store
- Map should update immediately to show new marker

### 5.4 Data Management

**Description:** System needs to store and retrieve student profile data.

**Data Model:**

```
StudentProfile {
  id: unique identifier
  firstName: string (required)
  lastName: string (required)
  email: string (required, validated)
  phone: string (optional)
  internshipCompany: string (required)
  internshipAddress: {
    street: string
    city: string
    state: string
    zip: string
    fullAddress: string
  }
  coordinates: {
    lat: number
    lng: number
  }
  accomplishments: string (required, text area)
  createdAt: timestamp
  updatedAt: timestamp
}
```

**Storage Approach (MVP):**
- For fastest/easiest implementation: Use browser localStorage or a JSON file
- For production: Migrate to backend API with database (Firebase, Supabase, or custom API)

**Data Persistence:**
- Profiles persist across browser sessions
- Data exportable (optional enhancement)

## 6. Technical Requirements

### 6.1 Technology Stack (Recommended for Fastest/Easiest Implementation)

**Frontend Framework:**
- React with Vite (fast development, modern tooling)
- Alternative: Next.js if server-side features needed later

**Styling:**
- CSS Modules or Tailwind CSS for styling
- Responsive design framework

**Map Integration:**
- Google Maps JavaScript API
- Google Places API (for address autocomplete)

**State Management:**
- React Context API or Zustand (lightweight)
- For MVP: Simple state management sufficient

**Data Storage (MVP):**
- localStorage for client-side persistence
- JSON file structure for data export/import
- Future: Backend API with database

**Build Tools:**
- Vite for fast development and building
- ESLint for code quality

### 6.2 API Requirements

**Google Maps API:**
- Maps JavaScript API key required
- Places API for address autocomplete
- Geocoding API for converting addresses to coordinates

**API Key Management:**
- API keys should be stored in environment variables
- Never commit API keys to version control
- Use `.env` file for local development

### 6.3 Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile-responsive design
- Touch-friendly interactions for mobile devices

### 6.4 Performance Requirements

- Map should load within 2-3 seconds
- Profile popups should appear instantly on click
- Form submission should provide immediate feedback
- Smooth map interactions (zoom, pan)

## 7. User Experience Flow

### 7.1 Viewing Profiles

1. User opens application
2. Map loads showing Pittsburgh with markers for all internships
3. User can zoom/pan to explore different areas
4. User clicks on a marker
5. Profile popup/modal appears with student information
6. User can view details, copy contact information
7. User closes popup and continues exploring

### 7.2 Adding a Profile

1. User clicks "Add Your Profile" button (prominently displayed)
2. Form modal appears
3. User fills out form fields:
   - Enters name and contact info
   - Types internship company name
   - Uses address autocomplete to select internship address
   - Describes accomplishments/learnings
4. User submits form
5. System validates data
6. System geocodes address to get coordinates
7. New marker appears on map
8. Success message displayed
9. Form closes

## 8. Design Considerations

### 8.1 Visual Design

- Clean, modern interface
- Clear visual hierarchy
- Accessible color contrast
- Intuitive icons and buttons
- Professional appearance suitable for educational context

### 8.2 Map Styling

- Markers should be visually distinct
- Color coding by category (optional enhancement)
- Clear indication of clickability
- Smooth animations for interactions

### 8.3 Form Design

- Clear field labels
- Helpful placeholder text
- Real-time validation feedback
- Error messages for invalid inputs
- Success confirmation

### 8.4 Mobile Considerations

- Touch-friendly button sizes
- Responsive form layout
- Mobile-optimized map controls
- Easy-to-read text on small screens

## 9. Security & Privacy Considerations

### 9.1 Data Privacy

- Student email addresses are visible to all users (by design for networking)
- Phone numbers are optional and only shown if provided
- Consider adding privacy settings (future enhancement)
- Terms of service should clarify data visibility

### 9.2 Input Validation

- Sanitize all user inputs
- Prevent XSS attacks
- Validate email formats
- Validate phone number formats
- Validate address inputs

### 9.3 API Security

- Google Maps API key should be restricted by domain
- Rate limiting considerations for API calls
- Secure storage of any sensitive data

## 10. Future Enhancements (Out of Scope for MVP)

- User authentication/accounts
- Profile editing and deletion
- Search and filter functionality
- Categories/tags for internships
- Photo uploads
- Reviews/ratings of internships
- Email integration for contacting students
- Admin dashboard
- Analytics and reporting
- Export data functionality
- Social sharing
- Internship categories/industries
- Date ranges for internships
- Multiple internships per student
- External access controls and differentiated views for non-internal users (students/staff from other schools or organizations)

## 11. Success Criteria

### MVP Launch Criteria
- Map displays with at least 5-10 sample student profiles
- Users can click markers to view profiles
- Users can successfully add new profiles
- Form validation works correctly
- Application works on desktop and mobile browsers
- Address autocomplete functions properly

### Post-Launch Success Metrics
- Number of active profiles on map
- User engagement (clicks, profile views)
- Profile submission rate
- User feedback and satisfaction

## 12. Implementation Phases

### Phase 1: Core Map & Display (Week 1)
- Set up React + Vite project
- Integrate Google Maps API
- Create map component with markers
- Implement profile popup/modal
- Display sample data

### Phase 2: Add Profile Feature (Week 1-2)
- Create form component
- Integrate Google Places API for autocomplete
- Implement form validation
- Add geocoding for addresses
- Connect form to data storage

### Phase 3: Data Persistence (Week 2)
- Implement localStorage data storage
- Load existing profiles on map load
- Save new profiles to storage
- Data structure and management

### Phase 4: Polish & Testing (Week 2-3)
- Responsive design implementation
- Mobile optimization
- Error handling
- User testing and feedback
- Bug fixes and refinements

## 13. Dependencies & External Services

### Required Services
- Google Maps JavaScript API
- Google Places API (for autocomplete)
- Google Geocoding API (for address to coordinates)

### API Key Setup
- Developer account with Google Cloud Platform
- Enable required APIs
- Generate and secure API keys
- Configure API restrictions

## 14. Assumptions

- All users are high school students or related to high school community (including external students/staff from other schools)
- For MVP, all users (internal and external) have the same access and view
- Differentiated access controls for external users will be implemented in future phases
- Pittsburgh area focus (can expand later)
- Internet connection required for map functionality
- Users have basic web browsing skills
- Email addresses are appropriate for public display
- No user authentication required for MVP

## 15. Open Questions / Decisions Needed

1. Should there be any moderation of submitted profiles?
2. Should students be able to edit/delete their own profiles?
3. What is the geographic boundary for "Pittsburgh area"?
4. Should there be any limits on number of profiles per student?
5. Should there be categories or tags for different types of internships?
6. Do we need any admin functionality for managing profiles?

---

**Document Version:** 1.0  
**Last Updated:** November 2024  
**Status:** Draft for Review

