import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../main.dart'; // To access AuthWrapper

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _controller = PageController();
  bool isLastPage = false;

  int _currentPageIndex = 0;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _finishOnboarding() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('onboarding_seen', true);

    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (context) => const AuthWrapper()),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Definisi data untuk setiap slide onboarding
    final List<Map<String, String>> onboardingData = [
      {
        'title': 'Pantau\nPerkembangan\ndengan Mudah',
        'image': 'assets/images/onboarding1.png',
        'icon': 'school', // Fallback
      },
      {
        'title': 'Materi\nPembelajaran\nInteraktif',
        'image': 'assets/images/onboarding2.png',
        'icon': 'menu_book', // Fallback
      },
      {
        'title': 'Ujian Kompetensi\nSecara Online\n& Real-time',
        'image': 'assets/images/onboarding3.png',
        'icon': 'quiz', // Fallback
      },
      {
        'title': 'Mulai Tingkatkan\nKapasitas Diri\nSekarang!',
        'image': 'assets/images/onboarding4.png',
        'icon': 'trending_up', // Fallback
      },
    ];

    IconData _getFallbackIcon(String iconName) {
      switch (iconName) {
        case 'school':
          return Icons.school;
        case 'menu_book':
          return Icons.menu_book_rounded;
        case 'quiz':
          return Icons.quiz_rounded;
        case 'trending_up':
          return Icons.trending_up_rounded;
        default:
          return Icons.insights;
      }
    }

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: PageView.builder(
                controller: _controller,
                onPageChanged: (index) {
                  setState(() {
                    _currentPageIndex = index;
                    isLastPage = index == onboardingData.length - 1;
                  });
                },
                itemCount: onboardingData.length,
                itemBuilder: (context, index) {
                  final data = onboardingData[index];
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 40.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Illustration
                        Center(
                          child: Container(
                            height: 250,
                            margin: const EdgeInsets.only(bottom: 40),
                            child: Image.asset(
                              data['image']!,
                              fit: BoxFit.contain,
                              errorBuilder: (context, error, stackTrace) =>
                                  Icon(
                                _getFallbackIcon(data['icon']!),
                                size: 150,
                                color: Theme.of(context).colorScheme.primary,
                              ),
                            ),
                          ),
                        ),
                        // Title
                        Text(
                          data['title']!,
                          style: const TextStyle(
                            fontSize: 32,
                            fontWeight: FontWeight.bold,
                            height: 1.2,
                            color: Color(0xFF1E293B),
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),

            // Bottom Navigation Area
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Skip Button
                  TextButton(
                    onPressed: _finishOnboarding,
                    style: TextButton.styleFrom(
                      foregroundColor: Colors.grey.shade600,
                    ),
                    child: const Text(
                      'Skip',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                    ),
                  ),

                  // Native Page Indicator
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: List.generate(
                      onboardingData.length,
                      (index) => AnimatedContainer(
                        duration: const Duration(milliseconds: 300),
                        margin: const EdgeInsets.symmetric(horizontal: 4.0),
                        height: 8.0,
                        width: _currentPageIndex == index ? 24.0 : 8.0,
                        decoration: BoxDecoration(
                          color: _currentPageIndex == index
                              ? Colors.black
                              : Colors.grey.shade300,
                          borderRadius: BorderRadius.circular(4.0),
                        ),
                      ),
                    ),
                  ),

                  // Next / Get Started Button
                  GestureDetector(
                    onTap: () {
                      if (isLastPage) {
                        _finishOnboarding();
                      } else {
                        _controller.nextPage(
                          duration: const Duration(milliseconds: 500),
                          curve: Curves.ease,
                        );
                      }
                    },
                    child: Container(
                      width: 56,
                      height: 56,
                      decoration: const BoxDecoration(
                        color: Colors.black,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.arrow_forward,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
