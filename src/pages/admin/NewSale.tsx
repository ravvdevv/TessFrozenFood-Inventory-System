import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Minus, Trash2, ShoppingCart, ArrowLeft } from "lucide-react";
import { inventoryService, salesService } from "@/services/storage";

// Define the necessary types
interface CartItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
  lastUpdated: string;
}

type PaymentMethod = 'cash' | 'card' | 'gcash' | 'bank_transfer';

const NewSale: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Load products from storage
  useEffect(() => {
    const loadProducts = () => {
      try {
        const items = inventoryService.getAll();
        setProducts(items);
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, []);

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    
    const existingItem = cart.find((item) => item.productId === selectedProduct.id);
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.productId === selectedProduct.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          productId: selectedProduct.id,
          name: selectedProduct.name,
          price: selectedProduct.price,
          quantity: quantity,
        },
      ]);
    }
    setSelectedProduct(null);
    setQuantity(1);
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.productId !== productId));
  };

  const handleCompleteSale = async () => {
    if (cart.length === 0) return;

    try {
      // First, validate all items have sufficient stock
      for (const item of cart) {
        const product = products.find(p => p.id === item.productId);
        if (!product) {
          throw new Error(`Product ${item.name} not found`);
        }
        if (product.quantity < item.quantity) {
          throw new Error(`Insufficient stock for ${item.name}. Available: ${product.quantity}`);
        }
      }

      // Process inventory updates
      for (const item of cart) {
        const product = products.find(p => p.id === item.productId)!;
        const newQuantity = product.quantity - item.quantity;
        
        await inventoryService.update(product.id, {
          ...product,
          quantity: newQuantity,
          status: newQuantity <= 0 ? 'out-of-stock' : newQuantity <= 10 ? 'low-stock' : 'in-stock',
          lastUpdated: new Date().toISOString()
        });
      }

      // Create the sale record
      const newSale = await salesService.create({
        items: cart,
        total: cart.reduce((sum: number, item) => sum + item.price * item.quantity, 0),
        customerName: customerName || "Walk-in Customer",
        paymentMethod: paymentMethod,
        status: 'completed'
      });

      // Clear cart and reset form
      setCart([]);
      setCustomerName("");
      setPaymentMethod('cash');
      
      // Refresh products to reflect updated quantities
      const updatedProducts = inventoryService.getAll();
      setProducts(updatedProducts);
      
      // Show success message and navigate
      alert(`Sale completed successfully! Total: ₱${newSale.total.toFixed(2)}`);
      navigate("/sales");
      
    } catch (error) {
      console.error('Error completing sale:', error);
      alert(error instanceof Error ? error.message : 'Failed to complete sale');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.12;
  const total = subtotal + tax;

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">New Sale</h1>
          <p className="text-sm text-muted-foreground">Add products to create a new sale</p>
        </div>
        <Button onClick={() => navigate(-1)} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Products</CardTitle>
              <CardDescription>Select products to add to the cart</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 space-y-2">
                  <Select 
                    value={selectedProduct?.id || ""}
                    onValueChange={(value) => {
                      const product = products.find(p => p.id === value) || null;
                      setSelectedProduct(product);
                      if (product) {
                        const maxQty = product.quantity - (cart.find(item => item.productId === product.id)?.quantity || 0);
                        setQuantity(Math.min(1, Math.max(1, maxQty)));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products
                        .filter(product => product.quantity > 0)
                        .map((product) => (
                          <SelectItem 
                            key={product.id} 
                            value={product.id}
                            disabled={product.quantity <= 0}
                          >
                            {product.name} (₱{product.price.toFixed(2)}) - {product.quantity} in stock
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  
                  {selectedProduct && (
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                        disabled={quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input 
                        type="number" 
                        min="1" 
                        max={selectedProduct.quantity - (cart.find(item => item.productId === selectedProduct.id)?.quantity || 0)}
                        value={quantity}
                        onChange={(e) => {
                          const maxQty = selectedProduct.quantity - (cart.find(item => item.productId === selectedProduct.id)?.quantity || 0);
                          const newQty = Math.max(1, Math.min(maxQty, parseInt(e.target.value) || 1));
                          setQuantity(newQty);
                        }}
                        className="w-20 text-center"
                      />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          const maxQty = selectedProduct.quantity - (cart.find(item => item.productId === selectedProduct.id)?.quantity || 0);
                          setQuantity(prev => Math.min(prev + 1, maxQty));
                        }}
                        disabled={quantity >= (selectedProduct.quantity - (cart.find(item => item.productId === selectedProduct.id)?.quantity || 0))}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <Button 
                  onClick={handleAddToCart} 
                  disabled={!selectedProduct || quantity <= 0}
                  className="mt-auto"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add to Cart
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shopping Cart</CardTitle>
              <CardDescription>
                {cart.length} item{cart.length !== 1 ? 's' : ''} in cart
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="text-center py-12 border rounded-lg bg-muted/20">
                  <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground">Your cart is empty</h3>
                  <p className="text-sm text-muted-foreground mt-1">Add products to get started</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-center">Qty</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cart.map((item, i) => (
                        <TableRow key={`${item.productId}-${i}`}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell className="text-right">₱{item.price.toFixed(2)}</TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right">₱{(item.price * item.quantity).toFixed(2)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveFromCart(item.productId)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Subtotal</span>
                  <span>₱{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Tax (12%)</span>
                  <span>₱{tax.toFixed(2)}</span>
                </div>
                <div className="border-t pt-4 flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-lg">₱{total.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Customer Name</label>
                  <Input
                    placeholder="Walk-in Customer"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Payment Method</label>
                  <Select 
                    value={paymentMethod} 
                    onValueChange={(value: PaymentMethod) => setPaymentMethod(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Credit/Debit Card</SelectItem>
                      <SelectItem value="gcash">GCash</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                className="w-full" 
                size="lg"
                onClick={handleCompleteSale}
                disabled={cart.length === 0}
              >
                Complete Sale
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NewSale;
