import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/module_provider.dart';
import 'module_detail_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    final moduleProv = Provider.of<ModuleProvider>(context, listen: false);
    Future.microtask(() => moduleProv.initModuleStream());
  }

  IconData _getIconForModule(String title) {
    final lowerTitle = title.toLowerCase();
    if (lowerTitle.contains('pengenalan') || lowerTitle.contains('intro')) {
      return Icons.info_outline;
    } else if (lowerTitle.contains('elektronik') || lowerTitle.contains('electronic')) {
      return Icons.electrical_services;
    } else if (lowerTitle.contains('office') || lowerTitle.contains('kantor')) {
      return Icons.edit;
    } else if (lowerTitle.contains('geo')) {
      return Icons.public;
    }
    return Icons.menu_book_rounded;
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final moduleProv = Provider.of<ModuleProvider>(context);
    final user = auth.user;
    
    // Warnabiru mirip Gambar 2
    const primaryBlue = Color(0xFF0284C7); 
    // Abu-abu gelap (Hampir Hitam)
    const bgColor = Color(0xFF1E1E1E); 

    return Scaffold(
      backgroundColor: bgColor,
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            // 1. Header Area (Latar Belakang Putih)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.only(
                  bottomLeft: Radius.circular(32),
                  bottomRight: Radius.circular(32),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Welcome,',
                        style: TextStyle(
                          fontSize: 16,
                          color: Colors.grey,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        user?.fullName ?? 'Hafizh Geo',
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: primaryBlue,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Icon(Icons.label_important, size: 16, color: Colors.grey[600]),
                          const SizedBox(width: 4),
                          Text(
                            'Role: ${user?.divisionName ?? 'Akuntansi'}',
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.grey[700],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  CircleAvatar(
                    radius: 28,
                    backgroundColor: primaryBlue.withValues(alpha: 0.1),
                    child: Text(
                      (user?.fullName ?? 'H')[0].toUpperCase(),
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: primaryBlue,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // 2. Isi Menu / Modules (GridView)
            Expanded(
              child: moduleProv.isLoading
                  ? const Center(child: CircularProgressIndicator(color: Colors.white))
                  : moduleProv.modules.isEmpty
                      ? const Center(
                          child: Text(
                            'Belum ada materi divisi',
                            style: TextStyle(color: Colors.grey),
                          ),
                        )
                      : GridView.builder(
                          padding: const EdgeInsets.all(20),
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            crossAxisSpacing: 16,
                            mainAxisSpacing: 16,
                            childAspectRatio: 0.85, 
                          ),
                          itemCount: moduleProv.modules.length,
                          itemBuilder: (context, index) {
                            final module = moduleProv.modules[index];
                            final icon = _getIconForModule(module.title);
                            return InkWell( // Tap behavior
                              onTap: () {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text('Membuka menu: ${module.title}'),
                                    duration: const Duration(seconds: 1),
                                  ),
                                );
                              },
                              borderRadius: BorderRadius.circular(20),
                              child: Container(
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(20),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withValues(alpha: 0.05),
                                      blurRadius: 10,
                                      offset: const Offset(0, 4),
                                    ),
                                  ],
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    // Circular Icon 
                                    Container(
                                      padding: const EdgeInsets.all(12),
                                      decoration: BoxDecoration(
                                        color: primaryBlue.withValues(alpha: 0.1),
                                        shape: BoxShape.circle,
                                      ),
                                      child: Icon(icon, color: primaryBlue, size: 28),
                                    ),
                                    const Spacer(),
                                    Text(
                                      module.title,
                                      style: const TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 16,
                                        color: Colors.black87,
                                        height: 1.2,
                                      ),
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    const SizedBox(height: 6),
                                    Text(
                                      module.description ?? 'Check our modules for ${module.title}...',
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: Colors.grey[600],
                                        height: 1.3,
                                      ),
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
            ),
          ],
        ),
      ),
    );
  }
}

