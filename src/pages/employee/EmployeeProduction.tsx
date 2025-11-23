import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Save, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useNavigate } from 'react-router-dom';

// Simple storage helper
const storage = {
  get: <T,>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error getting ${key} from localStorage:`, error);
      return defaultValue;
    }
  },
  set: <T,>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting ${key} in localStorage:`, error);
    }
  }
};

// Types
export type ProductionEntry = {
  id: string;
  date: string;
  itemName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalEarnings: number;
  status: 'pending' | 'reviewed' | 'paid';
  paymentStatus: 'unpaid' | 'processing' | 'paid';
  remarks?: string;
  submittedAt: string;
  updatedAt?: string;
  employeeId: string;
  employeeName: string;
  unit: string;
  paymentDate?: string;
  paymentMethod?: string;
  paymentNotes?: string;
};

type ProductionFormData = {
  date: string;
  itemName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  remarks: string;
  unit: string;
};

const STORAGE_KEYS = {
  PRODUCTION_RECORDS: 'tess_production_records'
} as const;

export default function EmployeeProduction() {
  const [productionEntries, setProductionEntries] = useState<ProductionEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,

  } = useForm<ProductionFormData>({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      quantity: 1,
      unitPrice: 0,
      unit: 'kg',
      category: '',
      itemName: '',
      remarks: ''
    },
  });

  // Load production entries
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedEntries = storage.get<ProductionEntry[]>(
          STORAGE_KEYS.PRODUCTION_RECORDS,
          []
        );
        
        // Filter entries for current user only
        const userEntries = user ? savedEntries.filter(entry => entry.employeeId === user.id) : [];
        setProductionEntries(userEntries);
      } catch (err) {
        console.error('Failed to load production data:', err);
        setError('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  const calculateTotal = (quantity: number, unitPrice: number): string => {
    const total = quantity * unitPrice;
    return total.toFixed(2);
  };

  const onSubmit = async (data: ProductionFormData) => {
    try {
      if (!user) {
        setError('You must be logged in to submit production entries');
        return;
      }

      setIsSubmitting(true);
      setError(null);

      const newEntry: ProductionEntry = {
        id: `prod-${user.id}-${Date.now()}`,
        ...data,
        totalEarnings: parseFloat(calculateTotal(data.quantity, data.unitPrice)),
        status: 'pending',
        paymentStatus: 'unpaid',
        submittedAt: new Date().toISOString(),
        employeeId: user.id,
        employeeName: user.name || 'Unknown Employee',
        unit: data.unit || 'pcs',
        updatedAt: new Date().toISOString()
      };

      const existingRecords = storage.get<ProductionEntry[]>(STORAGE_KEYS.PRODUCTION_RECORDS, []);
      const updatedRecords = [...existingRecords, newEntry];
      
      storage.set(STORAGE_KEYS.PRODUCTION_RECORDS, updatedRecords);
      
      setProductionEntries(prev => [...prev, newEntry]);
      
      // Reset form
      reset({
        date: new Date().toISOString().split('T')[0],
        quantity: 1,
        unitPrice: 0,
        unit: 'kg',
        category: '',
        itemName: '',
        remarks: ''
      });
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error('Error submitting form:', err);
      setError('Failed to submit production entry');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="p-4 border rounded-md bg-gray-50">
          <p className="text-gray-700">Please log in to access the production log.</p>
        </div>
      </div>
    );
  }

  const quantity = watch('quantity');
  const unitPrice = watch('unitPrice');

  return (
    <div className="space-y-6 p-6">
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Loading data...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Production Log</h1>
            <Button onClick={() => navigate(-1)} variant="outline">
              Back to Dashboard
            </Button>
          </div>

          {showSuccess && (
            <div className="p-4 border border-green-200 bg-green-50 rounded-md">
              <div className="flex items-center text-green-700">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                <span>Production entry saved successfully!</span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 border border-red-200 bg-red-50 rounded-md">
              <p className="text-red-700">{error}</p>
            </div>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle>Add New Production</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Production Date</Label>
                    <Input
                      id="date"
                      type="date"
                      {...register('date', { required: 'Date is required' })}
                    />
                    {errors.date && (
                      <p className="text-sm text-red-500">{errors.date.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="itemName">Item Name</Label>
                    <Input
                      id="itemName"
                      {...register('itemName', {
                        required: 'Item name is required',
                      })}
                      placeholder="Enter item name"
                    />
                    {errors.itemName && (
                      <p className="text-sm text-red-500">{errors.itemName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      {...register('category', {
                        required: 'Category is required',
                      })}
                      placeholder="Enter category"
                    />
                    {errors.category && (
                      <p className="text-sm text-red-500">{errors.category.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Enter the category of the item
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="0.1"
                      step="0.1"
                      {...register('quantity', {
                        required: 'Quantity is required',
                        min: { value: 0.1, message: 'Minimum quantity is 0.1' },
                        valueAsNumber: true,
                      })}
                    />
                    {errors.quantity && (
                      <p className="text-sm text-red-500">{errors.quantity.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <select
                      id="unit"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...register('unit', {
                        required: 'Unit is required',
                      })}
                    >
                      <option value="pcs">Pieces (pcs)</option>
                    </select>
                    {errors.unit && (
                      <p className="text-sm text-red-500">{errors.unit.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unitPrice">Unit Price (₱)</Label>
                    <Input
                      id="unitPrice"
                      type="number"
                      min="0.01"
                      step="0.01"
                      {...register('unitPrice', {
                        required: 'Unit price is required',
                        min: { value: 0.01, message: 'Minimum price is 0.01' },
                        valueAsNumber: true,
                      })}
                    />
                    {errors.unitPrice && (
                      <p className="text-sm text-red-500">{errors.unitPrice.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Total Amount (₱)</Label>
                    <div className="p-2 border rounded-md bg-gray-50 font-semibold">
                      ₱{calculateTotal(quantity || 0, unitPrice || 0)}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="remarks">Remarks (Optional)</Label>
                  <Input
                    id="remarks"
                    placeholder="Any additional notes or special instructions..."
                    {...register('remarks')}
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Production
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {productionEntries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>My Production History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productionEntries.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                          <TableCell>{entry.itemName}</TableCell>
                          <TableCell>
                            {entry.quantity} {entry.unit}
                          </TableCell>
                          <TableCell>₱{(entry.unitPrice || 0).toFixed(2)}</TableCell>
                          <TableCell>₱{(entry.totalEarnings || 0).toFixed(2)}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              entry.status === 'paid' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {entry.status}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
