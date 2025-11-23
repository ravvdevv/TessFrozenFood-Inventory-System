import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, type UserRole } from '../context/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

type LoginRole = Extract<UserRole, 'admin' | 'employee'>;

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<LoginRole>('admin');
  const [showPassword, setShowPassword] = useState(false);
  
  // Signup modal state
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [signupData, setSignupData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [signupError, setSignupError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState('');

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSignupData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');
    setSignupSuccess('');

    // Basic validation
    if (!signupData.username || !signupData.password || !signupData.confirmPassword) {
      setSignupError('All fields are required');
      return;
    }

    if (signupData.password !== signupData.confirmPassword) {
      setSignupError('Passwords do not match');
      return;
    }

    if (signupData.password.length < 8) {
      setSignupError('Password must be at least 8 characters long');
      return;
    }

    try {
      // Get existing users
      const users = JSON.parse(localStorage.getItem('tess_users') || '[]');
      
      // Check if username already exists
      if (users.some((user: any) => user.username === signupData.username)) {
        setSignupError('Username already exists');
        return;
      }

      const userId = Date.now().toString();
      
      // Create new user (in a real app, you would hash the password)
      const newUser = {
        id: userId,
        username: signupData.username,
        password: signupData.password, // In production, hash this password
        role: 'employee', // Default to employee role
        name: signupData.username,
        createdAt: new Date().toISOString()
      };

      // Create employee record
      const employees = JSON.parse(localStorage.getItem('tess_employees') || '[]');
      const newEmployee = {
        id: userId,
        name: signupData.username,
        username: signupData.username,
        position: 'Staff', // Default position
        department: 'Operations', // Default department
        status: 'active',
        hireDate: new Date().toISOString(),
        baseSalary: 0, // Default base salary, can be updated later
        paymentMethod: 'Cash', // Default payment method
        contact: {
          email: '',
          phone: ''
        },
        address: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save user and employee records to local storage
      localStorage.setItem('tess_users', JSON.stringify([...users, newUser]));
      localStorage.setItem('tess_employees', JSON.stringify([...employees, newEmployee]));
      
      // We're not creating a default production record anymore
      // to avoid showing zero-quantity entries in the production view
      
      setSignupSuccess('Account created successfully! You can now log in.');
      
      // Reset form and close modal after 2 seconds
      setTimeout(() => {
        setSignupData({ username: '', password: '', confirmPassword: '' });
        setSignupSuccess('');
        setIsSignupOpen(false);
      }, 2000);
      
    } catch (error) {
      console.error('Signup error:', error);
      setSignupError('Failed to create account. Please try again.');
    }
  };

  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const targetPath = user.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard';
      navigate(targetPath, { replace: true });
    }
  }, [user, navigate, from]); // Added 'from' to the dependency array

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Basic validation
    if (!username.trim() || !password) {
      setError('Please enter both username and password');
      return;
    }

    setIsLoading(true);

    try {
      const success = await login(username, password, activeTab);
      if (!success) {
        // If login fails, check if the username exists but password is wrong
        const users = JSON.parse(localStorage.getItem('tess_users') || '[]');
        const userExists = users.some((user: any) => user.username === username);
        
        if (userExists) {
          setError('Incorrect password. Please try again.');
        } else {
          setError(`No ${activeTab} account found with that username.`);
        }
      }
      // If success, the useEffect will handle the redirection
    } catch (err) {
      setError('An error occurred during login');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as LoginRole);
    setError('');
    setUsername('');
    setPassword('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center">
          <img 
            src="/android-chrome-512x512.png" 
            alt="Tess Frozen Foods Logo" 
            className="h-24 w-24 mx-auto"
          />
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-center">
            {activeTab === 'admin' ? 'Admin Portal' : 'Employee Portal'}
          </h2>
          <p className="text-sm text-muted-foreground text-center">
            Sign in to continue to {activeTab === 'admin' ? 'admin' : 'employee'} dashboard
          </p>
        </div>

        <Tabs 
          value={activeTab} 
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="admin">Admin</TabsTrigger>
            <TabsTrigger value="employee">Employee</TabsTrigger>
          </TabsList>
          <TabsContent value={activeTab}>

            {error && (
              <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm mb-4">
                {error}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">
                    {activeTab === 'admin' ? 'Admin Username' : 'Employee Username'}
                  </Label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={activeTab === 'admin' ? 'Enter admin username' : 'Enter employee username'}
                    disabled={isLoading}
                    autoComplete="username"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">
                      Password
                    </Label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-sm text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={isLoading}
                      autoComplete="current-password"
                      className="pr-10"
                    />
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading || !username.trim() || !password}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : `Sign in as ${activeTab}`}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="text-center text-sm text-muted-foreground space-y-2">
          <p>
            {activeTab === 'admin' 
              ? 'Employee? Switch to employee login.' 
              : 'Admin? Switch to admin login.'}
          </p>
          
          <Dialog open={isSignupOpen} onOpenChange={setIsSignupOpen}>
            <DialogTrigger asChild>
              <button 
                className="text-blue-600 hover:underline cursor-pointer focus:outline-none"
                onClick={() => setSignupError('')}
              >
                Create an account?
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-center mb-2">Create Account</DialogTitle>
                <p className="text-sm text-gray-500 text-center mb-6">Sign up as Employee</p>
              </DialogHeader>
              
              {signupError && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md mb-4 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {signupError}
                </div>
              )}
              
              {signupSuccess && (
                <div className="p-3 bg-green-50 text-green-700 text-sm rounded-md mb-4 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {signupSuccess}
                </div>
              )}
              
              <form onSubmit={handleSignupSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-username">Username</Label>
                  <Input
                    id="signup-username"
                    name="username"
                    type="text"
                    value={signupData.username}
                    onChange={handleSignupChange}
                    className="w-full"
                    placeholder="Choose a username"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    value={signupData.password}
                    onChange={handleSignupChange}
                    className="w-full"
                    placeholder="Create a password"
                    required
                  />
                  <p className="text-xs text-gray-500">Must be at least 8 characters</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    name="confirmPassword"
                    type="password"
                    value={signupData.confirmPassword}
                    onChange={handleSignupChange}
                    className="w-full"
                    placeholder="Confirm your password"
                    required
                  />
                </div>
                
                <Button type="submit" className="w-full">
                  Create Account
                </Button>
              </form>
              
              <p className="text-xs text-gray-500 text-center mt-4">
                By creating an account, you agree to our Terms of Service and Privacy Policy
              </p>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
