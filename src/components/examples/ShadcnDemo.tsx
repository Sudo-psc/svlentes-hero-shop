"use client"

import * as React from "react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

export function ShadcnDemo() {
    const { toast } = useToast()
    const [name, setName] = React.useState("")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        toast({
            title: "Formulário enviado!",
            description: `Olá, ${name}! Seu formulário foi enviado com sucesso.`,
        })
    }

    const showErrorToast = () => {
        toast({
            variant: "destructive",
            title: "Erro!",
            description: "Algo deu errado. Tente novamente.",
        })
    }

    return (
        <div className="container mx-auto p-8 space-y-8">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold">shadcn/ui Demo</h1>
                <p className="text-lg text-muted-foreground">
                    Demonstração dos componentes shadcn/ui implementados no projeto SV Lentes
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Card com formulário */}
                <Card>
                    <CardHeader>
                        <CardTitle>Formulário de Contato</CardTitle>
                        <CardDescription>
                            Preencha os dados abaixo para entrar em contato
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome</Label>
                                <Input
                                    id="name"
                                    placeholder="Digite seu nome"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">E-mail</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="seu@email.com"
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full">
                                Enviar Formulário
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Card com botões */}
                <Card>
                    <CardHeader>
                        <CardTitle>Variações de Botões</CardTitle>
                        <CardDescription>
                            Diferentes estilos de botões disponíveis
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                            <Button variant="default">Default</Button>
                            <Button variant="secondary">Secondary</Button>
                            <Button variant="outline">Outline</Button>
                            <Button variant="ghost">Ghost</Button>
                            <Button variant="default" className="bg-primary-600 hover:bg-primary-700 text-white">Primary</Button>
                            <Button variant="default" className="bg-green-600 hover:bg-green-700 text-white">WhatsApp</Button>
                            <Button variant="default" className="bg-success-600 hover:bg-success-700 text-white">Success</Button>
                            <Button variant="default" className="bg-warning-600 hover:bg-warning-700 text-white">Warning</Button>
                        </div>

                        <div className="space-y-2">
                            <Button size="sm" className="w-full">Pequeno</Button>
                            <Button size="default" className="w-full">Padrão</Button>
                            <Button size="lg" className="w-full">Grande</Button>
                        </div>

                        <Button disabled className="w-full">
                            Carregando...
                        </Button>
                    </CardContent>
                </Card>

                {/* Card com Dialog */}
                <Card>
                    <CardHeader>
                        <CardTitle>Modal Dialog</CardTitle>
                        <CardDescription>
                            Exemplo de modal usando Dialog
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="w-full">
                                    Abrir Modal
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Confirmar Ação</DialogTitle>
                                    <DialogDescription>
                                        Esta é uma demonstração do componente Dialog do shadcn/ui.
                                        Você tem certeza que deseja continuar?
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <Button variant="outline">Cancelar</Button>
                                    <Button>Confirmar</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>

                {/* Card com Toasts */}
                <Card>
                    <CardHeader>
                        <CardTitle>Notificações Toast</CardTitle>
                        <CardDescription>
                            Exemplos de notificações toast
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button
                            onClick={() => toast({
                                title: "Sucesso!",
                                description: "Operação realizada com sucesso.",
                            })}
                            className="w-full"
                        >
                            Toast de Sucesso
                        </Button>

                        <Button
                            variant="destructive"
                            onClick={showErrorToast}
                            className="w-full"
                        >
                            Toast de Erro
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => toast({
                                title: "Informação",
                                description: "Esta é uma notificação informativa.",
                            })}
                            className="w-full"
                        >
                            Toast Informativo
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Toaster component para renderizar os toasts */}
            <Toaster />
        </div>
    )
}