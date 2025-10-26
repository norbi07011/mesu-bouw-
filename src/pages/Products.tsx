import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useKV } from '@github/spark/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, PencilSimple, Trash, Package } from '@phosphor-icons/react';
import { Product } from '@/types';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/invoice-utils';

export default function Products() {
  const { t, i18n } = useTranslation();
  const [products, setProducts] = useKV<Product[]>('products', []);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    unit_price: 0,
    vat_rate: 21,
  });

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products || [];
    const term = searchTerm.toLowerCase();
    return (products || []).filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.code.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term)
    );
  }, [products, searchTerm]);

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        code: product.code,
        name: product.name,
        description: product.description,
        unit_price: product.unit_price,
        vat_rate: product.vat_rate,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        code: '',
        name: '',
        description: '',
        unit_price: 0,
        vat_rate: 21,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name) {
      toast.error('Name is required');
      return;
    }

    const now = new Date().toISOString();

    if (editingProduct) {
      setProducts((prev) =>
        (prev || []).map((p) =>
          p.id === editingProduct.id
            ? { ...p, ...formData, updated_at: now }
            : p
        )
      );
      toast.success('Product updated');
    } else {
      const newProduct: Product = {
        id: `product_${Date.now()}`,
        ...formData,
        created_at: now,
        updated_at: now,
      };
      setProducts((prev) => [...(prev || []), newProduct]);
      toast.success('Product created');
    }

    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm(t('products.confirmDelete'))) {
      setProducts((prev) => (prev || []).filter((p) => p.id !== id));
      toast.success('Product deleted');
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold">{t('products.title')}</h1>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2" />
          {t('products.newProduct')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('products.title')}</CardTitle>
          <CardDescription>Manage your product and service catalog</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder={t('products.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto mb-4 text-muted-foreground" size={48} />
              <p className="text-lg font-medium mb-2">{t('products.noProducts')}</p>
              <p className="text-sm text-muted-foreground mb-4">{t('products.addFirst')}</p>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2" />
                {t('products.newProduct')}
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('products.code')}</TableHead>
                  <TableHead>{t('products.name')}</TableHead>
                  <TableHead>{t('products.description')}</TableHead>
                  <TableHead className="text-right">{t('products.unitPrice')}</TableHead>
                  <TableHead className="text-right">{t('products.vatRate')}</TableHead>
                  <TableHead className="text-right">{t('products.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-mono text-sm">{product.code}</TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{product.description}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(product.unit_price, i18n.language)}</TableCell>
                    <TableCell className="text-right font-mono">{product.vat_rate}%</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(product)}
                      >
                        <PencilSimple />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? t('products.edit') : t('products.newProduct')}
            </DialogTitle>
            <DialogDescription>
              {editingProduct ? 'Edit product information' : 'Add a new product or service'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">{t('products.code')}</Label>
                <Input
                  id="code"
                  placeholder="PROD-001"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">{t('products.name')} *</Label>
                <Input
                  id="name"
                  placeholder="Rioolreiniging"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('products.description')}</Label>
              <Input
                id="description"
                placeholder="Professionele rioolreiniging incl. materiaal"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit_price">{t('products.unitPrice')} (EUR) *</Label>
                <Input
                  id="unit_price"
                  type="number"
                  step="0.01"
                  placeholder="1500.00"
                  value={formData.unit_price}
                  onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vat_rate">{t('products.vatRate')} (%) *</Label>
                <Input
                  id="vat_rate"
                  type="number"
                  step="0.01"
                  placeholder="21"
                  value={formData.vat_rate}
                  onChange={(e) => setFormData({ ...formData, vat_rate: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {t('products.cancel')}
            </Button>
            <Button onClick={handleSave}>{t('products.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
