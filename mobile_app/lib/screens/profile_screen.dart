import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../providers/auth_provider.dart';
import '../providers/theme_provider.dart';
import 'change_password_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  Future<void> _pickAndUploadImage(BuildContext context, AuthProvider auth) async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 800,
      imageQuality: 80,
    );

    if (pickedFile != null) {
      final file = File(pickedFile.path);
      try {
        await auth.uploadAvatar(file);
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Foto profil berhasil diperbarui!')),
          );
        }
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Gagal mengunggah foto: $e')),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final user = auth.user;
    final themeProvider = Provider.of<ThemeProvider>(context);
    final isDark = themeProvider.isDarkMode;
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    final cardColor = theme.cardTheme.color ?? colorScheme.surface;
    final textColor = colorScheme.onSurface;
    final subtitleColor = isDark ? Colors.grey[400]! : Colors.grey[600]!;
    final borderColor = isDark ? Colors.grey[800]! : Colors.grey.shade200;
    final primaryColor = colorScheme.primary;
    final primaryLight = isDark ? primaryColor.withValues(alpha: 0.2) : primaryColor.withValues(alpha: 0.1);

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Pengaturan Akun',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: textColor,
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 32),

              // Profile Card
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
                decoration: BoxDecoration(
                  color: cardColor,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: borderColor),
                  boxShadow: isDark
                      ? []
                      : [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.02),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          )
                        ],
                ),
                child: Row(
                  children: [
                    GestureDetector(
                      onTap: () => _pickAndUploadImage(context, auth),
                      child: Stack(
                        alignment: Alignment.bottomRight,
                        children: [
                          Container(
                            width: 64,
                            height: 64,
                            decoration: BoxDecoration(
                              color: primaryLight,
                              shape: BoxShape.circle,
                            ),
                            clipBehavior: Clip.hardEdge,
                            child: auth.isLoading
                                ? const Center(child: CircularProgressIndicator())
                                : user?.avatarUrl != null
                                    ? CachedNetworkImage(
                                        imageUrl: user!.avatarUrl!,
                                        fit: BoxFit.cover,
                                        placeholder: (context, url) => const Center(child: CircularProgressIndicator()),
                                        errorWidget: (context, url, error) => Icon(Icons.person, color: primaryColor, size: 36),
                                      )
                                    : Icon(Icons.person, color: primaryColor, size: 36),
                          ),
                          Container(
                            padding: const EdgeInsets.all(4),
                            decoration: BoxDecoration(
                              color: primaryColor,
                              shape: BoxShape.circle,
                              border: Border.all(color: cardColor, width: 2),
                            ),
                            child: const Icon(Icons.camera_alt, color: Colors.white, size: 12),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 20),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            user?.fullName ?? 'Pegawai',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: textColor,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'NIP: ${user?.nip ?? '-'}',
                            style: TextStyle(
                              fontSize: 14,
                              color: subtitleColor,
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: Icon(Icons.edit, color: primaryColor, size: 24),
                      onPressed: () => _pickAndUploadImage(context, auth),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              // Keamanan
              Text(
                'Keamanan',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: subtitleColor,
                ),
              ),
              const SizedBox(height: 16),
              Container(
                decoration: BoxDecoration(
                  color: cardColor,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: borderColor),
                  boxShadow: isDark
                      ? []
                      : [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.02),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          )
                        ],
                ),
                child: Column(
                  children: [
                    _ActionTile(
                      icon: Icons.lock_outline,
                      title: 'Ubah Password',
                      textColor: textColor,
                      primaryColor: primaryColor,
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const ChangePasswordScreen(isForced: false),
                          ),
                        );
                      },
                    ),
                    Divider(height: 1, color: borderColor, indent: 64, endIndent: 20),
                    _ActionTile(
                      icon: Icons.security_outlined,
                      title: 'Pengaturan MFA',
                      textColor: textColor,
                      primaryColor: primaryColor,
                      onTap: () {},
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              // Preferensi
              Text(
                'Preferensi',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: subtitleColor,
                ),
              ),
              const SizedBox(height: 16),
              Container(
                decoration: BoxDecoration(
                  color: cardColor,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: borderColor),
                  boxShadow: isDark
                      ? []
                      : [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.02),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          )
                        ],
                ),
                child: Column(
                  children: [
                    _ToggleTile(
                      icon: Icons.notifications_none_outlined,
                      title: 'Notifikasi Pelatihan',
                      value: true,
                      textColor: textColor,
                      primaryColor: primaryColor,
                      onChanged: (val) {},
                    ),
                    Divider(height: 1, color: borderColor, indent: 64, endIndent: 20),
                    _ToggleTile(
                      icon: Icons.dark_mode_outlined,
                      title: 'Mode Tampilan',
                      value: isDark,
                      textColor: textColor,
                      primaryColor: primaryColor,
                      onChanged: (val) {
                        themeProvider.toggleTheme(val);
                      },
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 40),

              // Logout
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () async {
                    final confirmed = await showDialog<bool>(
                      context: context,
                      builder: (ctx) => AlertDialog(
                        title: const Text('Logout'),
                        content: const Text('Apakah Anda yakin ingin keluar?'),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.of(ctx).pop(false),
                            child: const Text('Batal'),
                          ),
                          TextButton(
                            onPressed: () => Navigator.of(ctx).pop(true),
                            child: const Text('Logout', style: TextStyle(color: Colors.red)),
                          ),
                        ],
                      ),
                    );
                    if (confirmed == true) {
                      await auth.logout();
                    }
                  },
                  icon: const Icon(Icons.logout_rounded, color: Colors.red, size: 24),
                  label: const Text(
                    'Logout',
                    style: TextStyle(
                      color: Colors.red,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 18),
                    side: BorderSide(color: Colors.red.shade100, width: 1.5),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(24),
                    ),
                    backgroundColor: isDark ? Colors.red.withValues(alpha: 0.1) : Colors.white,
                  ),
                ),
              ),
              const SizedBox(height: 100),
            ],
          ),
        ),
      ),
    );
  }
}

class _ActionTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final Color textColor;
  final Color primaryColor;
  final VoidCallback onTap;

  const _ActionTile({
    required this.icon,
    required this.title,
    required this.textColor,
    required this.primaryColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(24),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
        child: Row(
          children: [
            Icon(icon, color: primaryColor, size: 26),
            const SizedBox(width: 18),
            Expanded(
              child: Text(
                title,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: textColor,
                ),
              ),
            ),
            Icon(Icons.chevron_right, color: Colors.grey.shade400, size: 24),
          ],
        ),
      ),
    );
  }
}

class _ToggleTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final bool value;
  final Color textColor;
  final Color primaryColor;
  final ValueChanged<bool> onChanged;

  const _ToggleTile({
    required this.icon,
    required this.title,
    required this.value,
    required this.textColor,
    required this.primaryColor,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      child: Row(
        children: [
          Icon(icon, color: primaryColor, size: 26),
          const SizedBox(width: 18),
          Expanded(
            child: Text(
              title,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: textColor,
              ),
            ),
          ),
          Switch(
            value: value,
            onChanged: onChanged,
            activeColor: Colors.white,
            activeTrackColor: primaryColor,
            inactiveThumbColor: Colors.grey.shade400,
            inactiveTrackColor: Colors.grey.shade200,
          ),
        ],
      ),
    );
  }
}
