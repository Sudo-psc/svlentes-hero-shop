/**
 * Verificação e tratamento de Trusted Types e CSP
 * Implementa detecção e mitigação de problemas de segurança
 */

export interface TrustedTypesInfo {
  supported: boolean;
  enabled: boolean;
  policyNames: string[];
  defaultPolicy: string | null;
  errors: string[];
}

export interface CSPInfo {
  enabled: boolean;
  directives: Record<string, string[]>;
  violations: CSPViolation[];
  selfAllowed: boolean;
  trustedTypesRequired: boolean;
}

export interface CSPViolation {
  violatedDirective: string;
  sample: string;
  sourceFile?: string;
  lineNumber?: number;
  columnNumber?: number;
  timestamp: number;
}

export class TrustedTypesHandler {
  private static instance: TrustedTypesHandler;
  private trustedTypesInfo: TrustedTypesInfo;
  private cspInfo: CSPInfo;
  private customPolicies: Map<string, TrustedTypePolicy> = new Map();
  private fallbackMode = false;

  private constructor() {
    if (typeof window === 'undefined') return;

    this.trustedTypesInfo = this.analyzeTrustedTypes();
    this.cspInfo = this.analyzeCSP();
    this.setupEventListeners();
    this.createFallbackPolicies();
  }

  static getInstance(): TrustedTypesHandler {
    if (!TrustedTypesHandler.instance) {
      TrustedTypesHandler.instance = new TrustedTypesHandler();
    }
    return TrustedTypesHandler.instance;
  }

  /**
   * Analisa suporte e configuração de Trusted Types
   */
  private analyzeTrustedTypes(): TrustedTypesInfo {
    const info: TrustedTypesInfo = {
      supported: false,
      enabled: false,
      policyNames: [],
      defaultPolicy: null,
      errors: []
    };

    try {
      // Verificar suporte a Trusted Types
      if (typeof window !== 'undefined' && 'trustedTypes' in window) {
        info.supported = true;

        const tt = (window as any).trustedTypes;

        // Verificar se há políticas criadas
        if (tt.getPolicyNames) {
          info.policyNames = tt.getPolicyNames();
        }

        // Tentar obter política padrão
        if (tt.defaultPolicy) {
          info.defaultPolicy = tt.defaultPolicy.name || 'default';
          info.enabled = true;
        }

        // Verificar se Trusted Types é exigido pelo CSP
        if (typeof document !== 'undefined') {
          const metaTags = document.querySelectorAll('meta[http-equiv="Content-Security-Policy"]');
          metaTags.forEach(tag => {
            const content = tag.getAttribute('content') || '';
            if (content.includes("require-trusted-types-for 'script'")) {
              info.enabled = true;
            }
          });
        }
      } else {
        info.errors.push('Trusted Types não suportado neste navegador');
      }
    } catch (error) {
      info.errors.push(`Erro ao analisar Trusted Types: ${error}`);
    }

    return info;
  }

  /**
   * Analisa configuração de Content Security Policy
   */
  private analyzeCSP(): CSPInfo {
    const info: CSPInfo = {
      enabled: false,
      directives: {},
      violations: [],
      selfAllowed: false,
      trustedTypesRequired: false
    };

    try {
      // Verificar meta tags CSP
      if (typeof document !== 'undefined') {
        const metaTags = document.querySelectorAll('meta[http-equiv="Content-Security-Policy"]');

        if (metaTags.length > 0) {
          info.enabled = true;

          metaTags.forEach(tag => {
            const content = tag.getAttribute('content') || '';
            this.parseCSPDirectives(content, info);
          });
        }

        // Verificar headers CSP (via API se disponível)
        if ('securityPolicy' in document) {
          const policy = (document as any).securityPolicy;
          if (policy && policy.getViolations) {
            // Adicionar violações existentes
            const violations = policy.getViolations();
            violations.forEach((violation: any) => {
              info.violations.push({
                violatedDirective: violation.violatedDirective,
                sample: violation.sample,
                sourceFile: violation.sourceFile,
                lineNumber: violation.lineNumber,
                columnNumber: violation.columnNumber,
                timestamp: Date.now()
              });
            });
          }
        }
      }
    } catch (error) {
      info.errors = [`Erro ao analisar CSP: ${error}`];
    }

    return info;
  }

  private parseCSPDirectives(cspContent: string, info: CSPInfo): void {
    const directives = cspContent.split(';').map(d => d.trim());

    directives.forEach(directive => {
      const [name, ...values] = directive.split(/\s+/);

      if (name && values.length > 0) {
        info.directives[name] = values;

        // Verificar diretivas específicas
        if (name === "default-src" || name === "script-src") {
          if (values.includes("'self'")) {
            info.selfAllowed = true;
          }
        }

        if (name === "require-trusted-types-for") {
          if (values.includes("'script'")) {
            info.trustedTypesRequired = true;
          }
        }
      }
    });
  }

  /**
   * Configura listeners para violações de CSP e Trusted Types
   */
  private setupEventListeners(): void {
    if (typeof document === 'undefined') return;

    // Listener para violações de CSP
    document.addEventListener('securitypolicyviolation', (event) => {
      const violation: CSPViolation = {
        violatedDirective: event.violatedDirective,
        sample: event.sample,
        sourceFile: event.sourceFile,
        lineNumber: event.lineNumber,
        columnNumber: event.columnNumber,
        timestamp: Date.now()
      };

      this.cspInfo.violations.push(violation);
      this.handleCSPViolation(violation);
    });

    // Listener para erros de Trusted Types
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        if (event.message && event.message.includes('Trusted Types')) {
          console.warn('[TrustedTypes] Erro detectado:', event.message);
          this.handleTrustedTypesError(event.message);
        }
      });
    }
  }

  /**
   * Cria políticas de fallback para cenários sem Trusted Types
   */
  private createFallbackPolicies(): void {
    if (!this.trustedTypesInfo.supported || this.fallbackMode) {
      console.info('[TrustedTypes] Modo fallback ativado');
      return;
    }

    try {
      const tt = (window as any).trustedTypes;

      // Política para scripts
      if (!tt.getPolicyNames().includes('svlentes-scripts')) {
        const scriptPolicy = tt.createPolicy('svlentes-scripts', {
          createScript: (string: string) => {
            // Validar script antes de criar
            this.validateScriptContent(string);
            return string;
          },
          createScriptURL: (url: string) => {
            // Validar URL de script
            this.validateScriptURL(url);
            return url;
          }
        });

        this.customPolicies.set('svlentes-scripts', scriptPolicy);
      }

      // Política para HTML
      if (!tt.getPolicyNames().includes('svlentes-html')) {
        const htmlPolicy = tt.createPolicy('svlentes-html', {
          createHTML: (string: string) => {
            // Sanitizar HTML
            return this.sanitizeHTML(string);
          }
        });

        this.customPolicies.set('svlentes-html', htmlPolicy);
      }

      console.log('[TrustedTypes] Políticas personalizadas criadas');
    } catch (error) {
      console.error('[TrustedTypes] Falha ao criar políticas:', error);
      this.fallbackMode = true;
    }
  }

  /**
   * Valida conteúdo de script
   */
  private validateScriptContent(content: string): void {
    // Verificar por padrões perigosos
    const dangerousPatterns = [
      /eval\s*\(/gi,
      /Function\s*\(/gi,
      /document\.write/gi,
      /innerHTML\s*=/gi,
      /outerHTML\s*=/gi
    ];

    dangerousPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        console.warn('[TrustedTypes] Padrão perigoso detectado no script:', pattern);
      }
    });

    // Verificar domínios externos não permitidos
    const externalDomains = content.match(/https?:\/\/([^\/]+)/gi) || [];
    const allowedDomains = [
      'js.stripe.com',
      'www.googletagmanager.com',
      'www.google-analytics.com',
      'apis.google.com',
      'svlentes.com.br',
      'svlentes.shop'
    ];

    externalDomains.forEach(domain => {
      const domainName = domain.replace(/https?:\/\//, '').split('/')[0];
      if (!allowedDomains.includes(domainName)) {
        console.warn('[TrustedTypes] Domínio externo não permitido:', domainName);
      }
    });
  }

  /**
   * Valida URL de script
   */
  private validateScriptURL(url: string): void {
    try {
      const parsedUrl = new URL(url, typeof window !== 'undefined' ? window.location.href : 'http://localhost');

      // Verificar protocolo
      if (!['https:', 'http:'].includes(parsedUrl.protocol)) {
        throw new Error(`Protocolo não permitido: ${parsedUrl.protocol}`);
      }

      // Verificar domínios permitidos
      const allowedDomains = [
        'js.stripe.com',
        'www.googletagmanager.com',
        'www.google-analytics.com',
        'apis.google.com',
        'svlentes.com.br',
        'svlentes.shop'
      ];

      if (!allowedDomains.some(domain => parsedUrl.hostname.includes(domain))) {
        console.warn('[TrustedTypes] URL de script externo:', parsedUrl.hostname);
      }
    } catch (error) {
      console.error('[TrustedTypes] URL inválida:', url, error);
      throw error;
    }
  }

  /**
   * Sanitiza HTML
   */
  private sanitizeHTML(html: string): string {
    // Remover scripts e eventos perigosos
    return html
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/<iframe[^>]*>/gi, '');
  }

  /**
   * Lida com violações de CSP
   */
  private handleCSPViolation(violation: CSPViolation): void {
    const severity = this.assessViolationSeverity(violation);

    console.group(`🛡️ CSP Violation - ${severity.toUpperCase()}`);
    console.log('Directive:', violation.violatedDirective);
    console.log('Sample:', violation.sample);
    if (violation.sourceFile) {
      console.log('Source:', `${violation.sourceFile}:${violation.lineNumber}:${violation.columnNumber}`);
    }
    console.log('Time:', new Date(violation.timestamp).toLocaleString());
    console.groupEnd();

    // Notificar se for violação grave
    if (severity === 'high' || severity === 'critical') {
      this.notifySecurityViolation(violation, severity);
    }
  }

  /**
   * Lida com erros de Trusted Types
   */
  private handleTrustedTypesError(message: string): void {
    console.warn('[TrustedTypes] Erro:', message);

    // Se Trusted Types estiver causando muitos problemas, ativar fallback
    const errorCount = this.countRecentTrustedTypesErrors();
    if (errorCount > 5) {
      console.warn('[TrustedTypes] Múltiplos erros detectados, ativando modo fallback');
      this.fallbackMode = true;
      this.notifyFallbackActivation();
    }
  }

  private assessViolationSeverity(violation: CSPViolation): 'low' | 'medium' | 'high' | 'critical' {
    const { violatedDirective, sample } = violation;

    // Violações críticas
    if (violatedDirective === 'script-src' || violatedDirective === 'object-src') {
      return 'critical';
    }

    // Violações altas
    if (violatedDirective === 'default-src' || violatedDirective === 'connect-src') {
      return 'high';
    }

    // Violações médias
    if (violatedDirective === 'style-src' || violatedDirective === 'img-src') {
      return 'medium';
    }

    // Verificar conteúdo da amostra
    if (sample.includes('eval') || sample.includes('innerHTML') || sample.includes('document.write')) {
      return 'high';
    }

    return 'low';
  }

  private countRecentTrustedTypesErrors(): number {
    // Implementar contagem de erros recentes
    return 0; // Simplificado para este exemplo
  }

  private notifySecurityViolation(violation: CSPViolation, severity: string): void {
    if (typeof window === 'undefined') return;

    // Disparar evento para sistema de notificações
    window.dispatchEvent(new CustomEvent('security-violation', {
      detail: { violation, severity }
    }));
  }

  private notifyFallbackActivation(): void {
    if (typeof window === 'undefined') return;

    // Disparar evento para sistema de notificações
    window.dispatchEvent(new CustomEvent('trusted-types-fallback', {
      detail: { timestamp: Date.now() }
    }));
  }

  /**
   * Obtém informações sobre Trusted Types
   */
  getTrustedTypesInfo(): TrustedTypesInfo {
    return { ...this.trustedTypesInfo };
  }

  /**
   * Obtém informações sobre CSP
   */
  getCSPInfo(): CSPInfo {
    return { ...this.cspInfo };
  }

  /**
   * Verifica se o sistema está seguro
   */
  async checkSecurityHealth(): Promise<{
    status: 'secure' | 'warning' | 'vulnerable';
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Verificar Trusted Types
    if (!this.trustedTypesInfo.supported) {
      issues.push('Trusted Types não suportado - navegador antigo');
      recommendations.push('Atualize o navegador para melhor segurança');
    } else if (!this.trustedTypesInfo.enabled) {
      issues.push('Trusted Types não habilitado');
      recommendations.push('Habilite Trusted Types no CSP');
    }

    // Verificar CSP
    if (!this.cspInfo.enabled) {
      issues.push('CSP não configurado');
      recommendations.push('Configure uma política de segurança de conteúdo');
    } else {
      // Verificar diretivas essenciais
      if (!this.cspInfo.directives['default-src']) {
        issues.push('Diretiva default-src ausente');
        recommendations.push('Adicione default-src ao CSP');
      }

      if (!this.cspInfo.selfAllowed) {
        issues.push("'self' não permitido no CSP");
        recommendations.push('Adicione \'self\' às diretivas do CSP');
      }
    }

    // Verificar violações recentes
    const recentViolations = this.cspInfo.violations.filter(
      v => Date.now() - v.timestamp < 60000 // último minuto
    );

    if (recentViolations.length > 5) {
      issues.push(`Múltiplas violações de CSP: ${recentViolations.length}`);
      recommendations.push('Investigue as violações de CSP e ajuste a política');
    }

    // Verificar modo fallback
    if (this.fallbackMode) {
      issues.push('Modo fallback de segurança ativado');
      recommendations.push('Verifique a configuração de Trusted Types');
    }

    // Determinar status geral
    let status: 'secure' | 'warning' | 'vulnerable';
    if (issues.length === 0) {
      status = 'secure';
    } else if (issues.length <= 2) {
      status = 'warning';
    } else {
      status = 'vulnerable';
    }

    return { status, issues, recommendations };
  }

  /**
   * Cria uma política Trusted Types personalizada
   */
  createPolicy(name: string, rules: TrustedTypePolicyOptions): boolean {
    if (!this.trustedTypesInfo.supported || this.fallbackMode) {
      return false;
    }

    try {
      const tt = (window as any).trustedTypes;
      const policy = tt.createPolicy(name, rules);
      this.customPolicies.set(name, policy);
      return true;
    } catch (error) {
      console.error('[TrustedTypes] Falha ao criar política:', error);
      return false;
    }
  }

  /**
   * Obtém uma política personalizada
   */
  getPolicy(name: string): TrustedTypePolicy | null {
    return this.customPolicies.get(name) || null;
  }

  /**
   * Ativa modo fallback forçado
   */
  enableFallbackMode(): void {
    this.fallbackMode = true;
    console.warn('[TrustedTypes] Modo fallback ativado manualmente');
  }

  /**
   * Desativa modo fallback
   */
  disableFallbackMode(): void {
    if (this.trustedTypesInfo.supported) {
      this.fallbackMode = false;
      console.info('[TrustedTypes] Modo fallback desativado');
    }
  }
}

// Instância global
export const trustedTypesHandler = TrustedTypesHandler.getInstance();

// Exportar para uso global
declare global {
  interface Window {
    TrustedTypesHandler: TrustedTypesHandler;
  }
}

if (typeof window !== 'undefined') {
  window.TrustedTypesHandler = trustedTypesHandler;
}