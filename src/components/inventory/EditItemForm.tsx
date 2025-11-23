import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Product } from "@/services/storage";

interface EditItemFormProps {
  item: Product;
  onEditItem: (item: Product) => void;
  onCancel: () => void;
  existingSkus: string[];
}

export const EditItemForm = ({ item, onEditItem, onCancel, existingSkus }: EditItemFormProps) => {
  const [skuError, setSkuError] = useState<string | null>(null);
  const [category, setCategory] = useState(item.category || '');

  const validateSku = (sku: string): boolean => {
    if (existingSkus.includes(sku)) {
      setSkuError('SKU already exists. Please enter a unique SKU.');
      return false;
    }
    setSkuError(null);
    return true;
  };

  const handleSkuChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sku = e.target.value;
    if (sku !== item.sku) {  // Only validate if SKU has changed
      validateSku(sku);
    } else {
      setSkuError(null);
    }
  };
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const sku = formData.get("sku") as string;
    
    // Only validate SKU if it has changed
    if (sku !== item.sku && !validateSku(sku)) {
      return; // Don't submit if SKU is not valid
    }
    
    const updatedItem = {
      ...item,
      name: formData.get("name") as string,
      category: formData.get("category") as string,
      quantity: Number(formData.get("quantity")),
      price: Number(formData.get("price")),
      sku: sku,
    };
    onEditItem(updatedItem);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Item Name</Label>
          <Input id="name" name="name" defaultValue={item.name} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sku">SKU</Label>
          <Input 
            id="sku" 
            name="sku" 
            defaultValue={item.sku} 
            required 
            onChange={handleSkuChange}
          />
          {skuError && <p className="text-sm text-red-500">{skuError}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input 
            id="category" 
            name="category" 
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Enter category"
            required 
          />
          <p className="text-xs text-gray-500 mt-1">Enter a category for this item</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity</Label>
          <Input id="quantity" name="quantity" type="number" defaultValue={item.quantity} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price">Price (₱)</Label>
          <Input 
            id="price" 
            name="price" 
            type="number" 
            step="0.01" 
            min="0" 
            defaultValue={item.price}
            placeholder="0.00" 
            required 
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Save Changes</Button>
        </div>
      </div>
    </form>
  );
};
