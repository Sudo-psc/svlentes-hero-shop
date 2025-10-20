'use client';
import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
interface MarketingOptInProps {
    onOptInChange: (optIn: boolean) => void;
    initialValue?: boolean;
    required?: boolean;
    className?: string;
}
export function MarketingOptIn({
    onOptInChange,
    initialValue = false,
    required = false,
    className = ''
}: MarketingOptInProps) {
    const [optIn, setOptIn] = useState(initialValue);
    const [showDetails, setShowDetails] = useState(false);
    const handleOptInChange = (checked: boolean) => {
        setOptIn(checked);
        onOptInChange(checked);
    };
    return (
        <div className={`space-y-3 ${className}`}>
            <div className="flex items-start space-x-2">
                <Checkbox
                    id="marketing-opt-in"
                    checked={optIn}
                    onChange={(e) => handleOptInChange(e.target.checked)}
                    required={required}
                />
                <div className="flex-1">
                    <Label
                        htmlFor="marketing-opt-in"
                        className="text-sm text-gray-700 cursor-pointer"
                    >
                        Aceito receber comunicações de marketing por e-mail e WhatsApp sobre
                        novos produtos, promoções e conteúdo educativo sobre saúde ocular
                        {required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    <button
                        type="button"
                        onClick={() => setShowDetails(!showDetails)}
                        className="text-xs text-blue-600 hover:text-blue-800 underline mt-1"
                    >
                        {showDetails ? 'Ocultar detalhes' : 'Ver detalhes'}
                    </button>
                </div>
            </div>
            {showDetails && (
                <div className="ml-6 p-3 bg-gray-50 rounded-md text-xs text-gray-600">
                    <h4 className="font-semibold mb-2">O que você receberá:</h4>
                    <ul className="list-disc list-inside space-y-1 mb-3">
                        <li>Lembretes sobre renovação de lentes</li>
                        <li>Dicas de cuidados com lentes de contato</li>
                        <li>Informações sobre novos produtos</li>
                        <li>Promoções exclusivas para assinantes</li>
                        <li>Conteúdo educativo sobre saúde ocular</li>
                    </ul>
                    <p className="mb-2">
                        <strong>Frequência:</strong> Máximo 2 e-mails por semana e mensagens
                        no WhatsApp apenas quando necessário.
                    </p>
                    <p>
                        <strong>Cancelamento:</strong> Você pode cancelar a qualquer momento
                        clicando no link de descadastro nos e-mails ou enviando uma mensagem
                        para nosso WhatsApp.
                    </p>
                </div>
            )}
            {optIn && (
                <div className="ml-6 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                    ✓ Você receberá nossas comunicações de marketing. Pode cancelar a qualquer momento.
                </div>
            )}
        </div>
    );
}
interface MarketingPreferencesProps {
    preferences: {
        email: boolean;
        whatsapp: boolean;
        sms: boolean;
    };
    onPreferencesChange: (preferences: any) => void;
}
export function MarketingPreferences({ preferences, onPreferencesChange }: MarketingPreferencesProps) {
    const handleChannelChange = (channel: string, enabled: boolean) => {
        const newPreferences = {
            ...preferences,
            [channel]: enabled
        };
        onPreferencesChange(newPreferences);
    };
    return (
        <div className="space-y-4">
            <h4 className="font-semibold text-sm text-gray-900">
                Escolha como quer receber nossas comunicações:
            </h4>
            <div className="space-y-3">
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="email-marketing"
                        checked={preferences.email}
                        onChange={(e) => handleChannelChange('email', e.target.checked)}
                    />
                    <Label htmlFor="email-marketing" className="text-sm">
                        E-mail (newsletters, promoções, lembretes)
                    </Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="whatsapp-marketing"
                        checked={preferences.whatsapp}
                        onChange={(e) => handleChannelChange('whatsapp', e.target.checked)}
                    />
                    <Label htmlFor="whatsapp-marketing" className="text-sm">
                        WhatsApp (lembretes importantes, suporte)
                    </Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="sms-marketing"
                        checked={preferences.sms}
                        onChange={(e) => handleChannelChange('sms', e.target.checked)}
                    />
                    <Label htmlFor="sms-marketing" className="text-sm">
                        SMS (apenas lembretes urgentes)
                    </Label>
                </div>
            </div>
            <p className="text-xs text-gray-500">
                Você pode alterar essas preferências a qualquer momento entrando em contato conosco.
            </p>
        </div>
    );
}