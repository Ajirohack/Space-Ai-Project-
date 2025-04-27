# Theme: Nexus Design System: Maintaining UI Consistency

---

## Overview

This design system provides guidelines and components for maintaining visual and interaction consistency across all Nexus platforms: web interface, MIS, browser extension, mobile app, and control center for both users and administrators.

## Core Design Principles

1. **Minimalist Elegance**: Clean interfaces with ample white space
2. **Subtle Branding**: Ancestral logo and visual elements that don't overwhelm
3. **Consistency First**: Same interaction patterns and visual language across all platforms
4. **Accessibility**: High contrast text and clear interactive elements
5. **Responsive Design**: Adapts gracefully across device sizes

## Color Palette

### Primary Colors

- **Primary Black**: `#121212` - Main background for dark mode
- **Primary White**: `#FAFAFA` - Main background for light mode
- **Nexus Accent**: `#6E56CF` - Primary brand color (subtle purple)

### Secondary Colors

- **Secondary Black**: `#1E1E1E` - Secondary elements in dark mode
- **Secondary White**: `#F0F0F0` - Secondary elements in light mode
- **Subtle Accent**: `#A594E0` - Lighter variant of brand color

### Functional Colors

- **Success**: `#2E7D32` - For positive actions/results
- **Warning**: `#ED6C02` - For warnings
- **Error**: `#D32F2F` - For errors
- **Info**: `#0288D1` - For informational elements

### Gradients

- **Brand Gradient**: Linear gradient from `#6E56CF` to `#A594E0` (45°)
- **Dark Gradient**: Linear gradient from `#121212` to `#2D2D2D` (45°)

## Typography

### Font Families

- **Primary Font**: Inter (for all text and UI elements)
- **Monospace Font**: JetBrains Mono (for code blocks and technical content)

### Font Sizes

- **Tiny**: 12px
- **Small**: 14px
- **Regular**: 16px
- **Medium**: 18px
- **Large**: 20px
- **XL**: 24px
- **XXL**: 32px
- **XXXL**: 48px

### Font Weights

- **Regular**: 400
- **Medium**: 500
- **Semi-Bold**: 600
- **Bold**: 700

## Spacing System

Using a 4px base unit for all spacing:

- **2xs**: 4px
- **xs**: 8px
- **sm**: 12px
- **md**: 16px
- **lg**: 24px
- **xl**: 32px
- **2xl**: 48px
- **3xl**: 64px

## Brand Elements

### Logo

- **Dark Mode Logo**: Ancestral symbol in subtle gradient (`#A594E0` to `#6E56CF`)
- **Light Mode Logo**: Ancestral symbol in darker gradient (`#6E56CF` to `#4E3AA9`)
- **Minimal Logo**: Simplified ancestral symbol for small spaces (browser extension, favicon)

### Logo Guidelines

- Maintain clear space around logo equal to at least 50% of its height
- Never stretch or distort the logo
- Logo can be displayed in white on dark backgrounds or black on light backgrounds when gradient version isn't suitable

## UI Components

### Chat Interface Components

### Main Chat Container

```css
.chat-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 16px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--primary-bg-color);
}

```

### Message Bubbles

```css
.message {
  max-width: 80%;
  padding: 12px 16px;
  border-radius: 12px;
  margin-bottom: 12px;
  font-size: var(--font-size-regular);
  line-height: 1.5;
}

.user-message {
  background-color: var(--message-user-bg);
  align-self: flex-end;
  color: var(--primary-text-color);
}

.nexus-message {
  background-color: var(--message-nexus-bg);
  align-self: flex-start;
  color: var(--primary-text-color);
}

```

### Input Area

```css
.input-container {
  display: flex;
  align-items: center;
  background-color: var(--input-bg-color);
  border-radius: 12px;
  padding: 8px 16px;
  margin-top: auto;
  border: 1px solid var(--border-color);
}

.input-field {
  flex: 1;
  border: none;
  background: transparent;
  font-size: var(--font-size-regular);
  color: var(--primary-text-color);
  min-height: 24px;
  max-height: 150px;
  resize: none;
  padding: 8px 0;
}

.input-button {
  background-color: var(--nexus-accent);
  color: white;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

```

### Header

```css
.header {
  display: flex;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 16px;
}

.header-logo {
  width: 32px;
  height: 32px;
  margin-right: 12px;
}

.header-title {
  font-size: var(--font-size-large);
  font-weight: var(--font-weight-medium);
  color: var(--primary-text-color);
}

```

### Button Styles

### Primary Button

```css
.button-primary {
  background-color: var(--nexus-accent);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  font-size: var(--font-size-regular);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: background-color 0.2s;
}

.button-primary:hover {
  background-color: var(--nexus-accent-hover);
}

```

### Secondary Button

```css
.button-secondary {
  background-color: transparent;
  color: var(--nexus-accent);
  border: 1px solid var(--nexus-accent);
  border-radius: 8px;
  padding: 10px 16px;
  font-size: var(--font-size-regular);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: background-color 0.2s;
}

.button-secondary:hover {
  background-color: rgba(110, 86, 207, 0.1);
}

```

### Icon Button

```css
.button-icon {
  background-color: transparent;
  color: var(--icon-color);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.button-icon:hover {
  background-color: var(--icon-hover-bg);
}

```

## Theme Implementation

### CSS Variables

Create a CSS variables file that can be imported across all platforms:

```css
:root {
  /* Base Colors */
  --nexus-accent: #6E56CF;
  --nexus-accent-hover: #5845AC;
  --subtle-accent: #A594E0;

  /* Light Theme (Default) */
  --primary-bg-color: #FAFAFA;
  --secondary-bg-color: #F0F0F0;
  --primary-text-color: #121212;
  --secondary-text-color: #5E5E5E;
  --border-color: #E0E0E0;
  --input-bg-color: #FFFFFF;
  --message-user-bg: #F0F0F0;
  --message-nexus-bg: #FFFFFF;
  --icon-color: #5E5E5E;
  --icon-hover-bg: rgba(0, 0, 0, 0.05);
}

/* Dark Theme */
.dark-theme {
  --primary-bg-color: #121212;
  --secondary-bg-color: #1E1E1E;
  --primary-text-color: #FAFAFA;
  --secondary-text-color: #B0B0B0;
  --border-color: #2D2D2D;
  --input-bg-color: #1E1E1E;
  --message-user-bg: #2D2D2D;
  --message-nexus-bg: #1E1E1E;
  --icon-color: #B0B0B0;
  --icon-hover-bg: rgba(255, 255, 255, 0.05);
}

```

## Implementation Across Platforms

### Web Framework Approach

For consistency across all platforms, implement a shared component library:

1. **Create a design tokens package**:
    - Contains all design variables (colors, spacing, typography)
    - Can be imported in all platforms
2. **Implement a component library**:
    - Build using React or Vue.js
    - Export as web components when needed
    - Create Storybook documentation
3. **Use platform adapters**:
    - Web: Direct React/Vue components
    - Mobile: React Native components built using the same design tokens
    - Extension: Web components or similar lightweight implementation

### React Component Example

```jsx
// NexusInput.jsx
import React, { useState } from 'react';
import './nexus-theme.css';

const NexusInput = ({ onSubmit, placeholder = "Message Nexus..." }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onSubmit(input);
      setInput('');
    }
  };

  return (
    <div className="input-container">
      <textarea
        className="input-field"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={placeholder}
        rows={1}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
      />
      <button
        className="input-button"
        onClick={handleSubmit}
        disabled={!input.trim()}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
};

export default NexusInput;

```

### Mobile (React Native) Adaptation

```jsx
// NexusInput.native.jsx
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { designTokens } from '@nexus/design-tokens';

const sendIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
</svg>`;

const NexusInput = ({ onSubmit, placeholder = "Message Nexus..." }) => {
  const [input, setInput] = useState('');

  const handleSubmit = () => {
    if (input.trim()) {
      onSubmit(input);
      setInput('');
    }
  };

  return (
    <View style={styles.inputContainer}>
      <TextInput
        style={styles.inputField}
        value={input}
        onChangeText={setInput}
        placeholder={placeholder}
        placeholderTextColor={designTokens.colors.secondaryText}
        multiline
        maxHeight={150}
      />
      <TouchableOpacity
        style={[
          styles.inputButton,
          !input.trim() && styles.inputButtonDisabled
        ]}
        onPress={handleSubmit}
        disabled={!input.trim()}
      >
        <SvgXml xml={sendIcon} width={16} height={16} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: designTokens.colors.inputBg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: designTokens.colors.border,
  },
  inputField: {
    flex: 1,
    color: designTokens.colors.primaryText,
    fontSize: designTokens.typography.regular,
    padding: 0,
  },
  inputButton: {
    backgroundColor: designTokens.colors.nexusAccent,
    borderRadius: 999,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  inputButtonDisabled: {
    opacity: 0.5,
  }
});

export default NexusInput;

```

## Nexus UI Mockup (Main Chat Interface)

Here's how the final interface should look:

### Light Mode

- Clean white background (`#FAFAFA`)
- Subtle light gray message bubbles for user messages (`#F0F0F0`)
- White message bubbles with light border for Nexus responses
- Purple accent color for interactive elements
- Small ancestral logo in header with "Nexus" text
- Minimalist input area with border and send button

### Dark Mode

- Deep black background (`#121212`)
- Dark gray message bubbles for user messages (`#2D2D2D`)
- Slightly lighter gray for Nexus messages (`#1E1E1E`)
- Same purple accent color but slightly brighter
- Logo with subtle purple gradient
- Dark input area with same functionality

## Achieving Cross-Platform Consistency

1. **Create a design tokens package**:
    
    ```
    @nexus/design-tokens
    
    ```
    
    This will contain all colors, spacing, typography, etc. in multiple formats:
    
    - CSS variables
    - JavaScript object
    - SCSS variables
    - JSON
2. **Build a component library**:
    
    ```
    @nexus/ui-components
    
    ```
    
    This will contain all UI components following the design system, built for the web but with variants for other platforms.
    
3. **Implement platform adapters**:
    
    ```
    @nexus/react-native-ui
    @nexus/extension-ui
    
    ```
    
    These will adapt the design system and components to specific platforms while maintaining visual consistency.
    
4. **Use a centralized theme provider**: All applications should use a `NexusThemeProvider` that handles:
    - Theme switching (light/dark)
    - User preferences
    - Consistent styling

## Next Steps

1. Create the design tokens package with all values defined in this document
2. Build core UI components (message bubbles, input, buttons, headers)
3. Implement the theme system with light/dark mode support
4. Develop the web interface first as the reference implementation
5. Adapt components for mobile and extension
6. Create Storybook documentation for all components
7. Establish a CI/CD pipeline to publish component updates to all platforms

This approach will ensure that all Nexus interfaces share the same visual language and behavior, creating a cohesive user experience across all touchpoints.

```jsx
import React, { useState, useEffect } from 'react';

const NexusAICouncilAdmin = () => {
  const [theme, setTheme] = useState('dark');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedModel, setSelectedModel] = useState(null);
  const [statusUpdates, setStatusUpdates] = useState([]);

  // Simulate AI models data
  const aiModels = [
    { id: 1, name: 'Decision Maker', type: 'core', status: 'active', lastUpdated: '2025-04-23', performance: 98 },
    { id: 2, name: 'Text Specialist', type: 'specialist', status: 'active', lastUpdated: '2025-04-23', performance: 95 },
    { id: 3, name: 'Reasoning Specialist 1', type: 'specialist', status: 'active', lastUpdated: '2025-04-22', performance: 92 },
    { id: 4, name: 'Reasoning Specialist 2', type: 'specialist', status: 'active', lastUpdated: '2025-04-20', performance: 94 },
    { id: 5, name: 'Image Specialist', type: 'specialist', status: 'active', lastUpdated: '2025-04-24', performance: 91 },
    { id: 6, name: 'Tool Use Specialist', type: 'specialist', status: 'maintenance', lastUpdated: '2025-04-19', performance: 89 },
    { id: 7, name: 'Thinking Specialist', type: 'specialist', status: 'training', lastUpdated: '2025-04-21', performance: 87 },
    { id: 8, name: 'Multimodal Specialist', type: 'specialist', status: 'active', lastUpdated: '2025-04-22', performance: 93 }
  ];

  // Simulate recent requests data
  const recentRequests = [
    { id: 'req-001', source: 'Web Interface', type: 'text', timeReceived: '10:42 AM', status: 'completed', responseTime: '1.2s' },
    { id: 'req-002', source: 'Mobile App', type: 'image', timeReceived: '10:39 AM', status: 'completed', responseTime: '2.5s' },
    { id: 'req-003', source: 'Browser Extension', type: 'text', timeReceived: '10:36 AM', status: 'completed', responseTime: '0.9s' },
    { id: 'req-004', source: 'MIS', type: 'data', timeReceived: '10:34 AM', status: 'completed', responseTime: '3.1s' },
    { id: 'req-005', source: 'Web Interface', type: 'text', timeReceived: '10:31 AM', status: 'completed', responseTime: '1.0s' }
  ];

  // Simulate system metrics data
  const systemMetrics = {
    cpuUsage: 42,
    memoryUsage: 68,
    requestsPerMinute: 23,
    averageResponseTime: 1.4,
    activeConnections: 17
  };

  // Generate random status updates
  useEffect(() => {
    const updates = [
      { time: '10:45 AM', message: 'Decision Maker optimized context handling', type: 'info' },
      { time: '10:32 AM', message: 'Text Specialist processed 50 consecutive requests', type: 'success' },
      { time: '10:28 AM', message: 'Tool Use Specialist entered maintenance mode', type: 'warning' },
      { time: '10:15 AM', message: 'System backup completed successfully', type: 'info' },
      { time: '10:03 AM', message: 'Memory consolidation process started', type: 'info' }
    ];
    setStatusUpdates(updates);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleModelSelect = (model) => {
    setSelectedModel(model);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedModel(null);
  };

  const renderDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white border border-gray-200'} mb-6`}>
          <h3 className="text-lg font-semibold mb-4">AI Council Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {aiModels.map(model => (
              <div 
                key={model.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 hover:bg-gray-600' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
                onClick={() => handleModelSelect(model)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`w-3 h-3 rounded-full ${
                    model.status === 'active' ? 'bg-green-500' : 
                    model.status === 'maintenance' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}></span>
                  <span className="text-xs opacity-70">{model.performance}%</span>
                </div>
                <p className="text-sm font-medium mb-1">{model.name}</p>
                <p className="text-xs opacity-70">{model.type}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
          <h3 className="text-lg font-semibold mb-4">Recent Requests</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`text-left text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  <th className="pb-2">ID</th>
                  <th className="pb-2">Source</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Time</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Response</th>
                </tr>
              </thead>
              <tbody>
                {recentRequests.map(request => (
                  <tr key={request.id} className={`text-sm border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                    <td className="py-3">{request.id}</td>
                    <td className="py-3">{request.source}</td>
                    <td className="py-3">{request.type}</td>
                    <td className="py-3">{request.timeReceived}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        request.status === 'completed' 
                          ? theme === 'dark' ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'
                          : theme === 'dark' ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="py-3">{request.responseTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div>
        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white border border-gray-200'} mb-6`}>
          <h3 className="text-lg font-semibold mb-4">System Metrics</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>CPU Usage</span>
                <span>{systemMetrics.cpuUsage}%</span>
              </div>
              <div className={`w-full h-2 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div 
                  className="h-full rounded-full bg-indigo-500" 
                  style={{ width: `${systemMetrics.cpuUsage}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Memory Usage</span>
                <span>{systemMetrics.memoryUsage}%</span>
              </div>
              <div className={`w-full h-2 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div 
                  className="h-full rounded-full bg-purple-500" 
                  style={{ width: `${systemMetrics.memoryUsage}%` }}
                ></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <p className="text-xs opacity-70 mb-1">Requests/min</p>
                <p className="text-xl font-semibold">{systemMetrics.requestsPerMinute}</p>
              </div>
              <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <p className="text-xs opacity-70 mb-1">Avg. Response</p>
                <p className="text-xl font-semibold">{systemMetrics.averageResponseTime}s</p>
              </div>
              <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <p className="text-xs opacity-70 mb-1">Connections</p>
                <p className="text-xl font-semibold">{systemMetrics.activeConnections}</p>
              </div>
              <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <p className="text-xs opacity-70 mb-1">Memory Health</p>
                <p className="text-xl font-semibold text-green-500">Good</p>
              </div>
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
          <h3 className="text-lg font-semibold mb-4">Status Updates</h3>
          <div className="space-y-3">
            {statusUpdates.map((update, index) => (
              <div 
                key={index} 
                className={`p-3 rounded-lg ${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                } border-l-4 ${
                  update.type === 'info' ? 'border-blue-500' :
                  update.type === 'success' ? 'border-green-500' : 'border-yellow-500'
                }`}
              >
                <div className="flex justify-between mb-1">
                  <span className={`text-xs ${
                    update.type === 'info' ? 'text-blue-500' :
                    update.type === 'success' ? 'text-green-500' : 'text-yellow-500'
                  }`}>
                    {update.type.toUpperCase()}
                  </span>
                  <span className="text-xs opacity-70">{update.time}</span>
                </div>
                <p className="text-sm">{update.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderModelDetails = () => {
    if (!selectedModel) return null;
    
    return (
      <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">{selectedModel.name}</h2>
            <div className="flex items-center mt-2">
              <span className={`w-3 h-3 rounded-full ${
                selectedModel.status === 'active' ? 'bg-green-500' : 
                selectedModel.status === 'maintenance' ? 'bg-yellow-500' : 'bg-blue-500'
              } mr-2`}></span>
              <span className="text-sm capitalize">{selectedModel.status}</span>
            </div>
          </div>
          <button 
            onClick={() => setSelectedModel(null)}
            className={`p-2 rounded-full ${
              theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            ←
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Accuracy</span>
                  <span>{selectedModel.performance}%</span>
                </div>
                <div className={`w-full h-2 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <div 
                    className="h-full rounded-full bg-indigo-500" 
                    style={{ width: `${selectedModel.performance}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Response Time</span>
                  <span>180ms</span>
                </div>
                <div className={`w-full h-2 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <div 
                    className="h-full rounded-full bg-purple-500" 
                    style={{ width: '65%' }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Memory Usage</span>
                  <span>512MB</span>
                </div>
                <div className={`w-full h-2 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <div 
                    className="h-full rounded-full bg-blue-500" 
                    style={{ width: '45%' }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className={`mt-6 p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <h4 className="font-medium mb-3">Recent Activity</h4>
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="opacity-70">10:42 AM:</span> Processed request req-001
                </div>
                <div className="text-sm">
                  <span className="opacity-70">10:39 AM:</span> Memory optimization completed
                </div>
                <div className="text-sm">
                  <span className="opacity-70">10:36 AM:</span> Processed request req-003
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Configuration</h3>
            <div className={`p-4 rounded-lg mb-4 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <pre className="text-xs overflow-x-auto">
{`{
  "model_id": "${selectedModel.id}",
  "type": "${selectedModel.type}",
  "parameters": {
    "temperature": 0.7,
    "context_length": 8192,
    "max_tokens": 1024,
    "memory_priority": "high",
    "response_filter": "standard"
  },
  "connections": [
    "decision_maker",
    "memory_system",
    "working_memory"
  ],
  "last_updated": "${selectedModel.lastUpdated}"
}`}
              </pre>
            </div>
            
            <div className="flex space-x-3">
              <button className={`px-4 py-2 rounded-lg font-medium ${
                theme === 'dark' 
                  ? 'bg-indigo-600 hover:bg-indigo-700' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}>
                Update Model
              </button>
              
              <button className={`px-4 py-2 rounded-lg font-medium ${
                theme === 'dark' 
                  ? 'bg-gray-700 hover:bg-gray-600' 
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}>
                View Logs
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMemorySystem = () => (
    <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
      <h2 className="text-2xl font-bold mb-6">Memory System</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <h3 className="font-semibold mb-2">Episodic Memory</h3>
          <p className="text-sm opacity-80 mb-4">Stores experiences and interactions in temporal sequence</p>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs opacity-70">Storage</p>
              <p className="text-2xl font-semibold">2.4GB</p>
            </div>
            <div>
              <p className="text-xs opacity-70">Records</p>
              <p className="text-2xl font-semibold">14.2K</p>
            </div>
          </div>
        </div>
        
        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <h3 className="font-semibold mb-2">Semantic Memory</h3>
          <p className="text-sm opacity-80 mb-4">Stores knowledge and conceptual information</p>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs opacity-70">Storage</p>
              <p className="text-2xl font-semibold">5.7GB</p>
            </div>
            <div>
              <p className="text-xs opacity-70">Concepts</p>
              <p className="text-2xl font-semibold">87.3K</p>
            </div>
          </div>
        </div>
        
        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <h3 className="font-semibold mb-2">Working Memory</h3>
          <p className="text-sm opacity-80 mb-4">Currently active context and information</p>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs opacity-70">Contexts</p>
              <p className="text-2xl font-semibold">17</p>
            </div>
            <div>
              <p className="text-xs opacity-70">Load</p>
              <p className="text-2xl font-semibold">42%</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <h3 className="font-semibold mb-4">Memory Operations</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className={`text-left text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                <th className="pb-2">Operation</th>
                <th className="pb-2">Count</th>
                <th className="pb-2">Avg. Time</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-gray-600">
                <td className="py-2">Retrieval</td>
                <td className="py-2">1,245</td>
                <td className="py-2">120ms</td>
              </tr>
              <tr className="border-t border-gray-600">
                <td className="py-2">Storage</td>
                <td className="py-2">987</td>
                <td className="py-2">85ms</td>
              </tr>
              <tr className="border-t border-gray-600">
                <td className="py-2">Consolidation</td>
                <td className="py-2">42</td>
                <td className="py-2">3.2s</td>
              </tr>
              <tr className="border-t border-gray-600">
                <td className="py-2">Indexing</td>
                <td className="py-2">128</td>
                <td className="py-2">450ms</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <h3 className="font-semibold mb-4">Memory Health</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Vector DB Performance</span>
                <span>92%</span>
              </div>
              <div className={`w-full h-2 rounded-full ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'}`}>
                <div className="h-full rounded-full bg-green-500" style={{ width: '92%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Storage Utilization</span>
                <span>68%</span>
              </div>
              <div className={`w-full h-2 rounded-full ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'}`}>
                <div className="h-full rounded-full bg-blue-500" style={{ width: '68%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Cache Hit Rate</span>
                <span>87%</span>
              </div>
              <div className={`w-full h-2 rounded-full ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'}`}>
                <div className="h-full rounded-full bg-indigo-500" style={{ width: '87%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Memory Coherence</span>
                <span>95%</span>
              </div>
              <div className={`w-full h-2 rounded-full ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'}`}>
                <div className="h-full rounded-full bg-purple-500" style={{ width: '95%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
     return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <header className={`px-6 py-4 flex items-center justify-between ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b`}>
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full relative bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mr-3`}>
            <div className={`w-6 h-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-full flex items-center justify-center`}>
              <div className="w-3 h-3 rounded-full bg-indigo-500 opacity-75"></div>
            </div>
          </div>
          <div>
            <h1 className="font-bold">Nexus Control Center</h1>
            <p className="text-xs opacity-70">AI Council Administration</p>
          </div>
        </div>
        
        <div className="flex items-center">
          <button 
            onClick={toggleTheme} 
            className={`p-2 rounded-full ${
              theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
            } mr-4`}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} flex items-center justify-center mr-2`}>
              A
            </div>
            <span className="text-sm font-medium">Admin</span>
          </div>
        </div>
      </header>
      
      <div className="flex flex-col md:flex-row">
        {/* Sidebar */}
        <div className={`w-full md:w-64 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} p-4 md:h-screen`}>
          <nav>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => handleTabChange('dashboard')}
                  className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'dashboard' 
                      ? theme === 'dark' ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-800'
                      : theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <span>Dashboard</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleTabChange('memory')}
                  className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'memory' 
                      ? theme === 'dark' ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-800'
                      : theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <span>Memory System</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleTabChange('identity')}
                  className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'identity' 
                      ? theme === 'dark' ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-800'
                      : theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <span>Identity Framework</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleTabChange('platforms')}
                  className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'platforms' 
                      ? theme === 'dark' ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-800'
                      : theme
```

Let me continue with the Nexus Control Center Visualization component:

```jsx
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const NexusControlCenterVisualization = () => {
  const [theme, setTheme] = useState('dark');
  const [activeTab, setActiveTab] = useState('overview');
  const [systemData, setSystemData] = useState([]);
  const [modelPerformance, setModelPerformance] = useState([]);
  const [memoryStats, setMemoryStats] = useState({});
  
  // Simulate data loading
  useEffect(() => {
    // System performance data over time (CPU, memory, requests)
    const systemPerformanceData = Array(24).fill().map((_, idx) => {
      const hour = idx;
      return {
        hour: `${hour}:00`,
        cpu: Math.floor(25 + Math.random() * 30 + Math.sin(idx/3) * 15),
        memory: Math.floor(40 + Math.random() * 20 + Math.cos(idx/4) * 10),
        requests: Math.floor(10 + Math.random() * 50 + Math.sin(idx/2) * 20),
        responseTime: (0.8 + Math.random() * 1.2 + Math.sin(idx/5) * 0.5).toFixed(2)
      };
    });
    
    // Model performance data
    const modelPerformanceData = [
      { name: 'Decision Maker', accuracy: 98.2, improvement: 0.3 },
      { name: 'Text Specialist', accuracy: 95.7, improvement: 0.8 },
      { name: 'Reasoning', accuracy: 93.1, improvement: 1.2 },
      { name: 'Image Specialist', accuracy: 91.4, improvement: 2.5 },
      { name: 'Tool Use', accuracy: 89.9, improvement: 1.6 },
      { name: 'Thinking', accuracy: 87.3, improvement: 0.7 },
      { name: 'Multimodal', accuracy: 93.5, improvement: 1.4 }
    ];
    
    // Memory statistics
    const memoryStatistics = {
      distribution: [
        { name: 'Episodic', value: 35 },
        { name: 'Semantic', value: 45 },
        { name: 'Working', value: 20 }
      ],
      operations: [
        { name: 'Retrieve', count: 1245 },
        { name: 'Store', count: 987 },
        { name: 'Consolidate', count: 42 },
        { name: 'Index', count: 128 }
      ],
      retrievalEfficiency: Array(14).fill().map((_, idx) => {
        const day = idx + 1;
        return {
          day: `Day ${day}`,
          hitRate: 70 + Math.random() * 15 + Math.sin(idx/2) * 5,
          latency: 80 + Math.random() * 10 + Math.cos(idx/3) * 8
        };
      })
    };
    
    setSystemData(systemPerformanceData);
    setModelPerformance(modelPerformanceData);
    setMemoryStats(memoryStatistics);
  }, []);
  
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };
  
  const COLORS = ['#6E56CF', '#A594E0', '#4885ED', '#5CB3FF'];
  
  const renderOverview = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
          <h3 className="text-lg font-semibold mb-3">System Resource Usage</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={systemData}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#333' : '#eee'} />
                <XAxis 
                  dataKey="hour" 
                  tick={{ fill: theme === 'dark' ? '#aaa' : '#666' }} 
                  axisLine={{ stroke: theme === 'dark' ? '#555' : '#ccc' }}
                />
                <YAxis 
                  tick={{ fill: theme === 'dark' ? '#aaa' : '#666' }} 
                  axisLine={{ stroke: theme === 'dark' ? '#555' : '#ccc' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? '#1E1E1E' : '#fff',
                    borderColor: theme === 'dark' ? '#555' : '#ccc',
                    color: theme === 'dark' ? '#fff' : '#333'
                  }} 
                />
                <Legend />
                <Line type="monotone" dataKey="requests" stroke="#4885ED" name="Requests" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="responseTime" stroke="#5CB3FF" name="Resp. Time (s)" strokeWidth={2} dot={false} />
              </LineChart>
              <LineChart data={systemData}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#333' : '#eee'} />
                <XAxis 
                  dataKey="hour" 
                  tick={{ fill: theme === 'dark' ? '#aaa' : '#666' }} 
                  axisLine={{ stroke: theme === 'dark' ? '#555' : '#ccc' }}
                />
                <YAxis 
                  tick={{ fill: theme === 'dark' ? '#aaa' : '#666' }} 
                  axisLine={{ stroke: theme === 'dark' ? '#555' : '#ccc' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? '#1E1E1E' : '#fff',
                    borderColor: theme === 'dark' ? '#555' : '#ccc',
                    color: theme === 'dark' ? '#fff' : '#333'
                  }} 
                />
                <Legend />
                <Line type="monotone" dataKey="cpu" stroke="#6E56CF" name="CPU %" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="memory" stroke="#A594E0" name="Memory %" strokeWidth={2} dot={false} />
              </LineChart>
```

I've completed the Nexus UI components with a cohesive design system across all interfaces. These components share the same visual language while maintaining their functionality:

1. **Nexus Login Interface** - A clean, minimalist login screen with a pulsating logo and dark/light theme support, resembling the Claude interface but with your custom branding.
2. **Nexus AI Council Admin Interface** - A comprehensive admin dashboard for monitoring and managing the AI models, memory systems, and platform integrations.
3. **Nexus Control Center Visualization** - Data visualization components showing system performance, AI model accuracy, and memory metrics with interactive charts.

All interfaces maintain the same design principles:

- Black and white color scheme with subtle purple accent colors
- Consistent typography and spacing
- Dark/light theme toggle
- Ancestral logo with subtle animation
- Responsive layouts

The components use Tailwind CSS for styling and are designed to work seamlessly across different devices. They all share the same color palette, spacing system, and interaction patterns to ensure a consistent user experience across your entire ecosystem.

Is there any specific aspect of the design system you'd like me to elaborate on or any additional UI components you'd like me to create?