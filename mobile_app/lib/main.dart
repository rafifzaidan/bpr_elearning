import 'package:flutter/material.dart';
import 'package:flutter/gestures.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:google_fonts/google_fonts.dart';
import 'providers/auth_provider.dart';
import 'providers/module_provider.dart';
import 'providers/exam_provider.dart';
import 'providers/theme_provider.dart';
import 'screens/login_screen.dart';
import 'screens/change_password_screen.dart';
import 'screens/home_screen.dart';
import 'screens/exam_list_screen.dart';
import 'screens/result_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/splash_screen.dart';
import 'screens/otp_verification_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Supabase.initialize(
    url: 'https://tqskhwdcofsxomtjpctw.supabase.co',
    anonKey:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxc2tod2Rjb2ZzeG9tdGpwY3R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MjQxMzMsImV4cCI6MjA5MDEwMDEzM30.LoHfpqw88Zc5bng2IEfG8Ke7eIqBRw9C4novECkZnLk',
  );

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => ModuleProvider()),
        ChangeNotifierProvider(create: (_) => ExamProvider()),
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
      ],
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    final themeProvider = Provider.of<ThemeProvider>(context);

    // Kustomisasi font Poppins untuk Teks Utama dan Sekunder
    final baseTextTheme = GoogleFonts.poppinsTextTheme();
    final customTextThemeUI = baseTextTheme.copyWith(
      headlineLarge: baseTextTheme.headlineLarge?.copyWith(fontWeight: FontWeight.bold),
      headlineMedium: baseTextTheme.headlineMedium?.copyWith(fontWeight: FontWeight.bold),
      headlineSmall: baseTextTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
      titleLarge: baseTextTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
    );

    // Tema Terang (Light Mode) Global
    final lightTheme = ThemeData.light().copyWith(
      useMaterial3: true,
      scaffoldBackgroundColor: const Color(0xFFF8F9FA), // Putih Keabu-abuan
      colorScheme: const ColorScheme.light(
        primary: Color(0xFF00BFFF),
        onPrimary: Colors.white,
        surface: Colors.white,
        onSurface: Colors.black87,
      ),
      textTheme: customTextThemeUI.apply(bodyColor: Colors.black87, displayColor: Colors.black87),
      cardTheme: CardThemeData(
        color: Colors.white,
        elevation: 4,
        shadowColor: Colors.black.withValues(alpha: 0.1),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: Colors.white,
        selectedItemColor: Color(0xFF00BFFF),
        unselectedItemColor: Colors.grey,
        type: BottomNavigationBarType.fixed,
        elevation: 16,
      ),
    );

    // Tema Gelap (Dark Mode) Global
    final darkTheme = ThemeData.dark().copyWith(
      useMaterial3: true,
      scaffoldBackgroundColor: const Color(0xFF1A1D21), // Abu gelab khas Apple/Spotify
      colorScheme: const ColorScheme.dark(
        primary: Color(0xFF00BFFF),
        onPrimary: Colors.white,
        surface: Color(0xFF2C3136),
        onSurface: Colors.white,
      ),
      textTheme: customTextThemeUI.apply(bodyColor: Colors.white, displayColor: Colors.white),
      cardTheme: CardThemeData(
        color: const Color(0xFF2C3136),
        elevation: 4,
        shadowColor: Colors.black.withValues(alpha: 0.3),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: Color(0xFF1A1D21),
        selectedItemColor: Color(0xFF00BFFF),
        unselectedItemColor: Colors.white70,
        type: BottomNavigationBarType.fixed,
        elevation: 16,
      ),
    );

    return MaterialApp(
      scrollBehavior: const MaterialScrollBehavior().copyWith(
        dragDevices: {
          PointerDeviceKind.mouse,
          PointerDeviceKind.touch,
          PointerDeviceKind.stylus,
          PointerDeviceKind.unknown
        },
      ),
      title: 'BPR E-Learning',
      debugShowCheckedModeBanner: false,
      theme: lightTheme,
      darkTheme: darkTheme, // Tema Gelap sekarang terdefinisi sempurna
      themeMode: themeProvider.themeMode,
      home: const SplashScreen(),
    );
  }
}

class AuthWrapper extends StatefulWidget {
  const AuthWrapper({super.key});

  @override
  State<AuthWrapper> createState() => _AuthWrapperState();
}

class _AuthWrapperState extends State<AuthWrapper> {
  late Future<void> _authFuture;

  @override
  void initState() {
    super.initState();
    final auth = Provider.of<AuthProvider>(context, listen: false);
    _authFuture = auth.tryAutoLogin();
  }

  @override
  Widget build(BuildContext context) {
    const devBypassLogin = false;

    if (devBypassLogin) {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      if (!auth.isAuthenticated) {
        auth.useDemoMode();
      }
      return const MainShell();
    }

    return FutureBuilder(
      future: _authFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        if (snapshot.hasError) {
          return Scaffold(
            body: Center(
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.cloud_off, size: 64, color: Colors.red),
                    const SizedBox(height: 16),
                    Text(
                      'Gagal Terhubung ke Database',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '${snapshot.error}'.replaceAll('Exception: ', ''),
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: Colors.grey),
                    ),
                    const SizedBox(height: 24),
                    FilledButton(
                      onPressed: () {
                        setState(() {
                          _authFuture = Provider.of<AuthProvider>(context, listen: false).tryAutoLogin();
                        });
                      },
                      child: const Text('Coba Lagi'),
                    ),
                  ],
                ),
              ),
            ),
          );
        }

        return Consumer<AuthProvider>(
          builder: (context, auth, _) {
            if (auth.isOtpPending) {
              return const OtpVerificationScreen();
            }

            if (!auth.isAuthenticated) {
              return const LoginScreen();
            }

            if (auth.needsPasswordChange) {
              return const ChangePasswordScreen(isForced: true);
            }

            return const MainShell();
          },
        );
      },
    );
  }
}

/// Main app shell with bottom navigation
class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _currentIndex = 0;

  final List<Widget> _screens = const [
    HomeScreen(),
    ExamListScreen(),
    ResultScreen(),
    ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      extendBody: true, // Prevents body from being cut off by floating bar
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: Container(
        margin: const EdgeInsets.only(left: 16, right: 16, bottom: 24),
        decoration: BoxDecoration(
          color: theme.bottomNavigationBarTheme.backgroundColor ?? theme.cardColor,
          borderRadius: BorderRadius.circular(30),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.08),
              blurRadius: 15,
              offset: const Offset(0, 5),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(30),
          child: BottomNavigationBar(
            elevation: 0,
            backgroundColor: Colors.transparent,
            currentIndex: _currentIndex,
            onTap: (index) {
              setState(() => _currentIndex = index);
            },
            items: const [
              BottomNavigationBarItem(
                icon: Icon(Icons.home_filled),
                label: 'Dashboard',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.menu_book_rounded),
                label: 'Courses',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.history),
                label: 'Riwayat',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.settings),
                label: 'Settings',
              ),
            ],
          ),
        ),
      ),
    );
  }
}