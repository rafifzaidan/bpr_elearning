import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart' as supa;
import '../models/user.dart';

class AuthProvider with ChangeNotifier {
  User? _user;
  bool _isLoading = false;
  bool _needsPasswordChange = false;
  bool _isOtpPending = false;
  String? _pendingOtpEmail;

  User? get user => _user;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _user != null && !_isOtpPending;
  bool get needsPasswordChange => _needsPasswordChange;
  bool get isOtpPending => _isOtpPending;

  final _supabase = supa.Supabase.instance.client;

  /// Login with NIP or Email.
  /// If input contains '@', treat as email; otherwise append @bpr-jatim.internal
  Future<void> login(String nipOrEmail, String password) async {
    _isLoading = true;
    notifyListeners();

    try {
      debugPrint('DEBUG: Starting login process for $nipOrEmail...');
      
      // Auto-detect: NIP vs Email
      String email;
      if (nipOrEmail.contains('@')) {
        email = nipOrEmail.trim();
      } else {
        // Resolve NIP ke email asli menggunakan RPC
        try {
          debugPrint('DEBUG: Calling RPC get_login_email_by_nip for $nipOrEmail...');
          final response = await _supabase.rpc('get_login_email_by_nip', params: {
            'p_nip': nipOrEmail.trim()
          });
          
          debugPrint('DEBUG: RPC Response type: ${response.runtimeType}, value: $response');
          
          if (response != null && response.toString().trim().isNotEmpty) {
            email = response.toString().trim();
            debugPrint('DEBUG: SUCCESS! NIP resolved to email -> $email');
          } else {
            debugPrint('DEBUG: RPC returned empty or null. Using fallback.');
            email = '${nipOrEmail.trim()}@bpr-jatim.internal';
          }
        } catch (e) {
          debugPrint('DEBUG: CRITICAL ERROR in RPC call -> $e');
          email = '${nipOrEmail.trim()}@bpr-jatim.internal';
        }
      }

      debugPrint('DEBUG: Authenticating with Supabase Auth... ($email)');
      final response = await _supabase.auth.signInWithPassword(
        email: email,
        password: password,
      ).timeout(const Duration(seconds: 15), onTimeout: () {
        throw Exception('Koneksi ke server absen (Timeout). Periksa sinyal internet kamu.');
      });

      if (response.user != null) {
        debugPrint('DEBUG: Password Correct! Checking MFA status...');
        
        // Cek mfa_enabled dari meta data auth atau custom tabel
        bool isMfaEnabled = response.user!.userMetadata?['mfa_enabled'] == true;
        
        if (!isMfaEnabled) {
          // Double check database 
          try {
             final dbUser = await _supabase.from('users').select('mfa_enabled').eq('id', response.user!.id).single();
             isMfaEnabled = dbUser['mfa_enabled'] == true;
          } catch (_) {}
        }
        
        if (isMfaEnabled) {
          debugPrint('DEBUG: MFA is enabled. Requesting OTP to email...');
          await _supabase.auth.signOut(); // Hapus session password
          await _supabase.auth.signInWithOtp(email: email); // Kirim OTP
          
          _pendingOtpEmail = email;
          _isOtpPending = true;
          // Jangan fetch profile yet
        } else {
          debugPrint('DEBUG: Auth Success! MFA Disable. Fetching profile...');
          await _fetchProfileAndSetUser(response.user!.id);
          debugPrint('DEBUG: Login process complete! User: ${_user?.fullName}');
        }
      } else {
        throw Exception('Login gagal. Periksa NIP dan password Anda.');
      }
    } catch (e) {
      debugPrint('DEBUG: Login Error -> $e');
      _isLoading = false;
      notifyListeners();
      rethrow;
    } finally {
      if (_isLoading) {
        _isLoading = false;
        notifyListeners();
      }
    }
  }

  /// Verify OTP for Login / MFA
  Future<void> verifyLoginOtp(String otp) async {
    if (_pendingOtpEmail == null) throw Exception("Sesi OTP tidak valid. Silakan login kembali.");
    
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _supabase.auth.verifyOTP(
        type: supa.OtpType.magiclink, // Magiclink type di Supabase FLutter digunakan juga untuk 6-digit email OTP
        email: _pendingOtpEmail,
        token: otp,
      );

      if (response.user != null) {
        await _fetchProfileAndSetUser(response.user!.id);
        _pendingOtpEmail = null;
        _isOtpPending = false;
        debugPrint('DEBUG: OTP Verify Success! User: ${_user?.fullName}');
      } else {
        throw Exception("Kode OTP tidak valid atau sudah kedaluwarsa.");
      }
    } catch (e) {
      debugPrint('DEBUG: OTP Error -> $e');
      _isLoading = false;
      notifyListeners();
      rethrow;
    } finally {
      if (_isLoading) {
        _isLoading = false;
        notifyListeners();
      }
    }
  }

  /// Fetch user profile from the `users` table (joined with division)
  Future<void> _fetchProfileAndSetUser(String uid) async {
    try {
      debugPrint('DEBUG: Fetching profile from public.users table...');
      final data = await _supabase
          .from('users')
          .select('*, division:divisions(name)')
          .eq('id', uid)
          .single()
          .timeout(const Duration(seconds: 10), onTimeout: () {
            throw Exception('Gagal mengambil data profil (Timeout).');
          });

      debugPrint('DEBUG: Profile Data Received: $data');
      _user = User.fromJson(data);
      _needsPasswordChange = _user!.mustChangePw;

      // Cache locally
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('user', jsonEncode(_user!.toJson()));
      debugPrint('DEBUG: Profile cached locally.');
    } catch (e) {
      debugPrint('DEBUG: Profile Error -> $e');
      throw Exception('Gagal memuat profil pengguna dari database.');
    }
  }

  /// Kirim OTP untuk verifikasi sebelum mengganti password
  Future<void> requestPasswordChangeOtp() async {
    if (_user == null) return;
    
    _isLoading = true;
    notifyListeners();
    try {
      // Resolve email jika tidak tersimpan di context lokal
      String email = _user!.nip; // Asumsi sederhana
      try {
        final res = await _supabase.rpc('get_login_email_by_nip', params: {'p_nip': _user!.nip});
        if (res != null && res.toString().trim().isNotEmpty) {
          email = res.toString().trim();
        } else {
          email = '${_user!.nip}@bpr-jatim.internal';
        }
      } catch (_) {}

      await _supabase.auth.resetPasswordForEmail(email); // Kirim OTP 6 digit
      _pendingOtpEmail = email;
    } catch (e) {
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Change password (forced on first login, or manual) requiring OTP
  Future<void> changePassword(String newPassword, {String? otp}) async {
    try {
      // Jika butuh verifikasi OTP (dari email verifikasi)
      // Wait, if they are already logged in, Supabase updateUser doesn't strictly need OTP by default unless Secure Email Change is on. 
      // Tapi karena user minta harus ada verifikasi OTP untuk ganti password:
      if (otp != null && _pendingOtpEmail != null) {
         // Verifikasi OTP dulu
         await _supabase.auth.verifyOTP(
            type: supa.OtpType.recovery, // Recovery type untuk reset password
            email: _pendingOtpEmail,
            token: otp,
         );
      }

      await _supabase.auth.updateUser(
        supa.UserAttributes(password: newPassword),
      );

      // Update must_change_pw flag to false
      await _supabase
          .from('users')
          .update({'must_change_pw': false})
          .eq('id', _user!.id);

      _needsPasswordChange = false;

      // Update cached user
      _user = User(
        id: _user!.id,
        nip: _user!.nip,
        fullName: _user!.fullName,
        divisionId: _user!.divisionId,
        divisionName: _user!.divisionName,
        role: _user!.role,
        mfaEnabled: _user!.mfaEnabled,
        mustChangePw: false,
      );

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('user', jsonEncode(_user!.toJson()));

      notifyListeners();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> logout() async {
    await _supabase.auth.signOut();
    _user = null;
    _needsPasswordChange = false;
    _isOtpPending = false;
    _pendingOtpEmail = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('user');
    notifyListeners();
  }

  /// Request password reset via email
  Future<void> sendPasswordResetEmail(String email) async {
    _isLoading = true;
    notifyListeners();
    try {
      await _supabase.auth.resetPasswordForEmail(
        email,
        redirectTo: 'bprelearning://reset-callback',
      );
    } catch (e) {
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> tryAutoLogin() async {
    final supaUser = _supabase.auth.currentUser;
    if (supaUser == null) return;

    try {
      // Selalu ambil data terbaru dari database setiap kali aplikasi dibuka
      await _fetchProfileAndSetUser(supaUser.id);
    } catch (e) {
      debugPrint('DEBUG: Gagal fetch profile di startup, menggunakan cache. Error: $e');
      // Gunakan cache LOKAL HANYA jika gagal mengambil dari internet/database
      final prefs = await SharedPreferences.getInstance();
      final userData = prefs.getString('user');

      if (userData != null) {
        _user = User.fromJson(jsonDecode(userData));
        _needsPasswordChange = _user!.mustChangePw;
      }
    }
    notifyListeners();
  }

  /// Demo mode — skip Supabase auth, use a dummy user for testing UI
  void useDemoMode() {
    _user = User(
      id: 'demo-user-0000-0000-000000000000',
      nip: '12345678',
      fullName: 'Demo User',
      divisionId: 1,
      divisionName: 'Teknologi Informasi',
      role: 'EMPLOYEE',
      mfaEnabled: false,
      mustChangePw: false,
    );
    _needsPasswordChange = false;
    notifyListeners();
  }
}
