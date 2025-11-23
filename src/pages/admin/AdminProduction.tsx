import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface ProductionEntry {
  id: string;
  date: string;
  employeeId: string;
  itemName: string;
  quantity: number;
  unit: string;
  totalEarnings: number;
  paymentStatus?: string;
  status?: string;
  employeeName?: string;
}

export default function AdminProduction() {
  const [productions, setProductions] = useState<ProductionEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  // Date range and employee selection are currently not used in the UI
  // These are kept for future use
  const [, /* setDateRange */] = useState("7days");
  const [, /* setSelectedEmployee */] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<ProductionEntry | null>(null);

  // Load production records from localStorage
  useEffect(() => {
    const loadProductions = () => {
      try {
        const storedData = localStorage.getItem('tess_production_records');
        const data = storedData ? JSON.parse(storedData) : [];
        setProductions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error loading production records:", err);
        setError("Failed to load production records");
      } finally {
        setIsLoading(false);
      }
    };  

    loadProductions();
    window.addEventListener('storage', loadProductions);
    return () => window.removeEventListener('storage', loadProductions);
  }, []);

  // Handle delete production record
  const handleDeleteRecord = () => {
    if (!recordToDelete) return;
    
    try {
      const updatedProductions = productions.filter(
        (p) => p.id !== recordToDelete.id
      );
      
      localStorage.setItem('tess_production_records', JSON.stringify(updatedProductions));
      setProductions(updatedProductions);
      setRecordToDelete(null);
      setError(null);
    } catch (err) {
      console.error("Error deleting production record:", err);
      setError("Failed to delete production record");
    }
  };

  // Filter productions based on search term and filters
  const filteredProductions = useMemo(() => {
    return productions.filter(entry => {
      const matchesSearch = 
        entry.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.employeeName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = 
        statusFilter === "all" || entry.paymentStatus === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [productions, searchTerm, statusFilter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Production Records</h1>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by item or employee..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
        
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Status</option>
            <option value="unpaid">Unpaid</option>
            <option value="paid">Paid</option>
            <option value="processing">Processing</option>
          </select>
        </div>
      </div>

      {/* Production Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Production Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-red-500 p-4 bg-red-50 rounded-lg">
              {error}
            </div>
          ) : filteredProductions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No production records found
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Qty</TableHead>
  
                    
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>                    
                    <TableHead >Actions</TableHead>


                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProductions.map((entry: ProductionEntry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        {new Date(entry.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{entry.employeeName}</TableCell>
                      <TableCell>{entry.itemName}</TableCell>
                      <TableCell>
                        {entry.quantity} {entry.unit}
                      </TableCell>
                      <TableCell>
                        ₱{Number(entry.totalEarnings).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            !entry.paymentStatus || entry.paymentStatus === 'unpaid' ? 'outline' :
                            entry.status === 'paid' ? 'default' : 'secondary'
                          }
                          className={
                            !entry.paymentStatus || entry.paymentStatus === 'unpaid' ? 'bg-yellow-100 text-yellow-800' :
                            entry.status === 'paid' ? 'bg-green-100 text-green-800' :
                            'bg-blue-100 text-blue-800'
                          }
                        >
                          {entry.status ? 
                            entry.status.charAt(0).toUpperCase() + entry.status.slice(1) : 
                            'Unpaid'
                          }
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:bg-red-50 hover:text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRecordToDelete(entry);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!recordToDelete}
        onOpenChange={(open: boolean) => !open && setRecordToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Production Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this production record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteRecord}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
