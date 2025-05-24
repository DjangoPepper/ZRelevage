# Relevage Project

## Overview
Relevage is a React application built with TypeScript that allows users to manage tables imported from Excel files. The application provides functionalities for uploading Excel files, parsing their contents, and displaying the data in a user-friendly table format.

## Features
- Upload Excel files from your local disk.
- Parse Excel data using the `xlsx` library.
- Display the parsed data in a structured table format.
- Responsive design for better user experience.

## Project Structure
```
relevage
├── src
│   ├── components
│   │   └── TableManager.tsx
│   ├── utils
│   │   └── excelParser.ts
│   ├── App.tsx
│   ├── index.tsx
│   └── styles
│       └── App.css
├── public
│   ├── index.html
├── package.json
├── tsconfig.json
└── README.md
```

## Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd relevage
   ```
3. Install the dependencies:
   ```
   npm install
   ```

## Usage
1. Start the development server:
   ```
   npm start
   ```
2. Open your browser and go to `http://localhost:3000` to view the application.
3. Use the file upload feature to select and import your Excel files.

## Dependencies
- React
- TypeScript
- xlsx

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License
This project is licensed under the MIT License.