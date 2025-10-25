import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useKV } from '@github/spark/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Upload, Image as ImageIcon } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { Company, Language } from '@/types';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const [company, setCompany] = useKV<Company>('company', {
    id: '1',
    name: 'NORBS SERVICE',
    address: 'Amsterdam, Netherlands',
    kvk: '94061629',
    vat_number: 'NL005061645B57',
    eori: '',
    iban: 'NL25INGB0109126122',
    bic: 'INGBNL2A',
    phone: '',
    phone_mobile: '',
    phone_whatsapp: '',
    website: '',
    email: 'info@norbsservice.nl',
    email_alt: '',
    bank_name: 'ING Bank',
    account_number: 'NL25INGB0109126122',
    default_payment_term_days: 7,
    default_vat_rate: 21,
    currency: 'EUR',
    logo_url: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const [formData, setFormData] = useState(company!);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be smaller than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setFormData({ ...formData, logo_url: dataUrl });
      toast.success('Logo uploaded');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!formData) return;
    setCompany((prev) => ({
      ...prev!,
      ...formData,
      updated_at: new Date().toISOString(),
    }));
    toast.success(t('settings.saved'));
  };

  const handleLanguageChange = (lang: Language) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
    toast.success(t('common.success'));
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-semibold mb-6">{t('settings.title')}</h1>

      <Tabs defaultValue="company" className="w-full">
        <TabsList>
          <TabsTrigger value="company">{t('settings.company')}</TabsTrigger>
          <TabsTrigger value="preferences">{t('settings.preferences')}</TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.company')}</CardTitle>
              <CardDescription>NORBS SERVICE company information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-start gap-6">
                  <div className="space-y-2">
                    <Label>Company Logo</Label>
                    <div className="flex items-center gap-4">
                      <Avatar className="w-24 h-24">
                        {formData.logo_url ? (
                          <AvatarImage src={formData.logo_url} alt="Company logo" />
                        ) : (
                          <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                            <ImageIcon size={32} />
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="space-y-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="mr-2" size={16} />
                          Upload Logo
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleLogoUpload}
                        />
                        <p className="text-xs text-muted-foreground">
                          PNG, JPG up to 2MB. Will appear on invoices.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('settings.name')}</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kvk">{t('settings.kvk')}</Label>
                  <Input
                    id="kvk"
                    value={formData.kvk}
                    onChange={(e) => setFormData({ ...formData, kvk: e.target.value })}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">{t('settings.address')}</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vatNumber">{t('settings.vatNumber')}</Label>
                  <Input
                    id="vatNumber"
                    value={formData.vat_number}
                    onChange={(e) => setFormData({ ...formData, vat_number: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eori">{t('settings.eori')}</Label>
                  <Input
                    id="eori"
                    value={formData.eori}
                    onChange={(e) => setFormData({ ...formData, eori: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="iban">{t('settings.iban')}</Label>
                  <Input
                    id="iban"
                    value={formData.iban}
                    onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bic">{t('settings.bic')}</Label>
                  <Input
                    id="bic"
                    value={formData.bic}
                    onChange={(e) => setFormData({ ...formData, bic: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bankName">{t('settings.bankName')}</Label>
                  <Input
                    id="bankName"
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t('settings.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emailAlt">{t('settings.emailAlt')}</Label>
                  <Input
                    id="emailAlt"
                    type="email"
                    value={formData.email_alt}
                    onChange={(e) => setFormData({ ...formData, email_alt: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{t('settings.phone')}</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneMobile">{t('settings.phoneMobile')}</Label>
                  <Input
                    id="phoneMobile"
                    value={formData.phone_mobile}
                    onChange={(e) => setFormData({ ...formData, phone_mobile: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneWhatsapp">{t('settings.phoneWhatsapp')}</Label>
                  <Input
                    id="phoneWhatsapp"
                    value={formData.phone_whatsapp}
                    onChange={(e) => setFormData({ ...formData, phone_whatsapp: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">{t('settings.website')}</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultPaymentTerm">{t('settings.defaultPaymentTerm')}</Label>
                  <Input
                    id="defaultPaymentTerm"
                    type="number"
                    value={formData.default_payment_term_days}
                    onChange={(e) => setFormData({ ...formData, default_payment_term_days: parseInt(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultVatRate">{t('settings.defaultVatRate')}</Label>
                  <Input
                    id="defaultVatRate"
                    type="number"
                    step="0.01"
                    value={formData.default_vat_rate}
                    onChange={(e) => setFormData({ ...formData, default_vat_rate: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <Button onClick={handleSave} className="w-full md:w-auto">
                {t('settings.save')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.preferences')}</CardTitle>
              <CardDescription>Application preferences and defaults</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="language">{t('settings.language')}</Label>
                <Select value={i18n.language} onValueChange={(value) => handleLanguageChange(value as Language)}>
                  <SelectTrigger id="language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pl">Polski (PL)</SelectItem>
                    <SelectItem value="nl">Nederlands (NL)</SelectItem>
                    <SelectItem value="en">English (EN)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
