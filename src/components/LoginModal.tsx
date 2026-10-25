import React, { useState, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  User,
  LogIn,
  UserPlus,
  X,
  AlertTriangle,
  LogOut,
  ShieldCheck,
  KeyRound,
  ArrowLeft,
  CheckCircle2,
  ShieldAlert,
  HelpCircle,
  Copy,
  Check,
  Mail,
  RefreshCw,
} from 'lucide-react';
import { UserAccount, UserRole } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  onLogin: (user: UserAccount) => void;
  onRegisterUser: (user: UserAccount) => void;
  onUpdateUser?: (user: UserAccount) => void;
  onLogout?: () => void;
  existingUsers: UserAccount[];
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onRegisterUser,
  onUpdateUser,
  onLogout,
  existingUsers,
}) => {
  // Mode: 'login' | 'register' | 'recovery'
  const [mode, setMode] = useState<'login' | 'register' | 'recovery'>(
    existingUsers.length === 0 ? 'register' : 'login'
  );

  // Login form state
  const [loginUsername, setLoginUsername] = useState(
    currentUser?.user || (existingUsers[0]?.user ?? '')
  );
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState<UserRole>(
    existingUsers.length === 0 ? 'Administrador' : 'Ventas'
  );
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regSecurityQuestion, setRegSecurityQuestion] = useState(
    '¿En qué municipio está la planta principal de FALPRO?'
  );
  const [regSecurityAnswer, setRegSecurityAnswer] = useState('Chocontá');

  // Password Recovery state
  const [recoverUser, setRecoverUser] = useState(
    currentUser?.user || (existingUsers[0]?.user ?? '')
  );
  const [recoveryMethod, setRecoveryMethod] = useState<'masterKey' | 'otp' | 'securityQuestion'>('masterKey');
  const [masterKeyInput, setMasterKeyInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('839214');
  const [securityAnswerInput, setSecurityAnswerInput] = useState('');
  const [isIdentityVerified, setIsIdentityVerified] = useState(false);
  const [newRecoveredPassword, setNewRecoveredPassword] = useState('');
  const [confirmRecoveredPassword, setConfirmRecoveredPassword] = useState('');
  const [showRecoveredPassword, setShowRecoveredPassword] = useState(false);
  const [otpCopied, setOtpCopied] = useState(false);

  // Feedback states
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Keep form updated when modal opens or users list changes
  useEffect(() => {
    if (existingUsers.length === 0) {
      setMode('register');
      setRegRole('Administrador');
    } else {
      if (!loginUsername || !existingUsers.some((u) => u.user === loginUsername)) {
        if (existingUsers.length > 0) {
          setLoginUsername(existingUsers[0].user);
        }
      }
      if (!recoverUser || !existingUsers.some((u) => u.user === recoverUser)) {
        if (existingUsers.length > 0) {
          setRecoverUser(existingUsers[0].user);
        }
      }
    }
    setLoginPassword('');
    setErrorMsg('');
    setSuccessMsg('');
    setIsIdentityVerified(false);
  }, [isOpen, existingUsers]);

  if (!isOpen) return null;

  const handleGenerateNewOtp = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setOtpCopied(false);
  };

  const handleStartRecovery = () => {
    setMode('recovery');
    setErrorMsg('');
    setSuccessMsg('');
    setIsIdentityVerified(false);
    setMasterKeyInput('');
    setOtpInput('');
    setSecurityAnswerInput('');
    setNewRecoveredPassword('');
    setConfirmRecoveredPassword('');
    handleGenerateNewOtp();

    const currentSelected = loginUsername || existingUsers[0]?.user || '';
    setRecoverUser(currentSelected);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const targetUser = existingUsers.find(
      (u) => u.user.toLowerCase() === loginUsername.trim().toLowerCase()
    );

    if (!targetUser) {
      setErrorMsg(`El usuario "@${loginUsername}" no se encuentra registrado en el sistema.`);
      return;
    }

    if (targetUser.estado === 'Suspendido') {
      setErrorMsg('Esta cuenta de usuario se encuentra suspendida. Contacte al Administrador.');
      return;
    }

    // Check password
    if (targetUser.password && targetUser.password !== loginPassword) {
      setErrorMsg('Contraseña incorrecta. Por favor intente de nuevo o use la opción de recuperar contraseña.');
      return;
    }

    // Login successful
    onLogin(targetUser);
    setLoginPassword('');
    onClose();
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanUser = regUsername.trim().toLowerCase().replace(/\s+/g, '');
    if (!cleanUser) {
      setErrorMsg('El nombre de usuario es obligatorio.');
      return;
    }

    if (existingUsers.some((u) => u.user.toLowerCase() === cleanUser)) {
      setErrorMsg('Este nombre de usuario ya está registrado. Elija otro.');
      return;
    }

    if (!regPassword || regPassword.length < 4) {
      setErrorMsg('La contraseña debe tener un mínimo de 4 caracteres.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    const newUser: UserAccount = {
      id: 'usr-' + Date.now(),
      user: cleanUser,
      nombre: regName.trim() || cleanUser,
      role: existingUsers.length === 0 ? 'Administrador' : regRole,
      password: regPassword,
      correo: regEmail.trim() || undefined,
      preguntaSeguridad: regSecurityQuestion,
      respuestaSeguridad: regSecurityAnswer.trim() || 'Chocontá',
      estado: 'Activo',
      updated: `${new Date().toLocaleDateString()} (Auto-registro)`,
    };

    onRegisterUser(newUser);
    onLogin(newUser);
    setRegName('');
    setRegUsername('');
    setRegEmail('');
    setRegPassword('');
    setRegConfirmPassword('');
    onClose();
  };

  // Step 1 of Recovery: Verify identity
  const handleVerifyRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const targetUser = existingUsers.find(
      (u) => u.user.toLowerCase() === recoverUser.trim().toLowerCase()
    );

    if (!targetUser) {
      setErrorMsg('El usuario seleccionado no existe.');
      return;
    }

    if (targetUser.estado === 'Suspendido') {
      setErrorMsg('Esta cuenta está suspendida. Contacte al Administrador general.');
      return;
    }

    if (recoveryMethod === 'masterKey') {
      const cleanKey = masterKeyInput.trim();
      // Master code is FALPRO-2026 or any active Admin's password
      const adminUsers = existingUsers.filter((u) => u.role === 'Administrador');
      const isAdminPassword = adminUsers.some((a) => a.password && a.password === cleanKey);

      if (cleanKey === 'FALPRO-2026' || cleanKey === 'falpro2026' || isAdminPassword) {
        setIsIdentityVerified(true);
        setErrorMsg('');
      } else {
        setErrorMsg('Clave Maestra o de Administrador incorrecta. Solicítela al encargado del taller.');
      }
    } else if (recoveryMethod === 'otp') {
      if (otpInput.trim() === generatedOtp) {
        setIsIdentityVerified(true);
        setErrorMsg('');
      } else {
        setErrorMsg('El código de verificación no coincide con el generado.');
      }
    } else if (recoveryMethod === 'securityQuestion') {
      const expected = (targetUser.respuestaSeguridad || 'chocontá').trim().toLowerCase();
      const entered = securityAnswerInput.trim().toLowerCase();

      // Normalize accents
      const normExpected = expected.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const normEntered = entered.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

      if (normExpected === normEntered || normEntered.includes(normExpected)) {
        setIsIdentityVerified(true);
        setErrorMsg('');
      } else {
        setErrorMsg('Respuesta de seguridad incorrecta. Verifique la información o use la Clave Maestra.');
      }
    }
  };

  // Step 2 of Recovery: Save new password
  const handleSaveRecoveredPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!newRecoveredPassword || newRecoveredPassword.length < 4) {
      setErrorMsg('La nueva contraseña debe tener al menos 4 caracteres.');
      return;
    }

    if (newRecoveredPassword !== confirmRecoveredPassword) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    const targetUser = existingUsers.find(
      (u) => u.user.toLowerCase() === recoverUser.trim().toLowerCase()
    );

    if (!targetUser) {
      setErrorMsg('No se encontró el usuario para actualizar.');
      return;
    }

    const updatedUser: UserAccount = {
      ...targetUser,
      password: newRecoveredPassword,
      updated: `${new Date().toLocaleDateString()} (Clave recuperada)`,
    };

    if (onUpdateUser) {
      onUpdateUser(updatedUser);
    }

    setSuccessMsg(`¡Contraseña de @${targetUser.user} restablecida con éxito! Ingresando al sistema...`);

    setTimeout(() => {
      onLogin(updatedUser);
      setNewRecoveredPassword('');
      setConfirmRecoveredPassword('');
      setIsIdentityVerified(false);
      setMode('login');
      onClose();
    }, 1500);
  };

  const currentRecoverUserAccount = existingUsers.find(
    (u) => u.user.toLowerCase() === recoverUser.trim().toLowerCase()
  );

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-white my-auto">
        {currentUser && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-neutral-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="flex flex-col items-center mb-5 text-center">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center p-1.5 shadow-xl shadow-red-900/40 border border-neutral-700 mb-2.5 overflow-hidden">
            <img
              src="/assets/aistudio/0536b826-dd6a-4517-a94c-df560356e50f_21824cc7.jpg"
              alt="FALPRO Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="text-xl font-black tracking-wider text-white flex items-center justify-center gap-1.5 font-mono">
            <span>FAL<span className="text-[#e50914]">PRO</span></span>
            <span className="text-xs text-neutral-400 font-bold">S.A.S.</span>
          </h2>
          <p className="text-[11px] text-neutral-400 mt-0.5">
            Sistema de Acceso con Contraseña y Permisos · Chocontá
          </p>
        </div>

        {/* Header bar for Login */}
        {existingUsers.length > 0 && mode === 'login' && (
          <div className="flex items-center justify-between pb-2.5 border-b border-neutral-800 mb-3.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#e50914] animate-pulse"></span>
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Ingreso al Sistema
              </span>
            </div>
            <span className="text-[10px] text-neutral-400">
              Solo personal autorizado
            </span>
          </div>
        )}

        {/* Alert Error Box */}
        {errorMsg && (
          <div className="p-2.5 mb-3 rounded-lg bg-red-950/80 border border-red-800 text-red-300 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Alert Box */}
        {successMsg && (
          <div className="p-2.5 mb-3 rounded-lg bg-green-950/80 border border-green-800 text-green-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-green-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Existing Users Notice if empty */}
        {existingUsers.length === 0 && (
          <div className="p-3 mb-4 rounded-xl bg-amber-950/40 border border-amber-800/80 text-amber-200 text-xs flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <div className="font-bold text-white mb-0.5">Registro Inicial de Administrador</div>
              <p className="text-[11px] text-amber-300/90 leading-relaxed">
                La lista de usuarios ha comenzado desde 0. Registre la primera cuenta de Administrador con su contraseña personal.
              </p>
            </div>
          </div>
        )}

        {/* 1. LOGIN FORM */}
        {mode === 'login' && existingUsers.length > 0 && (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-semibold uppercase text-neutral-300 mb-1">
                Usuario Registrado*
              </label>
              <select
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs focus:outline-none focus:border-[#e50914] text-white"
              >
                {existingUsers.map((u) => (
                  <option key={u.user} value={u.user}>
                    {u.nombre} (@{u.user}) - {u.role}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-semibold uppercase text-neutral-300">
                  Contraseña*
                </label>
                <button
                  type="button"
                  onClick={handleStartRecovery}
                  className="text-[11px] text-neutral-400 hover:text-[#e50914] transition-colors flex items-center gap-1 cursor-pointer font-medium hover:underline"
                >
                  <KeyRound className="w-3 h-3 text-[#e50914]" />
                  ¿Olvidó su contraseña?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Ingrese su contraseña"
                  className="w-full pl-9 pr-10 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs focus:outline-none focus:border-[#e50914] text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-2.5 text-neutral-400 hover:text-white cursor-pointer"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#e50914] hover:bg-[#b80710] text-white py-2.5 rounded-lg font-bold text-xs tracking-wide transition shadow-lg shadow-red-900/40 mt-1 flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" /> Iniciar Sesión
            </button>

            <div className="pt-2 text-center">
              <p className="text-[10px] text-neutral-500">
                * El registro y creación de nuevos usuarios es potestad exclusiva del <strong className="text-neutral-400">Administrador</strong> desde el panel de Usuarios.
              </p>
            </div>
          </form>
        )}

        {/* 2. PASSWORD RECOVERY FLOW */}
        {mode === 'recovery' && (
          <div className="space-y-4">
            {/* Header with back button */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-950/60 border border-red-800 flex items-center justify-center text-[#e50914]">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Recuperación de Contraseña
                  </h3>
                  <p className="text-[10px] text-neutral-400">
                    Restablezca su clave de acceso
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Volver
              </button>
            </div>

            {/* Target Account Selector */}
            <div>
              <label className="block text-[11px] font-semibold uppercase text-neutral-300 mb-1">
                Cuenta a Recuperar*
              </label>
              <select
                value={recoverUser}
                onChange={(e) => {
                  setRecoverUser(e.target.value);
                  setIsIdentityVerified(false);
                  setErrorMsg('');
                }}
                disabled={isIdentityVerified}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs focus:outline-none focus:border-[#e50914] text-white disabled:opacity-60"
              >
                {existingUsers.map((u) => (
                  <option key={u.user} value={u.user}>
                    {u.nombre} (@{u.user}) - {u.role}
                  </option>
                ))}
              </select>
            </div>

            {/* STEP 1: VERIFY IDENTITY */}
            {!isIdentityVerified ? (
              <form onSubmit={handleVerifyRecovery} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-neutral-300 mb-1.5">
                    Método de Validación*
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => {
                        setRecoveryMethod('masterKey');
                        setErrorMsg('');
                      }}
                      className={`p-1.5 rounded-lg border text-center transition cursor-pointer ${
                        recoveryMethod === 'masterKey'
                          ? 'bg-neutral-800 text-[#e50914] border-[#e50914]'
                          : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                      }`}
                    >
                      Clave Maestra
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRecoveryMethod('otp');
                        setErrorMsg('');
                      }}
                      className={`p-1.5 rounded-lg border text-center transition cursor-pointer ${
                        recoveryMethod === 'otp'
                          ? 'bg-neutral-800 text-[#e50914] border-[#e50914]'
                          : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                      }`}
                    >
                      Código OTP
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRecoveryMethod('securityQuestion');
                        setErrorMsg('');
                      }}
                      className={`p-1.5 rounded-lg border text-center transition cursor-pointer ${
                        recoveryMethod === 'securityQuestion'
                          ? 'bg-neutral-800 text-[#e50914] border-[#e50914]'
                          : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                      }`}
                    >
                      Pregunta
                    </button>
                  </div>
                </div>

                {/* Option 1: Master Key */}
                {recoveryMethod === 'masterKey' && (
                  <div className="space-y-2 p-3 bg-neutral-900/80 rounded-xl border border-neutral-800 text-xs">
                    <div className="flex items-start gap-2 text-neutral-300 text-[11px]">
                      <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <p>
                        Autorización de supervisor/taller: Ingrese la <strong>Clave Maestra</strong> de la empresa (o la clave de cualquier Administrador activo).
                      </p>
                    </div>
                    <div>
                      <input
                        type="password"
                        required
                        value={masterKeyInput}
                        onChange={(e) => setMasterKeyInput(e.target.value)}
                        placeholder="Ingrese la clave maestra (ej. FALPRO-2026)"
                        className="w-full px-3 py-2 bg-black border border-neutral-700 rounded-lg text-xs focus:outline-none focus:border-[#e50914] text-white"
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-neutral-500 pt-1">
                      <span>Clave por defecto de planta:</span>
                      <button
                        type="button"
                        onClick={() => setMasterKeyInput('FALPRO-2026')}
                        className="text-neutral-400 hover:text-white font-mono bg-neutral-800 px-1.5 py-0.5 rounded cursor-pointer"
                      >
                        FALPRO-2026
                      </button>
                    </div>
                  </div>
                )}

                {/* Option 2: OTP Simulator */}
                {recoveryMethod === 'otp' && (
                  <div className="space-y-2.5 p-3 bg-neutral-900/80 rounded-xl border border-neutral-800 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-neutral-300 text-[11px]">
                        <Mail className="w-4 h-4 text-[#e50914] shrink-0" />
                        <span>Código de seguridad generado para este equipo:</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleGenerateNewOtp}
                        className="text-neutral-400 hover:text-white p-1 rounded hover:bg-neutral-800 transition cursor-pointer"
                        title="Generar nuevo código"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="p-2.5 bg-black rounded-lg border border-neutral-800 flex items-center justify-between">
                      <div className="font-mono text-base font-bold tracking-widest text-[#e50914]">
                        {generatedOtp}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpInput(generatedOtp);
                          setOtpCopied(true);
                          setTimeout(() => setOtpCopied(false), 2000);
                        }}
                        className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[10px] font-semibold rounded flex items-center gap-1 cursor-pointer transition"
                      >
                        {otpCopied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                        {otpCopied ? 'Aplicado' : 'Autocompletar'}
                      </button>
                    </div>

                    <div>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value.trim())}
                        placeholder="Ingrese los 6 dígitos generados"
                        className="w-full px-3 py-2 bg-black border border-neutral-700 rounded-lg text-xs font-mono tracking-wider focus:outline-none focus:border-[#e50914] text-white"
                      />
                    </div>
                  </div>
                )}

                {/* Option 3: Security Question */}
                {recoveryMethod === 'securityQuestion' && (
                  <div className="space-y-2 p-3 bg-neutral-900/80 rounded-xl border border-neutral-800 text-xs">
                    <div className="flex items-start gap-1.5 text-neutral-300 text-[11px]">
                      <HelpCircle className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-white">Pregunta de Seguridad:</span>
                        <p className="text-neutral-300 mt-0.5 italic">
                          {currentRecoverUserAccount?.preguntaSeguridad ||
                            '¿En qué municipio está la planta principal de FALPRO?'}
                        </p>
                      </div>
                    </div>
                    <div>
                      <input
                        type="text"
                        required
                        value={securityAnswerInput}
                        onChange={(e) => setSecurityAnswerInput(e.target.value)}
                        placeholder="Escriba su respuesta (ej. Chocontá)"
                        className="w-full px-3 py-2 bg-black border border-neutral-700 rounded-lg text-xs focus:outline-none focus:border-[#e50914] text-white"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-[#e50914] hover:bg-[#b80710] text-white py-2.5 rounded-lg font-bold text-xs tracking-wide transition shadow-lg shadow-red-900/40 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" /> Verificar Identidad y Continuar
                </button>
              </form>
            ) : (
              /* STEP 2: SET NEW PASSWORD */
              <form onSubmit={handleSaveRecoveredPassword} className="space-y-3.5 animate-in fade-in">
                <div className="p-2.5 bg-green-950/40 border border-green-800 rounded-lg text-xs text-green-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                  <span>Identidad confirmada para @{recoverUser}. Defina su nueva clave.</span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-neutral-300 mb-1">
                    Nueva Contraseña*
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
                    <input
                      type={showRecoveredPassword ? 'text' : 'password'}
                      required
                      value={newRecoveredPassword}
                      onChange={(e) => setNewRecoveredPassword(e.target.value)}
                      placeholder="Mínimo 4 caracteres"
                      className="w-full pl-9 pr-10 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs focus:outline-none focus:border-[#e50914] text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRecoveredPassword(!showRecoveredPassword)}
                      className="absolute right-3 top-2.5 text-neutral-400 hover:text-white cursor-pointer"
                    >
                      {showRecoveredPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-neutral-300 mb-1">
                    Confirmar Nueva Contraseña*
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
                    <input
                      type={showRecoveredPassword ? 'text' : 'password'}
                      required
                      value={confirmRecoveredPassword}
                      onChange={(e) => setConfirmRecoveredPassword(e.target.value)}
                      placeholder="Repita la nueva contraseña"
                      className="w-full pl-9 pr-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs focus:outline-none focus:border-[#e50914] text-white"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsIdentityVerified(false)}
                    className="flex-1 px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Atrás
                  </button>
                  <button
                    type="submit"
                    className="flex-2 bg-[#e50914] hover:bg-[#b80710] text-white py-2 rounded-lg font-bold text-xs tracking-wide transition shadow-lg shadow-red-900/40 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Guardar e Ingresar
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* 3. REGISTER FORM - ONLY AVAILABLE FOR INITIAL 0-USER SETUP */}
        {existingUsers.length === 0 && mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase text-neutral-300 mb-1">
                Nombre Completo*
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Ej. Javier Martínez"
                  className="w-full pl-9 pr-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs focus:outline-none focus:border-[#e50914] text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase text-neutral-300 mb-1">
                Nombre de Usuario (Login)*
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-neutral-500 font-mono text-xs">@</span>
                <input
                  type="text"
                  required
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="ej. jmartinez o admin"
                  className="w-full pl-8 pr-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs focus:outline-none focus:border-[#e50914] text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase text-neutral-300 mb-1">
                Correo Electrónico (para notificaciones / recuperación)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="ej. contacto@falpro.com"
                  className="w-full pl-9 pr-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs focus:outline-none focus:border-[#e50914] text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase text-neutral-300 mb-1">
                Rol Operativo*
              </label>
              <select
                value={regRole}
                onChange={(e) => setRegRole(e.target.value as UserRole)}
                disabled={existingUsers.length === 0}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs focus:outline-none focus:border-[#e50914] text-white font-semibold"
              >
                <option value="Administrador">Administrador (Acceso total)</option>
                <option value="Ventas">Ventas (Pedidos, Clientes, Facturas)</option>
                <option value="Producción">Producción (Tablero de fabricación)</option>
                <option value="Instalación/Envíos">Instalación / Envíos</option>
                <option value="Mayoristas">Mayoristas</option>
                <option value="Consulta">Consulta (Solo lectura)</option>
              </select>
              {existingUsers.length === 0 && (
                <p className="text-[10px] text-neutral-400 mt-1">
                  * La primera cuenta se configura como Administrador general.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-neutral-300 mb-1">
                  Contraseña*
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-neutral-500" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Mín. 4 caracteres"
                    className="w-full pl-8 pr-7 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs focus:outline-none focus:border-[#e50914] text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-2 top-2 text-neutral-400 hover:text-white"
                  >
                    {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-neutral-300 mb-1">
                  Confirmar*
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-neutral-500" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Repetir clave"
                    className="w-full pl-8 pr-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs focus:outline-none focus:border-[#e50914] text-white"
                  />
                </div>
              </div>
            </div>

            <div className="p-2.5 bg-neutral-900/80 rounded-xl border border-neutral-800 space-y-2">
              <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
                Pregunta de Seguridad para Recuperación
              </span>
              <select
                value={regSecurityQuestion}
                onChange={(e) => setRegSecurityQuestion(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-black border border-neutral-700 rounded-lg text-[11px] text-white focus:outline-none focus:border-[#e50914]"
              >
                <option value="¿En qué municipio está la planta principal de FALPRO?">
                  ¿En qué municipio está la planta principal de FALPRO?
                </option>
                <option value="¿Cuál es el nombre de su primera mascota?">
                  ¿Cuál es el nombre de su primera mascota?
                </option>
                <option value="¿Cuál es la placa de su primer vehículo?">
                  ¿Cuál es la placa de su primer vehículo?
                </option>
                <option value="¿Cuál es su ciudad o municipio de nacimiento?">
                  ¿Cuál es su ciudad o municipio de nacimiento?
                </option>
              </select>
              <input
                type="text"
                value={regSecurityAnswer}
                onChange={(e) => setRegSecurityAnswer(e.target.value)}
                placeholder="Respuesta secreta (ej. Chocontá)"
                className="w-full px-2.5 py-1.5 bg-black border border-neutral-700 rounded-lg text-[11px] text-white focus:outline-none focus:border-[#e50914]"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#e50914] hover:bg-[#b80710] text-white py-2.5 rounded-lg font-bold text-xs tracking-wide transition shadow-lg shadow-red-900/40 mt-2 flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" /> Registrar Cuenta e Ingresar
            </button>
          </form>
        )}

        {/* Current user session info and logout */}
        {currentUser && (
          <div className="mt-5 pt-4 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
            <div>
              Sesión activa: <strong className="text-white">@{currentUser.user}</strong> ({currentUser.role})
            </div>
            {onLogout && (
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="text-neutral-400 hover:text-red-400 flex items-center gap-1 font-semibold transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" /> Cerrar Sesión
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
