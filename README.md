# TessFrozenFood ERP System (Thesis Prototype)

A comprehensive ERP system prototype for TessFrozenFoods, developed as part of an academic thesis. This system demonstrates modern web technologies in enterprise resource planning, with a focus on inventory management for frozen food products.

## 🎓 Academic Focus

This prototype demonstrates:
- Modern web technologies in ERP systems
- Real-time inventory management
- Responsive UI/UX design
- Type-safe development with TypeScript
- Component-based architecture

## 🚀 Key Features

### Inventory Management
- 🏷️ Product catalog with categories
- 📊 Real-time stock level monitoring
- 📅 Expiration date tracking
- 🔄 Low stock alerts

### User Interface
- 📱 Fully responsive design
- 🎨 Clean, intuitive dashboard
- ⚡ Fast and smooth interactions
- 🔍 Advanced search and filtering

## 🛠️ System Requirements

- Node.js 16 or higher
- Modern web browser (Chrome, Firefox, Edge, or Safari)
- 4GB RAM (minimum)
- 1GB free disk space

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ravvdevv/TessFrozenFood-Inventory-System.git
   cd TessFrozenFood-Inventory-System
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn
   # or
   pnpm install
   # or (if using bun)
   bun install
   ```

## Development

1. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun run dev
   ```

2. **Open in browser**
   The application will be available at [http://localhost:3000](http://localhost:3000)

## Building for Production

1. **Create a production build**
   ```bash
   npm run build
   # or
   yarn build
   # or
   pnpm build
   # or
   bun run build
   ```

2. **Preview the production build**
   ```bash
   npm run preview
   # or
   yarn preview
   # or
   pnpm preview
   # or
   bun run preview
   ```

## Deployment

This project is configured for deployment on Vercel. To deploy:

1. Push your code to a GitHub repository
2. Import the repository to Vercel
3. The project will be automatically built and deployed

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Page components
├── hooks/         # Custom React hooks
├── utils/         # Utility functions
└── App.tsx        # Main application component

```

## Technologies Used

- ⚛️ React 18+
- 🎨 Shadcn UI
- 📜 TypeScript
- ⚡ Vite
- 🎨 Tailwind CSS
- 🔄 React Router
- 📱 Responsive Design

---

## Getting Started

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/ravvdevv/TessFrozenFood-Inventory-System.git
   cd TessFrozenFood-Inventory-System
   ```

2. **Install dependencies** (choose one):
   ```bash
   # Using npm (recommended)
   npm install
   
   # Or using yarn
   yarn
   ```

3. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Access the application**
   Open [http://localhost:3000](http://localhost:3000) in your browser

## System Requirements

- Node.js 16 or higher
- Modern web browser (Chrome, Firefox, Edge, or Safari)
- 4GB RAM (minimum)
- 1GB free disk space

## Troubleshooting

If you encounter any issues during setup:

1. **Node.js version issues**
   ```bash
   # Check Node.js version
   node -v
   # Should be 16.x or higher
   ```

2. **Dependency installation issues**
   ```bash
   # Clear npm cache
   npm cache clean --force
   
   # Remove node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Port already in use**
   If port 3000 is in use, you can change it by modifying the `vite.config.ts` file.

---

## Contributing

We welcome contributions to this project! If you'd like to contribute, please follow these steps:
1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Make your changes and ensure they adhere to the project's coding standards.
4. Submit a pull request with a clear description of your changes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

Built with ❤️ for TessFrozenFoods | Academic Prototype# TessFrozenFood-Inventory-System