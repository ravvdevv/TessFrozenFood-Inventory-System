import { useState, useEffect, useMemo } from "react";
import { Plus, Search, Package, Edit, Trash2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AddItemForm } from "@/components/inventory/AddItemForm";
import { EditItemForm } from "@/components/inventory/EditItemForm";
import { inventoryService } from "@/services/storage";
import type { Product } from "@/services/storage";

const Inventory = () => {
  const [inventoryItems, setInventoryItems] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Product | null>(null);
  
  // Get unique categories from inventory items
  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    inventoryItems.forEach(item => {
      if (item.category) {
        categorySet.add(item.category);
      }
    });
    return Array.from(categorySet).sort();
  }, [inventoryItems]);

  // Load inventory items on component mount
  useEffect(() => {
    const fetchInventory = () => {
      try {
        const items = inventoryService.getAll();
        setInventoryItems(items);
      } catch (error) {
        console.error('Error fetching inventory:', error);
      }
    };

    fetchInventory();
    
    // Listen for storage changes to sync between tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'tess_inventory') {
        fetchInventory();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const filteredInventoryItems = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    return inventoryItems.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      
      return matchesSearch && matchesCategory && (statusFilter === "all" ? true : matchesStatus);
    });
  }, [inventoryItems, searchTerm, categoryFilter, statusFilter]);
  const handleAddItem = async (newItem: Omit<Product, 'id' | 'lastUpdated' | 'status'>) => {
    try {
      // Calculate status based on quantity
      const status = newItem.quantity <= 0 
        ? 'out-of-stock' as const 
        : newItem.quantity <= 10 
          ? 'low-stock' as const 
          : 'in-stock' as const;
          
      const product = await inventoryService.create({
        ...newItem,
        status,
        lastUpdated: new Date().toISOString()
      });
      
      setInventoryItems([...inventoryItems, product]);
    } catch (error) {
      console.error('Error adding item:', error);
      throw error; // Re-throw to handle in the form
    }
    setShowAddItemForm(false);
  };

  const handleEditItem = (item: Product) => {
    setEditingItem(item);
  };

  const handleUpdateItem = async (updatedItem: Product) => {
    try {
      // Calculate status based on quantity
      const status = updatedItem.quantity <= 0 
        ? 'out-of-stock' as const 
        : updatedItem.quantity <= 10 
          ? 'low-stock' as const 
          : 'in-stock' as const;
          
      const updatedProduct = await inventoryService.update(updatedItem.id, {
        ...updatedItem,
        status,
        lastUpdated: new Date().toISOString()
      } as Product);
      
      if (updatedProduct) {
        setInventoryItems(inventoryItems.map((item) => 
          item.id === updatedProduct.id ? updatedProduct : item
        ));
      }
    } catch (error) {
      console.error('Error updating item:', error);
      throw error; // Re-throw to handle in the form
    }
    setEditingItem(null);
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const success = await inventoryService.delete(id);
      if (success) {
        setInventoryItems(inventoryItems.filter((item) => item.id !== id));
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      throw error; // Re-throw to handle in the UI
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">
            Manage your products and stock levels
          </p>
        </div>
        <Button className="gap-2" onClick={() => setShowAddItemForm(true)}>
          <Plus className="h-4 w-4" />
          Add New Item
        </Button>
      </div>
      {showAddItemForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add New Product</CardTitle>
            <CardDescription>Fill in the details below to add a new product to the inventory.</CardDescription>
          </CardHeader>
          <CardContent>
            <AddItemForm 
              onAddItem={handleAddItem} 
              onCancel={() => setShowAddItemForm(false)}
              existingSkus={inventoryItems.map(item => item.sku).filter(Boolean) as string[]}
            />
          </CardContent>
        </Card>
      )}

      {editingItem && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Edit Product</CardTitle>
          </CardHeader>
          <CardContent>
            <EditItemForm
              item={editingItem}
              onEditItem={handleUpdateItem}
              onCancel={() => setEditingItem(null)}
              existingSkus={inventoryItems
                .filter(item => item.id !== editingItem.id) // Exclude current item's SKU
                .map(item => item.sku)
                .filter(Boolean) as string[]}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Products</CardTitle>
              <CardDescription>Manage your inventory items and stock levels</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by name or SKU..."
                  className="pl-8 w-full md:w-[200px] lg:w-[300px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="in-stock">In Stock</SelectItem>
                  <SelectItem value="low-stock">Low Stock</SelectItem>
                  <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">SKU</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventoryItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      <Package className="mx-auto h-12 w-12 mb-2 opacity-20" />
                      <p>No products found</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {inventoryItems.length === 0 
                          ? 'Get started by adding your first product' 
                          : 'Try adjusting your search or filter criteria'}
                      </p>
                      {inventoryItems.length === 0 && (
                        <Button 
                          className="mt-4" 
                          onClick={() => setShowAddItemForm(true)}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Product
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInventoryItems.map((item) => (
                    <TableRow 
                      key={item.id} 
                      className={`
                        ${item.quantity <= (item.criticalLevel || 5) ? 'bg-amber-50 dark:bg-amber-950/20' : ''}
                        ${item.expiryDate && new Date(item.expiryDate) < new Date() ? 'bg-red-50 dark:bg-red-950/20' : ''}
                      `}
                    >
                      <TableCell className="font-medium">{item.sku}</TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-muted-foreground/30">
                          {item.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ₱{Number(item.price).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {item.quantity <= (item.criticalLevel || 5) && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                          <span className={item.quantity <= (item.criticalLevel || 5) ? 'font-semibold text-amber-600 dark:text-amber-400' : ''}>
                            {item.quantity} {item.quantity <= (item.criticalLevel || 5) && <span className="text-xs text-muted-foreground">(min: {item.criticalLevel})</span>}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            item.expiryDate && new Date(item.expiryDate) < new Date() ? 'destructive' :
                            item.status === 'out-of-stock' ? 'destructive' : 
                            item.status === 'low-stock' ? 'outline' : 'default'
                          } 
                          className="gap-1"
                        >
                          {item.expiryDate && new Date(item.expiryDate) < new Date() ? (
                            <span className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" /> Expired
                            </span>
                          ) : item.status === 'out-of-stock' ? (
                            'Out of Stock'
                          ) : item.status === 'low-stock' ? (
                            <span className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" /> Low Stock
                            </span>
                          ) : 'In Stock'}
                        </Badge>
                      </TableCell>
                      <TableCell className="w-32 pr-4">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 rounded-md hover:bg-accent/50 transition-colors"
                            onClick={() => handleEditItem(item)}
                            title="Edit item"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0 rounded-md text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
                            onClick={() => handleDeleteItem(item.id)}
                            title="Delete item"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Inventory;
