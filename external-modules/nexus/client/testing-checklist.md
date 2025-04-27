# Nexus Interface Testing Checklist

## Access Screen

- [ ] The access screen displays with PNG image 4 as the logo
- [ ] Clicking anywhere on the screen blurs the background and shows the API key input
- [ ] Entering the correct API key (1234567890) transitions to the main chat interface
- [ ] Entering an incorrect API key shows an error message with a shake animation
- [ ] The transition between screens is smooth with a fade-out effect

## Main Chat Interface

- [ ] The header displays PNG image 2 as the logo
- [ ] The sidebar is closed by default
- [ ] Clicking the menu button in the header opens the sidebar
- [ ] The sidebar displays PNG image 3 as the logo
- [ ] The chat container shows a welcome message with the logo when no messages are present
- [ ] The input bar is styled with the African design theme
- [ ] The send button is properly positioned inside the input field
- [ ] The control buttons (file, image, audio) are properly styled

## Sidebar

- [ ] The sidebar opens and closes smoothly
- [ ] The sidebar content is properly styled with the African design theme
- [ ] The sidebar sections (Recent Conversations, Settings) are properly displayed
- [ ] The active conversation is highlighted
- [ ] On mobile devices, the sidebar takes up the full screen when opened

## Messages

- [ ] User messages are properly aligned to the right
- [ ] Nexus messages are properly aligned to the left with the logo
- [ ] Messages are styled with the African design theme
- [ ] Attachments (images, documents, audio) are properly displayed
- [ ] Message timestamps are properly displayed

## Responsive Design

- [ ] The interface adapts properly to different screen sizes
- [ ] On mobile devices, the typing controls are hidden
- [ ] The sidebar behavior is appropriate for mobile devices

## Theme Consistency

- [ ] The color palette is consistent throughout the interface
- [ ] The African design theme is applied to all components
- [ ] No visible border lines are used; instead, color differences create visual separation
- [ ] The background patterns are subtle and don't interfere with readability

## Functionality

- [ ] Sending messages works correctly
- [ ] Uploading files works correctly
- [ ] Recording audio works correctly
- [ ] The interface responds appropriately to processing and recording states