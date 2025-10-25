import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useKV } from '@github/spark/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, PencilSimple, Trash, Users } from '@phosphor-icons/react';
import { Client } from '@/types';
import { toast } from 'sonner';

export default function Clients() {
  const { t } = useTranslation();
  const [clients, setClients] = useKV<Client[]>('clients', []);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    vat_number: '',
    email: '',
    phone: '',
    notes: '',
  });

  const filteredClients = useMemo(() => {
    if (!searchTerm) return clients || [];
    const term = searchTerm.toLowerCase();
    return (clients || []).filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term) ||
        c.vat_number.toLowerCase().includes(term)
    );
  }, [clients, searchTerm]);

  const handleOpenDialog = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name,
        address: client.address,
        vat_number: client.vat_number,
        email: client.email,
        phone: client.phone,
        notes: client.notes,
      });
    } else {
      setEditingClient(null);
      setFormData({
        name: '',
        address: '',
        vat_number: '',
        email: '',
        phone: '',
        notes: '',
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

    if (editingClient) {
      setClients((prev) =>
        (prev || []).map((c) =>
          c.id === editingClient.id
            ? { ...c, ...formData, updated_at: now }
            : c
        )
      );
      toast.success('Client updated');
    } else {
      const newClient: Client = {
        id: `client_${Date.now()}`,
        ...formData,
        created_at: now,
        updated_at: now,
      };
      setClients((prev) => [...(prev || []), newClient]);
      toast.success('Client created');
    }

    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm(t('clients.confirmDelete'))) {
      setClients((prev) => (prev || []).filter((c) => c.id !== id));
      toast.success('Client deleted');
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold">{t('clients.title')}</h1>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2" />
          {t('clients.newClient')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('clients.title')}</CardTitle>
          <CardDescription>Manage your client database</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder={t('clients.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {filteredClients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto mb-4 text-muted-foreground" size={48} />
              <p className="text-lg font-medium mb-2">{t('clients.noClients')}</p>
              <p className="text-sm text-muted-foreground mb-4">{t('clients.addFirst')}</p>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2" />
                {t('clients.newClient')}
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('clients.name')}</TableHead>
                  <TableHead>{t('clients.email')}</TableHead>
                  <TableHead>{t('clients.phone')}</TableHead>
                  <TableHead>{t('clients.vatNumber')}</TableHead>
                  <TableHead className="text-right">{t('clients.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>{client.phone}</TableCell>
                    <TableCell className="font-mono text-sm">{client.vat_number}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(client)}
                      >
                        <PencilSimple />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(client.id)}
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
              {editingClient ? t('clients.edit') : t('clients.newClient')}
            </DialogTitle>
            <DialogDescription>
              {editingClient ? 'Edit client information' : 'Add a new client to your database'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('clients.name')}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">{t('clients.address')}</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('clients.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t('clients.phone')}</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vat_number">{t('clients.vatNumber')}</Label>
              <Input
                id="vat_number"
                value={formData.vat_number}
                onChange={(e) => setFormData({ ...formData, vat_number: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{t('clients.notes')}</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {t('clients.cancel')}
            </Button>
            <Button onClick={handleSave}>{t('clients.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
