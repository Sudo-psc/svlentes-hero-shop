'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { useCsrfProtection } from '@/hooks/useCsrfProtection';
import {
    Shield,
    Download,
    Trash2,
    Edit,
    Eye,
    AlertTriangle,
    CheckCircle,
    Clock,
    FileText
} from 'lucide-react';

interface DataControlPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export function DataControlPanel({ isOpen, onClose }: DataControlPanelProps) {
    const { withCsrfHeaders } = useCsrfProtection();
    const [activeTab, setActiveTab] = useState<'request' | 'status' | 'logs'>('request');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [requestSubmitted, setRequestSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        requestType: '',
        details: '',
        userConsent: false
    });

    if (!isOpen) return null;

    const handleSubmitRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/privacy/data-request', {
                method: 'POST',
                headers: withCsrfHeaders({
                    'Content-Type': 'application/json',
                }),
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (result.success) {
                setRequestSubmitted(true);
            } else {
                alert('Erro ao enviar solicitação: ' + result.message);
            }
        } catch (error) {
            alert('Erro ao enviar solicitação. Tente novamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const requestTypes = [
        { value: 'access', label: 'Acessar meus dados', icon: Eye },
        { value: 'deletion', label: 'Excluir meus dados', icon: Trash2 },
        { value: 'portability', label: 'Exportar meus dados', icon: Download },
        { value: 'correction', label: 'Corrigir meus dados', icon: Edit }
    ];

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b">
                    <div className="flex items-center space-x-2">
                        <Shield className="h-6 w-6 text-blue-600" />
                        <h2 className="text-2xl font-bold text-gray-900">Controle de Dados Pessoais</h2>
                    </div>
                    <Button variant="outline" size="sm" onClick={onClose}>
                        ✕
                    </Button>
                </div>

                {/* Tabs */}
                <div className="border-b">
                    <nav className="flex space-x-8 px-6">
                        {[
                            { id: 'request', label: 'Nova Solicitação', icon: FileText },
                            { id: 'status', label: 'Status', icon: Clock },
                            { id: 'logs', label: 'Histórico', icon: Eye }
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
                    {activeTab === 'request' && (
                        <div>
                            {requestSubmitted ? (
                                <div className="text-center py-8">
                                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                        Solicitação Enviada com Sucesso!
                                    </h3>
                                    <p className="text-gray-600 mb-6">
                                        Sua solicitação foi recebida e será processada conforme os prazos legais.
                                        Você receberá um email de confirmação em breve.
                                    </p>
                                    <Button onClick={() => setRequestSubmitted(false)}>
                                        Fazer Nova Solicitação
                                    </Button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmitRequest} className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold mb-4">Solicitar Ação sobre Meus Dados</h3>
                                        <p className="text-gray-600 mb-6">
                                            Conforme a Lei Geral de Proteção de Dados (LGPD), você tem direito a acessar,
                                            corrigir, excluir ou exportar seus dados pessoais.
                                        </p>
                                    </div>

                                    <div>
                                        <Label htmlFor="email">Email cadastrado</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="seu@email.com"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="requestType">Tipo de solicitação</Label>
                                        <Select
                                            value={formData.requestType}
                                            onChange={(e) => setFormData({ ...formData, requestType: e.target.value })}
                                            required
                                            placeholder="Selecione uma opção"
                                            options={requestTypes.map(type => ({ value: type.value, label: type.label }))}
                                        />
                                    </div>

                                    {formData.requestType && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <div className="flex items-start space-x-3">
                                                {(() => {
                                                    const selectedType = requestTypes.find(t => t.value === formData.requestType);
                                                    const Icon = selectedType?.icon || Eye;
                                                    return <Icon className="h-5 w-5 text-blue-600 mt-0.5" />;
                                                })()}
                                                <div>
                                                    <h4 className="font-medium text-blue-900 mb-1">
                                                        {requestTypes.find(t => t.value === formData.requestType)?.label}
                                                    </h4>
                                                    <p className="text-sm text-blue-700">
                                                        {formData.requestType === 'access' && 'Você receberá um relatório completo com todos os seus dados que possuímos.'}
                                                        {formData.requestType === 'deletion' && 'Seus dados serão removidos, exceto aqueles que devemos manter por obrigação legal.'}
                                                        {formData.requestType === 'portability' && 'Você receberá seus dados em formato estruturado para transferência.'}
                                                        {formData.requestType === 'correction' && 'Entraremos em contato para confirmar as correções necessárias.'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <Label htmlFor="details">Detalhes adicionais (opcional)</Label>
                                        <textarea
                                            id="details"
                                            value={formData.details}
                                            onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                                            placeholder="Descreva detalhes específicos sobre sua solicitação..."
                                            className="w-full p-3 border border-gray-300 rounded-md resize-none h-24"
                                        />
                                    </div>

                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                        <div className="flex items-start space-x-3">
                                            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                                            <div>
                                                <h4 className="font-medium text-yellow-900 mb-1">Importante</h4>
                                                <ul className="text-sm text-yellow-700 space-y-1">
                                                    <li>• Processaremos sua solicitação conforme os prazos legais (até 15-30 dias)</li>
                                                    <li>• Podemos solicitar documentos para confirmar sua identidade</li>
                                                    <li>• Alguns dados podem ser mantidos por obrigações legais ou médicas</li>
                                                    <li>• Você receberá confirmação por email sobre o andamento</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-start space-x-2">
                                        <Checkbox
                                            id="userConsent"
                                            checked={formData.userConsent}
                                            onChange={(e) =>
                                                setFormData({ ...formData, userConsent: e.target.checked })
                                            }
                                            required
                                        />
                                        <Label htmlFor="userConsent" className="text-sm">
                                            Confirmo que sou o titular dos dados e autorizo o processamento desta solicitação.
                                            Entendo que posso ser contatado para verificação de identidade.
                                        </Label>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={!formData.email || !formData.requestType || !formData.userConsent || isSubmitting}
                                        className="w-full"
                                    >
                                        {isSubmitting ? 'Enviando...' : 'Enviar Solicitação'}
                                    </Button>
                                </form>
                            )}
                        </div>
                    )}

                    {activeTab === 'status' && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Status das Solicitações</h3>
                            <p className="text-gray-600 mb-6">
                                Acompanhe o andamento das suas solicitações de dados.
                            </p>

                            <div className="space-y-4">
                                <div className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium">Solicitação de Acesso</span>
                                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                                            Em Processamento
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">
                                        Solicitado em: 15/01/2024
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        Previsão de conclusão: 30/01/2024
                                    </p>
                                </div>

                                <div className="text-center py-8 text-gray-500">
                                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                    <p>Nenhuma solicitação encontrada</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'logs' && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Histórico de Consentimentos</h3>
                            <p className="text-gray-600 mb-6">
                                Visualize o histórico de todas as suas decisões sobre privacidade e consentimentos.
                            </p>

                            <div className="space-y-4">
                                <div className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium">Consentimento de Cookies</span>
                                        <span className="text-sm text-gray-500">Hoje, 14:30</span>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        Aceitos: Necessários, Analytics | Rejeitados: Marketing
                                    </p>
                                </div>

                                <div className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium">Consentimento de Marketing</span>
                                        <span className="text-sm text-gray-500">Ontem, 16:45</span>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        Aceito receber comunicações por email e WhatsApp
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}