import 'dart:async';
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/module.dart';

class ModuleProvider with ChangeNotifier {
  List<Module> _modules = [];
  Module? _currentModule;
  bool _isLoading = false;

  List<Module> get modules => _modules;
  Module? get currentModule => _currentModule;
  bool get isLoading => _isLoading;

  final _supabase = Supabase.instance.client;

  /// Check if we're in demo mode (no Supabase auth session)
  bool get _isDemoMode => _supabase.auth.currentUser == null;

  StreamSubscription<List<Map<String, dynamic>>>? _moduleSubscription;

  /// Fetch modules for the current user's division using Realtime Streams.
  /// RLS handles the filtering automatically.
  void initModuleStream() {
    _isLoading = true;
    notifyListeners();

    _moduleSubscription?.cancel();

    _moduleSubscription = _supabase
        .from('modules')
        .stream(primaryKey: ['id'])
        .order('created_at', ascending: false)
        .listen((data) {
          _modules = data.map((json) => Module.fromJson(json)).toList();
          _isLoading = false;
          notifyListeners();
        }, onError: (error) {
          debugPrint('Error in module stream: $error');
          _isLoading = false;
          notifyListeners();
        });
  }

  @override
  void dispose() {
    _moduleSubscription?.cancel();
    super.dispose();
  }

  /// Fetch single module detail
  Future<void> fetchModuleDetail(int id) async {
    _isLoading = true;
    notifyListeners();

    if (_isDemoMode) {
      // Instead of demo UI data, let's still try to fetch real data
    }

    try {
      final data = await _supabase
          .from('modules')
          .select()
          .eq('id', id)
          .single();

      _currentModule = Module.fromJson(data);
    } catch (e) {
      debugPrint('Error fetching module detail: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Get a signed URL for the module's file from Supabase Storage
  Future<String?> getFileUrl(String storagePath) async {
    // Strip redundant 'modules/' prefix if present
    final cleanPath = storagePath.startsWith('modules/')
        ? storagePath.replaceFirst('modules/', '')
        : storagePath;

    debugPrint(
        'DEBUG: Opening file from bucket "modules" with path: $cleanPath (Original: $storagePath)');

    if (_isDemoMode) {
      return _supabase.storage.from('modules').getPublicUrl(cleanPath);
    }
    try {
      // Karena bucket 'modules' sudah di-set menjadi Public di Supabase,
      // kita gunakan getPublicUrl. Endpoint ini secara otomatis memiliki
      // header CORS Access-Control-Allow-Origin: * yang diizinkan Chrome (Web).
      final url = _supabase.storage.from('modules').getPublicUrl(cleanPath);
      return url;
    } catch (e) {
      debugPrint('Error getting file URL: $e');
      return null;
    }
  }
}
