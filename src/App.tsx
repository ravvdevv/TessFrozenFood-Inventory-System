import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/admin/Dashboard';
import Inventory from './pages/admin/Inventory';
import AdminProduction from './pages/admin/AdminProduction';
import Settings from './pages/admin/Settings';
import NewSale from './pages/admin/NewSale';
import EmployeeDashboard from './pages/employee/Dashboard';
import { EmployeeInventory } from './pages/employee/Inventory';
import EmployeeSalary from './pages/employee/EmployeeSalary';
import Login from './pages/Login';
import { EmployeeRoute } from './components/auth/EmployeeRoute';
import { AdminRoute } from './components/auth/AdminRoute';
import './index.css';
import SalaryManagement from './pages/admin/SalaryManagement';
import EmployeeProduction from './pages/employee/EmployeeProduction';
import { Analytics } from "@vercel/analytics/react"
// Role-based route protection is handled by AdminRoute and EmployeeRoute components

function App() {
  return (
    <AuthProvider>
      <Analytics />
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AppLayout userType="admin">
                <Outlet />
              </AppLayout>
            </AdminRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="salaries" element={<SalaryManagement />} />
          <Route path="production" element={<AdminProduction />} />
          <Route path="sales/new" element={<NewSale />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Employee Routes */}
        <Route
          path="/employee"
          element={
            <EmployeeRoute>
              <AppLayout userType="employee">
                <Outlet />
              </AppLayout>
            </EmployeeRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<EmployeeDashboard />} />
          <Route path="production" element={<EmployeeProduction />} />
          <Route path="inventory" element={<EmployeeInventory />} />
          <Route path="salary" element={<EmployeeSalary />} />
        </Route>

        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
