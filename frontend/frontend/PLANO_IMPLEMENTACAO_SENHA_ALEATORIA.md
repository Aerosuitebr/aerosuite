# Plano de Implementação - Criação de Usuário com Senha Aleatória

## 📋 Visão Geral

Quando um novo usuário for criado no sistema, será gerada uma senha aleatória segura. Após a persistência no banco, será enviado um email ao usuário informando que ele precisa cadastrar uma nova senha. O email conterá um link que redirecionará para uma tela de redefinição de senha, onde o usuário deverá informar a senha atual (temporária) e definir uma nova senha.

---

## 🔄 Fluxo Completo

```
1. Admin cria novo usuário (nome, email, perfil)
   ↓
2. Backend gera senha aleatória segura
   ↓
3. Usuário é persistido no banco com senha temporária
   ↓
4. Backend cria token de redefinição de senha
   ↓
5. Backend envia email com link de redefinição
   ↓
6. Usuário clica no link do email
   ↓
7. Sistema redireciona para tela de redefinição
   ↓
8. Usuário informa senha atual (temporária) e nova senha
   ↓
9. Sistema valida senha atual e atualiza para nova senha
   ↓
10. Token é marcado como usado
   ↓
11. Usuário pode fazer login com nova senha
```

---

## 🛠️ Implementação Passo a Passo

### **FASE 1: Backend - Geração de Senha Aleatória**

#### 1.1 Criar utilitário para gerar senha segura

**Arquivo:** `backend/src/main/java/com/aerosuite/util/PasswordGenerator.java`

```java
package com.aerosuite.util;

import java.security.SecureRandom;

public class PasswordGenerator {
    private static final String LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
    private static final String UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final String DIGITS = "0123456789";
    private static final String SPECIAL = "!@#$%&*";
    private static final String ALL_CHARS = LOWERCASE + UPPERCASE + DIGITS + SPECIAL;
    
    private static final SecureRandom random = new SecureRandom();
    
    /**
     * Gera uma senha aleatória segura de 12 caracteres
     * Garante pelo menos: 1 minúscula, 1 maiúscula, 1 dígito, 1 especial
     */
    public static String generateSecurePassword() {
        StringBuilder password = new StringBuilder(12);
        
        // Garantir pelo menos um de cada tipo
        password.append(LOWERCASE.charAt(random.nextInt(LOWERCASE.length())));
        password.append(UPPERCASE.charAt(random.nextInt(UPPERCASE.length())));
        password.append(DIGITS.charAt(random.nextInt(DIGITS.length())));
        password.append(SPECIAL.charAt(random.nextInt(SPECIAL.length())));
        
        // Preencher o restante aleatoriamente
        for (int i = password.length(); i < 12; i++) {
            password.append(ALL_CHARS.charAt(random.nextInt(ALL_CHARS.length())));
        }
        
        // Embaralhar os caracteres
        char[] passwordArray = password.toString().toCharArray();
        for (int i = passwordArray.length - 1; i > 0; i--) {
            int j = random.nextInt(i + 1);
            char temp = passwordArray[i];
            passwordArray[i] = passwordArray[j];
            passwordArray[j] = temp;
        }
        
        return new String(passwordArray);
    }
}
```

#### 1.2 Modificar UsuarioService.create() para gerar senha

**Arquivo:** `backend/src/main/java/com/aerosuite/service/UsuarioService.java`

```java
@Inject
AuthService authService;

@Inject
EmailService emailService;

@Transactional
public UsuarioDto create(UsuarioDto dto) {
    Usuario e = mapper.toEntity(dto);
    
    // Gerar senha aleatória segura se não fornecida
    if (dto.senha() == null || dto.senha().trim().isEmpty()) {
        String senhaTemporaria = PasswordGenerator.generateSecurePassword();
        e.senha = senhaTemporaria;
    }
    
    // Garantir que dataCadastro seja definida
    if (e.dataCadastro == null) {
        e.dataCadastro = java.time.LocalDate.now();
    }
    
    // Definir último acesso no momento da criação
    e.ultimoAcesso = java.time.LocalDateTime.now();
    e.persist();
    
    // Criar token de redefinição e enviar email
    try {
        String token = authService.createPasswordSetupToken(e.email);
        String frontendUrl = System.getenv("FRONTEND_URL");
        if (frontendUrl == null || frontendUrl.isEmpty()) {
            frontendUrl = "http://localhost:4200";
        }
        String setupUrl = frontendUrl + "/setup-password?token=" + token;
        emailService.sendPasswordSetupEmail(e.email, e.nome, e.senha, setupUrl);
    } catch (Exception ex) {
        // Log erro mas não falha a criação do usuário
        System.err.println("Erro ao enviar email de configuração de senha: " + ex.getMessage());
    }
    
    // Retornar DTO sem a senha por segurança
    UsuarioDto dtoResponse = mapper.toDto(e);
    return new UsuarioDto(
        dtoResponse.id(),
        dtoResponse.email(),
        dtoResponse.nome(),
        null, // Não retornar senha
        dtoResponse.dataCadastro(),
        dtoResponse.ultimoAcesso(),
        dtoResponse.fotoPerfil()
    );
}
```

---

### **FASE 2: Backend - Criar Token de Setup de Senha**

#### 2.1 Adicionar método em AuthService

**Arquivo:** `backend/src/main/java/com/aerosuite/service/AuthService.java`

```java
/**
 * Cria token para configuração inicial de senha (novo usuário)
 */
@Transactional
public String createPasswordSetupToken(String email) {
    // Invalidar tokens anteriores não utilizados do mesmo email
    PasswordResetToken.invalidateTokensByEmail(email);
    
    // Gerar novo token seguro
    String token = generateSecureToken();
    
    // Criar registro de token (expira em 7 dias para novo usuário)
    PasswordResetToken setupToken = new PasswordResetToken();
    setupToken.token = token;
    setupToken.email = email;
    setupToken.expiresAt = LocalDateTime.now().plusDays(7); // Expira em 7 dias
    setupToken.used = false;
    setupToken.persist();
    
    return token;
}

/**
 * Valida senha atual antes de permitir redefinição
 */
@Transactional
public MessageResponse validateCurrentPassword(String email, String currentPassword) {
    Usuario usuario = Usuario.find("email = ?1", email).firstResult();
    
    if (usuario == null) {
        throw new RuntimeException("Usuário não encontrado");
    }
    
    if (!usuario.senha.equals(currentPassword)) {
        throw new RuntimeException("Senha atual incorreta");
    }
    
    return new MessageResponse("Senha atual válida");
}
```

#### 2.2 Criar endpoint para validar senha atual

**Arquivo:** `backend/src/main/java/com/aerosuite/api/AuthResource.java`

```java
@POST
@Path("/validate-current-password")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public Response validateCurrentPassword(ValidateCurrentPasswordRequest request) {
    try {
        MessageResponse response = authService.validateCurrentPassword(
            request.email, 
            request.currentPassword
        );
        return Response.ok(response).build();
    } catch (RuntimeException e) {
        return Response.status(Response.Status.BAD_REQUEST)
            .entity(new ErrorResponse(e.getMessage()))
            .build();
    }
}
```

#### 2.3 Criar DTO para validação de senha atual

**Arquivo:** `backend/src/main/java/com/aerosuite/dto/ValidateCurrentPasswordRequest.java`

```java
package com.aerosuite.dto;

public class ValidateCurrentPasswordRequest {
    public String email;
    public String currentPassword;
    
    public ValidateCurrentPasswordRequest() {}
    
    public ValidateCurrentPasswordRequest(String email, String currentPassword) {
        this.email = email;
        this.currentPassword = currentPassword;
    }
}
```

---

### **FASE 3: Backend - Email de Configuração de Senha**

#### 3.1 Adicionar método em EmailService

**Arquivo:** `backend/src/main/java/com/aerosuite/service/EmailService.java`

```java
/**
 * Envia email de configuração inicial de senha para novo usuário
 */
public void sendPasswordSetupEmail(String to, String nomeUsuario, String senhaTemporaria, String setupLink) {
    try {
        String htmlBody = buildPasswordSetupEmailHtml(nomeUsuario, senhaTemporaria, setupLink);
        String textBody = buildPasswordSetupEmailText(nomeUsuario, senhaTemporaria, setupLink);
        
        Mail mail = Mail.withHtml(to, "Bem-vindo ao AEROSUITE - Configure sua senha", htmlBody)
            .addText(textBody);
        
        mailer.send(mail);
        LOGGER.info("Email de configuração de senha enviado com sucesso para: " + to);
    } catch (Exception e) {
        LOGGER.severe("Erro ao enviar email de configuração de senha: " + e.getMessage());
        throw new RuntimeException("Erro ao enviar email de configuração de senha", e);
    }
}

private String buildPasswordSetupEmailHtml(String nomeUsuario, String senhaTemporaria, String setupLink) {
    return String.format("""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Bem-vindo ao AEROSUITE</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <table width="100%%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
                <tr>
                    <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            <!-- Header -->
                            <tr>
                                <td style="background: linear-gradient(135deg, #0ea5e9 0%%, #0284c7 100%%); padding: 40px 20px; text-align: center;">
                                    <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">AEROSUITE</h1>
                                    <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Serviços Aeronáuticos</p>
                                </td>
                            </tr>
                            
                            <!-- Content -->
                            <tr>
                                <td style="padding: 40px 30px;">
                                    <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 24px;">Bem-vindo, %s!</h2>
                                    
                                    <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                        Sua conta foi criada com sucesso no sistema AEROSUITE. Para começar a usar o sistema, 
                                        você precisa configurar sua senha pessoal.
                                    </p>
                                    
                                    <div style="background-color: #f1f5f9; border-left: 4px solid #0ea5e9; padding: 20px; margin: 30px 0; border-radius: 4px;">
                                        <p style="color: #1e293b; font-size: 14px; font-weight: bold; margin: 0 0 10px 0;">
                                            📧 Seu email de acesso: <strong>%s</strong>
                                        </p>
                                        <p style="color: #1e293b; font-size: 14px; font-weight: bold; margin: 0;">
                                            🔑 Sua senha temporária: <strong style="font-family: monospace; font-size: 16px; color: #0ea5e9;">%s</strong>
                                        </p>
                                    </div>
                                    
                                    <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                                        <strong>Importante:</strong> Esta é uma senha temporária. Por segurança, você deve 
                                        alterá-la ao fazer o primeiro acesso ao sistema.
                                    </p>
                                    
                                    <div style="text-align: center; margin: 40px 0;">
                                        <a href="%s" style="display: inline-block; background-color: #0ea5e9; color: #ffffff; 
                                            text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: bold; 
                                            font-size: 16px; transition: background-color 0.3s;">
                                            Configurar Minha Senha
                                        </a>
                                    </div>
                                    
                                    <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                                        Se o botão não funcionar, copie e cole o link abaixo no seu navegador:<br>
                                        <a href="%s" style="color: #0ea5e9; word-break: break-all;">%s</a>
                                    </p>
                                    
                                    <div style="border-top: 1px solid #e2e8f0; margin-top: 40px; padding-top: 20px;">
                                        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                                            Este link expira em 7 dias. Se você não solicitou esta conta, 
                                            pode ignorar este email com segurança.
                                        </p>
                                    </div>
                                </td>
                            </tr>
                            
                            <!-- Footer -->
                            <tr>
                                <td style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                                    <p style="color: #64748b; font-size: 12px; margin: 0;">
                                        © %d AEROSUITE - Todos os direitos reservados
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """, nomeUsuario, to, senhaTemporaria, setupLink, setupLink, setupLink, java.time.Year.now().getValue());
}

private String buildPasswordSetupEmailText(String nomeUsuario, String senhaTemporaria, String setupLink) {
    return String.format("""
        AEROSUITE - Configuração de Senha
        
        Olá %s,
        
        Sua conta foi criada com sucesso no sistema AEROSUITE.
        
        Credenciais de acesso:
        Email: %s
        Senha temporária: %s
        
        IMPORTANTE: Esta é uma senha temporária. Você deve alterá-la ao fazer o primeiro acesso.
        
        Para configurar sua senha pessoal, acesse:
        %s
        
        Este link expira em 7 dias.
        
        Se você não solicitou esta conta, pode ignorar este email com segurança.
        
        © %d AEROSUITE - Todos os direitos reservados
        """, nomeUsuario, to, senhaTemporaria, setupLink, java.time.Year.now().getValue());
}
```

---

### **FASE 4: Frontend - Tela de Setup de Senha**

#### 4.1 Criar componente setup-password

**Arquivo:** `frontend/src/app/auth/setup-password/setup-password.component.ts`

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../auth.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-setup-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    CardModule,
    MessageModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './setup-password.component.html',
  styleUrls: ['./setup-password.component.scss']
})
export class SetupPasswordComponent implements OnInit {
  setupPasswordForm: FormGroup;
  loading = false;
  loadingToken = true;
  errorMessage = '';
  tokenValid = false;
  passwordSetup = false;
  userEmail = '';
  token = '';
  currentYear = new Date().getFullYear();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private messageService: MessageService
  ) {
    this.setupPasswordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    // Verificar se já está logado
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
      return;
    }

    // Obter token da URL
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      if (this.token) {
        this.validateToken();
      } else {
        this.loadingToken = false;
        this.tokenValid = false;
      }
    });
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword');
    const confirmPassword = control.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    if (confirmPassword && confirmPassword.errors?.['passwordMismatch']) {
      delete confirmPassword.errors['passwordMismatch'];
      if (Object.keys(confirmPassword.errors).length === 0) {
        confirmPassword.setErrors(null);
      }
    }
    
    return null;
  }

  validateToken() {
    this.loadingToken = true;
    this.authService.validateResetToken(this.token).subscribe({
      next: (response) => {
        this.loadingToken = false;
        this.tokenValid = response.valid;
        if (response.valid && response.email) {
          this.userEmail = response.email;
        }
      },
      error: (error) => {
        this.loadingToken = false;
        this.tokenValid = false;
        console.error('Erro ao validar token:', error);
      }
    });
  }

  onSubmit() {
    if (this.setupPasswordForm.valid && this.token && this.userEmail) {
      this.loading = true;
      this.errorMessage = '';
      
      const { currentPassword, newPassword } = this.setupPasswordForm.value;
      
      // Primeiro validar a senha atual
      this.http.post('/api/auth/validate-current-password', {
        email: this.userEmail,
        currentPassword: currentPassword
      }).subscribe({
        next: () => {
          // Se senha atual é válida, fazer reset com token
          this.authService.resetPassword(this.token, newPassword).subscribe({
            next: (response) => {
              this.loading = false;
              this.passwordSetup = true;
              this.messageService.add({
                severity: 'success',
                summary: 'Sucesso',
                detail: 'Senha configurada com sucesso!'
              });
            },
            error: (error) => {
              this.loading = false;
              this.errorMessage = error.error?.message || 'Erro ao configurar senha. Tente novamente.';
              this.messageService.add({
                severity: 'error',
                summary: 'Erro',
                detail: this.errorMessage
              });
            }
          });
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.error?.message || 'Senha atual incorreta. Verifique e tente novamente.';
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: this.errorMessage
          });
        }
      });
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
```

#### 4.2 Criar template HTML

**Arquivo:** `frontend/src/app/auth/setup-password/setup-password.component.html`

```html
<p-toast></p-toast>

<div class="setup-password-container">
  <div class="setup-password-background">
    <div class="setup-password-overlay"></div>
  </div>
  
  <div class="setup-password-content">
    <div class="setup-password-card">
      <div class="setup-password-header">
        <div class="logo-container">
          <img src="assets/aerosuite-logo.png" alt="AEROSUITE" class="logo">
          <h1 class="title">AEROSUITE</h1>
          <p class="subtitle">Configurar Senha</p>
        </div>
      </div>
      
      <div *ngIf="loadingToken" class="loading-container">
        <i class="pi pi-spin pi-spinner" style="font-size: 3rem; color: #0ea5e9;"></i>
        <p>Validando token...</p>
      </div>
      
      <div *ngIf="!loadingToken && !tokenValid" class="error-container">
        <div class="error-icon">
          <i class="pi pi-times-circle"></i>
        </div>
        <h2 class="error-title">Link Inválido ou Expirado</h2>
        <p class="error-message">
          O link de configuração de senha é inválido ou expirou. Entre em contato com o administrador.
        </p>
        <div class="error-actions">
          <button
            type="button"
            pButton
            label="Voltar ao Login"
            class="back-button"
            (click)="goToLogin()">
          </button>
        </div>
      </div>
      
      <div *ngIf="!loadingToken && tokenValid && !passwordSetup" class="setup-password-form-container">
        <p class="description" *ngIf="userEmail">
          Configurando senha para: <strong>{{ userEmail }}</strong>
        </p>
        
        <form [formGroup]="setupPasswordForm" (ngSubmit)="onSubmit()" class="setup-password-form">
          <div class="form-group">
            <label for="currentPassword" class="form-label">Senha Temporária</label>
            <p-password
              id="currentPassword"
              formControlName="currentPassword"
              placeholder="Digite a senha temporária recebida por email"
              [feedback]="false"
              [toggleMask]="true"
              styleClass="form-password"
              inputStyleClass="form-input"
              [class.error]="setupPasswordForm.get('currentPassword')?.invalid && setupPasswordForm.get('currentPassword')?.touched">
            </p-password>
            <small 
              *ngIf="setupPasswordForm.get('currentPassword')?.invalid && setupPasswordForm.get('currentPassword')?.touched"
              class="error-text">
              A senha temporária é obrigatória
            </small>
          </div>
          
          <div class="form-group">
            <label for="newPassword" class="form-label">Nova Senha</label>
            <p-password
              id="newPassword"
              formControlName="newPassword"
              placeholder="Digite sua nova senha"
              [feedback]="true"
              [toggleMask]="true"
              styleClass="form-password"
              inputStyleClass="form-input"
              [class.error]="setupPasswordForm.get('newPassword')?.invalid && setupPasswordForm.get('newPassword')?.touched">
            </p-password>
            <small 
              *ngIf="setupPasswordForm.get('newPassword')?.invalid && setupPasswordForm.get('newPassword')?.touched"
              class="error-text">
              <span *ngIf="setupPasswordForm.get('newPassword')?.errors?.['required']">A senha é obrigatória</span>
              <span *ngIf="setupPasswordForm.get('newPassword')?.errors?.['minlength']">A senha deve ter no mínimo 8 caracteres</span>
            </small>
          </div>
          
          <div class="form-group">
            <label for="confirmPassword" class="form-label">Confirmar Nova Senha</label>
            <p-password
              id="confirmPassword"
              formControlName="confirmPassword"
              placeholder="Confirme sua nova senha"
              [feedback]="false"
              [toggleMask]="true"
              styleClass="form-password"
              inputStyleClass="form-input"
              [class.error]="setupPasswordForm.get('confirmPassword')?.invalid && setupPasswordForm.get('confirmPassword')?.touched">
            </p-password>
            <small 
              *ngIf="setupPasswordForm.get('confirmPassword')?.invalid && setupPasswordForm.get('confirmPassword')?.touched"
              class="error-text">
              <span *ngIf="setupPasswordForm.get('confirmPassword')?.errors?.['required']">A confirmação de senha é obrigatória</span>
              <span *ngIf="setupPasswordForm.get('confirmPassword')?.errors?.['passwordMismatch']">As senhas não coincidem</span>
            </small>
          </div>
          
          <div class="form-actions">
            <button
              type="submit"
              pButton
              label="Configurar Senha"
              class="submit-button"
              [disabled]="setupPasswordForm.invalid || loading"
              [loading]="loading">
            </button>
            
            <button
              type="button"
              pButton
              label="Cancelar"
              class="cancel-button"
              (click)="goToLogin()"
              [disabled]="loading">
            </button>
          </div>
          
          <div *ngIf="errorMessage" class="error-message">
            <p-message severity="error" [text]="errorMessage"></p-message>
          </div>
        </form>
      </div>
      
      <div *ngIf="passwordSetup" class="success-container">
        <div class="success-icon">
          <i class="pi pi-check-circle"></i>
        </div>
        <h2 class="success-title">Senha Configurada com Sucesso!</h2>
        <p class="success-message">
          Sua senha foi configurada com sucesso. Você já pode fazer login com sua nova senha.
        </p>
        <div class="success-actions">
          <button
            type="button"
            pButton
            label="Ir para Login"
            class="login-button"
            (click)="goToLogin()">
          </button>
        </div>
      </div>
      
      <div class="footer">
        <p class="copyright">© {{ currentYear }} AEROSUITE - Todos os direitos reservados</p>
      </div>
    </div>
  </div>
</div>
```

#### 4.3 Adicionar rota

**Arquivo:** `frontend/src/app/app.routes.ts`

```typescript
{
  path: 'setup-password',
  loadComponent: () => import('./auth/setup-password/setup-password.component').then(m => m.SetupPasswordComponent)
}
```

---

### **FASE 5: Modificar Frontend - Remover campo senha do formulário**

#### 5.1 Atualizar usuario-list.component.ts

Remover campos de senha do formulário de criação, pois a senha será gerada automaticamente.

```typescript
initForm() {
  this.usuarioForm = this.fb.group({
    nome: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    perfilId: [null]
  });
}
```

---

## 📝 Resumo das Alterações

### Backend:
1. ✅ Criar `PasswordGenerator.java` - Utilitário para gerar senha segura
2. ✅ Modificar `UsuarioService.create()` - Gerar senha aleatória e enviar email
3. ✅ Adicionar `AuthService.createPasswordSetupToken()` - Criar token de setup
4. ✅ Adicionar `AuthService.validateCurrentPassword()` - Validar senha atual
5. ✅ Adicionar `EmailService.sendPasswordSetupEmail()` - Enviar email de boas-vindas
6. ✅ Criar endpoint `/api/auth/validate-current-password` - Validar senha atual
7. ✅ Criar DTO `ValidateCurrentPasswordRequest.java`

### Frontend:
1. ✅ Criar componente `setup-password` - Tela de configuração de senha
2. ✅ Adicionar rota `/setup-password` - Rota para tela de setup
3. ✅ Modificar `usuario-list.component.ts` - Remover campos de senha do formulário
4. ✅ Adicionar método em `AuthService` - Validar senha atual (se necessário)

---

## 🔐 Segurança

- ✅ Senha temporária gerada com caracteres aleatórios seguros
- ✅ Token expira em 7 dias (configurável)
- ✅ Token é único e não pode ser reutilizado
- ✅ Validação de senha atual antes de permitir redefinição
- ✅ Senha não é retornada no DTO após criação
- ✅ Email contém instruções claras de segurança

---

## 🧪 Testes Recomendados

1. Criar novo usuário e verificar se senha aleatória é gerada
2. Verificar se email é enviado corretamente
3. Clicar no link do email e verificar redirecionamento
4. Testar validação de senha temporária incorreta
5. Testar configuração de senha com sucesso
6. Verificar se token é invalidado após uso
7. Testar expiração de token (após 7 dias)

---

## 📌 Próximos Passos

1. Implementar as alterações conforme o plano
2. Testar fluxo completo end-to-end
3. Ajustar estilos CSS da tela de setup-password (reutilizar de reset-password)
4. Documentar processo para administradores
5. Considerar adicionar log de auditoria para criação de usuários

