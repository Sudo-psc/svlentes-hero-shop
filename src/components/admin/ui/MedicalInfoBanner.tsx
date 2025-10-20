'use client'
import React from 'react'
import { AlertCircle, User, Stethoscope, Phone, Mail } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
export function MedicalInfoBanner() {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-200 px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-semibold text-blue-900">
              Responsável Médico:
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-blue-800">
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span className="font-medium">Dr. Philipe Saraiva Cruz</span>
            </div>
            <Badge variant="outline" className="border-blue-300 text-blue-700">
              CRM-MG 69.870
            </Badge>
            <div className="flex items-center gap-3 text-xs text-blue-600">
              <div className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                <span>(33) 98606-1427</span>
              </div>
              <div className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                <span>saraivavision@gmail.com</span>
              </div>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
          onClick={() => window.open('https://wa.me/5533986061427', '_blank')}
        >
          <AlertCircle className="h-4 w-4 mr-1" />
          Emergência Médica
        </Button>
      </div>
    </div>
  )
}