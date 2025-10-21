'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { usePrivacy } from '@/components/privacy/PrivacyProvider';
import { setCookieConsent, setMarketingConsent, clearAllPrivacyData } from '@/lib/privacy';
import { Settings, Shield, Trash2, Download, Eye } from 'lucide-react';
interface PrivacySettingsProps {
    isOpen: boolean;
    onClose: () => void;
}
export function PrivacySettings({ isOpen, onClose }: PrivacySettingsProps) {
    const { cookieConsent, marketingConsent, updateCookieConsent } = usePrivacy();
    const [activeTab, setActiveTab] = useState<'cookies' | 'marketing' | 'data'>('cookies');
    const [cookiePrefs, setCookiePrefs] = useState({
        necessary: true,
        analytics: cookieConsent?.preferences.analytics ?? false,
        marketing: cookieConsent?.preferences.marketing ?? false,
    });
    const [marketingPrefs, setMarketingPrefs] = useState({
        email: marketingConsent?.preferences?.email ?? false,
        whatsapp: marketingConsent?.preferences?.whatsapp ?? false,
        sms: marketingConsent?.preferences?.sms ?? false,
    });
    if (!isOpen) return null;
    const handleSaveCookiePreferences = () => {
        setCookieConsent(cookiePrefs);
        updateCookieConsent(cookiePrefs);
    };
    const handleSaveMarketingPreferences = () => {
        const granted = marketingPrefs.email || marketingPrefs.whatsapp || marketingPrefs.sms;
        setMarketingConsent(granted, marketingPrefs);
    };
    const handleClearAllData = () => {
        if (confirm('Tem certeza que deseja limpar todos os seus dados de privacidade? Esta ação não pode ser desfeita.')) {
            clearAllPrivacyData();
            onClose();
        }
    };
    const handleExportData = () => {
        const data = {
            cookieConsent,
            marketingConsent,
            exportedAt: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `privacy-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b">
                    <div className="flex items-center space-x-2">
                        <Settings className="h-6 w-6 text-blue-600" />
                        <h2 className="text-xl font-bold text-gray-900">Configurações de Privacidade</h2>
                    </div>
                    <Button variant="outline" size="sm" onClick={onClose}>
                        ✕
                    </Button>
                </div>
                {/* Tabs */}
                <div className="border-b">
                    <nav className="flex space-x-8 px-6">
                        {[
                            { id: 'cookies', label: 'Cookies', icon: Shield },
                            { id: 'marketing', label: 'Marketing', icon: Eye },
                            { id: 'data', label: 'Meus Dados', icon: Trash2 }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 ${activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <tab.icon className="h-4 w-4" />
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    {activeTab === 'cookies' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Preferências de Cookies</h3>
                                <p className="text-gray-600 mb-4">
                                    Gerencie quais cookies você permite que usemos para melhorar sua experiência.
                                </p>
                            </div>
                            <div className="space-y-4">
                                <div className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <h4 className="font-medium">Cookies Necessários</h4>
                                            <p className="text-sm text-gray-600">
                                                Essenciais para o funcionamento básico do site
                                            </p>
                                        </div>
                                        <Checkbox checked={true} disabled />
                                    </div>
                                </div>
                                <div className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <h4 className="font-medium">Cookies de Análise</h4>
                                            <p className="text-sm text-gray-600">
                                                Nos ajudam a entender como você usa o site
                                            </p>
                                        </div>
                                        <Checkbox
                                            checked={cookiePrefs.analytics}
                                            onChange={(e) =>
                                                setCookiePrefs({ ...cookiePrefs, analytics: e.target.checked })
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <h4 className="font-medium">Cookies de Marketing</h4>
                                            <p className="text-sm text-gray-600">
                                                Para personalizar anúncios e comunicações
                                            </p>
                                        </div>
                                        <Checkbox
                                            checked={cookiePrefs.marketing}
                                            onChange={(e) =>
                                                setCookiePrefs({ ...cookiePrefs, marketing: e.target.checked })
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                            <Button onClick={handleSaveCookiePreferences} className="w-full">
                                Salvar Preferências de Cookies
                            </Button>
                        </div>
                    )}
                    {activeTab === 'marketing' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Comunicações de Marketing</h3>
                                <p className="text-gray-600 mb-4">
                                    Escolha como quer receber nossas comunicações sobre produtos e promoções.
                                </p>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="email-marketing"
                                        checked={marketingPrefs.email}
                                        onChange={(e) =>
                                            setMarketingPrefs({ ...marketingPrefs, email: e.target.checked })
                                        }
                                    />
                                    <Label htmlFor="email-marketing">
                                        <div>
                                            <div className="font-medium">Email</div>
                                            <div className="text-sm text-gray-600">
                                                Newsletters, promoções e lembretes importantes
                                            </div>
                                        </div>
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="whatsapp-marketing"
                                        checked={marketingPrefs.whatsapp}
                                        onChange={(e) =>
                                            setMarketingPrefs({ ...marketingPrefs, whatsapp: e.target.checked })
                                        }
                                    />
                                    <Label htmlFor="whatsapp-marketing">
                                        <div>
                                            <div className="font-medium">WhatsApp</div>
                                            <div className="text-sm text-gray-600">
                                                Lembretes de renovação e suporte personalizado
                                            </div>
                                        </div>
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="sms-marketing"
                                        checked={marketingPrefs.sms}
                                        onChange={(e) =>
                                            setMarketingPrefs({ ...marketingPrefs, sms: e.target.checked })
                                        }
                                    />
                                    <Label htmlFor="sms-marketing">
                                        <div>
                                            <div className="font-medium">SMS</div>
                                            <div className="text-sm text-gray-600">
                                                Apenas lembretes urgentes sobre sua assinatura
                                            </div>
                                        </div>
                                    </Label>
                                </div>
                            </div>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-700">
                                    <strong>Frequência:</strong> Máximo 2 emails por semana. WhatsApp e SMS apenas quando necessário.
                                    Você pode cancelar a qualquer momento.
                                </p>
                            </div>
                            <Button onClick={handleSaveMarketingPreferences} className="w-full">
                                Salvar Preferências de Marketing
                            </Button>
                        </div>
                    )}
                    {activeTab === 'data' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Controle dos Seus Dados</h3>
                                <p className="text-gray-600 mb-4">
                                    Gerencie seus dados pessoais conforme seus direitos na LGPD.
                                </p>
                            </div>
                            <div className="space-y-4">
                                <div className="border border-gray-200 rounded-lg p-4">
                                    <h4 className="font-medium mb-2">Exportar Dados</h4>
                                    <p className="text-sm text-gray-600 mb-3">
                                        Baixe uma cópia de todos os seus dados de privacidade em formato JSON.
                                    </p>
                                    <Button
                                        onClick={handleExportData}
                                        variant="outline"
                                        size="sm"
                                        className="flex items-center space-x-2"
                                    >
                                        <Download className="h-4 w-4" />
                                        <span>Exportar Dados</span>
                                    </Button>
                                </div>
                                <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                                    <h4 className="font-medium mb-2 text-red-900">Limpar Todos os Dados</h4>
                                    <p className="text-sm text-red-700 mb-3">
                                        Remove todos os seus consentimentos e preferências. Esta ação não pode ser desfeita.
                                    </p>
                                    <Button
                                        onClick={handleClearAllData}
                                        variant="outline"
                                        size="sm"
                                        className="flex items-center space-x-2 border-red-300 text-red-700 hover:bg-red-100"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        <span>Limpar Dados</span>
                                    </Button>
                                </div>
                            </div>
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <h4 className="font-medium text-yellow-900 mb-2">Precisa de Mais Controle?</h4>
                                <p className="text-sm text-yellow-700 mb-3">
                                    Para solicitações mais específicas como exclusão completa de dados médicos,
                                    correção de informações ou portabilidade de dados, use nosso formulário oficial.
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        // This would open the DataControlPanel
                                        alert('Funcionalidade em desenvolvimento');
                                    }}
                                >
                                    Abrir Formulário LGPD
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}