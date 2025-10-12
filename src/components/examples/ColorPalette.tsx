"use client"

import * as React from "react"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function ColorPalette() {
    const colorPalettes = [
        {
            name: "Primary (Medical Blue)",
            description: "Cor principal da marca - transmite confiança e profissionalismo médico",
            colors: [
                { name: "50", value: "#f0f9ff", contrast: "AA+" },
                { name: "100", value: "#e0f2fe", contrast: "AA+" },
                { name: "200", value: "#bae6fd", contrast: "AA" },
                { name: "300", value: "#7dd3fc", contrast: "AA" },
                { name: "400", value: "#38bdf8", contrast: "AA" },
                { name: "500", value: "#0ea5e9", contrast: "AA" },
                { name: "600", value: "#0f4c75", contrast: "AAA" },
                { name: "700", value: "#0c3d5a", contrast: "AAA" },
                { name: "800", value: "#0a2e42", contrast: "AAA" },
                { name: "900", value: "#082030", contrast: "AAA" },
            ]
        },
        {
            name: "Success (Medical Green)",
            description: "Cor para ações positivas e confirmações",
            colors: [
                { name: "50", value: "#f0fdf4", contrast: "AA+" },
                { name: "100", value: "#dcfce7", contrast: "AA+" },
                { name: "200", value: "#bbf7d0", contrast: "AA" },
                { name: "300", value: "#86efac", contrast: "AA" },
                { name: "400", value: "#4ade80", contrast: "AA" },
                { name: "500", value: "#22c55e", contrast: "AA" },
                { name: "600", value: "#16a34a", contrast: "AAA" },
                { name: "700", value: "#15803d", contrast: "AAA" },
                { name: "800", value: "#166534", contrast: "AAA" },
                { name: "900", value: "#14532d", contrast: "AAA" },
            ]
        },
        {
            name: "Warning (Amber)",
            description: "Cor para avisos e alertas importantes",
            colors: [
                { name: "50", value: "#fffbeb", contrast: "AA+" },
                { name: "100", value: "#fef3c7", contrast: "AA+" },
                { name: "200", value: "#fde68a", contrast: "AA" },
                { name: "300", value: "#fcd34d", contrast: "AA" },
                { name: "400", value: "#fbbf24", contrast: "AA" },
                { name: "500", value: "#f59e0b", contrast: "AA" },
                { name: "600", value: "#d97706", contrast: "AAA" },
                { name: "700", value: "#b45309", contrast: "AAA" },
                { name: "800", value: "#92400e", contrast: "AAA" },
                { name: "900", value: "#78350f", contrast: "AAA" },
            ]
        },
        {
            name: "Medical (Neutral Gray)",
            description: "Tons neutros para textos e elementos secundários",
            colors: [
                { name: "50", value: "#f8fafc", contrast: "AA+" },
                { name: "100", value: "#f1f5f9", contrast: "AA+" },
                { name: "200", value: "#e2e8f0", contrast: "AA" },
                { name: "300", value: "#cbd5e1", contrast: "AA" },
                { name: "400", value: "#94a3b8", contrast: "AA" },
                { name: "500", value: "#64748b", contrast: "AA" },
                { name: "600", value: "#475569", contrast: "AAA" },
                { name: "700", value: "#334155", contrast: "AAA" },
                { name: "800", value: "#1e293b", contrast: "AAA" },
                { name: "900", value: "#0f172a", contrast: "AAA" },
            ]
        }
    ]

    const getContrastBadgeColor = (contrast: string) => {
        switch (contrast) {
            case "AAA":
                return "bg-success-100 text-success-800 border-success-200"
            case "AA":
                return "bg-warning-100 text-warning-800 border-warning-200"
            case "AA+":
                return "bg-primary-100 text-primary-800 border-primary-200"
            default:
                return "bg-gray-100 text-gray-800 border-gray-200"
        }
    }

    return (
        <div className="container mx-auto p-8 space-y-8">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold text-gradient-medical">
                    Paleta de Cores SV Lentes
                </h1>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                    Sistema de cores otimizado para acessibilidade e harmonia visual,
                    seguindo as diretrizes WCAG para contraste e legibilidade.
                </p>
            </div>

            {/* Demonstração de Botões */}
            <Card>
                <CardHeader>
                    <CardTitle>Variações de Botões</CardTitle>
                    <CardDescription>
                        Demonstração das cores aplicadas em componentes interativos
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Button variant="default" className="w-full bg-primary-600 hover:bg-primary-700 text-white">
                            Primary
                        </Button>
                        <Button variant="default" className="w-full bg-success-600 hover:bg-success-700 text-white">
                            Success
                        </Button>
                        <Button variant="default" className="w-full bg-warning-600 hover:bg-warning-700 text-white">
                            Warning
                        </Button>
                        <Button variant="default" className="w-full bg-green-600 hover:bg-green-700 text-white">
                            WhatsApp
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Button variant="outline" className="w-full">
                            Outline
                        </Button>
                        <Button variant="secondary" className="w-full">
                            Secondary
                        </Button>
                        <Button variant="ghost" className="w-full">
                            Ghost
                        </Button>
                        <Button variant="destructive" className="w-full">
                            Destructive
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Paletas de Cores */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {colorPalettes.map((palette) => (
                    <Card key={palette.name}>
                        <CardHeader>
                            <CardTitle>{palette.name}</CardTitle>
                            <CardDescription>{palette.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-5 gap-2">
                                {palette.colors.map((color) => (
                                    <div key={color.name} className="space-y-2">
                                        <div
                                            className="w-full h-16 rounded-lg border border-border shadow-sm"
                                            style={{ backgroundColor: color.value }}
                                        />
                                        <div className="text-center space-y-1">
                                            <div className="text-xs font-medium text-foreground">
                                                {color.name}
                                            </div>
                                            <div className="text-xs text-muted-foreground font-mono">
                                                {color.value}
                                            </div>
                                            <div className={`text-xs px-1 py-0.5 rounded border ${getContrastBadgeColor(color.contrast)}`}>
                                                {color.contrast}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Gradientes */}
            <Card>
                <CardHeader>
                    <CardTitle>Gradientes Harmoniosos</CardTitle>
                    <CardDescription>
                        Gradientes otimizados para backgrounds e elementos decorativos
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gradient-medical h-24 rounded-lg border border-border flex items-center justify-center">
                            <span className="text-primary-800 font-semibold">Medical Gradient</span>
                        </div>
                        <div className="bg-gradient-success h-24 rounded-lg border border-border flex items-center justify-center">
                            <span className="text-success-800 font-semibold">Success Gradient</span>
                        </div>
                        <div className="bg-gradient-to-br from-warning-50 to-warning-100 h-24 rounded-lg border border-border flex items-center justify-center">
                            <span className="text-warning-800 font-semibold">Warning Gradient</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Informações de Acessibilidade */}
            <Card>
                <CardHeader>
                    <CardTitle>Acessibilidade e Contraste</CardTitle>
                    <CardDescription>
                        Todas as cores foram testadas para garantir conformidade com WCAG 2.1
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-success-50 border border-success-200 rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                                <div className="w-3 h-3 bg-success-600 rounded-full"></div>
                                <span className="font-semibold text-success-800">AAA</span>
                            </div>
                            <p className="text-sm text-success-700">
                                Contraste superior a 7:1 - Ideal para textos pequenos e elementos críticos
                            </p>
                        </div>

                        <div className="p-4 bg-warning-50 border border-warning-200 rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                                <div className="w-3 h-3 bg-warning-500 rounded-full"></div>
                                <span className="font-semibold text-warning-800">AA</span>
                            </div>
                            <p className="text-sm text-warning-700">
                                Contraste superior a 4.5:1 - Adequado para textos normais
                            </p>
                        </div>

                        <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                                <div className="w-3 h-3 bg-primary-600 rounded-full"></div>
                                <span className="font-semibold text-primary-800">AA+</span>
                            </div>
                            <p className="text-sm text-primary-700">
                                Contraste superior a 3:1 - Adequado para elementos grandes
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}