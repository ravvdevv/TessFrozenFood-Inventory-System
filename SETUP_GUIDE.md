# TessFrozenFood ERP System - Setup Guide

## For Non-Technical Users (Windows)

### Important Note
This is a private thesis prototype. Please contact the developer for access to the project files and installation instructions.

### Prerequisites
1. **Node.js Installation**
   - Visit [https://nodejs.org/](https://nodejs.org/)
   - Download the "LTS" version
   - Run the installer and follow the default options
   - Restart your computer after installation

### Installation Steps

#### Option 1: Using Setup Script (Recommended)
1. **Get the Project Files**
   - Contact the developer for access to the project files
   - You'll receive a ZIP file containing the project
   - Extract the ZIP file to a folder on your computer

2. **Run the Setup**
   - Open the extracted folder
   - Double-click on `setup.bat`
   - Wait for the installation to complete
   - Press any key to close the window when done

3. **Start the Application**
   - In the same folder, hold Shift + Right-click
   - Select "Open PowerShell window here" or "Open in Terminal"
   - Type: `npm run dev` and press Enter
   - The application will open automatically in your browser

#### Option 2: Manual Setup

1. **Open Command Prompt**
   - Press `Windows + R`
   - Type `cmd` and press Enter

2. **Navigate to Project Folder**
   ```
   cd path\to\project\folder
   ```
   (Replace the path with where you extracted the project)

3. **Install Dependencies**
   ```
   npm install
   ```

4. **Start the Application**
   ```
   npm run dev
   ```
   - The application will open in your default browser
   - If it doesn't, go to: http://localhost:3000

## Troubleshooting

### If you see errors:
1. **Node.js not found**
   - Make sure Node.js is installed
   - Restart your computer after installation

2. **Port 3000 is in use**
   - Close other applications that might be using port 3000
   - Or contact IT support to change the port

3. **Installation takes too long**
   - This is normal for the first time
   - It might take 2-5 minutes depending on your internet speed


---
*This is an academic prototype developed as part of a thesis project.*
