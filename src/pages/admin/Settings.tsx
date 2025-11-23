import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { userService } from '@/services/storage';

const Settings = () => {
  const [adminData, setAdminData] = useState({
    name: '',
    password: '',
    confirmPassword: ''
  });
  
  const [adminError, setAdminError] = useState('');
  const [adminSuccess, setAdminSuccess] = useState('');

  const handleAdminChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAdminData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    setAdminSuccess('');

    // Basic validation
    if (!adminData.name || !adminData.password || !adminData.confirmPassword) {
      setAdminError('All fields are required');
      return;
    }

    if (adminData.password !== adminData.confirmPassword) {
      setAdminError('Passwords do not match');
      return;
    }

    if (adminData.password.length < 8) {
      setAdminError('Password must be at least 8 characters long');
      return;
    }

    try {
      // Call the storage service to create a new admin
      const result = userService.createAdmin(
        adminData.name, // Using name as username
        adminData.password,
        adminData.name
      );

      if ('error' in result) {
        setAdminError(result.error);
        return;
      }

      setAdminSuccess('Admin user created successfully!');
      setAdminData({
        name: '',
        password: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error creating admin:', error);
      setAdminError('Failed to create admin. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">Admin Settings</h1>
      
      {/* Create Admin Section */}
      <div className="bg-white shadow-lg rounded-xl overflow-hidden mb-8 border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-800">Create New Admin</h2>
          <p className="text-sm text-gray-500 mt-1">Add a new administrator to manage the system</p>
        </div>
        
        <form onSubmit={handleCreateAdmin} className="p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Username
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="name"
                  value={adminData.name}
                  onChange={handleAdminChange}
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    adminError && !adminData.name 
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  } focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors`}
                  placeholder="Username"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  name="password"
                  value={adminData.password}
                  onChange={handleAdminChange}
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    adminError && !adminData.password 
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  } focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors`}
                  placeholder="••••••••"
                />
                <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters long</p>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Confirm Password
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  name="confirmPassword"
                  value={adminData.confirmPassword}
                  onChange={handleAdminChange}
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    adminError && !adminData.confirmPassword 
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  } focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors`}
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>
          
          {/* Status Messages */}
          <div className="mt-6 space-y-3">
            {adminError && (
              <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded-r">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-red-700">{adminError}</span>
                </div>
              </div>
            )}
            
            {adminSuccess && (
              <div className="p-3 bg-green-50 border-l-4 border-green-500 rounded-r">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-green-700">{adminSuccess}</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-6 flex justify-end">
            <Button
              type="submit"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Admin
            </Button>
          </div>
        </form>
      </div>
      
      {/* System Information Section */}
      <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-800">System Information</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-700">App Version</span>
              <span className="text-sm text-gray-600">1.0.0</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-700">Last Updated</span>
              <span className="text-sm text-gray-600">October 8, 2025</span>
            </div>
            <div className="pt-2">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Developed by:</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• ABUYUAN, JAN LEIKA P.</li>
                <li>• BALUYOT, ALTHEA A.</li>
                <li>• CHAN, JUKIHAME D.</li>
                <li>• GO, JOHN CARLO</li>
                <li>• PRADO, BEDNALYN JODY P.</li>
                <li>• PORTENTO, MARK JAMES C.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
