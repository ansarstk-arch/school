import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { PageHeader } from "@/components/erp/PageHeader";
import { StatCard } from "@/components/erp/StatCard";
import { FilterBar } from "@/components/erp/FilterBar";
import { AgGridTable } from "@/components/erp/AgGridTable";
import { ErpModal } from "@/components/erp/ErpModal";
import { ConfirmDelete } from "@/components/erp/ConfirmDelete";
import { Input } from "@/components/ui/Input";
import { ShamsiDatePicker } from "@/components/erp/ShamsiDatePicker";
import { currentShamsiYear, todayIsoDate } from "@/lib/afghan-date";
import { toast } from "sonner";
import { Plus, ShoppingCart, Package, Eye, Pencil, Trash2 } from "lucide-react";
import * as inventoryApi from "@/data/inventoryApi";

const SEL = "w-full border border-input rounded px-2 py-1.5 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring";

const F = ({ label, opt, error, children }) => (
  <label className="flex flex-col gap-1">
    <span className="text-xs text-muted-foreground">
      {label}
      {opt && <span className="opacity-40 ml-1">(اختیاري)</span>}
    </span>
    {children}
    {error && <span className="text-[11px] text-destructive mt-0.5">{error}</span>}
  </label>
);

const ITEM_FILTERS = [
  { key: "id", label: "ID", type: "input", placeholder: "ID..." },
  { key: "name", label: "د توکي نوم", type: "input", placeholder: "نوم..." },
  { key: "academicYear", label: "تعلیمي کال", type: "shamsiYear", placeholder: "تعلیمي کال" },
  { key: "lowStock", label: "د سټاک حالت", type: "select", options: [
    { value: "", label: "ټول" },
    { value: "false", label: "نورمال" }, 
    { value: "true", label: "کم سټاک" }
  ]},
];
const SALES_FILTERS = [
  { key: "itemName", label: "د توکي نوم", type: "input", placeholder: "نوم..." },
  { key: "academicYear", label: "تعلیمي کال", type: "shamsiYear", placeholder: "تعلیمي کال" },
];

const EMPTY_ITEM = {
  name: "",
  description: "",
  academicYear: String(currentShamsiYear()),
  purchasePrice: "",
  salePrice: "",
  stockQuantity: "",
  lowStockThreshold: "5",
};

// ─── Validation ────────────────────────────────────────────────────────────────

const validateItem = (data) => {
  const errors = {};
  
  // Name validation
  if (!data.name?.trim()) {
    errors.name = "د توکي نوم اړین دی";
  } else if (data.name.length < 2 || data.name.length > 120) {
    errors.name = "نوم باید د ۲ څخه تر ۱۲۰ توري پورې وي";
  }
  
  // Purchase price validation - NOW REQUIRED
  if (!data.purchasePrice || data.purchasePrice === "") {
    errors.purchasePrice = "د اخیستلو بیه اړینه ده";
  } else if (isNaN(data.purchasePrice) || Number(data.purchasePrice) < 0) {
    errors.purchasePrice = "د اخیستلو بیه باید مثبت عدد وي";
  }
  
  // Sale price validation
  if (!data.salePrice || data.salePrice === "") {
    errors.salePrice = "د خرڅلاو بیه اړینه ده";
  } else if (isNaN(data.salePrice) || Number(data.salePrice) < 0) {
    errors.salePrice = "بیه باید مثبت عدد وي";
  }
  
  // Stock quantity validation
  if (!data.stockQuantity || data.stockQuantity === "") {
    errors.stockQuantity = "د سټاک مقدار اړین دی";
  } else if (isNaN(data.stockQuantity) || Number(data.stockQuantity) < 0) {
    errors.stockQuantity = "سټاک باید صفر یا مثبت عدد وي";
  }
  
  // Low stock threshold validation (optional)
  if (data.lowStockThreshold && data.lowStockThreshold !== "") {
    if (isNaN(data.lowStockThreshold) || Number(data.lowStockThreshold) < 0) {
      errors.lowStockThreshold = "د کم سټاک حد باید صفر یا مثبت عدد وي";
    }
  }
  
  return errors;
};

const validateSale = (data, selectedItem) => {
  const errors = {};
  
  // Item validation
  if (!data.itemId) {
    errors.itemId = "توکی اړین دی";
  }
  
  // Quantity validation
  if (!data.quantity || data.quantity === "") {
    errors.quantity = "تعداد اړین دی";
  } else if (isNaN(data.quantity) || Number(data.quantity) <= 0) {
    errors.quantity = "تعداد باید له صفر څخه لوی وي";
  } else if (selectedItem && Number(data.quantity) > Number(selectedItem.stockQuantity)) {
    errors.quantity = `موجوده سټاک ${selectedItem.stockQuantity} دی`;
  }
  
  // Discount validation (optional)
  if (data.discount && data.discount !== "") {
    if (isNaN(data.discount) || Number(data.discount) < 0) {
      errors.discount = "تخفیف باید صفر یا مثبت عدد وي";
    }
  }
  
  // Date validation
  if (!data.saleDate) {
    errors.saleDate = "نېټه اړینه ده";
  }
  
  // Academic year validation
  if (!data.academicYear) {
    errors.academicYear = "تعلیمي کال اړین دی";
  }
  
  return errors;
};

export default function InventoryPage() {
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const defaultLowStock = query.get("lowStock") === "true" ? "true" : "";

  const [stats, setStats] = useState(null);
  const [items, setItems] = useState([]);
  const [saleItems, setSaleItems] = useState([]);
  const [sales, setSales] = useState([]);
  const [itemPage, setItemPage] = useState(1);
  const [itemPagination, setItemPagination] = useState({ total: 0, totalPages: 0, page: 1, limit: 10 });
  const [salesPage, setSalesPage] = useState(1);
  const [salesPagination, setSalesPagination] = useState({ total: 0, totalPages: 0, page: 1, limit: 10 });
  const [itemsLoading, setItemsLoading] = useState(false);
  const [salesLoading, setSalesLoading] = useState(false);
  const [itemFilters, setItemFilters] = useState({ academicYear: String(currentShamsiYear()), lowStock: defaultLowStock });
  const [salesFilters, setSalesFilters] = useState({ academicYear: String(currentShamsiYear()) });

  const [itemOpen, setItemOpen] = useState(false);
  const [saleOpen, setSaleOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewSaleOpen, setViewSaleOpen] = useState(false);
  const [editSaleOpen, setEditSaleOpen] = useState(false);
  const [deleteSaleOpen, setDeleteSaleOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedSale, setSelectedSale] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [editingSale, setEditingSale] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  const [viewingSale, setViewingSale] = useState(null);
  const [itemForm, setItemForm] = useState(EMPTY_ITEM);
  const [itemErrors, setItemErrors] = useState({});
  const [saleForm, setSaleForm] = useState({
    itemId: "",
    quantity: "",
    discount: "0",
    saleDate: todayIsoDate(),
    academicYear: String(currentShamsiYear()),
    notes: "",
  });
  const [saleErrors, setSaleErrors] = useState({});
  
  // Item search for sale
  const [itemSearchQuery, setItemSearchQuery] = useState("");
  const [itemSearchResults, setItemSearchResults] = useState([]);
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const [pickedSaleItem, setPickedSaleItem] = useState(null);

  const selectedSaleItem = useMemo(() => 
    pickedSaleItem ||
    itemSearchResults.find((i) => String(i.id) === String(saleForm.itemId)) ||
    saleItems.find((i) => String(i.id) === String(saleForm.itemId)), 
    [pickedSaleItem, itemSearchResults, saleItems, saleForm.itemId]
  );

  const selectSaleItem = (item) => {
    setPickedSaleItem(item);
    setSaleForm((s) => ({ ...s, itemId: String(item.id) }));
    setItemSearchQuery("");
    setItemSearchResults([]);
    setShowItemDropdown(false);
    setSaleErrors((e) => ({ ...e, itemId: "" }));
  };
  const saleGross = (Number(selectedSaleItem?.salePrice || 0) * Number(saleForm.quantity || 0));
  const saleNet = Math.max(0, saleGross - Number(saleForm.discount || 0));
  
  // Search items for sale dropdown
  const searchItems = async (query) => {
    if (!query || query.length < 2) {
      setItemSearchResults([]);
      setShowItemDropdown(false);
      return;
    }
    
    try {
      const response = await inventoryApi.getInventoryItems({
        name: query,
        academicYear: String(currentShamsiYear()),
        page: 1,
        limit: 10,
      });
      setItemSearchResults(response.data.items || []);
      setShowItemDropdown(true);
    } catch (error) {
      setItemSearchResults([]);
    }
  };
  
  // Debounced search — skip while an item is already selected
  useEffect(() => {
    if (pickedSaleItem) {
      setShowItemDropdown(false);
      return;
    }

    const timer = setTimeout(() => {
      if (itemSearchQuery) {
        searchItems(itemSearchQuery);
      } else {
        setItemSearchResults([]);
        setShowItemDropdown(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [itemSearchQuery, pickedSaleItem]);

  const loadStats = async () => {
    try {
      const response = await inventoryApi.getInventoryStats({ academicYear: itemFilters.academicYear });
      setStats(response.data);
    } catch {
      setStats(null);
    }
  };

  const loadItems = async () => {
    try {
      setItemsLoading(true);
      const response = await inventoryApi.getInventoryItems({ ...itemFilters, page: itemPage, limit: 10 });
      setItems(response.data.items || []);
      setItemPagination(response.data.pagination || { total: 0, totalPages: 0, page: 1, limit: 10 });
    } catch (error) {
      toast.error(error.message || "د توکو لیست ترلاسه نه شو");
    } finally {
      setItemsLoading(false);
    }
  };

  const loadSaleItems = async () => {
    try {
      const response = await inventoryApi.getInventoryItems({
        academicYear: String(currentShamsiYear()),
        page: 1,
        limit: 500,
      });
      setSaleItems(response.data.items || []);
    } catch {
      setSaleItems([]);
    }
  };

  const loadSales = async () => {
    try {
      setSalesLoading(true);
      const response = await inventoryApi.getInventorySales({ ...salesFilters, page: salesPage, limit: 10 });
      setSales(response.data.sales || []);
      setSalesPagination(response.data.pagination || { total: 0, totalPages: 0, page: 1, limit: 10 });
    } catch (error) {
      toast.error(error.message || "د خرڅلاو لیست ترلاسه نه شو");
    } finally {
      setSalesLoading(false);
    }
  };

  useEffect(() => { loadStats(); }, [itemFilters.academicYear]);
  useEffect(() => { loadItems(); }, [JSON.stringify(itemFilters), itemPage]);
  useEffect(() => { loadSales(); }, [JSON.stringify(salesFilters), salesPage]);
  useEffect(() => { loadSaleItems(); }, []);

  const openNewItem = () => {
    setEditingItem(null);
    setItemForm({ ...EMPTY_ITEM, academicYear: String(currentShamsiYear()) });
    setItemErrors({});
    setItemOpen(true);
  };

  const openEditItem = (item) => {
    setEditingItem(item);
    setItemForm({
      name: item.name || "",
      description: item.description || "",
      academicYear: item.academicYear || String(currentShamsiYear()),
      purchasePrice: String(item.purchasePrice ?? ""),
      salePrice: String(item.salePrice ?? ""),
      stockQuantity: String(item.stockQuantity ?? ""),
      lowStockThreshold: String(item.lowStockThreshold ?? 5),
    });
    setItemErrors({});
    setItemOpen(true);
  };
  
  const openViewItem = async (item) => {
    setViewingItem(item);
    setViewOpen(true);
    
    // Load sales data for this item
    try {
      const response = await inventoryApi.getInventorySales({
        itemId: item.id,
        academicYear: item.academicYear,
        page: 1,
        limit: 1000, // Get all sales
      });
      
      const itemSales = response.data.sales || [];
      const totalSold = itemSales.reduce((sum, sale) => sum + Number(sale.quantity), 0);
      const totalRevenue = itemSales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
      
      setViewingItem({
        ...item,
        totalSold,
        totalRevenue,
        salesCount: itemSales.length,
      });
    } catch (error) {
      console.error("Error loading item sales:", error);
    }
  };

  const saveItem = async () => {
    // Validate
    const errors = validateItem(itemForm);
    if (Object.keys(errors).length > 0) {
      setItemErrors(errors);
      return;
    }
    
    try {
      const payload = {
        ...itemForm,
        purchasePrice: Number(itemForm.purchasePrice || 0),
        salePrice: Number(itemForm.salePrice),
        stockQuantity: Number(itemForm.stockQuantity),
        lowStockThreshold: Number(itemForm.lowStockThreshold || 5),
      };
      if (editingItem) {
        await inventoryApi.updateInventoryItem(editingItem.id, payload);
        toast.success("توکی تازه شو");
      } else {
        await inventoryApi.createInventoryItem(payload);
        toast.success("توکی ثبت شو");
      }
      setItemOpen(false);
      setItemErrors({});
      await Promise.all([loadItems(), loadSaleItems(), loadStats()]);
    } catch (error) {
      toast.error(error.message || "توکی ثبت نه شو");
    }
  };

  const deleteItem = async () => {
    if (!selectedItem) return;
    try {
      await inventoryApi.deleteInventoryItem(selectedItem.id);
      toast.success("توکی حذف شو");
      setDeleteOpen(false);
      setSelectedItem(null);
      await Promise.all([loadItems(), loadSaleItems(), loadStats()]);
    } catch (error) {
      toast.error(error.message || "توکی حذف نه شو");
    }
  };
  
  const openViewSale = (sale) => {
    setViewingSale(sale);
    setViewSaleOpen(true);
  };
  
  const openEditSale = (sale) => {
    setEditingSale(sale);
    setSaleForm({
      itemId: String(sale.itemId),
      quantity: String(sale.quantity),
      discount: String(sale.discount || 0),
      saleDate: sale.saleDate,
      academicYear: sale.academicYear || String(currentShamsiYear()),
      notes: sale.notes || "",
    });
    setItemSearchQuery(sale.itemName || "");
    setSaleErrors({});
    setEditSaleOpen(true);
  };
  
  const deleteSale = async () => {
    if (!selectedSale) return;
    try {
      await inventoryApi.deleteInventorySale(selectedSale.id);
      toast.success("خرڅلاو حذف شو");
      setDeleteSaleOpen(false);
      setSelectedSale(null);
      await Promise.all([loadItems(), loadSaleItems(), loadSales(), loadStats()]);
    } catch (error) {
      toast.error(error.message || "خرڅلاو حذف نه شو");
    }
  };

  const saveSale = async () => {
    // Validate
    const errors = validateSale(saleForm, selectedSaleItem);
    if (Object.keys(errors).length > 0) {
      setSaleErrors(errors);
      return;
    }
    
    try {
      const payload = {
        ...saleForm,
        itemId: Number(saleForm.itemId),
        quantity: Number(saleForm.quantity),
        discount: Number(saleForm.discount || 0),
      };
      
      if (editingSale) {
        await inventoryApi.updateInventorySale(editingSale.id, payload);
        toast.success("خرڅلاو تازه شو");
        setEditSaleOpen(false);
      } else {
        await inventoryApi.createInventorySale(payload);
        toast.success("خرڅلاو ثبت شو");
        setSaleOpen(false);
      }
      
      setSaleForm({
        itemId: "",
        quantity: "",
        discount: "0",
        saleDate: todayIsoDate(),
        academicYear: String(currentShamsiYear()),
        notes: "",
      });
      setSaleErrors({});
      setEditingSale(null);
      setItemSearchQuery("");
      setItemSearchResults([]);
      setShowItemDropdown(false);
      await Promise.all([loadItems(), loadSaleItems(), loadSales(), loadStats()]);
    } catch (error) {
      toast.error(error.message || "خرڅلاو ثبت نه شو");
    }
  };

  const itemColumns = useMemo(() => [
    { field: "name", headerName: "د توکي نوم", flex: 1.2, minWidth: 170 },
    { field: "salePrice", headerName: "د خرڅلاو بیه", flex: 0.8, minWidth: 110, valueFormatter: (p) => `${Number(p.value || 0)} AFN` },
    { field: "stockQuantity", headerName: "سټاک", flex: 0.6, minWidth: 90 },
    { field: "lowStockThreshold", headerName: "کم سټاک حد", flex: 0.7, minWidth: 110 },
    {
      field: "status",
      headerName: "حالت",
      flex: 0.8,
      minWidth: 100,
      valueGetter: (p) => (Number(p.data.stockQuantity) <= Number(p.data.lowStockThreshold) ? "کم" : "نورمال"),
      cellRenderer: (p) => {
        const isLow = Number(p.data.stockQuantity) <= Number(p.data.lowStockThreshold);
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${isLow ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'}`}>
            {isLow ? 'کم' : 'نورمال'}
          </span>
        );
      },
    },
    {
      field: "actions",
      headerName: "",
      flex: 0.8,
      minWidth: 120,
      sortable: false,
      filter: false,
      cellRenderer: (params) => {
        const item = params.data;
        return (
          <div className="flex items-center gap-1">
            <button 
              onClick={(e) => { e.stopPropagation(); openViewItem(item); }} 
              title="کتل" 
              className="p-1.5 rounded hover:bg-muted text-muted-foreground"
            >
              <Eye className="size-3.5" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); openEditItem(item); }} 
              title="سمول" 
              className="p-1.5 rounded hover:bg-muted text-muted-foreground"
            >
              <Pencil className="size-3.5" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setSelectedItem(item); setDeleteOpen(true); }} 
              title="ړنګول" 
              className="p-1.5 rounded hover:bg-muted text-destructive"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        );
      },
    },
  ], []);

  const salesColumns = useMemo(() => [
    { field: "itemName", headerName: "توکی", flex: 1.2, minWidth: 170 },
    { field: "quantity", headerName: "تعداد", flex: 0.6, minWidth: 90 },
    { field: "unitPrice", headerName: "بیه", flex: 0.7, minWidth: 90, valueFormatter: (p) => `${Number(p.value || 0)} AFN` },
    { field: "discount", headerName: "تخفیف", flex: 0.7, minWidth: 90, valueFormatter: (p) => `${Number(p.value || 0)} AFN` },
    { field: "totalAmount", headerName: "ټول", flex: 0.8, minWidth: 100, valueFormatter: (p) => `${Number(p.value || 0)} AFN` },
    { field: "saleDate", headerName: "نېټه", flex: 0.8, minWidth: 110 },
    {
      field: "actions",
      headerName: "",
      flex: 0.8,
      minWidth: 120,
      sortable: false,
      filter: false,
      cellRenderer: (params) => {
        const sale = params.data;
        return (
          <div className="flex items-center gap-1">
            <button 
              onClick={(e) => { e.stopPropagation(); openViewSale(sale); }} 
              title="کتل" 
              className="p-1.5 rounded hover:bg-muted text-muted-foreground"
            >
              <Eye className="size-3.5" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); openEditSale(sale); }} 
              title="سمول" 
              className="p-1.5 rounded hover:bg-muted text-muted-foreground"
            >
              <Pencil className="size-3.5" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setSelectedSale(sale); setDeleteSaleOpen(true); }} 
              title="ړنګول" 
              className="p-1.5 rounded hover:bg-muted text-destructive"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        );
      },
    },
  ], []);

  return (
    <div className="space-y-4">
      <PageHeader
        title="د قرطاسیې او توکو سټاک"
        subtitle="د توکو ثبت، سټاک او خرڅلاو اداره"
        actions={
          <div className="flex items-center gap-2">
            <button onClick={openNewItem} className="text-xs border border-input rounded px-3 py-1.5 hover:bg-muted flex items-center gap-1.5"><Plus className="size-3.5" /> نوی توکی</button>
            <button onClick={() => setSaleOpen(true)} className="text-xs bg-primary text-primary-foreground rounded px-3 py-1.5 flex items-center gap-1.5"><ShoppingCart className="size-3.5" /> خرڅلاو</button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard label="ټول توکي" value={String(stats?.totalItems || 0)} icon={<Package className="size-5" />} accent="info" />
        <StatCard label="میاشتنی عاید" value={`${Number(stats?.monthlyRevenue || 0)} AFN`} icon={<ShoppingCart className="size-5" />} accent="success" />
        <StatCard label="کلنی عاید" value={`${Number(stats?.yearlyRevenue || 0)} AFN`} icon={<ShoppingCart className="size-5" />} accent="success" />
      </div>

      <FilterBar
        filters={ITEM_FILTERS}
        defaultValues={{ academicYear: String(currentShamsiYear()), lowStock: defaultLowStock }}
        onApply={(v) => { setItemFilters(v); setItemPage(1); }}
        onClear={() => { setItemFilters({ academicYear: String(currentShamsiYear()) }); setItemPage(1); }}
      />

      <AgGridTable
        columnDefs={itemColumns}
        rowData={items}
        loading={itemsLoading}
        emptyText="هیڅ توکی ونه موندل شو"
        searchPlaceholder="د توکي نوم..."
        serverSidePagination={true}
        pageSize={itemPagination.limit || 10}
        totalRows={itemPagination.total}
        currentPage={itemPage}
        totalPages={itemPagination.totalPages}
        onPageChange={setItemPage}
      />

      <div className="pt-2 border-t border-border" />
      <h3 className="text-sm font-semibold">د خرڅ شوو توکو لیست</h3>

      <FilterBar
        filters={SALES_FILTERS}
        defaultValues={{ academicYear: String(currentShamsiYear()) }}
        onApply={(v) => { setSalesFilters(v); setSalesPage(1); }}
        onClear={() => { setSalesFilters({ academicYear: String(currentShamsiYear()) }); setSalesPage(1); }}
      />

      <AgGridTable
        columnDefs={salesColumns}
        rowData={sales}
        loading={salesLoading}
        emptyText="هیڅ خرڅلاو ونه موندل شو"
        searchPlaceholder="د خرڅلاو لټون..."
        serverSidePagination={true}
        pageSize={salesPagination.limit || 10}
        totalRows={salesPagination.total}
        currentPage={salesPage}
        totalPages={salesPagination.totalPages}
        onPageChange={setSalesPage}
      />

      <ErpModal
        open={itemOpen}
        onOpenChange={setItemOpen}
        title={editingItem ? "توکی سمول" : "نوی توکی"}
        size="md"
        footer={
          <>
            <button onClick={() => setItemOpen(false)} className="px-3 py-1.5 text-sm border border-input rounded hover:bg-muted">لغوه</button>
            <button onClick={saveItem} className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded font-medium">ثبتول</button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <F label="د توکي نوم" error={itemErrors.name}>
              <Input value={itemForm.name} handleChanges={(e) => setItemForm((s) => ({ ...s, name: e.target.value }))} placeholder="د توکي نوم" />
            </F>
          </div>
          
          <F label="د اخیستلو بیه" error={itemErrors.purchasePrice}>
            <Input type="number" value={itemForm.purchasePrice} handleChanges={(e) => setItemForm((s) => ({ ...s, purchasePrice: e.target.value }))} placeholder="د اخیستلو بیه" />
          </F>
          
          <F label="د خرڅلاو بیه" error={itemErrors.salePrice}>
            <Input type="number" value={itemForm.salePrice} handleChanges={(e) => setItemForm((s) => ({ ...s, salePrice: e.target.value }))} placeholder="د خرڅلاو بیه" />
          </F>
          
          <F label="سټاک مقدار" error={itemErrors.stockQuantity}>
            <Input type="number" value={itemForm.stockQuantity} handleChanges={(e) => setItemForm((s) => ({ ...s, stockQuantity: e.target.value }))} placeholder="سټاک" />
          </F>
          
          <F label="کم سټاک حد" opt error={itemErrors.lowStockThreshold}>
            <Input type="number" value={itemForm.lowStockThreshold} handleChanges={(e) => setItemForm((s) => ({ ...s, lowStockThreshold: e.target.value }))} placeholder="کم سټاک حد" />
          </F>
          
          <div className="col-span-2">
            <F label="تفصیل" opt>
              <textarea 
                value={itemForm.description} 
                onChange={(e) => setItemForm((s) => ({ ...s, description: e.target.value }))} 
                placeholder="د توکي تفصیل"
                className="w-full border border-input rounded px-2 py-1.5 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring min-h-[60px]"
              />
            </F>
          </div>
        </div>
      </ErpModal>

      <ErpModal
        open={saleOpen}
        onOpenChange={(open) => {
          setSaleOpen(open);
          if (!open) {
            setItemSearchQuery("");
            setPickedSaleItem(null);
            setItemSearchResults([]);
            setShowItemDropdown(false);
            setSaleErrors({});
          }
        }}
        title="خرڅلاو ثبتول"
        size="md"
        footer={
          <>
            <button onClick={() => setSaleOpen(false)} className="px-3 py-1.5 text-sm border border-input rounded hover:bg-muted">لغوه</button>
            <button onClick={saveSale} className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded font-medium">ثبتول</button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <F label="توکی لټون" error={saleErrors.itemId}>
              <div className="relative">
                <Input 
                  value={pickedSaleItem ? pickedSaleItem.name : itemSearchQuery} 
                  handleChanges={(e) => {
                    setItemSearchQuery(e.target.value);
                    setPickedSaleItem(null);
                    setSaleForm((s) => ({ ...s, itemId: "" }));
                  }}
                  placeholder="د توکي نوم ولیکئ..."
                />
                {selectedSaleItem && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    موجوده سټاک: {selectedSaleItem.stockQuantity} | بیه: {selectedSaleItem.salePrice} AFN
                  </div>
                )}
                {showItemDropdown && itemSearchResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                    {itemSearchResults.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectSaleItem(item)}
                        className="w-full px-3 py-2 text-right hover:bg-muted border-b border-border last:border-0 text-sm"
                      >
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-muted-foreground">
                          سټاک: {item.stockQuantity} | بیه: {item.salePrice} AFN
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </F>
          </div>
          
          <F label="تعداد" error={saleErrors.quantity}>
            <Input type="number" value={saleForm.quantity} handleChanges={(e) => setSaleForm((s) => ({ ...s, quantity: e.target.value }))} placeholder="تعداد" />
          </F>
          
          <F label="تخفیف" opt error={saleErrors.discount}>
            <Input type="number" value={saleForm.discount} handleChanges={(e) => setSaleForm((s) => ({ ...s, discount: e.target.value }))} placeholder="تخفیف" />
          </F>
          
          <F label="د خرڅلاو نېټه" error={saleErrors.saleDate}>
            <ShamsiDatePicker 
              value={saleForm.saleDate} 
              onChange={(d) => setSaleForm((s) => ({ ...s, saleDate: d }))} 
            />
          </F>
          
          <F label="یادښت" opt>
            <textarea 
              value={saleForm.notes} 
              onChange={(e) => setSaleForm((s) => ({ ...s, notes: e.target.value }))} 
              placeholder="یادښت"
              className="w-full border border-input rounded px-2 py-1.5 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </F>
          
          {selectedSaleItem && (
            <div className="col-span-2 border border-border rounded p-3 text-sm bg-muted/30">
              <div className="flex justify-between mb-1">
                <span>مجموعه:</span>
                <span className="font-medium">{saleGross} AFN</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>تخفیف:</span>
                <span className="font-medium text-destructive">-{Number(saleForm.discount || 0)} AFN</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border">
                <span className="font-semibold">وروستۍ بیه:</span>
                <span className="font-bold text-lg text-success">{saleNet} AFN</span>
              </div>
            </div>
          )}
        </div>
      </ErpModal>

      <ConfirmDelete
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={deleteItem}
        title={selectedItem?.name}
      />
      
      {/* Delete Sale Confirmation */}
      <ConfirmDelete
        open={deleteSaleOpen}
        onClose={() => setDeleteSaleOpen(false)}
        onConfirm={deleteSale}
        title={`د ${selectedSale?.itemName} خرڅلاو`}
      />
      
      {/* Edit Sale Modal */}
      <ErpModal
        open={editSaleOpen}
        onOpenChange={(open) => {
          setEditSaleOpen(open);
          if (!open) {
            setEditingSale(null);
            setItemSearchQuery("");
            setPickedSaleItem(null);
            setItemSearchResults([]);
            setShowItemDropdown(false);
            setSaleErrors({});
          }
        }}
        title="خرڅلاو سمول"
        size="md"
        footer={
          <>
            <button onClick={() => setEditSaleOpen(false)} className="px-3 py-1.5 text-sm border border-input rounded hover:bg-muted">لغوه</button>
            <button onClick={saveSale} className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded font-medium">ثبتول</button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <F label="توکی لټون" error={saleErrors.itemId}>
              <div className="relative">
                <Input 
                  value={pickedSaleItem ? pickedSaleItem.name : itemSearchQuery} 
                  handleChanges={(e) => {
                    setItemSearchQuery(e.target.value);
                    setPickedSaleItem(null);
                    setSaleForm((s) => ({ ...s, itemId: "" }));
                  }}
                  placeholder="د توکي نوم ولیکئ..."
                />
                {selectedSaleItem && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    موجوده سټاک: {selectedSaleItem.stockQuantity} | بیه: {selectedSaleItem.salePrice} AFN
                  </div>
                )}
                {showItemDropdown && itemSearchResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                    {itemSearchResults.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectSaleItem(item)}
                        className="w-full px-3 py-2 text-right hover:bg-muted border-b border-border last:border-0 text-sm"
                      >
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-muted-foreground">
                          سټاک: {item.stockQuantity} | بیه: {item.salePrice} AFN
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </F>
          </div>
          
          <F label="تعداد" error={saleErrors.quantity}>
            <Input type="number" value={saleForm.quantity} handleChanges={(e) => setSaleForm((s) => ({ ...s, quantity: e.target.value }))} placeholder="تعداد" />
          </F>
          
          <F label="تخفیف" opt error={saleErrors.discount}>
            <Input type="number" value={saleForm.discount} handleChanges={(e) => setSaleForm((s) => ({ ...s, discount: e.target.value }))} placeholder="تخفیف" />
          </F>
          
          <F label="د خرڅلاو نېټه" error={saleErrors.saleDate}>
            <ShamsiDatePicker 
              value={saleForm.saleDate} 
              onChange={(d) => setSaleForm((s) => ({ ...s, saleDate: d }))} 
            />
          </F>
          
          <F label="یادښت" opt>
            <textarea 
              value={saleForm.notes} 
              onChange={(e) => setSaleForm((s) => ({ ...s, notes: e.target.value }))} 
              placeholder="یادښت"
              className="w-full border border-input rounded px-2 py-1.5 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </F>
          
          {selectedSaleItem && (
            <div className="col-span-2 border border-border rounded p-3 text-sm bg-muted/30">
              <div className="flex justify-between mb-1">
                <span>مجموعه:</span>
                <span className="font-medium">{saleGross} AFN</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>تخفیف:</span>
                <span className="font-medium text-destructive">-{Number(saleForm.discount || 0)} AFN</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border">
                <span className="font-semibold">وروستۍ بیه:</span>
                <span className="font-bold text-lg text-success">{saleNet} AFN</span>
              </div>
            </div>
          )}
        </div>
      </ErpModal>
      
      {/* View Sale Modal */}
      <ErpModal
        open={viewSaleOpen}
        onOpenChange={setViewSaleOpen}
        title="د خرڅلاو معلومات"
        size="md"
        footer={
          <button onClick={() => setViewSaleOpen(false)} className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded font-medium">تړل</button>
        }
      >
        {viewingSale && (
          <div className="space-y-4">
            <div className="border border-border rounded-lg p-4 bg-muted/30">
              <h4 className="text-sm font-semibold mb-3 text-primary">د خرڅلاو تفصیل</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">توکی:</span>
                  <p className="font-medium">{viewingSale.itemName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">نېټه:</span>
                  <p className="font-medium">{viewingSale.saleDate}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">تعداد:</span>
                  <p className="font-bold text-lg">{viewingSale.quantity}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">د واحد بیه:</span>
                  <p className="font-medium">{Number(viewingSale.unitPrice || 0)} AFN</p>
                </div>
                <div>
                  <span className="text-muted-foreground">مجموعه:</span>
                  <p className="font-medium">{Number(viewingSale.quantity) * Number(viewingSale.unitPrice)} AFN</p>
                </div>
                <div>
                  <span className="text-muted-foreground">تخفیف:</span>
                  <p className="font-medium text-destructive">{Number(viewingSale.discount || 0)} AFN</p>
                </div>
                <div className="col-span-2 pt-2 border-t border-border">
                  <span className="text-muted-foreground">ټوله بیه:</span>
                  <p className="font-bold text-xl text-success">{Number(viewingSale.totalAmount || 0)} AFN</p>
                </div>
                {viewingSale.notes && (
                  <div className="col-span-2 pt-2 border-t border-border">
                    <span className="text-muted-foreground">یادښت:</span>
                    <p className="text-sm mt-1">{viewingSale.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </ErpModal>
      
      {/* View Item Modal */}
      <ErpModal
        open={viewOpen}
        onOpenChange={setViewOpen}
        title="د توکي معلومات"
        size="md"
        footer={
          <button onClick={() => setViewOpen(false)} className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded font-medium">تړل</button>
        }
      >
        {viewingItem && (
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="border border-border rounded-lg p-4 bg-muted/30">
              <h4 className="text-sm font-semibold mb-3 text-primary">بنسټیز معلومات</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">نوم:</span>
                  <p className="font-medium">{viewingItem.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">تعلیمي کال:</span>
                  <p className="font-medium">{viewingItem.academicYear}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">د اخیستلو بیه:</span>
                  <p className="font-medium">{Number(viewingItem.purchasePrice || 0)} AFN</p>
                </div>
                <div>
                  <span className="text-muted-foreground">د خرڅلاو بیه:</span>
                  <p className="font-medium text-success">{Number(viewingItem.salePrice || 0)} AFN</p>
                </div>
              </div>
              {viewingItem.description && (
                <div className="mt-3 pt-3 border-t border-border">
                  <span className="text-muted-foreground text-sm">تفصیل:</span>
                  <p className="text-sm mt-1">{viewingItem.description}</p>
                </div>
              )}
            </div>
            
            {/* Stock Info */}
            <div className="border border-border rounded-lg p-4 bg-muted/30">
              <h4 className="text-sm font-semibold mb-3 text-primary">د سټاک معلومات</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">موجوده سټاک:</span>
                  <p className="font-bold text-lg">{viewingItem.stockQuantity}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">کم سټاک حد:</span>
                  <p className="font-medium">{viewingItem.lowStockThreshold}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">حالت:</span>
                  <p>
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      Number(viewingItem.stockQuantity) <= Number(viewingItem.lowStockThreshold)
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-success/10 text-success'
                    }`}>
                      {Number(viewingItem.stockQuantity) <= Number(viewingItem.lowStockThreshold) ? 'کم سټاک - بیا رسول ته اړتیا ده' : 'نورمال سټاک'}
                    </span>
                  </p>
                </div>
              </div>
            </div>
            
            {/* Sales Statistics */}
            <div className="border border-border rounded-lg p-4 bg-muted/30">
              <h4 className="text-sm font-semibold mb-3 text-primary">د خرڅلاو احصایې</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">ټول خرڅ شوی:</span>
                  <p className="font-bold text-lg text-info">{viewingItem.totalSold || 0}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">د خرڅلاو شمېر:</span>
                  <p className="font-medium">{viewingItem.salesCount || 0}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">ټول عاید:</span>
                  <p className="font-bold text-xl text-success">{Number(viewingItem.totalRevenue || 0).toLocaleString()} AFN</p>
                </div>
              </div>
            </div>
            
            {/* Profit Calculation (if purchase price exists) */}
            {viewingItem.purchasePrice > 0 && viewingItem.totalSold > 0 && (
              <div className="border border-border rounded-lg p-4 bg-success/5">
                <h4 className="text-sm font-semibold mb-3 text-success">ګټه</h4>
                <div className="text-sm">
                  <div className="flex justify-between mb-2">
                    <span className="text-muted-foreground">ټول خرڅ شوی:</span>
                    <span className="font-medium">{viewingItem.totalSold}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-muted-foreground">د اخیستلو ټوله بیه:</span>
                    <span className="font-medium">{(Number(viewingItem.purchasePrice) * Number(viewingItem.totalSold)).toLocaleString()} AFN</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-muted-foreground">د خرڅلاو ټوله بیه:</span>
                    <span className="font-medium">{Number(viewingItem.totalRevenue || 0).toLocaleString()} AFN</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border">
                    <span className="font-semibold">خالصه ګټه:</span>
                    <span className="font-bold text-lg text-success">
                      {(Number(viewingItem.totalRevenue || 0) - (Number(viewingItem.purchasePrice) * Number(viewingItem.totalSold))).toLocaleString()} AFN
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </ErpModal>
    </div>
  );
}
