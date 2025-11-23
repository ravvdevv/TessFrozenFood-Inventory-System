import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

type InventoryStatus = 'in-stock' | 'low-stock' | 'out-of-stock';

type Product = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  criticalLevel: number;
  category: string;
  status: InventoryStatus;
  lastUpdated: string;
  sku: string;
  expiryDate?: string;
};

interface AddItemFormProps {
  onAddItem: (item: Omit<Product, 'id' | 'status' | 'lastUpdated'>) => void;
  onCancel: () => void;
  existingSkus: string[];
}

const StatusBadge = ({ status }: { status: InventoryStatus }) => {
  const statusConfig = {
    'in-stock': { label: 'In Stock', className: 'bg-green-100 text-green-800' },
    'low-stock': { label: 'Low Stock', className: 'bg-yellow-100 text-yellow-800' },
    'out-of-stock': { label: 'Out of Stock', className: 'bg-red-100 text-red-800' }
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusConfig[status].className}`}>
      {statusConfig[status].label}
    </span>
  );
};

const statusMessages = {
  'in-stock': { 
    emoji: '✅', 
    message: 'Good stock level', 
    color: 'text-green-600' 
  },
  'low-stock': { 
    emoji: '⚠️', 
    message: 'Time to reorder soon', 
    color: 'text-yellow-600' 
  },
  'out-of-stock': { 
    emoji: '❌', 
    message: 'Needs restocking', 
    color: 'text-red-600' 
  }
};


export const AddItemForm = ({ onAddItem, onCancel, existingSkus }: AddItemFormProps) => {
  const [formData, setFormData] = useState<Omit<Product, 'id' | 'lastUpdated' | 'expiryDate'>>({
    name: '',
    price: 0,
    quantity: 0,
    criticalLevel: 10,
    category: '',
    sku: '',
    status: 'in-stock' as const
  });

  // Update status when quantity or criticalLevel changes
  useEffect(() => {
    setFormData(prev => {
      let status: InventoryStatus = 'in-stock';
      if (prev.quantity <= 0) {
        status = 'out-of-stock';
      } else if (prev.quantity <= prev.criticalLevel) {
        status = 'low-stock';
      }
      return { ...prev, status };
    });
  }, [formData.quantity, formData.criticalLevel]);
  const [skuError, setSkuError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (existingSkus.includes(formData.sku)) {
      setSkuError('SKU already exists');
      return;
    }
    onAddItem(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'quantity' || name === 'criticalLevel' 
        ? Number(value) 
        : value
    }));
  };

  const handleSkuChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, sku: value }));
    if (existingSkus.includes(value)) {
      setSkuError('SKU already exists');
    } else {
      setSkuError(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Product Name</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sku">SKU</Label>
          <div>
            <Input
              id="sku"
              name="sku"
              value={formData.sku}
              onChange={handleSkuChange}
              required
            />
            {skuError && <p className="text-xs text-red-500 mt-1">{skuError}</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="quantity">Quantity</Label>
            <StatusBadge status={formData.status} />
          </div>
          <Input
            id="quantity"
            name="quantity"
            type="number"
            value={formData.quantity}
            onChange={handleChange}
            min="0"
            required
          />
          {formData.quantity <= formData.criticalLevel && formData.quantity > 0 && (
            <p className="text-xs text-yellow-600 mt-1">
              ⚠️ Quantity is at or below critical level ({formData.criticalLevel})
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="criticalLevel">Critical Level</Label>
            <span className="text-xs text-muted-foreground">
              Alert at {formData.criticalLevel} units
            </span>
          </div>
          <Input
            id="criticalLevel"
            name="criticalLevel"
            type="number"
            value={formData.criticalLevel}
            onChange={handleChange}
            min="0"
            required
            className={formData.quantity <= formData.criticalLevel ? 'border-yellow-500' : ''}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Price (₱)</Label>
          <Input
            id="price"
            name="price"
            type="number"
            value={formData.price}
            onChange={handleChange}
            step="0.01"
            min="0"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Input
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          placeholder="Enter category"
          required
        />
        <p className="text-xs text-gray-500 mt-1">Enter a category for this item (e.g., Meat, Seafood, Frozen Food)</p>
      </div>

      <div className="flex justify-between items-center pt-4">
        <div className="text-sm text-muted-foreground">
          {formData.status === 'out-of-stock' && (
            <p className="text-red-600">⚠️ This item will be marked as out of stock</p>
          )}
        </div>

        <div className="text-xs text-muted-foreground mt-1">
  {statusMessages[formData.status].emoji} {statusMessages[formData.status].message}
</div>
        
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
  type="submit"
  disabled={formData.status === 'out-of-stock'}
  className={cn(
    "transition-all",
    formData.status === 'out-of-stock'
      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
      : "bg-blue-600 hover:bg-blue-700 text-white"
  )}
>
  {formData.status === 'out-of-stock'
    ? "Please add stock first"
    : "Add to Inventory"}
</Button>
        </div>
      </div>
    </form>
  );
};